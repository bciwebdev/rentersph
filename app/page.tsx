'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, MapPin, Home, Building2,
  Sparkles, CheckCircle, Menu, X, ChevronDown, ChevronLeft
} from 'lucide-react'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const PHILIPPINES_LOCATIONS: Record<string, Record<string, Record<string, string[]>>> = {
  'Luzon': {
    'Metro Manila': {
      'Taguig': ['BGC', 'Fort Bonifacio', 'Western Bicutan', 'Pinagsama'],
      'Manila': ['Malate', 'Ermita', 'Sampaloc', 'Binondo'],
      'Quezon City': ['Diliman', 'Katipunan', 'Cubao', 'Commonwealth'],
      'Makati': ['Bel-Air', 'Poblacion', 'San Lorenzo', 'Guadalupe Nuevo']
    },
    'Benguet': {
      'Baguio City': ['Camp 7', 'Bakakeng Central', 'Magsaysay', 'Session Road']
    },
    'Pampanga': {
      'Angeles City': ['Balibago', 'Malabanias', 'Cutcut']
    }
  },
  'Visayas': {
    'Cebu': {
      'Cebu City': ['Lahug', 'Mabolo', 'Banilad', 'Capitol Site'],
      'Lapu-Lapu City': ['Mactan', 'Maribago', 'Basak'],
      'Mandaue City': ['Subangdaku', 'Tipolo', 'Bakilid']
    },
    'Iloilo': {
      'Iloilo City': ['Mandurriao', 'Jaro', 'Molo', 'Arevalo']
    }
  },
  'Mindanao': {
    'Davao del Sur': {
      'Davao City': ['Buhangin', 'Talomo', 'Poblacion', 'Agdao', 'Matina']
    },
    'Misamis Oriental': {
      'Cagayan de Oro': ['Nazareth', 'Carmen', 'Kauswagan', 'Patag']
    },
    'Zamboanga del Sur': {
      'Zamboanga City': ['Pasonanca', 'Tetuan', 'Canelar']
    }
  }
}

export default function HomePage() {
  const [properties, setProperties] = useState<any[]>([])
  const [filteredProperties, setFilteredProperties] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const [search, setSearch] = useState('')
  const [propertyType, setPropertyType] = useState('All Types')
  const [propertyDropdownOpen, setPropertyDropdownOpen] = useState(false)
  
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false)
  const [locStep, setLocStep] = useState<'island' | 'province' | 'city' | 'barangay'>('island')
  const [selectedIsland, setSelectedIsland] = useState<string | null>(null)
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null)
  const [selectedCity, setSelectedCity] = useState<string | null>(null)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const locDropdownRef = useRef<HTMLDivElement>(null)

  const propertyTypes = [
    { label: 'All Types', value: 'All Types' },
    { label: 'Apartment', value: 'Apartment' },
    { label: 'Condominium', value: 'Condo Unit' },
    { label: 'House', value: 'Single House' },
    { label: 'Boarding House', value: 'Dormitory Bedspace' }
  ]

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setPropertyDropdownOpen(false)
      }
      if (locDropdownRef.current && !locDropdownRef.current.contains(event.target as Node)) {
        setLocationDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Helper to check if property is currently boosted
  const checkIsBoosted = (p: any) => {
    const tierValue = p.boosting_tier || p.boost_tier
    if (!tierValue) return false

    const tier = String(tierValue).toLowerCase().trim()
    if (tier === 'none' || tier === '' || tier === 'false') return false

    const expiration = p.expires_at || p.boost_expires_at
    if (expiration) {
      return new Date(expiration) > new Date()
    }

    return true
  }

  // Helper to check if a standard (non-boosted) listing is still active (<= 30 days old)
  const checkIsListingActive = (p: any) => {
    // Paid active boosts bypass standard 30-day expiration
    if (checkIsBoosted(p)) return true;

    // Check expiration timestamp or created_at timestamp
    const referenceDate = p.expires_at ? new Date(p.expires_at) : new Date(p.created_at)
    const now = new Date()
    
    // If expires_at is directly set into the future
    if (p.expires_at && new Date(p.expires_at) > now) return true;

    // Standard 30-day expiration check from created_at date
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000
    const timeDiff = now.getTime() - new Date(p.created_at).getTime()

    return timeDiff <= thirtyDaysInMs
  }

  useEffect(() => {
    async function fetchProperties() {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .in('status', ['LIVE ON SITE', 'active', 'Active', 'approved', 'Approved'])
        .order('created_at', { ascending: false })
      
      if (!error && data) {
        // Filter out properties that are older than 30 days and not renewed/boosted
        const unexpiredData = data.filter(p => checkIsListingActive(p))

        const sortedData = [...unexpiredData].sort((a, b) => {
          const aBoosted = checkIsBoosted(a)
          const bBoosted = checkIsBoosted(b)

          if (aBoosted && !bBoosted) return -1
          if (!aBoosted && bBoosted) return 1
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })

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
        p.address?.toLowerCase().includes(query) ||
        p.city?.toLowerCase().includes(query) ||
        p.province?.toLowerCase().includes(query) ||
        p.barangay?.toLowerCase().includes(query) ||
        p.manual_address?.toLowerCase().includes(query)
      )
    }

    if (propertyType !== 'All Types') {
      const targetType = propertyTypes.find(t => t.label === propertyType)
      if (targetType) {
        temp = temp.filter(p => p.property_type === targetType.value)
      }
    }

    setFilteredProperties(temp)
  }

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

  const handleSelectIsland = (island: string) => {
    setSelectedIsland(island)
    setLocStep('province')
  }

  const handleSelectProvince = (province: string) => {
    setSelectedProvince(province)
    setLocStep('city')
  }

  const handleSelectCity = (city: string) => {
    setSelectedCity(city)
    setLocStep('barangay')
  }

  const handleSelectBarangay = (barangay: string) => {
    const fullString = `${barangay}, ${selectedCity}, ${selectedProvince}`
    setSearch(fullString)
    setLocationDropdownOpen(false)
    resetLocFlow()
  }

  const resetLocFlow = () => {
    setLocStep('island')
    setSelectedIsland(null)
    setSelectedProvince(null)
    setSelectedCity(null)
  }

  const goBackLocStep = () => {
    if (locStep === 'province') {
      setLocStep('island')
      setSelectedIsland(null)
    } else if (locStep === 'city') {
      setLocStep('province')
      setSelectedProvince(null)
    } else if (locStep === 'barangay') {
      setLocStep('city')
      setSelectedCity(null)
    }
  }

  // Active boosted items for Featured section
  const featuredItems = filteredProperties.filter(p => checkIsBoosted(p))
  const featuredIds = new Set(featuredItems.map(f => f.id))
  
  // Active regular items (within 30 days) for main list
  const regularItems = filteredProperties.filter(p => !featuredIds.has(p.id))

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans antialiased selection:bg-emerald-500 selection:text-white relative">
      
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm transition-all duration-300 pointer-events-auto">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 no-underline group relative z-50 pointer-events-auto">
            <div className="bg-emerald-600 p-2 rounded-xl text-white shadow-emerald-200 shadow-md group-hover:bg-emerald-700 transition-colors">
              <Home className="w-5 h-5" />
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              renters<span className="text-emerald-600">PH</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 relative z-50 pointer-events-auto">
            <span onClick={() => { setPropertyType('All Types'); window.scrollTo({top: 800, behavior: 'smooth'}); }} className="text-sm font-semibold text-slate-600 cursor-pointer hover:text-emerald-600 transition-colors">Find Rentals</span>
            <span className="text-sm font-semibold text-slate-600 cursor-pointer hover:text-emerald-600 transition-colors">Favorites</span>
            
            <Link href="/login" className="inline-flex items-center gap-2 text-sm font-bold bg-slate-900 text-white px-5 py-3 rounded-xl hover:bg-slate-800 transition shadow-sm hover:shadow-md cursor-pointer relative z-50 pointer-events-auto">
              <Building2 className="w-4 h-4 text-emerald-400" />
              Landlord Dashboard
            </Link>
          </nav>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg relative z-50 pointer-events-auto">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="absolute top-20 left-0 w-full bg-white border-b border-slate-200 shadow-xl px-6 py-6 flex flex-col gap-4 md:hidden z-40 pointer-events-auto">
              <span onClick={() => { setPropertyType('All Types'); setMobileMenuOpen(false); window.scrollTo({top: 800, behavior: 'smooth'}); }} className="text-base font-bold text-slate-700 py-2 border-b border-slate-50 cursor-pointer">Find Rentals</span>
              <span className="text-base font-bold text-slate-700 py-2 border-b border-slate-50 cursor-pointer">Favorites</span>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="w-full text-center font-bold bg-slate-900 text-white py-3 rounded-xl shadow-md cursor-pointer block relative z-50">
                Landlord Dashboard
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/60 via-white to-transparent pt-12 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-bold text-emerald-800 uppercase tracking-wider mb-4 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" /> Verified Property Ecosystem
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
              Find your <span className="text-emerald-600">Renting Place</span> here
            </h1>
            <p className="text-slate-500 font-medium text-base sm:text-xl max-w-xl mx-auto mt-4">
              Discover verified rental apartments, dynamic condominiums, and residential boarding rooms seamlessly.
            </p>
          </motion.div>
        </div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[350px] bg-gradient-to-tr from-emerald-200/20 to-teal-200/20 blur-3xl rounded-full -z-10" />
      </section>

      <section className="max-w-5xl mx-auto px-4 -mt-10 mb-16 relative z-20">
        <motion.form 
          onSubmit={handleApplyFilters} 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1, duration: 0.5 }} 
          className="bg-white px-5 py-2.5 rounded-2xl border border-slate-200 shadow-xl flex flex-col md:flex-row items-stretch md:items-center gap-4"
        >
          <div className="flex-1 relative" ref={locDropdownRef}>
            <div 
              onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
              className="flex items-center gap-3 px-4 py-2 border-b md:border-b-0 md:border-r border-slate-100 cursor-pointer hover:bg-slate-50/80 rounded-xl md:rounded-none transition duration-150 select-none"
            >
              <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
              <div className="flex-1 text-left min-w-0">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Where</label>
                <input 
                  value={search} 
                  onChange={(e) => {
                    setSearch(e.target.value);
                    if (!locationDropdownOpen) setLocationDropdownOpen(true);
                  }} 
                  type="text" 
                  placeholder="e.g. Davao City, Condominium..." 
                  className="w-full bg-transparent text-xs font-bold text-slate-800 placeholder-slate-400 outline-none mt-0.5 truncate" 
                />
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${locationDropdownOpen ? 'rotate-180' : ''}`} />
            </div>

            <AnimatePresence>
              {locationDropdownOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 right-0 mt-2 min-w-[280px] md:min-w-[340px] bg-white rounded-2xl shadow-2xl border border-slate-200/80 z-50 p-4"
                >
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-3">
                    {locStep !== 'island' && (
                      <button 
                        type="button" 
                        onClick={goBackLocStep} 
                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition shrink-0"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    )}
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate flex items-center gap-1">
                      <span className={locStep === 'island' ? 'text-emerald-600 font-extrabold' : ''}>PH</span>
                      {selectedIsland && (
                        <>
                          <span>/</span>
                          <span className={locStep === 'province' ? 'text-emerald-600 font-extrabold' : ''}>{selectedIsland}</span>
                        </>
                      )}
                      {selectedProvince && (
                        <>
                          <span>/</span>
                          <span className={locStep === 'city' ? 'text-emerald-600 font-extrabold' : ''}>{selectedProvince}</span>
                        </>
                      )}
                      {selectedCity && (
                        <>
                          <span>/</span>
                          <span className={locStep === 'barangay' ? 'text-emerald-600 font-extrabold font-black' : ''}>{selectedCity}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                    {locStep === 'island' && (
                      <>
                        <div className="text-[10px] font-bold text-slate-400 mb-2 px-1">Select Region Group:</div>
                        {Object.keys(PHILIPPINES_LOCATIONS).map((island) => (
                          <button
                            type="button"
                            key={island}
                            onClick={() => handleSelectIsland(island)}
                            className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition duration-150 flex items-center justify-between"
                          >
                            <span>{island}</span>
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                              {Object.keys(PHILIPPINES_LOCATIONS[island]).length} Provinces
                            </span>
                          </button>
                        ))}
                      </>
                    )}

                    {locStep === 'province' && selectedIsland && (
                      <>
                        <div className="text-[10px] font-bold text-slate-400 mb-2 px-1">Select Province:</div>
                        {Object.keys(PHILIPPINES_LOCATIONS[selectedIsland]).map((province) => (
                          <button
                            type="button"
                            key={province}
                            onClick={() => handleSelectProvince(province)}
                            className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition duration-150 flex items-center justify-between"
                          >
                            <span>{province}</span>
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                              {Object.keys(PHILIPPINES_LOCATIONS[selectedIsland][province]).length} Cities
                            </span>
                          </button>
                        ))}
                      </>
                    )}

                    {locStep === 'city' && selectedIsland && selectedProvince && (
                      <>
                        <div className="text-[10px] font-bold text-slate-400 mb-2 px-1">Select City / Municipality:</div>
                        {Object.keys(PHILIPPINES_LOCATIONS[selectedIsland][selectedProvince]).map((city) => (
                          <button
                            type="button"
                            key={city}
                            onClick={() => handleSelectCity(city)}
                            className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition duration-150 flex items-center justify-between"
                          >
                            <span>{city}</span>
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                              {PHILIPPINES_LOCATIONS[selectedIsland][selectedProvince][city].length} Barangays
                            </span>
                          </button>
                        ))}
                      </>
                    )}

                    {locStep === 'barangay' && selectedIsland && selectedProvince && selectedCity && (
                      <>
                        <div className="text-[10px] font-bold text-slate-400 mb-2 px-1">Select Barangay:</div>
                        {PHILIPPINES_LOCATIONS[selectedIsland][selectedProvince][selectedCity].map((brgy) => (
                          <button
                            type="button"
                            key={brgy}
                            onClick={() => handleSelectBarangay(brgy)}
                            className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:text-white hover:bg-emerald-600 rounded-xl transition duration-150"
                          >
                            {brgy}
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex-1 relative" ref={dropdownRef}>
            <div 
              onClick={() => setPropertyDropdownOpen(!propertyDropdownOpen)}
              className="flex items-center justify-between gap-3 px-4 py-2 border-b md:border-b-0 md:border-r border-slate-100 cursor-pointer hover:bg-slate-50/80 rounded-xl md:rounded-none transition duration-150 select-none"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <Building2 className="w-5 h-5 text-slate-400 shrink-0" />
                <div className="flex-1 text-left">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Property Type</label>
                  <span className="block text-xs font-bold text-slate-800 mt-0.5 truncate">
                    {propertyType}
                  </span>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${propertyDropdownOpen ? 'rotate-180' : ''}`} />
            </div>

            <AnimatePresence>
              {propertyDropdownOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 right-0 md:left-4 mt-2 min-w-[210px] bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 p-1.5 overflow-hidden"
                >
                  {propertyTypes.map((type) => {
                    const isSelected = propertyType === type.label;
                    return (
                      <button
                        type="button"
                        key={type.label}
                        onClick={() => {
                          setPropertyType(type.label);
                          setPropertyDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-bold rounded-xl transition-all duration-150 flex items-center justify-between ${
                          isSelected 
                            ? 'bg-emerald-50 text-emerald-700 font-black' 
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <span>{type.label}</span>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-emerald-600 flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            type="submit" 
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-8 py-4 md:py-3.5 rounded-xl md:rounded-full flex items-center justify-center gap-2 transition duration-200 cursor-pointer shadow-sm hover:shadow-md shrink-0 md:mr-1"
          >
            <Search className="w-4 h-4" />
            <span>Apply Filters</span>
          </button>
        </motion.form>
      </section>

      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="flex items-center gap-3 overflow-x-auto pb-3 scrollbar-none mask-image-inline">
          {propertyTypes.map((type) => (
            <button
              key={type.label}
              onClick={() => setPropertyType(type.label)}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-200 whitespace-nowrap shadow-sm border ${
                propertyType === type.label
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-emerald-100'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </section>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-16 mb-24">
        {isLoading ? (
          <div className="w-full text-center py-24 text-slate-500 font-bold text-lg flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading dynamic rental units from database...</span>
          </div>
        ) : (
          <>
            {/* FEATURED Rentals Section */}
            {featuredItems.length > 0 && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Featured Rentals</h2>
                  <p className="text-xs font-semibold text-emerald-600">
                    Showing {featuredItems.length} active matching options found
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6">
                  {featuredItems.map((p) => {
                    const img = getDisplayImage(p)
                    return (
                      <div key={`featured-${p.id}`} className="group bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full ring-2 ring-emerald-500/10">
                        <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden m-2 rounded-2xl">
                          <span className="absolute top-2.5 left-2.5 z-20 text-[9px] font-extrabold uppercase tracking-wider text-white bg-emerald-600 px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" /> {p.property_type || 'Featured'}
                          </span>
                          {img ? (
                            <img src={img} alt={p.title} className="w-full h-full object-cover group-hover:scale-102 transition duration-500" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">No Image</div>
                          )}
                        </div>
                        <div className="p-5 flex flex-col justify-between flex-grow space-y-3">
                          <div>
                            <div className="text-lg font-black text-slate-950">₱{p.price?.toLocaleString()}<span className="text-[10px] font-semibold text-slate-400">/mo</span></div>
                            <h3 className="text-sm font-bold text-slate-800 line-clamp-1 mt-0.5">{p.title}</h3>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3 text-slate-400 shrink-0" /> <span className="truncate">{p.address || p.manual_address}</span></div>
                          </div>
                          <div className="pt-2">
                            <Link 
                              href={`/property/${p.id}`} 
                              className="block w-full text-center bg-[#0f172a] hover:bg-slate-800 text-white font-bold text-xs py-3 px-4 rounded-xl transition-all duration-200"
                            >
                              View Details
                            </Link>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Latest Available Rental Units Section */}
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Latest Available Rental Units</h2>
                <p className="text-xs font-semibold text-emerald-600">
                  Showing {regularItems.length} active matching options found
                </p>
              </div>

              {regularItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6">
                  {regularItems.map((p) => {
                    const img = getDisplayImage(p)
                    return (
                      <div key={p.id} className="group bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full">
                        <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden m-2 rounded-2xl">
                          <span className="absolute top-2.5 left-2.5 z-20 text-[9px] font-extrabold uppercase tracking-wider text-slate-700 bg-white/95 backdrop-blur-sm px-2 py-0.5 rounded shadow-sm">
                            {p.property_type || 'Unit'}
                          </span>
                          {img ? (
                            <img src={img} alt={p.title} className="w-full h-full object-cover group-hover:scale-102 transition duration-500" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">No Image</div>
                          )}
                        </div>
                        <div className="p-5 flex flex-col justify-between flex-grow space-y-3">
                          <div>
                            <div className="text-lg font-black text-slate-950">₱{p.price?.toLocaleString()}<span className="text-[10px] font-semibold text-slate-400">/mo</span></div>
                            <h3 className="text-sm font-bold text-slate-800 line-clamp-1 mt-0.5">{p.title}</h3>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3 text-slate-400 shrink-0" /> <span className="truncate">{p.address || p.manual_address}</span></div>
                          </div>
                          <div className="pt-2">
                            <Link 
                              href={`/property/${p.id}`} 
                              className="block w-full text-center bg-[#0f172a] hover:bg-slate-800 text-white font-bold text-xs py-3 px-4 rounded-xl transition-all duration-200"
                            >
                              View Details
                            </Link>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="w-full text-center py-12 text-slate-400 font-medium text-sm border border-dashed border-slate-200 rounded-2xl bg-white">
                  No active rentals match your query right now. Try selecting "All Types".
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}