// app/landlord/add-property/MapPicker.tsx
'use client';

import { APIProvider, Map, AdvancedMarker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { useState } from 'react';

function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  const map = useMap();
  
  if (!map) return null;

  map.addListener('click', (e: any) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    onLocationSelect(lat, lng);
  });

  return null;
}

export default function MapPicker() {
  const [marker, setMarker] = useState<{ lat: number, lng: number } | null>(null);

  const handleLocationSelect = (lat: number, lng: number) => {
    setMarker({ lat, lng });
    // Update the hidden inputs in your AddPropertyForm
    const latInput = document.getElementById('latitude') as HTMLInputElement;
    const lngInput = document.getElementById('longitude') as HTMLInputElement;
    if (latInput) latInput.value = lat.toString();
    if (lngInput) lngInput.value = lng.toString();
  };

  return (
    <div className="h-[400px] w-full rounded-xl overflow-hidden border border-gray-300">
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
        <Map defaultCenter={{ lat: 7.0722, lng: 125.6131 }} defaultZoom={13} mapId="DEMO_MAP_ID">
          <MapClickHandler onLocationSelect={handleLocationSelect} />
          {marker && <AdvancedMarker position={marker} />}
        </Map>
      </APIProvider>
    </div>
  );
}