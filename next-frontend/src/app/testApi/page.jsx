// src/app/testApi.js or pages/testApi.js
"use client";

import { useState, useEffect } from "react";
import { getMapData } from "@/app/api/mapData/route"; // Adjust the import path based on your project structure

export default function TestApiPage() {
  const [mapData, setMapData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMapData = async () => {
      try {
        const data = await getMapData(); // Call the imported function
        setMapData(data); // Set the map data state
      } catch (err) {
        setError(err.message); // Handle any error that occurs during the fetch
        console.error("Failed to fetch map data:", err);
      }
    };

    fetchMapData(); // Trigger the API call when the component mounts
  }, []); // Empty dependency array ensures it only runs once when the component mounts

  return (
    <div>
      <h1>API Test Page</h1>
      {error ? (
        <p style={{ color: "red" }}>Error: {error}</p> // Show error message if it exists
      ) : mapData ? (
        <div>
          <h2>Map Data:</h2>
          <pre>{JSON.stringify(mapData, null, 2)}</pre> // Display the fetched map data in a formatted JSON structure
        </div>
      ) : (
        <p>Loading data...</p> // Show loading message until data is fetched
      )}
    </div>
  );
}
