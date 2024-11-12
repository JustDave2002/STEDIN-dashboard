"use client"

import { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from "react-leaflet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import L from 'leaflet';
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";

// Import different GeoJSON data
import { stedinGeojson } from "@/data/stedinGeojson";
import { lowLevelGeojson } from "@/data/lowLevelGeojson";

// Create custom icons for markers
const createCustomIcon = (imageName) => L.icon({
  iconUrl: `/images/${imageName}`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

const OnlineIcon = createCustomIcon('green_marker.png');
const SelectedIcon = createCustomIcon('blue_marker.png');
const OfflineIcon = createCustomIcon('red_marker.png');

L.Marker.prototype.options.icon = OnlineIcon;

const regionData = {
  "Middelburg": {
    devices: 4,
    online: 4,
    errors: 0,
    offline: 0,
  },
  "Vlissingen": {
    devices: 2,
    online: 1,
    errors: 0,
    offline: 1,
  },
  "Goes": {
    devices: 3,
    online: 3,
    errors: 0,
    offline: 0,
  },
  "Noord-Beveland": {
    devices: 1,
    online: 1,
    errors: 0,
    offline: 0,
  },
  "Veere": {
    devices: 1,
    online: 1,
    errors: 0,
    offline: 0,
  },
  "Borsele": {
    devices: 1,
    online: 1,
    errors: 0,
    offline: 0,
  },
};

const getRegionColor = (regionData) => {
  if (!regionData) return "rgba(155, 155, 155, 0.5)"; // default color
  
  const { devices, errors, offline } = regionData;
  const total = devices + errors + offline;

  if (offline === total) return "rgba(248, 113, 113, 0.5)"; // all offline
  if (errors > 0) return "rgba(251, 146, 60, 0.5)"; // has errors
  if (offline > 0) return "rgba(251, 189, 35, 0.5)"; // some offline
  return "rgba(74, 222, 128, 0.5)"; // all online
};

function MapContent({ geoLevel, onItemClick, selectedItems }) {
  const map = useMap();

  useEffect(() => {
    const geoData = geoLevel === 0 ? stedinGeojson : lowLevelGeojson;
    const bounds = L.geoJSON(geoData).getBounds();
    map.fitBounds(bounds);
  }, [geoLevel, map]);

  if (geoLevel === 0) {
    return (
      <GeoJSON
        key="high-level"
        data={stedinGeojson}
        style={(feature) => {
          const regionName = feature.properties.name;
          const isSelected = selectedItems.includes(regionName);
          return {
            fillColor: isSelected ? "rgba(96, 165, 250, 0.5)" : getRegionColor(regionData[regionName]),
            fillOpacity: 0.5,
            color: "#FFFFFF",
            weight: 1,
          };
        }}
        onEachFeature={(feature, layer) => {
          layer.on({
            click: () => onItemClick(feature.properties.name),
          });
        }}
      />
    );
  } else {
    const markers = lowLevelGeojson.features.map((feature) => {
      const { coordinates } = feature.geometry;
      const isSelected = selectedItems.some(item => 
        (typeof item === 'string' && item === feature.properties.Naam) || 
        (typeof item === 'object' && item.name === feature.properties.Naam)
      );
      const status = feature.properties.Status.toLowerCase();

      let icon;
      if (isSelected) {
        icon = SelectedIcon;
      } else if (status === "online") {
        icon = OnlineIcon;
      } else {
        icon = OfflineIcon;
      }

      return L.marker([coordinates[1], coordinates[0]], { icon })
        .bindPopup(feature.properties.Naam)
        .on('click', () => onItemClick(feature.properties.Naam, feature.properties.Gemeente, status));
    });

    const markerClusterGroup = L.markerClusterGroup();
    markerClusterGroup.addLayers(markers);
    map.addLayer(markerClusterGroup);

    return null;
  }
}

export default function InteractiveMap({ geoLevel = 0, filters }) {
  const [selectedItems, setSelectedItems] = useState([]);
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [mapKey, setMapKey] = useState(0);

  useEffect(() => {
    setSelectedItems([]);
    setMapKey(prev => prev + 1);
  }, [geoLevel]);

  useEffect(() => {
    setMapKey(prev => prev + 1);
  }, [isMultiSelect]);

  const handleItemClick = useCallback((itemName, gemeente, status) => {
    if (geoLevel === 0) {
      // High-level view: select regions
      if (isMultiSelect) {
        setSelectedItems((prev) =>
          prev.includes(itemName)
            ? prev.filter((r) => r !== itemName) // Deselect if already selected
            : [...prev, itemName] // Select if not selected
        );
      } else {
        setSelectedItems((prev) =>
          prev.includes(itemName) ? [] : [itemName] // Deselect if already selected, otherwise select only this
        );
      }
    } else {
      // Low-level view: select markers
      if (isMultiSelect) {
        setSelectedItems((prev) =>
          prev.some(item => (typeof item === 'string' && item === itemName) || 
                            (typeof item === 'object' && item.name === itemName))
            ? prev.filter((item) => 
                (typeof item === 'string' && item !== itemName) || 
                (typeof item === 'object' && item.name !== itemName)
              ) // Deselect if already selected
            : [...prev, { name: itemName, status: status }] // Select if not selected
        );
      } else {
        setSelectedItems((prev) =>
          prev.some(item => item.name === itemName) ? [] : [{ name: itemName, status: status }]
        );
      }
    }
  }, [isMultiSelect, geoLevel]);  

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "online":
        return "text-green-500";
      case "offline":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const handleRemoveClick = (itemToRemove) => {
    setSelectedItems((prevItems) =>
      prevItems.filter(item => 
        (typeof item === 'string' && item !== itemToRemove) || 
        (typeof item === 'object' && item.name !== itemToRemove.name)
      )
    );
  };

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
                    setSelectedItems([]);
                  }
                }}
              />
              <Label htmlFor="multi-select">
                {isMultiSelect ? "Multi-select mode" : "Single-select mode"}
              </Label>
            </div>
            <div className="relative aspect-[5/3] border border-gray-200 rounded-lg overflow-hidden">
              <MapContainer
                key={mapKey}
                center={[51.5, 3.8]}
                zoom={9}
                maxZoom={18}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <MapContent 
                  geoLevel={geoLevel} 
                  onItemClick={handleItemClick}
                  selectedItems={selectedItems}
                />
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
              {geoLevel === 0 && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-400 opacity-70" />
                    <span className="text-sm">Selected Region</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-400 opacity-70" />
                    <span className="text-sm">All Devices Online</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-400 opacity-70" />
                    <span className="text-sm">Some Devices Offline</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-400 opacity-70" />
                    <span className="text-sm">Region with Errors</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400 opacity-70" />
                    <span className="text-sm">All Devices Offline</span>
                  </div>
                </>
              )}
              {geoLevel === 1 && (
                <>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm">Online Edge Computer</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm">Selected Edge Computer</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm">Offline Edge Computer</span>
                </div>
              </>
              )}
            </div>
          </CardContent>
        </Card>
        {/* Selected card */}
        <Card>
          <CardHeader>
            <CardTitle>Selected {geoLevel === 0 ? "Region" : "Edge Computer"}{selectedItems.length > 1 && "s"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[500px] overflow-y-auto pr-2">
              {selectedItems.length > 0 ? (
                selectedItems.map((item, index) => (
                  <div key={index} className="space-y-2 mb-4 flex items-center justify-between">
                    <div>
                      {typeof item === 'string' ? (
                        <>
                          <p className="text-sm font-medium">{item}</p>
                          {regionData[item] && (
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <span className="text-muted-foreground">Devices:</span>
                              <span>{regionData[item].devices}</span>
                              <span className="text-muted-foreground">Online:</span>
                              <span>{regionData[item].online}</span>
                              <span className="text-muted-foreground">Errors:</span>
                              <span>{regionData[item].errors}</span>
                              <span className="text-muted-foreground">Offline:</span>
                              <span>{regionData[item].offline}</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className={`text-sm ${getStatusColor(item.status)}`}>Status: {item.status}</p>
                        </>
                      )}
                    </div>
                    <button
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleRemoveClick(item)}
                    >
                      Remove
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No {geoLevel === 0 ? "region" : "edge computer"} selected</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}