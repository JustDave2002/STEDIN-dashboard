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
import { getMapData } from "@/app/api/mapData/route"  // Import the API function

export default function DeviceTable() {
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [devices, setDevices] = useState([])  // State to store API data
  const modalRef = useRef(null)

  // Fetch data from the API when the component mounts
  useEffect(() => {
    async function fetchDevices() {
      try {
        const data = await getMapData()
        setDevices(data)
      } catch (error) {
        console.error("Error fetching device data:", error)
      }
    }
    fetchDevices()
  }, [])

  const handleRowClick = (device) => {
    setSelectedDevice(device)
  }

  const handleCloseModal = () => {
    setSelectedDevice(null)
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        handleCloseModal()
      }
    }

    if (selectedDevice) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [selectedDevice])

  return (
    <div className="relative">
      <Table>
        <TableCaption>List of Devices</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Device ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Gemeente</TableHead>
            <TableHead>Latitude</TableHead>
            <TableHead>Longitude</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {devices.map((device) => (
            <TableRow key={device.id} onClick={() => handleRowClick(device)} className="cursor-pointer hover:bg-muted">
              <TableCell className="font-medium">{device.id}</TableCell>
              <TableCell>{device.name}</TableCell>
              <TableCell>
                <Badge
                  className={
                    device.status === "online" ? "bg-green-500 text-white" :
                    device.status === "offline" ? "bg-red-500 text-white" :
                    device.status === "app_issue" ? "bg-yellow-500 text-black" :
                    device.status === "error" ? "bg-orange-500 text-white" :
                    "bg-gray-500 text-white" // Default color
                  }
                >
                  {device.status}
                </Badge>
              </TableCell>
              <TableCell>{device.municipality}</TableCell>
              <TableCell>{device.latitude}</TableCell>
              <TableCell>{device.longitude}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedDevice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div ref={modalRef} className="bg-background p-6 rounded-lg shadow-lg w-3/4 h-3/4 overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Device Details: {selectedDevice.id}</h2>
              <Button variant="ghost" size="icon" onClick={handleCloseModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">General Information</h3>
                <p><strong>Name:</strong> {selectedDevice.name}</p> {/* Added name */}
                <p><strong>Status:</strong> {selectedDevice.status}</p>
                <p><strong>Gemeente:</strong> {selectedDevice.municipality}</p>
                <p><strong>Latitude:</strong> {selectedDevice.latitude}</p>
                <p><strong>Longitude:</strong> {selectedDevice.longitude}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
