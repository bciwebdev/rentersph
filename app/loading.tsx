'use client'

import React from 'react'

export default function Loading() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50">
      <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mb-4"></div>
      <p className="text-xs font-black uppercase tracking-widest text-slate-400 animate-pulse">
        Securing Network Stream...
      </p>
    </div>
  )
}