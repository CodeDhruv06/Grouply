import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import API from '../api'
import Loader from '../Components/Loader'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
          const res = await API.post('/user/login', { email, password })
      if (res?.data?.token) {
        localStorage.setItem('token', res.data.token)
        navigate('/home')
      } else {
        setError('Login succeeded but no token returned')
      }
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }
  if (loading) {
    return <Loader label="Signing you in..." />
  }
  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#0f0b06] to-[#1a140c] text-[var(--muted)] px-4">

      {/* Left Panel with Quote */}
      <motion.div
        initial={{ x: '-100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 1, ease: 'easeInOut' }}
        className="hidden lg:flex absolute left-0 top-0 h-full w-1/2 bg-gradient-to-br from-gold/20 via-transparent to-transparent items-center justify-center"
      >
        <div className="max-w-sm text-left px-10">
          <h2 className="text-3xl font-serif text-gold mb-4 leading-snug">
            “Welcome back to <br /> financial freedom.”
          </h2>
          <p className="text-white/60 text-sm">
            Continue your journey with <span className="text-gold">Grouply</span> — your partner in smart money management.
          </p>
        </div>
      </motion.div>

      {/* Spotlight Glow */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.5, scale: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        className="absolute w-[600px] h-[600px] bg-white/15 blur-[120px] rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      />

      {/* Login Card */}
      <motion.div
        initial={{ x: 0, opacity: 0 }}
        animate={{ x: 150, opacity: 1 }}
        transition={{ duration: 1, ease: 'easeInOut', delay: 0.3 }}
        className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.08] backdrop-blur-md p-6 shadow-2xl shadow-black/40"
      >
        <h1 className="text-3xl font-serif text-white text-center">Welcome back</h1>
        <p className="mt-2 text-center text-white/70 text-sm">
          Sign in to continue your journey with <span className="text-gold font-semibold">Grouply</span>.
        </p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm text-white/80 mb-1">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              required
              className="w-full rounded-lg bg-black/30 border border-white/10 px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-gold/60"
            />
          </div>
          <div>
            <label className="block text-sm text-white/80 mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-lg bg-black/30 border border-white/10 px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-gold/60"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-gold text-[#2a2017] font-semibold rounded-lg py-2.5 hover:opacity-95 transition disabled:opacity-60">
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-white/70">
          New to Grouply?{' '}
          <Link to="/signup" className="text-gold font-semibold hover:underline">
            Create an account
          </Link>
        </p>
      </motion.div>
    </main>
  )
}
