import { useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import "leaflet/dist/leaflet.css";
import { stedinGeojson } from "@/data/stedinGeojson"; // Your GeoJSON data

const regionData = {
  "Noord-Beveland": {
    status: "online",
    devices: 5000,
    errors: 25,
    offline: 100,
  },
  // Add other regions here
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

export default function InteractiveMap() {
  const [selectedRegion, setSelectedRegion] = useState(null);

  const style = (feature) => {
    const regionName = feature.properties.name;
    const regionInfo = regionData[regionName] || { status: "offline" };
    const isSelected = selectedRegion === regionName;

    return {
      fillColor: getRegionColor(isSelected ? "selected" : regionInfo.status),
      fillOpacity: 0.5,
      color: "#FFFFFF",
      weight: 1,
    };
  };

  const onEachFeature = (feature, layer) => {
    const regionName = feature.properties.name;

    layer.on({
      click: () => {
        setSelectedRegion(regionName);
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
            <CardTitle>Map</CardTitle>
          </CardHeader>
          <CardContent>
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
                <GeoJSON
                  data={stedinGeojson}
                  style={style}
                  onEachFeature={onEachFeature}
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

        {selectedRegion && regionData[selectedRegion] && (
          <Card>
            <CardHeader>
              <CardTitle>Selected Region</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm font-medium">{selectedRegion}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Devices:</span>
                  <span>{regionData[selectedRegion].devices}</span>
                  <span className="text-muted-foreground">Errors:</span>
                  <span>{regionData[selectedRegion].errors}</span>
                  <span className="text-muted-foreground">Offline:</span>
                  <span>{regionData[selectedRegion].offline}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}