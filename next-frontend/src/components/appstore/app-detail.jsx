import { Button } from "@/components/ui/button"

export default function AppDetail({ app, onInstall }) {
    return (
        <div className="space-y-6 p-4 border rounded-lg">
            <div>
                <h2 className="text-2xl font-bold">{app.name}</h2>
                <p className="text-sm text-gray-500">ID: {app.id}</p>
            </div>
            <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p>{app.description}</p>
            </div>
            <div>
                <h3 className="text-lg font-semibold mb-2">Sensors</h3>
                {app.sensors && app.sensors.length > 0 ? (
                    <ul className="space-y-2">
                        {app.sensors.map((sensor) => (
                            <li key={sensor.id} className="border-b pb-2">
                                <p><strong>{sensor.name}</strong></p>
                                <p className="text-sm text-gray-600">ID: {sensor.id}</p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No sensors required for this application.</p>
                )}
            </div>
            <Button onClick={onInstall} className="w-full">Install Application</Button>
        </div>
    )
}

