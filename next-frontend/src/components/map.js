"use client"

import { useState } from 'react'
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from "react-simple-maps"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Netherlands GeoJSON
const NETHERLANDS_TOPO_JSON = {
  "type": "Topology",
  "objects": {
    "provinces": {
      "type": "GeometryCollection",
      "geometries": [
        // This is a simplified version for demonstration
        // You would need the full GeoJSON data for all provinces
        {
          "type": "Polygon",
          "properties": { "name": "Noord-Beveland" },
          "coordinates": [/* coordinates would go here */]
        }
      ]
    }
  }
}

// Sample data structure for province status
const provinceData = {
  "Noord-Beveland": {
    status: "online",
    devices: 5000,
    errors: 25,
    offline: 100
  },
  // Add data for other provinces
}

/**
 * Get the color for a province based on its status
 * @param {('selected'|'online'|'error'|'offline')} status
 * @returns {string} The color for the province
 */
const getProvinceColor = (status) => {
  switch (status) {
    case "selected":
      return "#60A5FA" // blue-400
    case "online":
      return "#4ADE80" // green-400
    case "error":
      return "#FB923C" // orange-400
    case "offline":
      return "#F87171" // red-400
    default:
      return "#E5E7EB" // gray-200
  }
}

export default function InteractiveMap() {
  const [selectedProvince, setSelectedProvince] = useState(null)
  const [tooltipContent, setTooltipContent] = useState("")

  return (
    <div className="grid gap-6 md:grid-cols-4">
      <div className="col-span-3">
        <Card>
          <CardHeader>
            <CardTitle>Province Map</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-[4/3]">
              <ComposableMap
                projection="geoMercator"
                projectionConfig={{
                  center: [5.2913, 52.1326], // Netherlands center
                  scale: 12000
                }}
              >
                <ZoomableGroup>
                  <Geographies geography={NETHERLANDS_TOPO_JSON}>
                    {({ geographies }) =>
                      geographies.map((geo) => {
                        const provinceName = geo.properties.name
                        const provinceInfo = provinceData[provinceName]
                        const isSelected = selectedProvince === provinceName

                        return (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            fill={getProvinceColor(isSelected ? "selected" : provinceInfo?.status || "offline")}
                            stroke="#FFFFFF"
                            strokeWidth={0.5}
                            style={{
                              default: {
                                outline: "none"
                              },
                              hover: {
                                fill: "#93C5FD",
                                outline: "none",
                                cursor: "pointer"
                              },
                              pressed: {
                                outline: "none"
                              }
                            }}
                            onMouseEnter={() => {
                              setTooltipContent(provinceName)
                            }}
                            onMouseLeave={() => {
                              setTooltipContent("")
                            }}
                            onClick={() => {
                              setSelectedProvince(provinceName)
                            }}
                          />
                        )
                      })
                    }
                  </Geographies>
                </ZoomableGroup>
              </ComposableMap>
              {tooltipContent && (
                <div className="absolute top-0 right-0 bg-white px-2 py-1 rounded shadow text-sm">
                  {tooltipContent}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-400" />
                <span className="text-sm">Selected cluster</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="text-sm">Online</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-400" />
                <span className="text-sm">Errors</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <span className="text-sm">Offline</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedProvince && provinceData[selectedProvince] && (
          <Card>
            <CardHeader>
              <CardTitle>Selected Province</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm font-medium">{selectedProvince}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Devices:</span>
                  <span>{provinceData[selectedProvince].devices}</span>
                  <span className="text-muted-foreground">Errors:</span>
                  <span>{provinceData[selectedProvince].errors}</span>
                  <span className="text-muted-foreground">Offline:</span>
                  <span>{provinceData[selectedProvince].offline}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}