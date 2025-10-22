import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FaWallet, FaChartLine, FaQrcode, FaCreditCard, FaArrowLeft, FaSun, FaMoon } from "react-icons/fa";
import { Link } from "react-router-dom";
import API from "../api";
export default function Profile() {
    const [profile, setProfile] = useState(null);
    const email = localStorage.getItem("userEmail");
    const [isDark, setIsDark] = useState(
        typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
    );

    useEffect(() => {
        fetchProfile();
    }, []);

    // Watch global theme class changes to sync local UI
    useEffect(() => {
        const el = document.documentElement;
        const obs = new MutationObserver(() => {
            setIsDark(el.classList.contains('dark'));
        });
        obs.observe(el, { attributes: true, attributeFilter: ['class'] });
        return () => obs.disconnect();
    }, []);

    const toggleTheme = () => {
        const el = document.documentElement;
        const next = !isDark;
        if (next) {
            el.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            el.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
        setIsDark(next);
    };

    async function fetchProfile() {
        const res = await API.get(`/profile/${email}`);
        const data = res.data;

        if (res.status === 200) setProfile(data);
    }

    // Precompute twinkle dots once (hook must be called unconditionally before any return)
    const twinkles = useMemo(() => {
        return Array.from({ length: 26 }).map(() => {
            const left = Math.random() * 100;
            const top = Math.random() * 100;
            const size = 2 + Math.random() * 3;
            const delay = Math.random() * 4;
            const duration = 3.5 + Math.random() * 2;
            return { left, top, size, delay, duration };
        });
    }, []);

    if (!profile) return <div className="text-center mt-10 text-white">Loading...</div>;

    return (
        <div className={`relative min-h-screen overflow-hidden transition-colors duration-500 ${isDark ? "bg-gradient-to-b from-[#0f0b06] to-[#1a140c] text-white" : "bg-[var(--bg)] text-[var(--muted)]"
            } p-8`}>
            {/* Top bar: Back to Home + Theme toggle */}
            <div className="relative z-10 max-w-6xl mx-auto mb-4 flex items-center justify-between">
                <Link
                    to="/home"
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm ${isDark ? "border-[#3a2a17] hover:bg-[#2a2015] text-white" : "border-[#e3d3b5] hover:bg-[#fff3e0] text-black"
                        }`}
                    aria-label="Back to Home"
                >
                    <FaArrowLeft /> Back to Home
                </Link>
                <button
                    onClick={toggleTheme}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm ${isDark ? "border-[#3a2a17] hover:bg-[#2a2015] text-white" : "border-[#e3d3b5] hover:bg-[#fff3e0] text-black"
                        }`}
                    aria-label="Toggle theme"
                    title={isDark ? "Switch to light" : "Switch to dark"}
                >
                    {isDark ? <FaSun /> : <FaMoon />} {isDark ? "Light" : "Dark"} mode
                </button>
            </div>
            {/* Animated Background: soft aurora, floating blobs, and twinkle dots */}
            <motion.div
                className="pointer-events-none absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.2 }}
            >
                {/* Radial glow */}
                <motion.div
                    className="absolute -top-40 -left-40 w-[28rem] h-[28rem] rounded-full blur-3xl"
                    style={{ background: isDark ? "radial-gradient(closest-side, rgba(185,152,73,0.25), transparent)" : "radial-gradient(closest-side, rgba(185,152,73,0.15), transparent)" }}
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute -bottom-48 -right-44 w-[30rem] h-[30rem] rounded-full blur-3xl"
                    style={{ background: isDark ? "radial-gradient(closest-side, rgba(232,106,51,0.18), transparent)" : "radial-gradient(closest-side, rgba(232,106,51,0.12), transparent)" }}
                    animate={{
                        scale: [1, 1.15, 1],
                        opacity: [0.45, 0.7, 0.45],
                    }}
                    transition={{ repeat: Infinity, duration: 9, ease: "easeInOut" }}
                />

                {/* Gradient ribbon */}
                <motion.div
                    className="absolute left-1/2 -translate-x-1/2 top-1/4 w-[140%] h-40 -rotate-12 blur-2xl"
                    style={{
                        background: isDark
                            ? "linear-gradient(90deg, rgba(232,106,51,0.12), rgba(185,152,73,0.12), rgba(58,41,23,0.12))"
                            : "linear-gradient(90deg, rgba(232,106,51,0.08), rgba(185,152,73,0.08), rgba(58,41,23,0.08))",
                    }}
                    animate={{ x: ["-5%", "5%", "-5%"], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
                />

                {/* Twinkle dots */}
                {twinkles.map((t, i) => (
                    <motion.span
                        key={i}
                        className="absolute rounded-full bg-[#b99849]"
                        style={{ left: `${t.left}%`, top: `${t.top}%`, width: t.size, height: t.size }}
                        initial={{ opacity: 0.2, scale: 0.8 }}
                        animate={{ opacity: [0.15, 0.6, 0.15], scale: [0.8, 1, 0.8] }}
                        transition={{ repeat: Infinity, duration: t.duration, delay: t.delay }}
                    />
                ))}
            </motion.div>

            <div className="relative z-10">
                {/* Header */}
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-3xl font-semibold mb-8 text-center ${isDark ? "text-gold" : "text-[#2b1b09]"}`}
                >
                    My Profile
                </motion.h1>

                {/* User Info */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-2xl shadow-xl p-6 mb-8 max-w-xl mx-auto ${isDark ? "bg-[#20160b]" : "bg-[#fff8ef] border border-[#e3d3b5]"}`}
                >
                    <p className={`text-lg font-semibold ${isDark ? "text-white" : "text-black"}`}>{profile.name}</p>
                    <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>{profile.email}</p>
                    <div className="flex justify-between items-center mt-4">
                        <div className="flex items-center gap-2 text-gold">
                            <FaWallet /> Balance
                        </div>
                        <span className={`text-xl font-semibold ${isDark ? "text-white" : "text-black"}`}>₹{profile.balance}</span>
                    </div>
                </motion.div>

                {/* Virtual Debit Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="relative bg-gradient-to-br from-[#E86A33] to-[#b75a2a] w-96 h-56 mx-auto rounded-2xl shadow-2xl p-6 flex flex-col justify-between"
                >
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold tracking-wide flex items-center gap-2">
                            <FaCreditCard /> GoldPay Virtual Card
                        </h2>
                        <FaQrcode className="text-2xl opacity-70" />
                    </div>

                    <div className="flex flex-col mt-4">
                        <p className="text-sm opacity-80">Card Holder</p>
                        <p className="text-xl font-semibold">{profile.name}</p>
                    </div>

                    <div className="absolute right-6 bottom-6 bg-white rounded-xl p-2 shadow-lg">
                        <img src={profile.qrCode} alt="QR" className="w-16 h-16 rounded-lg" />
                    </div>
                </motion.div>

                {/* Finance Score */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className={`rounded-2xl shadow-xl p-6 mt-8 max-w-xl mx-auto ${isDark ? "bg-[#20160b]" : "bg-[#fff8ef] border border-[#e3d3b5]"}`}
                >
                    <div className={`flex items-center gap-2 mb-3 ${isDark ? "text-[#f7d58b]" : "text-[#7a5a1d]"}`}>
                        <FaChartLine /> Financial Health Score
                    </div>
                    <div className={`relative h-4 rounded-full overflow-hidden ${isDark ? "bg-[#3a2a17]" : "bg-[#ead9bd]"}`}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(profile.financeScore / 900) * 100}%` }}
                            transition={{ duration: 1 }}
                            className={`h-full ${profile.financeScore > 750
                                    ? "bg-green-500"
                                    : profile.financeScore > 600
                                        ? "bg-yellow-500"
                                        : "bg-red-500"
                                }`}
                        ></motion.div>
                    </div>
                    <p className={`mt-2 text-sm ${isDark ? "text-gray-400" : "text-gray-700"}`}>Score: {profile.financeScore} / 900</p>
                    <p className={`text-sm mt-2 italic ${isDark ? "text-gray-500" : "text-gray-600"}`}>
                        {profile.financeScore > 750
                            ? "Excellent financial health 👏"
                            : profile.financeScore > 600
                                ? "Good, keep optimizing spending 💰"
                                : "Needs improvement — try saving more 📉"}
                    </p>
                </motion.div>

                {/* Footer */}
                <p className={`text-center text-xs mt-8 ${isDark ? "text-gray-500" : "text-gray-600"}`}>
                    © 2025 GoldPay FinTech — Smart, Secure, Seamless
                </p>
            </div>
        </div>
    );
}
