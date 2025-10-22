import React from 'react'
import { Link } from 'react-router-dom'

export default function Base() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      
      {/* Left Section: Hero */}
      <div className="md:w-[70%] bg-gradient-to-b from-[#0f0b06] to-[#1a140c] text-white flex flex-col justify-center px-8 md:px-16 py-16 relative">
        <div className="font-serif text-gold text-7xl md:text-8xl mb-8">
          Grouply
        </div>

        <h1 className="font-serif leading-[0.95] text-4xl md:text-6xl">
          Your Money. Your Rules.
          <br />
          <span className="text-gold">Grouply</span> makes it simple.
        </h1>

        <p className="mt-6 max-w-3xl text-base md:text-xl text-white/80">
          An AI-powered fintech platform for smarter saving, safer peer-to-peer lending, and everyday money mastery.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3 md:gap-4 md:mx-24">
          <Link to="/signup" className="bg-gold text-[#2a2017] px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold shadow-md shadow-black/20 hover:shadow-lg hover:translate-y-[-1px] transition">
            Create account
          </Link>
          <Link to="/login" className="px-6 md:px-8 py-3 md:py-4 rounded-xl font-semibold border border-white/15 hover:bg-white/5 text-white/90">
            I already have an account
          </Link>
        </div>

        {/* Decorative dots */}
        <span className="pointer-events-none absolute left-[20%] top-10 w-24 h-24 bg-gold/20 rounded-full" />
        <span className="pointer-events-none absolute right-[12%] top-1/3 w-20 h-20 bg-gold/20 rounded-full" />
        <span className="pointer-events-none absolute right-[28%] bottom-20 w-16 h-16 bg-gold/20 rounded-full" />
      </div>

      {/* Right Section: Quote (visible beside on md+, below on mobile) */}
      <div className="md:w-[30%] bg-[#f5f5f5] text-[#1a140c] flex flex-col justify-center items-center px-8 py-16 md:py-0">
        <blockquote className="text-2xl md:text-3xl font-serif italic text-center max-w-sm">
          “Financial freedom begins with smart choices and trusted partnerships.”
        </blockquote>
        <p className="mt-4 text-sm text-gray-600">– Grouply AI</p>
      </div>
    </div>
  )
}
