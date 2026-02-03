// src/pages/Wallet.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import * as RW from "react-window";
import {
  FaCheckCircle,
  FaHourglassHalf,
  FaTimesCircle,
  FaPlus,
  FaWallet,
  FaSearch,
  FaRupeeSign,
  FaUser,
  FaExternalLinkAlt,
  FaGift,
} from "react-icons/fa";
import { useUser } from "../context/UserContext";
import { useAlert } from "../context/AlertContext";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc as docRef,
  getDoc,
  onSnapshot as onDocSnapshot,
  runTransaction,
  getDocs,
  limit,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { db, auth } from "../config/firebase";
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
          <div
            key={i}
            className="border border-black"
            style={{ height: itemSize }}
          >
            {typeof children === "function"
              ? children({ index: i, style: {} })
              : children}
          </div>
        ))}
      </div>
    );
  };
}

const Modal = ({ open, onClose, title, children, footer, isDark }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`rounded-2xl max-w-4xl w-full mx-4 md:mx-auto shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh] ${isDark ? "bg-gray-800" : "bg-white"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 relative flex-shrink-0">
          <h3 className="text-xl font-bold text-white pr-8">{title}</h3>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-white hover:text-gray-200 transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <div>{children}</div>
          {footer && <div className="mt-6">{footer}</div>}
        </div>
      </div>
    </div>
  );
};

const Wallet = () => {
  const { user, signInWithGoogle } = useUser();
  const { isDark } = useTheme();
  const uid = user?.uid;
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState("");
  const [search, setSearch] = useState("");
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [orderToCreate, setOrderToCreate] = useState(null);
  const [selectedTx, setSelectedTx] = useState(null);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  const getLocalParts = () => {
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, "0");
    let h = now.getHours();
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    const time = `${pad(h)}:${pad(now.getMinutes())}:${pad(
      now.getSeconds()
    )} ${ampm}`;
    const date = `${pad(now.getDate())}-${pad(
      now.getMonth() + 1
    )}-${now.getFullYear()}`;
    return { date, time };
  };

  // Fetch topup transactions from topups collection
  useEffect(() => {
    if (!uid) return;

    // Query topups collection for user's topup orders
    const topupsRef = collection(db, "topups");
    const q = query(topupsRef, where("uid", "==", uid));

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
              ? raw.createdAt.toMillis
                ? raw.createdAt.toMillis()
                : typeof raw.createdAt === "number"
                ? raw.createdAt
                : Date.now()
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
        if (err.code === "failed-precondition") {
          console.warn(
            "Firestore index may be missing. Transactions will load without server-side sorting."
          );
        }
        setTransactions([]);
      }
    );

    return () => {
      try {
        unsubscribe && unsubscribe();
      } catch (e) {}
    };
  }, [uid]);

  // filtered transactions with search
  const filtered = useMemo(() => {
    const s = (search || "").trim().toLowerCase();
    if (!s) return transactions;
    return transactions.filter((t) =>
      [t.status, t.id, t.date, t.time, t.utr].some((f) =>
        (f || "").toString().toLowerCase().includes(s)
      )
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
      const paymentUrl = import.meta.env.VITE_BACKEND_URL;
      const { data } = await axios.post(
        `${paymentUrl}/topup-coin`,
        orderToCreate
      );
      if (!data?.success) {
        showError(data?.message || "Top-up failed");
        return;
      }
      if (data.redirect_url) {
        showSuccess("Redirecting to payment page...");
        setTimeout(() => {
          window.location.href = data.redirect_url;
        }, 500);
      } else {
        showError("Payment URL missing from server response");
      }
    } catch (err) {
      console.error("Topup error:", err);
      showError(
        err?.response?.data?.message || err?.message || "Top-up failed"
      );
    } finally {
      setLoadingPayment(false);
      setConfirmOpen(false);
      setShowTopupModal(false);
      setOrderToCreate(null);
      setAmount("");
    }
  };

  const handleRedeemCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) {
      showError("Please enter a coupon code");
      return;
    }

    setRedeeming(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/coupon/redeem`,
        { couponCode: couponCode.trim(), uid: user.uid },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showSuccess(response.data.success);
      setCouponCode("");
      setShowCouponModal(false);
    } catch (error) {
      console.error("Redemption error:", error);
      showError(error.response?.data?.error || "Failed to redeem coupon");
    } finally {
      setRedeeming(false);
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
      <div style={style} className="px-2 py-1 md:px-3 md:py-2">
        <div
          className={`grid grid-cols-[1fr_auto] md:grid-cols-3 items-center gap-3 p-3 md:gap-4 md:p-4 rounded-xl border-2 cursor-pointer hover:border-purple-400 hover:shadow-lg transition-all duration-200 group ${isDark ? "bg-gray-800 border-gray-600" : "bg-white border-gray-300"}`}
          onClick={() => setSelectedTx(t)}
        >
          <div className="flex flex-col overflow-hidden">
            <div className={`font-bold text-sm ${statusColor(t.status)} mb-1 truncate`}>
              {t.id || "Top-up"}
            </div>
            <div className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"} truncate`}>
              {t.date} {t.time}
            </div>
            <div className={`md:hidden text-xs font-mono truncate mt-1 ${isDark ? "text-gray-500" : "text-gray-500"}`}>
               {t.utr || "-"}
            </div>
          </div>
          <div
            className={`hidden md:block text-xs font-mono truncate text-center ${isDark ? "text-gray-400" : "text-gray-600"}`}
            title={t.utr || "-"}
          >
            {t.utr || "No UTR"}
          </div>
          <div className="text-right pl-2">
            <div className="flex items-center justify-end gap-2">
              <span className="text-lg flex-shrink-0">{statusIcon(t.status)}</span>
              <div className={`font-bold text-lg whitespace-nowrap ${isDark ? "text-white" : "text-gray-800"}`}>
                    {Math.round(parseFloat(t.amount || 0))} <span className="text-sm">WCoins</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen-dvh bg-gradient-to-br ${isDark ? "from-gray-900 via-gray-900 to-gray-800" : "from-gray-50 via-purple-50/30 to-indigo-50/30"}`}>
      <div className="px-4 md:px-8  py-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-4xl md:text-5xl font-bold mb-2 flex items-center gap-3 ${isDark ? "text-white" : "text-gray-800"}`}>
            <FaWallet className="text-purple-600" />
            Wallet
          </h1>
          <p className={isDark ? "text-gray-400" : "text-gray-600"}>
            Manage your balance and view transaction history
          </p>
        </div>

        {!uid && (
          <div className={`bg-gradient-to-r rounded-2xl p-8 md:p-12 text-center border-2 shadow-xl ${isDark ? "from-purple-900/30 to-indigo-900/30 border-purple-800" : "from-purple-50 to-indigo-50 border-purple-200"}`}>
            <FaWallet className="text-5xl md:text-6xl text-purple-600 mx-auto mb-4" />
            <h2 className={`text-2xl md:text-3xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-800"}`}>
              Sign in to view your wallet
            </h2>
            <p className={`mb-6 max-w-2xl mx-auto ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              Create an account or sign in to manage your balance, view transaction history, and top up your wallet.
            </p>
            <button
              onClick={signInWithGoogle}
              className="inline-flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold shadow-md"
            >
              Sign In
            </button>
          </div>
        )}

        {uid && (
          <>
            {/* Balance Card */}
            <div className="max-w-2xl mb-8">
              <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-700 text-white rounded-3xl p-8 shadow-2xl transform hover:scale-[1.02] transition-transform duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm md:text-base opacity-90 mb-3 font-medium">
                      Available WCoins
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="text-4xl md:text-5xl font-bold">
                        {Math.round(parseFloat(user?.balance || 0))} WCoins
                      </div>
                      <img
                        src={coinImg}
                        alt="wcoin"
                        className="w-8 h-8 md:w-10 md:h-10 "
                      />
                    </div>
                    <div className="text-sm opacity-75">
                      Your WCoins balance is ready to use
                    </div>
                  </div>
                  <div className="flex  flex-col gap-3">
                    <button
                      onClick={() => setShowCouponModal(true)}
                      className="bg-white/20 text-white px-2 py-1 rounded-full font-bold shadow-lg hover:shadow-xl hover:bg-white/30 transition-all duration-200 flex items-center gap-2 text-sm md:text-base backdrop-blur-sm border border-white/10"
                    >
                      <FaGift className="text-lg" /> Redeem
                    </button>
                    <button
                      onClick={() => setShowTopupModal(true)}
                      className="bg-white text-purple-600 px-2 py-2 rounded-full font-bold shadow-xl hover:shadow-2xl hover:bg-purple-50 transition-all duration-200 flex items-center gap-2 text-sm md:text-base"
                    >
                      <FaPlus className="text-lg" /> Add Balance
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Transactions Section */}
            <div className="w-full">
              <div className={`rounded-2xl shadow-xl p-5 md:p-8 ${isDark ? "bg-gray-800" : "bg-white"}`}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                  <h2 className={`text-2xl md:text-3xl font-bold flex items-center gap-2 ${isDark ? "text-white" : "text-gray-800"}`}>
                    <FaWallet className="text-purple-600" />
                    WCoins Top-up History
                  </h2>
                  <div className="relative">
                    <FaSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by ID, UTR, or status..."
                      className={`pl-10 pr-4 py-2.5 border-2 rounded-xl focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all w-full md:w-80 ${isDark ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400" : "border-gray-200 bg-white text-gray-900"}`}
                    />
                  </div>
                </div>

                {filtered.length > 0 ? (
                  <div className={`rounded-xl overflow-hidden border ${isDark ? "border-gray-700" : "border-gray-100"}`}>
                    <ListComponent
                      height={500}
                      itemCount={filtered.length}
                      itemSize={100}
                      width="100%"
                    >
                      {Row}
                    </ListComponent>
                  </div>
                ) : (
                  <div className="py-20 text-center">
                    <FaWallet className={`mx-auto text-6xl mb-4 ${isDark ? "text-gray-600" : "text-gray-300"}`} />
                    <p className={`text-lg font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                      No top-up transactions found
                    </p>
                    <p className={`text-sm mt-2 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                      Start by adding balance to your wallet
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {uid && (
        <>
          <Modal
            open={showTopupModal}
            onClose={() => setShowTopupModal(false)}
            title="Top Up Wallet"
            footer={null}
            isDark={isDark}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleStartTopup(e);
              }}
            >
              <div className="mb-6">
                <label className={`block text-sm font-semibold mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  Enter Amount
                </label>
                <div className="relative">
                  <FaRupeeSign className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-lg ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                  <input
                    type="number"
                    min="1"
                    max="19999"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className={`w-full pl-10 pr-4 py-3.5 border-2 rounded-xl focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all text-lg font-semibold ${isDark ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400" : "border-gray-200 bg-white text-gray-900"}`}
                  />
                </div>
                <p className={`text-xs mt-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  Minimum: ₹1 | Maximum: ₹19,999
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setShowTopupModal(false)}
                  className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-colors ${isDark ? "bg-gray-700 hover:bg-gray-600 text-gray-300" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
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
            open={showCouponModal}
            onClose={() => setShowCouponModal(false)}
            title="Redeem Coupon"
            footer={null}
            isDark={isDark}
          >
            <form onSubmit={handleRedeemCoupon}>
              <div className="mb-6">
                <label className={`block text-sm font-semibold mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  Enter Coupon Code
                </label>
                <div className="relative">
                  <FaGift className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-lg ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="XXXX-XXXX-XXXX"
                    maxLength={14}
                    className={`w-full pl-10 pr-4 py-3.5 border-2 rounded-xl focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all text-lg font-mono font-semibold uppercase ${isDark ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400" : "border-gray-200 bg-white text-gray-900"}`}
                  />
                </div>
                <p className={`text-xs mt-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  Enter the 12-character code to redeem WCoins
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setShowCouponModal(false)}
                  className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-colors ${isDark ? "bg-gray-700 hover:bg-gray-600 text-gray-300" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
                  disabled={redeeming}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={redeeming || !couponCode.trim()}
                >
                  {redeeming ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⏳</span> Redeeming...
                    </span>
                  ) : (
                    "Redeem Now"
                  )}
                </button>
              </div>
            </form>
          </Modal>

          <Modal
            open={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            title="Confirm Top-Up"
            isDark={isDark}
            footer={
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                <button
                  onClick={() => setConfirmOpen(false)}
                  className={`px-6 py-2.5 rounded-xl font-semibold transition-colors w-full sm:w-auto ${isDark ? "bg-gray-700 hover:bg-gray-600 text-gray-300" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
                  disabled={loadingPayment}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmTopup}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                  disabled={loadingPayment}
                >
                  {loadingPayment ? (
                    <span className="flex items-center gap-2 justify-center">
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
                <div className="text-4xl font-bold text-purple-600 mb-2">
                  ₹{Math.round(parseFloat(orderToCreate?.amount || 0))}
                </div>
                <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                  You will be redirected to complete the payment securely.
                </p>
              </div>
              <div className={`rounded-lg p-4 mt-4 ${isDark ? "bg-purple-900/30" : "bg-purple-50"}`}>
                <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                  <strong>Note:</strong> After payment, your balance will be
                  updated automatically.
                </p>
              </div>
            </div>
          </Modal>

          {selectedTx && (
            <Modal
              open={!!selectedTx}
              onClose={() => setSelectedTx(null)}
              title="Transaction Details"
              isDark={isDark}
            >
              <div className="space-y-4">
                <div className={`rounded-xl p-4 space-y-3 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
                  <div className={`flex items-center justify-between pb-3 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                    <span className={`text-sm font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      Order ID
                    </span>
                    <span className={`text-sm font-mono font-bold ${isDark ? "text-white" : "text-gray-800"}`}>
                      {selectedTx.id}
                    </span>
                  </div>
                  <div className={`flex items-center justify-between pb-3 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                    <span className={`text-sm font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      Amount
                    </span>
                    <span className="text-lg font-bold text-purple-600">
                      ₹{Math.round(parseFloat(selectedTx.amount || 0))}
                    </span>
                  </div>
                  <div className={`flex items-center justify-between pb-3 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                    <span className={`text-sm font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      Status
                    </span>
                    <div className="flex items-center gap-2">
                      {statusIcon(selectedTx.status)}
                      <span
                        className={`text-sm font-semibold capitalize ${statusColor(
                          selectedTx.status
                        )}`}
                      >
                        {selectedTx.status}
                      </span>
                    </div>
                  </div>
                  <div className={`flex items-center justify-between pb-3 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                    <span className={`text-sm font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      Date & Time
                    </span>
                    <span className={`text-sm ${isDark ? "text-gray-300" : "text-gray-800"}`}>
                      {selectedTx.date} {selectedTx.time}
                    </span>
                  </div>
                  {selectedTx.utr && (
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                        UTR
                      </span>
                      <span className={`text-xs font-mono break-all text-right w-full ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        {selectedTx.utr}
                      </span>
                    </div>
                  )}
                </div>
                {selectedTx.status === "pending" && (
                  <div className={`border-2 rounded-xl p-4 ${isDark ? "bg-yellow-900/30 border-yellow-800" : "bg-yellow-50 border-yellow-200"}`}>
                    <p className={`text-sm mb-3 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      This payment is still pending. Click below to visit the
                      payment page and complete your transaction.
                    </p>
                    <button
                      onClick={() => {
                        navigate(
                          `/payment?order_id=${selectedTx.id}&type=topup`
                        );
                        setSelectedTx(null);
                      }}
                      className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                    >
                      <FaExternalLinkAlt /> Visit Payment Page
                    </button>
                  </div>
                )}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setSelectedTx(null)}
                    className={`px-6 py-2.5 rounded-xl font-semibold transition-colors ${isDark ? "bg-gray-700 hover:bg-gray-600 text-gray-300" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
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
