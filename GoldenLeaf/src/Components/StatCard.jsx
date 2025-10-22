import React from 'react'
import { motion } from 'framer-motion'

export default function StatCard({ icon, title, value, color }) {
    const theme = localStorage.getItem('theme') || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`${color} rounded-2xl p-5 shadow-md hover:shadow-lg flex flex-col items-start justify-between border border-[#b99849]/20 transform-gpu will-change-transform`}
    >
      <div className="text-2xl text-gold mb-3">{icon}</div>
      <h3 className="text-sm font-medium text-[var(--muted)]">{title}</h3>
      <p className={`text-2xl font-serif font-bold mt-1 ${theme === "dark" ? "text-gold" : "text-black"}`}>{value}</p>
    </motion.div>
  )
}
