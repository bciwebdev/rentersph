import React from 'react'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { notFound } from 'next/navigation'

interface Props { 
  params: Promise<{ id: string }> 
}

export default async function PropertyPage({ params }: Props) {
  const { id } = await params
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  // Parse the ID string into an integer base-10 for your int8 column match
  const numericId = parseInt(id, 10)

  if (isNaN(numericId)) {
    notFound()
  }

  const { data: property, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', numericId)
    .single()

  if (error || !property) {
    console.error("Database query returned error object:", error)
    notFound()
  }

  const getDisplayImage = (images: any) => {
    if (!images) return null
    if (Array.isArray(images) && images.length > 0) return images[0]
    if (typeof images === 'string') {
      let cleanStr = images.replace(/^\{|\}$/g, '')
      return cleanStr.split(',')[0].replace(/"/g, '')
    }
    return null
  }

  const img = getDisplayImage(property.images)

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased pb-24">
      <header className="px-6 py-4 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <a href="/" className="text-sm font-bold text-blue-600 hover:underline">
            ← Back to Home
          </a>
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded font-mono">
            Listing Reference: #{numericId}
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto mt-8 px-6 grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-8 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="aspect-[16/10] bg-gray-100 rounded-xl overflow-hidden">
            {img ? (
              <img src={img} alt={property.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
            )}
          </div>
          <h1 className="text-2xl font-black text-gray-900">{property.title}</h1>
          <p className="text-sm text-gray-500">📍 {property.address}</p>
          
          <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl text-center text-sm font-bold text-gray-700">
            <div>🛏️ {property.bedrooms} BR</div>
            <div>🚿 {property.bathrooms} BA</div>
            <div>📐 {property.area} sqm</div>
          </div>

          {property.description && (
            <div className="pt-2">
              <h3 className="text-xs font-bold uppercase text-gray-400 mb-1">Details</h3>
              <p className="text-sm text-gray-600 bg-slate-50 p-4 rounded-xl leading-relaxed whitespace-pre-wrap">
                {property.description}
              </p>
            </div>
          )}
        </div>

        <div className="md:col-span-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm h-fit space-y-4">
          <div>
            <div className="text-xs text-gray-400 uppercase font-bold">Monthly Rental</div>
            <div className="text-3xl font-black text-gray-900">₱{property.price.toLocaleString()}</div>
          </div>
          <hr className="border-gray-100" />
          <div className="text-sm space-y-1 text-gray-700">
            <p className="font-bold">Contact Options:</p>
            {property.contact_number && <p>📞 {property.contact_number}</p>}
            {property.email && <p>✉️ {property.email}</p>}
          </div>
        </div>
      </main>
    </div>
  )
}