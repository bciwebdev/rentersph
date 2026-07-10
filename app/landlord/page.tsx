'use client'

import React, { useActionState, useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { createProperty } from './actions'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LandlordPage() {
  const [state, formAction, isPending] = useActionState(createProperty, null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  // Security gate verification loop
  useEffect(() => {
    async function checkUserSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        // Not logged in -> boot out to the login interface
        window.location.href = '/login'
      } else {
        setCheckingAuth(false)
      }
    }
    checkUserSession()
  }, [])

  // Show a blank loading state while confirming security state
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400 font-bold text-sm animate-pulse">
        🔒 Verifying credentials session safety...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans antialiased py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-8">
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Create Rental Listing</h1>
            <p className="text-sm font-medium text-gray-500 mt-1">Fill out the details below to add your unit to rentersPH.</p>
          </div>
          <button 
            onClick={async () => { await supabase.auth.signOut(); window.location.href = '/'; }} 
            className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100/50 px-4 py-2 rounded-xl border border-red-100 transition"
          >
            Sign Out
          </button>
        </div>

        <form action={formAction} className="space-y-6">
          {state?.error && (
            <div className="p-4 bg-red-50 text-red-700 text-sm font-bold rounded-xl border border-red-100">
              ⚠️ {state.error}
            </div>
          )}

          <div>
            <label className="block text-xs font-black uppercase text-gray-400 mb-1.5 tracking-wider">Listing Title</label>
            <input required name="title" type="text" placeholder="e.g. Modern Minimalist Studio near SM" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase text-gray-400 mb-1.5 tracking-wider">Property Type</label>
              <select name="property_type" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none cursor-pointer">
                <option value="Apartment">Apartment</option>
                <option value="Condominium">Condominium</option>
                <option value="House">House</option>
                <option value="Boarding House">Boarding House</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-gray-400 mb-1.5 tracking-wider">Price (PHP / MO)</label>
              <input required name="price" type="number" placeholder="18500" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-black uppercase text-gray-400 mb-1.5 tracking-wider">Bedrooms</label>
              <input required name="bedrooms" type="number" placeholder="1" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-gray-400 mb-1.5 tracking-wider">Bathrooms</label>
              <input required name="bathrooms" type="number" placeholder="1" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-gray-400 mb-1.5 tracking-wider">Area (SQM)</label>
              <input required name="area" type="number" placeholder="30" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase text-gray-400 mb-1.5 tracking-wider">Restroom Privacy</label>
              <select name="restroom_type" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none cursor-pointer">
                <option value="Private (Own Toilet)">Private (Own Toilet)</option>
                <option value="Shared Restroom">Shared Restroom</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-gray-400 mb-1.5 tracking-wider">Bathroom Privacy</label>
              <select name="bathroom_type" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none cursor-pointer">
                <option value="Private (Own Shower)">Private (Own Shower)</option>
                <option value="Shared Bathroom">Shared Bathroom</option>
              </select>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-xs font-black uppercase text-gray-400 mb-3 tracking-wider">Address Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 tracking-wider">Manual Address</label>
                <input required name="address" type="text" placeholder="Ecoland, Davao City" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 tracking-wider">Google Maps Plus Code (Optional)</label>
                <input name="plus_code" type="text" placeholder="e.g. VFF7+HQ Davao City" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase text-gray-400 mb-1.5 tracking-wider">Contact Number</label>
              <input required name="contact_number" type="text" placeholder="0917XXXXXXX" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-gray-400 mb-1.5 tracking-wider">Email Address</label>
              <input required name="email" type="email" placeholder="landlord@email.com" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-gray-400 mb-1.5 tracking-wider">Property Description & Rules</label>
            <textarea name="description" rows={4} placeholder="Provide details about payment terms, utilities, and roommate rules..." className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none resize-none" />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-gray-400 mb-1.5 tracking-wider">Cover Image</label>
            <input name="cover_image" type="file" accept="image/*" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-gray-200 file:text-gray-700 hover:file:bg-gray-300 cursor-pointer" />
          </div>

          {/* UPDATED: Package Options with clean price tags attached */}
          <div>
            <label className="block text-xs font-black uppercase text-gray-400 mb-1.5 tracking-wider">Listing Package & Visibility Rank</label>
            <select name="boost_tier" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none cursor-pointer">
              <option value="none">Standard Listing — ₱20</option>
              <option value="3_days">🚀 3-Day Visibility Boost — ₱49</option>
              <option value="1_week">🚀 1-Week Visibility Boost — ₱99</option>
              <option value="1_month">🚀 1-Month Visibility Boost — ₱399</option>
            </select>
          </div>

          <button 
            type="submit" 
            disabled={isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold text-sm py-3.5 rounded-xl transition shadow-sm"
          >
            {isPending ? 'Publishing Listing...' : 'Publish Rental Listing'}
          </button>
        </form>

      </div>
    </div>
  )
}