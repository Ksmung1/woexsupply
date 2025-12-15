// src/pages/Wallet.jsx
import React, { useState, useEffect, useMemo } from "react";
import * as RW from "react-window";
import { FaCheckCircle, FaHourglassHalf, FaTimesCircle, FaPlus, FaWallet, FaSearch, FaRupeeSign, FaUser } from "react-icons/fa";
import { useUser } from "../context/UserContext";
import { useAlert } from "../context/AlertContext";
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
    <div 
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 relative">
          <h3 className="text-xl font-bold text-white pr-8">{title}</h3>
          <button 
            onClick={onClose} 
            className="absolute right-4 top-4 text-white hover:text-gray-200 transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <div>{children}</div>
          {footer && <div className="mt-6">{footer}</div>}
        </div>
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

  // Fetch topup transactions from topups collection
  useEffect(() => {
    if (!uid) return;

    // Query topups collection for user's topup orders
    const topupsRef = collection(db, "topups");
    const q = query(
      topupsRef,
      where("uid", "==", uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const fetched = snapshot.docs.map((d) => {
            const raw = d.data() || {};
            const date = raw.date || "";
            const time = raw.time || "";
            const amount = Number(raw.amount ?? raw.cost ?? raw.price ?? 0);
            const createdAt = raw.createdAt 
              ? (raw.createdAt.toMillis ? raw.createdAt.toMillis() : (typeof raw.createdAt === 'number' ? raw.createdAt : Date.now()))
              : Date.now();
            return {
              id: raw.id || d.id,
              docId: d.id,
              status: (raw.status || "unknown").toString().toLowerCase(),
              amount,
              date,
              time,
              utr: raw.utr || raw.transactionId || null,
              raw,
              createdAt,
            };
          });

          // Sort by createdAt descending (client-side to avoid index issues)
          fetched.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

          setTransactions(fetched);
        } catch (err) {
          console.error("Error processing transactions:", err);
          setTransactions([]);
        }
      },
      (err) => {
        console.error("Topups snapshot error:", err);
        // Fallback: try without orderBy if index is missing
        if (err.code === 'failed-precondition') {
          console.warn("Firestore index may be missing. Transactions will load without server-side sorting.");
        }
        setTransactions([]);
      }
    );

    return () => {
      try { unsubscribe && unsubscribe(); } catch (e) {}
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

  const { showError, showSuccess, showWarning } = useAlert();

  // top-up flow
  const handleStartTopup = (e) => {
    e?.preventDefault();
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      showError("Please enter a valid amount");
      return;
    }
    if (parsed >= 20000) {
      showWarning("Maximum top-up limit is ₹19,999");
      return;
    }
    const { date, time } = getLocalParts();
    const order = {
      uid: uid,
      username: user?.name || user?.email || user?.uid || "User",
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
      const paymentUrl = import.meta.env.VITE_PAYMENT_URL || import.meta.env.VITE_BACKEND_URL;
      const { data } = await axios.post(`${paymentUrl}/topup-coin`, orderToCreate);
      if (!data?.success) {
        showError(data?.message || "Top-up failed");
        return;
      }
      if (data.payment_url) {
        showSuccess("Redirecting to payment gateway...");
        setTimeout(() => {
          window.location.href = data.payment_url;
        }, 500);
      } else {
        showError("Payment URL missing from server response");
      }
    } catch (err) {
      console.error("Topup error:", err);
      showError(err?.response?.data?.message || err?.message || "Top-up failed");
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
      <div style={style} className="px-3 py-2">
        <div
          className="grid grid-cols-3 items-center gap-4 p-4 rounded-xl bg-white border border-gray-100 cursor-pointer hover:border-purple-300 hover:shadow-lg transition-all duration-200 group"
          onClick={() => setSelectedTx(t)}
        >
          <div className="flex flex-col">
            <div className={`font-bold text-sm ${statusColor(t.status)} mb-1`}>
              {t.id || "Top-up"}
            </div>
            <div className="text-xs text-gray-500">{t.date} {t.time}</div>
          </div>
          <div className="text-xs font-mono text-gray-600 truncate" title={t.utr || "-"}>
            {t.utr || "No UTR"}
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-2">
              <span className="text-lg">{statusIcon(t.status)}</span>
              <div className="font-bold text-lg text-gray-800">
                ₹{t.amount?.toFixed?.(2) ?? t.amount}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-indigo-50/30">
      <div className="px-4 md:px-8 lg:px-16 xl:px-32 py-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <FaWallet className="text-purple-600" />
            Wallet
          </h1>
          <p className="text-gray-600">Manage your balance and view transaction history</p>
        </div>

        {!uid && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-8 md:p-12 text-center border-2 border-purple-200 shadow-xl">
            <FaWallet className="text-5xl md:text-6xl text-purple-600 mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Sign in to view your wallet</h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Create an account or sign in to manage your balance, view transaction history, and top up your wallet.
            </p>
            <p className="text-sm text-gray-500">Use the floating login button to get started!</p>
          </div>
        )}

        {uid && (
          <>

        {/* Balance Card */}
        <div className="max-w-2xl mb-8">
          <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-700 text-white rounded-3xl p-8 shadow-2xl transform hover:scale-[1.02] transition-transform duration-300">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm md:text-base opacity-90 mb-3 font-medium">Available Balance</div>
                <div className="flex items-baseline gap-3 mb-4">
                  <div className="text-4xl md:text-5xl font-bold">₹{parseFloat(user?.balance || 0).toFixed(2)}</div>
                  <img src={coinImg} alt="coin" className="w-12 h-12 md:w-14 md:h-14 opacity-90" />
                </div>
                <div className="text-sm opacity-75">Your wallet balance is ready to use</div>
              </div>
              <button
                onClick={() => setShowTopupModal(true)}
                className="bg-white text-purple-600 px-6 py-3 rounded-full font-bold shadow-xl hover:shadow-2xl hover:bg-purple-50 transition-all duration-200 flex items-center gap-2 text-sm md:text-base"
              >
                <FaPlus className="text-lg" /> Add Balance
              </button>
            </div>
          </div>
        </div>

        {/* Transactions Section */}
        <div className="max-w-6xl">
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
                <FaWallet className="text-purple-600" />
                Top-up History
              </h2>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by ID, UTR, or status..."
                  className="pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all w-full md:w-80"
                />
              </div>
            </div>

            {filtered.length > 0 ? (
              <div className="rounded-xl overflow-hidden border border-gray-100">
                <ListComponent height={500} itemCount={filtered.length} itemSize={100} width="100%">
                  {Row}
                </ListComponent>
              </div>
            ) : (
              <div className="py-20 text-center">
                <FaWallet className="mx-auto text-6xl text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg font-medium">No top-up transactions found</p>
                <p className="text-gray-400 text-sm mt-2">Start by adding balance to your wallet</p>
              </div>
            )}
          </div>
        </div>
          </>
        )}
      </div>

      {uid && (
        <>
      <Modal open={showTopupModal} onClose={() => setShowTopupModal(false)} title="Top Up Wallet" footer={null}>
        <form onSubmit={(e) => { e.preventDefault(); handleStartTopup(e); }}>
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Enter Amount
            </label>
            <div className="relative">
              <FaRupeeSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
              <input
                type="number"
                min="1"
                max="19999"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full pl-10 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all text-lg font-semibold"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">Minimum: ₹1 | Maximum: ₹19,999</p>
          </div>
          <div className="flex gap-3">
            <button 
              type="button" 
              onClick={() => setShowTopupModal(false)} 
              className="flex-1 px-4 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 font-semibold text-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all"
            >
              Continue to Payment
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm Top-Up"
        footer={
          <div className="flex justify-end gap-3">
            <button 
              onClick={() => setConfirmOpen(false)} 
              className="px-6 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 font-semibold text-gray-700 transition-colors"
              disabled={loadingPayment}
            >
              Cancel
            </button>
            <button 
              onClick={confirmTopup} 
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
              disabled={loadingPayment}
            >
              {loadingPayment ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span> Processing...
                </span>
              ) : (
                "Confirm & Pay"
              )}
            </button>
          </div>
        }
      >
        <div className="text-center py-4">
          <div className="mb-4">
            <div className="text-4xl font-bold text-purple-600 mb-2">₹{orderToCreate?.amount?.toFixed(2)}</div>
            <p className="text-sm text-gray-600">You will be redirected to complete the payment securely.</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 mt-4">
            <p className="text-xs text-gray-600">
              <strong>Note:</strong> After payment, your balance will be updated automatically.
            </p>
          </div>
        </div>
      </Modal>

      {selectedTx && (
        <Modal open={!!selectedTx} onClose={() => setSelectedTx(null)} title="Transaction Details">
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <span className="text-sm font-semibold text-gray-600">Order ID</span>
                <span className="text-sm font-mono font-bold text-gray-800">{selectedTx.id}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <span className="text-sm font-semibold text-gray-600">Amount</span>
                <span className="text-lg font-bold text-purple-600">₹{selectedTx.amount?.toFixed?.(2) ?? selectedTx.amount}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <span className="text-sm font-semibold text-gray-600">Status</span>
                <div className="flex items-center gap-2">
                  {statusIcon(selectedTx.status)}
                  <span className={`text-sm font-semibold capitalize ${statusColor(selectedTx.status)}`}>
                    {selectedTx.status}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <span className="text-sm font-semibold text-gray-600">Date & Time</span>
                <span className="text-sm text-gray-800">{selectedTx.date} {selectedTx.time}</span>
              </div>
              {selectedTx.utr && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-600">UTR</span>
                  <span className="text-xs font-mono text-gray-700 break-all text-right max-w-[60%]">{selectedTx.utr}</span>
                </div>
              )}
            </div>
            <div className="flex justify-end pt-2">
              <button 
                onClick={() => setSelectedTx(null)} 
                className="px-6 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 font-semibold text-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
        </>
      )}
    </div>
  );
};

export default Wallet;
