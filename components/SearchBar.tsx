// components/SearchBar.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [propertyType, setPropertyType] = useState(searchParams.get('property_type') || '');
  const [bedrooms, setBedrooms] = useState(searchParams.get('bedrooms') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '');

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();

    if (search) params.set('search', search);
    if (propertyType) params.set('property_type', propertyType);
    if (bedrooms) params.set('bedrooms', bedrooms);
    if (minPrice) params.set('min_price', minPrice);
    if (maxPrice) params.set('max_price', maxPrice);

    router.push(`/?${params.toString()}`);
  };

  return (
    <form onSubmit={handleApplyFilters} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs max-w-5xl mx-auto space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        
        <div className="md:col-span-5">
          <label htmlFor="search" className="block text-xxs font-extrabold text-gray-400 uppercase tracking-wider mb-1.5">
            Search Location / Title
          </label>
          <input
            type="text"
            id="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="e.g. Davao City, Condominium..."
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 text-gray-900 font-medium text-sm"
          />
        </div>

        <div className="md:col-span-4">
          <label htmlFor="property_type" className="block text-xxs font-extrabold text-gray-400 uppercase tracking-wider mb-1.5">
            Property Type
          </label>
          <select
            id="property_type"
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 text-gray-700 font-medium text-sm cursor-pointer"
          >
            <option value="">All Types</option>
            <option value="Condominium">Condominium</option>
            <option value="Apartment">Apartment</option>
            <option value="House">House</option>
            <option value="Studio">Studio</option>
            <option value="Boarding House">Boarding House</option>
          </select>
        </div>

        <div className="md:col-span-3">
          <label htmlFor="bedrooms" className="block text-xxs font-extrabold text-gray-400 uppercase tracking-wider mb-1.5">
            Bedrooms
          </label>
          <select
            id="bedrooms"
            value={bedrooms}
            onChange={(e) => setBedrooms(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 text-gray-700 font-medium text-sm cursor-pointer"
          >
            <option value="">Any Count</option>
            <option value="1">1 Bedroom</option>
            <option value="2">2 Bedrooms</option>
            <option value="3">3+ Bedrooms</option>
          </select>
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center pt-2">
        <div className="md:col-span-8 flex items-center space-x-3">
          <div className="flex-1">
            <label htmlFor="min_price" className="block text-xxs font-extrabold text-gray-400 uppercase tracking-wider mb-1.5">Min Price (PHP)</label>
            <input type="number" id="min_price" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="0" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 text-gray-900 font-medium text-sm" />
          </div>
          <span className="text-gray-400 text-sm font-semibold pt-6">to</span>
          <div className="flex-1">
            <label htmlFor="max_price" className="block text-xxs font-extrabold text-gray-400 uppercase tracking-wider mb-1.5">Max Price (PHP)</label>
            <input type="text" id="max_price" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="No Limit" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 text-gray-900 font-medium text-sm" />
          </div>
        </div>

        <div className="md:col-span-4 pt-6">
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-2.5 rounded-xl transition-all shadow-sm cursor-pointer text-center">
            Apply Filters
          </button>
        </div>
      </div>
    </form>
  );
}