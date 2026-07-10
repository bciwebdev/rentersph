"use client";

import React, { useState } from 'react';

// Mock component definitions inside the file for safety if imports change
function SearchBar({ onSearch }: { onSearch: (filters: any) => void }) {
  return (
    <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl shadow-md max-w-4xl mx-auto -mt-8 relative z-10 border border-gray-100">
      <div className="flex-1">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Location</label>
        <input type="text" placeholder="Where do you want to rent?" className="w-full bg-transparent text-gray-800 placeholder-gray-400 focus:outline-none font-medium" />
      </div>
      <div className="border-l border-gray-200 hidden md:block mx-2"></div>
      <div className="flex-1">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Property Type</label>
        <select className="w-full bg-transparent text-gray-800 focus:outline-none font-medium appearance-none cursor-pointer">
          <option>All Types</option>
          <option>Apartment</option>
          <option>House</option>
          <option>Condo</option>
          <option>Room</option>
        </select>
      </div>
      <div className="border-l border-gray-200 hidden md:block mx-2"></div>
      <div className="flex-1">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Budget</label>
        <select className="w-full bg-transparent text-gray-800 focus:outline-none font-medium appearance-none cursor-pointer">
          <option>Any Price</option>
          <option>Under ₱5,000</option>
          <option>₱5,000 - ₱10,000</option>
          <option>₱10,000 - ₱20,000</option>
          <option>₱20,000+</option>
        </select>
      </div>
      <button onClick={() => onSearch({})} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition duration-200 shadow-md shadow-blue-100 flex items-center justify-center gap-2 mt-2 md:mt-0">
        Search
      </button>
    </div>
  );
}

export default function RentersPage() {
  const [filters, setFilters] = useState({});

  const handleSearch = (newFilters: any) => {
    setFilters(newFilters);
    console.log("Searching with filters:", newFilters);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r digi-gradient from-blue-600 to-indigo-700 text-white py-20 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">Find Your Next Home in the Philippines</h1>
        <p className="text-xl text-blue-100 max-w-2xl mx-auto font-light">Browse verified long-term rentals, apartments, and condos across the country.</p>
      </div>

      {/* Search Bar Wrapper */}
      <div className="px-4">
        {/* @ts-ignore */}
        <SearchBar onSearch={handleSearch} />
      </div>

      {/* Main Content Area */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="mb-6 text-3xl font-bold text-gray-800">Featured Listings</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Static placeholders for visual UI framework */}
          {[1, 2, 3].map((item) => (
            <div key={item} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition duration-200">
              <div className="h-48 bg-gray-200 animate-pulse"></div>
              <div className="p-5">
                <div className="text-blue-600 font-bold text-lg mb-1">₱12,000 / mo</div>
                <h3 className="font-semibold text-gray-800 text-lg mb-2">Modern 1-Bedroom Apartment</h3>
                <p className="text-gray-500 text-sm mb-4">Davao City, Philippines</p>
                <div className="flex items-center gap-4 text-xs font-medium text-gray-600 border-t pt-3">
                  <span>1 Bed</span>
                  <span>1 Bath</span>
                  <span>24 sq m</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}