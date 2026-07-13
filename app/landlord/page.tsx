'use client'

import React, { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { 
  Building2, MapPin, Phone, Image as ImageIcon, 
  ShieldCheck, LogOut, FileText, Bed, ShowerHead,
  QrCode, X, CreditCard, Hash, UserCheck, UploadCloud, Trash2
} from 'lucide-react'

export default function CreateListingDashboard() {
  const router = useRouter()

  const [supabase] = useState(() => 
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  )

  const [userId, setUserId] = useState<string | null>(null)

  // Route Guard Session Validation
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      } else {
        setUserId(user.id)
      }
    }
    checkUser()
  }, [supabase, router])

  // --- Form Field States ---
  const [title, setTitle] = useState('')
  const [propertyType, setPropertyType] = useState('Apartment')
  const [price, setPrice] = useState('')
  const [bedrooms, setBedrooms] = useState('')
  const [bathrooms, setBathrooms] = useState('')
  const [restroomPrivacy, setRestroomPrivacy] = useState('Private (Own Toilet)')
  const [bathroomPrivacy, setBathroomPrivacy] = useState('Private (Own Shower)')
  const [manualAddress, setManualAddress] = useState('')
  const [plusCode, setPlusCode] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [emailAddress, setEmailAddress] = useState('')
  const [descriptionRules, setDescriptionRules] = useState('')
  const [listingPackage, setListingPackage] = useState('standard')

  // --- Multi-Photo Selection States ---
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  // --- GCash Modal View Controls ---
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [gcashName, setGcashName] = useState('')
  const [gcashReference, setGcashReference] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const getPackagePrice = () => {
    switch (listingPackage) {
      case 'standard': return 20
      case 'boost_5d': return 49
      case 'boost_2w': return 99
      case 'boost_1m': return 200
      default: return 20
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      
      if (selectedFiles.length + filesArray.length > 10) {
        setError('You can only upload up to a maximum of 10 photos per listing.')
        return
      }

      setError('')
      const newFiles = [...selectedFiles, ...filesArray]
      setSelectedFiles(newFiles)

      const newPreviews = filesArray.map(file => URL.createObjectURL(file))
      setImagePreviews([...imagePreviews, ...newPreviews])
    }
  }

  const removeSelectedPhoto = (index: number) => {
    const updatedFiles = [...selectedFiles]
    updatedFiles.splice(index, 1)
    setSelectedFiles(updatedFiles)

    const updatedPreviews = [...imagePreviews]
    URL.revokeObjectURL(updatedPreviews[index])
    updatedPreviews.splice(index, 1)
    setImagePreviews(updatedPreviews)
  }

  const handleTriggerPaymentVerification = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    if (selectedFiles.length === 0) {
      setError('Please upload at least one photo of your property.')
      return
    }

    setShowPaymentModal(true)
  }

  const handleFinalDatabaseInsert = async () => {
    if (!userId) {
      setError('Identity authentication session timed out. Please refresh.')
      return
    }

    if (!gcashName.trim() || !gcashReference.trim()) {
      setError('Please provide your transaction execution confirmation records.')
      return
    }

    if (gcashReference.trim().length < 13) {
      setError('Official GCash Reference Numbers must be exactly 13 digits.')
      return
    }

    setLoading(true)
    setError('')
    setShowPaymentModal(false)

    try {
      const uploadedUrls: string[] = []

      // Upload files sequentially to the public storage bucket
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        const fileExt = file.name.split('.').pop()
        const fileName = `${userId}-${Date.now()}-${i}.${fileExt}`
        const filePath = `${userId}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(filePath, file)

        if (uploadError) throw new Error(`Photo upload failed: ${uploadError.message}`)

        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(filePath)

        uploadedUrls.push(publicUrl)
      }

      // Payload insert mapping to structural database constraints
      const { error: insertError } = await supabase
        .from('properties')
        .insert([
          {
            landlord_id: userId,
            title,
            property_type: propertyType,
            price: parseFloat(price), // Maps perfectly to non-null baseline column
            bedrooms: parseInt(bedrooms) || 0,
            bathrooms: parseInt(bathrooms) || 0,
            restroom_privacy: restroomPrivacy,
            bathroom_privacy: bathroomPrivacy,
            manual_address: manualAddress,
            plus_code: plusCode || null,
            contact_number: contactNumber,
            email_address: emailAddress,
            description_rules: descriptionRules,
            listing_package: listingPackage,
            gcash_name: gcashName.toUpperCase(),
            payment_reference: gcashReference.trim(),
            images: uploadedUrls,
            status: 'pending', 
            is_paid: false 
          }
        ])

      if (insertError) throw insertError

      setSuccessMessage('Listing successfully logged for verification! Payment is being processed against your GCash reference token.')
      
      // Clear inputs
      setTitle('')
      setPropertyType('Apartment')
      setPrice('')
      setBedrooms('')
      setBathrooms('')
      setManualAddress('')
      setPlusCode('')
      setContactNumber('')
      setEmailAddress('')
      setDescriptionRules('')
      setListingPackage('standard')
      setGcashName('')
      setGcashReference('')
      setSelectedFiles([])
      setImagePreviews([])

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans antialiased py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Header branding components */}
        <div className="border-b border-slate-100 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-600">
              <Building2 className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-md">
                Landlord Dashboard
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-950 tracking-tight">Create Rental Listing</h1>
            <p className="text-xs text-slate-400 font-medium">Fill out the details below to add your unit to rentersPH.</p>
          </div>
          
          <button 
            type="button"
            onClick={handleSignOut}
            className="self-start sm:self-center px-4 py-2 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-100/70 rounded-xl transition-all duration-200 flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>

        {/* Messaging alerts container */}
        <div className="px-6 sm:px-8 pt-6 space-y-3">
          {error && <div className="p-4 bg-red-50 text-red-700 text-xs font-bold rounded-2xl border border-red-100">⚠️ Error: {error}</div>}
          {successMessage && <div className="p-4 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-2xl border border-emerald-100">✅ {successMessage}</div>}
        </div>

        <form onSubmit={handleTriggerPaymentVerification} className="p-6 sm:p-8 space-y-8">
          
          {/* Section 1: Specifications */}
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
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 tracking-wider">Property Type</label>
                  <select 
                    value={propertyType} 
                    onChange={(e) => setPropertyType(e.target.value)} 
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 cursor-pointer"
                  >
                    <option>Apartment</option>
                    <option>Condominium</option>
                    <option>House</option>
                    <option>Boarding House</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 tracking-wider">Monthly Rent (PHP / MO)</label>
                  <input 
                    required 
                    type="number" 
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="18500" 
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
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
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 tracking-wider">Restroom Privacy</label>
                  <select 
                    value={restroomPrivacy} 
                    onChange={(e) => setRestroomPrivacy(e.target.value)} 
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 cursor-pointer"
                  >
                    <option>Private (Own Toilet)</option>
                    <option>Shared Toilet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 tracking-wider">Bathroom Privacy</label>
                  <select 
                    value={bathroomPrivacy} 
                    onChange={(e) => setBathroomPrivacy(e.target.value)} 
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 cursor-pointer"
                  >
                    <option>Private (Own Shower)</option>
                    <option>Shared Shower</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Address */}
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
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 tracking-wider">Google Maps Plus Code (Optional)</label>
                <input 
                  type="text" 
                  value={plusCode}
                  onChange={(e) => setPlusCode(e.target.value)}
                  placeholder="e.g. VFF7+HQ Davao City" 
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Contact */}
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
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
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
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Rules */}
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
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Section 5: Media Upload Dropzone */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-emerald-600" /> 5. Property Showcase Photos
            </h3>
            <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-4">
              
              <label className="flex flex-col items-center justify-center w-full h-36 bg-white border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl cursor-pointer transition p-4 text-center">
                <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-xs font-bold text-slate-700">Click to upload property images</span>
                <span className="text-[10px] font-semibold text-slate-400 mt-0.5">Select up to 10 photos max (PNG, JPG)</span>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
              </label>

              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                  {imagePreviews.map((previewUrl, index) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group bg-slate-100">
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeSelectedPhoto(index)}
                        className="absolute top-1.5 right-1.5 p-1 bg-slate-900/70 hover:bg-rose-600 text-white rounded-md transition shadow"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="absolute bottom-1 left-1.5 text-[9px] font-bold px-1.5 bg-black/60 text-white rounded-md">
                        #{index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>

          {/* Section 6: Package */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 6. Listing Package & Visibility Rank
            </h3>
            
            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-2">
              <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider">
                Listing Package Option
              </label>
              <select 
                value={listingPackage} 
                onChange={(e) => setListingPackage(e.target.value)} 
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 cursor-pointer"
              >
                <option value="standard">Standard Listing — ₱20 (Active for 30 Days)</option>
                <option value="boost_5d">Standard + Boost Tier (5 Days) — ₱49</option>
                <option value="boost_2w">Standard + Boost Tier (2 Weeks) — ₱99</option>
                <option value="boost_1m">Standard + Boost Tier (1 Month) — ₱200</option>
              </select>
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-sm py-4 rounded-2xl transition-all"
            >
              {loading ? 'Processing Parameters...' : 'Proceed to Payment Allocation'}
            </button>
          </div>

        </form>
      </div>

      {/* GCash Verification Overlay Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
            
            <button 
              type="button" 
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-full transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-1.5">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto border border-blue-100">
                <QrCode className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black text-slate-950 tracking-tight">GCash Secure Checkout</h2>
              <p className="text-xs text-slate-400 font-medium">Scan the QR code below using your GCash app to send your payment.</p>
            </div>

            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Total Bill Due:</span>
              <span className="text-slate-950 bg-white px-3 py-1 rounded-xl border border-slate-200 shadow-sm flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-blue-500" /> ₱{getPackagePrice()}
              </span>
            </div>

            <div className="mx-auto w-56 h-56 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center p-2 overflow-hidden">
              <img 
                src="/gcash-qr.png" 
                alt="GCash QR Code" 
                className="w-full h-full object-contain"
              />
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 tracking-wider">Your Sender GCash Name</label>
                <input 
                  required 
                  type="text" 
                  value={gcashName}
                  onChange={(e) => setGcashName(e.target.value)}
                  placeholder="e.g. JUAN DELA CRUZ" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs uppercase text-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 tracking-wider">13-Digit Reference Number</label>
                <input 
                  required 
                  type="text" 
                  maxLength={13}
                  value={gcashReference}
                  onChange={(e) => setGcashReference(e.target.value.replace(/\D/g, ''))}
                  placeholder="Paste the 13-digit code from your GCash receipt" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono tracking-wide text-slate-800"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleFinalDatabaseInsert}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3.5 rounded-xl uppercase tracking-wider transition-all"
            >
              Submit Payment Reference
            </button>

          </div>
        </div>
      )}

    </div>
  )
}