'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, MapPin, Home, Building2, Bed, Bath, Heart,
  CheckCircle, Menu, X, ChevronDown, ChevronLeft, Flag, Bell, ArrowRight
} from 'lucide-react'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function HomePage() {
  const [properties, setProperties] = useState<any[]>([])
  const [filteredProperties, setFilteredProperties] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const [search, setSearch] = useState('')
  const [propertyType, setPropertyType] = useState('All Types')
  const [propertyDropdownOpen, setPropertyDropdownOpen] = useState(false)
  
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false)
  const [locStep, setLocStep] = useState<'region' | 'province' | 'city' | 'barangay'>('region')
  
  // Dynamic PSGC Location States
  const [regionsList, setRegionsList] = useState<any[]>([])
  const [provincesList, setProvincesList] = useState<any[]>([])
  const [citiesList, setCitiesList] = useState<any[]>([])
  const [barangaysList, setBarangaysList] = useState<any[]>([])
  const [isLoadingLocs, setIsLoadingLocs] = useState(false)

  const [selectedRegion, setSelectedRegion] = useState<any | null>(null)
  const [selectedProvince, setSelectedProvince] = useState<any | null>(null)
  const [selectedCity, setSelectedCity] = useState<any | null>(null)

  // Favorites state
  const [favorites, setFavorites] = useState<Record<string, boolean>>({})

  // Report Modal States
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [selectedPropertyForReport, setSelectedPropertyForReport] = useState<any | null>(null)
  const [reportReason, setReportReason] = useState('Inaccurate Information')
  const [reportDetails, setReportDetails] = useState('')
  const [reporterEmail, setReporterEmail] = useState('')
  const [isSubmittingReport, setIsSubmittingReport] = useState(false)
  const [reportSuccess, setReportSuccess] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const locDropdownRef = useRef<HTMLDivElement>(null)

  const propertyTypes = [
    { label: 'All Types', value: 'All Types', icon: Home },
    { label: 'Apartment', value: 'Apartment', icon: Home },
    { label: 'Boarding House', value: 'Dormitory Bedspace', icon: Bed },
    { label: 'Condo', value: 'Condo Unit', icon: Building2 },
    { label: 'House', value: 'Single House', icon: Home },
    { label: 'Commercial', value: 'Commercial', icon: Building2 }
  ]

  // Initial Fetch for Regions from CDN
  useEffect(() => {
    async function fetchRegions() {
      try {
        setIsLoadingLocs(true)
        const res = await fetch('https://psgc.gitlab.io/api/regions.json')
        const data = await res.json()
        setRegionsList(data || [])
      } catch (err) {
        console.error('Error fetching regions:', err)
      } finally {
        setIsLoadingLocs(false)
      }
    }
    fetchRegions()
  }, [])

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

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setFavorites(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const checkIsBoosted = (p: any) => {
    const tierValue = p.boosting_tier || p.boost_tier
    if (!tierValue) return false

    const tier = String(tierValue).toLowerCase().trim()
    if (tier === 'none' || tier === '' || tier === 'false') return false

    const isApprovedAndPaid = p.is_paid === true || (p.payment_status && p.payment_status.toLowerCase() === 'paid')
    if (!isApprovedAndPaid) return false

    const expiration = p.expires_at || p.boost_expires_at
    if (expiration) {
      return new Date(expiration) > new Date()
    }

    return true
  }

  const checkIsListingActive = (p: any) => {
    if (checkIsBoosted(p)) return true;

    const now = new Date()
    if (p.expires_at && new Date(p.expires_at) > now) return true;

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

  // Handle Location Step Transitions with Async Fetching
  const handleSelectRegion = async (region: any) => {
    setSelectedRegion(region)
    setIsLoadingLocs(true)
    try {
      const res = await fetch(`https://psgc.gitlab.io/api/regions/${region.code}/provinces.json`)
      let data = await res.json()
      
      // NCR and special regions don't have provinces, fetch cities directly
      if (!data || data.length === 0) {
        const cityRes = await fetch(`https://psgc.gitlab.io/api/regions/${region.code}/cities-municipalities.json`)
        const cityData = await cityRes.json()
        setCitiesList(cityData || [])
        setLocStep('city')
      } else {
        setProvincesList(data || [])
        setLocStep('province')
      }
    } catch (err) {
      console.error('Error fetching provinces:', err)
    } finally {
      setIsLoadingLocs(false)
    }
  }

  const handleSelectProvince = async (province: any) => {
    setSelectedProvince(province)
    setIsLoadingLocs(true)
    try {
      const res = await fetch(`https://psgc.gitlab.io/api/provinces/${province.code}/cities-municipalities.json`)
      const data = await res.json()
      setCitiesList(data || [])
      setLocStep('city')
    } catch (err) {
      console.error('Error fetching cities:', err)
    } finally {
      setIsLoadingLocs(false)
    }
  }

  const handleSelectCity = async (city: any) => {
    setSelectedCity(city)
    setIsLoadingLocs(true)
    try {
      const res = await fetch(`https://psgc.gitlab.io/api/cities-municipalities/${city.code}/barangays.json`)
      const data = await res.json()
      setBarangaysList(data || [])
      setLocStep('barangay')
    } catch (err) {
      console.error('Error fetching barangays:', err)
    } finally {
      setIsLoadingLocs(false)
    }
  }

  const handleSelectBarangay = (barangay: any) => {
    const provName = selectedProvince ? `, ${selectedProvince.name}` : ''
    const fullString = `${barangay.name}, ${selectedCity.name}${provName}`
    setSearch(fullString)
    setLocationDropdownOpen(false)
    resetLocFlow()
  }

  const resetLocFlow = () => {
    setLocStep('region')
    setSelectedRegion(null)
    setSelectedProvince(null)
    setSelectedCity(null)
    setProvincesList([])
    setCitiesList([])
    setBarangaysList([])
  }

  const goBackLocStep = () => {
    if (locStep === 'province') {
      setLocStep('region')
      setSelectedRegion(null)
    } else if (locStep === 'city') {
      if (selectedProvince) {
        setLocStep('province')
        setSelectedProvince(null)
      } else {
        setLocStep('region')
        setSelectedRegion(null)
      }
    } else if (locStep === 'barangay') {
      setLocStep('city')
      setSelectedCity(null)
    }
  }

  const openReportModal = (property: any, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedPropertyForReport(property)
    setReportModalOpen(true)
    setReportSuccess(false)
  }

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPropertyForReport) return

    setIsSubmittingReport(true)

    const { error } = await supabase.from('property_reports').insert({
      property_id: selectedPropertyForReport.id,
      reason: reportReason,
      details: reportDetails,
      reporter_email: reporterEmail
    })

    setIsSubmittingReport(false)

    if (!error) {
      setReportSuccess(true)
      setTimeout(() => {
        setReportModalOpen(false)
        setReportReason('Inaccurate Information')
        setReportDetails('')
        setReporterEmail('')
        setReportSuccess(false)
      }, 2000)
    } else {
      alert('Failed to submit report. Please try again.')
    }
  }

  const featuredItems = filteredProperties.filter(p => checkIsBoosted(p))
  const featuredIds = new Set(featuredItems.map(f => f.id))
  const regularItems = filteredProperties.filter(p => !featuredIds.has(p.id))

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased selection:bg-emerald-600 selection:text-white relative pb-12">
      
      {/* HEADER SECTION */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm transition-all duration-300">
        <div className="max-w-[1600px] mx-auto px-5 sm:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 no-underline group relative z-50">
            <div className="bg-emerald-600 p-2 rounded-xl text-white shadow-emerald-200 shadow-md">
              <Home className="w-5 h-5" />
            </div>
            <span className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              renters<span className="text-emerald-600">ph</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 relative z-50">
            <span onClick={() => { setPropertyType('All Types'); window.scrollTo({top: 800, behavior: 'smooth'}); }} className="text-sm font-bold text-slate-700 cursor-pointer hover:text-emerald-600 transition-colors">Find Rentals</span>
            <span className="text-sm font-bold text-slate-700 cursor-pointer hover:text-emerald-600 transition-colors">Favorites</span>
            
            <Link href="/login" className="inline-flex items-center gap-2 text-sm font-bold bg-slate-900 text-white px-5 py-3 rounded-xl hover:bg-slate-800 transition shadow-sm hover:shadow-md cursor-pointer relative z-50">
              <Building2 className="w-4 h-4 text-emerald-400" />
              Landlord Dashboard
            </Link>
          </nav>

          {/* Mobile Right Icons */}
          <div className="flex md:hidden items-center gap-2 relative z-50">
            <button className="p-2 text-slate-800 hover:bg-slate-100 rounded-full transition">
              <Bell className="w-5 h-5" />
            </button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-800 hover:bg-slate-100 rounded-xl">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="absolute top-16 left-0 w-full bg-white border-b border-slate-200 shadow-xl px-6 py-6 flex flex-col gap-4 md:hidden z-40">
              <span onClick={() => { setPropertyType('All Types'); setMobileMenuOpen(false); window.scrollTo({top: 800, behavior: 'smooth'}); }} className="text-base font-bold text-slate-800 py-2 border-b border-slate-50 cursor-pointer">Find Rentals</span>
              <span className="text-base font-bold text-slate-800 py-2 border-b border-slate-50 cursor-pointer">Favorites</span>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="w-full text-center font-bold bg-slate-900 text-white py-3 rounded-xl shadow-md cursor-pointer block relative z-50">
                Landlord Dashboard
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-white pt-6 pb-12 md:pt-14 md:pb-20">
        
        {/* BACKGROUND IMAGE WITH DESKTOP-ONLY REFINED GRADIENT OVERLAY */}
        <div className="absolute top-0 right-0 w-full sm:w-[80%] md:w-[60%] h-full z-0 pointer-events-none">
          <img 
            src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=1200" 
            alt="Interior Background" 
            className="w-full h-full object-cover object-right-bottom"
          />
          <div className="absolute top-0 left-0 w-full md:w-[30%] h-full bg-gradient-to-r from-white via-white/70 to-transparent" />
        </div>

        {/* HERO CONTENT */}
        <div className="max-w-[1600px] mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-full sm:max-w-md md:max-w-xl lg:max-w-2xl text-left">
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.4 }}
            >
              <h1 className="text-[32px] leading-[1.15] sm:text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-3">
                <span className="text-[#0d141c]">Find Rentals</span> <br />
                <span className="text-[#059669]">10X Faster</span>
              </h1>
              <p className="text-[#475569] font-medium text-sm sm:text-sm md:text-lg lg:text-xl leading-[1.5] max-w-[320px] sm:max-w-none">
                Discover verified rental apartments, dynamic condominiums, and residential boarding rooms seamlessly.
              </p>
            </motion.div>
          </div>
        </div>

      </section>

      {/* SLIM & ORGANIZED SEARCH BAR */}
      <section className="max-w-4xl mx-auto px-5 mt-6 md:mt-8 mb-6 md:mb-10 relative z-20">
        <motion.form 
          onSubmit={handleApplyFilters} 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1, duration: 0.5 }} 
          className="bg-white p-2 md:p-2.5 rounded-2xl border border-slate-200/80 shadow-md shadow-slate-200/50 flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3"
        >
          {/* LOCATION INPUT */}
          <div className="flex items-center w-full gap-2 flex-1 min-w-0" ref={locDropdownRef}>
            <div 
              onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
              className="flex items-center gap-3 px-3.5 md:px-5 py-2 border-b-0 md:border-r border-slate-100 cursor-pointer hover:bg-slate-50/80 rounded-xl transition duration-150 select-none flex-1 min-w-0"
            >
              <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
              <div className="flex-1 text-left min-w-0">
                <label className="hidden md:block text-[9px] font-black uppercase tracking-wider text-slate-400">Location</label>
                {/* Mobile Input */}
                <input 
                  value={search} 
                  onChange={(e) => {
                    setSearch(e.target.value);
                    if (!locationDropdownOpen) setLocationDropdownOpen(true);
                  }} 
                  type="text" 
                  placeholder="Where do you want to live?" 
                  className="md:hidden w-full bg-transparent text-xs font-medium text-slate-800 placeholder-slate-400 outline-none truncate" 
                />
                {/* Desktop Input */}
                <input 
                  value={search} 
                  onChange={(e) => {
                    setSearch(e.target.value);
                    if (!locationDropdownOpen) setLocationDropdownOpen(true);
                  }} 
                  type="text" 
                  placeholder="Enter Location" 
                  className="hidden md:block w-full bg-transparent text-xs font-bold text-slate-800 placeholder-slate-400 outline-none truncate" 
                />
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 hidden md:block ${locationDropdownOpen ? 'rotate-180' : ''}`} />
            </div>

            {/* Mobile Action Button */}
            <button 
              type="submit" 
              className="md:hidden bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-xl flex items-center justify-center transition shrink-0 shadow-md shadow-emerald-600/30"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>

          {/* Location Flow Dropdown */}
          <AnimatePresence>
            {locationDropdownOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.15 }}
                className="absolute left-4 right-4 md:left-0 md:right-0 top-full mt-2 min-w-[280px] md:min-w-[340px] bg-white rounded-2xl shadow-2xl border border-slate-200/80 z-50 p-4"
              >
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-3">
                  {locStep !== 'region' && (
                    <button 
                      type="button" 
                      onClick={goBackLocStep} 
                      className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition shrink-0"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  )}
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate flex items-center gap-1">
                    <span className={locStep === 'region' ? 'text-emerald-600 font-extrabold' : ''}>PH</span>
                    {selectedRegion && (
                      <>
                        <span>/</span>
                        <span className={locStep === 'province' ? 'text-emerald-600 font-extrabold' : ''}>{selectedRegion.name}</span>
                      </>
                    )}
                    {selectedProvince && (
                      <>
                        <span>/</span>
                        <span className={locStep === 'city' ? 'text-emerald-600 font-extrabold' : ''}>{selectedProvince.name}</span>
                      </>
                    )}
                    {selectedCity && (
                      <>
                        <span>/</span>
                        <span className={locStep === 'barangay' ? 'text-emerald-600 font-extrabold' : ''}>{selectedCity.name}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                  {isLoadingLocs ? (
                    <div className="py-6 text-center text-xs font-semibold text-slate-400 flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      <span>Loading locations...</span>
                    </div>
                  ) : (
                    <>
                      {locStep === 'region' && (
                        <>
                          <div className="text-[10px] font-bold text-slate-400 mb-2 px-1">Select Region:</div>
                          {regionsList.map((region) => (
                            <button
                              type="button"
                              key={region.code}
                              onClick={() => handleSelectRegion(region)}
                              className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition duration-150 flex items-center justify-between"
                            >
                              <span>{region.name}</span>
                              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                                {region.regionName}
                              </span>
                            </button>
                          ))}
                        </>
                      )}

                      {locStep === 'province' && selectedRegion && (
                        <>
                          <div className="text-[10px] font-bold text-slate-400 mb-2 px-1">Select Province:</div>
                          {provincesList.map((province) => (
                            <button
                              type="button"
                              key={province.code}
                              onClick={() => handleSelectProvince(province)}
                              className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition duration-150 flex items-center justify-between"
                            >
                              <span>{province.name}</span>
                            </button>
                          ))}
                        </>
                      )}

                      {locStep === 'city' && selectedRegion && (
                        <>
                          <div className="text-[10px] font-bold text-slate-400 mb-2 px-1">Select City / Municipality:</div>
                          {citiesList.map((city) => (
                            <button
                              type="button"
                              key={city.code}
                              onClick={() => handleSelectCity(city)}
                              className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition duration-150 flex items-center justify-between"
                            >
                              <span>{city.name}</span>
                            </button>
                          ))}
                        </>
                      )}

                      {locStep === 'barangay' && selectedCity && (
                        <>
                          <div className="text-[10px] font-bold text-slate-400 mb-2 px-1">Select Barangay:</div>
                          {barangaysList.map((brgy) => (
                            <button
                              type="button"
                              key={brgy.code}
                              onClick={() => handleSelectBarangay(brgy)}
                              className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:text-white hover:bg-emerald-600 rounded-xl transition duration-150"
                            >
                              {brgy.name}
                            </button>
                          ))}
                        </>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ORGANIZED PROPERTY TYPE FIELD */}
          <div className="hidden md:flex relative min-w-[200px]" ref={dropdownRef}>
            <div 
              onClick={() => setPropertyDropdownOpen(!propertyDropdownOpen)}
              className="flex items-center gap-3 px-4 py-2 border-r border-slate-100 cursor-pointer hover:bg-slate-50/80 rounded-xl transition duration-150 select-none w-full"
            >
              <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-1.5">
                  <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 whitespace-nowrap">Property Type</label>
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 shrink-0 ${propertyDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
                <span className="block text-xs font-bold text-slate-800 truncate">
                  {propertyType}
                </span>
              </div>
            </div>

            <AnimatePresence>
              {propertyDropdownOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 mt-2 min-w-[210px] bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 p-1.5 overflow-hidden"
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
                        className={`w-full text-left px-4 py-2 text-xs font-bold rounded-xl transition-all duration-150 flex items-center justify-between ${
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
            className="hidden md:flex bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-6 py-3 rounded-xl items-center justify-center gap-2 transition duration-200 cursor-pointer shadow-md shadow-emerald-600/20 shrink-0"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Apply Filters</span>
          </button>
        </motion.form>
      </section>

      {/* CATEGORY SELECTOR SECTION */}
      <section className="max-w-[1600px] mx-auto px-5 sm:px-6 lg:px-8 mb-10">
        <div className="hidden md:flex items-center justify-center gap-2 flex-wrap">
          {propertyTypes.filter(t => t.label !== 'All Types').map((type) => {
            const isSelected = propertyType === type.label;
            return (
              <button
                key={`desktop-${type.label}`}
                onClick={() => setPropertyType(isSelected ? 'All Types' : type.label)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold transition-all duration-150 border cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                    : 'bg-white border-slate-200/80 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <type.icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                <span>{type.label}</span>
              </button>
            )
          })}
        </div>

        {/* MOBILE UI ONLY */}
        <div className="grid md:hidden grid-cols-5 gap-2.5 sm:gap-4 max-w-2xl mx-auto">
          {propertyTypes.filter(t => t.label !== 'All Types').map((type) => {
            const isSelected = propertyType === type.label;
            return (
              <button
                key={`mobile-${type.label}`}
                onClick={() => setPropertyType(isSelected ? 'All Types' : type.label)}
                className={`flex flex-col items-center justify-center py-3.5 px-1.5 sm:py-4 sm:px-2 rounded-2xl transition-all duration-200 border ${
                  isSelected
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                    : 'bg-white border-slate-100 text-slate-800 hover:bg-slate-50 shadow-sm'
                }`}
              >
                <div className={`p-2 sm:p-2.5 rounded-xl flex items-center justify-center mb-1.5 sm:mb-2.5 ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  <type.icon className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-bold text-center leading-tight">{type.label}</span>
              </button>
            )
          })}
        </div>

      </section>

      {/* FEATURED & AVAILABLE LISTINGS */}
      <main className="max-w-[1600px] mx-auto px-5 sm:px-6 lg:px-8 space-y-12 mb-24">
        {isLoading ? (
          <div className="w-full text-center py-24 text-slate-500 font-bold text-sm flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading rental properties...</span>
          </div>
        ) : (
          <>
            {/* FEATURED SECTION */}
            {featuredItems.length > 0 && (
              <div>
                <div className="mb-3 sm:mb-4 flex items-center justify-between">
                  <h2 className="text-lg md:text-2xl font-black text-slate-900 tracking-tight">Featured Listings</h2>
                  <button onClick={() => setPropertyType('All Types')} className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition">
                    View All <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex md:grid overflow-x-auto md:overflow-visible gap-2.5 sm:gap-4 md:gap-6 pb-3 md:pb-0 scrollbar-none -mx-5 px-5 md:mx-0 md:px-0 grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4">
                  {featuredItems.map((p) => {
                    const img = getDisplayImage(p)
                    const isFav = !!favorites[p.id]

                    return (
                      <Link 
                        key={`featured-${p.id}`} 
                        href={`/property/${p.id}`}
                        className="group bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full w-full max-w-[155px] sm:max-w-none justify-self-start shrink-0 md:shrink"
                      >
                        <div className="w-full aspect-[4/3] bg-slate-100 relative overflow-hidden shrink-0">
                          <span className="absolute top-2 left-2 z-20 text-[9px] sm:text-[10px] font-bold text-white bg-emerald-600/90 backdrop-blur-md px-1.5 py-0.5 rounded-md shadow-sm">
                            For Rent
                          </span>

                          <button
                            onClick={(e) => toggleFavorite(p.id, e)}
                            className="absolute top-2 right-2 z-20 bg-white/80 hover:bg-white text-slate-700 p-1.5 rounded-full backdrop-blur-md transition-all shadow-sm"
                          >
                            <Heart className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isFav ? 'fill-red-500 text-red-500' : 'text-slate-600'}`} />
                          </button>

                          {img ? (
                            <img 
                              src={img} 
                              alt={p.title} 
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                              loading="lazy" 
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-semibold">No Image</div>
                          )}
                        </div>

                        <div className="p-2.5 sm:p-3.5 flex flex-col justify-between flex-grow space-y-1.5">
                          <div>
                            <h3 className="text-[11px] sm:text-xs md:text-sm font-bold text-slate-900 truncate leading-tight">{p.title}</h3>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 font-medium">
                              <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" /> 
                              <span className="truncate">{p.address || p.manual_address || `${p.city || ''}, ${p.province || ''}`}</span>
                            </div>

                            <div className="text-xs sm:text-sm md:text-base font-black text-emerald-600 mt-1">
                              ₱{p.price?.toLocaleString()}
                              <span className="text-[9px] sm:text-[10px] font-normal text-slate-400">
                                / {p.price_type === 'daily' || p.price_type === 'day' || p.price_type === 'per_day' ? 'day' : 'month'}
                              </span>
                            </div>
                          </div>

                          <div className="pt-1.5 border-t border-slate-50 flex items-center justify-between text-[10px] font-semibold text-slate-500">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-0.5">
                                <Bed className="w-3 h-3 text-slate-400" />
                                <span>{p.bedrooms ?? 1}</span>
                              </div>
                              <div className="flex items-center gap-0.5">
                                <Bath className="w-3 h-3 text-slate-400" />
                                <span>{p.bathrooms ?? 1}</span>
                              </div>
                            </div>

                            <button
                              onClick={(e) => openReportModal(p, e)}
                              className="text-slate-300 hover:text-red-500 transition-colors p-0.5"
                              title="Report Listing"
                            >
                              <Flag className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ALL AVAILABLE PROPERTIES */}
            <div>
              <div className="mb-3 sm:mb-6">
                <h2 className="text-lg md:text-2xl font-black text-slate-900 tracking-tight">Latest Available Rental Units</h2>
                <p className="text-[10px] sm:text-xs font-semibold text-slate-400 mt-0.5">
                  Showing {regularItems.length} active matching options found
                </p>
              </div>

              {regularItems.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
                  {regularItems.map((p) => {
                    const img = getDisplayImage(p)
                    const isFav = !!favorites[p.id]

                    return (
                      <Link 
                        key={p.id} 
                        href={`/property/${p.id}`}
                        className="group bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full w-full max-w-[155px] sm:max-w-none justify-self-start"
                      >
                        <div className="w-full aspect-[4/3] bg-slate-100 relative overflow-hidden shrink-0">
                          <span className="absolute top-2 left-2 z-20 text-[9px] sm:text-[10px] font-bold text-white bg-emerald-600/90 backdrop-blur-md px-1.5 py-0.5 rounded-md shadow-sm">
                            For Rent
                          </span>

                          <button
                            onClick={(e) => toggleFavorite(p.id, e)}
                            className="absolute top-2 right-2 z-20 bg-white/80 hover:bg-white text-slate-700 p-1.5 rounded-full backdrop-blur-md transition-all shadow-sm"
                          >
                            <Heart className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isFav ? 'fill-red-500 text-red-500' : 'text-slate-600'}`} />
                          </button>

                          {img ? (
                            <img 
                              src={img} 
                              alt={p.title} 
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                              loading="lazy" 
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-semibold">No Image</div>
                          )}
                        </div>

                        <div className="p-2.5 sm:p-3.5 flex flex-col justify-between flex-grow space-y-1.5">
                          <div>
                            <h3 className="text-[11px] sm:text-xs md:text-sm font-bold text-slate-900 truncate leading-tight">{p.title}</h3>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 font-medium">
                              <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" /> 
                              <span className="truncate">{p.address || p.manual_address || `${p.city || ''}, ${p.province || ''}`}</span>
                            </div>

                            <div className="text-xs sm:text-sm md:text-base font-black text-emerald-600 mt-1">
                              ₱{p.price?.toLocaleString()}
                              <span className="text-[9px] sm:text-[10px] font-normal text-slate-400">
                                / {p.price_type === 'daily' || p.price_type === 'day' || p.price_type === 'per_day' ? 'day' : 'month'}
                              </span>
                            </div>
                          </div>

                          <div className="pt-1.5 border-t border-slate-50 flex items-center justify-between text-[10px] font-semibold text-slate-500">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-0.5">
                                <Bed className="w-3 h-3 text-slate-400" />
                                <span>{p.bedrooms ?? 1}</span>
                              </div>
                              <div className="flex items-center gap-0.5">
                                <Bath className="w-3 h-3 text-slate-400" />
                                <span>{p.bathrooms ?? 1}</span>
                              </div>
                            </div>

                            <button
                              onClick={(e) => openReportModal(p, e)}
                              className="text-slate-300 hover:text-red-500 transition-colors p-0.5"
                              title="Report Listing"
                            >
                              <Flag className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <div className="w-full text-center py-20 bg-white rounded-3xl border border-slate-100 flex flex-col items-center justify-center gap-3 shadow-sm">
                  <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mb-1">
                    <Search className="w-7 h-7 text-slate-300" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">No properties found</h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                    We couldn't find any rental units matching your filters. Try clearing your search parameters.
                  </p>
                  <button 
                    onClick={() => {
                      setSearch('');
                      setPropertyType('All Types');
                      resetLocFlow();
                    }}
                    className="mt-2 px-5 py-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-bold text-xs rounded-full transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* REPORT MODAL */}
      <AnimatePresence>
        {reportModalOpen && selectedPropertyForReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 relative overflow-hidden"
            >
              <button 
                onClick={() => setReportModalOpen(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {reportSuccess ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Report Submitted</h3>
                  <p className="text-xs text-slate-500">Thank you for helping keep our marketplace safe and accurate.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReport} className="space-y-4">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900">Report Listing</h3>
                    <p className="text-xs font-medium text-slate-500 line-clamp-1 mt-0.5">
                      {selectedPropertyForReport.title}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Reason</label>
                    <select 
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500 transition"
                    >
                      <option value="Inaccurate Information">Inaccurate Information / Wrong Price</option>
                      <option value="Spam or Scam">Spam or Scam Listing</option>
                      <option value="Property Unavailable">Property Already Rented / Unavailable</option>
                      <option value="Inappropriate Content">Inappropriate Photos or Text</option>
                      <option value="Other">Other Reason</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Details (Optional)</label>
                    <textarea 
                      rows={3}
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      placeholder="Briefly describe the issue..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 transition resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Your Email (Optional)</label>
                    <input 
                      type="email"
                      value={reporterEmail}
                      onChange={(e) => setReporterEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 transition"
                    />
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setReportModalOpen(false)}
                      className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingReport}
                      className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition disabled:opacity-50"
                    >
                      {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}