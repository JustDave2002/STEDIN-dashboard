"use client"

import { useState } from "react";
import DynamicMap from "@/components/DynamicMap";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function MapPage() {
  const [geoLevel, setGeoLevel] = useState(0);
  const [filters, setFilters] = useState({
    status: "",
    regio: "",
    applicatie: "",
  });

  const handleFilterChange = (filterType, value) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [filterType]: value
    }));
  };

  const handleGeoLevelChange = (level) => {
    setGeoLevel(level);
  };

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
          <Select onValueChange={(value) => handleFilterChange("status", value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Select onValueChange={(value) => handleFilterChange("regio", value)}>
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
          <Select onValueChange={(value) => handleFilterChange("applicatie", value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Applicatie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="app1">App 1</SelectItem>
              <SelectItem value="app2">App 2</SelectItem>
              <SelectItem value="app3">App 3</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="p-6 col-span-3 bg-sky-50 rounded-lg">
        <div className="bg-sky-100 rounded-lg">
          <div className="p-4 border-b">
            <div className="flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-muted-foreground">Detail level:</span>
                  <div className="flex space-x-2">
                    <Button
                      variant={geoLevel === 0 ? "default" : "outline"}
                      onClick={() => handleGeoLevelChange(0)}
                    >
                      High Level
                    </Button>
                    <Button
                      variant={geoLevel === 1 ? "default" : "outline"}
                      onClick={() => handleGeoLevelChange(1)}
                    >
                      Low Level
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="aspect-[9/4]">
            <DynamicMap geoLevel={geoLevel} filters={filters} />
          </div>
        </div>
      </div>
    </div>
  );
}