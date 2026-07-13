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
  
  // State variables matching your form fields
  const [title, setTitle] = useState('')
  const [manualAddress, setManualAddress] = useState('')
  const [price, setPrice] = useState('')
  const [bedrooms, setBedrooms] = useState('0')
  const [bathrooms, setBathrooms] = useState('0')
  const [bathroomPrivacy, setBathroomPrivacy] = useState('Private')
  const [propertyType, setPropertyType] = useState('Apartment')
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

    // SAFE PARSING: Turn price into a strict integer immediately. 
    // Fallback to 0 if empty so it never sends 'null' or "" to violate constraints.
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
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex justify-center items-center">
      <div className="w-full max-w-2xl bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
        
        {/* Beautiful Header banner design exactly matching your setup */}
        <div className="bg-[#030712] text-white py-10 px-6 text-center relative border-b border-slate-800">
          <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-2xl inline-block mb-4 border border-emerald-500/20">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">Register Direct Property Unit</h1>
          <p className="text-slate-400 text-xs mt-1.5 max-w-md mx-auto">
            Your unit will list directly on the global market map index. Ensure all parameters match physical specifications.
          </p>
        </div>

        {/* Content Form Body */}
        <form onSubmit={handleSubmit} className="p-8 sm:p-10 space-y-10">
          
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-xl text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500" /> {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" /> {successMessage}
            </div>
          )}

          {/* Section 1 */}
          <div className="space-y-4">
            <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase block">1. Core Metadata Details</span>
            
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700">Display Listing Title</label>
              <input 
                type="text"
                required
                placeholder="e.g., Luxury Studio Unit with Balcony near Downtown Hub"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition placeholder:text-slate-300"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700">Monthly Rental Pricing (₱ PHP)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-sm">₱</span>
                  <input 
                    type="number"
                    required
                    placeholder="e.g., 15000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition placeholder:text-slate-300"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700">Property Configuration Structure</label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition text-slate-700"
                >
                  <option value="Apartment">Apartment Complex</option>
                  <option value="Condominium">Condominium Suite</option>
                  <option value="Bedspace">Shared Bedspace Room</option>
                  <option value="House">Residential House</option>
                  <option value="Room Only">Single Room Rental</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div className="space-y-4">
            <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase block">2. Unit Space Layout Parameters</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 flex items-center gap-1">
                  <Bed className="w-3.5 h-3.5 text-slate-300" /> Bedrooms
                </label>
                <input 
                  type="number"
                  min="0"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 flex items-center gap-1">
                  <ShowerHead className="w-3.5 h-3.5 text-slate-300" /> Bathrooms
                </label>
                <input 
                  type="number"
                  min="0"
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700">Bathroom Classification</label>
                <select
                  value={bathroomPrivacy}
                  onChange={(e) => setBathroomPrivacy(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition text-slate-700"
                >
                  <option value="Private">Completely Private</option>
                  <option value="Shared">Shared Access Common</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div className="space-y-4">
            <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase block">3. Geographical Parameters Mapping</span>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-300" /> Full Physical Address String
                </label>
                <input 
                  type="text"
                  required
                  placeholder="Street Name, Building / House Number, Barangay, City, Province"
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition placeholder:text-slate-300"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700">Google Maps Plus Code (Optional Helper)</label>
                <input 
                  type="text"
                  placeholder="e.g., 8V2M+V4 Davao City"
                  value={plusCode}
                  onChange={(e) => setPlusCode(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition font-mono placeholder:text-slate-300"
                />
              </div>
            </div>
          </div>

          {/* Section 4 */}
          <div className="space-y-4">
            <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase block">4. Rules, Terms, and Overview Disclosures</span>
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-300" /> Terms Overview & Guidelines
              </label>
              <textarea 
                rows={4}
                placeholder="State utility setups, payment advance bounds, curfew guidelines, or visitor constraints here clearly..."
                value={descriptionRules}
                onChange={(e) => setDescriptionRules(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition resize-none placeholder:text-slate-300"
              />
            </div>
          </div>

          {/* Section 5 */}
          <div className="space-y-4">
            <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase block">5. Primary Offline Communication Channels</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-300" /> Mobile Contact Number
                </label>
                <input 
                  type="tel"
                  required
                  placeholder="e.g., +63 917 123 4567"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition placeholder:text-slate-300"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-300" /> Owner Email Address
                </label>
                <input 
                  type="email"
                  required
                  placeholder="e.g., contact.landlord@gmail.com"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition placeholder:text-slate-300"
                />
              </div>
            </div>
          </div>

          {/* Section 6 */}
          <div className="space-y-4">
            <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase block">6. High Resolution Image Registry Assets</span>
            <div className="flex gap-2">
              <input 
                type="text"
                placeholder="Paste direct continuous image asset link URL (https://...)"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition placeholder:text-slate-300"
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="bg-[#0f172a] hover:bg-slate-800 text-white p-3 rounded-xl transition flex items-center justify-center w-12"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 pt-2">
                {images.map((img, i) => (
                  <div key={i} className="relative aspect-video rounded-lg overflow-hidden border group">
                    <img src={img} alt="preview" className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => handleRemoveImageUrl(i)}
                      className="absolute inset-0 bg-red-600/80 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-[10px] font-bold"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#059669] hover:bg-emerald-700 text-white font-bold text-xs py-4 rounded-xl uppercase tracking-wider transition disabled:opacity-50"
          >
            {isSubmitting ? 'Posting unit...' : 'Finalize & Post Property Listing'}
          </button>

        </form>
      </div>
    </div>
  )
}