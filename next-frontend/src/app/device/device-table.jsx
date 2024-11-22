"use client"

import { useState, useRef, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { getDeviceData } from "@/app/api/mapData/route"  // Import the API function
import { formatDistanceToNow } from "date-fns"

export default function DeviceTable() {
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [devices, setDevices] = useState([])  // State to store API data
  const modalRef = useRef(null)

  // Fetch data from the API when the component mounts
  useEffect(() => {
    async function fetchDevices() {
      try {
        const data = await getDeviceData()
        setDevices(data)
      } catch (error) {
        console.error("Error fetching device data:", error)
      }
    }
    fetchDevices()
  }, [])

  const handleRowClick = (device) => {
    setSelectedDevice(device)
    setSelectedApplication(null)
  }

  const handleApplicationClick = (application) => {
    setSelectedApplication(application)
  }

  const handleCloseModal = () => {
    setSelectedDevice(null)
    setSelectedApplication(null)
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        handleCloseModal()
      }
    }

    if (selectedDevice || selectedApplication) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [selectedDevice, selectedApplication])

  return (
      <div className="relative">
        <Table>
          <TableCaption>List of Devices</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Applications</TableHead>
              <TableHead>Gemeente</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Last Contact</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devices.map((device) => (
                <TableRow key={device.id} onClick={() => handleRowClick(device)} className="cursor-pointer hover:bg-muted">
                  <TableCell className="font-medium">{device.name}</TableCell>
                  <TableCell>
                    {device.applications.map((app, index) => (
                        <Badge
                            key={index}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleApplicationClick({ ...app, parentDevice: device })
                            }}
                            className={`cursor-pointer bg-white border ${
                                app.status === "online" ? "border-green-500 text-green-500" :
                                    app.status === "offline" ? "border-red-500 text-red-500" :
                                        app.status === "warning" ? "border-yellow-500 text-yellow-500" :
                                            "border-gray-500 text-gray-500"
                            } px-2 py-1 mr-1`}
                        >
                          {app.name.length > 8 ? `${app.name.slice(0, 8)}...` : app.name}
                        </Badge>
                    ))}
                  </TableCell>
                  <TableCell>
                    {device.tags
                        .filter(tag => tag.type === "location")
                        .map((tag, index) => (
                            <Badge
                                key={index}
                                className="bg-white border border-blue-500 text-blue-500 px-2 py-1"
                            >
                              {tag.name}
                            </Badge>
                        ))}
                  </TableCell>
                  <TableCell>
                    {device.tags
                        .filter(tag => tag.type !== "location")
                        .map((tag, index) => (
                            <Badge
                                key={index}
                                className={`bg-white border ${
                                    tag.type === "team" ? "border-green-500 text-green-500" :
                                        tag.type === "custom" ? "border-purple-500 text-purple-500" :
                                            "border-gray-500 text-gray-500"
                                } px-2 py-1 mr-1`}
                            >
                              {tag.name}
                            </Badge>
                        ))}
                  </TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(device.last_contact), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <Badge
                        className={`${
                            device.status === "online" ? "bg-green-500 text-white" :
                                device.status === "offline" ? "bg-red-500 text-white" :
                                    device.status === "app_issue" ? "bg-yellow-500 text-black" :
                                        "bg-gray-500 text-white"
                        }`}
                    >
                      {device.status}
                    </Badge>
                  </TableCell>
                </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Device Details Modal */}
        {selectedDevice && !selectedApplication && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div ref={modalRef} className="bg-background p-6 rounded-lg shadow-lg w-3/4 h-3/4 overflow-auto">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">Device Details: {selectedDevice.name}</h2>
                  <Button variant="ghost" size="icon" onClick={handleCloseModal}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">General Information</h3>
                    <p><strong>Status:</strong> <span className={`badge ${
                        selectedDevice.status === "online" ? "bg-green-500 text-white" :
                            selectedDevice.status === "offline" ? "bg-red-500 text-white" :
                                "bg-gray-500 text-white"
                    }`}>{selectedDevice.status}</span></p>
                    <p><strong>Gemeente:</strong> {selectedDevice.tags.find(tag => tag.type === "location")?.name}</p>
                    <p><strong>Last Contact:</strong> {formatDistanceToNow(new Date(selectedDevice.last_contact), { addSuffix: true })}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Applications</h3>
                    {selectedDevice.applications.map((app, index) => (
                        <p
                            key={index}
                            className="cursor-pointer text-blue-500 underline"
                            onClick={() => handleApplicationClick({ ...app, parentDevice: selectedDevice })}
                        >
                          {app.name} - <span className={`badge ${
                            app.status === "online" ? "bg-green-500 text-white" :
                                app.status === "offline" ? "bg-red-500 text-white" :
                                    "bg-gray-500 text-white"
                        }`}>{app.status}</span>
                        </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
        )}

        {/* Application Details Modal */}
        {selectedApplication && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div ref={modalRef} className="bg-background p-6 rounded-lg shadow-lg w-3/4 h-3/4 overflow-auto">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">Application Details: {selectedApplication.name}</h2>
                  <Button variant="ghost" size="icon" onClick={handleCloseModal}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div>
                  <p><strong>Name:</strong> {selectedApplication.name}</p>
                  <p><strong>Description:</strong> {selectedApplication.description}</p>
                  <p><strong>Status:</strong> <span className={`badge ${
                      selectedApplication.status === "online" ? "bg-green-500 text-white" :
                          selectedApplication.status === "offline" ? "bg-red-500 text-white" :
                              "bg-gray-500 text-white"
                  }`}>{selectedApplication.status}</span></p>
                  <p><strong>Version:</strong> {selectedApplication.version}</p>
                  <p><strong>Path:</strong> {selectedApplication.path}</p>
                  <p><strong>Parent Device:</strong> {selectedApplication.parentDevice.name}</p>
                </div>
              </div>
            </div>
        )}
      </div>
  )
}
