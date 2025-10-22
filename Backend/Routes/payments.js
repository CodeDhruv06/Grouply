// backend/Routes/payments.js
const express = require("express");
const { transaction, user } = require("../db");

const router = express.Router();

// ✅ POST /api/v1/payments/send
router.post("/send", async (req, res) => {
  try {
    const { senderEmail, recipientEmail, amount, note } = req.body;

    if (!senderEmail || !recipientEmail || !amount)
      return res.status(400).json({ error: "Missing required fields" });

    const sender = await user.findOne({ email: senderEmail });
    const recipient = await user.findOne({ email: recipientEmail });

    if (!sender) return res.status(404).json({ error: "Sender not found" });
    if (!recipient) return res.status(404).json({ error: "Recipient not found" });

    if (sender.balance < amount)
      return res.status(400).json({ error: "Insufficient balance" });

    // Perform transaction
    sender.balance -= amount;
    recipient.balance += amount;

    await sender.save();
    await recipient.save();

    // 🎁 Cashback calculation rules (simple example)
    // - Base 1% cashback on spends >= ₹100
    // - Category boost: if note includes "Food" -> 2%
    // - Per-transaction cap ₹200
    const RULES = {
      basePct: 0.01,
      categoryBoosts: [
        { match: /food|dining|swiggy|zomato/i, pct: 0.02, id: "FOOD_2" },
      ],
      minAmount: 100,
      perTxnCap: 200,
    };

    let appliedRule = "BASE_1";
    let pct = RULES.basePct;
    if (typeof note === "string") {
      for (const r of RULES.categoryBoosts) {
        if (r.match.test(note)) { pct = r.pct; appliedRule = r.id; break; }
      }
    }
    let cashbackAmt = 0;
    if (amount >= RULES.minAmount) {
      cashbackAmt = Math.min(Math.round(amount * pct), RULES.perTxnCap);
    }

    // Record transaction with cashback
    const txn = new transaction({
      senderId: sender._id,
      receiverId: recipient._id,
      amount,
      note,
      status: "SUCCESS",
      timestamp: new Date(),
      cashbackAmount: cashbackAmt,
      cashbackRule: cashbackAmt > 0 ? appliedRule : undefined,
    });

    await txn.save();

    // Credit cashback to sender's cashback wallet (separate from spendable balance)
    if (cashbackAmt > 0) {
      sender.cashbackBalance = (sender.cashbackBalance || 0) + cashbackAmt;
      await sender.save();
    }

    res.json({
      message: `₹${amount} sent to ${recipient.email} successfully!`,
      transaction: txn,
      cashback: cashbackAmt,
      rule: txn.cashbackRule || null,
      balances: {
        sender: { balance: sender.balance, cashbackBalance: sender.cashbackBalance || 0 },
        recipient: { balance: recipient.balance },
      },
    });
  } catch (error) {
    console.error("💥 Payment Error:", error);
    res.status(500).json({ error: "Server error during transaction" });
  }
});

module.exports = router;
