const express = require("express");
const { user, transaction, bill } = require("../db");

const router = express.Router();

// Simple rule-based AI handler
router.post("/command", async (req, res) => {
  try {
    const { text, userEmail } = req.body;
    if (!text || !userEmail)
      return res.status(400).json({ error: "Missing text or userEmail" });

    const lower = text.toLowerCase();
    let response = "Sorry, I didn’t understand that.";

    // --- Show balance ---
    if (lower.includes("balance")) {
      const u = await user.findOne({ email: userEmail });
      response = u ? `Your current balance is ₹${u.balance}.` : "User not found.";
    }

    // --- Send money ---
    else if (lower.includes("send") && lower.includes("to")) {
      const match = lower.match(/send\s*₹?(\d+)\s*to\s*(\S+)/);
      if (match) {
        const amount = parseFloat(match[1]);
        const recipientEmail = match[2] + "@gmail.com"; // simple guess
        const sender = await user.findOne({ email: userEmail });
        const recipient = await user.findOne({ email: recipientEmail });

        if (!sender || !recipient)
          response = "Couldn’t find either you or the recipient.";
        else if (sender.balance < amount)
          response = "Insufficient balance.";
        else {
          sender.balance -= amount;
          recipient.balance += amount;
          await sender.save();
          await recipient.save();

          const txn = new transaction({
            senderId: sender._id,
            receiverId: recipient._id,
            amount,
            note: "Voice Transfer",
            status: "SUCCESS",
            timestamp: new Date()
          });
          await txn.save();
          response = `₹${amount} sent successfully to ${recipient.email}!`;
        }
      }
    }

    // --- Show transactions ---
    else if (lower.includes("transactions") || lower.includes("history")) {
      const txns = await transaction.find({ senderEmail: userEmail }).sort({ timestamp: -1 }).limit(3);
      if (txns.length === 0) response = "You have no recent transactions.";
      else {
        const summary = txns.map(t => `• ₹${t.amount} to ${t.receiverId}`).join("\n");
        response = `Here are your last transactions:\n${summary}`;
      }
    }

    res.json({ message: response });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI processing error" });
  }
});

module.exports = router;
