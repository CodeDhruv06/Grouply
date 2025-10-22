// backend/Routes/split.js
const express = require('express');
const router = express.Router();
const {Group} = require('../db');
const {Bill} = require('../db');
const { user, transaction } = require('../db'); // your existing db exports

// Helper: get user by email, required for bootstrap
async function findUsersByEmails(emails) {
  const users = await user.find({ email: { $in: emails.map(e => e.toLowerCase().trim()) }});
  return users;
}

// GET my groups for a given user email
// /split/my-groups?email=user@example.com
router.get('/my-groups', async (req, res) => {
  try {
    const email = (req.query.email || '').toString().toLowerCase().trim();
    if (!email) return res.status(400).json({ error: 'email query is required' });

    // Try to find the user (to include groups they created)
    const me = await user.findOne({ email });

    const query = me
      ? { $or: [ { 'members.email': email }, { createdBy: me._id } ] }
      : { 'members.email': email };

    const groups = await Group.find(query).sort({ createdAt: -1 });
    return res.json({ groups });
  } catch (err) {
    console.error('Get my-groups error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST create group
// body: { name, memberEmails: ["a@x.com", "b@x.com"], createdByEmail }
router.post('/create-group', async (req, res) => {
  try {
    const { name, memberEmails = [], createdByEmail } = req.body;
    if (!name || !memberEmails.length || !createdByEmail) return res.status(400).json({ error: 'Missing fields' });

    const foundUsers = await findUsersByEmails(memberEmails.concat([createdByEmail]));
    if (foundUsers.length < memberEmails.length + 1) {
      // Not all users found
      const foundEmails = foundUsers.map(u => u.email);
      const missing = memberEmails.concat([createdByEmail]).filter(e => !foundEmails.includes(e.toLowerCase()));
      return res.status(404).json({ error: 'Some users not registered', missing });
    }

    const members = foundUsers.map(u => ({ userId: u._id, email: u.email, name: u.name }));

    // ensure createdBy exists as a user object
    const createdBy = foundUsers.find(u => u.email.toLowerCase() === createdByEmail.toLowerCase());

    const group = new Group({
      name,
      members,
      createdBy: createdBy._id
    });

    await group.save();
    res.json({ message: 'Group created', group });
  } catch (err) {
    console.error('Create Group error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create bill
// body: {
//  groupId, title, totalAmount, payerEmail, splitType: "equal"|"custom",
//  customSplits: [{ email, amount }] (if custom)
// }
router.post('/create-bill', async (req, res) => {
  try {
    const { groupId, title, totalAmount, payerEmail, splitType = 'equal', customSplits = [], createdByEmail } = req.body;
    if (!groupId || !title || !totalAmount || !payerEmail || !createdByEmail) return res.status(400).json({ error: 'Missing fields' });

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    // gather members from group
    const members = group.members;
    // find payer user doc
    const payer = await user.findOne({ email: payerEmail.toLowerCase() });
    if (!payer) return res.status(404).json({ error: 'Payer not found' });

    // Build splits array
    let splits = [];
    if (splitType === 'equal') {
      const perPerson = Math.round((totalAmount / members.length) * 100) / 100; // round to 2 decimals
      splits = members.map(m => ({ userId: m.userId, email: m.email, owedAmount: perPerson, paidAmount: (m.email.toLowerCase() === payerEmail.toLowerCase()) ? totalAmount : 0 }));
      // adjust rounding difference to payer
      const sumOwed = splits.reduce((s, x) => s + x.owedAmount, 0);
      const diff = Math.round((totalAmount - sumOwed) * 100) / 100;
      if (diff !== 0) {
        const payerSplit = splits.find(s => s.email.toLowerCase() === payerEmail.toLowerCase());
        if (payerSplit) payerSplit.owedAmount += diff;
      }
    } else {
      // custom: customSplits should include all members
      // Validate custom splits sum == totalAmount
      const emailToMember = {};
      members.forEach(m => emailToMember[m.email.toLowerCase()] = m);
      const missing = customSplits.filter(c => !emailToMember[c.email.toLowerCase()]);
      if (missing.length) return res.status(400).json({ error: 'Custom splits include non-members', missing });
      const sumCustom = customSplits.reduce((s, c) => s + Number(c.amount), 0);
      if (Math.round(sumCustom * 100) / 100 !== Math.round(totalAmount * 100) / 100) {
        return res.status(400).json({ error: 'Custom splits do not sum to totalAmount' });
      }
      splits = customSplits.map(c => ({
        userId: emailToMember[c.email.toLowerCase()].userId,
        email: c.email.toLowerCase(),
        owedAmount: Number(c.amount),
        paidAmount: (c.email.toLowerCase() === payerEmail.toLowerCase()) ? Number(totalAmount) : 0
      }));
    }

    // Create bill
    const createdByUser = await user.findOne({ email: createdByEmail.toLowerCase() });
    const bill = new Bill({
      groupId,
      title,
      totalAmount,
      createdBy: createdByUser ? createdByUser._id : payer._id,
      payerId: payer._id,
      splits,
    });

    await bill.save();
    res.json({ message: 'Bill created', bill });
  } catch (err) {
    console.error('Create Bill error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET bills for a group
router.get('/group/:groupId/bills', async (req, res) => {
  try {
    const { groupId } = req.params;
    const bills = await Bill.find({ groupId }).sort({ createdAt: -1 });
    res.json({ bills });
  } catch (err) {
    console.error('Get bills error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /bill/:billId/settle
 * body: { execute: true|false, executorEmail }
 * If execute=true the endpoint will create transaction docs and update user balances.
 * Returns settlement plan: [ { fromEmail, toEmail, amount } ]
 */
router.post('/bill/:billId/settle', async (req, res) => {
  try {
    const { billId } = req.params;
    const { execute = false, executorEmail } = req.body;

    const bill = await Bill.findById(billId);
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    if (bill.status === 'SETTLED') return res.status(400).json({ error: 'Bill already settled' });

    // compute net per user: net = paidAmount - owedAmount
    const netMap = {}; // userId -> { email, net }
    bill.splits.forEach(s => {
      const uid = s.userId.toString();
      if (!netMap[uid]) netMap[uid] = { email: s.email, net: 0, userId: s.userId };
      netMap[uid].net += Number(s.paidAmount || 0) - Number(s.owedAmount || 0);
    });

    // build arrays of creditors and debtors
    const debtors = []; // owe money (net < 0)
    const creditors = []; // should receive money (net > 0)
    Object.values(netMap).forEach(n => {
      const amt = Math.round(n.net * 100) / 100;
      if (amt < -0.005) debtors.push({ userId: n.userId, email: n.email, amount: Math.abs(amt) });
      else if (amt > 0.005) creditors.push({ userId: n.userId, email: n.email, amount: amt });
    });

    // Greedy settlement: match largest creditor with largest debtor
    const settlements = [];
    // sort descending creditors, descending debtors (by amount)
    creditors.sort((a,b) => b.amount - a.amount);
    debtors.sort((a,b) => b.amount - a.amount);

    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const d = debtors[i];
      const c = creditors[j];
      const transfer = Math.min(d.amount, c.amount);
      // round to 2 decimals
      const t = Math.round(transfer * 100) / 100;
      if (t > 0) {
        settlements.push({
          fromUserId: d.userId,
          fromEmail: d.email,
          toUserId: c.userId,
          toEmail: c.email,
          amount: t
        });
        d.amount = Math.round((d.amount - t) * 100) / 100;
        c.amount = Math.round((c.amount - t) * 100) / 100;
      }
      if (d.amount <= 0.005) i++;
      if (c.amount <= 0.005) j++;
    }

    // if execute, create transaction documents and update balances
    if (execute) {
      for (const s of settlements) {
        // find users
        const sender = await user.findById(s.fromUserId);
        const receiver = await user.findById(s.toUserId);
        if (!sender || !receiver) {
          console.warn('Settlement user missing', s);
          continue;
        }

        // check sender balance, if insufficient skip (or allow negative if you want)
        if (sender.balance < s.amount) {
          // insufficient balance — skip or mark failed; here we skip and continue
          console.warn(`Insufficient balance for ${sender.email}, skipping settlement of ${s.amount}`);
          continue;
        }

        sender.balance = Math.round((sender.balance - s.amount) * 100) / 100;
        receiver.balance = Math.round((receiver.balance + s.amount) * 100) / 100;

        await sender.save();
        await receiver.save();

        const txn = new transaction({
          senderId: sender._id,
          receiverId: receiver._id,
          amount: s.amount,
          note: `Settlement for bill ${bill._id.toString()}`,
          status: 'SUCCESS',
          timestamp: new Date()
        });

        await txn.save();
      }

      // mark bill as settled
      bill.status = 'SETTLED';
      await bill.save();
    }

    res.json({ settlements, executed: !!execute });
  } catch (err) {
    console.error('Settle bill error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
