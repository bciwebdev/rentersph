'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { 
  FileText, MapPin, Phone, Image as ImageIcon, ArrowRight, LogOut, HelpCircle, Upload, X, Plus, Building2, RefreshCw, Trash2, Zap, Edit2, ShieldAlert, ShieldCheck, UserCheck, Camera, CheckCircle2
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
  
  // Verification States
  const [isVerified, setIsVerified] = useState<boolean>(false)
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false)
  const [verificationFullName, setVerificationFullName] = useState('')
  const [idPhoto, setIdPhoto] = useState<SelectedFile | null>(null)
  const [selfieWithIdPhoto, setSelfieWithIdPhoto] = useState<SelectedFile | null>(null)
  const [isSubmittingVerification, setIsSubmittingVerification] = useState(false)
  const [verificationError, setVerificationError] = useState<string | null>(null)

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
      if (idPhoto) URL.revokeObjectURL(idPhoto.previewUrl)
      if (selfieWithIdPhoto) URL.revokeObjectURL(selfieWithIdPhoto.previewUrl)
    }
  }, [selectedFiles, idPhoto, selfieWithIdPhoto])

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
        
        // Fetch Landlord Verification Status
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_verified, full_name')
          .eq('id', user.id)
          .single()

        if (profile?.is_verified) {
          setIsVerified(true)
        }
        if (profile?.full_name) {
          setVerificationFullName(profile.full_name)
        }
        
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

  const handleCreateClick = () => {
    if (!isVerified) {
      setIsVerificationModalOpen(true)
      return
    }
    setCurrentView('create')
  }

  const handleIdPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (idPhoto) URL.revokeObjectURL(idPhoto.previewUrl)
      setIdPhoto({ file, previewUrl: URL.createObjectURL(file) })
    }
  }

  const handleSelfiePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (selfieWithIdPhoto) URL.revokeObjectURL(selfieWithIdPhoto.previewUrl)
      setSelfieWithIdPhoto({ file, previewUrl: URL.createObjectURL(file) })
    }
  }

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!verificationFullName.trim()) {
      setVerificationError("Please enter your full legal name as shown on your ID.")
      return
    }
    if (!idPhoto) {
      setVerificationError("Please upload a photo of your Valid Government ID.")
      return
    }
    if (!selfieWithIdPhoto) {
      setVerificationError("Please upload a photo of yourself holding your Valid ID.")
      return
    }

    setIsSubmittingVerification(true)
    setVerificationError(null)

    try {
      // 1. Upload ID Photo
      const idExt = idPhoto.file.name.split('.').pop()
      const idFilePath = `verifications/${userId}_id_${Date.now()}.${idExt}`
      const { error: uploadIdErr } = await supabase.storage
        .from('verification-docs')
        .upload(idFilePath, idPhoto.file)

      if (uploadIdErr) throw new Error(`ID Upload error: ${uploadIdErr.message}`)

      const { data: { publicUrl: idPublicUrl } } = supabase.storage
        .from('verification-docs')
        .getPublicUrl(idFilePath)

      // 2. Upload Selfie Photo
      const selfieExt = selfieWithIdPhoto.file.name.split('.').pop()
      const selfieFilePath = `verifications/${userId}_selfie_${Date.now()}.${selfieExt}`
      const { error: uploadSelfieErr } = await supabase.storage
        .from('verification-docs')
        .upload(selfieFilePath, selfieWithIdPhoto.file)

      if (uploadSelfieErr) throw new Error(`Selfie Upload error: ${uploadSelfieErr.message}`)

      const { data: { publicUrl: selfiePublicUrl } } = supabase.storage
        .from('verification-docs')
        .getPublicUrl(selfieFilePath)

      // 3. Save to verification table & Update Profile
      const { error: verErr } = await supabase
        .from('landlord_verifications')
        .insert([{
          user_id: userId,
          full_name: verificationFullName.trim(),
          id_photo_url: idPublicUrl,
          selfie_photo_url: selfiePublicUrl,
          status: 'pending'
        }])

      if (verErr) throw verErr

      // Auto mark or set pending status
      await supabase
        .from('profiles')
        .update({ full_name: verificationFullName.trim(), is_verified: true })
        .eq('id', userId)

      setIsVerified(true)
      setIsVerificationModalOpen(false)
      alert("Verification details submitted successfully! You can now create property listings.")
    } catch (err: any) {
      setVerificationError(err.message || "An error occurred during verification submission.")
    } finally {
      setIsSubmittingVerification(false)
    }
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

    if (!isVerified) {
      setIsVerificationModalOpen(true)
      return
    }

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
        
        {/* UNVERIFIED WARNING BANNER */}
        {!isVerified && (
          <div className="mb-6 bg-amber-50/80 border border-amber-200/80 p-5 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 bg-amber-100/80 text-amber-700 rounded-2xl flex items-center justify-center shrink-0 mt-0.5">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-amber-900">Identity Verification Required</h4>
                <p className="text-xs text-amber-700/90 mt-0.5">
                  You cannot post rental listings yet. Please verify your identity to ensure safety across the rentersPH workspace.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsVerificationModalOpen(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white font-black text-xs px-5 py-3 rounded-xl transition shadow-sm shrink-0 uppercase tracking-wider cursor-pointer"
            >
              GET VERIFIED NOW
            </button>
          </div>
        )}

        {currentView === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white border border-[#f1f5f9] p-5 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
              <div>
                <h3 className="text-sm font-black text-slate-800">Your Active Portfolio</h3>
                <p className="text-xs text-slate-400">Total Properties Registered: {myProperties.length}</p>
              </div>
              <button
                type="button"
                onClick={handleCreateClick}
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

            {/* 1. CORE SPECIFICATIONS */}
            <div className="space-y-4">
              <h2 className="text-xs font-black uppercase tracking-wider text-emerald-800/60 border-b border-slate-50 pb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#00aa4f]" /> 1. CORE SPECIFICATIONS
              </h2>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">LISTING TITLE</label>
                <input 
                  type="text" 
                  required 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Modern Minimalist Studio near SM"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#00aa4f] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none transition"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">PROPERTY TYPE</label>
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
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">PRICE (PHP / MO)</label>
                  <input 
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="18500"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#00aa4f] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">BEDROOMS</label>
                  <input 
                    type="number"
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    placeholder="1"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#00aa4f] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">BATHROOMS</label>
                  <input 
                    type="number"
                    value={bathrooms}
                    onChange={(e) => setBathrooms(e.target.value)}
                    placeholder="1"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#00aa4f] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">AREA (SQM)</label>
                  <input 
                    type="number"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="30"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#00aa4f] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">RESTROOM PRIVACY</label>
                  <select 
                    value={restroomPrivacy}
                    onChange={(e) => setRestroomPrivacy(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#00aa4f] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none transition"
                  >
                    <option>Private (Own Toilet)</option>
                    <option>Shared Restroom</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">BATHROOM PRIVACY</label>
                  <select 
                    value={bathroomPrivacy}
                    onChange={(e) => setBathroomPrivacy(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#00aa4f] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none transition"
                  >
                    <option>Private (Own Shower)</option>
                    <option>Shared Bathroom</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2. ADDRESS LOCATION */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h2 className="text-xs font-black uppercase tracking-wider text-emerald-800/60 border-b border-slate-50 pb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#00aa4f]" /> 2. ADDRESS LOCATION
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">MANUAL ADDRESS</label>
                  <input 
                    type="text" 
                    required
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    placeholder="Ecoland, Davao City"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#00aa4f] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">GOOGLE MAPS PLUS CODE (OPTIONAL)</label>
                  <input 
                    type="text" 
                    value={plusCode}
                    onChange={(e) => setPlusCode(e.target.value)}
                    placeholder="e.g. VFF7+HQ Davao City"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#00aa4f] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* 3. CONTACT PARAMETERS */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h2 className="text-xs font-black uppercase tracking-wider text-emerald-800/60 border-b border-slate-50 pb-2 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#00aa4f]" /> 3. CONTACT PARAMETERS
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">CONTACT NUMBER</label>
                  <input 
                    type="text" 
                    required
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="0917XXXXXXX"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#00aa4f] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">EMAIL ADDRESS</label>
                  <input 
                    type="email" 
                    readOnly
                    value={emailAddress}
                    placeholder="landlord@email.com"
                    className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* 4. DETAILED DESCRIPTION & RULES */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h2 className="text-xs font-black uppercase tracking-wider text-emerald-800/60 border-b border-slate-50 pb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#00aa4f]" /> 4. DETAILED DESCRIPTION & RULES
              </h2>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">PROPERTY DESCRIPTION & RULES</label>
                <textarea 
                  rows={4}
                  value={descriptionRules}
                  onChange={(e) => setDescriptionRules(e.target.value)}
                  placeholder="Provide details about payment terms, utilities, and roommate rules..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#00aa4f] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none transition resize-y"
                />
              </div>
            </div>

            {/* 5. HIGH-RES PRESENTATION MEDIA */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h2 className="text-xs font-black uppercase tracking-wider text-emerald-800/60 border-b border-slate-50 pb-2 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#00aa4f]" /> 5. HIGH-RES PRESENTATION MEDIA
              </h2>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">COVER IMAGE</label>
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex items-center gap-3">
                  <label className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-lg cursor-pointer transition shrink-0">
                    Choose File
                    <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                  <span className="text-xs text-slate-400">
                    {selectedFiles.length > 0 ? `${selectedFiles.length} file(s) selected` : 'No file chosen'}
                  </span>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mt-3">
                    {selectedFiles.map((item, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden h-20 border border-slate-200">
                        <img src={item.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-1 opacity-90 hover:opacity-100 transition"
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
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                <h2 className="text-xs font-black uppercase tracking-wider text-emerald-800/60 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00aa4f]" /> 6. LISTING PACKAGE & VISIBILITY RANK
                </h2>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowTooltip(!showTooltip)}
                    className="text-xs font-bold text-[#00aa4f] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    What is boosting? <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                  {showTooltip && (
                    <div className="absolute right-0 top-6 bg-slate-900 text-white text-[11px] p-3 rounded-xl shadow-xl w-64 z-50">
                      Boosting elevates your listing to the top of search results and homepage features for selected durations!
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">LISTING PACKAGE & VISIBILITY RANK</label>
                <select 
                  value={boostingOption}
                  onChange={(e) => setBoostingOption(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-emerald-500/80 focus:border-[#00aa4f] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none transition"
                >
                  <option value="none">Standard Listing — ₱20 (Active for 30 Days)</option>
                  <option value="5days">5-Day Hot Boost — ₱69 (₱20 base + ₱49 boost)</option>
                  <option value="2weeks">2-Week Visibility Surge — ₱119 (₱20 base + ₱99 boost)</option>
                  <option value="1month">1-Month Domination — ₱219 (₱20 base + ₱199 boost)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">* Standard tier active timeline begins immediately upon payment verification completion.</p>
              </div>
            </div>

            {/* Submit Control */}
            <div className="pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#00aa4f] hover:bg-[#009444] text-white font-bold text-xs py-3.5 rounded-xl transition cursor-pointer shadow-md disabled:opacity-50"
              >
                {isSubmitting ? 'Processing...' : 'Proceed to Payment Allocation'}
              </button>
            </div>
          </form>
        )}

      </main>

      {/* IDENTITY VERIFICATION MODAL */}
      {isVerificationModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative my-8">
            <button
              type="button"
              onClick={() => setIsVerificationModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 bg-emerald-50 text-[#00aa4f] rounded-2xl flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">Landlord Identity Verification</h3>
                <p className="text-xs text-slate-400">Complete verification to unlock property listing privileges.</p>
              </div>
            </div>

            {verificationError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-bold">
                {verificationError}
              </div>
            )}

            <form onSubmit={handleVerificationSubmit} className="space-y-5 mt-5">
              
              {/* LANDLORD FULL NAME */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 flex justify-between">
                  <span>Full Name (as stated on Valid ID)</span>
                  <span className="text-rose-500 font-normal text-[11px]">Must match ID</span>
                </label>
                <input
                  type="text"
                  required
                  value={verificationFullName}
                  onChange={(e) => setVerificationFullName(e.target.value)}
                  placeholder="e.g., Juan Dela Cruz"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#00aa4f] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none transition"
                />
                <p className="text-[11px] text-slate-400">
                  Your Landlord Name on property listings will be matched against this name.
                </p>
              </div>

              {/* UPLOAD VALID ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">1. Photo of Valid Government ID</label>
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 bg-slate-50/50 hover:bg-slate-50 transition text-center relative">
                  {idPhoto ? (
                    <div className="relative group">
                      <img src={idPhoto.previewUrl} alt="Valid ID Preview" className="h-32 mx-auto rounded-xl object-cover" />
                      <button
                        type="button"
                        onClick={() => setIdPhoto(null)}
                        className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-1 shadow hover:bg-rose-700"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center justify-center py-2">
                      <Upload className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-xs font-bold text-slate-600">Upload Valid ID Photo</span>
                      <span className="text-[10px] text-slate-400">Passport, Driver's License, UMID, National ID</span>
                      <input type="file" accept="image/*" onChange={handleIdPhotoChange} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              {/* UPLOAD SELFIE HOLDING ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">2. Photo of You Holding the Same Valid ID</label>
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 bg-slate-50/50 hover:bg-slate-50 transition text-center relative">
                  {selfieWithIdPhoto ? (
                    <div className="relative group">
                      <img src={selfieWithIdPhoto.previewUrl} alt="Selfie with ID Preview" className="h-32 mx-auto rounded-xl object-cover" />
                      <button
                        type="button"
                        onClick={() => setSelfieWithIdPhoto(null)}
                        className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-1 shadow hover:bg-rose-700"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center justify-center py-2">
                      <Camera className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-xs font-bold text-slate-600">Upload Selfie holding ID</span>
                      <span className="text-[10px] text-slate-400">Make sure face and ID details are clearly visible</span>
                      <input type="file" accept="image/*" onChange={handleSelfiePhotoChange} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsVerificationModalOpen(false)}
                  className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingVerification}
                  className="w-1/2 py-3 bg-[#00aa4f] hover:bg-[#009444] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isSubmittingVerification ? 'Submitting...' : 'Submit Verification'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <button 
              type="button" 
              onClick={() => setIsEditModalOpen(false)} 
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-base font-black text-slate-800 border-b border-slate-100 pb-3">Edit Listing Details</h3>
            
            <form onSubmit={handleUpdateProperty} className="space-y-4 mt-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Title</label>
                <input 
                  type="text" 
                  value={editTitle} 
                  onChange={(e) => setEditTitle(e.target.value)} 
                  required 
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#00aa4f] focus:bg-white rounded-xl px-3 py-2 text-xs font-medium outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Price (PHP)</label>
                  <input 
                    type="number" 
                    value={editPrice} 
                    onChange={(e) => setEditPrice(e.target.value)} 
                    required 
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#00aa4f] focus:bg-white rounded-xl px-3 py-2 text-xs font-medium outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Contact Number</label>
                  <input 
                    type="text" 
                    value={editContactNumber} 
                    onChange={(e) => setEditContactNumber(e.target.value)} 
                    required 
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#00aa4f] focus:bg-white rounded-xl px-3 py-2 text-xs font-medium outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Address</label>
                <input 
                  type="text" 
                  value={editManualAddress} 
                  onChange={(e) => setEditManualAddress(e.target.value)} 
                  required 
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#00aa4f] focus:bg-white rounded-xl px-3 py-2 text-xs font-medium outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)} 
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="px-5 py-2 bg-[#00aa4f] hover:bg-[#009444] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}