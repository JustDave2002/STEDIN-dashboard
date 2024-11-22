"use client"

import { useState, useEffect, useCallback, useMemo } from "react";
import DynamicMap from "@/components/DynamicMap";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Search } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { getMapData } from "@/app/api/mapData/route";

export default function MapPage() {
  const [geoLevel, setGeoLevel] = useState(0);
  const [filters, setFilters] = useState({
    status: "all",
    regio: "all",
    applicatie: "all",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [mapData, setMapData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getMapData();
        setMapData(data);
        setFilteredData(data);
      } catch (error) {
        console.error("Error fetching map data:", error);
      }
    }
    fetchData();
  }, []);

  const regioOptions = useMemo(() => 
    Array.from(new Set(mapData.map(item => item.municipality))),
    [mapData]
  );

  const applicatieOptions = useMemo(() => 
    Array.from(new Set(mapData.map(item => item.applicatie))),
    [mapData]
  );

  const handleFilterChange = useCallback((filterType, value) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [filterType]: value
    }));
  }, []);

  const handleGeoLevelChange = useCallback((level) => {
    setGeoLevel(level);
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  useEffect(() => {
    const filtered = mapData.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.municipality.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filters.status === "all" || item.status.toLowerCase() === filters.status.toLowerCase();
      const matchesRegio = filters.regio === "all" || item.municipality.toLowerCase() === filters.regio.toLowerCase();
      const matchesApplicatie = filters.applicatie === "all" || item.applicatie === filters.applicatie;
      
      return matchesSearch && matchesStatus && matchesRegio && matchesApplicatie;
    });
    setFilteredData(filtered);
  }, [mapData, searchTerm, filters]);

  return (
    <div>
      <div className="flex items-center justify-between p-4 bg-background border-b">
        <div className="flex-1 mr-4">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Search..." 
              className="pl-8" 
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium">Filter:</span>
          <Select defaultValue="all" onValueChange={(value) => handleFilterChange("status", value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem key="all-status" value="all">All</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all" onValueChange={(value) => handleFilterChange("regio", value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Regio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem key="all-regio" value="all">All</SelectItem>
              {regioOptions.map(regio => (
                <SelectItem key={regio} value={regio}>{regio}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select defaultValue="all" onValueChange={(value) => handleFilterChange("applicatie", value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Applicatie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem key="all-applicatie" value="all">All</SelectItem>
              {/* 2 errors vanwege geen value temp solution: comment out*/}
              {/* {applicatieOptions.map(app => (
                <SelectItem key={app} value={app}>{app}</SelectItem>
              ))} */}
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
            <DynamicMap geoLevel={geoLevel} filters={filters} mapData={filteredData} />
          </div>
        </div>
      </div>
    </div>
  );
}