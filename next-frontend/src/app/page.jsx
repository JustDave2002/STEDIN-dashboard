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
import DynamicMap from "@/components/DynamicMap";

export default function Dashboard() {
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
                <span className="text-2xl font-bold">1,245</span>
              </div>
              <div className="flex items-center justify-between text-green-600">
                <div className="flex items-center gap-2">
                  <MonitorPlay className="w-4 h-4" />
                  <span className="text-sm">Online Devices:</span>
                </div>
                <span className="text-2xl font-bold">1,200</span>
              </div>
              <div className="flex items-center justify-between text-red-600">
                <div className="flex items-center gap-2">
                  <MonitorOff className="w-4 h-4" />
                  <span className="text-sm">Offline Devices:</span>
                </div>
                <span className="text-2xl font-bold">45</span>
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
                  <Circle className="w-4 h-4 fill-current" />
                  <span className="text-sm">Active Applications:</span>
                </div>
                <span className="text-2xl font-bold">825</span>
              </div>
              <div className="flex items-center justify-between text-red-600">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Down Applications:</span>
                </div>
                <span className="text-2xl font-bold">5</span>
              </div>
              <div className="flex items-center justify-between text-yellow-600">
                <div className="flex items-center gap-2">
                  <RefreshCcw className="w-4 h-4" />
                  <span className="text-sm">Maintenance:</span>
                </div>
                <span className="text-2xl font-bold">2</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts & Notifications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Alerts & notifications</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Alerts:</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">10</span>
                  <Badge>New</Badge>
                </div>
              </div>
              <div className="flex items-center justify-between text-red-600">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Critical Alerts:</span>
                </div>
                <span className="text-2xl font-bold">3</span>
              </div>
              <div className="flex items-center justify-between text-green-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm">Resolved Alerts:</span>
                </div>
                <span className="text-2xl font-bold">7</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <div className="p-6 col-span-3 bg-sky-50 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Map</h2>
          </div>
          <div className="aspect-[16/9] bg-sky-100 rounded-lg">
          <DynamicMap />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Legend</CardTitle>
            <CardDescription>Map indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm">Selected cluster</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm">Online</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-sm">Errors</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm">Offline</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>Recent system activities</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Activity className="w-4 h-4" />
            <AlertTitle>No Activity</AlertTitle>
            <AlertDescription>
              No activity logs available at the moment.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}