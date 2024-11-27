"use client"

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Circle,
  Laptop,
  LayoutGrid,
  MonitorOff,
  MonitorPlay,
  RefreshCcw,
} from "lucide-react"
import { getMapData, getDeviceData } from '@/app/api/mapData/route'
import DynamicMap from "@/components/DynamicMap"

export default function Dashboard() {
  const [mapData, setMapData] = useState([])
  const [deviceData, setDeviceData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        const [mapResponse, deviceResponse] = await Promise.all([
          getMapData(),
          getDeviceData()
        ])
        setMapData(mapResponse || [])
        setDeviceData(deviceResponse || [])
      } catch (error) {
        console.error("Error fetching data:", error)
        setError(error.message)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  // Calculate summary statistics
  const totalDevices = deviceData.length
  const onlineDevices = deviceData.filter(device =>[ 'app_issue', 'online'].includes(device.status)).length;
  const erroredDevices = deviceData.filter(device => ['error'].includes(device.status)).length;
  const offlineDevices = deviceData.filter(device => ['offline'].includes(device.status)).length;

  const applications = deviceData.flatMap(device => device.applications || []);
  const activeApps = applications.filter(app => app.status === 'online').length;
  const erroredApps = applications.filter(app => ['error'].includes(app.status)).length;
  const downApps = applications.filter(app => ['offline'].includes(app.status)).length;
  const maintenanceApps = applications.filter(app => app.status === 'maintenance').length;

  const alerts = deviceData.flatMap(device => device.alerts || [])
  const totalAlerts = alerts.length
  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical').length
  const resolvedAlerts = alerts.filter(alert => alert.status === 'resolved').length

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
      
      <div className="grid gap-6 md:grid-cols-3">
        {/* Edge Device Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Edge device summary</CardTitle>
            <Laptop className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Devices:</span>
                <span className="text-2xl font-bold">{totalDevices}</span>
              </div>
              <div className="flex items-center justify-between text-green-600">
                <div className="flex items-center gap-2">
                  <MonitorPlay className="w-4 h-4" />
                  <span className="text-sm">Online Devices:</span>
                </div>
                <span className="text-2xl font-bold">{onlineDevices}</span>
              </div>
              <div className="flex items-center justify-between text-red-600">
                <div className="flex items-center gap-2">
                  <MonitorOff className="w-4 h-4" />
                  <span className="text-sm">Errored Devices:</span>
                </div>
                <span className="text-2xl font-bold">{erroredDevices}</span>
              </div>
              <div className="flex items-center justify-between text-grey-600">
                <div className="flex items-center gap-2">
                  <MonitorOff className="w-4 h-4" />
                  <span className="text-sm">Offline Devices:</span>
                </div>
                <span className="text-2xl font-bold">{offlineDevices}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Application Health Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Application health summary</CardTitle>
            <LayoutGrid className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-green-600">
                <div className="flex items-center gap-2">
                  <Circle className="w-4 h-4 fill-current"/>
                  <span className="text-sm">Active Applications:</span>
                </div>
                <span className="text-2xl font-bold">{activeApps}</span>
              </div>
              <div className="flex items-center justify-between text-red-600">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4"/>
                  <span className="text-sm">Errored Applications:</span>
                </div>
                <span className="text-2xl font-bold">{erroredApps}</span>
              </div>
              <div className="flex items-center justify-between text-gray-600">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4"/>
                  <span className="text-sm">Down Applications:</span>
                </div>
                <span className="text-2xl font-bold">{downApps}</span>
              </div>
              <div className="flex items-center justify-between text-yellow-600">
                <div className="flex items-center gap-2">
                  <RefreshCcw className="w-4 h-4"/>
                  <span className="text-sm">Maintenance:</span>
                </div>
                <span className="text-2xl font-bold">{maintenanceApps}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts & Notifications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Alerts & notifications</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Alerts:</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{totalAlerts}</span>
                  {totalAlerts > 0 && <Badge>New</Badge>}
                </div>
              </div>
              <div className="flex items-center justify-between text-red-600">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Critical Alerts:</span>
                </div>
                <span className="text-2xl font-bold">{criticalAlerts}</span>
              </div>
              <div className="flex items-center justify-between text-green-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm">Resolved Alerts:</span>
                </div>
                <span className="text-2xl font-bold">{resolvedAlerts}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="p-6 col-span-3 bg-sky-50 rounded-lg">
        <div className="aspect-[9/4] bg-sky-100 rounded-lg">
          <DynamicMap geoLevel={0} filters={{}} mapData={mapData}/>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>Recent system activities</CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length > 0 ? (
            <ul className="space-y-2">
              {alerts.slice(0, 5).map((alert, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  <span>{alert.message}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Alert>
              <Activity className="w-4 h-4" />
              <AlertTitle>No Activity</AlertTitle>
              <AlertDescription>
                No activity logs available at the moment.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}