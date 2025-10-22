import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { FaPaperPlane, FaUser, FaRupeeSign } from "react-icons/fa";

export default function PayPage() {
    const { qrCodeId } = useParams();
    const [receiver, setReceiver] = useState(null);
    const [amount, setAmount] = useState("");
    const [note, setNote] = useState("");
    const [senderEmail, setSenderEmail] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchReceiver();
    }, []);

    async function fetchReceiver() {
        try {
            const res = await API.get(`/profile/receiver/${qrCodeId}`);
            const data = res.data;
            if (res.ok) setReceiver(data);
            else setMessage("Invalid or expired payment link");
        } catch {
            setMessage("Error fetching receiver info");
        }
    }

    async function handlePayment() {
        if (!senderEmail || !amount) {
            setMessage("Please enter all required fields");
            return;
        }

        setLoading(true);
        setMessage("");

        try {
            const res = await API.post(`/profile/pay/${qrCodeId}`, {
                senderEmail,
                amount,
                note,
            });
            const data = res.data;

            if (res.ok) {
                setMessage(`✅ Payment Successful! ₹${amount} sent to ${receiver.name}`);
                setAmount("");
                setNote("");
            } else {
                setMessage(`❌ ${data.error}`);
            }
        } catch {
            setMessage("Payment failed due to network error");
        } finally {
            setLoading(false);
        }
    }

    if (!receiver)
        return (
            <div className="h-screen flex items-center justify-center text-gray-400 bg-[#0f0b06]">
                Loading receiver info...
            </div>
        );

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0f0b06] to-[#1a140c] text-white flex flex-col items-center justify-center p-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#20160b] p-8 rounded-3xl shadow-2xl w-full max-w-md"
            >
                <h2 className="text-2xl font-bold mb-2 text-center text-gold">Send Money</h2>
                <p className="text-center text-gray-400 mb-6">
                    Paying <span className="font-semibold text-[#f7d58b]">{receiver.name}</span> ({receiver.email})
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm text-gray-400 mb-1 block">Your Email</label>
                        <div className="flex items-center bg-[#2a1c10] p-3 rounded-xl">
                            <FaUser className="text-gray-400 mr-2" />
                            <input
                                type="email"
                                value={senderEmail}
                                onChange={(e) => setSenderEmail(e.target.value)}
                                className="bg-transparent w-full outline-none text-white"
                                placeholder="you@example.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm text-gray-400 mb-1 block">Amount (₹)</label>
                        <div className="flex items-center bg-[#2a1c10] p-3 rounded-xl">
                            <FaRupeeSign className="text-gray-400 mr-2" />
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="bg-transparent w-full outline-none text-white"
                                placeholder="Enter amount"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm text-gray-400 mb-1 block">Note (optional)</label>
                        <input
                            type="text"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="bg-[#2a1c10] p-3 rounded-xl w-full outline-none text-white"
                            placeholder="For lunch, rent, etc."
                        />
                    </div>

                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        disabled={loading}
                        onClick={handlePayment}
                        className="w-full bg-gradient-to-r from-[#E86A33] to-[#b75a2a] py-3 rounded-xl mt-4 font-semibold shadow-lg hover:opacity-90"
                    >
                        {loading ? "Processing..." : (
                            <span className="flex items-center justify-center gap-2">
                                <FaPaperPlane /> Send Money
                            </span>
                        )}
                    </motion.button>
                </div>

                {message && (
                    <p className={`text-center mt-4 ${message.includes("✅") ? "text-green-400" : "text-red-400"}`}>
                        {message}
                    </p>
                )}
            </motion.div>
        </div>
    );
}
