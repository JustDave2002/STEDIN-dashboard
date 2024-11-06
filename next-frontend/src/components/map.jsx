"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import "leaflet/dist/leaflet.css";
import { stedinGeojson } from "@/data/stedinGeojson"; // Your GeoJSON data

// Sample data structure for province status
const provinceData = {
  "Noord-Beveland": {
    status: "online",
    devices: 5000,
    errors: 25,
    offline: 100,
  },
  // Add data for other provinces
};

/**
 * Get the color for a province based on its status
 * @param {string} status - The status of the province
 * @returns {string} - Color in CSS format
 */
const getProvinceColor = (status) => {
  switch (status) {
    case "selected":
      return "rgba(96, 165, 250, 0.5)"; // blue-400 with 50% opacity
    case "online":
      return "rgba(74, 222, 128, 0.5)"; // green-400 with 50% opacity
    case "error":
      return "rgba(251, 146, 60, 0.5)"; // orange-400 with 50% opacity
    case "offline":
      return "rgba(248, 113, 113, 0.5)"; // red-400 with 50% opacity
    default:
      return "rgba(229, 231, 235, 0.5)"; // gray-200 with 50% opacity
  }
};

export default function InteractiveMap() {
  const [selectedProvince, setSelectedProvince] = useState(null);

  useEffect(() => {
    // Ensure Leaflet map is properly reset
    const mapInstance = document.querySelector(".leaflet-container");
    if (mapInstance) mapInstance._leaflet_id = null;
  }, []);

  // Styling each feature on the map based on the province status
  const onEachFeature = (feature, layer) => {
    const provinceName = feature.properties.name;
    const provinceInfo = provinceData[provinceName] || { status: "offline" };

    layer.setStyle({
      fillColor: getProvinceColor(provinceInfo.status),
      fillOpacity: 0.5,
      color: "#FFFFFF",
      weight: 1,
    });

    layer.on({
      click: () => {
        setSelectedProvince(provinceName);
      },
      mouseover: (e) => {
        e.target.setStyle({
          fillOpacity: 0.7,
        });
      },
      mouseout: (e) => {
        e.target.setStyle({
          fillOpacity: 0.5,
        });
      },
    });
  };

  return (
    <div className="grid gap-6 md:grid-cols-4">
      <div className="col-span-3">
        <Card>
          <CardHeader>
            <CardTitle>Province Map</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-[4/3] border border-gray-200 rounded-lg overflow-hidden">
              <MapContainer
                center={[52.1326, 5.2913]}
                zoom={7}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <GeoJSON data={stedinGeojson} onEachFeature={onEachFeature} />
              </MapContainer>
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
                <div className="w-3 h-3 rounded-full bg-blue-400 opacity-70" />
                <span className="text-sm">Selected cluster</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-400 opacity-70" />
                <span className="text-sm">Online</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-400 opacity-70" />
                <span className="text-sm">Errors</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400 opacity-70" />
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
  );
}
