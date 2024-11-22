"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap, FeatureGroup } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import L from 'leaflet';
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import "leaflet-draw/dist/leaflet.draw.css";

// Import high-level GeoJSON data
import { stedinGeojson } from "@/data/StedinGeojson";

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

const getRegionColor = (regionData) => {
  if (!regionData) return "rgba(155, 155, 155, 0.5)"; // default color for regions with no data
  
  const { devices, online, offline } = regionData;
  const total = devices;

  if (total === 0) return "rgba(155, 155, 155, 0.5)"; // default color for regions with no devices

  const offlineRatio = offline / total;

  // Create a more sensitive gradient
  // 0% offline: pure green (0, 255, 0)
  // 1% offline: yellow-green (127, 255, 0)
  // 5% offline: orange (255, 165, 0)
  // 10%+ offline: red (255, 0, 0)

  let r, g, b;

  if (offlineRatio === 0) {
    [r, g, b] = [0, 255, 0];
  } else if (offlineRatio <= 0.01) {
    const t = offlineRatio / 0.01;
    r = Math.round(127 * t);
    g = 255;
    b = 0;
  } else if (offlineRatio <= 0.05) {
    const t = (offlineRatio - 0.01) / 0.04;
    r = Math.round(127 + 128 * t);
    g = Math.round(255 - 90 * t);
    b = 0;
  } else if (offlineRatio <= 0.1) {
    const t = (offlineRatio - 0.05) / 0.05;
    r = 255;
    g = Math.round(165 - 165 * t);
    b = 0;
  } else {
    [r, g, b] = [255, 0, 0];
  }

  return `rgba(${r}, ${g}, ${b}, 0.5)`;
};

function MapContent({ geoLevel, onItemClick, selectedItems, onDragSelect, onDragDeselect, mapData, aggregatedData, isDeselectMode }) {
  const map = useMap();
  const featureGroupRef = useRef();
  const markerClusterGroupRef = useRef();

  useEffect(() => {
    if (geoLevel === 1 && mapData) {
      const bounds = L.latLngBounds(mapData.map((feature) => [feature.latitude, feature.longitude]));
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [geoLevel, map, mapData]);

  useEffect(() => {
    return () => {
      if (markerClusterGroupRef.current) {
        map.removeLayer(markerClusterGroupRef.current);
      }
    };
  }, [map]);

  useEffect(() => {
    if (geoLevel === 1 && mapData) {
      if (markerClusterGroupRef.current) {
        map.removeLayer(markerClusterGroupRef.current);
      }

      const markers = mapData.map((feature) => {
        const { latitude, longitude, name, status, municipality } = feature;

        const isSelected = selectedItems.some(item =>
          (typeof item === 'string' && item === name) ||
          (typeof item === 'object' && item.name === name)
        );

        let icon = isSelected ? SelectedIcon : status.toLowerCase() === "online" ? OnlineIcon : OfflineIcon;

        return L.marker([latitude, longitude], { icon })
          .bindPopup(name)
          .on('click', () => onItemClick(name, municipality, status));
      });

      const markerClusterGroup = L.markerClusterGroup();
      markerClusterGroup.addLayers(markers);
      map.addLayer(markerClusterGroup);
      markerClusterGroupRef.current = markerClusterGroup;
    }
  }, [geoLevel, mapData, selectedItems, map, onItemClick]);

  const handleCreated = (e) => {
    const layer = e.layer;
    if (layer instanceof L.Rectangle) {
      const bounds = layer.getBounds();
      if (isDeselectMode) {
        onDragDeselect(bounds);
      } else {
        onDragSelect(bounds);
      }
    }
    featureGroupRef.current.clearLayers();
  };

  return (
    <>
      {geoLevel === 0 && (
        <GeoJSON
          key="high-level"
          data={stedinGeojson}
          style={(feature) => {
            const regionName = feature.properties.name;
            const regionData = aggregatedData[regionName];
            const isSelected = selectedItems.includes(regionName);
            return {
              fillColor: isSelected ? "rgba(96, 165, 250, 0.5)" : getRegionColor(regionData),
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
      )}
      <FeatureGroup ref={featureGroupRef}>
        <EditControl
          position="topright"
          onCreated={handleCreated}
          draw={{
            rectangle: {
              shapeOptions: {
                color: isDeselectMode ? '#ff3333' : '#3388ff',
              },
            },
            polygon: false,
            circle: false,
            circlemarker: false,
            marker: false,
            polyline: false,
          }}
        />
      </FeatureGroup>
    </>
  );
}

export default function InteractiveMap({ geoLevel = 0, filters, mapData }) {
  const [selectedItems, setSelectedItems] = useState([]);
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [isDeselectMode, setIsDeselectMode] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const [aggregatedData, setAggregatedData] = useState({});

  useEffect(() => {
    // Aggregate data for high-level view
    const aggregated = mapData.reduce((acc, item) => {
      if (!acc[item.municipality]) {
        acc[item.municipality] = { devices: 0, online: 0, offline: 0 };
      }
      acc[item.municipality].devices++;
      if (item.status.toLowerCase() === 'online') {
        acc[item.municipality].online++;
      } else {
        acc[item.municipality].offline++;
      }
      return acc;
    }, {});
    setAggregatedData(aggregated);
  }, [mapData]);

  useEffect(() => {
    setSelectedItems([]);
    setMapKey(prev => prev + 1);
  }, [geoLevel]);

  useEffect(() => {
    setMapKey(prev => prev + 1);
  }, [isMultiSelect, isDeselectMode]);

  const handleItemClick = useCallback((itemName, municipality, status) => {
    if (geoLevel === 0) {
      // High-level view: select regions
      if (isMultiSelect) {
        setSelectedItems((prev) =>
          prev.includes(itemName)
            ? prev.filter((r) => r !== itemName)
            : [...prev, itemName]
        );
      } else {
        setSelectedItems((prev) =>
          prev.includes(itemName) ? [] : [itemName]
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
              )
            : [...prev, { name: itemName, municipality, status }]
        );
      } else {
        setSelectedItems((prev) =>
          prev.some(item => item.name === itemName) ? [] : [{ name: itemName, municipality, status }]
        );
      }
    }
  }, [isMultiSelect, geoLevel]);
  
  const handleDragSelect = useCallback((bounds) => {
    if (geoLevel === 0) {
      const selectedRegions = stedinGeojson.features.filter(feature => {
        const polygon = L.polygon(feature.geometry.coordinates[0]);
        return bounds.intersects(polygon.getBounds());
      }).map(feature => feature.properties.name);

      setSelectedItems(prev => {
        if (isMultiSelect) {
          return [...new Set([...prev, ...selectedRegions])];
        } else {
          return selectedRegions;
        }
      });
    } else if (mapData) {
      const selectedMarkers = mapData.filter(feature => 
        bounds.contains(L.latLng(feature.latitude, feature.longitude))
      ).map(feature => ({ name: feature.name, municipality: feature.municipality, status: feature.status }));

      setSelectedItems(prev => {
        if (isMultiSelect) {
          const prevSet = new Set(prev.map(item => typeof item === 'string' ? item : item.name));
          const newItems = selectedMarkers.filter(marker => !prevSet.has(marker.name));
          return [...prev, ...newItems];
        } else {
          return selectedMarkers;
        }
      });
    }
  }, [geoLevel, isMultiSelect, mapData]);

  const handleDragDeselect = useCallback((bounds) => {
    if (geoLevel === 0) {
      const deselectedRegions = stedinGeojson.features.filter(feature => {
        const polygon = L.polygon(feature.geometry.coordinates[0]);
        return bounds.intersects(polygon.getBounds());
      }).map(feature => feature.properties.name);

      setSelectedItems(prev => prev.filter(item => !deselectedRegions.includes(item)));
    } else if (mapData) {
      const deselectedMarkers = mapData.filter(feature => 
        bounds.contains(L.latLng(feature.latitude, feature.longitude))
      ).map(feature => feature.name);

      setSelectedItems(prev => prev.filter(item => 
        typeof item === 'string' ? !deselectedMarkers.includes(item) : !deselectedMarkers.includes(item.name)
      ));
    }
  }, [geoLevel, mapData]);

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
            <div className="mb-4 flex items-center space-x-4">
              <div className="flex items-center space-x-2">
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
              <div className="flex items-center space-x-2">
                <Switch
                  id="deselect-mode"
                  checked={isDeselectMode}
                  onCheckedChange={setIsDeselectMode}
                />
                <Label htmlFor="deselect-mode">
                  {isDeselectMode ? "Deselect mode" : "Select mode"}
                </Label>
              </div>
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
                  onDragSelect={handleDragSelect}
                  onDragDeselect={handleDragDeselect}
                  mapData={mapData}
                  aggregatedData={aggregatedData}
                  isDeselectMode={isDeselectMode}
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
                    <div className="w-20 h-3 rounded-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500" />
                    <span className="text-sm">Device Status (Green: All Online, Yellow: 1% Offline, Orange: 5% Offline, Red: 10%+ Offline)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-400 opacity-70" />
                    <span className="text-sm">No Data / No Devices</span>
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
            <CardTitle>
              Selected {geoLevel === 0 ? "Region" : "Edge Computer"}
              {selectedItems.length > 1 && "s"} ({selectedItems.length})
            </CardTitle>
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
                          {aggregatedData[item] && (
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <span className="text-muted-foreground">Devices:</span>
                              <span>{aggregatedData[item].devices}</span>
                              <span className="text-muted-foreground">Online:</span>
                              <span>{aggregatedData[item].online}</span>
                              <span className="text-muted-foreground">Offline:</span>
                              <span>{aggregatedData[item].offline}</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">Municipality: {item.municipality}</p>
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