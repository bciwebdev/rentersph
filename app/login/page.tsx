'use client'

import React, { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Home, Mail, Lock, ArrowRight, UserPlus, LogIn } from 'lucide-react'

export default function AuthPortal() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // Initialize browser-safe SSR client context
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    const sanitizedEmail = email.trim()

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password: password
      })
      
      if (error) {
        setMessage({ type: 'error', text: error.message })
      } else if (data?.user && data.user.identities?.length === 0) {
        setMessage({ type: 'error', text: 'This email is already registered.' })
      } else {
        setMessage({ 
          type: 'success', 
          text: 'Account created successfully! You can now sign in.' 
        })
        setIsSignUp(false)
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ 
        email: sanitizedEmail, 
        password 
      })
      if (error) {
        setMessage({ type: 'error', text: error.message })
      } else {
        window.location.href = '/landlord'
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-emerald-700 flex flex-col items-center justify-center p-4 sm:p-6">
      
      {/* Container Card */}
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-emerald-800 shadow-2xl space-y-6">
        
        {/* Branding Title */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-1.5 mx-auto">
            <div className="w-5 h-5 bg-emerald-600 rounded flex items-center justify-center">
              <Home className="w-3 text-white" />
            </div>
            <span className="font-black text-slate-950 text-xs tracking-tight">
              renters<span className="text-emerald-600">PH</span>
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-950 tracking-tight">
            {isSignUp ? 'Create Landlord Account' : 'Landlord Portal'}
          </h2>
          <p className="text-xs text-slate-400 font-medium px-4">
            {isSignUp ? 'Register to start listing your rental properties.' : 'Log in to manage and boost your active rental listings.'}
          </p>
        </div>

        {/* Dynamic Notifications */}
        {message.text && (
          <div className={`p-4 rounded-xl text-xs font-bold border ${
            message.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
          }`}>
            {message.text}
          </div>
        )}

        {/* Input Interactive Form */}
        <form onSubmit={handleAuthAction} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 tracking-wider flex items-center gap-1">
              <Mail className="w-3 h-3 text-slate-400" /> Registered Email
            </label>
            <input 
              required 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="landlord@email.com" 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" /> Password
              </label>
              {!isSignUp && (
                <a href="#" className="text-[10px] font-bold text-emerald-600 hover:underline">
                  Forgot password?
                </a>
              )}
            </div>
            <input 
              required 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all"
            />
          </div>

          {/* Submit Action */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white font-bold text-xs py-3.5 rounded-xl shadow-md transition flex items-center justify-center gap-1.5 mt-2 uppercase tracking-wider"
          >
            {loading ? 'Authenticating...' : isSignUp ? (
              <>Create Account <UserPlus className="w-3.5 h-3.5" /></>
            ) : (
              <>Sign In <LogIn className="w-3.5 h-3.5" /></>
            )}
          </button>
        </form>

        {/* Bottom Switch authentication layout toggle */}
        <div className="border-t border-slate-100 pt-4 text-center">
          <button 
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setMessage({ type: '', text: '' })
            }}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 transition inline-flex items-center gap-1"
          >
            {isSignUp ? "Already have an account? Sign In" : "New landlord? Create an account"} 
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

      </div>
    </div>
  )
}