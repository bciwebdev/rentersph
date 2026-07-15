'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { 
  FileText, MapPin, Phone, Image as ImageIcon, ArrowRight, LogOut, HelpCircle, Upload, X, Plus, Building2, RefreshCw, Trash2, Zap
} from 'lucide-react'

type ViewState = 'dashboard' | 'create'

interface SelectedFile {
  file: File
  previewUrl: string
}

function calculateDaysLeft(expiresAtString: string | null): number {
  if (!expiresAtString) return 30
  
  const expiryDate = new Date(expiresAtString)
  const today = new Date()
  
  const diffTime = expiryDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays > 0 ? diffDays : 0
}

export default function LandlordPortalPage() {
  const router = useRouter()
  
  const [supabase] = useState(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      console.error("Supabase environment variables are missing!")
    }
    return createBrowserClient(url || '', key || '')
  })
  
  const [sessionLoading, setSessionLoading] = useState(true)
  const [propertiesLoading, setPropertiesLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [myProperties, setMyProperties] = useState<any[]>([])
  const [currentView, setCurrentView] = useState<ViewState>('dashboard')
  
  // Hover State Trackers
  const [activeBoostPopoverId, setActiveBoostPopoverId] = useState<string | null>(null)
  const [activeExtendPopoverId, setActiveExtendPopoverId] = useState<string | null>(null)
  
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
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([])

  const BASE_PRICE = 20
  const [boostingOption, setBoostingOption] = useState('none') 
  const [showTooltip, setShowTooltip] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      selectedFiles.forEach(item => URL.revokeObjectURL(item.previewUrl))
    }
  }, [selectedFiles])

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
        setCurrentView('dashboard')
        
        const { data: properties, error: dbError } = await supabase
          .from('properties')
          .select('*')
          .or(`user_id.eq.${user.id},email_address.eq.${user.email}`)
          .order('created_at', { ascending: false })

        if (!dbError && properties) {
          setMyProperties(properties)
        }
      } catch (err) {
        router.push('/login')
      } finally {
        setPropertiesLoading(false)
        setSessionLoading(false)
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

  const handleDeleteProperty = async (propertyId: string) => {
    const isConfirmed = confirm("Are you sure you want to permanently delete this property listing?")
    if (!isConfirmed) return

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId)

      if (error) throw error
      setMyProperties(prev => prev.filter(prop => prop.id !== propertyId))
    } catch (err: any) {
      alert(err.message || "Failed to delete the listing.")
    }
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
    selectedFiles.forEach(item => URL.revokeObjectURL(item.previewUrl))
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

      const calculatedExpiry = new Date()
      calculatedExpiry.setDate(calculatedExpiry.getDate() + 30)

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
            expires_at: calculatedExpiry.toISOString(),
            status: 'pending'
          }
        ])

      if (dbError) throw new Error(dbError.message)
      
      router.refresh()
      router.push(`/landlord/payment?total=${totalAmount}`)

    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fcfdfe] text-[#1e293b] antialiased font-sans pb-16">
      
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
                          <ImageIcon className="w-8 h-8" />
                        </div>
                      )}
                      <div className="p-5 space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-sm font-black text-slate-800 line-clamp-1">{property.title}</h4>
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            property.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {property.status === 'approved' ? 'LIVE ON SITE' : (property.status || 'pending')}
                          </span>
                        </div>
                        <p className="text-xs font-black text-[#00aa4f]">₱{property.price.toLocaleString()} / mo</p>
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                          <span className="truncate">{property.manual_address}</span>
                        </div>

                        <div className="mt-3 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 flex items-center justify-between text-xs font-semibold text-slate-600">
                          <span className="text-slate-400 text-[11px]">Time Remaining:</span>
                          <span className={`font-black flex items-center gap-1 ${
                            calculateDaysLeft(property.expires_at) <= 5 ? 'text-rose-600 animate-pulse' : 'text-slate-700'
                          }`}>
                            {calculateDaysLeft(property.expires_at)} days left
                          </span>
                        </div>

                      </div>
                    </div>
                    
                    <div className="flex flex-col border-t border-slate-50 bg-slate-50/50">
                      <div className="px-5 py-2.5 flex items-center justify-between text-[11px] font-semibold text-slate-400 border-b border-slate-100">
                        <span>{property.property_type}</span>
                        <span>{property.bedrooms} BR · {property.bathrooms} BA</span>
                      </div>
                      
                      {/* ACTION CONTROLS WRAPPER CELL */}
                      <div className="grid grid-cols-3 text-[11px] font-bold relative">
                        
                        {/* EXTEND BUTTON WITH HOVER OPTIONS */}
                        <div 
                          className="relative flex"
                          onMouseEnter={() => setActiveExtendPopoverId(property.id)}
                          onMouseLeave={() => setActiveExtendPopoverId(null)}
                        >
                          <button
                            type="button"
                            className="w-full py-2.5 flex items-center justify-center gap-1 text-slate-600 hover:bg-slate-100 border-r border-slate-100 transition cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                            Extend
                          </button>

                          {activeExtendPopoverId === property.id && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-40 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
                              <p className="text-[10px] uppercase font-black tracking-wider text-slate-400 border-b border-slate-50 pb-1.5 px-1">
                                Extension Options
                              </p>
                              
                              {/* Standard Extension */}
                              <button
                                type="button"
                                onClick={() => router.push(`/landlord/payment?total=20&propertyId=${property.id}&type=extension`)}
                                className="w-full text-left p-2 rounded-xl border border-slate-100 hover:border-[#00aa4f] hover:bg-emerald-50/30 transition flex justify-between items-center group cursor-pointer"
                              >
                                <div>
                                  <p className="text-slate-800 font-black text-xs group-hover:text-[#00aa4f]">Standard 30-Day Extension</p>
                                  <p className="text-[9px] text-slate-400 font-medium">Extend listing presence</p>
                                </div>
                                <span className="text-slate-700 font-black text-[11px]">₱20</span>
                              </button>

                              {/* Nested Boost Upgrades underneath Extend */}
                              <p className="text-[9px] uppercase font-black tracking-wider text-[#00aa4f] pt-1 px-1">
                                Extend with Boost
                              </p>

                              <button
                                type="button"
                                onClick={() => router.push(`/landlord/payment?total=69&propertyId=${property.id}&type=extension&tier=5days`)}
                                className="w-full text-left p-2 rounded-xl border border-slate-100 hover:border-[#00aa4f] hover:bg-emerald-50/30 transition flex justify-between items-center group cursor-pointer"
                              >
                                <div>
                                  <p className="text-slate-800 font-black text-xs group-hover:text-[#00aa4f]">with 5-Day Hot Boost</p>
                                  <p className="text-[9px] text-slate-400 font-medium">Extend + Blitz Promotion</p>
                                </div>
                                <span className="text-[#00aa4f] font-black text-[11px]">₱69</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => router.push(`/landlord/payment?total=119&propertyId=${property.id}&type=extension&tier=2weeks`)}
                                className="w-full text-left p-2 rounded-xl border border-slate-100 hover:border-[#00aa4f] hover:bg-emerald-50/30 transition flex justify-between items-center group cursor-pointer"
                              >
                                <div>
                                  <p className="text-slate-800 font-black text-xs group-hover:text-[#00aa4f]">with 2-Week Visibility Surge</p>
                                  <p className="text-[9px] text-slate-400 font-medium">Extend + Horizon Lift</p>
                                </div>
                                <span className="text-[#00aa4f] font-black text-[11px]">₱119</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => router.push(`/landlord/payment?total=219&propertyId=${property.id}&type=extension&tier=1month`)}
                                className="w-full text-left p-2 rounded-xl border border-slate-100 hover:border-[#00aa4f] hover:bg-emerald-50/30 transition flex justify-between items-center group cursor-pointer"
                              >
                                <div>
                                  <p className="text-slate-800 font-black text-xs group-hover:text-[#00aa4f]">with 1-Month Domination</p>
                                  <p className="text-[9px] text-slate-400 font-medium">Extend + Premium Pinning</p>
                                </div>
                                <span className="text-[#00aa4f] font-black text-[11px]">₱219</span>
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {/* BOOST BUTTON WITH HOVER OPTIONS */}
                        <div 
                          className="relative flex"
                          onMouseEnter={() => setActiveBoostPopoverId(property.id)}
                          onMouseLeave={() => setActiveBoostPopoverId(null)}
                        >
                          <button
                            type="button"
                            className="w-full py-2.5 flex items-center justify-center gap-1 text-[#00aa4f] hover:bg-emerald-50 border-r border-slate-100 transition cursor-pointer"
                          >
                            <Zap className="w-3.5 h-3.5 text-[#00aa4f]" />
                            Boost
                          </button>

                          {activeBoostPopoverId === property.id && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-40 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
                              <p className="text-[10px] uppercase font-black tracking-wider text-slate-400 border-b border-slate-50 pb-1.5 px-1">
                                Optional Visibility Rank Upgrades
                              </p>
                              
                              <button
                                type="button"
                                onClick={() => router.push(`/landlord/payment?total=49&propertyId=${property.id}&type=boost&tier=5days`)}
                                className="w-full text-left p-2 rounded-xl border border-slate-100 hover:border-[#00aa4f] hover:bg-emerald-50/30 transition flex justify-between items-center group cursor-pointer"
                              >
                                <div>
                                  <p className="text-slate-800 font-black text-xs group-hover:text-[#00aa4f]">5-Day Hot Boost</p>
                                  <p className="text-[9px] text-slate-400 font-medium">Elevate to landing headers</p>
                                </div>
                                <span className="text-[#00aa4f] font-black text-[11px]">+₱49</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => router.push(`/landlord/payment?total=99&propertyId=${property.id}&type=boost&tier=2weeks`)}
                                className="w-full text-left p-2 rounded-xl border border-slate-100 hover:border-[#00aa4f] hover:bg-emerald-50/30 transition flex justify-between items-center group cursor-pointer"
                              >
                                <div>
                                  <p className="text-slate-800 font-black text-xs group-hover:text-[#00aa4f]">2-Week Visibility Surge</p>
                                  <p className="text-[9px] text-slate-400 font-medium">Maintain higher tier queue placement</p>
                                </div>
                                <span className="text-[#00aa4f] font-black text-[11px]">+₱99</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => router.push(`/landlord/payment?total=199&propertyId=${property.id}&type=boost&tier=1month`)}
                                className="w-full text-left p-2 rounded-xl border border-slate-100 hover:border-[#00aa4f] hover:bg-emerald-50/30 transition flex justify-between items-center group cursor-pointer"
                              >
                                <div>
                                  <p className="text-slate-800 font-black text-xs group-hover:text-[#00aa4f]">1-Month Market Domination</p>
                                  <p className="text-[9px] text-slate-400 font-medium">Premium pinned placement exposure</p>
                                </div>
                                <span className="text-[#00aa4f] font-black text-[11px]">+₱199</span>
                              </button>
                            </div>
                          )}
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => handleDeleteProperty(property.id)}
                          className="py-2.5 flex items-center justify-center gap-1 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {currentView === 'create' && (
          <form onSubmit={handleSubmit} className="bg-white border border-[#f1f5f9] rounded-3xl p-6 shadow-[0_4px_30px_rgba(0,0,0,0.015)] space-y-8">
            
            {errorMessage && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-bold">
                {errorMessage}
              </div>
            )}

            <div className="space-y-4">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 border-b border-slate-50 pb-2">1. Core Particulars</h2>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Listing Title / Catchphrase</label>
                <input 
                  type="text" 
                  required 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Cozy Studio Room near University Belt with Balcony"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#00aa4f] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none transition"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Property Category</label>
                  <select 
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#00aa4f] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none transition"
                  >
                    <option>Apartment</option>
                    <option>Condo Unit</option>
                    <option>Dormitory Bedspace</option>
                    <option>Single House</option>
                    <option>Room Rental Only</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Monthly Rent (PHP)</label>
                  <input 
                    type="number" 
                    required 
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="₱ Amount per month"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#00aa4f] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Floor Area (sqm)</label>
                  <input 
                    type="number" 
                    required 
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="e.g., 28"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#00aa4f] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Bedrooms</label>
                  <select 
                    value={bedrooms} 
                    onChange={(e) => setBedrooms(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none"
                  >
                    <option>0 (Studio)</option>
                    <option>1</option>
                    <option>2</option>
                    <option>3</option>
                    <option>4+</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Bathrooms</label>
                  <select 
                    value={bathrooms} 
                    onChange={(e) => setBathrooms(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none"
                  >
                    <option>1</option>
                    <option>2</option>
                    <option>3+</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Restroom Privacy</label>
                  <select 
                    value={restroomPrivacy} 
                    onChange={(e) => setRestroomPrivacy(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none"
                  >
                    <option>Private (Own Toilet)</option>
                    <option>Shared Common Restroom</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Shower Privacy</label>
                  <select 
                    value={bathroomPrivacy} 
                    onChange={(e) => setBathroomPrivacy(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none"
                  >
                    <option>Private (Own Shower)</option>
                    <option>Shared Common Shower</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 border-b border-slate-50 pb-2">2. Location Geometry</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Complete Descriptive Address</label>
                  <input 
                    type="text" 
                    required 
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    placeholder="Unit #, Building name, Street Name, Barangay, City"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#00aa4f] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1">
                    <label className="text-xs font-bold text-slate-500">Google Maps Plus Code</label>
                    <div className="relative">
                      <HelpCircle 
                        className="w-3.5 h-3.5 text-slate-300 hover:text-slate-400 cursor-pointer transition"
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                      />
                      {showTooltip && (
                        <div className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-slate-800 text-white text-[10px] p-2 rounded-lg leading-relaxed shadow-md">
                          Open Google Maps, click your building location pin, look for the code containing a plus symbol (e.g., "4VQQ+2X Manila"). This replaces database map placement pins perfectly.
                        </div>
                      )}
                    </div>
                  </div>
                  <input 
                    type="text" 
                    value={plusCode}
                    onChange={(e) => setPlusCode(e.target.value)}
                    placeholder="e.g., H2X3+JF Quezon City"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#00aa4f] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none transition"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 border-b border-slate-50 pb-2">3. Landlord Connectivity</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Mobile Contact Number</label>
                  <input 
                    type="tel" 
                    required 
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="e.g., 0917XXXXXXX"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#00aa4f] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Authenticated Email Reference</label>
                  <input 
                    type="email" 
                    disabled 
                    value={emailAddress}
                    className="w-full bg-slate-100 border border-slate-200 text-slate-400 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 border-b border-slate-50 pb-2">4. Unit Descriptions & Guidelines</h2>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Amenities, Terms, House Rules</label>
                <textarea 
                  rows={4}
                  required
                  value={descriptionRules}
                  onChange={(e) => setDescriptionRules(e.target.value)}
                  placeholder="List down details regarding structural inclusions, utility split policies, maximum occupants allowed, downpayment/deposit schedules, curfew structures, or pet rules."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#00aa4f] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none transition resize-none leading-relaxed"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 border-b border-slate-50 pb-2">5. Visual Verification Material</h2>
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 block">Unit Layout Photos (Max 10 items)</label>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {selectedFiles.map((item, index) => (
                    <div key={index} className="relative aspect-square border border-slate-100 rounded-2xl overflow-hidden group bg-slate-50">
                      <img src={item.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-1.5 right-1.5 bg-slate-900/70 hover:bg-slate-900 text-white p-1 rounded-lg transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {selectedFiles.length < 10 && (
                    <label className="aspect-square border-2 border-dashed border-slate-200 hover:border-[#00aa4f] rounded-2xl flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-slate-50 text-slate-400 hover:text-[#00aa4f] transition space-y-1.5 p-2">
                      <Upload className="w-5 h-5 stroke-[2.5]" />
                      <span className="text-[10px] font-black tracking-wide uppercase text-center leading-tight">Upload Images</span>
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*" 
                        onChange={handleFileChange} 
                        className="hidden" 
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 border-b border-slate-50 pb-2">6. Engine Visibility Boosting</h2>
              <div className="space-y-3">
                <div 
                  onClick={() => setBoostingOption('none')}
                  className={`border p-4 rounded-2xl flex items-center justify-between cursor-pointer transition ${
                    boostingOption === 'none' ? 'border-[#00aa4f] bg-emerald-50/20 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input 
                      type="radio" 
                      readOnly
                      checked={boostingOption === 'none'} 
                      className="mt-0.5 accent-[#00aa4f]"
                    />
                    <div>
                      <h4 className="text-xs font-black text-slate-800">Standard Placement Listing</h4>
                      <p className="text-[11px] text-slate-400 leading-normal">Basic insertion inside general geographical query filters. Valid context duration for 30 clear days.</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-slate-700">Free base</span>
                </div>

                <div 
                  onClick={() => setBoostingOption('5days')}
                  className={`border p-4 rounded-2xl flex items-center justify-between cursor-pointer transition ${
                    boostingOption === '5days' ? 'border-[#00aa4f] bg-emerald-50/20 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input 
                      type="radio" 
                      readOnly
                      checked={boostingOption === '5days'} 
                      className="mt-0.5 accent-[#00aa4f]"
                    />
                    <div>
                      <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        Tier 1 Blitz Campaign
                        <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider">POPULAR</span>
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-normal">Elevates card nodes to regional landing headers. Generates dedicated system traffic priority vectors for 5 days.</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-[#00aa4f]">₱49 addition</span>
                </div>

                <div 
                  onClick={() => setBoostingOption('2weeks')}
                  className={`border p-4 rounded-2xl flex items-center justify-between cursor-pointer transition ${
                    boostingOption === '2weeks' ? 'border-[#00aa4f] bg-emerald-50/20 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input 
                      type="radio" 
                      readOnly
                      checked={boostingOption === '2weeks'} 
                      className="mt-0.5 accent-[#00aa4f]"
                    />
                    <div>
                      <h4 className="text-xs font-black text-slate-800">Tier 2 Extended Horizon</h4>
                      <p className="text-[11px] text-slate-400 leading-normal">Maintains node elevation above baseline components for 14 continuous operational cycles.</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-[#00aa4f]">₱99 addition</span>
                </div>

                <div 
                  onClick={() => setBoostingOption('1month')}
                  className={`border p-4 rounded-2xl flex items-center justify-between cursor-pointer transition ${
                    boostingOption === '1month' ? 'border-[#00aa4f] bg-emerald-50/20 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input 
                      type="radio" 
                      readOnly
                      checked={boostingOption === '1month'} 
                      className="mt-0.5 accent-[#00aa4f]"
                    />
                    <div>
                      <h4 className="text-xs font-black text-slate-800">Tier 3 Permanent Authority</h4>
                      <p className="text-[11px] text-slate-400 leading-normal">Pinned global exposure targeting premium tenant inquiries. Full 30-day structural visibility expansion.</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-[#00aa4f]">₱199 addition</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-black text-slate-700">Calculated Accounting Statement</h4>
                <p className="text-[11px] text-slate-400 leading-normal">Base listing filing fee (₱20) plus optional architectural placement acceleration.</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">Total Due Amount</span>
                <span className="text-lg font-black text-[#00aa4f]">₱{totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto bg-[#00aa4f] hover:bg-[#009444] disabled:bg-slate-200 disabled:cursor-not-allowed text-white text-xs font-black px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Writing Listing Node...
                  </>
                ) : (
                  <>
                    Proceed to Settlement Matrix <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </main>
    </div>
  )
}