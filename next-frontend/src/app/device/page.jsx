"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, PlusCircle, ArrowUp, ArrowDown } from "lucide-react";
import DeviceTable from './device-table';
import { getDeviceData } from "@/app/api/mapData/route";  // Import the API function
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';

export default function DevicePage() {
  const [devices, setDevices] = useState([]);
  const [filteredDevices, setFilteredDevices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: [],
    applicatie: [],
    gemeente: []
  });
  const [selectedFilters, setSelectedFilters] = useState({
    status: [],
    applicatie: [],
    gemeente: []
  });

  // Fetch data from the API when the component mounts
  useEffect(() => {
    async function fetchDevices() {
      try {
        const data = await getDeviceData();
        setDevices(data);
        setFilteredDevices(data); // Initially, all devices are shown

        // Extract unique filter values
        const statusSet = new Set();
        const applicatieSet = new Set();
        const gemeenteSet = new Set();

        data.forEach(device => {
          statusSet.add(device.status);

          // Extract gemeente from tags of type 'location'
          const locationTag = device.tags.find(tag => tag.type === 'location');
          if (locationTag) {
            gemeenteSet.add(locationTag.name);
          }

          // Extract application names
          device.applications.forEach(app => {
            applicatieSet.add(app.name);
          });
        });

        setFilters({
          status: Array.from(statusSet),
          applicatie: Array.from(applicatieSet),
          gemeente: Array.from(gemeenteSet)
        });

      } catch (error) {
        console.error("Error fetching device data:", error);
      }
    }

    fetchDevices();
  }, []);

  // Filter devices whenever filters or search term change
  useEffect(() => {
    let filtered = devices;

    // Apply status filter
    if (selectedFilters.status.length > 0) {
      filtered = filtered.filter(device => selectedFilters.status.includes(device.status));
    }

    // Apply applicatie filter
    if (selectedFilters.applicatie.length > 0) {
      filtered = filtered.filter(device =>
          device.applications.some(app => selectedFilters.applicatie.includes(app.name))
      );
    }

    // Apply gemeente filter
    if (selectedFilters.gemeente.length > 0) {
      filtered = filtered.filter(device => {
        const locationTag = device.tags.find(tag => tag.type === 'location');
        return locationTag && selectedFilters.gemeente.includes(locationTag.name);
      });
    }

    // Apply search term
    if (searchTerm.trim() !== '') {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(device => {
        const deviceNameMatch = device.name.toLowerCase().includes(lowerSearchTerm);
        const statusMatch = device.status.toLowerCase().includes(lowerSearchTerm);
        const tagMatch = device.tags.some(tag => tag.name.toLowerCase().includes(lowerSearchTerm));
        const appMatch = device.applications.some(app => app.name.toLowerCase().includes(lowerSearchTerm));
        return deviceNameMatch || statusMatch || tagMatch || appMatch;
      });
    }

    setFilteredDevices(filtered);

  }, [devices, selectedFilters, searchTerm]);

  // Function to reset all filters and search term
  const resetFilters = () => {
    setSelectedFilters({
      status: [],
      applicatie: [],
      gemeente: []
    });
    setSearchTerm('');
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
                  onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium">Filter:</span>

            {/* Status Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[120px] justify-between">
                  {selectedFilters.status.length > 0 ? `Status (${selectedFilters.status.length})` : 'Status'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-4">
                <div className="flex flex-col space-y-2">
                  {filters.status.map((status, index) => (
                      <div key={index} className="flex items-center">
                        <Checkbox
                            checked={selectedFilters.status.includes(status)}
                            onCheckedChange={(checked) => {
                              setSelectedFilters((prev) => {
                                const newStatus = checked
                                    ? [...prev.status, status]
                                    : prev.status.filter((s) => s !== status);
                                return { ...prev, status: newStatus };
                              });
                            }}
                        />
                        <span className="ml-2">{status}</span>
                      </div>
                  ))}
                  <Button
                      variant="link"
                      onClick={() => setSelectedFilters((prev) => ({ ...prev, status: [] }))}
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
                  {selectedFilters.applicatie.length > 0 ? `Applicatie (${selectedFilters.applicatie.length})` : 'Applicatie'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-4">
                <div className="flex flex-col space-y-2">
                  {filters.applicatie.map((app, index) => (
                      <div key={index} className="flex items-center">
                        <Checkbox
                            checked={selectedFilters.applicatie.includes(app)}
                            onCheckedChange={(checked) => {
                              setSelectedFilters((prev) => {
                                const newApps = checked
                                    ? [...prev.applicatie, app]
                                    : prev.applicatie.filter((a) => a !== app);
                                return { ...prev, applicatie: newApps };
                              });
                            }}
                        />
                        <span className="ml-2">{app}</span>
                      </div>
                  ))}
                  <Button
                      variant="link"
                      onClick={() => setSelectedFilters((prev) => ({ ...prev, applicatie: [] }))}
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
                  {selectedFilters.gemeente.length > 0 ? `Gemeente (${selectedFilters.gemeente.length})` : 'Gemeente'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-4">
                <div className="flex flex-col space-y-2">
                  {filters.gemeente.map((gem, index) => (
                      <div key={index} className="flex items-center">
                        <Checkbox
                            checked={selectedFilters.gemeente.includes(gem)}
                            onCheckedChange={(checked) => {
                              setSelectedFilters((prev) => {
                                const newGemeente = checked
                                    ? [...prev.gemeente, gem]
                                    : prev.gemeente.filter((g) => g !== gem);
                                return { ...prev, gemeente: newGemeente };
                              });
                            }}
                        />
                        <span className="ml-2">{gem}</span>
                      </div>
                  ))}
                  <Button
                      variant="link"
                      onClick={() => setSelectedFilters((prev) => ({ ...prev, gemeente: [] }))}
                  >
                    Clear Gemeente
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Reset Filters Button */}
            <Button variant="secondary" onClick={resetFilters}>
              Reset Filters
            </Button>

            {/* Add Device Button */}
            <Link href="/create-device">
              <Button className="ml-4">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Device
              </Button>
            </Link>
          </div>
        </div>

        {/* Device Table */}
        <div>
          <DeviceTable devices={filteredDevices} />
        </div>
      </div>
  );
}
