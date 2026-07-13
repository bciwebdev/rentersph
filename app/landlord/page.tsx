'use client'

import React, { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { 
  Building2, MapPin, Phone, Image as ImageIcon, 
  ShieldCheck, LogOut, FileText, Bed, ShowerHead, Maximize2,
  QrCode, X, CreditCard, Hash, UserCheck
} from 'lucide-react'

export default function CreateListingDashboard() {
  const router = useRouter()

  // Initialize the cookie-aware browser client
  const [supabase] = useState(() => 
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  )

  // Track the active authenticated landlord ID
  const [userId, setUserId] = useState<string | null>(null)

  // Route Guard: Ensure the user session exists from cookies, redirect if not
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      } else {
        setUserId(user.id) // Securely capture active landlord profile UID
      }
    }
    checkUser()
  }, [supabase, router])

  // --- Form States Elements ---
  const [title, setTitle] = useState('')
  const [propertyType, setPropertyType] = useState('Apartment')
  const [pricePerMonth, setPricePerMonth] = useState('')
  const [bedrooms, setBedrooms] = useState('')
  const [bathrooms, setBathrooms] = useState('')
  const [areaSqm, setAreaSqm] = useState('')
  const [restroomPrivacy, setRestroomPrivacy] = useState('Private (Own Toilet)')
  const [bathroomPrivacy, setBathroomPrivacy] = useState('Private (Own Shower)')
  const [manualAddress, setManualAddress] = useState('')
  const [plusCode, setPlusCode] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [emailAddress, setEmailAddress] = useState('')
  const [descriptionRules, setDescriptionRules] = useState('')
  const [listingPackage, setListingPackage] = useState('standard')
  const [imageUrl, setImageUrl] = useState('') // Handled text URL mapping variant 

  // --- GCash Modal Payment States ---
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [gcashName, setGcashName] = useState('')
  const [gcashReference, setGcashReference] = useState('')

  // --- UI Notification & State Handlers ---
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  // Calculate standard/boost pricing dynamic updates
  const getPackagePrice = () => {
    switch (listingPackage) {
      case 'standard': return 20
      case 'boost_5d': return 49
      case 'boost_2w': return 99
      case 'boost_1m': return 200
      default: return 20
    }
  }

  // Intercept standard form submission to launch billing window first
  const handleTriggerPaymentVerification = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    setShowPaymentModal(true)
  }

  const handleFinalDatabaseInsert = async () => {
    if (!userId) {
      setError('Session expired or identity unauthenticated. Please refresh and log back in.')
      return
    }

    if (!gcashName.trim() || !gcashReference.trim()) {
      setError('Please fill out all GCash verification fields.')
      return
    }

    if (gcashReference.trim().length < 13) {
      setError('GCash Reference Number must be at least 13 digits long.')
      return
    }

    setLoading(true)
    setError('')
    setShowPaymentModal(false)

    // Insert payload mapped explicitly to the 'properties' schema
    const { error: insertError } = await supabase
      .from('properties')
      .insert([
        {
          landlord_id: userId, // Tied to active authenticated session profile ID
          title,
          property_type: propertyType,
          price_per_month: parseFloat(pricePerMonth),
          bedrooms: parseInt(bedrooms) || 0,
          bathrooms: parseInt(bathrooms) || 0,
          area_sqm: parseFloat(areaSqm) || 0,
          restroom_privacy: restroomPrivacy,
          bathroom_privacy: bathroomPrivacy,
          manual_address: manualAddress,
          plus_code: plusCode || null,
          contact_number: contactNumber,
          email_address: emailAddress,
          description_rules: descriptionRules,
          listing_package: listingPackage,
          gcash_name: gcashName.toUpperCase(),
          payment_reference: gcashReference.trim(), // explicitly matches status report definitions
          status: 'pending', // Flags verification matrix grid criteria
          is_paid: false // Swapped over to verification dashboard toggle automation
        }
      ])

    setLoading(false)

    if (insertError) {
      setError(insertError.message)
    } else {
      setSuccessMessage('Listing submitted securely! Waiting for admin payment validation to flip your timeline live.')
      
      // Clear form inputs upon successful upload completion
      setTitle('')
      setPropertyType('Apartment')
      setPricePerMonth('')
      setBedrooms('')
      setBathrooms('')
      setAreaSqm('')
      setManualAddress('')
      setPlusCode('')
      setContactNumber('')
      setEmailAddress('')
      setDescriptionRules('')
      setImageUrl('')
      setListingPackage('standard')
      setGcashName('')
      setGcashReference('')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans antialiased py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Header Control Bar */}
        <div className="border-b border-slate-100 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-600">
              <Building2 className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-md">
                Landlord Portal
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-950 tracking-tight">Create Rental Listing</h1>
            <p className="text-xs text-slate-400 font-medium">Fill out the details below to add your unit to rentersPH.</p>
          </div>
          
          <button 
            type="button"
            onClick={handleSignOut}
            suppressHydrationWarning
            className="self-start sm:self-center px-4 py-2 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-100/70 rounded-xl transition-all duration-200 flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>

        {/* System Alert Banners */}
        <div className="px-6 sm:px-8 pt-6 space-y-3">
          {error && <div className="p-4 bg-red-50 text-red-700 text-xs font-bold rounded-2xl border border-red-100">⚠️ Error: {error}</div>}
          {successMessage && <div className="p-4 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-2xl border border-emerald-100">✅ {successMessage}</div>}
        </div>

        {/* Master Form Engine */}
        <form onSubmit={handleTriggerPaymentVerification} className="p-6 sm:p-8 space-y-8">
          
          {/* Section 1: Core Specifications */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-600" /> 1. Core Specifications
            </h3>
            
            <div className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 tracking-wider">Listing Title</label>
                <input 
                  required 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Modern Minimalist Studio near SM" 
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 tracking-wider">Property Type</label>
                  <div className="relative">
                    <select 
                      value={propertyType} 
                      onChange={(e) => setPropertyType(e.target.value)} 
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all appearance-none cursor-pointer"
                    >
                      <option>Apartment</option>
                      <option>Condominium</option>
                      <option>House</option>
                      <option>Boarding House</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 text-xs">▼</div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 tracking-wider">Price (PHP / MO)</label>
                  <input 
                    required 
                    type="number" 
                    value={pricePerMonth}
                    onChange={(e) => setPricePerMonth(e.target.value)}
                    placeholder="18500" 
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 tracking-wider flex items-center gap-1">
                    <Bed className="w-3 h-3 text-slate-400" /> Bedrooms
                  </label>
                  <input 
                    required 
                    type="number" 
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    placeholder="1" 
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 tracking-wider flex items-center gap-1">
                    <ShowerHead className="w-3 h-3 text-slate-400" /> Bathrooms
                  </label>
                  <input 
                    required 
                    type="number" 
                    value={bathrooms}
                    onChange={(e) => setBathrooms(e.target.value)}
                    placeholder="1" 
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 tracking-wider flex items-center gap-1">
                    <Maximize2 className="w-3 h-3 text-slate-400" /> Area (SQM)
                  </label>
                  <input 
                    required 
                    type="number" 
                    value={areaSqm}
                    onChange={(e) => setAreaSqm(e.target.value)}
                    placeholder="30" 
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 tracking-wider">Restroom Privacy</label>
                  <div className="relative">
                    <select 
                      value={restroomPrivacy} 
                      onChange={(e) => setRestroomPrivacy(e.target.value)} 
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all appearance-none cursor-pointer"
                    >
                      <option>Private (Own Toilet)</option>
                      <option>Shared Toilet</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 text-xs">▼</div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 tracking-wider">Bathroom Privacy</label>
                  <div className="relative">
                    <select 
                      value={bathroomPrivacy} 
                      onChange={(e) => setBathroomPrivacy(e.target.value)} 
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all appearance-none cursor-pointer"
                    >
                      <option>Private (Own Shower)</option>
                      <option>Shared Shower</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 text-xs">▼</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Address Location */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" /> 2. Address Location
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 tracking-wider">Manual Address</label>
                <input 
                  required 
                  type="text" 
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  placeholder="Ecoland, Davao City" 
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 tracking-wider">Google Maps Plus Code (Optional)</label>
                <input 
                  type="text" 
                  value={plusCode}
                  onChange={(e) => setPlusCode(e.target.value)}
                  placeholder="e.g. VFF7+HQ Davao City" 
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Contact Parameters */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-600" /> 3. Contact Parameters
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 tracking-wider">Contact Number</label>
                <input 
                  required 
                  type="text" 
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="0917XXXXXXX" 
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 tracking-wider">Email Address</label>
                <input 
                  required 
                  type="email" 
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="landlord@email.com" 
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Detailed Description & Rules */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-600" /> 4. Detailed Description & Rules
            </h3>
            
            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 tracking-wider">Property Description & Rules</label>
              <textarea 
                required 
                rows={5}
                value={descriptionRules}
                onChange={(e) => setDescriptionRules(e.target.value)}
                placeholder="Provide details about payment terms, utilities, and roommate rules..." 
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Section 5: High-Res Presentation Media */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-emerald-600" /> 5. Presentation Media Link
            </h3>
            
            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 tracking-wider">Cover Image URL</label>
              <input 
                type="text" 
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-example" 
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all"
              />
            </div>
          </div>

          {/* Section 6: Packages and Visibility */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 6. Listing Package & Visibility Rank
            </h3>
            
            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Listing Package & Visibility Rank
                </label>
                
                <div className="group relative cursor-pointer flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 transition">
                  <span>What is boosting?</span>
                  <span className="bg-emerald-50 text-emerald-600 rounded-full w-3.5 h-3.5 inline-flex items-center justify-center text-[9px] border border-emerald-200">?</span>
                  
                  <div className="absolute right-0 bottom-full mb-2 w-64 p-3 bg-slate-900 text-white font-medium text-xs rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 leading-relaxed">
                    ⚡ <strong className="text-emerald-400 font-bold">Boost Purpose:</strong> Plugs your property directly to the absolute top of the search grid whenever a renter looks for accommodations matching your specific area location!
                  </div>
                </div>
              </div>

              <div className="relative">
                <select 
                  value={listingPackage} 
                  onChange={(e) => setListingPackage(e.target.value)} 
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all appearance-none cursor-pointer"
                >
                  <option value="standard">Standard Listing — ₱20 (Active for 30 Days)</option>
                  <option value="boost_5d">Standard + Boost Tier (5 Days) — ₱49</option>
                  <option value="boost_2w">Standard + Boost Tier (2 Weeks) — ₱99</option>
                  <option value="boost_1m">Standard + Boost Tier (1 Month) — ₱200</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 text-xs">▼</div>
              </div>
              
              <p className="text-[10px] text-slate-400 font-medium pt-0.5">
                * Standard tier active timeline begins immediately upon payment verification completion.
              </p>
            </div>
          </div>

          {/* Submit Actions Button */}
          <div className="pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-sm py-4 rounded-2xl transition-all duration-200 shadow-sm hover:shadow hover:scale-[1.005] active:scale-[0.995]"
            >
              {loading ? 'Processing Parameters...' : 'Proceed to Payment Allocation'}
            </button>
          </div>

        </form>
      </div>

      {/* --- Premium Minimalist GCash Overlay Modal --- */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative animate-scale-up">
            
            {/* Close Button Trigger */}
            <button 
              type="button" 
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-full transition"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Branding Header */}
            <div className="text-center space-y-1.5">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto border border-blue-100">
                <QrCode className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black text-slate-950 tracking-tight">GCash Secure Billing Checkout</h2>
              <p className="text-xs text-slate-400 font-medium">Scan the QR code asset to process your service transaction package fee.</p>
            </div>

            {/* Price Tracker Badge */}
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Selected Option Rank:</span>
              <span className="text-slate-950 bg-white px-3 py-1 rounded-xl border border-slate-200 shadow-sm flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-blue-500" /> ₱{getPackagePrice()}
              </span>
            </div>

            {/* QR Code Presentation Layer */}
            <div className="mx-auto w-52 h-52 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center p-3 text-center overflow-hidden">
              <img 
                src="/gcash-qr.png" 
                alt="RentersPH Official GCash QR Code" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.parentElement?.querySelector('.qr-fallback');
                  if (fallback) fallback.classList.remove('hidden');
                }}
              />
              <div className="qr-fallback hidden text-[10px] text-slate-400 font-bold uppercase p-4 leading-normal">
                ⚠️ Missing QR Asset<br/>
                <span className="text-[9px] font-medium text-slate-500 lowercase block pt-1">Drop image into website/public/gcash-qr.png</span>
              </div>
            </div>

            {/* Verification Inputs Form Elements */}
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 tracking-wider flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-slate-400" /> Your GCash Account Name
                </label>
                <input 
                  required 
                  type="text" 
                  value={gcashName}
                  onChange={(e) => setGcashName(e.target.value)}
                  placeholder="e.g. JUAN DELA CRUZ" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all uppercase"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 tracking-wider flex items-center gap-1">
                  <Hash className="w-3 h-3 text-slate-400" /> 13-Digit Reference Number
                </label>
                <input 
                  required 
                  type="text" 
                  maxLength={13}
                  value={gcashReference}
                  onChange={(e) => setGcashReference(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 2026111222333" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all tracking-wide"
                />
              </div>
            </div>

            {/* Confirm Payment Submission Button */}
            <button
              type="button"
              onClick={handleFinalDatabaseInsert}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-center uppercase tracking-wider"
            >
              Submit Reference Payload
            </button>

          </div>
        </div>
      )}

    </div>
  )
}