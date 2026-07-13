'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { 
  MapPin, Bed, ShowerHead, Maximize2, 
  ShieldCheck, Heart, Share2, 
  ChevronLeft, ChevronRight, User, CheckCircle2,
  AlertTriangle, Phone, Mail, Info, FileText
} from 'lucide-react'

// Initialize client-side Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function PropertyDetailsPage() {
  const params = useParams()
  const id = params?.id as string

  const [property, setProperty] = useState<any>(null)
  const [similarProperties, setSimilarProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [isFavorited, setIsFavorited] = useState(false)

  useEffect(() => {
    if (!id) return

    async function fetchPropertyData() {
      setLoading(true)
      
      // 1. Fetch current property record matching the correct structural columns
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single()

      if (!error && data) {
        setProperty(data)
        
        // 2. Fetch similar listings within the same property type
        const { data: similar } = await supabase
          .from('properties')
          .select('*')
          .eq('property_type', data.property_type)
          .neq('id', id)
          .limit(3)
        
        if (similar) {
          setSimilarProperties(similar)
        }
      }
      setLoading(false)
    }

    fetchPropertyData()
  }, [id])

  // Extract clean image array matching your structural parsing logic
  const getCleanImages = (propData: any): string[] => {
    if (!propData) return []
    
    if (propData.images && Array.isArray(propData.images) && propData.images.length > 0) {
      return propData.images
    }
    if (typeof propData.images === 'string' && propData.images.trim() !== '') {
      let cleanStr = propData.images.replace(/^\{|\}$/g, '')
      if (cleanStr.includes(',')) {
        return cleanStr.split(',').map((img: string) => img.replace(/"/g, '').trim())
      }
      return [cleanStr.replace(/"/g, '').trim()]
    }
    return []
  }

  const images = getCleanImages(property)

  const handleNextImage = () => {
    if (images.length === 0) return
    setActiveImageIndex((prev) => (prev + 1) % images.length)
  }

  const handlePrevImage = () => {
    if (images.length === 0) return
    setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-bold text-sm">Parsing property registration metadata...</p>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-md max-w-md text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-black text-slate-900">Listing Not Available</h2>
          <p className="text-slate-500 text-sm">The property listing you are trying to access has been unlisted, filled, or moved by the host.</p>
          <a href="/" className="inline-block w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition text-sm">
            Return to Homepage
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans antialiased pb-24">
      
      {/* Dynamic Context Header */}
      <div className="bg-white border-b border-slate-100 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <a href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-600 transition">
            <ChevronLeft className="w-4 h-4" /> Back to Discover feed
          </a>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsFavorited(!isFavorited)} 
              className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold ${
                isFavorited 
                  ? 'bg-rose-50 border-rose-200 text-rose-600' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} /> 
              {isFavorited ? 'Saved to Favorites' : 'Save Unit'}
            </button>
            <button className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-50 transition">
              <Share2 className="w-4 h-4" /> Share
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Details Panel (Left Column spanning 2 blocks) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Custom Image Gallery Presentation Platform */}
          <div className="relative bg-slate-900 aspect-[16/10] sm:aspect-[16/9] rounded-3xl overflow-hidden shadow-lg border border-slate-200 group">
            {images.length > 0 ? (
              <>
                <img 
                  src={images[activeImageIndex]} 
                  alt={`${property.title} View`} 
                  className="w-full h-full object-cover transition duration-300"
                />
                
                {images.length > 1 && (
                  <>
                    <button onClick={handlePrevImage} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 backdrop-blur-sm rounded-xl text-slate-800 shadow-md hover:bg-white transition opacity-0 group-hover:opacity-100">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={handleNextImage} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 backdrop-blur-sm rounded-xl text-slate-800 shadow-md hover:bg-white transition opacity-0 group-hover:opacity-100">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wider">
                      {activeImageIndex + 1} / {images.length} IMAGES
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                <Info className="w-8 h-8 opacity-40" />
                <span className="text-xs font-bold">No High-Res Imagery Provided</span>
              </div>
            )}
          </div>

          {/* Heading Information Wrapper */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-md">
                {property.property_type || 'Residential Unit'}
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified Host
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              {property.title}
            </h1>
            
            <div className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" /> {property.manual_address || property.address}
            </div>

            <hr className="border-slate-100" />

            {/* Core Blueprint Parameters Layout */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider">Bedrooms</div>
                <div className="text-slate-900 font-black text-base sm:text-lg flex items-center justify-center gap-1.5 mt-0.5">
                  <Bed className="w-4 h-4 text-emerald-600" /> {property.bedrooms || 0} BR
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider">Bathrooms</div>
                <div className="text-slate-900 font-black text-base sm:text-lg flex items-center justify-center gap-1.5 mt-0.5">
                  <ShowerHead className="w-4 h-4 text-emerald-600" /> {property.bathrooms || 0} BA
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider">Bathroom Type</div>
                <div className="text-slate-900 font-black text-[11px] truncate flex items-center justify-center gap-1 mt-1">
                  {property.bathroom_privacy || 'Standard'}
                </div>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">About this Rental Space</h3>
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
              {property.description_rules || property.description || "No detailed rules or descriptions provided."}
            </p>
          </div>

          {/* Geographical Location View Wrapper */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Geographical Location</h3>
            <div className="relative aspect-[16/7] w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
              <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-60" />
              <div className="relative z-10 text-center space-y-2 max-w-sm px-4">
                <div className="inline-flex p-3 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 shadow-sm animate-bounce">
                  <MapPin className="w-5 h-5 fill-current" />
                </div>
                <div className="text-xs font-bold text-slate-800">{property.manual_address || property.address}</div>
                {property.plus_code && (
                  <div className="inline-block bg-white border border-slate-200 text-slate-700 font-mono text-[10px] px-2 py-0.5 rounded-md mt-1 shadow-sm">
                    Plus Code: {property.plus_code}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Free Renter Connection Action Panel (Right Column) */}
        <div className="space-y-6">
          
          <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sticky top-8 space-y-6">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monthly Rent</div>
              <div className="text-3xl font-black text-slate-950 flex items-baseline gap-1 mt-0.5">
                ₱{property.price?.toLocaleString() || '0'}
                <span className="text-xs font-semibold text-slate-400">/ month</span>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Account Card */}
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-black text-slate-800 truncate">Platform Property Manager</div>
                <div className="text-[10px] text-slate-400 font-medium flex items-center gap-0.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 fill-white" /> Identity Attested
                </div>
              </div>
            </div>

            {/* Free Offline Communication Channel Triggers */}
            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Connect with Host</h4>
                <p className="text-[11px] text-slate-400 leading-normal">
                  No booking or hidden platform checkout fees required. Deal directly with the landlord offline.
                </p>
              </div>

              {/* Direct Call Anchor */}
              <a 
                href={`tel:${property.contact_number}`}
                className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3.5 rounded-xl uppercase tracking-wider transition-all shadow-sm"
              >
                <Phone className="w-4 h-4" /> Call Landlord ({property.contact_number})
              </a>

              {/* Direct Email Link */}
              <a 
                href={`mailto:${property.email_address}?subject=Inquiry regarding ${encodeURIComponent(property.title)}`}
                className="flex items-center justify-center gap-2 w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs py-3.5 rounded-xl uppercase tracking-wider transition-all"
              >
                <Mail className="w-4 h-4 text-slate-400" /> Send Email Inquiry
              </a>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-dashed border-slate-200 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-[11px] text-slate-500 leading-normal font-medium">
                <strong className="text-slate-700 block mb-0.5 font-bold">Offline Payment Rule</strong>
                Arrange security deposits and monthly terms securely with the owner directly.
              </div>
            </div>
          </div>

        </div>

      </main>

      {/* Similar Listings Carousel Recommendations Section */}
      {similarProperties.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-12 border-t border-slate-200">
          <div className="mb-8">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Similar Rental Options</h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Comparable configurations matching this specific profile tier.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {similarProperties.map((p) => {
              const imgArray = getCleanImages(p)
              const displayImg = imgArray.length > 0 ? imgArray[0] : null
              
              return (
                <a key={p.id} href={`/property/${p.id}`} className="group bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col h-full">
                  <div className="aspect-[16/11] bg-slate-100 relative overflow-hidden">
                    <span className="absolute top-3 left-3 z-20 text-[10px] font-black uppercase tracking-wider text-slate-700 bg-white/95 px-2.5 py-1 rounded-md shadow-sm">
                      {p.property_type || 'Unit'}
                    </span>
                    {displayImg ? (
                      <img src={displayImg} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">No Photo</div>
                    )}
                  </div>
                  <div className="p-5 flex flex-col justify-between flex-grow space-y-3">
                    <div>
                      <div className="text-xl font-black text-slate-950">₱{p.price?.toLocaleString()}</div>
                      <h3 className="text-xs font-bold text-slate-800 line-clamp-1 mt-0.5 group-hover:text-emerald-600 transition-colors">{p.title}</h3>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">📍 {p.manual_address || p.address}</div>
                    </div>
                  </div>
                </a>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}