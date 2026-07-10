'use client'

import React, { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Handles standard Email/Password Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setMessage('Success! Redirecting to dashboard...')
      window.location.href = '/landlord'
    }
  }

  // Handles Forgot Password Recovery Email Trigger
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login/reset-password`,
    })

    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setMessage('A secure password reset link has been sent to your registered email.')
    }
  }

  return (
    <div className="min-h-screen bg-green-500/50 flex items-center justify-center p-6 font-sans antialiased">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-gray-200 shadow-md space-y-6">
        
        {/* Logo Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <img src="/icon.png" alt="Logo" className="w-[24px] h-[24px] object-contain" />
            <span className="text-2xl font-black text-gray-900 tracking-tight">
              renters<span className="text-green-600">PH</span>
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-800">
            {isForgotPassword ? 'Reset Your Password' : 'Landlord Portal'}
          </h1>
          <p className="text-xs text-gray-400 font-medium">
            {isForgotPassword 
              ? 'Enter your email to receive a recovery code link' 
              : 'Log in to manage and boost your active rental listings'
            }
          </p>
        </div>

        {/* System Alert Banners */}
        {error && <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-100">⚠️ {error}</div>}
        {message && <div className="p-3 bg-green-50 text-green-700 text-xs font-bold rounded-xl border border-green-100">✅ {message}</div>}

        {/* Dynamic Form Controller */}
        {!isForgotPassword ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 tracking-wider">Registered Email</label>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="landlord@email.com" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Password</label>
                <button type="button" onClick={() => { setIsForgotPassword(true); setError(''); setMessage(''); }} className="text-[10px] font-bold text-green-600 hover:underline">Forgot password?</button>
              </div>
              <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold text-sm py-3 rounded-xl transition shadow-sm mt-2">
              {loading ? 'Verifying Account...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 tracking-wider">Your Registered Email Address</label>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="landlord@email.com" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold text-sm py-3 rounded-xl transition shadow-sm mt-2">
              {loading ? 'Sending Link...' : 'Send Password Recovery Email'}
            </button>
            <div className="text-center pt-2">
              <button type="button" onClick={() => { setIsForgotPassword(false); setError(''); setMessage(''); }} className="text-xs font-bold text-gray-500 hover:text-gray-700 hover:underline">← Back to Log In</button>
            </div>
          </form>
        )}

      </div>
    </div>
  )
}