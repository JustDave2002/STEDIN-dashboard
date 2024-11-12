import { NextResponse } from 'next/server';

export const getMapData = async () => {
    try {
      const response = await fetch("http://localhost:8000/map");
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (err) {
      throw new Error("Failed to fetch map data: " + err.message);
    }
  };