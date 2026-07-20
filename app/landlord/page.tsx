'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { 
  FileText, MapPin, Phone, Image as ImageIcon, ArrowRight, LogOut, HelpCircle, Upload, X, Plus, Building2, RefreshCw, Trash2, Zap, Edit2
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
  
  // Create Form States
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

  // Edit Feature States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingProperty, setEditingProperty] = useState<any | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editPropertyType, setEditPropertyType] = useState('Apartment')
  const [editPrice, setEditPrice] = useState('')
  const [editBedrooms, setEditBedrooms] = useState('1')
  const [editBathrooms, setEditBathrooms] = useState('1')
  const [editArea, setEditArea] = useState('30')
  const [editRestroomPrivacy, setEditRestroomPrivacy] = useState('Private (Own Toilet)')
  const [editBathroomPrivacy, setEditBathroomPrivacy] = useState('Private (Own Shower)')
  const [editManualAddress, setEditManualAddress] = useState('')
  const [editPlusCode, setEditPlusCode] = useState('')
  const [editContactNumber, setEditContactNumber] = useState('')
  const [editDescriptionRules, setEditDescriptionRules] = useState('')

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

  // Edit Feature Form Setups
  const openEditModal = (property: any) => {
    setEditingProperty(property)
    setEditTitle(property.title || '')
    setEditPropertyType(property.property_type || 'Apartment')
    setEditPrice(property.price?.toString() || '')
    setEditBedrooms(property.bedrooms?.toString() || '1')
    setEditBathrooms(property.bathrooms?.toString() || '1')
    setEditArea(property.area_sqm?.toString() || '30')
    setEditRestroomPrivacy(property.restroom_privacy || 'Private (Own Toilet)')
    setEditBathroomPrivacy(property.bathroom_privacy || 'Private (Own Shower)')
    setEditManualAddress(property.manual_address || '')
    setEditPlusCode(property.plus_code || '')
    setEditContactNumber(property.contact_number || '')
    setEditDescriptionRules(property.description_rules || '')
    setIsEditModalOpen(true)
  }

  const handleUpdateProperty = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProperty) return
    setIsSubmitting(true)

    const parsedPrice = parseInt(editPrice, 10) || 0
    const parsedArea = parseFloat(editArea) || 0

    try {
      const { error } = await supabase
        .from('properties')
        .update({
          title: editTitle.trim(),
          property_type: editPropertyType,
          price: parsedPrice,
          bedrooms: parseInt(editBedrooms, 10) || 0,
          bathrooms: parseInt(editBathrooms, 10) || 0,
          area_sqm: parsedArea,
          restroom_privacy: editRestroomPrivacy,
          bathroom_privacy: editBathroomPrivacy,
          manual_address: editManualAddress.trim(),
          address: editManualAddress.trim(),
          plus_code: editPlusCode.trim() || null,
          contact_number: editContactNumber.trim(),
          description_rules: editDescriptionRules.trim(),
        })
        .eq('id', editingProperty.id)

      if (error) throw error

      // Update local state smoothly
      setMyProperties(prev => 
        prev.map(p => p.id === editingProperty.id 
          ? { 
              ...p, 
              title: editTitle.trim(),
              property_type: editPropertyType,
              price: parsedPrice,
              bedrooms: parseInt(editBedrooms, 10) || 0,
              bathrooms: parseInt(editBathrooms, 10) || 0,
              area_sqm: parsedArea,
              restroom_privacy: editRestroomPrivacy,
              bathroom_privacy: editBathroomPrivacy,
              manual_address: editManualAddress.trim(),
              address: editManualAddress.trim(),
              plus_code: editPlusCode.trim() || null,
              contact_number: editContactNumber.trim(),
              description_rules: editDescriptionRules.trim()
            } 
          : p
        )
      )

      setIsEditModalOpen(false)
      setEditingProperty(null)
      alert('Listing updated successfully!')
    } catch (err: any) {
      alert(err.message || 'Failed to update listing details.')
    } finally {
      setIsSubmitting(false)
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
                  <div key={property.id} className="bg-white border border-[#f1f5f9] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex flex-col justify-between relative">
                    <div>
                      {property.images && property.images.length > 0 ? (
                        <div className="w-full h-40 overflow-hidden rounded-t-2xl">
                          <img src={property.images[0]} alt="Property image" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-full h-40 bg-slate-50 flex items-center justify-center text-slate-300 rounded-t-2xl">
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
                    
                    <div className="flex flex-col border-t border-slate-50 bg-slate-50/50 rounded-b-2xl">
                      <div className="px-5 py-2.5 flex items-center justify-between text-[11px] font-semibold text-slate-400 border-b border-slate-100">
                        <span>{property.property_type}</span>
                        <span>{property.bedrooms} BR · {property.bathrooms} BA</span>
                      </div>
                      
                      {/* ACTION CONTROLS WRAPPER CELL */}
                      <div className="grid grid-cols-4 text-[10px] font-bold relative">
                        
                        {/* EDIT BUTTON */}
                        <button
                          type="button"
                          onClick={() => openEditModal(property)}
                          className="py-3 flex items-center justify-center gap-1 text-slate-600 hover:bg-slate-100 border-r border-slate-100 transition cursor-pointer rounded-bl-2xl"
                        >
                          <Edit2 className="w-3 h-3 text-slate-400" />
                          Edit
                        </button>

                        {/* EXTEND BUTTON TRIGGER */}
                        <div 
                          className="flex border-r border-slate-100"
                          onMouseEnter={() => setActiveExtendPopoverId(property.id)}
                          onMouseLeave={() => setActiveExtendPopoverId(null)}
                        >
                          <button
                            type="button"
                            className="w-full py-3 flex items-center justify-center gap-1 text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                          >
                            <RefreshCw className="w-3 h-3 text-slate-400" />
                            Extend
                          </button>
                        </div>
                        
                        {/* BOOST BUTTON TRIGGER */}
                        <div 
                          className="flex border-r border-slate-100"
                          onMouseEnter={() => setActiveBoostPopoverId(property.id)}
                          onMouseLeave={() => setActiveBoostPopoverId(null)}
                        >
                          <button
                            type="button"
                            className="w-full py-3 flex items-center justify-center gap-1 text-[#00aa4f] hover:bg-emerald-50 transition cursor-pointer"
                          >
                            <Zap className="w-3 h-3 text-[#00aa4f]" />
                            Boost
                          </button>
                        </div>
                        
                        {/* DELETE BUTTON */}
                        <button
                          type="button"
                          onClick={() => handleDeleteProperty(property.id)}
                          className="py-3 flex items-center justify-center gap-1 text-rose-600 hover:bg-rose-50 transition cursor-pointer rounded-br-2xl"
                        >
                          <Trash2 className="w-3 h-3 text-rose-400" />
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* EXTEND POPOVER - SAFE INSIDE CARD BOUNDARIES */}
                    {activeExtendPopoverId === property.id && (
                      <div 
                        className="absolute bottom-[44px] left-4 right-4 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-150"
                        onMouseEnter={() => setActiveExtendPopoverId(property.id)}
                        onMouseLeave={() => setActiveExtendPopoverId(null)}
                      >
                        <p className="text-[10px] uppercase font-black tracking-wider text-slate-400 border-b border-slate-50 pb-1.5 px-1">
                          Extension Options
                        </p>
                        
                        {/* Standard Extension */}
                        <button
                          type="button"
                          onClick={() => router.push(`/landlord/payment?total=20&propertyId=${property.id}&type=extension`)}
                          className="w-full text-left p-2.5 rounded-xl border border-slate-100 hover:border-[#00aa4f] hover:bg-emerald-50/30 transition flex justify-between items-center group cursor-pointer"
                        >
                          <div>
                            <p className="text-slate-800 font-black text-xs group-hover:text-[#00aa4f]">Standard 30-Day Extension</p>
                            <p className="text-[9px] text-slate-400 font-medium">Extend listing presence</p>
                          </div>
                          <span className="text-slate-700 font-black text-[11px]">₱20</span>
                        </button>

                        <p className="text-[9px] uppercase font-black tracking-wider text-[#00aa4f] pt-1 px-1">
                          Extend with Boost
                        </p>

                        <button
                          type="button"
                          onClick={() => router.push(`/landlord/payment?total=69&propertyId=${property.id}&type=extension&tier=5days`)}
                          className="w-full text-left p-2.5 rounded-xl border border-slate-100 hover:border-[#00aa4f] hover:bg-emerald-50/30 transition flex justify-between items-center group cursor-pointer"
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
                          className="w-full text-left p-2.5 rounded-xl border border-slate-100 hover:border-[#00aa4f] hover:bg-emerald-50/30 transition flex justify-between items-center group cursor-pointer"
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
                          className="w-full text-left p-2.5 rounded-xl border border-slate-100 hover:border-[#00aa4f] hover:bg-emerald-50/30 transition flex justify-between items-center group cursor-pointer"
                        >
                          <div>
                            <p className="text-slate-800 font-black text-xs group-hover:text-[#00aa4f]">with 1-Month Domination</p>
                            <p className="text-[9px] text-slate-400 font-medium">Extend + Premium Pinning</p>
                          </div>
                          <span className="text-[#00aa4f] font-black text-[11px]">₱219</span>
                        </button>
                      </div>
                    )}

                    {/* BOOST POPOVER - SAFE INSIDE CARD BOUNDARIES */}
                    {activeBoostPopoverId === property.id && (
                      <div 
                        className="absolute bottom-[44px] left-4 right-4 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-150"
                        onMouseEnter={() => setActiveBoostPopoverId(property.id)}
                        onMouseLeave={() => setActiveBoostPopoverId(null)}
                      >
                        <p className="text-[10px] uppercase font-black tracking-wider text-slate-400 border-b border-slate-50 pb-1.5 px-1">
                          Optional Visibility Rank Upgrades
                        </p>
                        
                        <button
                          type="button"
                          onClick={() => router.push(`/landlord/payment?total=49&propertyId=${property.id}&type=boost&tier=5days`)}
                          className="w-full text-left p-2.5 rounded-xl border border-slate-100 hover:border-[#00aa4f] hover:bg-emerald-50/30 transition flex justify-between items-center group cursor-pointer"
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
                          className="w-full text-left p-2.5 rounded-xl border border-slate-100 hover:border-[#00aa4f] hover:bg-emerald-50/30 transition flex justify-between items-center group cursor-pointer"
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
                          className="w-full text-left p-2.5 rounded-xl border border-slate-100 hover:border-[#00aa4f] hover:bg-emerald-50/30 transition flex justify-between items-center group cursor-pointer"
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
                    <option>Boarding House</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Monthly Rent (PHP)</label>
                  <input 
                    type="number"
                    required 
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g., 12000"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#00aa4f] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Bedrooms</label>
                  <input 
                    type="number"
                    required 
                    min="0"
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#00aa4f] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Bathrooms</label>
                  <input 
                    type="number"
                    required 
                    min="0"
                    value={bathrooms}
                    onChange={(e) => setBathrooms(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#00aa4f] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Floor Area (sqm)</label>
                  <input 
                    type="number"
                    required 
                    min="0"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#00aa4f] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Toilet Privacy</label>
                  <select 
                    value={restroomPrivacy}
                    onChange={(e) => setRestroomPrivacy(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#00aa4f] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none transition"
                  >
                    <option>Private (Own Toilet)</option>
                    <option>Shared</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Shower Privacy</label>
                  <select 
                    value={bathroomPrivacy}
                    onChange={(e) => setBathroomPrivacy(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#00aa4f] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none transition"
                  >
                    <option>Private (Own Shower)</option>
                    <option>Shared</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 border-b border-slate-50 pb-2">2. Location Details</h2>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Complete Address</label>
                <input 
                  type="text" 
                  required 
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  placeholder="Street, Barangay, City/Municipality, Province"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#00aa4f] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none transition"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                  Google Plus Code 
                  <span className="text-[10px] text-slate-400 font-normal">(Optional but highly recommended)</span>
                </label>
                <input 
                  type="text" 
                  value={plusCode}
                  onChange={(e) => setPlusCode(e.target.value)}
                  placeholder="e.g., 7Q2R+3P Manila, Metro Manila"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#00aa4f] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none transition"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 border-b border-slate-50 pb-2">3. Contact & Rules</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Contact Number</label>
                  <input 
                    type="text" 
                    required 
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="e.g., +639123456789"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#00aa4f] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Email Address</label>
                  <input 
                    type="email" 
                    required 
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none cursor-not-allowed"
                    readOnly
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Additional Descriptions & House Rules</label>
                <textarea 
                  required 
                  value={descriptionRules}
                  onChange={(e) => setDescriptionRules(e.target.value)}
                  rows={4}
                  placeholder="Describe your property amenities and specific house rules (e.g., No pets allowed, Curfew at 10 PM)."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#00aa4f] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none transition resize-none"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 border-b border-slate-50 pb-2 flex justify-between items-end">
                <span>4. Property Photos</span>
                <span className="text-[10px] normal-case text-slate-400 font-medium">Max 10 images</span>
              </h2>
              
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50/50 hover:bg-slate-50 transition relative">
                <input 
                  type="file" 
                  multiple 
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center pointer-events-none">
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <p className="text-xs font-bold text-slate-600">Click or drag images here</p>
                  <p className="text-[10px] text-slate-400 mt-1">JPG, PNG, WEBP supported</p>
                </div>
              </div>

              {selectedFiles.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
                  {selectedFiles.map((item, index) => (
                    <div key={index} className="relative group rounded-xl overflow-hidden aspect-square border border-slate-200 bg-slate-100">
                      <img src={item.previewUrl} alt="preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-1.5 right-1.5 bg-rose-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow-sm"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5">
              <h2 className="text-sm font-black uppercase tracking-wider text-[#00aa4f] border-b border-emerald-100/50 pb-2 flex items-center gap-1.5">
                <Zap className="w-4 h-4" /> Optional Listing Boost
              </h2>
              <p className="text-xs text-slate-500">Stand out from the crowd! Pinned listings receive up to 5x more inquiries.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
                {[
                  { id: 'none', label: 'Standard Listing', desc: 'No boost', price: 0 },
                  { id: '5days', label: 'Hot Boost', desc: '5 Days Priority', price: 49 },
                  { id: '2weeks', label: 'Visibility Surge', desc: '14 Days Promoted', price: 99 },
                  { id: '1month', label: 'Market Domination', desc: '30 Days Pinned', price: 199 },
                ].map(option => (
                  <label 
                    key={option.id}
                    className={`border rounded-xl p-3 flex flex-col cursor-pointer transition ${
                      boostingOption === option.id 
                        ? 'border-[#00aa4f] bg-emerald-50 shadow-sm ring-1 ring-[#00aa4f]/20' 
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="boost" 
                      value={option.id}
                      checked={boostingOption === option.id}
                      onChange={() => setBoostingOption(option.id)}
                      className="sr-only"
                    />
                    <span className={`text-[11px] font-black uppercase tracking-wider ${boostingOption === option.id ? 'text-[#00aa4f]' : 'text-slate-600'}`}>
                      {option.label}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">{option.desc}</span>
                    <span className={`text-xs font-bold mt-auto pt-2 ${boostingOption === option.id ? 'text-slate-800' : 'text-slate-500'}`}>
                      {option.price === 0 ? 'Free' : `+₱${option.price}`}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-800 text-white p-5 rounded-2xl gap-4">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Payable Amount</p>
                <p className="text-2xl font-black text-[#00aa4f]">₱{totalAmount}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Includes standard listing fee (₱{BASE_PRICE})</p>
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full sm:w-auto bg-[#00aa4f] hover:bg-[#009444] text-white font-bold text-xs px-8 py-3.5 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
              >
                {isSubmitting ? 'Processing...' : 'Proceed to Payment'}
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>

          </form>
        )}
      </main>

      {/* EDIT MODAL OVERLAY */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="text-sm font-black text-slate-800">Edit Listing Information</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Update particulars for {editTitle}</p>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500">Listing Title</label>
                  <input 
                    type="text" 
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-[#00aa4f] rounded-xl px-3.5 py-2 text-xs font-medium outline-none transition"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500">Property Category</label>
                    <select 
                      value={editPropertyType}
                      onChange={(e) => setEditPropertyType(e.target.value)}
                      className="w-full bg-white border border-slate-200 focus:border-[#00aa4f] rounded-xl px-3.5 py-2 text-xs font-medium outline-none transition"
                    >
                      <option>Apartment</option>
                      <option>Condo Unit</option>
                      <option>Dormitory Bedspace</option>
                      <option>Single House</option>
                      <option>Room Rental Only</option>
                      <option>Boarding House</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500">Monthly Rent (PHP)</label>
                    <input 
                      type="number"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="w-full bg-white border border-slate-200 focus:border-[#00aa4f] rounded-xl px-3.5 py-2 text-xs font-medium outline-none transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500">Bedrooms</label>
                    <input 
                      type="number"
                      value={editBedrooms}
                      onChange={(e) => setEditBedrooms(e.target.value)}
                      className="w-full bg-white border border-slate-200 focus:border-[#00aa4f] rounded-xl px-3.5 py-2 text-xs font-medium outline-none transition"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500">Bathrooms</label>
                    <input 
                      type="number"
                      value={editBathrooms}
                      onChange={(e) => setEditBathrooms(e.target.value)}
                      className="w-full bg-white border border-slate-200 focus:border-[#00aa4f] rounded-xl px-3.5 py-2 text-xs font-medium outline-none transition"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500">Area (sqm)</label>
                    <input 
                      type="number"
                      value={editArea}
                      onChange={(e) => setEditArea(e.target.value)}
                      className="w-full bg-white border border-slate-200 focus:border-[#00aa4f] rounded-xl px-3.5 py-2 text-xs font-medium outline-none transition"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500">Complete Address</label>
                  <input 
                    type="text"
                    value={editManualAddress}
                    onChange={(e) => setEditManualAddress(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-[#00aa4f] rounded-xl px-3.5 py-2 text-xs font-medium outline-none transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500">Descriptions & House Rules</label>
                  <textarea 
                    value={editDescriptionRules}
                    onChange={(e) => setEditDescriptionRules(e.target.value)}
                    rows={3}
                    className="w-full bg-white border border-slate-200 focus:border-[#00aa4f] rounded-xl px-3.5 py-2 text-xs font-medium outline-none transition resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-3xl">
              <button 
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleUpdateProperty}
                disabled={isSubmitting}
                className="bg-[#00aa4f] hover:bg-[#009444] text-white px-5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}