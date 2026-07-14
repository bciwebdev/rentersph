'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { 
  FileText, MapPin, Phone, Image, ArrowRight, LogOut, HelpCircle, Upload, X, Plus, Building2, Layers
} from 'lucide-react'

// Layout/View Toggles
type ViewState = 'dashboard' | 'create'

export default function LandlordPortalPage() {
  const router = useRouter()
  
  const [supabase] = useState(() => 
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  )
  
  // Route Protection & Dynamic Data States
  const [sessionLoading, setSessionLoading] = useState(true)
  const [propertiesLoading, setPropertiesLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [myProperties, setMyProperties] = useState<any[]>([])
  const [currentView, setCurrentView] = useState<ViewState>('dashboard')
  
  // Base Form States
  const [title, setTitle] = useState('')
  const [propertyType, setPropertyType] = useState('Apartment')
  const [price, setPrice] = useState('')
  const [bedrooms, setBedrooms] = useState('1')
  const [bathrooms, setBathrooms] = useState('1')
  const [area, setArea] = useState('30')
  const [restroomPrivacy, setRestroomPrivacy] = useState('Private (Own Toilet)')
  const [bathroomPrivacy, setBathroomPrivacy] = useState('Private (Own Shower)')
  
  const [manualAddress, setManualAddress] = useState('')
  const [plusCode, setPlusCode] = useState('')
  
  const [contactNumber, setContactNumber] = useState('')
  const [emailAddress, setEmailAddress] = useState('')
  
  const [descriptionRules, setDescriptionRules] = useState('')
  
  // File Upload State
  const [selectedFiles, setSelectedFiles] = useState<{ file: File; previewUrl: string }[]>([])

  // Pricing, Boosting, & Tooltip States
  const BASE_PRICE = 20
  const [boostingOption, setBoostingOption] = useState('none') 
  const [showTooltip, setShowTooltip] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Verify Auth Session and Load Personal Listings
  useEffect(() => {
    const initializePortal = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error || !user) {
          router.push('/login')
          return
        }
        
        setUserId(user.id)
        setEmailAddress(user.email || '')
        setSessionLoading(false)
        
        // Fetch properties matching this specific logged-in landlord
        const { data: properties, error: dbError } = await supabase
          .from('properties')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (!dbError && properties) {
          setMyProperties(properties)
        }
      } catch (err) {
        router.push('/login')
      } finally {
        setPropertiesLoading(false)
      }
    }
    initializePortal()
  }, [router, supabase])

  const getBoostingPrice = () => {
    if (boostingOption === '5days') return 49
    if (boostingOption === '2weeks') return 99
    if (boostingOption === '1month') return 199
    return 0
  }
  const totalAmount = BASE_PRICE + getBoostingPrice()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const filesArray = Array.from(e.target.files)
    
    if (selectedFiles.length + filesArray.length > 10) {
      setErrorMessage('You can only upload a maximum of 10 photos per listing.')
      return
    }

    const newSelections = filesArray.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file)
    }))

    setSelectedFiles(prev => [...prev, ...newSelections])
    setErrorMessage(null)
  }

  const handleRemoveImage = (index: number) => {
    URL.revokeObjectURL(selectedFiles[index].previewUrl)
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const resetForm = () => {
    setTitle('')
    setPropertyType('Apartment')
    setPrice('')
    setBedrooms('1')
    setBathrooms('1')
    setArea('30')
    setRestroomPrivacy('Private (Own Toilet)')
    setBathroomPrivacy('Private (Own Shower)')
    setManualAddress('')
    setPlusCode('')
    setContactNumber('')
    setDescriptionRules('')
    setSelectedFiles([])
    setBoostingOption('none')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)

    const parsedPrice = parseInt(price, 10) || 0
    const uploadedImageUrls: string[] = []

    try {
      for (const item of selectedFiles) {
        const fileExt = item.file.name.split('.').pop()
        const fileName = `${Math.random()}_${Date.now()}.${fileExt}`
        const filePath = `listings/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(filePath, item.file)

        if (uploadError) throw new Error(`Storage upload error: ${uploadError.message}`)

        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(filePath)

        uploadedImageUrls.push(publicUrl)
      }

      const { error: dbError } = await supabase
        .from('properties')
        .insert([
          {
            user_id: userId,
            title: title.trim(),
            property_type: propertyType,
            price: parsedPrice, 
            bedrooms: parseInt(bedrooms, 10) || 0,
            bathrooms: parseInt(bathrooms, 10) || 0,
            area_sqm: parseFloat(area) || 0,
            restroom_privacy: restroomPrivacy,
            bathroom_privacy: bathroomPrivacy,
            manual_address: manualAddress.trim(),
            address: manualAddress.trim(),
            plus_code: plusCode.trim() || null,
            contact_number: contactNumber.trim(),
            email_address: emailAddress.trim(),
            description_rules: descriptionRules.trim(),
            images: uploadedImageUrls.length > 0 ? uploadedImageUrls : null,
            boosting_tier: boostingOption,
            total_payable: totalAmount,
            status: 'pending'
          }
        ])

      if (dbError) throw new Error(dbError.message)
      router.push(`/landlord/payment?total=${totalAmount}`)

    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-[#fcfdfe] flex items-center justify-center font-sans">
        <div className="text-center space-y-2">
          <div className="w-5 h-5 border-2 border-[#00aa4f] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verifying Landlord Account Session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fcfdfe] text-[#1e293b] antialiased font-sans pb-16">
      
      {/* Dynamic Navigation Header */}
      <header className="max-w-4xl mx-auto px-4 pt-8 pb-6 flex justify-between items-center border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#0f172a]">
            {currentView === 'dashboard' ? 'Landlord Dashboard' : 'Create Rental Listing'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {currentView === 'dashboard' ? 'Manage your registered active property profiles.' : 'Fill out the details below to add your unit to rentersPH.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {currentView === 'create' && (
            <button 
              type="button" 
              onClick={() => { setCurrentView('dashboard'); resetForm(); }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer"
            >
              Back to Dashboard
            </button>
          )}
          <button 
            type="button" 
            onClick={handleSignOut}
            className="bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-8">
        
        {/* ================= VIEW 1: LANDLORD DASHBOARD LISTINGS ================= */}
        {currentView === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white border border-[#f1f5f9] p-5 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
              <div>
                <h3 className="text-sm font-black text-slate-800">Your Active Portfolio</h3>
                <p className="text-xs text-slate-400">Total Properties Registered: {myProperties.length}</p>
              </div>
              <button
                type="button"
                onClick={() => setCurrentView('create')}
                className="bg-[#00aa4f] hover:bg-[#009444] text-white font-bold text-xs px-4 py-3 rounded-xl flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add New Listing
              </button>
            </div>

            {propertiesLoading ? (
              <div className="text-center py-12 text-slate-400 text-xs font-bold uppercase tracking-widest">
                Fetching structural items...
              </div>
            ) : myProperties.length === 0 ? (
              <div className="border border-dashed border-slate-200 rounded-3xl p-16 text-center space-y-3 bg-white">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-[#00aa4f]">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-black text-slate-700">No properties documented yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">You have not posted any rental offerings under this account workspace. Click the button above to begin.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myProperties.map((property) => (
                  <div key={property.id} className="bg-white border border-[#f1f5f9] rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex flex-col justify-between">
                    <div>
                      {property.images && property.images.length > 0 ? (
                        <img src={property.images[0]} alt="Property image" className="w-full h-40 object-cover" />
                      ) : (
                        <div className="w-full h-40 bg-slate-50 flex items-center justify-center text-slate-300">
                          <Image className="w-8 h-8" />
                        </div>
                      )}
                      <div className="p-5 space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-sm font-black text-slate-800 line-clamp-1">{property.title}</h4>
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            property.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {property.status || 'pending'}
                          </span>
                        </div>
                        <p className="text-xs font-black text-[#00aa4f]">₱{property.price.toLocaleString()} / mo</p>
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                          <span className="truncate">{property.manual_address}</span>
                        </div>
                      </div>
                    </div>
                    <div className="px-5 pb-5 pt-2 border-t border-slate-50 flex items-center justify-between text-[11px] font-semibold text-slate-400">
                      <span>{property.property_type}</span>
                      <span>{property.bedrooms} BR · {property.bathrooms} BA</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= VIEW 2: ORIGINAL CREATE LISTING FORM ================= */}
        {currentView === 'create' && (
          <form onSubmit={handleSubmit} className="space-y-8">
            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold p-4 rounded-xl">
                {errorMessage}
              </div>
            )}

            {/* 1. CORE SPECIFICATIONS */}
            <div className="space-y-3">
              <h2 className="text-xs font-black tracking-wider text-[#64748b] uppercase flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#00aa4f]" /> 1. Core Specifications
              </h2>
              <div className="bg-white border border-[#f1f5f9] rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.01)] space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black tracking-wider text-[#64748b] uppercase">Listing Title</label>
                  <input 
                    type="text" required placeholder="e.g. Modern Minimalist Studio near SM" value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#00aa4f] transition placeholder:text-slate-300"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black tracking-wider text-[#64748b] uppercase">Property Type</label>
                    <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#00aa4f] text-slate-600 transition">
                      <option value="Apartment">Apartment</option>
                      <option value="Condominium">Condominium</option>
                      <option value="House">House</option>
                      <option value="Bedspace">Bedspace</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black tracking-wider text-[#64748b] uppercase">Price (PHP / MO)</label>
                    <input 
                      type="number" required placeholder="18500" value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#00aa4f] transition placeholder:text-slate-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black tracking-wider text-[#64748b] uppercase">Bedrooms</label>
                    <input type="number" min="0" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#00aa4f] transition" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black tracking-wider text-[#64748b] uppercase">Bathrooms</label>
                    <input type="number" min="0" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#00aa4f] transition" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black tracking-wider text-[#64748b] uppercase">Area (SQM)</label>
                    <input type="number" min="1" value={area} onChange={(e) => setArea(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#00aa4f] transition" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black tracking-wider text-[#64748b] uppercase">Restroom Privacy</label>
                    <select value={restroomPrivacy} onChange={(e) => setRestroomPrivacy(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#00aa4f] text-slate-600 transition">
                      <option value="Private (Own Toilet)">Private (Own Toilet)</option>
                      <option value="Shared Restroom">Shared Restroom</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black tracking-wider text-[#64748b] uppercase">Bathroom Privacy</label>
                    <select value={bathroomPrivacy} onChange={(e) => setBathroomPrivacy(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#00aa4f] text-slate-600 transition">
                      <option value="Private (Own Shower)">Private (Own Shower)</option>
                      <option value="Shared Bathroom">Shared Bathroom</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. ADDRESS LOCATION */}
            <div className="space-y-3">
              <h2 className="text-xs font-black tracking-wider text-[#64748b] uppercase flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#00aa4f]" /> 2. Address Location
              </h2>
              <div className="bg-white border border-[#f1f5f9] rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.01)] grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black tracking-wider text-[#64748b] uppercase">Manual Address</label>
                  <input 
                    type="text" required placeholder="Ecoland, Davao City" value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#00aa4f] transition placeholder:text-slate-300"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black tracking-wider text-[#64748b] uppercase">Google Maps Plus Code (Optional)</label>
                  <input 
                    type="text" placeholder="e.g. VFF7+HQ Davao City" value={plusCode}
                    onChange={(e) => setPlusCode(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#00aa4f] transition placeholder:text-slate-300"
                  />
                </div>
              </div>
            </div>

            {/* 3. CONTACT PARAMETERS */}
            <div className="space-y-3">
              <h2 className="text-xs font-black tracking-wider text-[#64748b] uppercase flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-[#00aa4f]" /> 3. Contact Parameters
              </h2>
              <div className="bg-white border border-[#f1f5f9] rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.01)] grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black tracking-wider text-[#64748b] uppercase">Contact Number</label>
                  <input 
                    type="tel" required placeholder="0917XXXXXXX" value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#00aa4f] transition placeholder:text-slate-300"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black tracking-wider text-[#64748b] uppercase">Email Address</label>
                  <input 
                    type="email" required placeholder="landlord@email.com" value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#00aa4f] transition placeholder:text-slate-300"
                  />
                </div>
              </div>
            </div>

            {/* 4. DETAILED DESCRIPTION & RULES */}
            <div className="space-y-3">
              <h2 className="text-xs font-black tracking-wider text-[#64748b] uppercase flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#00aa4f]" /> 4. Detailed Description & Rules
              </h2>
              <div className="bg-white border border-[#f1f5f9] rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black tracking-wider text-[#64748b] uppercase">Property Description & Rules</label>
                  <textarea 
                    rows={5} placeholder="Provide details about payment terms, utilities, and roommate rules..." value={descriptionRules}
                    onChange={(e) => setDescriptionRules(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#00aa4f] transition resize-none placeholder:text-slate-300 leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* 5. HIGH-RES PRESENTATION MEDIA */}
            <div className="space-y-3">
              <h2 className="text-xs font-black tracking-wider text-[#64748b] uppercase flex items-center gap-1.5">
                <Image className="w-4 h-4 text-[#00aa4f]" /> 5. High-Res Presentation Media
              </h2>
              <div className="bg-white border border-[#f1f5f9] rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.01)] space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-black tracking-wider text-[#64748b] uppercase">Upload Property Presentation Photos (Max 10)</label>
                    <span className="text-[11px] text-slate-400 font-medium">{selectedFiles.length}/10 uploaded</span>
                  </div>
                  
                  <label className="border-2 border-dashed border-slate-200 hover:border-[#00aa4f] rounded-xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer transition bg-slate-50/30">
                    <Upload className="w-6 h-6 text-slate-400" />
                    <span className="text-xs font-bold text-slate-600">Click to select files from your device</span>
                    <span className="text-[10px] text-slate-400">Supports PNG, JPG, JPEG up to 10 photos total</span>
                    <input 
                      type="file" multiple accept="image/*" onChange={handleFileChange}
                      disabled={selectedFiles.length >= 10} className="hidden" 
                    />
                  </label>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                    {selectedFiles.map((item, idx) => (
                      <div key={idx} className="relative aspect-square border rounded-xl overflow-hidden group bg-slate-50">
                        <img src={item.previewUrl} alt="local preview" className="w-full h-full object-cover" />
                        <button 
                          type="button" onClick={() => handleRemoveImage(idx)} 
                          className="absolute top-1 right-1 bg-slate-900/80 hover:bg-rose-600 text-white rounded-full p-1 transition"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 6. LISTING PACKAGE & VISIBILITY RANK */}
            <div className="space-y-3">
              <h2 className="text-xs font-black tracking-wider text-[#64748b] uppercase flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#00aa4f]" /> 6. Listing Package & Visibility Rank
              </h2>
              <div className="bg-white border border-[#f1f5f9] rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.01)] space-y-5">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center relative">
                    <label className="text-[10px] font-black tracking-wider text-[#64748b] uppercase">Required Base Posting Plan</label>
                    <div 
                      className="relative"
                      onMouseEnter={() => setShowTooltip(true)}
                      onMouseLeave={() => setShowTooltip(false)}
                    >
                      <span className="text-[11px] text-[#00aa4f] font-bold flex items-center gap-0.5 cursor-help">
                        What is boosting? <HelpCircle className="w-3 h-3" />
                      </span>
                      {showTooltip && (
                        <div className="absolute right-0 bottom-6 w-64 bg-slate-900 text-white text-[11px] font-medium p-3 rounded-xl shadow-xl z-50 leading-relaxed pointer-events-none">
                          Boosting increases your listing's priority score, moving it directly to the top of prospective renters' feeds for maximum exposure and faster inquiries.
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-white border-2 border-[#00aa4f] rounded-xl px-4 py-3 text-xs text-slate-700 font-bold">
                    Standard Listing — ₱20 (Active for 30 Days)
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-wider text-[#64748b] uppercase block">Optional Visibility Boosting Rank Upgrades</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <label className={`border rounded-xl p-3.5 flex items-center justify-between cursor-pointer transition ${boostingOption === 'none' ? 'border-slate-900 bg-slate-50/50' : 'border-slate-200'}`}>
                      <div className="flex items-center gap-2.5">
                        <input type="radio" name="boosting" value="none" checked={boostingOption === 'none'} onChange={(e) => setBoostingOption(e.target.value)} className="accent-slate-900" />
                        <span className="text-xs font-bold text-slate-700">No Boost Upgrade</span>
                      </div>
                      <span className="text-xs font-medium text-slate-400">₱0</span>
                    </label>

                    <label className={`border rounded-xl p-3.5 flex items-center justify-between cursor-pointer transition ${boostingOption === '5days' ? 'border-[#00aa4f] bg-emerald-50/20' : 'border-slate-200'}`}>
                      <div className="flex items-center gap-2.5">
                        <input type="radio" name="boosting" value="5days" checked={boostingOption === '5days'} onChange={(e) => setBoostingOption(e.target.value)} className="accent-[#00aa4f]" />
                        <span className="text-xs font-bold text-slate-700">5-Day Hot Boost</span>
                      </div>
                      <span className="text-xs font-bold text-[#00aa4f]">+ ₱49</span>
                    </label>

                    <label className={`border rounded-xl p-3.5 flex items-center justify-between cursor-pointer transition ${boostingOption === '2weeks' ? 'border-[#00aa4f] bg-emerald-50/20' : 'border-slate-200'}`}>
                      <div className="flex items-center gap-2.5">
                        <input type="radio" name="boosting" value="2weeks" checked={boostingOption === '2weeks'} onChange={(e) => setBoostingOption(e.target.value)} className="accent-[#00aa4f]" />
                        <span className="text-xs font-bold text-slate-700">2-Week Visibility Surge</span>
                      </div>
                      <span className="text-xs font-bold text-[#00aa4f]">+ ₱99</span>
                    </label>

                    <label className={`border rounded-xl p-3.5 flex items-center justify-between cursor-pointer transition ${boostingOption === '1month' ? 'border-[#00aa4f] bg-emerald-50/20' : 'border-slate-200'}`}>
                      <div className="flex items-center gap-2.5">
                        <input type="radio" name="boosting" value="1month" checked={boostingOption === '1month'} onChange={(e) => setBoostingOption(e.target.value)} className="accent-[#00aa4f]" />
                        <span className="text-xs font-bold text-slate-700">1-Month Market Domination</span>
                      </div>
                      <span className="text-xs font-bold text-[#00aa4f]">+ ₱199</span>
                    </label>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium mt-2">* Standard tier active timeline begins immediately upon payment verification completion.</p>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex justify-between items-center text-slate-700">
                  <span className="text-xs font-bold">Total Estimated Statement Amount:</span>
                  <span className="text-sm font-black text-[#00aa4f]">₱{totalAmount}.00</span>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#00aa4f] hover:bg-[#009444] text-white font-bold text-xs py-4 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? 'Uploading photos & details...' : 'Proceed to Payment Allocation'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

      </main>
    </div>
  )
}