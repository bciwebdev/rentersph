'use client'

import React, { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { CreditCard, CheckCircle, ArrowLeft, QrCode } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function PaymentContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const total = searchParams.get('total') || '20'
  const [referenceNumber, setReferenceNumber] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const handleConfirmPayment = async () => {
    if (!referenceNumber.trim()) {
      setStatusMessage('Please enter your payment reference number to proceed.')
      return
    }

    setIsVerifying(true)
    setStatusMessage(null)

    try {
      // Find the most recent un-submitted property listing from this browser session to update it
      const { data: activeListings, error: fetchError } = await supabase
        .from('properties')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)

      if (fetchError || !activeListings || activeListings.length === 0) {
        throw new Error('Could not find a corresponding listing record to bind this payment to.')
      }

      const latestId = activeListings[0].id

      // Update that specific listing row with the real incoming reference code string
      const { error: updateError } = await supabase
        .from('properties')
        .update({ 
          payment_reference: referenceNumber.trim(),
          payment_status: 'pending_verification' 
        })
        .eq('id', latestId)

      if (updateError) throw new Error(updateError.message)

      alert('Thank you! Your reference number has been recorded. Your listing will go live as soon as your payment is verified.')
      router.push('/landlord')

    } catch (err: any) {
      setStatusMessage(err.message || 'An error occurred during verification.')
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fcfdfe] text-[#1e293b] antialiased font-sans flex flex-col justify-center items-center px-4 py-12">
      <div className="max-w-md w-full bg-white border border-[#f1f5f9] rounded-2xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-6 text-center">
        
        <div className="mx-auto w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
          <QrCode className="w-6 h-6" />
        </div>
        
        <div>
          <h1 className="text-xl font-black tracking-tight text-[#0f172a]">Scan to Pay</h1>
          <p className="text-xs text-slate-400 mt-1">Please pay using the secure QR code below.</p>
        </div>

        <hr className="border-slate-100" />

        {/* Dynamic Billing Box */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex justify-between items-center text-slate-700">
          <span className="text-xs font-bold">Total Billable Amount:</span>
          <span className="text-lg font-black text-emerald-600">₱{total}.00</span>
        </div>

        {/* Live Image Container serving from your public root directory asset */}
        <div className="border border-slate-100 p-4 bg-white rounded-xl flex justify-center items-center shadow-[0_2px_10px_rgba(0,0,0,0.01)]">
          <img 
            src="/qrcode.png" 
            alt="Payment Merchant QR Destination Code"
            className="w-56 h-56 object-contain"
            onError={(e) => {
              // Fallback error catcher in case filename differs
              console.error("QR Code image could not be loaded at path: /qrcode.png")
            }}
          />
        </div>

        {/* Status Error Messaging Log */}
        {statusMessage && (
          <p className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-100 p-2.5 rounded-xl">
            {statusMessage}
          </p>
        )}

        {/* Reference Verification Input Form */}
        <div className="space-y-1.5 text-left">
          <label className="text-[10px] font-black tracking-wider text-[#64748b] uppercase">
            Transaction Reference / Ref Number
          </label>
          <input 
            type="text" 
            required 
            placeholder="Enter the 13-digit payment reference code" 
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-emerald-500 transition placeholder:text-slate-300 font-medium"
          />
        </div>

        {/* Control Submissions Actions */}
        <div className="space-y-2 pt-2">
          <button
            onClick={handleConfirmPayment}
            disabled={isVerifying}
            className="w-full bg-[#009667] hover:bg-[#008057] text-white font-bold text-xs py-3.5 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <CheckCircle className="w-4 h-4" /> {isVerifying ? 'Saving confirmation...' : 'I Have Made the Payment'}
          </button>

          <button
            onClick={() => router.back()}
            disabled={isVerifying}
            className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-xs py-3.5 rounded-xl transition flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Cancel & Return
          </button>
        </div>

      </div>
    </div>
  )
}

export default function LandlordPaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center text-xs text-slate-400 font-medium">
        Loading secure gateway...
      </div>
    }>
      <PaymentContent />
    </Suspense>
  )
}