import Link from 'next/link'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, PlusCircle } from "lucide-react"
import DeviceTable from './device-table'

export default function DevicePage() {
  return (
    <div>
      <div className="flex items-center justify-between p-4 bg-background border-b">
        <div className="flex-1 mr-4">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="search" placeholder="Search..." className="pl-8" />
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium">Filter:</span>
          <Select>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Regio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="north">North</SelectItem>
              <SelectItem value="south">South</SelectItem>
              <SelectItem value="east">East</SelectItem>
              <SelectItem value="west">West</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Applicatie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="app1">App 1</SelectItem>
              <SelectItem value="app2">App 2</SelectItem>
              <SelectItem value="app3">App 3</SelectItem>
            </SelectContent>
          </Select>
          <Link href="/create-device">
            <Button className="ml-4">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Device
            </Button>
          </Link>
        </div>
      </div>
      <div>
        <DeviceTable />
      </div>
    </div>
  );
}