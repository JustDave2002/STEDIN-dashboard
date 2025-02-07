"use client"

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

const MapComponent = dynamic(() => import('./map'), {
  ssr: false,
  loading: () => <div>Loading map...</div>
})

export default function DynamicMap({ geoLevel, filters, mapData }) {
  return (
    <Suspense fallback={<div>Loading map...</div>}>
      <MapComponent geoLevel={geoLevel} filters={filters} mapData={mapData} />
    </Suspense>
  )
}