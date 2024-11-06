"use client"

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

const MapComponent = dynamic(() => import('./map'), {
  ssr: false,
  loading: () => <div>Loading map...</div>
})

export default function DynamicMap() {
  return (
    <Suspense fallback={<div>Loading map...</div>}>
      <MapComponent />
    </Suspense>
  )
}