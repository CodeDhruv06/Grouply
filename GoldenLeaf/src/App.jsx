import React from 'react'
import { Routes, Route } from 'react-router-dom'
import './index.css'

import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import VoiceChat from './pages/ai'
import Transfer from './pages/Transfer'
import SplitBill from './pages/SplitBill'
import Base from './pages/Base'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Profile from './pages/Profile'
import PayPage from './pages/PayPage'
import Navbar from './Components/Navbar'

export default function App(){
  return (
    <>
        <Routes>
          <Route path="/" element={<Base />} />
          <Route path="/home" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/ai" element={<VoiceChat />} />
          <Route path="/transfer" element={<Transfer />} />
          <Route path="/Split-Bill" element={<SplitBill />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/pay/:qrCodeId" element={<PayPage />} />
          <Route path="/signup" element={<Signup />} />

          <Route path="*" element={<Base />} />
        </Routes>
      </>
  )
}
