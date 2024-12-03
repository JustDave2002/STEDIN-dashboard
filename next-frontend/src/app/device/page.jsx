"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import debounce from "lodash.debounce";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, PlusCircle, X } from 'lucide-react';
import DeviceTable from "./device-table";
import { getDeviceData } from "@/app/api/mapData/route";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

export default function DevicePage() {
  const [allDevices, setAllDevices] = useState([]);
  const [filteredDevices, setFilteredDevices] = useState([]);
  const [isViewingFilteredResults, setIsViewingFilteredResults] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: [],
    applicatie: [],
    gemeente: [],
  });
  const [selectedFilters, setSelectedFilters] = useState({
    status: [],
    applicatie: [],
    gemeente: [],
  });

  // Debounce the search term update
  const updateDebouncedSearch = useCallback(
    debounce((term) => setDebouncedSearchTerm(term), 300),
    []
  );

  // Handle search term change with debounce
  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    updateDebouncedSearch(term);
  };

  // Fetch data from the API when the component mounts
  useEffect(() => {
    async function fetchDevices() {
      try {
        const data = await getDeviceData();
        setAllDevices(data);
        
        const selectedDevicesJson = localStorage.getItem('selectedDevices');
        const selectedRegionsJson = localStorage.getItem('selectedRegions');
        
        if (selectedDevicesJson) {
          const selectedDevices = JSON.parse(selectedDevicesJson);
          const filteredData = data.filter((device) => selectedDevices.includes(device.name));
          setFilteredDevices(filteredData); // Initially, filtered data selected from map is shown
          setIsViewingFilteredResults(true); // Boolean for if the devices is selected from the map
        } else if (selectedRegionsJson) {
          const selectedRegions = JSON.parse(selectedRegionsJson);
          setSelectedFilters(prev => ({...prev, gemeente: selectedRegions}));
          setFilteredDevices(data); // Initially, all devices are shown
          setIsViewingFilteredResults(false);
        } else {
          setFilteredDevices(data); // Initially, all devices are shown
          setIsViewingFilteredResults(false);
        }

        const statusSet = new Set();
        const applicatieSet = new Set();
        const gemeenteSet = new Set();

        data.forEach((device) => {
          statusSet.add(device.status);

          const locationTag = device.tags.find((tag) => tag.type === "location");
          if (locationTag) {
            gemeenteSet.add(locationTag.name);
          }

          device.applications.forEach((app) => {
            applicatieSet.add(app.name);
          });
        });

        setFilters({
          status: Array.from(statusSet),
          applicatie: Array.from(applicatieSet),
          gemeente: Array.from(gemeenteSet),
        });
      } catch (error) {
        console.error("Error fetching device data:", error);
      }
    }

    fetchDevices();
  }, []);

  const applyFilters = useCallback((devices, filters, searchTerm) => {
    return devices.filter((device) => {
      const statusMatch = filters.status.length === 0 || filters.status.includes(device.status);
      const applicatieMatch = filters.applicatie.length === 0 || device.applications.some((app) => filters.applicatie.includes(app.name));
      const gemeenteMatch = filters.gemeente.length === 0 || device.tags.some((tag) => tag.type === "location" && filters.gemeente.includes(tag.name));
      
      const searchMatch = searchTerm === "" || 
        device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.applications.some((app) => app.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        device.tags.some((tag) => tag.name.toLowerCase().includes(searchTerm.toLowerCase()));

      return statusMatch && applicatieMatch && gemeenteMatch && searchMatch;
    });
  }, []);

  const displayedDevices = useMemo(() => {
    const devicesToFilter = isViewingFilteredResults ? filteredDevices : allDevices;
    return applyFilters(devicesToFilter, selectedFilters, debouncedSearchTerm);
  }, [selectedFilters, debouncedSearchTerm, isViewingFilteredResults, allDevices, filteredDevices, applyFilters]);

  // Function to reset all filters and search term
  const resetFilters = () => {
    setSelectedFilters({
      status: [],
      applicatie: [],
      gemeente: [],
    });
    setSearchTerm("");
    setDebouncedSearchTerm(""); // Reset debounced term
    
    // If it has devices selected from map, reset to the filtered devices as base.
    if (isViewingFilteredResults) {
      const selectedDevicesJson = localStorage.getItem('selectedDevices');
      if (selectedDevicesJson) {
        const selectedDevices = JSON.parse(selectedDevicesJson);
        const filteredData = allDevices.filter(device => selectedDevices.includes(device.name));
        setFilteredDevices(filteredData);
      }
    } else {
      setFilteredDevices(allDevices);
    }
  };

  // clears the filter from selected devices from the map.
  const clearFilteredResults = () => {
    localStorage.removeItem('selectedDevices');
    localStorage.removeItem('selectedRegions');
    setIsViewingFilteredResults(false);
    setFilteredDevices(allDevices);
    setSelectedFilters({
      status: [],
      applicatie: [],
      gemeente: [],
    });
  };

  {/* Search Input */}
  const handleFilterChange = (filterType, value, checked) => {
    setSelectedFilters((prev) => {
      const newFilters = {
        ...prev,
        [filterType]: checked
          ? [...prev[filterType], value]
          : prev[filterType].filter((item) => item !== value),
      };
      return newFilters;
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between p-4 bg-background border-b">
        {/* Search Input */}
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

        {/* Clear Map Filter */}
        <div className="flex items-center space-x-4">
          {isViewingFilteredResults && (
            <Button variant="outline" onClick={clearFilteredResults}>
              <X className="mr-2 h-4 w-4" />
              Clear Map Filter
            </Button>
          )}

          {/* Filters */}
          <span className="text-sm font-medium">Filter:</span>

          {/* Status Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[120px] justify-between">
                {selectedFilters.status.length > 0
                  ? `Status (${selectedFilters.status.length})`
                  : "Status"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-4">
              <div className="flex flex-col space-y-2">
                {filters.status.map((status, index) => (
                  <div key={index} className="flex items-center">
                    <Checkbox
                      checked={selectedFilters.status.includes(status)}
                      onCheckedChange={(checked) => handleFilterChange('status', status, checked)}
                    />
                    <span className="ml-2">{status}</span>
                  </div>
                ))}
                <Button
                  variant="link"
                  onClick={() => setSelectedFilters(prev => ({...prev, status: []}))}
                >
                  Clear Status
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Applicatie Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[120px] justify-between">
                {selectedFilters.applicatie.length > 0
                  ? `Applicatie (${selectedFilters.applicatie.length})`
                  : "Applicatie"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-4">
              <div className="flex flex-col space-y-2">
                {filters.applicatie.map((app, index) => (
                  <div key={index} className="flex items-center">
                    <Checkbox
                      checked={selectedFilters.applicatie.includes(app)}
                      onCheckedChange={(checked) => handleFilterChange('applicatie', app, checked)}
                    />
                    <span className="ml-2">{app}</span>
                  </div>
                ))}
                <Button
                  variant="link"
                  onClick={() => setSelectedFilters(prev => ({...prev, applicatie: []}))}
                >
                  Clear Applicatie
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Gemeente Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[120px] justify-between">
                {selectedFilters.gemeente.length > 0
                  ? `Gemeente (${selectedFilters.gemeente.length})`
                  : "Gemeente"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-4">
              <div className="flex flex-col space-y-2 max-h-[200px] overflow-y-auto">
                {filters.gemeente.map((gem, index) => (
                  <div key={index} className="flex items-center">
                    <Checkbox
                      checked={selectedFilters.gemeente.includes(gem)}
                      onCheckedChange={(checked) => handleFilterChange('gemeente', gem, checked)}
                    />
                    <span className="ml-2">{gem}</span>
                  </div>
                ))}
              </div>
              <Button
                variant="link"
                onClick={() => setSelectedFilters(prev => ({...prev, gemeente: []}))}
              >
                Clear Gemeente
              </Button>
            </PopoverContent>
          </Popover>

          {/* Reset Filters */}
          <Button variant="link" onClick={resetFilters}>
            Reset Filters
          </Button>
        </div>

        {/* Add Device Button */}
        <Link href="/devices/new">
          <Button className="ml-4">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Device
          </Button>
        </Link>
      </div>

      {/* Device Table */}
      <DeviceTable devices={displayedDevices} />
    </div>
  );
}