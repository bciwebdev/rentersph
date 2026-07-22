'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { ShieldAlert, CheckCircle, Clock, MapPin, Hash, DollarSign, LogOut, ImageIcon, Lock, Banknote, Trash2, UserCheck, XCircle, ExternalLink, Eye, X, Flag, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'

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
  actual_payment_amount: number
}

interface Verification {
  id: string
  user_id: string
  full_name: string
  id_photo_url: string
  selfie_photo_url: string
  status: string
  created_at: string
}

interface PropertyReport {
  id: string
  property_id: string
  reason: string
  details: string
  reporter_email: string
  status: string
  created_at: string
  properties?: Property
}

export default function AdminVerificationDashboard() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [properties, setProperties] = useState<Property[]>([])
  const [verifications, setVerifications] = useState<Verification[]>([])
  const [reports, setReports] = useState<PropertyReport[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [expandedVerificationId, setExpandedVerificationId] = useState<string | null>(null)
  const [expandedPropertyId, setExpandedPropertyId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<'pending' | 'active' | 'pending_verifications' | 'approved_verifications' | 'reports' | 'all'>('approved_verifications')
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loginLoading, setLoginLoading] = useState(false)

  const transactionTotal = properties
    .filter(item => item.is_paid || item.status === 'LIVE ON SITE')
    .reduce((sum, item) => sum + (item.actual_payment_amount || 0), 0)

  const formattedTotal = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(transactionTotal)

  const checkUserAndFetch = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user && user.email === ALLOWED_ADMIN_EMAIL) {
      setUserEmail(user.email)
      setIsAuthenticated(true)
      
      // Fetch Properties
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          payment_transactions (
            checkout_session_id,
            receipt_url,
            amount
          )
        `)
        .neq('status', 'unpaid')
        .order('created_at', { ascending: false })

      if (!error && data) {
        const mappedData: Property[] = data.map((prop: any) => {
          const transaction = prop.payment_transactions?.[0] || null;
          return {
            ...prop,
            payment_reference: transaction ? transaction.checkout_session_id : null,
            payment_screenshot: transaction ? transaction.receipt_url : null,
            actual_payment_amount: transaction ? Number(transaction.amount || 0) : 0 
          }
        })
        setProperties(mappedData)
      }

      // Fetch Verifications
      const { data: verData, error: verErr } = await supabase
        .from('landlord_verifications')
        .select('*')
        .order('created_at', { ascending: false })

      if (!verErr && verData) {
        const uniqueVerificationsMap = new Map<string, Verification>()
        verData.forEach((item: Verification) => {
          if (!uniqueVerificationsMap.has(item.user_id)) {
            uniqueVerificationsMap.set(item.user_id, item)
          }
        })
        setVerifications(Array.from(uniqueVerificationsMap.values()))
      }

      // Fetch Scam Reports
      const { data: repData, error: repErr } = await supabase
        .from('property_reports')
        .select('*, properties(*)')
        .order('created_at', { ascending: false })

      if (!repErr && repData) {
        setReports(repData)
      }
    } else {
      setIsAuthenticated(false)
    }
    setLoading(false)
  }

  useEffect(() => {
    checkUserAndFetch()
  }, [])

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

  const handleApprove = async (id: string) => {
    setActionLoadingId(id)
    const { error } = await supabase
      .from('properties')
      .update({ 
        status: 'LIVE ON SITE', 
        is_paid: true
      })
      .eq('id', id)

    if (!error) {
      setProperties(prev => prev.map(item => item.id === id ? { ...item, status: 'LIVE ON SITE', is_paid: true } : item))
      if (selectedProperty?.id === id) {
        setSelectedProperty(prev => prev ? { ...prev, status: 'LIVE ON SITE', is_paid: true } : null)
      }
    } else {
      alert(`Failed to approve listing: ${error.message}`)
    }
    setActionLoadingId(null)
  }

  const handleRevokeProperty = async (propertyId: string, reportId?: string) => {
    const confirmed = window.confirm("Are you sure you want to REVOKE and unpublish this listing from public view?")
    if (!confirmed) return

    setActionLoadingId(propertyId)
    const { error } = await supabase
      .from('properties')
      .update({ status: 'revoked', is_paid: false })
      .eq('id', propertyId)

    if (!error) {
      if (reportId) {
        await supabase.from('property_reports').update({ status: 'resolved' }).eq('id', reportId)
        setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r))
      }
      setProperties(prev => prev.map(p => p.id === propertyId ? { ...p, status: 'revoked', is_paid: false } : p))
      alert('Listing status successfully updated to REVOKED.')
    } else {
      alert(`Failed to revoke listing: ${error.message}`)
    }
    setActionLoadingId(null)
  }

  const handleDismissReport = async (reportId: string) => {
    setActionLoadingId(reportId)
    const { error } = await supabase
      .from('property_reports')
      .update({ status: 'dismissed' })
      .eq('id', reportId)

    if (!error) {
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'dismissed' } : r))
    } else {
      alert(`Failed to dismiss report: ${error.message}`)
    }
    setActionLoadingId(null)
  }

  const handleApproveVerification = async (ver: Verification) => {
    setActionLoadingId(ver.id)
    try {
      const { error: verErr } = await supabase
        .from('landlord_verifications')
        .update({ status: 'approved' })
        .eq('id', ver.id)

      if (verErr) throw verErr

      const { error: profErr } = await supabase
        .from('profiles')
        .update({ is_verified: true, full_name: ver.full_name })
        .eq('id', ver.user_id)

      if (profErr) throw profErr

      setVerifications(prev => prev.map(item => item.id === ver.id ? { ...item, status: 'approved' } : item))
      alert(`Landlord "${ver.full_name}" has been successfully verified!`)
    } catch (err: any) {
      alert(`Failed to approve verification: ${err.message}`)
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleRejectVerification = async (id: string) => {
    setActionLoadingId(id)
    try {
      const { error } = await supabase
        .from('landlord_verifications')
        .update({ status: 'rejected' })
        .eq('id', id)

      if (error) throw error

      setVerifications(prev => prev.map(item => item.id === id ? { ...item, status: 'rejected' } : item))
    } catch (err: any) {
      alert(`Failed to reject verification: ${err.message}`)
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleDeleteProperty = async (id: string, title: string) => {
    if (userEmail !== ALLOWED_ADMIN_EMAIL) {
      alert('Unauthorized: Only root admin can perform deletions.')
      return
    }

    const confirmed = window.confirm(`Are you sure you want to permanently delete "${title || 'this listing'}"?`)
    if (!confirmed) return

    setActionLoadingId(id)
    const { error } = await supabase
      .from('properties')
      .delete({ count: 'exact' })
      .eq('id', id)

    if (error) {
      alert(`Delete rejected: ${error.message}`)
    } else {
      setProperties(prev => prev.filter(item => item.id !== id))
      if (selectedProperty?.id === id) {
        setSelectedProperty(null)
      }
    }
    setActionLoadingId(null)
  }

  const handleAdminSignOut = async () => {
    await supabase.auth.signOut()
    setIsAuthenticated(false)
    setUserEmail(null)
  }

  const toggleExpandVerification = (id: string) => {
    setExpandedVerificationId(prev => prev === id ? null : id)
  }

  const toggleExpandProperty = (id: string) => {
    setExpandedPropertyId(prev => prev === id ? null : id)
  }

  const isPending = (status: string) => {
    return status === 'pending' || status === 'pending_verification'
  }

  const filteredProperties = properties
    .filter(item => {
      if (filterStatus === 'all') return true
      if (filterStatus === 'pending') return isPending(item.status)
      if (filterStatus === 'active') return item.status === 'LIVE ON SITE'
      return false
    })
    .sort((a, b) => (a.title || '').localeCompare(b.title || ''))

  const pendingVerifications = verifications.filter(v => v.status === 'pending')
  const approvedVerifications = verifications.filter(v => v.status === 'approved')
  const pendingReports = reports.filter(r => r.status === 'pending')

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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center font-sans antialiased">
        <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl w-full max-w-md space-y-6 shadow-2xl text-left">
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

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 font-sans antialiased py-6 sm:py-10 px-3 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        
        {/* Admin Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="space-y-1">
            <span className="inline-block text-[10px] font-black uppercase tracking-wider bg-slate-950 text-white px-2.5 py-1 rounded-md">
              Root Administrator Control
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight pt-1">Payment & Security Queue</h1>
            <p className="text-xs text-slate-400 font-medium max-w-xl">Review GCash payments, landlord identity submissions, and scam reports from renters.</p>
          </div>
          
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
            <div className="flex-1 sm:flex-none flex items-center gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 sm:px-4 py-2 h-10 min-w-[140px]">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm shrink-0">
                <Banknote className="h-3 w-3" />
              </div>
              <div className="truncate">
                <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-emerald-700/80 leading-none">
                  Transaction Total
                </p>
                <p className="text-xs font-black text-emerald-950 pt-0.5 leading-none truncate">
                  {formattedTotal}
                </p>
              </div>
            </div>

            <div className="flex-1 sm:flex-none text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-3 sm:px-4 rounded-xl flex items-center h-10 truncate min-w-[160px]">
              <span className="shrink-0">Admin:&nbsp;</span>
              <span className="font-bold text-slate-900 truncate">{userEmail}</span>
            </div>
            
            <button 
              onClick={handleAdminSignOut}
              className="w-full sm:w-auto px-4 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-100 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer h-10 shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" /> <span className="inline">Exit Portal</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar Controls */}
        <div className="overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-none">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 min-w-max">
            <button 
              onClick={() => setFilterStatus('pending')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer whitespace-nowrap ${filterStatus === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Pending Review ({properties.filter(p => isPending(p.status)).length})
            </button>
            
            <button 
              onClick={() => setFilterStatus('active')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer whitespace-nowrap ${filterStatus === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Active Listings ({properties.filter(p => p.status === 'LIVE ON SITE').length})
            </button>
            
            <button 
              onClick={() => setFilterStatus('pending_verifications')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${filterStatus === 'pending_verifications' ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-500" /> Pending Verifications ({pendingVerifications.length})
            </button>

            <button 
              onClick={() => setFilterStatus('approved_verifications')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${filterStatus === 'approved_verifications' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-500" /> Approved Landlords ({approvedVerifications.length})
            </button>

            <button 
              onClick={() => setFilterStatus('reports')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${filterStatus === 'reports' ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <Flag className="w-3.5 h-3.5 text-rose-500" /> Reported Scam Listings ({pendingReports.length})
            </button>

            <button 
              onClick={() => setFilterStatus('all')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer whitespace-nowrap ${filterStatus === 'all' ? 'bg-slate-200 text-slate-800' : 'text-slate-500 hover:text-slate-800'}`}
            >
              All Archive
            </button>
          </div>
        </div>

        {/* SCAM REPORTS TAB */}
        {filterStatus === 'reports' && (
          reports.length === 0 ? (
            <div className="text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-400 font-medium py-16 sm:py-20 px-4">
              No reported listings submitted by renters.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {reports.map((rep) => (
                <div key={rep.id} className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 space-y-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-rose-100 text-rose-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Scam Alert
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        {new Date(rep.created_at).toLocaleString('en-PH')}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-slate-900">
                      Property: {rep.properties?.title || 'Unknown / Deleted Property'}
                    </h3>

                    <div className="space-y-1 text-xs">
                      <p><strong className="text-slate-700">Reason:</strong> <span className="font-semibold text-rose-600">{rep.reason}</span></p>
                      {rep.details && <p><strong className="text-slate-700">Explanation:</strong> "{rep.details}"</p>}
                      {rep.reporter_email && <p><strong className="text-slate-700">Reporter Contact:</strong> {rep.reporter_email}</p>}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <button
                      type="button"
                      disabled={actionLoadingId === rep.id}
                      onClick={() => handleDismissReport(rep.id)}
                      className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition text-center"
                    >
                      Dismiss Report
                    </button>
                    {rep.properties && rep.properties.status !== 'revoked' && (
                      <button
                        type="button"
                        disabled={actionLoadingId === rep.properties.id}
                        onClick={() => handleRevokeProperty(rep.properties!.id, rep.id)}
                        className="w-full sm:w-auto px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition shadow-sm flex items-center justify-center gap-1"
                      >
                        <XCircle className="w-4 h-4" /> Revoke Listing
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* PENDING LANDLORD VERIFICATIONS TAB */}
        {filterStatus === 'pending_verifications' && (
          pendingVerifications.length === 0 ? (
            <div className="text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-400 font-medium py-16 sm:py-20 px-4">
              No pending identity verification submissions.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {pendingVerifications.map((ver) => {
                const isExpanded = expandedVerificationId === ver.id
                return (
                  <div key={ver.id} className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-sm transition">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Landlord Legal Name</span>
                        <h3 className="text-base font-black text-slate-900">{ver.full_name}</h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                          {ver.status}
                        </span>

                        <button
                          type="button"
                          onClick={() => toggleExpandVerification(ver.id)}
                          className="inline-flex items-center justify-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition cursor-pointer"
                        >
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-slate-500" />}
                          {isExpanded ? 'Hide Details' : 'View Verification Details'}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="pt-4 mt-4 border-t border-slate-100 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">1. Valid ID Photo</span>
                            <a href={ver.id_photo_url} target="_blank" rel="noreferrer" className="block relative group overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 h-36">
                              <img src={ver.id_photo_url} alt="ID Photo" className="w-full h-full object-cover group-hover:scale-105 transition" />
                              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1">
                                <ExternalLink className="w-3.5 h-3.5" /> Open
                              </div>
                            </a>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">2. Selfie Holding ID</span>
                            <a href={ver.selfie_photo_url} target="_blank" rel="noreferrer" className="block relative group overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 h-36">
                              <img src={ver.selfie_photo_url} alt="Selfie with ID" className="w-full h-full object-cover group-hover:scale-105 transition" />
                              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1">
                                <ExternalLink className="w-3.5 h-3.5" /> Open
                              </div>
                            </a>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            disabled={actionLoadingId === ver.id}
                            onClick={() => handleRejectVerification(ver.id)}
                            className="w-full sm:w-1/2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                          <button
                            type="button"
                            disabled={actionLoadingId === ver.id}
                            onClick={() => handleApproveVerification(ver)}
                            className="w-full sm:w-1/2 bg-[#00aa4f] hover:bg-[#009444] text-white font-bold text-xs py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Approve Identity
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        )}

        {/* APPROVED LANDLORD VERIFICATIONS TAB */}
        {filterStatus === 'approved_verifications' && (
          approvedVerifications.length === 0 ? (
            <div className="text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-400 font-medium py-16 sm:py-20 px-4">
              No approved landlords found.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {approvedVerifications.map((ver) => {
                const isExpanded = expandedVerificationId === ver.id
                return (
                  <div key={ver.id} className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-sm transition">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Landlord Legal Name</span>
                        <h3 className="text-base font-black text-slate-900">{ver.full_name}</h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                          APPROVED
                        </span>

                        <button
                          type="button"
                          onClick={() => toggleExpandVerification(ver.id)}
                          className="inline-flex items-center justify-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition cursor-pointer"
                        >
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-slate-500" />}
                          {isExpanded ? 'Hide Details' : 'View Verification Details'}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="pt-4 mt-4 border-t border-slate-100 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">1. Valid ID Photo</span>
                            <a href={ver.id_photo_url} target="_blank" rel="noreferrer" className="block relative group overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 h-36">
                              <img src={ver.id_photo_url} alt="ID Photo" className="w-full h-full object-cover group-hover:scale-105 transition" />
                              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1">
                                <ExternalLink className="w-3.5 h-3.5" /> Open
                              </div>
                            </a>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">2. Selfie Holding ID</span>
                            <a href={ver.selfie_photo_url} target="_blank" rel="noreferrer" className="block relative group overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 h-36">
                              <img src={ver.selfie_photo_url} alt="Selfie with ID" className="w-full h-full object-cover group-hover:scale-105 transition" />
                              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1">
                                <ExternalLink className="w-3.5 h-3.5" /> Open
                              </div>
                            </a>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        )}

        {/* PROPERTY LISTINGS ACCORDION DATA GRID (ALPHABETICAL) */}
        {(filterStatus === 'pending' || filterStatus === 'active' || filterStatus === 'all') && (
          filteredProperties.length === 0 ? (
            <div className="text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-400 font-medium py-16 sm:py-20 px-4">
              No property listings currently match this status filter profile.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredProperties.map((item) => {
                const isExpanded = expandedPropertyId === item.id
                return (
                  <div 
                    key={item.id} 
                    className={`bg-white rounded-3xl border transition shadow-sm overflow-hidden p-4 sm:p-5 ${isPending(item.status) ? 'border-amber-200' : 'border-slate-200'}`}
                  >
                    {/* Collapsed Header Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Property Listing Title</span>
                        <h3 className="font-black text-base text-slate-950 tracking-tight">{item.title || 'Untitled Listing'}</h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0 ${isPending(item.status) ? 'bg-amber-50 text-amber-700 border border-amber-200' : item.status === 'revoked' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                          {isPending(item.status) ? (
                            <>
                              <Clock className="w-3 h-3 text-amber-500" /> Pending
                            </>
                          ) : item.status === 'revoked' ? (
                            <>
                              <XCircle className="w-3 h-3 text-rose-500" /> Revoked
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3 h-3 text-emerald-500" /> Live on Site
                            </>
                          )}
                        </span>

                        <button
                          type="button"
                          onClick={() => toggleExpandProperty(item.id)}
                          className="inline-flex items-center justify-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition cursor-pointer shrink-0"
                        >
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-slate-500" />}
                          {isExpanded ? 'Hide Details' : 'View Listing Details'}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Details Drawer */}
                    {isExpanded && (
                      <div className="pt-4 mt-4 border-t border-slate-100 grid grid-cols-1 lg:grid-cols-12 gap-4">
                        <div className="lg:col-span-5 space-y-3">
                          <div className="space-y-1.5 text-xs text-slate-500 font-medium">
                            <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> <span className="truncate">{item.address || 'No Address Provided'}</span></div>
                            <div className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" /> ₱{item.price?.toLocaleString() || 0}/month • {item.property_type || 'N/A'}</div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedProperty(item)}
                            className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition cursor-pointer w-full sm:w-auto"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-slate-500" /> Open Full Modal View
                          </button>
                        </div>

                        <div className="lg:col-span-4 bg-slate-50/60 p-3.5 rounded-2xl border border-slate-200/80 flex flex-col justify-center space-y-2">
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                            <Hash className="w-3 h-3 text-blue-500" /> Declared Transaction Payload
                          </span>
                          
                          <div className="text-xs text-slate-500 font-medium truncate">
                            Reference #: <span className="font-mono font-bold text-blue-600 bg-blue-50/50 px-1.5 py-0.5 rounded text-[11px] select-all inline-block truncate max-w-full align-bottom">{item.payment_reference || 'NULL'}</span>
                          </div>
                          
                          <div className="pt-0.5">
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
                              <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded font-semibold inline-block">
                                No Screenshot Uploaded
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="lg:col-span-3 flex flex-col justify-center gap-2">
                          {isPending(item.status) && (
                            <button
                              type="button"
                              disabled={actionLoadingId === item.id}
                              onClick={() => handleApprove(item.id)}
                              className="w-full bg-slate-950 hover:bg-slate-900 disabled:bg-slate-300 text-white text-xs font-bold py-2.5 rounded-xl shadow-sm transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              {actionLoadingId === item.id ? 'Activating Trigger...' : 'Approve & Publish Live'}
                            </button>
                          )}

                          {item.status === 'LIVE ON SITE' && (
                            <button
                              type="button"
                              disabled={actionLoadingId === item.id}
                              onClick={() => handleRevokeProperty(item.id)}
                              className="w-full bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold py-2 rounded-xl transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                            >
                              Revoke Visibility
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={actionLoadingId === item.id}
                            onClick={() => handleDeleteProperty(item.id, item.title)}
                            className="w-full bg-rose-50 hover:bg-rose-100 disabled:bg-slate-100 text-rose-600 border border-rose-200 text-xs font-bold py-2.5 rounded-xl transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete Listing
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>

      {/* PROPERTY DETAILS MODAL */}
      {selectedProperty && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full p-4 sm:p-6 space-y-4 sm:space-y-6 shadow-2xl my-auto relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedProperty(null)}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 transition z-10"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <div className="space-y-1 pr-8">
              <span className="inline-block text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">
                Listing Specification Payload
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-950 pt-1 sm:pt-2">{selectedProperty.title || 'Untitled Property'}</h2>
            </div>

            {selectedProperty.images && selectedProperty.images.length > 0 ? (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Uploaded Property Gallery</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 sm:max-h-56 overflow-y-auto p-1 bg-slate-50 rounded-2xl border border-slate-200">
                  {selectedProperty.images.map((imgUrl, index) => (
                    <a key={index} href={imgUrl} target="_blank" rel="noreferrer" className="block relative group aspect-video bg-slate-200 rounded-xl overflow-hidden">
                      <img src={imgUrl} alt={`Property Image ${index + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition" />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-bold gap-1">
                        <ExternalLink className="w-3 h-3" /> Expand
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs text-slate-400 font-medium">
                No images attached to this property listing.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
              <div className="bg-slate-50 p-3 sm:p-3.5 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Property Type</span>
                <p className="font-bold text-slate-800">{selectedProperty.property_type || 'N/A'}</p>
              </div>

              <div className="bg-slate-50 p-3 sm:p-3.5 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Monthly Rent Price</span>
                <p className="font-bold text-emerald-700">₱{selectedProperty.price?.toLocaleString() || 0} / month</p>
              </div>

              <div className="bg-slate-50 p-3 sm:p-3.5 rounded-2xl border border-slate-200 space-y-1 sm:col-span-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Complete Address</span>
                <p className="font-semibold text-slate-800">{selectedProperty.address || 'No Address Provided'}</p>
              </div>

              <div className="bg-slate-50 p-3 sm:p-3.5 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Payment Reference ID</span>
                <p className="font-mono font-bold text-blue-600 truncate">{selectedProperty.payment_reference || 'NULL'}</p>
              </div>

              <div className="bg-slate-50 p-3 sm:p-3.5 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Date Created</span>
                <p className="font-semibold text-slate-700">{selectedProperty.created_at ? new Date(selectedProperty.created_at).toLocaleString('en-PH') : 'N/A'}</p>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedProperty(null)}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer text-center"
              >
                Close Window
              </button>
              
              {isPending(selectedProperty.status) && (
                <button
                  type="button"
                  disabled={actionLoadingId === selectedProperty.id}
                  onClick={() => handleApprove(selectedProperty.id)}
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-950 hover:bg-slate-900 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer text-center"
                >
                  {actionLoadingId === selectedProperty.id ? 'Activating...' : 'Approve & Publish Live'}
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  )
}