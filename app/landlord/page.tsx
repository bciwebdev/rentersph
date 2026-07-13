'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { 
  Building2, MapPin, DollarSign, Bed, 
  ShowerHead, FileText, Phone, Mail, 
  CheckCircle, AlertCircle, Plus, Trash2, ArrowLeft
} from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LandlordRegistrationPage() {
  const router = useRouter()
  
  // Form State Values
  const [title, setTitle] = useState('')
  const [manualAddress, setManualAddress] = useState('')
  const [price, setPrice] = useState('')
  const [bedrooms, setBedrooms] = useState('0')
  const [bathrooms, setBathrooms] = useState('0')
  const [bathroomPrivacy, setBathroomPrivacy] = useState('Completely Private')
  const [propertyType, setPropertyType] = useState('Apartment Complex')
  const [descriptionRules, setDescriptionRules] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [emailAddress, setEmailAddress] = useState('')
  const [plusCode, setPlusCode] = useState('')
  
  const [imageUrlInput, setImageUrlInput] = useState('')
  const [images, setImages] = useState<string[]>([])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return
    setImages((prev) => [...prev, imageUrlInput.trim()])
    setImageUrlInput('')
  }

  const handleRemoveImageUrl = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    // Structural fix: cast to number perfectly right before it goes out
    const safePrice = parseInt(price, 10) || 0

    try {
      const { error } = await supabase
        .from('properties')
        .insert([
          {
            title: title.trim(),
            manual_address: manualAddress.trim(),
            address: manualAddress.trim(),
            price: safePrice, 
            bedrooms: parseInt(bedrooms, 10) || 0,
            bathrooms: parseInt(bathrooms, 10) || 0,
            bathroom_privacy: bathroomPrivacy,
            property_type: propertyType,
            description_rules: descriptionRules.trim(),
            contact_number: contactNumber.trim(),
            email_address: emailAddress.trim(),
            plus_code: plusCode.trim() || null,
            images: images.length > 0 ? images : null
          }
        ])

      if (error) throw new Error(error.message)

      setSuccessMessage('Listing created successfully!')
      setTimeout(() => {
        router.push('/')
      }, 2000)

    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
      <div className="w-full max-w-[640px] bg-white rounded-[2.5rem] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        
        {/* Banner Section matching screenshot layout exactly */}
        <div className="bg-[#020617] text-white pt-12 pb-10 px-8 text-center relative">
          <div className="text-[#10b981] mb-3 flex justify-center">
            <Building2 className="w-11 h-11 stroke-[1.5]" />
          </div>
          <h1 className="text-[25px] font-black tracking-tight text-white leading-tight">Register Direct Property Unit</h1>
          <p className="text-slate-400 text-[11px] mt-2 max-w-[420px] mx-auto leading-normal font-medium px-4">
            Your unit will list directly on the global market map index. Ensure all parameters match physical specifications.
          </p>
        </div>

        {/* Content Form Block */}
        <form onSubmit={handleSubmit} className="p-10 space-y-9">
          
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" /> {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> {successMessage}
            </div>
          )}

          {/* 1. Core Metadata Details */}
          <div className="space-y-4">
            <span className="text-[11px] font-bold tracking-wider text-[#94a3b8] uppercase block">1. CORE METADATA DETAILS</span>
            
            <div className="space-y-2">
              <label className="text-[12px] font-bold text-[#334155]">Display Listing Title</label>
              <input 
                type="text"
                required
                placeholder="e.g., Luxury Studio Unit with Balcony near Downtown Hub"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-[14px] text-[13px] text-[#334155] focus:outline-none focus:border-emerald-500 transition placeholder:text-[#cbd5e1]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[12px] font-bold text-[#334155]">Monthly Rental Pricing (₱ PHP)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#cbd5e1] text-[14px] font-medium">₱</span>
                  <input 
                    type="number"
                    required
                    placeholder="e.g., 15000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl pl-8 pr-4 py-[14px] text-[13px] text-[#334155] focus:outline-none focus:border-emerald-500 transition placeholder:text-[#cbd5e1]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[12px] font-bold text-[#334155]">Property Configuration Structure</label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-[14px] text-[13px] text-[#334155] focus:outline-none focus:border-emerald-500 transition"
                >
                  <option value="Apartment Complex">Apartment Complex</option>
                  <option value="Condominium Suite">Condominium Suite</option>
                  <option value="Shared Bedspace Room">Shared Bedspace Room</option>
                  <option value="Residential House">Residential House</option>
                  <option value="Single Room Rental">Single Room Rental</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. Unit Space Layout Parameters */}
          <div className="space-y-4">
            <span className="text-[11px] font-bold tracking-wider text-[#94a3b8] uppercase block">2. UNIT SPACE LAYOUT PARAMETERS</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-[12px] font-bold text-[#334155] flex items-center gap-1.5">
                  <Bed className="w-3.5 h-3.5 text-[#cbd5e1]" /> Bedrooms
                </label>
                <input 
                  type="number"
                  min="0"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-[14px] text-[13px] text-[#334155] focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[12px] font-bold text-[#334155] flex items-center gap-1.5">
                  <ShowerHead className="w-3.5 h-3.5 text-[#cbd5e1]" /> Bathrooms
                </label>
                <input 
                  type="number"
                  min="0"
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-[14px] text-[13px] text-[#334155] focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[12px] font-bold text-[#334155]">Bathroom Classification</label>
                <select
                  value={bathroomPrivacy}
                  onChange={(e) => setBathroomPrivacy(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-[14px] text-[13px] text-[#334155] focus:outline-none focus:border-emerald-500 transition"
                >
                  <option value="Completely Private">Completely Private</option>
                  <option value="Shared Access Common">Shared Access Common</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. Geographical Parameters Mapping */}
          <div className="space-y-4">
            <span className="text-[11px] font-bold tracking-wider text-[#94a3b8] uppercase block">3. GEOGRAPHICAL PARAMETERS MAPPING</span>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[12px] font-bold text-[#334155] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#cbd5e1]" /> Full Physical Address String
                </label>
                <input 
                  type="text"
                  required
                  placeholder="Street Name, Building / House Number, Barangay, City, Province"
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-[14px] text-[13px] text-[#334155] focus:outline-none focus:border-emerald-500 transition placeholder:text-[#cbd5e1]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[12px] font-bold text-[#334155]">Google Maps Plus Code (Optional Helper)</label>
                <input 
                  type="text"
                  placeholder="e.g., 8V2M+V4 Davao City"
                  value={plusCode}
                  onChange={(e) => setPlusCode(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-[14px] text-[13px] font-mono text-[#334155] focus:outline-none focus:border-emerald-500 transition placeholder:text-[#cbd5e1]"
                />
              </div>
            </div>
          </div>

          {/* 4. Rules, Terms, and Overview Disclosures */}
          <div className="space-y-4">
            <span className="text-[11px] font-bold tracking-wider text-[#94a3b8] uppercase block">4. RULES, TERMS, AND OVERVIEW DISCLOSURES</span>
            <div className="space-y-2">
              <label className="text-[12px] font-bold text-[#334155] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#cbd5e1]" /> Terms Overview & Guidelines
              </label>
              <textarea 
                rows={4}
                placeholder="State utility setups, payment advance bounds, curfew guidelines, or visitor constraints here clearly..."
                value={descriptionRules}
                onChange={(e) => setDescriptionRules(e.target.value)}
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-[14px] text-[13px] text-[#334155] focus:outline-none focus:border-emerald-500 transition resize-none placeholder:text-[#cbd5e1] leading-relaxed"
              />
            </div>
          </div>

          {/* 5. Primary Offline Communication Channels */}
          <div className="space-y-4">
            <span className="text-[11px] font-bold tracking-wider text-[#94a3b8] uppercase block">5. PRIMARY OFFLINE COMMUNICATION CHANNELS</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[12px] font-bold text-[#334155] flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#cbd5e1]" /> Mobile Contact Number
                </label>
                <input 
                  type="tel"
                  required
                  placeholder="e.g., +63 917 123 4567"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-[14px] text-[13px] text-[#334155] focus:outline-none focus:border-emerald-500 transition placeholder:text-[#cbd5e1]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[12px] font-bold text-[#334155] flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#cbd5e1]" /> Owner Email Address
                </label>
                <input 
                  type="email"
                  required
                  placeholder="e.g., contact.landlord@gmail.com"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-[14px] text-[13px] text-[#334155] focus:outline-none focus:border-emerald-500 transition placeholder:text-[#cbd5e1]"
                />
              </div>
            </div>
          </div>

          {/* 6. High Resolution Image Registry Assets */}
          <div className="space-y-4">
            <span className="text-[11px] font-bold tracking-wider text-[#94a3b8] uppercase block">6. HIGH RESOLUTION IMAGE REGISTRY ASSETS</span>
            <div className="flex gap-2">
              <input 
                type="text"
                placeholder="Paste direct continuous image asset link URL (https://...)"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-[14px] text-[13px] text-[#334155] focus:outline-none focus:border-emerald-500 transition placeholder:text-[#cbd5e1]"
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="bg-[#0f172a] hover:bg-slate-800 text-white px-4 rounded-xl transition flex items-center justify-center shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-3 pt-1">
                {images.map((img, i) => (
                  <div key={i} className="relative aspect-video rounded-xl overflow-hidden border border-[#e2e8f0] group bg-[#f8fafc]">
                    <img src={img} alt="preview" className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => handleRemoveImageUrl(i)}
                      className="absolute inset-0 bg-rose-600/90 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-[11px] font-bold"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button matched exactly */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#009667] hover:bg-[#008057] text-white font-bold text-[13px] py-[15px] rounded-xl uppercase tracking-wider transition disabled:opacity-50"
            >
              {isSubmitting ? 'Finalizing and Posting Listing...' : 'FINALIZE & POST PROPERTY LISTING'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}