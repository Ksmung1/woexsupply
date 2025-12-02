// src/pages/Wallet.jsx
import React, { useState, useEffect, useMemo } from "react";
import * as RW from "react-window";
import { FaCheckCircle, FaHourglassHalf, FaTimesCircle, FaPlus } from "react-icons/fa";
import { useUser } from "../context/UserContext";
import { collection, query, where, orderBy, onSnapshot, doc as docRef, getDoc, onSnapshot as onDocSnapshot } from "firebase/firestore";
import { db } from "../config/firebase";
import axios from "axios";
import coinImg from "../assets/images/topup.png";

// react-window fallback
const FixedSizeList =
  RW.FixedSizeList ??
  (RW.default && RW.default.FixedSizeList) ??
  RW.default ??
  null;

let ListComponent;
if (FixedSizeList) {
  ListComponent = FixedSizeList;
} else {
  ListComponent = ({ height, itemCount, itemSize, width, children }) => {
    return (
      <div style={{ width, height, overflow: "auto" }}>
        {Array.from({ length: itemCount }).map((_, i) => (
          <div key={i} style={{ height: itemSize }}>
            {typeof children === "function" ? children({ index: i, style: {} }) : children}
          </div>
        ))}
      </div>
    );
  };
}

const Modal = ({ open, onClose, title, children, footer }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-xl">×</button>
        <h3 className="text-xl font-semibold mb-4">{title}</h3>
        <div>{children}</div>
        {footer && <div className="mt-6">{footer}</div>}
      </div>
    </div>
  );
};

const Wallet = () => {
  const { user } = useUser();
  const uid = user?.uid;

  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState("");
  const [search, setSearch] = useState("");
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [orderToCreate, setOrderToCreate] = useState(null);
  const [selectedTx, setSelectedTx] = useState(null);

  const getLocalParts = () => {
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, "0");
    let h = now.getHours();
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    const time = `${pad(h)}:${pad(now.getMinutes())}:${pad(now.getSeconds())} ${ampm}`;
    const date = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}`;
    return { date, time };
  };

  // NEW: listen to users/{uid} topups array and fetch matching docs from topups collection
  useEffect(() => {
    if (!uid) return;

    // subscribe to user doc so UI updates when user's topup array changes
    const userDocRef = docRef(db, "users", uid);
    const unsubscribeUser = onDocSnapshot(userDocRef, async (snap) => {
      try {
        const data = snap.data() || {};
        const topupIds = Array.isArray(data.topups) ? data.topups.filter(Boolean) : [];

        if (topupIds.length === 0) {
          setTransactions([]);
          return;
        }

        // fetch each topup doc (you can change "topups" to your collection name)
        const fetchPromises = topupIds.map(async (id) => {
          try {
            const d = await getDoc(docRef(db, "topups", id));
            if (!d.exists()) return null;
            const raw = d.data() || {};
            const date = raw.date || "";
            const time = raw.time || "";
            const amount = Number(raw.amount ?? raw.cost ?? raw.price ?? 0);
            return {
              id: raw.id || d.id,
              docId: d.id,
              status: (raw.status || "unknown").toString().toLowerCase(),
              amount,
              date,
              time,
              utr: raw.utr || raw.transactionId || null,
              raw,
              createdAt: raw.createdAt ? raw.createdAt.toMillis?.() ?? raw.createdAt : 0,
            };
          } catch (err) {
            console.warn("Failed to fetch topup", id, err);
            return null;
          }
        });

        const fetched = (await Promise.all(fetchPromises)).filter(Boolean);

        // sort by createdAt descending (fallback to date/time if createdAt absent)
        fetched.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        setTransactions(fetched);
      } catch (err) {
        console.error("Error resolving user topups:", err);
        setTransactions([]);
      }
    }, (err) => {
      console.error("user doc snapshot error:", err);
    });

    return () => {
      try { unsubscribeUser && unsubscribeUser(); } catch (e) {}
    };
  }, [uid]);

  // filtered transactions with search
  const filtered = useMemo(() => {
    const s = (search || "").trim().toLowerCase();
    if (!s) return transactions;
    return transactions.filter((t) =>
      [t.status, t.id, t.date, t.time, t.utr]
        .some((f) => (f || "").toString().toLowerCase().includes(s))
    );
  }, [search, transactions]);

  // top-up flow (unchanged)
  const handleStartTopup = (e) => {
    e?.preventDefault();
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      alert("Enter a valid amount");
      return;
    }
    if (parsed >= 20000) {
      alert("Maximum top-up limit is ₹19,999");
      return;
    }
    const { date, time } = getLocalParts();
    const order = {
      user,
      userId: user?.userId || user?.uid,
      amount: parsed,
      date,
      time,
    };
    setOrderToCreate(order);
    setConfirmOpen(true);
  };

  const confirmTopup = async () => {
    if (!orderToCreate) return;
    try {
      setLoadingPayment(true);
      const { data } = await axios.post(`${import.meta.env.VITE_PAYMENT_URL}/topup-coin`, orderToCreate);
      if (!data?.success) {
        alert(data?.message || "Top-up failed");
        return;
      }
      if (data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        alert("Payment URL missing from server response");
      }
    } catch (err) {
      console.error("Topup error:", err);
      alert(err?.response?.data?.message || err?.message || "Top-up failed");
    } finally {
      setLoadingPayment(false);
      setConfirmOpen(false);
      setShowTopupModal(false);
      setOrderToCreate(null);
      setAmount("");
    }
  };

  const statusIcon = (s) => {
    if (s === "completed") return <FaCheckCircle className="text-green-500" />;
    if (s === "pending") return <FaHourglassHalf className="text-yellow-500" />;
    return <FaTimesCircle className="text-red-500" />;
  };

  const statusColor = (s) => {
    if (s === "completed") return "text-green-700";
    if (s === "pending") return "text-yellow-700";
    return "text-red-700";
  };

  const Row = ({ index, style }) => {
    const t = filtered[index];
    if (!t) return null;
    return (
      <div style={style} className="p-2">
        <div
          className="grid grid-cols-3 items-center gap-2 p-3 rounded-lg bg-white shadow-sm cursor-pointer hover:shadow-md"
          onClick={() => setSelectedTx(t)}
        >
          <div>
            <div className={`font-semibold ${statusColor(t.status)}`}>{t.id || "Top-up"}</div>
            <div className="text-xs text-gray-500">{t.date} {t.time}</div>
          </div>
          <div className="text-xs font-mono text-gray-600">{t.utr || "-"}</div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-2">
              {statusIcon(t.status)}
              <div className="font-bold">₹{t.amount?.toFixed?.(2) ?? t.amount}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="px-4 md:px-20 lg:px-40 py-8 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-6">Wallet</h1>

      <div className="max-w-md bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl p-6 flex items-center justify-between shadow-lg mb-8">
        <div>
          <div className="text-sm opacity-90">Wallet Balance</div>
          <div className="flex items-center gap-4 mt-2">
            <div className="text-3xl font-bold">₹{parseFloat(user?.balance || 0).toFixed(2)}</div>
            <img src={coinImg} alt="coin" className="w-10 h-10" />
          </div>
        </div>
        <button
          onClick={() => setShowTopupModal(true)}
          className="bg-white text-purple-600 px-4 py-2 rounded-full font-semibold shadow"
        >
          <FaPlus /> Add Balance
        </button>
      </div>

      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Top-up History</h2>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by id / utr / status"
            className="px-3 py-2 border rounded-lg"
          />
        </div>

        {filtered.length > 0 ? (
          <div className="rounded-xl overflow-hidden shadow-sm bg-white">
            <ListComponent height={480} itemCount={filtered.length} itemSize={92} width="100%">
              {Row}
            </ListComponent>
          </div>
        ) : (
          <div className="py-20 text-center text-gray-500 bg-white rounded-xl shadow-sm">
            No top-up transactions found.
          </div>
        )}
      </div>

      <Modal open={showTopupModal} onClose={() => setShowTopupModal(false)} title="Top Up Wallet" footer={null}>
        <form onSubmit={(e) => { e.preventDefault(); handleStartTopup(e); }}>
          <input
            type="number"
            min="1"
            max="19999"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount (₹)"
            className="w-full p-3 border rounded-lg mb-4"
          />
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowTopupModal(false)} className="px-4 py-2 rounded-lg bg-gray-200">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white">Continue to Payment</button>
          </div>
        </form>
      </Modal>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm Top-Up"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setConfirmOpen(false)} className="px-4 py-2 rounded-lg bg-gray-200">Cancel</button>
            <button onClick={confirmTopup} className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white" disabled={loadingPayment}>
              {loadingPayment ? "Processing..." : "Confirm"}
            </button>
          </div>
        }
      >
        <div className="text-center">
          <p className="text-lg font-semibold">Add ₹{orderToCreate?.amount}</p>
          <p className="text-sm text-gray-600 mt-2">You will be redirected to complete the payment.</p>
        </div>
      </Modal>

      {selectedTx && (
        <Modal open={!!selectedTx} onClose={() => setSelectedTx(null)} title="Top-up Details">
          <div className="space-y-2">
            <p><strong>Order ID:</strong> {selectedTx.id}</p>
            <p><strong>Amount:</strong> ₹{selectedTx.amount}</p>
            <p><strong>Status:</strong> {selectedTx.status}</p>
            <p><strong>Date:</strong> {selectedTx.date} {selectedTx.time}</p>
            {selectedTx.utr && <p><strong>UTR:</strong> {selectedTx.utr}</p>}
            <div className="mt-4 flex justify-end">
              <button onClick={() => setSelectedTx(null)} className="px-4 py-2 rounded-lg bg-gray-200">Close</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Wallet;
