// src/Pages/SplitBill.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaUsers, FaReceipt, FaCoins, FaCheckCircle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

export default function SplitBill() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupName, setGroupName] = useState('');
  const [memberEmails, setMemberEmails] = useState('');
  const email = localStorage.getItem("userEmail");
  const [myEmail, setMyEmail] = useState(email);
  const [bills, setBills] = useState([]);
  const [title, setTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [payerEmail, setPayerEmail] = useState(myEmail);
  const [splitType, setSplitType] = useState('equal');
  const [customSplits, setCustomSplits] = useState([]);
  const [settlementPreview, setSettlementPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null); // ✅ new toast popup system

  // 🔔 Helper to show toast popup
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => { fetchGroups(); }, []);

  async function fetchGroups() {
    try {
      const res = await API.get(`/split/my-groups?email=${encodeURIComponent(myEmail)}`);
      const data = res.data;
      if (res.status === 200) {
        setGroups(data.groups || []);
        if ((data.groups || []).length) setSelectedGroup(data.groups[0]._id);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function createGroup(e) {
    e.preventDefault();
    if (!groupName || !memberEmails) return showToast('❌ Provide group name and member emails.', 'error');
    setLoading(true);
    try {
      const memberList = memberEmails.split(',').map(s => s.trim()).filter(Boolean);
      const res = await API.post('/split/create-group', {
        name: groupName,
        memberEmails: memberList,
        createdByEmail: myEmail,
      });
      const data = res.data;

      if (res.status === 200) {
        showToast('✅ Group created successfully!');
        setGroupName('');
        setMemberEmails('');
        fetchGroups();
      } else {
        showToast(data.error || 'Failed to create group', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('⚠️ Server error', 'error');
    }
    setLoading(false);
  }

  async function fetchBillsForSelectedGroup(gid) {
    if (!gid) return setBills([]);
    try {
      const res = await API.get(`/split/group/${gid}/bills`);
      const data = res.data;
      if (res.status === 200) setBills(data.bills || []);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    if (selectedGroup) fetchBillsForSelectedGroup(selectedGroup);
    else setBills([]);
  }, [selectedGroup]);

  useEffect(() => {
    if (splitType === 'custom' && selectedGroup) {
      const g = groups.find(g => g._id === selectedGroup);
      if (g) {
        setCustomSplits(g.members.map(m => ({ email: m.email, amount: 0 })));
      }
    } else {
      setCustomSplits([]);
    }
  }, [splitType, selectedGroup, groups]);

  async function createBill(e) {
    e.preventDefault();
    if (!selectedGroup || !title || !totalAmount || !payerEmail)
      return showToast('❌ Missing fields', 'error');

    setLoading(true);
    try {
      const payload = {
        groupId: selectedGroup,
        title,
        totalAmount: Number(totalAmount),
        payerEmail,
        splitType,
        createdByEmail: myEmail
      };
      if (splitType === 'custom') {
        payload.customSplits = customSplits.map(c => ({ email: c.email, amount: Number(c.amount) }));
      }
      const res = await API.post('/split/create-bill', payload);
      const data = res.data;
      if (res.status === 200) {
        showToast('✅ Bill created successfully!');
        setTitle('');
        setTotalAmount('');
        setPayerEmail(myEmail);
        setSplitType('equal');
        setCustomSplits([]);
        fetchBillsForSelectedGroup(selectedGroup);
      } else {
        showToast(data.error || 'Failed to create bill', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('⚠️ Server error', 'error');
    }
    setLoading(false);
  }

  async function previewSettlement(billId) {
    try {
      const res = await API.post(`/split/bill/${billId}/settle`, {
        execute: false,
      });
      const data = res.data;
      if (res.status === 200) {
        setSettlementPreview({ billId, settlements: data.settlements });
        showToast('👀 Settlement preview ready.');
      } else {
        showToast(data.error || 'Failed to get settlement', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('⚠️ Server error', 'error');
    }
  }

  async function executeSettlement(billId) {
    if (!confirm('Execute settlement now?')) return;
    setLoading(true);
    try {
      const res = await API.post(`/split/bill/${billId}/settle`, {
        execute: true,
        executorEmail: myEmail,
      });
      const data = res.data;
      if (res.status===200) {
        showToast('✅ Settlement executed successfully!');
        fetchBillsForSelectedGroup(selectedGroup);
        fetchGroups();
        setSettlementPreview(null);
      } else {
        showToast(data.error || 'Failed to execute settlement', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('⚠️ Server error', 'error');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f0b06] to-[#1a140c] text-white relative p-6">
      {/* 🔙 Back */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-2 text-gold hover:text-[#b8860b] transition"
        >
          <FaArrowLeft /> <span>Back to Home</span>
        </button>
      </div>

      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-serif font-semibold text-gold mb-6 flex items-center gap-3"
      >
        <FaUsers className="text-[#E86A33]" /> Smart Bill Splitting
      </motion.h1>

      {/* Create Group */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#20160b] rounded-2xl p-6 mb-6 shadow-lg"
      >
        <h2 className="font-medium text-xl mb-3 text-[#f7d58b] flex items-center gap-2">
          <FaCoins /> Create Group
        </h2>
        <form onSubmit={createGroup} className="space-y-3">
          <input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Group name"
            className="p-2 border border-[#3a2a17] bg-[#1a1208] text-white rounded w-full" />
          <input value={memberEmails} onChange={e => setMemberEmails(e.target.value)} placeholder="Member emails (comma separated)"
            className="p-2 border border-[#3a2a17] bg-[#1a1208] text-white rounded w-full" />
          <button disabled={loading}
            className="bg-[#E86A33] hover:bg-[#b85824] transition text-white px-4 py-2 rounded shadow-md">
            Create Group
          </button>
        </form>
      </motion.section>

      {/* Groups */}
      <section className="bg-[#20160b] rounded-2xl p-6 mb-6 shadow-lg">
        <h2 className="font-medium text-xl text-[#f7d58b]">Groups</h2>
        <select value={selectedGroup || ''} onChange={e => setSelectedGroup(e.target.value)}
          className="p-2 mt-3 border border-[#3a2a17] bg-[#1a1208] text-white rounded w-full">
          <option value="">-- Select group --</option>
          {groups.map(g => (
            <option key={g._id} value={g._id}>{g.name} ({g.members.length} members)</option>
          ))}
        </select>
      </section>

      {/* Bills */}
      {selectedGroup && (
        <>
          <section className="bg-[#20160b] rounded-2xl p-6 mb-6 shadow-lg">
            <h2 className="font-medium text-xl mb-3 text-[#f7d58b] flex items-center gap-2">
              <FaReceipt /> Create Bill
            </h2>
            <form onSubmit={createBill} className="space-y-3">
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Bill title"
                className="p-2 border border-[#3a2a17] bg-[#1a1208] text-white rounded w-full" />
              <input value={totalAmount} onChange={e => setTotalAmount(e.target.value)} placeholder="Total amount"
                className="p-2 border border-[#3a2a17] bg-[#1a1208] text-white rounded w-full" />
              <select value={payerEmail} onChange={e => setPayerEmail(e.target.value)}
                className="p-2 border border-[#3a2a17] bg-[#1a1208] text-white rounded w-full">
                {(groups.find(g => g._id === selectedGroup)?.members || []).map(m => (
                  <option key={m.email} value={m.email}>{m.name || m.email}</option>
                ))}
              </select>

              <div>
                <label className="block text-sm mb-1 text-[#c8a75a]">Split Type</label>
                <select value={splitType} onChange={e => setSplitType(e.target.value)}
                  className="p-2 border border-[#3a2a17] bg-[#1a1208] text-white rounded w-full">
                  <option value="equal">Equal</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {splitType === 'custom' && customSplits.map((c, idx) => (
                <div key={idx} className="flex gap-2">
                  <input className="p-2 border border-[#3a2a17] bg-[#1a1208] text-white rounded flex-1" value={c.email} disabled />
                  <input className="p-2 border border-[#3a2a17] bg-[#1a1208] text-white rounded w-32" value={c.amount}
                    onChange={e => {
                      const arr = [...customSplits]; arr[idx].amount = e.target.value; setCustomSplits(arr);
                    }} placeholder="amount" />
                </div>
              ))}

              <button disabled={loading}
                className="bg-[#0097B2] hover:bg-[#007b91] transition text-white px-4 py-2 rounded shadow-md">
                Create Bill
              </button>
            </form>
          </section>

          <section className="bg-[#20160b] rounded-2xl p-6 shadow-lg">
            <h2 className="font-medium text-xl mb-3 text-[#f7d58b]">Bills</h2>
            <div className="space-y-4">
              {bills.length === 0 && <div className="text-sm text-gray-400">No bills yet</div>}
              {bills.map(b => (
                <div key={b._id} className="p-4 bg-[#1a1208] border border-[#3a2a17] rounded-xl shadow">
                  <div className="flex justify-between">
                    <div>
                      <div className="font-semibold text-[#f7d58b]">{b.title}</div>
                      <div className="text-sm text-gray-400">Total: ₹{b.totalAmount}</div>
                      <div className="text-sm text-gray-400">Status: {b.status}</div>
                    </div>
                    {b.status !== 'SETTLED' && (
                      <div className="flex flex-col gap-2">
                        <button onClick={() => previewSettlement(b._id)}
                          className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-black rounded">Preview</button>
                        <button onClick={() => executeSettlement(b._id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded">Settle</button>
                      </div>
                    )}
                  </div>
                  <div className="mt-3">
                    <div className="text-sm font-medium text-[#c8a75a]">Splits:</div>
                    <ul className="text-sm">
                      {b.splits.map(s => (
                        <li key={s.email}>{s.email}: owes ₹{s.owedAmount}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {settlementPreview && (
            <section className="mt-4 p-4 bg-[#1a1208] border border-[#3a2a17] rounded-xl shadow">
              <h3 className="font-medium text-[#f7d58b] mb-2">
                Settlement Preview (bill {settlementPreview.billId})
              </h3>
              <ul>
                {settlementPreview.settlements.length === 0 && (
                  <li>No settlements required — balances are even.</li>
                )}
                {settlementPreview.settlements.map((s, idx) => (
                  <li key={idx}>{s.fromEmail} → {s.toEmail}: ₹{s.amount}</li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {/* ✅ Toast Popup */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 px-5 py-3 rounded-full shadow-lg text-white flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'
              }`}
          >
            <FaCheckCircle />
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
