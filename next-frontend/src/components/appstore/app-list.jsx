export default function AppList({ apps, onSelectApp }) {
    return (
        <ul className="space-y-2">
            {apps.map((app) => (
                <li
                    key={app.id}
                    className="p-3 hover:bg-gray-100 cursor-pointer rounded border"
                    onClick={() => onSelectApp(app)}
                >
                    <h3 className="font-semibold">{app.name}</h3>
                    <p className="text-sm text-gray-500">ID: {app.id}</p>
                </li>
            ))}
        </ul>
    )
}

