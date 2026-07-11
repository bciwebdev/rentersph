'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Home, Heart, LayoutDashboard } from 'lucide-react'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="w-full bg-white border-b border-slate-100 sticky top-0 z-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-6 h-6 bg-emerald-600 rounded-md flex items-center justify-center">
            <Home className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-black text-slate-950 text-sm tracking-tight">
            renters<span className="text-emerald-600">PH</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/favorites" className="text-xs font-bold text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-rose-500" /> Favorites
          </Link>
          <Link 
            href="/login" 
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            <LayoutDashboard className="w-3.5 h-3.5" /> Landlord Dashboard
          </Link>
        </div>

        {/* Mobile Hamburger Trigger */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 text-slate-600 hover:bg-slate-50 rounded-xl transition"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Dropdown Panel */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-100 py-3 space-y-2 animate-fade-in bg-white absolute left-0 right-0 px-4 shadow-xl">
          <Link 
            href="/favorites" 
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition"
          >
            <Heart className="w-4 h-4 text-rose-500" /> Favorites
          </Link>
          <Link 
            href="/login" 
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-4 py-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-sm"
          >
            <LayoutDashboard className="w-4 h-4" /> Landlord Dashboard
          </Link>
        </div>
      )}
    </nav>
  )
}