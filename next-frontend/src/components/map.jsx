"use client"

import { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import "leaflet/dist/leaflet.css";

// Import different GeoJSON data
import { stedinGeojson } from "@/data/stedinGeojson";
import { lowLevelGeojson } from "@/data/lowLevelGeojson";

const regionData = {
  "Noord-Beveland": {
    status: "online",
    devices: 3000,
    errors: 21,
    offline: 60,
  },
  "Middelburg": {
    status: "online",
    devices: 5000,
    errors: 25,
    offline: 100,
  },
  "Vlissingen": {
    status: "online",
    devices: 4000,
    errors: 20,
  },
  "Schouwen-Duiveland": {
    status: "online",
    devices: 1000,
    errors: 5,
    offline: 10,
  },
  "Veere": {
    status: "online",
    devices: 1000,
    errors: 5,
    offline: 10,
  },
  "Goes": {
    status: "online",
    devices: 1000,
    errors: 5,
    offline: 10,
  },
  "Borsele": {
    status: "online",
    devices: 1000,
    errors: 5,
    offline: 10,
  },
};

const getRegionColor = (status) => {
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

function MapContent({ geoLevel, style, onEachFeature }) {
  const map = useMap();
  const [currentGeoJson, setCurrentGeoJson] = useState(null);

  useEffect(() => {
    const geoData = geoLevel === 0 ? stedinGeojson : lowLevelGeojson;
    setCurrentGeoJson(geoData);
  }, [geoLevel]);

  useEffect(() => {
    if (currentGeoJson) {
      map.fitBounds(L.geoJSON(currentGeoJson).getBounds());
    }
  }, [currentGeoJson, map]);

  if (!currentGeoJson) return null;

  return (
    <GeoJSON key={geoLevel} data={currentGeoJson} style={style} onEachFeature={onEachFeature} />
  );
}

export default function InteractiveMap({ geoLevel = 0, filters }) {
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [geoJsonKey, setGeoJsonKey] = useState(0);

  useEffect(() => {
    // Clear selected regions when changing geoLevel
    setSelectedRegions([]);
    // Increment geoJsonKey to force re-render of GeoJSON
    setGeoJsonKey(prev => prev + 1);
  }, [geoLevel]);

  useEffect(() => {
    // Increment geoJsonKey to force re-render of GeoJSON when multi-select changes
    setGeoJsonKey(prev => prev + 1);
  }, [isMultiSelect]);

  const style = useCallback((feature) => {
    const regionName = feature.properties.name;
    const regionInfo = regionData[regionName] || { status: "offline" };
    const isSelected = selectedRegions.includes(regionName);

    return {
      fillColor: getRegionColor(isSelected ? "selected" : regionInfo.status),
      fillOpacity: 0.5,
      color: "#FFFFFF",
      weight: 1,
    };
  }, [selectedRegions]);

  const onEachFeature = useCallback((feature, layer) => {
    const regionName = feature.properties.name;

    layer.on({
      click: () => {
        if (isMultiSelect) {
          setSelectedRegions((prev) =>
            prev.includes(regionName)
              ? prev.filter((r) => r !== regionName)
              : [...prev, regionName]
          );
        } else {
          setSelectedRegions([regionName]);
        }
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
  }, [isMultiSelect]);

  return (
    <div className="grid gap-6 md:grid-cols-4">
      <div className="col-span-3">
        <Card>
          <CardHeader>
            <CardTitle>Map</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center space-x-2">
              <Switch
                id="multi-select"
                checked={isMultiSelect}
                onCheckedChange={(checked) => {
                  setIsMultiSelect(checked);
                  if (!checked) {
                    setSelectedRegions([]);
                  }
                }}
              />
              <Label htmlFor="multi-select">
                {isMultiSelect ? "Multi-select mode" : "Single-select mode"}
              </Label>
            </div>
            <div className="relative aspect-[5/3] border border-gray-200 rounded-lg overflow-hidden">
              <MapContainer
                center={[51.7, 4.4]}
                zoom={9}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={true}
                dragging={true}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <MapContent key={geoJsonKey} geoLevel={geoLevel} style={style} onEachFeature={onEachFeature} />
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

        <Card>
          <CardHeader>
            <CardTitle>Selected Region{selectedRegions.length > 1 && "s"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[500px] overflow-y-auto pr-2">
              {selectedRegions.length > 0 ? (
                selectedRegions.map((region) => (
                  regionData[region] && (
                    <div key={region} className="space-y-2 mb-4">
                      <p className="text-sm font-medium">{region}</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-muted-foreground">Devices:</span>
                        <span>{regionData[region].devices}</span>
                        <span className="text-muted-foreground">Errors:</span>
                        <span>{regionData[region].errors}</span>
                        <span className="text-muted-foreground">Offline:</span>
                        <span>{regionData[region].offline}</span>
                      </div>
                    </div>
                  )
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No region selected</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}