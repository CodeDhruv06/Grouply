import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaMicrophone, FaRobot, FaUser, FaVolumeUp, FaPaperPlane } from "react-icons/fa";
import { motion } from "framer-motion";
import Navbar from "../Components/Navbar";
import API from "../api";

// AI chat with robust speech recognition (Chrome/Edge/Brave) and graceful fallbacks
export default function VoiceChat() {
    const API_BASE = "http://localhost:5000/api/v1";
    const userEmail = localStorage.getItem("userEmail") || "anon@user";

    const [messages, setMessages] = useState([]);
    const [isListening, setIsListening] = useState(false);
    const [supportMsg, setSupportMsg] = useState("");
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    const recognitionRef = useRef(null);
    const inUseRef = useRef(false);
    const synth = typeof window !== "undefined" ? window.speechSynthesis : null;

    // pick a decent voice if available
    const pickVoice = () => {
        if (!synth) return null;
        const voices = synth.getVoices();
        return (
            voices.find(v => /en-IN|en-GB|en-US/i.test(v.lang) && /Google|Microsoft/i.test(v.name)) ||
            voices.find(v => /en/i.test(v.lang)) ||
            null
        );
    };

    useEffect(() => {
        // ensure voices are loaded
        if (!synth) return;
        const handle = () => { };
        synth.addEventListener?.("voiceschanged", handle);
        synth.getVoices();
        return () => synth.removeEventListener?.("voiceschanged", handle);
    }, [synth]);

    const speak = (text) => {
        if (!synth || !text) return;
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = "en-IN";
        const v = pickVoice();
        if (v) utter.voice = v;
        synth.cancel();
        synth.speak(utter);
    };

    const addMessage = (sender, payload) => {
        // payload can be string text or an object { text?, html? }
        const msg = typeof payload === 'string' ? { text: payload } : payload;
        setMessages((prev) => [...prev, { sender, ...msg }]);
    };

    // Pretty-format long AI text into clean HTML (lists, headings, paragraphs)
    const escapeHtml = (s) => s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const formatAiTextToHtml = (input) => {
        if (!input) return "";
        let t = String(input)
            .replace(/\r/g, "")
            .replace(/<br\s*\/?>(\s*)/gi, "\n")
            .replace(/\u2022/g, "•");

        // Collapse repeated bullets-only lines
        let lines = t.split(/\n+/).map(s => s.trim()).filter(Boolean).filter(s => s !== "•");
        let html = "";
        let inList = false;
        const closeList = () => { if (inList) { html += '</ul>'; inList = false; } };

        for (let raw of lines) {
            const line = raw.replace(/^\*\*\s*/g, "");
            if (/^#{2,6}\s*/.test(line) || /^###/.test(line)) {
                closeList();
                const h = line.replace(/^#+\s*/, "");
                html += `<h3 class=\"text-lg font-semibold text-gold mt-4 mb-2\">${escapeHtml(h)}</h3>`;
                continue;
            }
            if (/^---+$/.test(line)) { closeList(); html += '<hr class="my-4 border-[#3a2a17] opacity-50" />'; continue; }
            if (/^(disclaimer:?)/i.test(line)) {
                closeList();
                html += `<p class=\"text-xs italic opacity-80 mt-2 mb-1\"><strong>Disclaimer:</strong> For educational purposes only. Consult a licensed financial advisor for personal advice.</p>`;
                continue;
            }
            if (/^[-*•]\s+/.test(line)) {
                if (!inList) { html += '<ul class="list-disc pl-5 space-y-1">'; inList = true; }
                html += `<li>${escapeHtml(line.replace(/^[-*•]\s+/, ""))}</li>`;
                continue;
            }
            // Skip stray single characters or empty fragments
            if (line.length <= 1) continue;
            closeList();
            html += `<p class=\"mb-2\">${escapeHtml(line)}</p>`;
        }
        closeList();
        return html || `<p class=\"mb-2\">${escapeHtml(input)}</p>`;
    };

    // Create a recognition instance on demand with robust fallbacks
    const getRecognition = () => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) return null;
        const r = new SR();
        r.lang = "en-IN";
        r.interimResults = false;
        r.continuous = false; // one-shot for consistent UX
        return r;
    };

    const ensureMicPermission = async () => {
        if (!navigator?.mediaDevices?.getUserMedia) return true; // let SR handle it
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // immediately stop tracks; we only wanted the permission prompt
            stream.getTracks().forEach(t => t.stop());
            return true;
        } catch (e) {
            setSupportMsg("Microphone permission denied. Please allow mic access and retry.");
            return false;
        }
    };

    const startListening = async () => {
        if (isListening || inUseRef.current) return;
        const r = getRecognition();
        if (!r) {
            setSupportMsg("Speech recognition not supported. Try Chrome/Edge on desktop.");
            return;
        }
        const ok = await ensureMicPermission();
        if (!ok) return;
        recognitionRef.current = r;
        setSupportMsg("");
        setIsListening(true);
        inUseRef.current = true;
        try {
            r.start();
        } catch { }

        r.onstart = () => setIsListening(true);
        r.onend = () => {
            setIsListening(false);
            inUseRef.current = false;
        };
        r.onerror = (e) => {
            setIsListening(false);
            inUseRef.current = false;
            if (e?.error === "not-allowed") {
                setSupportMsg("Microphone access blocked. Allow mic permissions and retry.");
            } else if (e?.error === "no-speech") {
                setSupportMsg("No speech detected. Try again closer to the mic.");
            } else if (e?.error === "audio-capture") {
                setSupportMsg("No microphone found. Connect a mic and retry.");
            } else {
                setSupportMsg("Speech error. Please try again.");
            }
        };

        r.onresult = async (event) => {
            let transcript = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const res = event.results[i];
                if (res.isFinal) transcript += res[0].transcript;
            }
            transcript = transcript.trim();
            if (!transcript) return;
            addMessage("user", transcript);
            await processPrompt(transcript);
            try { r.stop(); } catch { }
        };
    };

    const stopListening = () => {
        const r = recognitionRef.current;
        if (!r) return;
        try { r.stop(); } catch { }
        setIsListening(false);
        inUseRef.current = false;
    };

    const processPrompt = async (text) => {
        setLoading(true);
        try {
            // hit our backend Gemini proxy
            const res = await API.post("/gemini/generate", {
                prompt: text,
                email: userEmail,
            });

            const data = res.data || {};
            const replyText = data.suggestion || data.note || "Sorry, something went wrong.";

            const html = formatAiTextToHtml(replyText);
            addMessage("bot", { text: replyText, html });
            speak(replyText);

        } catch (e) {
            console.error("Gemini API error:", e);
            addMessage("bot", "Network error talking to AI. Please try again.");
        } finally {
            setLoading(false);
        }

    };

    const sendTyped = async () => {
        const text = input.trim();
        if (!text) return;
        addMessage("user", text);
        setInput("");
        await processPrompt(text);
    };

    return (
        <div className="relative min-h-screen md:pr-72 bg-gradient-to-b from-[#0f0b06] to-[#1a140c] text-white">
            <Navbar />
            {/* Header */}
            <div className="max-w-4xl mx-auto px-4 pt-8">
                <motion.h1
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl font-serif text-gold mb-2 flex items-center gap-3"
                >
                    <FaRobot className="text-[#E86A33]" /> Grouply Voice Assistant
                </motion.h1>
                <p className="text-sm text-[#e6d4b5] mb-4">Ask about spending, budgets, or tips. Use the mic for hands‑free chat.</p>
            </div>

            {/* Chat Card */}
            <div className="max-w-4xl mx-auto px-4 pb-10">
                <div className="rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.35)] bg-[#20160b]/80 backdrop-blur border border-[#3a2a17]">
                    {/* messages */}
                    <div className="h-[60vh] md:h-[65vh] overflow-y-auto p-4 space-y-3">
                        {messages.length === 0 && (
                            <div className="text-center text-[#cbb693] pt-10">Try asking “How did my expenses change this month?”</div>
                        )}
                        {messages.map((m, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[80%] px-4 py-3 rounded-2xl leading-relaxed text-[15px] ${m.sender === "user"
                                        ? "bg-[#E86A33] text-black rounded-br-none"
                                        : "bg-[#1a1208] text-white border border-[#3a2a17] rounded-bl-none"
                                        }`}
                                >
                                    <div className="flex items-center gap-2 mb-1 text-[13px] opacity-80">
                                        {m.sender === "user" ? <FaUser /> : <FaRobot />}
                                        <span>{m.sender === "user" ? "You" : "Assistant"}</span>
                                    </div>
                                    {m.sender === 'bot' && m.html ? (
                                        <div
                                            className="prose prose-invert max-w-none text-[15px] [&_*]:text-inherit [&_ul]:pl-5 [&_ul]:list-disc [&_p]:mb-2"
                                            dangerouslySetInnerHTML={{ __html: m.html }}
                                        />
                                    ) : (
                                        m.text
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* controls */}
                    <div className="p-4 border-t border-[#3a2a17] bg-[#1a1208]/60">
                        {supportMsg && (
                            <div className="text-xs text-[#ffb4a6] mb-2">{supportMsg}</div>
                        )}

                        <div className="flex items-center gap-2">
                            <button
                                onClick={isListening ? stopListening : startListening}
                                className={`shrink-0 w-12 h-12 rounded-full grid place-items-center text-xl transition-colors ${isListening ? "bg-red-500" : "bg-[#E86A33]"
                                    }`}
                                title={isListening ? "Stop listening" : "Start voice"}
                            >
                                <FaMicrophone />
                            </button>

                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <input
                                        className="flex-1 h-12 rounded-xl bg-[#2a2015] border border-[#3a2a17] px-4 text-sm outline-none placeholder:text-[#bda689]"
                                        placeholder="Type your question..."
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && sendTyped()}
                                    />
                                    <button
                                        onClick={sendTyped}
                                        disabled={loading || !input.trim()}
                                        className="shrink-0 h-12 px-4 rounded-xl bg-[#E86A33] text-black font-medium disabled:opacity-60 grid place-items-center"
                                        title="Send"
                                    >
                                        <FaPaperPlane />
                                    </button>
                                    <button
                                        onClick={() => speak(messages.filter(m => m.sender === 'bot').slice(-1)[0]?.text || '')}
                                        className="shrink-0 h-12 w-12 rounded-xl bg-[#2a2015] border border-[#3a2a17] grid place-items-center"
                                        title="Speak last reply"
                                    >
                                        <FaVolumeUp />
                                    </button>
                                </div>
                                {isListening && (
                                    <div className="mt-2 flex items-center gap-2 text-xs text-[#e6d4b5]">
                                        <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Listening… speak now
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
