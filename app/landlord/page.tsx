'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { 
  Building2, MapPin, DollarSign, Bed, 
  ShowerHead, FileText, Phone, Mail, 
  CheckCircle, AlertCircle, Plus, Trash2, ArrowLeft
} from 'lucide-react'

// Initialize client-side Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LandlordRegistrationPage() {
  const router = useRouter()
  
  // Form States matching structural columns
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
  
  // Image URL Parsing Array State
  const [imageUrlInput, setImageUrlInput] = useState('')
  const [images, setImages] = useState<string[]>([])

  // UI Status Management
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return
    if (!imageUrlInput.startsWith('http://') && !imageUrlInput.startsWith('https://')) {
      setErrorMessage('Please provide a valid asset URL starting with http:// or https://')
      return
    }
    setImages((prev) => [...prev, imageUrlInput.trim()])
    setImageUrlInput('')
    setErrorMessage(null)
  }

  const handleRemoveImageUrl = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    // Fallback client-side verification check
    if (!title.trim() || !manualAddress.trim() || !price.trim()) {
      setErrorMessage('Title, Address, and Monthly Rent parameters are explicitly required.')
      setIsSubmitting(false)
      return
    }

    // Explicitly parse the numeric price to fully safe formats
    const numericPrice = Number(price)
    if (isNaN(numericPrice) || numericPrice <= 0) {
      setErrorMessage('Please enter a valid numeric value greater than zero for Monthly Rent.')
      setIsSubmitting(false)
      return
    }

    try {
      // Direct insertion mapping structural schema parameters cleanly
      const { data, error } = await supabase
        .from('properties')
        .insert([
          {
            title: title.trim(),
            manual_address: manualAddress.trim(),
            address: manualAddress.trim(), // Dual fallback security mapping
            price: numericPrice, // CRITICAL FIX: Safe from null constraints
            bedrooms: parseInt(bedrooms) || 0,
            bathrooms: parseInt(bathrooms) || 0,
            bathroom_privacy: bathroomPrivacy,
            property_type: propertyType,
            description_rules: descriptionRules.trim(),
            contact_number: contactNumber.trim(),
            email_address: emailAddress.trim(),
            plus_code: plusCode.trim() || null,
            images: images.length > 0 ? images : null
          }
        ])
        .select()

      if (error) {
        throw new Error(error.message)
      }

      setSuccessMessage('Listing successfully verified and registered into platform ledger!')
      
      // Clear all state forms cleanly
      setTitle('')
      setManualAddress('')
      setPrice('')
      setBedrooms('0')
      setBathrooms('0')
      setDescriptionRules('')
      setContactNumber('')
      setEmailAddress('')
      setPlusCode('')
      setImages([])

      // Redirect back to discover feed after brief display pause
      setTimeout(() => {
        router.push('/')
      }, 2000)

    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred processing your registration payload.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Navigation Indicator Header */}
        <div className="mb-8">
          <a href="/" className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-emerald-600 transition">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Discover Feed
          </a>
        </div>

        {/* Master Panel Frame */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          
          <div className="bg-slate-950 px-6 py-8 text-center text-white relative">
            <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />
            <Building2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">Register Direct Property Unit</h1>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Your unit will list directly on the global market map index. Ensure all parameters match physical specifications.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-8">
            
            {/* Status Notifications Panel blocks */}
            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 text-rose-800 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div>{errorMessage}</div>
              </div>
            )}

            {successMessage && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 text-emerald-800 text-xs font-semibold">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                <div>{successMessage}</div>
              </div>
            )}

            {/* Core Metadata Frame Grid */}
            <div className="space-y-5">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">1. Core Metadata Details</h3>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Display Listing Title</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g., Luxury Studio Unit with Balcony near Downtown Hub"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Monthly Rental Pricing (₱ PHP)</label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="number"
                      required
                      min="1"
                      placeholder="e.g., 15000"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-emerald-600 transition"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Property Configuration Structure</label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 transition appearance-none"
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

            <hr className="border-slate-100" />

            {/* Layout Configuration Blueprint parameters */}
            <div className="space-y-5">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">2. Unit Space Layout parameters</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Bed className="w-3.5 h-3.5 text-slate-400" /> Bedrooms
                  </label>
                  <input 
                    type="number"
                    min="0"
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <ShowerHead className="w-3.5 h-3.5 text-slate-400" /> Bathrooms
                  </label>
                  <input 
                    type="number"
                    min="0"
                    value={bathrooms}
                    onChange={(e) => setBathrooms(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Bathroom Classification</label>
                  <select
                    value={bathroomPrivacy}
                    onChange={(e) => setBathroomPrivacy(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 transition"
                  >
                    <option value="Private">Completely Private</option>
                    <option value="Shared">Shared Access Common</option>
                  </select>
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Geographical Parameters Mapping */}
            <div className="space-y-5">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">3. Geographical Parameters Mapping</h3>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> Full Physical Address String
                </label>
                <input 
                  type="text"
                  required
                  placeholder="Street Name, Building / House Number, Barangay, City, Province"
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Google Maps Plus Code (Optional Helper)</label>
                <input 
                  type="text"
                  placeholder="e.g., 8V2M+V4 Davao City"
                  value={plusCode}
                  onChange={(e) => setPlusCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-emerald-600 transition"
                />
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Descriptions & Rules System */}
            <div className="space-y-5">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">4. Rules, Terms, and Overview Disclosures</h3>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-slate-400" /> Terms Overview & Guidelines
                </label>
                <textarea 
                  rows={4}
                  placeholder="State utility setups, payment advance bounds, curfew guidelines, or visitor constraints here clearly..."
                  value={descriptionRules}
                  onChange={(e) => setDescriptionRules(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 transition resize-none"
                />
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Offline Communication Channels */}
            <div className="space-y-5">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">5. Primary Offline Communication Channels</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> Mobile Contact Number
                  </label>
                  <input 
                    type="tel"
                    required
                    placeholder="e.g., +63 917 123 4567"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> Owner Email Address
                  </label>
                  <input 
                    type="email"
                    required
                    placeholder="e.g., contact.landlord@gmail.com"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 transition"
                  />
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* High Resolution Photo Registry */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">6. High Resolution Image Registry Assets</h3>
              
              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="Paste direct continuous image asset link URL (https://...)"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 transition"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="bg-slate-900 text-white font-bold px-4 rounded-xl flex items-center justify-center hover:bg-slate-800 transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {images.length > 0 && (
                <div className="bg-slate-50 p-4 border border-slate-100 rounded-2xl grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {images.map((img, index) => (
                    <div key={index} className="relative group aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 bg-white">
                      <img src={img} alt="Preview Asset" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImageUrl(index)}
                        className="absolute inset-0 bg-rose-600/90 text-white flex items-center justify-center font-bold text-xs opacity-0 group-hover:opacity-100 transition duration-200"
                      >
                        <Trash2 className="w-4 h-4 mr-1" /> Remove Link
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <hr className="border-slate-100" />

            {/* Master Submission Processing Control */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-4 rounded-xl uppercase tracking-wider transition-all disabled:bg-slate-300 disabled:cursor-not-allowed shadow-md"
            >
              {isSubmitting ? 'Processing Ledger Injection...' : 'Finalize & Post Property Listing'}
            </button>

          </form>
        </div>

      </div>
    </div>
  )
}