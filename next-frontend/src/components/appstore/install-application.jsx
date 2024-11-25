import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Skeleton } from "@/components/ui/skeleton"

export default function InstallApplication({ app, onClose }) {
    const [step, setStep] = useState(1)
    const [eligibleDevices, setEligibleDevices] = useState([])
    const [selectedDevices, setSelectedDevices] = useState([])
    const [updatePreference, setUpdatePreference] = useState('automatic')
    const [envVariables, setEnvVariables] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isInstalling, setIsInstalling] = useState(false)

    useEffect(() => {
        const fetchEligibleDevices = async () => {
            try {
                const token = localStorage.getItem('token')
                const response = await fetch('http://localhost:8000/eligible-devices', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ application_id: app.id })
                })
                if (!response.ok) {
                    throw new Error('Failed to fetch eligible devices')
                }
                const data = await response.json()
                setEligibleDevices(data)
            } catch (error) {
                console.error('Error fetching eligible devices:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchEligibleDevices()
    }, [app.id])

    const handleDeviceToggle = (deviceId) => {
        setSelectedDevices(prev =>
            prev.includes(deviceId) ? prev.filter(id => id !== deviceId) : [...prev, deviceId]
        )
    }

    const renderStep1 = () => (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Select Devices</h3>
            {isLoading ? (
                <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-8 w-full" />
                    ))}
                </div>
            ) : (
                <div className="space-y-2">
                    {eligibleDevices.map(({ device, eligible, reason }) => (
                        <div key={device.id} className={`space-y-1 ${!eligible ? 'opacity-50' : ''}`}>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id={`device-${device.id}`}
                                    checked={selectedDevices.includes(device.id)}
                                    onCheckedChange={() => handleDeviceToggle(device.id)}
                                    disabled={!eligible}
                                />
                                <Label htmlFor={`device-${device.id}`} className="flex-grow">
                                    {device.name} - {device.municipality}
                                </Label>
                                <span className="text-sm text-gray-500">
                  {device.status === 'online' ? '🟢' : '🔴'}
                </span>
                            </div>
                            {!eligible && (
                                <p className="text-sm text-gray-500 ml-6">{reason}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )

    const renderStep2 = () => (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Application Settings</h3>
            <div className="space-y-2">
                <Label>Update Preference</Label>
                <RadioGroup value={updatePreference} onValueChange={setUpdatePreference}>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="automatic" id="automatic" />
                        <Label htmlFor="automatic">Automatic</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="manual" id="manual" />
                        <Label htmlFor="manual">Manual</Label>
                    </div>
                </RadioGroup>
            </div>
            <div className="space-y-2">
                <Label htmlFor="env-variables">Environment Variables (one per line)</Label>
                <Input
                    id="env-variables"
                    value={envVariables}
                    onChange={(e) => setEnvVariables(e.target.value)}
                    placeholder="KEY=VALUE"
                    className="font-mono"
                />
            </div>
        </div>
    )

    const renderStep3 = () => (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Installation Summary</h3>
            <div>
                <h4 className="font-medium">Application</h4>
                <p>{app.name} (ID: {app.id})</p>
            </div>
            <div>
                <h4 className="font-medium">Selected Devices</h4>
                <ul>
                    {selectedDevices.map(deviceId => {
                        const device = eligibleDevices.find(d => d.device.id === deviceId)?.device
                        return device ? (
                            <li key={deviceId}>{device.name} - {device.municipality}</li>
                        ) : null
                    })}
                </ul>
            </div>
            <div>
                <h4 className="font-medium">Update Preference</h4>
                <p>{updatePreference === 'automatic' ? 'Automatic' : 'Manual'}</p>
            </div>
            <div>
                <h4 className="font-medium">Environment Variables</h4>
                <pre className="bg-gray-100 p-2 rounded">{envVariables || 'None'}</pre>
            </div>
        </div>
    )

    const handleNext = () => {
        if (step < 3) setStep(step + 1)
    }

    const handleBack = () => {
        if (step > 1) setStep(step - 1)
    }

    const handleInstall = async () => {
        setIsInstalling(true)
        try {
            const token = localStorage.getItem('token')
            const response = await fetch('http://localhost:8000/add-applications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    application_id: app.id,
                    device_ids: selectedDevices
                })
            })
            if (!response.ok) {
                throw new Error('Failed to install application')
            }
            // Handle successful installation
            console.log('Application installed successfully')
            onClose()
        } catch (error) {
            console.error('Error installing application:', error)
            // Handle error (e.g., show error message to user)
        } finally {
            setIsInstalling(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Install {app.name}</h2>
                    <Button variant="ghost" onClick={onClose}>✕</Button>
                </div>
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
                <div className="flex justify-between mt-6">
                    {step > 1 && (
                        <Button variant="outline" onClick={handleBack}>
                            Back
                        </Button>
                    )}
                    {step < 3 ? (
                        <Button onClick={handleNext} disabled={step === 1 && selectedDevices.length === 0}>Next</Button>
                    ) : (
                        <Button onClick={handleInstall} disabled={isInstalling}>
                            {isInstalling ? 'Installing...' : 'Confirm Installation'}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}

