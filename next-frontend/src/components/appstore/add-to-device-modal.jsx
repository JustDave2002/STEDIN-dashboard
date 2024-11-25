import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export default function AddToDeviceModal({ isOpen, onClose, app }) {
    if (!app) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add {app.name} to Device</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <p>You are about to add <strong>{app.name}</strong> (version {app.version}) to your device.</p>
                    <p className="mt-2">This will install the following sensors on your device:</p>
                    <ul className="list-disc list-inside mt-2">
                        {app.sensors.map((sensor, index) => (
                            <li key={index}><strong>{sensor.name}</strong>: {sensor.description}</li>
                        ))}
                    </ul>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={() => {
                        // Here you would typically handle the actual installation
                        console.log(`Installing ${app.name} on device`);
                        onClose();
                    }}>Confirm Installation</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}