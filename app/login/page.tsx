'use client'

import React, { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

export default function LandlordLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [supabase] = useState(() => 
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  )

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (isSignUp) {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signUpError) {
        setError(signUpError.message)
      } else {
        setMessage('Registration successful! Check your inbox to verify your account.')
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
      } else {
        router.push('/landlord')
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#6be4a6] flex items-center justify-center p-4 antialiased font-sans">
      <div className="bg-white w-full max-w-lg rounded-[40px] p-8 sm:p-12 space-y-8 shadow-xl border border-white/20">
        
        {/* Branding Logo Block */}
        <div className="flex flex-col items-center justify-center text-center space-y-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[#00aa4f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-2xl font-black text-[#1e293b] tracking-tight">
              renters<span className="text-[#00aa4f]">PH</span>
            </span>
          </div>
          
          <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight">
            {isSignUp ? 'Create Landlord Account' : 'Landlord Portal'}
          </h1>
          <p className="text-sm font-semibold text-[#8b9aa8]">
            {isSignUp ? 'Sign up to showcase your active properties' : 'Log in to manage and boost your active rental listings'}
          </p>
        </div>

        {/* Dynamic Alert Banners */}
        {error && (
          <div className="p-4 bg-[#fff3f3] text-[#cc2424] text-xs font-bold rounded-2xl border border-[#ffe1e1] flex items-center gap-2">
            ⚠️ <span>{error}</span>
          </div>
        )}
        {message && (
          <div className="p-4 bg-[#f0fdf4] text-[#166534] text-xs font-bold rounded-2xl border border-[#bbf7d0] flex items-center gap-2">
            ✅ <span>{message}</span>
          </div>
        )}

        {/* Auth Input Controls */}
        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[11px] font-black uppercase text-[#8897a6] tracking-wider">
              {isSignUp ? 'Desired Registration Email' : 'Registered Email'}
            </label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="bciwebdev25@gmail.com"
              className="w-full px-5 py-4 bg-[#edf4fe] rounded-2xl text-sm font-medium text-[#1e293b] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00aa4f]/20 transition-all border border-transparent"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-[11px] font-black uppercase text-[#8897a6] tracking-wider">
                Password
              </label>
              {!isSignUp && (
                <button type="button" className="text-xs font-bold text-[#00aa4f] hover:underline bg-transparent border-none p-0 cursor-pointer">
                  Forgot password?
                </button>
              )}
            </div>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-5 py-4 bg-[#edf4fe] rounded-2xl text-sm font-medium text-[#1e293b] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00aa4f]/20 transition-all border border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00aa4f] hover:bg-[#009444] text-white font-extrabold text-base py-4 rounded-2xl transition-all duration-200 shadow-md transform active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? 'Processing Context...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        {/* Custom Auth Mode Toggle Switch Link */}
        <div className="text-center pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError('')
              setMessage('')
            }}
            className="text-xs font-bold text-[#00aa4f] hover:underline bg-transparent border-none cursor-pointer"
          >
            {isSignUp ? 'Already have an active account? Sign In' : "Don't have a portal account? Create one"}
          </button>
        </div>

      </div>
    </div>
  )
}