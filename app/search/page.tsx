'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function SearchDashboardContent() {
  const map = useMap(); 
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter States
  const [propertyType, setPropertyType] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState<string>('');

  // Function to fetch properties based on current map viewport and filter selections
  const handleMapIdle = async () => {
    if (!map) return;

    const bounds = map.getBounds();
    if (!bounds) return;

    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    setLoading(true);

    // 1. Initialize base query filtering by geo-coordinates
    let query = supabase
      .from('properties')
      .select('*')
      .gte('latitude', sw.lat())
      .lte('latitude', ne.lat())
      .gte('longitude', sw.lng())
      .lte('longitude', ne.lng());

    // 2. Conditionally append property type filter rule
    if (propertyType !== 'all') {
      query = query.eq('property_type', propertyType);
    }

    // 3. Conditionally append price ceiling rule
    if (maxPrice && !isNaN(parseFloat(maxPrice))) {
      query = query.lte('price', parseFloat(maxPrice));
    }

    const { data, error } = await query;

    if (error) {
      console.error("Search Filtering Error:", error.message);
    } else if (data) {
      setProperties(data);
    }
    setLoading(false);
  };

  // Re-trigger query execution whenever map pans/zooms or a filter value shifts
  useEffect(() => {
    if (!map) return;

    const listener = map.addListener('idle', handleMapIdle);
    handleMapIdle();

    return () => {
      listener.remove();
    };
  }, [map, propertyType, maxPrice]);

  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden bg-gray-50">
      
      {/* 1. SIDEBAR LIST & FILTERS PANEL */}
      <div className="w-full md:w-[420px] lg:w-[480px] h-1/2 md:h-full flex flex-col border-r border-gray-200 bg-white z-10 shadow-lg">
        
        {/* Header Content Container */}
        <div className="p-4 border-b border-gray-100 bg-white sticky top-0 space-y-3">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">RentersPH</h1>
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
              {loading ? 'Searching...' : `${properties.length} available`}
            </span>
          </div>

          {/* Controls UI Layout Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Type</label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full text-xs font-medium border border-gray-200 rounded-lg p-2 bg-gray-50/50 focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="all">All Properties</option>
                <option value="Apartment">Apartment</option>
                <option value="Condo">Condo</option>
                <option value="House">House</option>
                <option value="Room">Room/Studio</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Max Budget (₱)</label>
              <input
                type="number"
                placeholder="e.g. 15000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full text-xs font-medium border border-gray-200 rounded-lg p-2 bg-gray-50/50 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Scrollable Property List Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading && properties.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <p className="text-sm">Updating listings...</p>
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="font-medium text-sm text-gray-700">No properties match your rules.</p>
              <p className="text-xs text-gray-400 mt-1">Try resetting filters or dragging the map.</p>
            </div>
          ) : (
            properties.map((prop) => (
              <div 
                key={prop.id}
                onClick={() => {
                  setSelectedProperty(prop);
                  map?.panTo({ lat: Number(prop.latitude), lng: Number(prop.longitude) });
                }}
                className={`flex gap-3 bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer p-2 ${
                  selectedProperty?.id === prop.id ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50/30' : 'border-gray-100'
                }`}
              >
                {/* Optimized Thumbnail */}
                <div className="relative w-28 h-24 md:w-32 md:h-28 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                  <Image 
                    src={prop.cover_image || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=300&q=80'} 
                    alt={prop.title} 
                    fill
                    sizes="(max-w-md) 120px"
                    className="object-cover transition-transform duration-200"
                  />
                </div>

                {/* Info Text Elements and Detail Routing Link */}
                <div className="flex flex-col justify-between py-1 flex-1 min-w-0">
                  <div>
                    <Link 
                      href={`/properties/${prop.id}`}
                      onClick={(e) => e.stopPropagation()} // Stop dynamic map re-centering when navigating away
                      className="font-semibold text-gray-900 text-sm md:text-base truncate block hover:text-blue-600 transition-colors"
                    >
                      {prop.title}
                    </Link>
                    <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">
                      📍 {prop.address}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-1 mt-1 font-medium">
                      🛏️ {prop.bedrooms} beds • 🚿 {prop.bathrooms} baths
                    </p>
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-base font-bold text-blue-600">
                      ₱{Number(prop.price).toLocaleString()}
                      <span className="text-xs font-normal text-gray-500">/mo</span>
                    </span>
                    <span className="text-[10px] bg-gray-100 font-bold text-gray-500 px-1.5 py-0.5 rounded uppercase">
                      {prop.property_type}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 2. LIVE MAP PANELS VIEW */}
      <div className="flex-1 h-1/2 md:h-full relative">
        <Map
          defaultCenter={{ lat: 7.0722, lng: 125.6131 }} // Davao City
          defaultZoom={13}
          mapId="YOUR_MAP_ID" 
          gestureHandling={'greedy'}
          disableDefaultUI={false}
        >
          {/* Map Pins matching active query bounds array */}
          {properties.map((prop) => (
            <AdvancedMarker 
              key={prop.id} 
              position={{ lat: Number(prop.latitude), lng: Number(prop.longitude) }}
              onClick={() => setSelectedProperty(prop)}
            >
              <Pin 
                background={selectedProperty?.id === prop.id ? '#1e40af' : '#2563eb'} 
                glyphColor={'#fff'} 
                scale={selectedProperty?.id === prop.id ? 1.15 : 1}
              />
            </AdvancedMarker>
          ))}

          {/* Info Window Details Popup Card */}
          {selectedProperty && (
            <InfoWindow
              position={{ lat: Number(selectedProperty.latitude), lng: Number(selectedProperty.longitude) }}
              onCloseClick={() => setSelectedProperty(null)}
              options={{ pixelOffset: { width: 0, height: -35 } }}
            >
              <div className="flex flex-col max-w-[200px] font-sans text-gray-900 p-0.5">
                <div className="relative w-full h-24 mb-2 overflow-hidden rounded-md bg-gray-100">
                  <Image 
                    src={selectedProperty.cover_image || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=300&q=80'} 
                    alt={selectedProperty.title} 
                    fill
                    sizes="200px"
                    className="object-cover"
                  />
                </div>
                <Link 
                  href={`/properties/${selectedProperty.id}`}
                  className="font-bold text-sm truncate text-gray-900 hover:text-blue-600 block"
                >
                  {selectedProperty.title}
                </Link>
                <p className="text-sm font-semibold text-blue-600 mt-0.5">
                  ₱{Number(selectedProperty.price).toLocaleString()}/mo
                </p>
              </div>
            </InfoWindow>
          )}
        </Map>
      </div>

    </div>
  );
}

export default function RenterSearchPage() {
  return (
    <div className="h-screen w-full">
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
        <SearchDashboardContent />
      </APIProvider>
    </div>
  );
}