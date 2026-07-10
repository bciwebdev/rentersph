'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

// Initialize client-side Supabase since your filter updates live on the client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function HomePage() {
  const [properties, setProperties] = useState<any[]>([])
  const [filteredProperties, setFilteredProperties] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true) // Added loading tracker status
  
  // Filter states
  const [search, setSearch] = useState('')
  const [propertyType, setPropertyType] = useState('All Types')
  const [bedrooms, setBedrooms] = useState('Any Count')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  useEffect(() => {
    async function fetchProperties() {
      setIsLoading(true)
      
      // UPDATED: Added explicit .eq('status', 'active') filter to query
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
      
      if (!error && data) {
        // Sort items so active boosted properties appear first automatically
        const sortedData = [...data].sort((a, b) => {
          const aBoosted = a.boost_tier && a.boost_tier !== 'none' && a.boost_expires_at ? new Date(a.boost_expires_at) > new Date() : false;
          const bBoosted = b.boost_tier && b.boost_tier !== 'none' && b.boost_expires_at ? new Date(b.boost_expires_at) > new Date() : false;

          if (aBoosted && !bBoosted) return -1;
          if (!aBoosted && bBoosted) return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        setProperties(sortedData)
        setFilteredProperties(sortedData)
      }
      setIsLoading(false)
    }
    fetchProperties()
  }, [])

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault()
    
    let temp = [...properties]

    if (search.trim() !== '') {
      const query = search.toLowerCase()
      temp = temp.filter(p => 
        p.title?.toLowerCase().includes(query) || 
        p.address?.toLowerCase().includes(query)
      )
    }

    if (propertyType !== 'All Types') {
      temp = temp.filter(p => p.property_type === propertyType)
    }

    if (bedrooms !== 'Any Count') {
      temp = temp.filter(p => p.bedrooms === parseInt(bedrooms, 10))
    }

    if (minPrice !== '') {
      temp = temp.filter(p => p.price >= parseFloat(minPrice))
    }

    if (maxPrice !== '') {
      temp = temp.filter(p => p.price <= parseFloat(maxPrice))
    }

    setFilteredProperties(temp)
  }

  // Safe fallback resolver for image variants matching your exact column structure
  const getDisplayImage = (property: any) => {
    if (property.images && Array.isArray(property.images) && property.images.length > 0) {
      return property.images[0]
    }
    if (typeof property.images === 'string' && property.images.trim() !== '') {
      let cleanStr = property.images.replace(/^\{|\}$/g, '')
      if (cleanStr.includes(',')) {
        return cleanStr.split(',')[0].replace(/"/g, '')
      }
      return cleanStr.replace(/"/g, '')
    }
    if (property.cover_image && typeof property.cover_image === 'string') {
      return property.cover_image
    }
    return null
  }

  return (
    <div className="min-h-screen bg-green-50/20 font-sans antialiased pb-24">
      {/* Navigation Bar Header */}
      <header className="px-6 py-4 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 no-underline group">
            <img 
              src="/icon.png" 
              alt="rentersPH Logo" 
              className="w-[20px] h-[20px] object-contain"
            />
            <span className="text-xl font-black text-gray-900 tracking-tight">
              renters<span className="text-green-600">PH</span>
            </span>
          </a>
          <div className="flex items-center gap-6">
            <span className="text-sm font-semibold text-gray-600 cursor-pointer hover:text-gray-900">Favorites</span>
            <a href="/login" className="text-sm font-bold bg-green-600 text-white px-5 py-2.5 rounded-xl hover:bg-green-700 transition shadow-sm">
              Landlord Dashboard
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 mt-16">
        
        {/* Banner Section */}
        <div className="text-center space-y-3 mb-12">
          <h1 className="text-5xl font-black text-slate-900 tracking-tight">Find Your Next Home</h1>
          <p className="text-gray-500 font-medium">Discover verified rental listings across the Philippines.</p>
        </div>

        {/* Search & Filter Panel */}
        <form onSubmit={handleApplyFilters} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-6 mb-16 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-black uppercase text-gray-400 mb-1.5 tracking-wider">Search Location / Title</label>
              <input value={search} onChange={(e) => setSearch(e.target.value)} type="text" placeholder="e.g. Davao City, Condominium..." className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-gray-400 mb-1.5 tracking-wider">Property Type</label>
              <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none cursor-pointer">
                <option value="All Types">All Types</option>
                <option value="Apartment">Apartment</option>
                <option value="Condominium">Condominium</option>
                <option value="House">House</option>
                <option value="Boarding House">Boarding House</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-gray-400 mb-1.5 tracking-wider">Bedrooms</label>
              <select value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none cursor-pointer">
                <option value="Any Count">Any Count</option>
                <option value="1">1 Bedroom</option>
                <option value="2">2 Bedrooms</option>
                <option value="3">3+ Bedrooms</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="w-full md:w-32">
                <label className="block text-xs font-black uppercase text-gray-400 mb-1.5 tracking-wider">Min Price (PHP)</label>
                <input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} type="number" placeholder="0" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none" />
              </div>
              <span className="text-gray-400 mt-6 text-sm">to</span>
              <div className="w-full md:w-32">
                <label className="block text-xs font-black uppercase text-gray-400 mb-1.5 tracking-wider">Max Price (PHP)</label>
                <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} type="text" placeholder="No Limit" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none" />
              </div>
            </div>
            <button type="submit" className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold text-sm px-8 py-3 rounded-xl transition shadow-sm md:mt-4">
              Apply Filters
            </button>
          </div>
        </form>

        {/* Listings Section Heading */}
        <div className="space-y-1 mb-8">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Available Rental Units</h2>
          <p className="text-xs font-semibold text-slate-700">
            Showing {filteredProperties.length} matching {filteredProperties.length === 1 ? 'option' : 'options'} found
          </p>
        </div>

        {/* Card Grid with Loading Status Handler built in */}
        {isLoading ? (
          <div className="w-full text-center py-20 text-slate-700 font-bold animate-pulse text-lg">
            🔄 Loading fresh listings from database...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProperties.length > 0 ? (
              filteredProperties.map((p) => {
                const img = getDisplayImage(p)
                const isBoosted = p.boost_tier && p.boost_tier !== 'none' && p.boost_expires_at ? new Date(p.boost_expires_at) > new Date() : false;
                
                return (
                  <a 
                    key={p.id} 
                    href={`/property/${p.id}`} 
                    style={{ display: 'block', pointerEvents: 'auto', zIndex: 10, position: 'relative' }}
                    className={`w-full bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer group ${isBoosted ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-gray-200'}`}
                  >
                    <div className="aspect-[16/11] bg-gray-100 relative overflow-hidden pointer-events-none">
                      <span className="absolute top-3 left-3 z-20 text-[10px] font-black uppercase tracking-wider text-slate-700 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md shadow-sm">
                        {p.property_type || 'Unit'}
                      </span>
                      
                      {isBoosted && (
                        <span className="absolute top-3 right-3 z-20 text-[10px] font-black uppercase tracking-wider text-white bg-amber-500 px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1 animate-pulse">
                          🚀 Boosted
                        </span>
                      )}

                      {img ? (
                        <img src={img} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Photo</div>
                      )}
                    </div>
                    
                    <div className="p-5 pointer-events-none space-y-3">
                      <div>
                        <div className="text-2xl font-black text-slate-900">₱{p.price?.toLocaleString()}</div>
                        <div className="text-sm font-bold text-gray-800 truncate mt-0.5">{p.title}</div>
                        <div className="text-xs text-gray-400 mt-1">📍 {p.address}</div>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-gray-100 text-center text-xs font-bold text-gray-600">
                        <div className="bg-green-500/10 text-green-700 py-1.5 rounded-lg">🛏️ {p.bedrooms || 0} BR</div>
                        <div className="bg-green-500/10 text-green-700 py-1.5 rounded-lg">🚿 {p.bathrooms || 0} BA</div>
                        <div className="bg-green-500/10 text-green-700 py-1.5 rounded-lg">📐 {p.area || 0}m²</div>
                      </div>
                    </div>
                  </a>
                )
              })
            ) : (
              <div className="col-span-full text-center text-sm text-gray-400 py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
                No options match your current active filter conditions.
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  )
}