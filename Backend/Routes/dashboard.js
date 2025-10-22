// routes/dashboard.js
const express = require("express");
const router = express.Router();
const { user, transaction } = require("../db");

router.get("/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const currentUser = await user.findOne({ email });
    if (!currentUser) return res.status(404).json({ error: "User not found" });

    // Filter only this month's expenses (outgoing)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const txns = await transaction.find({
      senderId: currentUser._id,
      timestamp: { $gte: startOfMonth },
      status: "SUCCESS",
    });

    const spentThisMonth = txns.reduce((acc, t) => acc + t.amount, 0);
    const cashbackThisMonth = txns.reduce((acc, t) => acc + (t.cashbackAmount || 0), 0);

    // Group by category (from "note" field)
    const categoryData = {};
    txns.forEach((t) => {
      const cat = t.note?.trim() || "Other";
      categoryData[cat] = (categoryData[cat] || 0) + t.amount;
    });

    // Prepare trend data (group by date) and ensure chronological order
    const trend = {};
    txns.forEach((t) => {
      const d = new Date(t.timestamp);
      const label = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      const key = d.toISOString().split("T")[0]; // YYYY-MM-DD for sorting
      if (!trend[key]) trend[key] = { date: d, label, spent: 0 };
      trend[key].spent += t.amount;
    });

    const trendData = Object.values(trend)
      .sort((a, b) => a.date - b.date)
      .map(({ label, spent }) => ({ month: label, spent }));

    res.json({
      balance: currentUser.balance,
      cashbackBalance: currentUser.cashbackBalance || 0,
      spentThisMonth,
      cashbackThisMonth,
      savedThisMonth: Math.max(0, currentUser.balance - spentThisMonth) + cashbackThisMonth,
      categoryData,
      trendData,
    });
  } catch (err) {
    console.error("Dashboard Fetch Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
