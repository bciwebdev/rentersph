'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { ShieldAlert, CheckCircle, Clock, MapPin, Hash, DollarSign, LogOut, ImageIcon, Lock, Banknote } from 'lucide-react'

// Initialize Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const ALLOWED_ADMIN_EMAIL = 'bciwebdev25@gmail.com'

interface Property {
  id: string
  title: string
  property_type: string
  price: number
  address: string
  images: string[]
  is_paid: boolean
  payment_reference: string | null
  payment_screenshot: string | null
  status: string
  created_at: string
}

export default function AdminVerificationDashboard() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved'>('pending')
  
  // Login Form States
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loginLoading, setLoginLoading] = useState(false)

  // Calculate total transactions from approved/paid properties
  const transactionTotal = properties
    .filter(item => item.is_paid || item.status === 'LIVE ON SITE')
    .reduce((sum, item) => sum + (item.price || 0), 0)

  // Format currency value safely using Philippine Peso
  const formattedTotal = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(transactionTotal)

  // Check active session on load
  const checkUserAndFetch = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user && user.email === ALLOWED_ADMIN_EMAIL) {
      setUserEmail(user.email)
      setIsAuthenticated(true)
      
      // Perform a join query to grab transaction data from payment_transactions table
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          payment_transactions (
            checkout_session_id,
            receipt_url
          )
        `)
        .order('created_at', { ascending: false })

      if (!error && data) {
        // Map the joined data so your existing UI handles the values flawlessly
        const mappedData: Property[] = data.map((prop: any) => {
          const transaction = prop.payment_transactions?.[0] || null;
          return {
            ...prop,
            payment_reference: transaction ? transaction.checkout_session_id : null,
            payment_screenshot: transaction ? transaction.receipt_url : null
          }
        })
        setProperties(mappedData)
      }
    } else {
      setIsAuthenticated(false)
    }
    setLoading(false)
  }

  useEffect(() => {
    checkUserAndFetch()
  }, [])

  // Handle Direct Admin Login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError(null)
    setLoginLoading(true)

    if (email !== ALLOWED_ADMIN_EMAIL) {
      setLoginError('Access Denied: Unauthorized administrative profile.')
      setLoginLoading(false)
      return
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setLoginError(error.message)
      setLoginLoading(false)
    } else if (data.user) {
      await checkUserAndFetch()
    }
  }

  // Manual Approval Action
  const handleApprove = async (id: string) => {
    setActionLoadingId(id)
    const { error } = await supabase
      .from('properties')
      .update({ 
        status: 'LIVE ON SITE', // Matches front-end filters exactly
        is_paid: true
      })
      .eq('id', id)

    if (!error) {
      setProperties(prev => prev.map(item => item.id === id ? { ...item, status: 'LIVE ON SITE', is_paid: true } : item))
    } else {
      console.error("Database update failed:", error.message)
      alert(`Failed to approve listing: ${error.message}`)
    }
    setActionLoadingId(null)
  }

  const handleAdminSignOut = async () => {
    await supabase.auth.signOut()
    setIsAuthenticated(false)
    setUserEmail(null)
  }

  const isPending = (status: string) => {
    return status === 'pending' || status === 'pending_verification'
  }

  const filteredProperties = properties.filter(item => {
    if (filterStatus === 'all') return true
    if (filterStatus === 'pending') return isPending(item.status)
    return item.status === 'LIVE ON SITE'
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-center space-y-2">
          <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-slate-500 tracking-wider uppercase">Verifying Gateway Credentials...</p>
        </div>
      </div>
    )
  }

  // IF NOT AUTHENTICATED: Show Separate Admin Login Page
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center font-sans antialiased">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-md space-y-6 shadow-2xl text-left">
          <div className="text-center space-y-2">
            <Lock className="w-10 h-10 text-amber-500 mx-auto" />
            <h1 className="text-white font-black text-xl tracking-tight">Admin System Gateway</h1>
            <p className="text-xs text-slate-400">Authenticate via root administrative credentials to access database management channels.</p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Admin Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Gateway Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            {loginError && (
              <div className="bg-rose-950/50 border border-rose-900 text-rose-400 p-3 rounded-xl text-xs font-medium flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-white hover:bg-slate-100 disabled:bg-slate-700 disabled:text-slate-400 text-slate-950 font-bold text-sm py-3 rounded-xl transition shadow-sm text-center cursor-pointer"
            >
              {loginLoading ? 'Opening Workspace...' : 'Authenticate Credentials'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // IF AUTHENTICATED: Render Dashboard UI
  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 font-sans antialiased py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Admin Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider bg-slate-950 text-white px-2.5 py-1 rounded-md">
              Root Administrator Control
            </span>
            <h1 className="text-2xl font-black text-slate-950 tracking-tight pt-1">Payment Verification Queue</h1>
            <p className="text-xs text-slate-400 font-medium max-w-xl">Review submitted GCash reference details and screenshots to manually approve storefront visibility.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 self-start md:self-center">
            {/* New Financial Metric Card */}
            <div className="flex items-center gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
                <Banknote className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-700/80 leading-none">
                  Transaction Total
                </p>
                <p className="text-sm font-black text-emerald-950 pt-0.5">
                  {formattedTotal}
                </p>
              </div>
            </div>

            <div className="text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl h-fit">
              Admin: <span className="font-bold text-slate-900">{userEmail}</span>
            </div>
            
            <button 
              onClick={handleAdminSignOut}
              className="px-3 py-2 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-100 rounded-xl transition flex items-center gap-1.5 cursor-pointer h-fit"
            >
              <LogOut className="w-3.5 h-3.5" /> Exit Portal
            </button>
          </div>
        </div>

        {/* Filter Toolbar Controls */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button 
            onClick={() => setFilterStatus('pending')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${filterStatus === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Pending Review ({properties.filter(p => isPending(p.status)).length})
          </button>
          <button 
            onClick={() => setFilterStatus('approved')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${filterStatus === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Active Listings ({properties.filter(p => p.status === 'LIVE ON SITE').length})
          </button>
          <button 
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${filterStatus === 'all' ? 'bg-slate-200 text-slate-800' : 'text-slate-500 hover:text-slate-800'}`}
          >
            All Archive
          </button>
        </div>

        {/* Data Grid Listings */}
        {filteredProperties.length === 0 ? (
          <div className="text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-400 font-medium py-20">
            No property listings currently match this status filter profile.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredProperties.map((item) => (
              <div 
                key={item.id} 
                className={`bg-white rounded-3xl border transition shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 ${isPending(item.status) ? 'border-amber-200 hover:border-amber-300' : 'border-slate-200'}`}
              >
                
                {/* Column 1: Core Property Parameters */}
                <div className="p-6 lg:col-span-5 space-y-3 border-b lg:border-b-0 lg:border-r border-slate-100">
                  <h3 className="font-black text-base text-slate-950 tracking-tight leading-tight">{item.title || 'Untitled Listing'}</h3>
                  <div className="space-y-1.5 text-xs text-slate-500 font-medium">
                    <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {item.address || 'No Address Provided'}</div>
                    <div className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" /> ₱{item.price?.toLocaleString() || 0}/month • {item.property_type || 'N/A'}</div>
                  </div>
                </div>

                {/* Column 2: GCash Reference & Receipt Screenshots */}
                <div className="p-6 lg:col-span-4 bg-slate-50/40 flex flex-col justify-center space-y-2 border-b lg:border-b-0 lg:border-r border-slate-100">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Hash className="w-3 h-3 text-blue-500" /> Declared Transaction Payload
                  </span>
                  
                  <div className="space-y-2 bg-white p-3 rounded-xl border border-slate-200">
                    <div className="text-xs text-slate-500 font-medium">
                      Reference #: <span className="font-mono font-bold text-blue-600 bg-blue-50/50 px-1.5 py-0.5 rounded text-[11px] select-all">{item.payment_reference || 'NULL'}</span>
                    </div>
                    
                    <div className="pt-1">
                      {item.payment_screenshot ? (
                        <a 
                          href={item.payment_screenshot} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition cursor-pointer"
                        >
                          <ImageIcon className="w-3 h-3" /> View Payment Screenshot ↗
                        </a>
                      ) : (
                        <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded font-semibold">
                          No Screenshot Uploaded
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Column 3: Processing Action Systems */}
                <div className="p-6 lg:col-span-3 flex flex-col justify-center items-stretch gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${isPending(item.status) ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                      {isPending(item.status) ? (
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

                  {isPending(item.status) && (
                    <button
                      type="button"
                      disabled={actionLoadingId === item.id}
                      onClick={() => handleApprove(item.id)}
                      className="w-full bg-slate-950 hover:bg-slate-900 disabled:bg-slate-300 text-white text-xs font-bold py-3 rounded-xl shadow-sm transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
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