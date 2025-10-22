const express = require("express");
const router = express.Router();
const crypto = require("crypto");
require("dotenv").config();

const fetch = (...args) =>
    import("node-fetch").then(({ default: fetch }) => fetch(...args));

// Simple in-memory cache to reduce upstream Gemini calls
// Keyed by a stable hash of the prompt; values contain the suggestion and expiry timestamp
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours
const cache = new Map();
// Simple per-user/ip cooldown to avoid hammering upstream
const MIN_INTERVAL_MS = 1000 * 60; // 60s
const lastCallByKey = new Map(); // key -> timestamp

function promptHash(prompt) {
    return crypto.createHash("sha1").update(String(prompt)).digest("hex");
}

router.post("/generate", async (req, res) => {
    const { prompt, email, force = false } = req.body || {};

    try {
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: "Missing GEMINI_API_KEY" });
        }

        const key = promptHash(prompt || "");
        // Rate limit per user (email) if provided, else per ip
        const rlKey = (email && String(email).toLowerCase()) || req.ip || "anon";
        const now = Date.now();
        const last = lastCallByKey.get(rlKey) || 0;
        if (!force && now - last < MIN_INTERVAL_MS) {
            const cached = cache.get(key);
            res.setHeader("X-Gemini-RateLimit", "COOLDOWN");
            return res.status(429).json({
                note: `Please wait ${Math.ceil((MIN_INTERVAL_MS - (now - last)) / 1000)}s before requesting again`,
                suggestion: cached?.suggestion || null,
                cached: Boolean(cached)
            });
        }
        const cached = cache.get(key);
        if (cached && cached.expiresAt > now) {
            res.setHeader("X-Gemini-Cache", "HIT");
            return res.json({ suggestion: cached.suggestion, cached: true });
        }

        console.log("📩 Incoming Gemini Request Body:", req.body);

        const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`;

        console.log("🔗 Calling Gemini API:", GEMINI_URL);

        // Record call timestamp pre-emptively to debounce concurrent hits
        lastCallByKey.set(rlKey, now);

        const response = await fetch(GEMINI_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
            }),
        });

        const data = await response.json();

        console.log("🌐 Gemini API Status:", response.status);
        console.log("📨 Gemini API Response:", data);

        if (!response.ok) {
            // Map common upstream errors to clearer messages and headers
            const status = response.status;
            if (status === 429 || data?.error?.status === "RESOURCE_EXHAUSTED") {
                const retryDelay = data?.details?.find?.(d => d['@type']?.includes('RetryInfo'))?.retryDelay || "60s";
                res.setHeader("Retry-After", retryDelay.replace('s',''));
                const cached = cache.get(key);
                return res.status(429).json({
                    note: "Upstream rate limit reached. Please try again later.",
                    suggestion: cached?.suggestion || null,
                    cached: Boolean(cached)
                });
            }
            return res.status(status).json(data);
        }
        let text =
            data.candidates?.[0]?.content?.parts?.[0]?.text || "No response text found";

        console.log("💬 Gemini Response Text:", text);
        text = text
            .replace(/\*\s*/g, "<br><br>• ")
            .replace(/\n+/g, " ") // remove raw newlines
            .trim();

        cache.set(key, { suggestion: text, expiresAt: now + CACHE_TTL_MS });
        res.setHeader("X-Gemini-Cache", "MISS");
        res.json({ suggestion: text });
    } catch (err) {
        console.error("🚨 Error calling Gemini API:", err);
        // On unexpected error, try to serve cached suggestion if present
        try {
            const key = promptHash(prompt || "");
            const cached = cache.get(key);
            if (cached) {
                return res.status(503).json({
                    note: "Service temporarily unavailable; serving cached suggestion.",
                    suggestion: cached.suggestion,
                    cached: true
                });
            }
        } catch {}
        res.status(503).json({ error: "Failed to generate content" });
    }
});

router.post("/chatbot", async (req, res) => {
    const { prompt, email, force = false } = req.body || {};

    try {
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: "Missing GEMINI_API_KEY" });
        }

        const key = promptHash(prompt || "");
        // Rate limit per user (email) if provided, else per ip
        const rlKey = (email && String(email).toLowerCase()) || req.ip || "anon";
        const now = Date.now();
        const last = lastCallByKey.get(rlKey) || 0;
        if (!force && now - last < MIN_INTERVAL_MS) {
            const cached = cache.get(key);
            res.setHeader("X-Gemini-RateLimit", "COOLDOWN");
            return res.status(429).json({
                note: `Please wait ${Math.ceil((MIN_INTERVAL_MS - (now - last)) / 1000)}s before requesting again`,
                suggestion: cached?.suggestion || null,
                cached: Boolean(cached)
            });
        }
        const cached = cache.get(key);
        if (cached && cached.expiresAt > now) {
            res.setHeader("X-Gemini-Cache", "HIT");
            return res.json({ suggestion: cached.suggestion, cached: true });
        }

        console.log("📩 Incoming Gemini Request Body:", req.body);

        const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent?key=${process.env.GEMINI_API_KEY2}`;

        console.log("🔗 Calling Gemini API:", GEMINI_URL);

        // Record call timestamp pre-emptively to debounce concurrent hits
        lastCallByKey.set(rlKey, now);

        const response = await fetch(GEMINI_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
            }),
        });

        const data = await response.json();

        console.log("🌐 Gemini API Status:", response.status);
        console.log("📨 Gemini API Response:", data);

        if (!response.ok) {
            // Map common upstream errors to clearer messages and headers
            const status = response.status;
            if (status === 429 || data?.error?.status === "RESOURCE_EXHAUSTED") {
                const retryDelay = data?.details?.find?.(d => d['@type']?.includes('RetryInfo'))?.retryDelay || "60s";
                res.setHeader("Retry-After", retryDelay.replace('s',''));
                const cached = cache.get(key);
                return res.status(429).json({
                    note: "Upstream rate limit reached. Please try again later.",
                    suggestion: cached?.suggestion || null,
                    cached: Boolean(cached)
                });
            }
            return res.status(status).json(data);
        }
        let text =
            data.candidates?.[0]?.content?.parts?.[0]?.text || "No response text found";

        console.log("💬 Gemini Response Text:", text);
        text = text
            .replace(/\*\s*/g, "<br><br>• ")
            .replace(/\n+/g, " ") // remove raw newlines
            .trim();

        cache.set(key, { suggestion: text, expiresAt: now + CACHE_TTL_MS });
        res.setHeader("X-Gemini-Cache", "MISS");
        res.json({ suggestion: text });
    } catch (err) {
        console.error("🚨 Error calling Gemini API:", err);
        // On unexpected error, try to serve cached suggestion if present
        try {
            const key = promptHash(prompt || "");
            const cached = cache.get(key);
            if (cached) {
                return res.status(503).json({
                    note: "Service temporarily unavailable; serving cached suggestion.",
                    suggestion: cached.suggestion,
                    cached: true
                });
            }
        } catch {}
        res.status(503).json({ error: "Failed to generate content" });
    }
});

module.exports = router;
