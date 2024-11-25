"use client"

import { useState, useEffect, useCallback, useMemo } from "react";
import DynamicMap from "@/components/DynamicMap";
import { Search, PlusCircle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { getMapData } from "@/app/api/mapData/route";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import debounce from "lodash.debounce";

export default function MapPage() {
  const [geoLevel, setGeoLevel] = useState(0);
  const [filters, setFilters] = useState({
    status: [],
    regio: [],
    applicatie: [],
  });
  const [selectedFilters, setSelectedFilters] = useState({
    status: [],
    regio: [],
    applicatie: [],
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [mapData, setMapData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const data = await getMapData();
        console.log("Fetched data:", data);
        setMapData(Array.isArray(data) ? data : []);
        setFilteredData(Array.isArray(data) ? data : []);

        // Extract unique filter values
        const statusSet = new Set();
        const regioSet = new Set();
        const applicatieSet = new Set();

        data.forEach((item) => {
          if (item.status) statusSet.add(item.status);
          if (item.municipality) regioSet.add(item.municipality);
          if (item.applicatie) applicatieSet.add(item.applicatie);
        });

        setFilters({
          status: Array.from(statusSet),
          regio: Array.from(regioSet),
          applicatie: Array.from(applicatieSet),
        });
      } catch (error) {
        console.error("Error fetching map data:", error);
        setMapData([]);
        setFilteredData([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleGeoLevelChange = useCallback((level) => {
    setGeoLevel(level);
  }, []);

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((value) => {
      setDebouncedSearchTerm(value);
    }, 300),
    []
  );

  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  }, [debouncedSearch]);

  useEffect(() => {
    const filtered = mapData.filter(item => {
      if (!item) return false;
      const matchesSearch = (item.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || false) ||
                            (item.municipality?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || false);
      const matchesStatus = selectedFilters.status.length === 0 || selectedFilters.status.includes(item.status);
      const matchesRegio = selectedFilters.regio.length === 0 || selectedFilters.regio.includes(item.municipality);
      const matchesApplicatie = selectedFilters.applicatie.length === 0 || selectedFilters.applicatie.includes(item.applicatie);
      
      return matchesSearch && matchesStatus && matchesRegio && matchesApplicatie;
    });
    setFilteredData(filtered);
  }, [mapData, debouncedSearchTerm, selectedFilters]);

  const resetFilters = () => {
    setSelectedFilters({
      status: [],
      regio: [],
      applicatie: [],
    });
    setSearchTerm("");
    setDebouncedSearchTerm("");
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

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
                  onClick={() =>
                    setSelectedFilters((prev) => ({ ...prev, status: [] }))
                  }
                >
                  Clear Status
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Regio Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[120px] justify-between">
                {selectedFilters.regio.length > 0
                  ? `Regio (${selectedFilters.regio.length})`
                  : "Regio"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-4">
              <div className="flex flex-col space-y-2 max-h-[200px] overflow-y-auto">
                {filters.regio.map((regio, index) => (
                  <div key={index} className="flex items-center">
                    <Checkbox
                      checked={selectedFilters.regio.includes(regio)}
                      onCheckedChange={(checked) => {
                        setSelectedFilters((prev) => {
                          const newRegio = checked
                            ? [...prev.regio, regio]
                            : prev.regio.filter((r) => r !== regio);
                          return { ...prev, regio: newRegio };
                        });
                      }}
                    />
                    <span className="ml-2">{regio}</span>
                  </div>
                ))}
              </div>
              <Button
                variant="link"
                onClick={() =>
                  setSelectedFilters((prev) => ({ ...prev, regio: [] }))
                }
              >
                Clear Regio
              </Button>
            </PopoverContent>
          </Popover>

          {/* Applicatie Filter
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[120px] justify-between">
                {selectedFilters.applicatie.length > 0
                  ? `App (${selectedFilters.applicatie.length})`
                  : "App"}
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
                  onClick={() =>
                    setSelectedFilters((prev) => ({ ...prev, applicatie: [] }))
                  }
                >
                  Clear App
                </Button>
              </div>
            </PopoverContent>
          </Popover> */}

          {/* Reset Filters */}
          <Button variant="link" onClick={resetFilters}>
            Reset Filters
          </Button>
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
            <DynamicMap geoLevel={geoLevel} filters={selectedFilters} mapData={filteredData} />
          </div>
        </div>
      </div>
    </div>
  );
}