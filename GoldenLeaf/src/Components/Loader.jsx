import React from 'react'
import { motion } from 'framer-motion'

export default function Loader({ label = 'Loading...' }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0f0b06] to-[#1a140c] text-white relative overflow-hidden">
      {/* subtle background glow */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.35, scale: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        className="absolute w-[520px] h-[520px] bg-white/10 blur-[110px] rounded-full"
      />

      <div className="relative z-10 flex flex-col items-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.1, ease: 'linear' }}
          className="w-16 h-16 rounded-full border-4 border-gold/80 border-t-transparent"
          aria-label="loading spinner"
        />
        <div className="mt-4 text-sm tracking-wide text-white/80">{label}</div>
        <div className="mt-1 text-xs text-white/50">GoldenLeaf</div>
      </div>
    </div>
  )
}
