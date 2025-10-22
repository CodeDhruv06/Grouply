import React, { useEffect, useRef, useState } from "react";
import Navbar from "../Components/Navbar";
import { motion } from "framer-motion";
import { FaWallet, FaChartPie, FaPiggyBank, FaRobot } from "react-icons/fa";
import StatCard from "../Components/StatCard";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
export default function Dashboard() {
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark")
  );
  const [suggestion, setSuggestion] = useState("Analyzing your financial data...");
  const [suggestionUpdatedAt, setSuggestionUpdatedAt] = useState(null);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [balance, setBalance] = useState(0);
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
  const theme = localStorage.getItem('theme');
  const [expenses, setExpenses] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [spent, setSpent] = useState(0);
  const [saved, setSaved] = useState(0);
  const fetchDashboard = async () => {
    try {
      const email = localStorage.getItem("userEmail");
      const res = await API.get(`/dashboard/${email}`);
      const data = res.data;

      if (res.ok) {
        setBalance(Number(data.balance) || 0);
        setSpent(data.spentThisMonth);
        setSaved(data.savedThisMonth);
        // Normalize/sort for stable ordering so downstream AI prompt cache hits reliably
        const trendSorted = Array.isArray(data.trendData)
          ? [...data.trendData].sort((a, b) => String(a.month).localeCompare(String(b.month)))
          : [];
        setTrendData(trendSorted);
        const expArray = Object.entries(data.categoryData || {}).map(([category, amount]) => ({
          category,
          amount,
        }));
        expArray.sort((a, b) => a.category.localeCompare(b.category));
        setExpenses(expArray);
      } else {
        console.error("Dashboard fetch failed", data);
      }
    } catch (err) {
      console.error("Dashboard error", err);
    }
  };

  useEffect(() => {
    fetchDashboard();
    // also refetch when window regains focus or tab becomes visible
    const onFocus = () => fetchDashboard();
    const onVisibility = () => {
      if (document.visibilityState === "visible") fetchDashboard();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
  // 📊 Expense and Trend Data
  // const expenses = [
  //   { category: "Food", amount: 3500 },
  //   { category: "Rent", amount: 6000 },
  //   { category: "Travel", amount: 1800 },
  //   { category: "Entertainment", amount: 1200 },
  //   { category: "Others", amount: 900 },
  // ];

  // const trendData = [
  //   { month: "Jan", spent: 5000 },
  //   { month: "Feb", spent: 6200 },
  //   { month: "Mar", spent: 7000 },
  //   { month: "Apr", spent: 6400 },
  //   { month: "May", spent: 5800 },
  //   { month: "Jun", spent: 7200 },
  // ];

  // 🎨 Color palette
  const COLORS = ["#E86A33", "#0097B2", "#F3C623", "#3A98B9", "#7B61FF"];

  // 🤖 Gemini AI Suggestion via Backend Proxy with localStorage caching & cooldown
  const GEMINI_CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours
  const email = typeof window !== 'undefined' ? localStorage.getItem('userEmail') || 'anon' : 'anon';
  const cacheKey = `gl:gemini:suggestion:v1:${email}`;
  const inFlight = useRef(false);
  const lastFetchAtRef = useRef(0);
  const LOCAL_COOLDOWN_MS = 1000 * 60; // 60s

  const hashString = (str) => {
    let h1 = 0xdeadbeef ^ str.length, h2 = 0x41c6ce57 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = (h1 ^ (h1 >>> 16)) >>> 0;
    h2 = (h2 ^ (h2 >>> 13)) >>> 0;
    return (4294967296 * (h2 >>> 0) + (h1 >>> 0)).toString(36);
  };

  const buildPrompt = () =>
    `Analyze this user's financial data and give ONE concise, helpful suggestion (under 50 words, 2 bullet points, 1st related to Advice and 2nd related to investment options to save money and done write "Advice" and "Investment" in the start).
                  Expenses: ${JSON.stringify(expenses)}
                  Trends: ${JSON.stringify(trendData)}
                  Keep it friendly and practical.`;

  const fetchGeminiSuggestion = async (opts = { force: false }) => {
    const { force } = opts;
    if (inFlight.current) return; // prevent duplicate calls on rapid re-renders
    const now = Date.now();
    if (!force && now - lastFetchAtRef.current < LOCAL_COOLDOWN_MS) {
      return; // local cooldown
    }
    const prompt = buildPrompt();
    const promptHash = hashString(prompt);

    try {
      // Check cache
      const raw = localStorage.getItem(cacheKey);
      if (!force && raw) {
        try {
          const cached = JSON.parse(raw);
          if (cached && cached.promptHash === promptHash && Date.now() - cached.ts < GEMINI_CACHE_TTL_MS) {
            setSuggestion(cached.text);
            setSuggestionUpdatedAt(cached.ts);
            return; // skip network
          }
        } catch { }
      }

      inFlight.current = true;
      setSuggestionLoading(true);
      let text = "";
      try {
        const { data } = await API.post("/gemini/generate", { prompt, email, force });

        // Access data directly (Axios auto-parses JSON)
        text = data?.suggestion || data?.note || "";

        if (!text) {
          text = "Couldn’t fetch AI suggestion right now. Try again later.";
        }
      } catch (error) {
        console.error("Gemini API Error:", error);
        text = "⚠️ Something went wrong while fetching AI suggestion.";
      }

      setSuggestion(text);
      const ts = Date.now();
      setSuggestionUpdatedAt(ts);
      localStorage.setItem(cacheKey, JSON.stringify({ text, ts, promptHash }));
    } catch (error) {
      console.error("Gemini Backend API error:", error);
      setSuggestion("Couldn't connect to AI right now. Review your expenses or try again later.");
    } finally {
      inFlight.current = false;
      setSuggestionLoading(false);
      lastFetchAtRef.current = Date.now();
    }
  };

  // Initial run
  useEffect(() => {
    fetchGeminiSuggestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recompute AI suggestion whenever the underlying data changes (but obey cache TTL)
  useEffect(() => {
    if (expenses.length || trendData.length) {
      fetchGeminiSuggestion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses, trendData]);

  return (
    <div
      className={`relative min-h-screen overflow-hidden transition-colors duration-500 md:pr-72 ${isDark
        ? "bg-gradient-to-b from-[#0f0b06] to-[#1a140c] text-white"
        : "bg-[var(--bg)] text-[var(--muted)]"
        }`}
    >
      <Navbar />

      {/* 🌟 Background Glow */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: isDark ? 0.25 : 0.1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className={`absolute inset-0 ${isDark
          ? "bg-gradient-radial from-gold/15 via-transparent to-transparent"
          : "bg-gradient-radial from-[#b99849]/15 via-transparent to-transparent"
          }`}
      />

      {/* 💫 Floating Dots */}
      {[
        { left: "15%", top: "10", size: "w-24 h-24", duration: 6 },
        { right: "10%", top: "1/3", size: "w-20 h-20", duration: 7 },
        { right: "25%", bottom: "20", size: "w-16 h-16", duration: 5 },
        { left: "30%", bottom: "32", size: "w-28 h-28", duration: 8 },
      ].map((dot, i) => (
        <motion.span
          key={i}
          animate={{ y: [0, 20, 0], opacity: [0.7, 1, 0.7] }}
          transition={{ repeat: Infinity, duration: dot.duration }}
          className={`absolute ${dot.left ? `left-[${dot.left}]` : `right-[${dot.right}]`
            } ${dot.top ? `top-${dot.top}` : `bottom-${dot.bottom}`} ${dot.size}
          rounded-full ${isDark ? "bg-gold/25" : "bg-[#b99849]/15"
            }`}
        />
      ))}

      {/* 🧭 Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 py-8">
        <h1
          className={`text-4xl font-serif font-semibold ${isDark ? "text-white" : "text-[#2b1b09]"
            }`}
        >
          Your <span className="text-gold">Financial Dashboard</span>
        </h1>
        <p className="mt-2 text-sm md:text-base text-[var(--muted)]">
          Manage, Learn, and Grow your Finances — all in one place.
        </p>

        {/* 💰 Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-8">
          <StatCard
            icon={<FaWallet />}
            title="Current Balance"
            value={`₹${Number(balance).toLocaleString('en-IN')}`}
            color={isDark ? "bg-[#2a2015]" : "bg-[#fff5e3]"}
          />
          <StatCard
            icon={<FaChartPie />}
            title="Monthly Expenses"
            value={`₹${Number(spent).toLocaleString('en-IN')}`}
            color={isDark ? "bg-[#2a2015]" : "bg-[#fff5e3]"}
          />
          <StatCard
            icon={<FaPiggyBank />}
            title="Saved this Month"
            value={`₹${Number(saved).toLocaleString('en-IN')}`}
            color={isDark ? "bg-[#2a2015]" : "bg-[#fff5e3]"}
          />
          <StatCard
            icon={<FaRobot />}
            title="AI Insights"
            value="Live Tips"
            color={isDark ? "bg-[#2a2015]" : "bg-[#fff5e3]"}
          />
        </div>

        {/* 📊 Analytics Section */}
        <div
          className={`mt-10 p-6 rounded-2xl shadow-inner ${isDark ? "bg-[#20160b]" : "bg-[#fff8ef]"
            }`}
        >
          <h2 className={`text-2xl ${theme === "dark" ? "text-grey-100" : "text-black"} font-semibold font-serif mb-6`}>
            Spending <span className="text-gold">Overview</span>
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* 📈 Line Chart */}
            <div
              className={`p-4 rounded-xl ${isDark ? "bg-[#1a1208]" : "bg-[#faefe2]"
                }`}
            >
              <h3 className="text-lg mb-3 font-semibold">Monthly Trend</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                  <XAxis dataKey="month" stroke={isDark ? "#ccc" : "#444"} />
                  <YAxis stroke={isDark ? "#ccc" : "#444"} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? "#2b2010" : "#fff",
                      border: "none",
                      borderRadius: "10px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="spent"
                    stroke="#d4af37"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#d4af37" }}
                    activeDot={{ r: 6, fill: "#b8860b" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* 🥧 Pie Chart */}
            <div
              className={`p-4 rounded-xl ${isDark ? "bg-[#1a1208]" : "bg-[#faefe2]"
                }`}
            >
              <h3 className="text-lg mb-3 font-semibold">Expense Breakdown</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={expenses}
                    dataKey="amount"
                    nameKey="category"
                    outerRadius={90}
                    label
                    isAnimationActive={true}
                  >
                    {expenses.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? "#2b2010" : "#fff",
                      border: "none",
                      borderRadius: "10px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 🤖 AI Suggestion Section */}
        <motion.div
          className={`mt-10 p-6 rounded-2xl ${isDark ? "bg-[#20160b]" : "bg-[#fff8ef]"
            }`}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center justify-between gap-4 mb-3">
            <h2 className="text-2xl font-semibold text-gold flex items-center gap-2">
              <FaRobot /> Grouply AI Suggestion
            </h2>
            <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
              {suggestionUpdatedAt && (
                <span>Updated {new Date(suggestionUpdatedAt).toLocaleTimeString()}</span>
              )}
              <button
                onClick={() => fetchGeminiSuggestion({ force: true })}
                disabled={suggestionLoading}
                className={`px-3 py-1 rounded-md border text-sm ${isDark ? "border-[#3a2a17] hover:bg-[#2a2015]" : "border-[#e3d3b5] hover:bg-[#faefe2]"}`}
                title="Fetch a fresh suggestion"
              >
                {suggestionLoading ? "Refreshing…" : "Refresh tips"}
              </button>
            </div>
          </div>
          <div
            className="text-[var(--muted)] text-base leading-relaxed"
            dangerouslySetInnerHTML={{ __html: `💬 ${suggestion}` }}
          />

        </motion.div>
      </div>
    </div>
  );
}
