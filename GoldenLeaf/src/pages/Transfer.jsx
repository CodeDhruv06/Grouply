import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaArrowCircleUp, FaCheckCircle } from "react-icons/fa";
import Loader from "../Components/Loader";
import { useNavigate } from 'react-router-dom';
import API from "../api";

export default function Transfer() {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 🔹 For demo: hardcode sender (in real app, get from logged-in user context)
  const senderEmail = localStorage.getItem("userEmail"); // replace with real logged-in user email

  const handleTransfer = async () => {
    if (!recipient || !amount) {
      setStatus("❌ Please fill all fields.");
      return;
    }

    setLoading(true);
    setStatus("Processing transaction...");

    try {
      const res = await API.post('/payments/send', {
        senderEmail,
        recipientEmail: recipient,
        amount: parseFloat(amount),
        note,
      });

      const data = res.data;


      if (res.status === 200) {
        const cb = Number(data.cashback || 0);
        const cbMsg = cb > 0 ? ` You earned ₹${cb} cashback!` : "";
        setStatus(`✅ ${data.message}${cbMsg}`);
        setRecipient("");
        setAmount("");
        setNote("");
        // Redirect to home after a short success confirmation
        setTimeout(() => { navigate('/home') }, 2000);
      } else {
        setStatus(`❌ ${data.error || "Transaction failed"}`);
      }
    } catch (error) {
      console.error(error);
      setStatus("⚠️ Something went wrong. Try again later.");
    }

    setLoading(false);
  };

  if (loading) {
    return <Loader label="Processing your transfer..." />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-amber-50 to-orange-100 dark:from-[#0f0b06] dark:to-[#1a140c] text-gray-800 dark:text-white p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-[#20160b] rounded-2xl shadow-2xl p-8 w-full max-w-md"
      >
        <h1 className="text-3xl font-semibold text-center mb-6 text-amber-600 dark:text-gold">
          Instant Money Transfer
        </h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">
              Recipient Email
            </label>
            <input
              type="email"
              placeholder="example@email.com"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full p-3 rounded-lg bg-amber-50 dark:bg-[#2a2015] border border-amber-300 focus:ring-2 focus:ring-gold outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">
              Amount (₹)
            </label>
            <input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-3 rounded-lg bg-amber-50 dark:bg-[#2a2015] border border-amber-300 focus:ring-2 focus:ring-gold outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">
              Note (optional)
            </label>
            <input
              type="text"
              placeholder="For dinner, rent, etc."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-3 rounded-lg bg-amber-50 dark:bg-[#2a2015] border border-amber-300 focus:ring-2 focus:ring-gold outline-none"
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            disabled={loading}
            onClick={handleTransfer}
            className="w-full bg-gold text-black font-semibold py-3 rounded-xl mt-4 flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? (
              "Processing..."
            ) : (
              <>
                <FaArrowCircleUp /> Send Money
              </>
            )}
          </motion.button>
        </div>

        {status && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-center font-medium text-sm"
          >
            {status}
          </motion.p>
        )}
      </motion.div>

      {/* ✅ Success Toast */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: status.includes("✅") ? 1 : 0 }}
        transition={{ duration: 0.4 }}
        className="fixed bottom-10 flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-full shadow-lg"
      >
        <FaCheckCircle /> Transfer Successful
      </motion.div>
    </div>
  );
}
