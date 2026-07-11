'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { ShieldAlert, CheckCircle, Clock, MapPin, User, Hash, DollarSign, LogOut } from 'lucide-react'

// Initialize Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Authorized Admin Email Parameter
const ALLOWED_ADMIN_EMAIL = 'bciwebdev25@gmail.com'

interface Listing {
  id: string
  title: string
  property_type: string
  price_per_month: number
  manual_address: string
  contact_number: string
  email_address: string
  listing_package: string
  listing_status: string
  gcash_name: string
  gcash_reference: string
  created_at: string
}

export default function AdminVerificationDashboard() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending_payment' | 'active'>('pending_payment')

  useEffect(() => {
    const checkUserAndFetch = async () => {
      setLoading(true)
      
      // Fetch active session credentials
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (user && user.email === ALLOWED_ADMIN_EMAIL) {
        setUserEmail(user.email)
        setIsAuthenticated(true)
        
        // Fetch listings directly inside the valid auth chain
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .order('created_at', { ascending: false })

        if (!error && data) {
          setListings(data)
        }
      }
      setLoading(false)
    }

    checkUserAndFetch()
  }, [])

  // Approve Action: Upgrades status to 'active', enabling user search discovery
  const handleApprove = async (id: string) => {
    setActionLoadingId(id)
    const { error } = await supabase
      .from('listings')
      .update({ listing_status: 'active' })
      .eq('id', id)

    if (!error) {
      // Update local state arrays fluidly
      setListings(prev => prev.map(item => item.id === id ? { ...item, listing_status: 'active' } : item))
    }
    setActionLoadingId(null)
  }

  const handleAdminSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const filteredListings = listings.filter(item => {
    if (filterStatus === 'all') return true
    return item.listing_status === filterStatus
  })

  // Loading indicator while auth completes verification handshakes
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-center space-y-2">
          <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-slate-500 tracking-wider uppercase">Verifying Authorization Credentials...</p>
        </div>
      </div>
    )
  }

  // Security Wall: Blocks rendering entirely if email token doesn't match
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center font-sans antialiased">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-sm space-y-4 shadow-2xl">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto animate-pulse" />
          <h1 className="text-white font-black text-lg tracking-tight">403 — Unauthorized Access</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            This workspace routing channel is strictly restricted. Please authenticate through authorized profiles to review administrative models.
          </p>
          <a href="/login" className="inline-block w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-3 rounded-xl transition text-center shadow-sm">
            Go to Portal Login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 font-sans antialiased py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Admin Header Tracker */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider bg-slate-950 text-white px-2.5 py-1 rounded-md">
              Root Administrator Control
            </span>
            <h1 className="text-2xl font-black text-slate-950 tracking-tight pt-1">Payment Verification Queue</h1>
            <p className="text-xs text-slate-400 font-medium">Review submitted GCash reference details to manual approve storefront visibility.</p>
          </div>
          
          <div className="flex items-center gap-3 self-start sm:self-center">
            <div className="text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl">
              Admin: <span className="font-bold text-slate-900">{userEmail}</span>
            </div>
            <button 
              onClick={handleAdminSignOut}
              className="px-3 py-2 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-100 rounded-xl transition flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" /> Exit
            </button>
          </div>
        </div>

        {/* Filter Toolbar Controls */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button 
            onClick={() => setFilterStatus('pending_payment')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition ${filterStatus === 'pending_payment' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Pending Review ({listings.filter(l => l.listing_status === 'pending_payment').length})
          </button>
          <button 
            onClick={() => setFilterStatus('active')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition ${filterStatus === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Active Listings ({listings.filter(l => l.listing_status === 'active').length})
          </button>
          <button 
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition ${filterStatus === 'all' ? 'bg-slate-200 text-slate-800' : 'text-slate-500 hover:text-slate-800'}`}
          >
            All Archive
          </button>
        </div>

        {/* Data Grid Listings */}
        {filteredListings.length === 0 ? (
          <div className="text-center py-25 bg-white rounded-3xl border border-slate-200 text-xs text-slate-400 font-medium">
            No properties listings currently match this status filter profile.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredListings.map((item) => (
              <div 
                key={item.id} 
                className={`bg-white rounded-3xl border transition shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 ${item.listing_status === 'pending_payment' ? 'border-amber-200 hover:border-amber-300' : 'border-slate-200'}`}
              >
                
                {/* Column 1: Core Property Parameters */}
                <div className="p-6 lg:col-span-5 space-y-3 border-b lg:border-b-0 lg:border-r border-slate-100">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-black text-base text-slate-950 tracking-tight leading-tight">{item.title}</h3>
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${item.listing_package.startsWith('boost') ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                      {item.listing_package}
                    </span>
                  </div>
                  
                  <div className="space-y-1.5 text-xs text-slate-500 font-medium">
                    <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {item.manual_address}</div>
                    <div className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {item.email_address} ({item.contact_number})</div>
                    <div className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" /> ₱{item.price_per_month.toLocaleString()}/month • {item.property_type}</div>
                  </div>
                </div>

                {/* Column 2: GCash Declaration Reference Elements */}
                <div className="p-6 lg:col-span-4 bg-slate-50/40 flex flex-col justify-center space-y-2 border-b lg:border-b-0 lg:border-r border-slate-100">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Hash className="w-3 h-3 text-blue-500" /> Declared Transaction Payload
                  </span>
                  
                  <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-200">
                    <div className="text-xs text-slate-500 font-medium">
                      Account Name: <span className="font-bold text-slate-950 uppercase">{item.gcash_name || 'N/A'}</span>
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      Reference #: <span className="font-mono font-bold text-blue-600 bg-blue-50/50 px-1.5 py-0.5 rounded text-[11px] select-all cursor-pointer" title="Click to copy">{item.gcash_reference || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Column 3: Processing Action Systems */}
                <div className="p-6 lg:col-span-3 flex flex-col justify-center items-stretch gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${item.listing_status === 'pending_payment' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                      {item.listing_status === 'pending_payment' ? (
                        <>
                          <Clock className="w-3 h-3 text-amber-500" /> Pending Approval
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3 h-3 text-emerald-500" /> Live on Site
                        </>
                      )}
                    </span>
                  </div>

                  {item.listing_status === 'pending_payment' && (
                    <button
                      type="button"
                      disabled={actionLoadingId === item.id}
                      onClick={() => handleApprove(item.id)}
                      className="w-full bg-slate-950 hover:bg-slate-900 disabled:bg-slate-300 text-white text-xs font-bold py-3 rounded-xl shadow-sm transition-all text-center flex items-center justify-center gap-1.5"
                    >
                      {actionLoadingId === item.id ? 'Activating Trigger...' : 'Approve & Publish Live'}
                    </button>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}