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

// Sample data (remove this when connecting to a real database)
const devices = [
  {
    id: "DEV001",
    status: "Active",
    clusterRegio: "North",
    applications: ["App1", "App2"],
    cpu: 45,
    memory: 60,
    lastCommunication: "2023-05-15T14:30:00Z",
    ipAddress: "192.168.1.100",
    macAddress: "00:1B:44:11:3A:B7",
    manufacturer: "Cisco",
    model: "ISR4321",
    serialNumber: "FTX1234567A",
  },
  {
    id: "DEV002",
    status: "Inactive",
    clusterRegio: "South",
    applications: ["App3"],
    cpu: 0,
    memory: 5,
    lastCommunication: "2023-05-14T09:15:00Z",
    ipAddress: "192.168.1.101",
    macAddress: "00:1B:44:11:3A:B8",
    manufacturer: "Juniper",
    model: "SRX300",
    serialNumber: "AD3574290",
  },
  {
    id: "DEV003",
    status: "Active",
    clusterRegio: "East",
    applications: ["App1", "App4", "App5"],
    cpu: 75,
    memory: 80,
    lastCommunication: "2023-05-15T15:45:00Z",
    ipAddress: "192.168.1.102",
    macAddress: "00:1B:44:11:3A:B9",
    manufacturer: "Arista",
    model: "7050CX3-32S",
    serialNumber: "JPE17384950",
  },
]

export default function DeviceTable() {
  const [selectedDevice, setSelectedDevice] = useState(null)
  const modalRef = useRef(null)

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
            <TableHead>Status</TableHead>
            <TableHead>Cluster/Regio</TableHead>
            <TableHead>Applications</TableHead>
            <TableHead>CPU %</TableHead>
            <TableHead>Memory %</TableHead>
            <TableHead>Last Communication</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {devices.map((device) => (
            <TableRow key={device.id} onClick={() => handleRowClick(device)} className="cursor-pointer hover:bg-muted">
              <TableCell className="font-medium">{device.id}</TableCell>
              <TableCell>
                <Badge variant={device.status === "Active" ? "success" : "secondary"}>
                  {device.status}
                </Badge>
              </TableCell>
              <TableCell>{device.clusterRegio}</TableCell>
              <TableCell>{device.applications.join(", ")}</TableCell>
              <TableCell>{device.cpu}%</TableCell>
              <TableCell>{device.memory}%</TableCell>
              <TableCell>{new Date(device.lastCommunication).toLocaleString()}</TableCell>
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
                <p><strong>Status:</strong> {selectedDevice.status}</p>
                <p><strong>Cluster/Regio:</strong> {selectedDevice.clusterRegio}</p>
                <p><strong>Applications:</strong> {selectedDevice.applications.join(", ")}</p>
                <p><strong>CPU Usage:</strong> {selectedDevice.cpu}%</p>
                <p><strong>Memory Usage:</strong> {selectedDevice.memory}%</p>
                <p><strong>Last Communication:</strong> {new Date(selectedDevice.lastCommunication).toLocaleString()}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Technical Details</h3>
                <p><strong>IP Address:</strong> {selectedDevice.ipAddress}</p>
                <p><strong>MAC Address:</strong> {selectedDevice.macAddress}</p>
                <p><strong>Manufacturer:</strong> {selectedDevice.manufacturer}</p>
                <p><strong>Model:</strong> {selectedDevice.model}</p>
                <p><strong>Serial Number:</strong> {selectedDevice.serialNumber}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}