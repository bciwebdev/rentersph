'use client'

import React, { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setMessage('Your password has been successfully updated! Redirecting to login...')
      setTimeout(() => {
        window.location.href = '/login'
      }, 2500)
    }
  }

  return (
    <div className="min-h-screen bg-green-500/50 flex items-center justify-center p-6 font-sans antialiased">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-gray-200 shadow-md space-y-6">
        
        <div className="text-center space-y-1">
          <h1 className="text-xl font-black text-gray-800">Type New Password</h1>
          <p className="text-xs text-gray-400">Choose a strong password to lock secure access back to your account</p>
        </div>

        {error && <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-100">⚠️ {error}</div>}
        {message && <div className="p-3 bg-green-50 text-green-700 text-xs font-bold rounded-xl border border-green-100">✅ {message}</div>}

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 tracking-wider">New Secure Password</label>
            <input required type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-sm py-3 rounded-xl transition shadow-sm">
            {loading ? 'Saving Changes...' : 'Update Password & Log In'}
          </button>
        </form>

      </div>
    </div>
  )
}