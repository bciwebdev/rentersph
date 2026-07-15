'use client'

import React, { Suspense, useState, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { CheckCircle, ArrowLeft, QrCode, Upload, FileText } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function PaymentContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const total = searchParams.get('total') || '20'
  const [referenceNumber, setReferenceNumber] = useState('')
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptFile(e.target.files[0])
    }
  }

  const handleConfirmPayment = async () => {
    if (!referenceNumber.trim()) {
      setStatusMessage('Please enter your payment reference number to proceed.')
      return
    }

    if (!receiptFile) {
      setStatusMessage('Please upload a screenshot of your payment receipt to proceed.')
      return
    }

    setIsVerifying(true)
    setStatusMessage(null)

    try {
      // 1. Fetch the latest property ID
      const { data: activeListings, error: fetchError } = await supabase
        .from('properties')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)

      if (fetchError || !activeListings || activeListings.length === 0) {
        throw new Error('Could not find a corresponding listing record.')
      }

      const latestId = activeListings[0].id

      // 2. Upload the file to the 'receipts' bucket
      const fileExt = receiptFile.name.split('.').pop()
      const fileName = `${latestId}-${Date.now()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, receiptFile, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw new Error(`Receipt upload failed: ${uploadError.message}`)

      // 3. Get the public URL of the uploaded receipt
      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName)

      // 4. INSERT the log into payment_transactions using your verified columns
      const { error: txError } = await supabase
        .from('payment_transactions')
        .insert([
          {
            property_id: latestId,
            reference_number: referenceNumber.trim(),
            checkout_session_id: referenceNumber.trim(),
            receipt_url: publicUrl,
            payment_status: 'pending'
          }
        ])

      if (txError) throw new Error(`Transaction save failed: ${txError.message}`)

      // 5. Update the properties status to 'pending' so it hits the admin portal
      const { error: updateError } = await supabase
        .from('properties')
        .update({ 
          status: 'pending' 
        })
        .eq('id', latestId)

      if (updateError) throw new Error(updateError.message)

      alert('Thank you! Your reference number and receipt have been recorded. Your listing will go live as soon as your payment is verified.')
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

        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex justify-between items-center text-slate-700">
          <span className="text-xs font-bold">Total Billable Amount:</span>
          <span className="text-lg font-black text-emerald-600">₱{total}.00</span>
        </div>

        <div className="border border-slate-100 p-6 bg-white rounded-xl flex justify-center items-center shadow-[0_2px_10px_rgba(0,0,0,0.01)]">
          <img 
            src="/gcash-qr.png" 
            alt="Payment Merchant QR Destination Code"
            className="w-64 h-64 mx-auto block object-contain select-none"
            style={{ imageRendering: 'pixelated' }}
            onError={(e) => {
              console.error("QR Code image could not be loaded at path: /gcash-qr.png")
            }}
          />
        </div>

        {statusMessage && (
          <p className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-100 p-2.5 rounded-xl">
            {statusMessage}
          </p>
        )}

        <div className="space-y-4 text-left">
          {/* Reference Input */}
          <div className="space-y-1.5">
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

          {/* Receipt Screenshot Upload */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black tracking-wider text-[#64748b] uppercase">
              Upload Payment Screenshot
            </label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-xl p-4 text-center cursor-pointer transition bg-slate-50/50 hover:bg-emerald-50/10 flex flex-col items-center justify-center gap-1"
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              {receiptFile ? (
                <div className="flex items-center gap-2 text-emerald-600">
                  <FileText className="w-4 h-4" />
                  <span className="text-xs font-bold truncate max-w-[240px]">{receiptFile.name}</span>
                </div>
              ) : (
                <>
                  <Upload className="w-4 h-4 text-slate-400" />
                  <span className="text-[11px] text-slate-500 font-semibold">Click to select receipt image</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <button
            onClick={handleConfirmPayment}
            disabled={isVerifying}
            className="w-full bg-[#009667] hover:bg-[#008057] text-white font-bold text-xs py-3.5 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <CheckCircle className="w-4 h-4" /> {isVerifying ? 'Uploading Receipt...' : 'I Have Made the Payment'}
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