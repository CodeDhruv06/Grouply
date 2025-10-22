import React, { useEffect, useState } from "react";
import Navbar from "../Components/Navbar";
import { motion } from "framer-motion";

export default function Home() {
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`relative min-h-screen overflow-hidden transition-colors duration-500 md:pr-72 ${
        isDark
          ? "bg-gradient-to-b from-[#0f0b06] to-[#1a140c] text-white"
          : "bg-[var(--bg)] text-[var(--muted)]"
      }`}
    >
      <Navbar />

      {/* 🌟 Background Glow */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: isDark ? 0.3 : 0.1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className={`absolute inset-0 ${
          isDark
            ? "bg-gradient-radial from-gold/20 via-transparent to-transparent blur-[140px]"
            : "bg-gradient-radial from-[#f1e5c6]/50 via-transparent to-transparent blur-[180px]"
        }`}
      />

      {/* 🏠 Hero Section */}
      <section className="relative max-w-7xl mx-auto px-6 md:px-8 py-16 md:py-18 flex flex-col items-start">
        <motion.h1
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`font-serif leading-[0.95] text-5xl md:text-8xl ${
            isDark ? "text-white" : "text-[#2b1b09]"
          }`}
        >
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            Borrow Smart.
          </motion.span>{" "}
          <motion.span
            className="text-gold inline-block"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            Lend Safe.
          </motion.span>
          <br />
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.8 }}
          >
            Save Better.
          </motion.span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.8 }}
          className={`mt-8 max-w-4xl text-lg md:text-2xl ${
            isDark ? "text-white/80" : "text-[#3f3b36]"
          }`}
        >
          Your AI-powered financial companion for intelligent savings,
          peer-to-peer lending, and smarter money management.
        </motion.p>

        {/* Button */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 0.8 }}
          className="mt-10"
        >
          <motion.button
            whileHover={{
              scale: 1.08,
              boxShadow: isDark
                ? "0 0 25px rgba(255,215,0,0.6)"
                : "0 0 20px rgba(185,152,73,0.4)",
            }}
            whileTap={{ scale: 0.97 }}
            className={`relative px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold shadow-lg overflow-hidden transition-all duration-500 ${
              isDark
                ? "bg-gold text-[#2a2017] shadow-gold/20"
                : "bg-[#b99849] text-white shadow-[#b99849]/20"
            }`}
          >
            <motion.span
              className="absolute inset-0 bg-gradient-to-r from-gold via-white to-gold opacity-0"
              animate={{ opacity: [0, 0.2, 0], x: ["-100%", "100%"] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            Get Started →
          </motion.button>
        </motion.div>
      </section>

      {/* Floating Decorative Dots */}
      <motion.span
        animate={{ y: [0, 20, 0], opacity: [0.8, 1, 0.8] }}
        transition={{ repeat: Infinity, duration: 5 }}
        className={`absolute left-[20%] top-10 w-24 h-24 rounded-full ${
          isDark ? "bg-gold/20" : "bg-[#b99849]/10"
        }`}
      />
      <motion.span
        animate={{ y: [0, -25, 0], opacity: [0.6, 0.9, 0.6] }}
        transition={{ repeat: Infinity, duration: 6 }}
        className={`absolute right-[12%] top-1/3 w-20 h-20 rounded-full ${
          isDark ? "bg-gold/20" : "bg-[#b99849]/10"
        }`}
      />
      <motion.span
        animate={{ y: [0, 15, 0], opacity: [0.7, 1, 0.7] }}
        transition={{ repeat: Infinity, duration: 4 }}
        className={`absolute right-[28%] bottom-20 w-16 h-16 rounded-full ${
          isDark ? "bg-gold/20" : "bg-[#b99849]/10"
        }`}
      />
    </div>
  );
}
