'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, MapPin, Home, Building2, Bed, Maximize2, 
  Sparkles, ShieldCheck, Zap, Star, ArrowRight, 
  HelpCircle, CheckCircle, Users, BarChart3, Menu, X
} from 'lucide-react'

// Initialize client-side Supabase since your filter updates live on the client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Structural mock data for non-dynamic landing sections
const CITIES = [
  { name: 'Manila', count: '1,240+ Units', img: 'https://images.unsplash.com/photo-1542362567-b07eac790947?auto=format&fit=crop&w=300&q=80' },
  { name: 'Davao City', count: '850+ Units', img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=300&q=80' },
  { name: 'Cebu City', count: '980+ Units', img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=300&q=80' },
  { name: 'Taguig', count: '640+ Units', img: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=300&q=80' },
]

const TESTIMONIALS = [
  { name: 'Maria Santos', role: 'Tenant (Condo Renter)', text: 'Finding a verified apartment in BGC was seamless. The boosted options allowed me to lock down a unit within 3 days!', rating: 5 },
  { name: 'Jay-R Villanueva', role: 'Landlord (Apartment Owner)', text: 'The visibility boost tier is a game-changer. My rental inquiries jumped by 150% in the first week of listing.', rating: 5 },
]

export default function HomePage() {
  const [properties, setProperties] = useState<any[]>([])
  const [filteredProperties, setFilteredProperties] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Filter states
  const [search, setSearch] = useState('')
  const [propertyType, setPropertyType] = useState('All Types')
  const [bedrooms, setBedrooms] = useState('Any Count')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  useEffect(() => {
    async function fetchProperties() {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
      
      if (!error && data) {
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

  const handleApplyFilters = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
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
      const bedCount = parseInt(bedrooms, 10)
      if (bedrooms === '3') {
        temp = temp.filter(p => p.bedrooms >= bedCount)
      } else {
        temp = temp.filter(p => p.bedrooms === bedCount)
      }
    }

    if (minPrice !== '') {
      temp = temp.filter(p => p.price >= parseFloat(minPrice))
    }

    if (maxPrice !== '') {
      temp = temp.filter(p => p.price <= parseFloat(maxPrice))
    }

    setFilteredProperties(temp)
  }

  // Fallback trigger to fire filters instantly when category chips are picked
  useEffect(() => {
    handleApplyFilters()
  }, [propertyType])

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

  const boostedListings = filteredProperties.filter(p => p.boost_tier && p.boost_tier !== 'none' && p.boost_expires_at ? new Date(p.boost_expires_at) > new Date() : false)
  const regularListings = filteredProperties.filter(p => !(p.boost_tier && p.boost_tier !== 'none' && p.boost_expires_at ? new Date(p.boost_expires_at) > new Date() : false))

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans antialiased selection:bg-emerald-500 selection:text-white">
      
      {/* Premium Sticky Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5 no-underline group">
            <div className="bg-emerald-600 p-2 rounded-xl text-white shadow-emerald-200 shadow-md group-hover:bg-emerald-700 transition-colors">
              <Home className="w-5 h-5" />
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              renters<span className="text-emerald-600">PH</span>
            </span>
          </a>

          {/* Desktop Navigation links */}
          <nav className="hidden md:flex items-center gap-8">
            <span onClick={() => { setPropertyType('All Types'); window.scrollTo({top: 800, behavior: 'smooth'}); }} className="text-sm font-semibold text-slate-600 cursor-pointer hover:text-emerald-600 transition-colors">Find Rentals</span>
            <span className="text-sm font-semibold text-slate-600 cursor-pointer hover:text-emerald-600 transition-colors">Favorites</span>
            <a href="/login" className="inline-flex items-center gap-2 text-sm font-bold bg-slate-900 text-white px-5 py-3 rounded-xl hover:bg-slate-800 transition shadow-sm hover:shadow-md">
              <Building2 className="w-4 h-4 text-emerald-400" />
              Landlord Dashboard
            </a>
          </nav>

          {/* Mobile hamburger menu switch */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="absolute top-20 left-0 w-full bg-white border-b border-slate-200 shadow-xl px-6 py-6 flex flex-col gap-4 md:hidden">
              <span className="text-base font-bold text-slate-700 py-2 border-b border-slate-50">Find Rentals</span>
              <span className="text-base font-bold text-slate-700 py-2 border-b border-slate-50">Favorites</span>
              <a href="/login" className="w-full text-center font-bold bg-emerald-600 text-white py-3 rounded-xl shadow-md">
                Landlord Dashboard
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero Banner Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/60 via-white to-transparent pt-12 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-bold text-emerald-800 uppercase tracking-wider mb-4 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" /> Verified Property Ecosystem
            </span>
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">
  Find your <span className="text-emerald-600">Renting Place</span> here
</h1>
            <p className="text-slate-500 font-medium text-base sm:text-xl max-w-xl mx-auto mt-4">
              Discover verified rental apartments, dynamic condominiums, and residential boarding rooms seamlessly.
            </p>
          </motion.div>
        </div>

        {/* Luxury Floating Circle Accents */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[350px] bg-gradient-to-tr from-emerald-200/20 to-teal-200/20 blur-3xl rounded-full -z-10" />
      </section>

      {/* Integrated Airbnb-inspired Search & Filter Panel */}
      <section className="max-w-5xl mx-auto px-4 -mt-10 mb-16 relative z-20">
        <motion.form onSubmit={handleApplyFilters} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }} className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-xl space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5 tracking-wider">Where</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} type="text" placeholder="e.g. Davao City, Condominium..." className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5 tracking-wider">Property Type</label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-700 focus:outline-none focus:border-emerald-500 focus:bg-white transition cursor-pointer appearance-none">
                  <option value="All Types">All Types</option>
                  <option value="Apartment">Apartment</option>
                  <option value="Condominium">Condominium</option>
                  <option value="House">House</option>
                  <option value="Boarding House">Boarding House</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5 tracking-wider">Bedrooms</label>
              <div className="relative">
                <Bed className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <select value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-700 focus:outline-none focus:border-emerald-500 focus:bg-white transition cursor-pointer appearance-none">
                  <option value="Any Count">Any Count</option>
                  <option value="1">1 Bedroom</option>
                  <option value="2">2 Bedrooms</option>
                  <option value="3">3+ Bedrooms</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-full sm:w-36">
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 tracking-wider">Min Price (PHP)</label>
                <input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} type="number" placeholder="0" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-emerald-500" />
              </div>
              <span className="text-slate-300 mt-4 text-xs font-semibold">to</span>
              <div className="w-full sm:w-36">
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 tracking-wider">Max Price (PHP)</label>
                <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} type="number" placeholder="No Limit" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-emerald-500" />
              </div>
            </div>
            <button type="submit" className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-8 py-3.5 rounded-2xl transition-all duration-300 shadow-md shadow-emerald-200 flex items-center justify-center gap-2 hover:scale-[1.02]">
              <Search className="w-4 h-4" /> Apply Active Filters
            </button>
          </div>
        </motion.form>
      </section>

      {/* Quick Filter Segmented Category Chips */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="flex items-center gap-3 overflow-x-auto pb-3 scrollbar-none mask-image-inline">
          {['All Types', 'Apartment', 'Condominium', 'House', 'Boarding House'].map((type) => (
            <button
              key={type}
              onClick={() => setPropertyType(type)}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-200 whitespace-nowrap shadow-sm border ${
                propertyType === type
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-emerald-100'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </section>

      {/* Real-time Loading Skeleton Block or Dynamic Properties Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 mb-24">
        
        {isLoading ? (
          <div className="w-full text-center py-24 text-slate-500 font-bold text-lg flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading dynamic rental units from database...</span>
          </div>
        ) : (
          <>
            {/* Featured / Boosted Listings Row */}
            {boostedListings.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <div className="bg-amber-500 p-1.5 rounded-lg text-white">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Premium Featured Listings</h2>
                    <p className="text-xs font-medium text-slate-500">Verified properties prioritized by our system.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {boostedListings.map((p) => {
                    const img = getDisplayImage(p)
                    return (
                      <a key={p.id} href={`/property/${p.id}`} className="group bg-white rounded-3xl border border-amber-300 ring-2 ring-amber-400/10 overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col h-full hover:-translate-y-1">
                        <div className="aspect-[16/11] bg-slate-100 relative overflow-hidden">
                          <span className="absolute top-3 left-3 z-20 text-[10px] font-black uppercase tracking-wider text-slate-700 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-md shadow-sm">
                            {p.property_type || 'Unit'}
                          </span>
                          <span className="absolute top-3 right-3 z-20 text-[10px] font-black uppercase tracking-wider text-white bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1 font-sans">
                            🚀 Boosted
                          </span>
                          {img ? (
                            <img src={img} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">No Imagery Provided</div>
                          )}
                        </div>
                        <div className="p-5 flex flex-col justify-between flex-grow space-y-3">
                          <div>
                            <div className="text-2xl font-black text-slate-950">₱{p.price?.toLocaleString()}<span className="text-xs font-semibold text-slate-400">/mo</span></div>
                            <h3 className="text-sm font-bold text-slate-800 line-clamp-1 mt-0.5 group-hover:text-emerald-600 transition-colors">{p.title}</h3>
                            <div className="text-xs text-slate-400 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3 text-slate-400 shrink-0" /> {p.address}</div>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5 pt-3 border-t border-slate-100 text-center text-[11px] font-bold text-slate-600">
                            <div className="bg-emerald-500/5 text-emerald-700 py-2 rounded-xl flex items-center justify-center gap-1">🛏️ {p.bedrooms || 0} BR</div>
                            <div className="bg-emerald-500/5 text-emerald-700 py-2 rounded-xl flex items-center justify-center gap-1">🚿 {p.bathrooms || 0} BA</div>
                            <div className="bg-emerald-500/5 text-emerald-700 py-2 rounded-xl flex items-center justify-center gap-1">📐 {p.area || 0}m²</div>
                          </div>
                        </div>
                      </a>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Latest Listings Layout */}
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Latest Available Rental Units</h2>
                <p className="text-xs font-semibold text-emerald-600">
                  Showing {filteredProperties.length} active matching options found
                </p>
              </div>

              {regularListings.length > 0 || boostedListings.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {regularListings.map((p) => {
                    const img = getDisplayImage(p)
                    return (
                      <a key={p.id} href={`/property/${p.id}`} className="group bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full hover:-translate-y-1">
                        <div className="aspect-[16/11] bg-slate-100 relative overflow-hidden">
                          <span className="absolute top-3 left-3 z-20 text-[10px] font-black uppercase tracking-wider text-slate-700 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-md shadow-sm">
                            {p.property_type || 'Unit'}
                          </span>
                          {img ? (
                            <img src={img} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">No Imagery Provided</div>
                          )}
                        </div>
                        <div className="p-5 flex flex-col justify-between flex-grow space-y-3">
                          <div>
                            <div className="text-2xl font-black text-slate-950">₱{p.price?.toLocaleString()}<span className="text-xs font-semibold text-slate-400">/mo</span></div>
                            <h3 className="text-sm font-bold text-slate-800 line-clamp-1 mt-0.5 group-hover:text-emerald-600 transition-colors">{p.title}</h3>
                            <div className="text-xs text-slate-400 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3 text-slate-400 shrink-0" /> {p.address}</div>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5 pt-3 border-t border-slate-100 text-center text-[11px] font-bold text-slate-600">
                            <div className="bg-slate-100 text-slate-700 py-2 rounded-xl flex items-center justify-center gap-1">🛏️ {p.bedrooms || 0} BR</div>
                            <div className="bg-slate-100 text-slate-700 py-2 rounded-xl flex items-center justify-center gap-1">🚿 {p.bathrooms || 0} BA</div>
                            <div className="bg-slate-100 text-slate-700 py-2 rounded-xl flex items-center justify-center gap-1">📐 {p.area || 0}m²</div>
                          </div>
                        </div>
                      </a>
                    )
                  })}
                </div>
              ) : (
                <div className="w-full text-center text-sm text-slate-400 py-16 bg-white rounded-3xl border border-slate-200/60 shadow-inner">
                  No rental options match your current filter preferences. Try broadening your location search string.
                </div>
              )}
            </div>
          </>
        )}

        <hr className="border-slate-200" />

        {/* Browse By City Section */}
        <section>
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-3xl font-black tracking-tight text-slate-900">Browse by Hot Locations</h2>
            <p className="text-slate-500 text-sm mt-1">Explore thousands of verified listings scattered across prime centers.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {CITIES.map((city, idx) => (
              <div key={idx} onClick={() => { setSearch(city.name); handleApplyFilters(); }} className="group relative h-40 rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-lg transition">
                <img src={city.img} alt={city.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 flex flex-col justify-end">
                  <span className="text-white font-black text-lg">{city.name}</span>
                  <span className="text-emerald-400 text-xs font-semibold">{city.count}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Professional Metrics / Statistics Section */}
        <section className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center relative z-10">
            <div>
              <div className="text-3xl sm:text-4xl font-black text-emerald-400">45k+</div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Active Tenants</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-emerald-400">12k+</div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Verified Houses</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-emerald-400">99.4%</div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Matching Rate</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-emerald-400">₱0</div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Hidden Broker Fees</div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 blur-3xl rounded-full" />
        </section>

        {/* How RentersPH Works */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">1</div>
            <h3 className="text-base font-bold">Configure Search Filters</h3>
            <p className="text-slate-500 text-xs leading-relaxed">Narrow down specific bedroom sizes, custom localized areas, and comfortable monthly dynamic budget lines instantly.</p>
          </div>
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">2</div>
            <h3 className="text-base font-bold">Connect via Landlord Chat</h3>
            <p className="text-slate-500 text-xs leading-relaxed">Message rental owners directly using our integrated dashboard infrastructure safely without exposing secondary accounts.</p>
          </div>
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">3</div>
            <h3 className="text-base font-bold">Finalize Your Lease</h3>
            <p className="text-slate-500 text-xs leading-relaxed">Review fully verified options up front and secure processing directly through certified platform pipelines.</p>
          </div>
        </section>

        {/* Why Choose RentersPH Section */}
        <section className="bg-emerald-600 text-white rounded-3xl p-8 sm:p-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <h2 className="text-3xl font-black tracking-tight">Why Property Seekers Trust RentersPH</h2>
            <p className="text-emerald-100 text-sm leading-relaxed">We bypass unstructured traditional listing interfaces by providing structured, scam-protected, algorithmically boosted matching services engineered explicitly for real estate seekers nationwide.</p>
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2 text-sm font-semibold"><CheckCircle className="w-4 h-4 text-emerald-200 shrink-0" /> Zero Ghost Listings Policy</div>
              <div className="flex items-center gap-2 text-sm font-semibold"><CheckCircle className="w-4 h-4 text-emerald-200 shrink-0" /> Direct Landlord Dashboard Infrastructure</div>
              <div className="flex items-center gap-2 text-sm font-semibold"><CheckCircle className="w-4 h-4 text-emerald-200 shrink-0" /> Adaptive Client Filtering Tools</div>
            </div>
          </div>
          <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-sm space-y-4 border border-white/10">
            <div className="flex items-center gap-1 text-amber-300"><Star className="fill-current w-4 h-4" /><Star className="fill-current w-4 h-4" /><Star className="fill-current w-4 h-4" /><Star className="fill-current w-4 h-4" /><Star className="fill-current w-4 h-4" /></div>
            <p className="text-xs italic text-emerald-50">"The UI upgrade makes looking for student lodging near universities incredibly smooth. Highly practical search layouts!"</p>
            <div className="text-xs font-bold text-white">— Vince C., Student Tenant</div>
          </div>
        </section>

        {/* Testimonials Review Feed */}
        <section>
          <div className="text-center max-w-md mx-auto mb-10">
            <h2 className="text-3xl font-black tracking-tight">Endorsed by the Community</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TESTIMONIALS.map((t, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">{t.name}</h4>
                    <span className="text-[11px] text-slate-400 font-medium">{t.role}</span>
                  </div>
                  <div className="flex text-amber-400"><Star className="fill-current w-3.5 h-3.5" /><Star className="fill-current w-3.5 h-3.5" /><Star className="fill-current w-3.5 h-3.5" /><Star className="fill-current w-3.5 h-3.5" /><Star className="fill-current w-3.5 h-3.5" /></div>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">"{t.text}"</p>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* Premium Professional Footer Section */}
      <footer className="bg-white border-t border-slate-200 text-slate-500 text-xs py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="bg-emerald-600 p-1.5 rounded-lg text-white"><Home className="w-3.5 h-3.5" /></div>
              <span className="text-base font-black text-slate-900 tracking-tight">renters<span className="text-emerald-600">PH</span></span>
            </div>
            <p className="leading-relaxed">Simplifying urban residential search frameworks across the Philippine Islands securely.</p>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] mb-3">Explore Properties</h4>
            <ul className="space-y-2 font-medium">
              <li><span onClick={() => { setPropertyType('Apartment'); }} className="hover:text-emerald-600 cursor-pointer">Apartments for Rent</span></li>
              <li><span onClick={() => { setPropertyType('Condominium'); }} className="hover:text-emerald-600 cursor-pointer">Condominium Suites</span></li>
              <li><span onClick={() => { setPropertyType('Boarding House'); }} className="hover:text-emerald-600 cursor-pointer">Boarding Rooms</span></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] mb-3">Landlords</h4>
            <ul className="space-y-2 font-medium">
              <li><a href="/login" className="hover:text-emerald-600">List Your Property</a></li>
              <li><a href="/login" className="hover:text-emerald-600">Premium Boost Tiers</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] mb-3">Support Ecosystem</h4>
            <ul className="space-y-2 font-medium">
              <li className="hover:text-emerald-600 cursor-pointer">Safety Guidelines</li>
              <li className="hover:text-emerald-600 cursor-pointer">Terms of Service</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 rentersPH Inc. All localized rights strictly reserved.</p>
          <div className="flex gap-4 font-medium">
            <span className="hover:text-emerald-600 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-emerald-600 cursor-pointer">Legal Documentation</span>
          </div>
        </div>
      </footer>
    </div>
  )
}