'use client'

import React, { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CreditCard, CheckCircle, ArrowLeft } from 'lucide-react'

function PaymentContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Get the total from the URL parameter (fallback to 20 if missing)
  const total = searchParams.get('total') || '20'

  return (
    <div className="min-h-screen bg-[#fcfdfe] text-[#1e293b] antialiased font-sans flex flex-col justify-center items-center px-4 py-12">
      <div className="max-w-md w-full bg-white border border-[#f1f5f9] rounded-2xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-6 text-center">
        
        {/* Icon & Header */}
        <div className="mx-auto w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
          <CreditCard className="w-6 h-6" />
        </div>
        
        <div>
          <h1 className="text-xl font-black tracking-tight text-[#0f172a]">Payment Allocation</h1>
          <p className="text-xs text-slate-400 mt-1">Please settle the listing statement balance below.</p>
        </div>

        <hr className="border-slate-100" />

        {/* Amount Display */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex justify-between items-center text-slate-700">
          <span className="text-xs font-bold">Total Payable Amount:</span>
          <span className="text-lg font-black text-emerald-600">₱{total}.00</span>
        </div>

        {/* Test Dummy Payment Option */}
        <div className="border border-emerald-100 bg-emerald-50/10 rounded-xl p-4 text-left space-y-2">
          <span className="text-[10px] font-black tracking-wider text-emerald-700 uppercase block">Simulation Mode Active</span>
          <p className="text-xs text-slate-500 leading-relaxed">
            Clicking the resolution button below will instantly verify this mockup invoice scenario.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            onClick={() => {
              alert('Payment simulation successful! Your listing is now verified and active.')
              router.push('/landlord') 
            }}
            className="w-full bg-[#009667] hover:bg-[#008057] text-white font-bold text-xs py-3.5 rounded-xl transition flex items-center justify-center gap-1.5"
          >
            <CheckCircle className="w-4 h-4" /> Simulate Complete Payment
          </button>

          <button
            onClick={() => router.back()}
            className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-xs py-3.5 rounded-xl transition flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Form
          </button>
        </div>

      </div>
    </div>
  )
}

export default function LandlordPaymentPage() {
  return (
    // Wrapped in Suspense to safely use useSearchParams in Next.js App Router
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center text-xs text-slate-400 font-medium">
        Loading checkout configuration...
      </div>
    }>
      <PaymentContent />
    </Suspense>
  )
}