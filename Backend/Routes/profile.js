const express = require("express");
const QRCode = require("qrcode");
const { user, transaction } = require("../db");

const router = express.Router();

// ✅ Get profile data + QR code
router.get("/:email", async (req, res) => {
    try {
        const { email } = req.params;
        const u = await user.findOne({ email });
        if (!u) return res.status(404).json({ error: "User not found" });

        const qrUrl = `https://yourdomain.com/pay/${u.qrCodeId}`; // link that allows payment
        const qrDataUrl = await QRCode.toDataURL(qrUrl);

        res.json({
            name: u.name,
            email: u.email,
            balance: u.balance,
            tapLinkId: u.tapLinkId,
            financeScore: u.financeScore,
            qrCode: qrDataUrl,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// ✅ Handle payment via QR link
router.post("/pay/:qrCodeId", async (req, res) => {
    try {
        const { qrCodeId } = req.params;
        const { senderEmail, amount, note } = req.body;

        const sender = await user.findOne({ email: senderEmail });
        const receiver = await user.findOne({ qrCodeId });

        if (!sender || !receiver) return res.status(404).json({ error: "User not found" });
        if (sender.balance < amount) return res.status(400).json({ error: "Insufficient balance" });

        sender.balance -= amount;
        receiver.balance += amount;
        await sender.save();
        await receiver.save();

        const txn = await transaction.create({
            senderId: sender._id,
            receiverId: receiver._id,
            amount,
            note,
            status: "SUCCESS",
        });

        res.json({ message: "Payment successful", transaction: txn });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Payment failed" });
    }
});
// ✅ Get receiver info via QR ID
router.get("/receiver/:qrCodeId", async (req, res) => {
    try {
        const { qrCodeId } = req.params;
        const u = await user.findOne({ qrCodeId });
        if (!u) return res.status(404).json({ error: "User not found" });

        res.json({ name: u.name, email: u.email });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});


module.exports = router;
