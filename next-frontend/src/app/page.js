import Image from "next/image";
export default function Home() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard Overview</h1>
      <div className="px-20"> {/* Add horizontal padding */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded shadow">
            <h2 className="font-bold">Edge device summary</h2>
            <div className="flex justify-between items-center">
              <p className="text-lg">Total Devices:</p>
              <p className="text-3xl">1,245</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-lg">Online Devices:</p>
              <p className="text-3xl">1,200</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-lg">Offline Devices:</p>
              <p className="text-3xl">45</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h2 className="font-bold">Application health summary</h2>
            <div className="flex justify-between items-center">
              <p className="text-lg">Active Applications:</p>
              <p className="text-3xl">825</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-lg">Down Applications:</p>
              <p className="text-3xl">5</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-lg">Maintenance:</p>
              <p className="text-3xl">2</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h2 className="font-bold">Alerts & notifications</h2>
            <div className="flex justify-between items-center">
              <p className="text-lg">Total Alerts:</p>
              <p className="text-3xl">10</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-lg">Critical Alerts:</p>
              <p className="text-3xl">3</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-lg">Resolved Alerts:</p>
              <p className="text-3xl">7</p>
            </div>
          </div>
        </div>
      </div>
      {/* Map Section */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Map</h2>
        {/* Flex container to split into two divs */}
        <div className="flex w-full gap-4 h-96"> {/* Use flex instead of grid */}
          <div className="bg-blue-200 p-4 rounded shadow" style={{ flex: '2 0 0%' }}> {/* Left div (2/3 width) */}
            <h3 className="font-bold">Map Section</h3>
          </div>
          <div className="bg-green-200 p-4 rounded shadow" style={{ flex: '1 0 0%' }}> {/* Right div (1/3 width) */}
            <h3 className="font-bold">Legend</h3>
            <div className="grid grid-cols-2 gap-2"> {/* Create a grid with 2 columns */}
              <div>
                <p>Blue:</p>
                <p>Green:</p>
                <p>Orange:</p>
                <p>Red:</p>
              </div>
              <div>
                <p>Selected cluster</p>
                <p>Online</p>
                <p>Errors</p>
                <p>Offline</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Activity Log Section */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Activity Log</h2>
        <div className="bg-gray-300 p-4 rounded shadow h-48"> {/* Height can be adjusted as needed */}
          {/* Placeholder content */}
          <p>No activity logs available at the moment.</p>
        </div>
      </div>
    </div>
  );
}
