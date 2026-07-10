"use client";

import React, { useState } from 'react';

// Mock layout framework for the search page to clear deployment build requirements safely
export default function SearchPage() {
  const [selectedProperty, setSelectedProperty] = useState<any>(null);

  // Mock property array for layout representation
  const properties = [
    { id: 1, title: "Cozy Studio Apartment", price: 8000, latitude: 7.0736, longitude: 125.6110, beds: 1, baths: 1 },
    { id: 2, title: "Modern Condo Unit", price: 15000, latitude: 7.0800, longitude: 125.5950, beds: 2, baths: 1 },
  ];

  return (
    <div className="flex flex-col md:flex-row h-[calc(100-screen)] bg-gray-50">
      {/* Left Column: Properties List */}
      <div className="w-full md:w-1/2 p-6 overflow-y-auto max-h-screen">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Rentals in the Philippines</h1>
          <p className="text-gray-500 text-sm">Showing verified available spaces matching your filters</p>
        </div>

        <div className="space-y-4">
          {properties.map((property) => (
            <div 
              key={property.id} 
              onClick={() => setSelectedProperty(property)}
              className={`p-4 bg-white rounded-xl border transition cursor-pointer hover:shadow-sm ${
                selectedProperty?.id === property.id ? 'border-blue-500 bg-blue-50/10' : 'border-gray-100'
              }`}
            >
              <h3 className="font-semibold text-gray-800 mb-1">{property.title}</h3>
              <div className="text-blue-600 font-bold text-sm mb-2">₱{property.price.toLocaleString()} / month</div>
              <div className="flex gap-3 text-xs text-gray-500">
                <span>{property.beds} Bed</span>
                <span>{property.baths} Bath</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Google Maps Interactive Box */}
      <div className="w-full md:w-1/2 h-[50vh] md:h-auto bg-gray-100 relative min-h-[400px]">
        {/* Map Container Framework */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-gray-400 bg-gray-200">
          <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L16 4m0 13V4m0 0L9 7" />
          </svg>
          <span className="font-medium text-sm text-gray-600">Map Interface View</span>
          <p className="text-xs max-w-xs mt-1">Interactive property markers are tracked onto this grid environment.</p>

          {/* Conditional InfoWindow Element Structure with a safe explicit layout override wrapper */}
          {selectedProperty && (
            <div className="mt-4 p-3 bg-white rounded-lg shadow-md border border-gray-100 text-left w-64 animate-fadeIn relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setSelectedProperty(null); }}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 font-bold text-xs"
              >
                ✕
              </button>
              <div className="relative w-full h-24 mb-2 overflow-hidden rounded-md bg-gray-200"></div>
              <div className="flex flex-col max-w-[200px] font-sans text-gray-900 p-0.5">
                <span className="font-bold text-blue-600 text-sm">₱{selectedProperty.price.toLocaleString()}</span>
                <span className="font-semibold text-xs truncate mt-0.5 text-gray-800">{selectedProperty.title}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}