// src/pages/Orders.jsx
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { FixedSizeList as List } from "react-window";
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  documentId,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { 
  FaCheckCircle, 
  FaHourglassHalf, 
  FaTimesCircle, 
  FaSearch,
  FaShoppingBag,
  FaFilter,
  FaTimes,
  FaUser
} from "react-icons/fa";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";

const Orders = () => {
  const { user, signInWithGoogle } = useUser();
  const { isDark } = useTheme();
  const uid = user?.uid;
  const isDarkMode = isDark;

  const [orders, setOrders] = useState([]);
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // debounce search input
  useEffect(() => {
    const t = setTimeout(() => setFilter(input.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [input]);

  // safe timestamp parsing (same logic as your template)
  const safeParseTimestamp = useCallback((dateStr, timeStr, fallback = Date.now()) => {
    try {
      const d = (dateStr || "").trim();
      const t = (timeStr || "").trim();

      if (d.includes("-")) {
        const parts = d.split("-").map((p) => Number(p));
        if (parts.length === 3 && parts.every((n) => Number.isFinite(n))) {
          const [day, month, year] = parts;
          if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year > 1900) {
            const us = `${month}/${day}/${year} ${t || "12:00:00 AM"}`;
            const parsed = new Date(us).getTime();
            if (!Number.isNaN(parsed)) return parsed;
          }
        }
      }

      if (d) {
        const tryIso = new Date(t ? `${d} ${t}` : d).getTime();
        if (!Number.isNaN(tryIso)) return tryIso;
      }

      if (t) {
        const tryTime = new Date(t).getTime();
        if (!Number.isNaN(tryTime)) return tryTime;
      }

      return fallback;
    } catch {
      return fallback;
    }
  }, []);

  // no redirect; show inline login CTA when not signed in

  // load orders by reading user's orders[] and then querying orders collection for those ids
  useEffect(() => {
    if (!uid) {
      setOrders([]);
      return;
    }

    const cacheKey = `orders_root_${uid}`;
    const cacheExpiry = 7 * 12 * 60 * 60 * 1000; // 84 hours (approx as in your template)

    const loadCache = () => {
      try {
        const raw = localStorage.getItem(cacheKey);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || !parsed.timestamp || !Array.isArray(parsed.orders)) return null;
        if (Date.now() - parsed.timestamp < cacheExpiry) return parsed.orders;
        return null;
      } catch {
        return null;
      }
    };

    let unsubUser = null;
    let orderUnsubs = []; // store unsub functions for orders queries

    // helper to cancel orders listeners
    const cleanupOrderUnsubs = () => {
      orderUnsubs.forEach((u) => {
        try {
          u && u();
        } catch {}
      });
      orderUnsubs = [];
    };

    // attach listener to user doc so we get live updates of the orders[] array
    const userRef = doc(db, "users", uid);
    unsubUser = onSnapshot(
      userRef,
      async (snap) => {
        try {
          const userData = snap.exists() ? snap.data() : {};
          const ids = Array.isArray(userData.orders) ? userData.orders.filter(Boolean) : [];

          // if no ids, clear orders
          if (!ids || ids.length === 0) {
            setOrders([]);
            localStorage.removeItem(cacheKey);
            cleanupOrderUnsubs();
            return;
          }

          // try cached result first (fast UI)
          const cached = loadCache();
          if (cached && Array.isArray(cached) && cached.length > 0) {
            setOrders(cached);
          }

          // Firestore 'in' supports up to 10 items; chunk ids into groups of 10
          cleanupOrderUnsubs();

          const chunks = [];
          for (let i = 0; i < ids.length; i += 10) chunks.push(ids.slice(i, i + 10));

          // We'll accumulate results from each chunk(s) and then setOrders once aggregated
          const aggregated = [];

          // Use onSnapshot for each chunk for real-time updates
          const chunkPromises = chunks.map(async (chunk) => {
            const q = query(collection(db, "orders"), where(documentId(), "in", chunk));
            const unsub = onSnapshot(
              q,
              (snapOrders) => {
                // map snapshot docs and update aggregated store
                const partial = snapOrders.docs.map((d) => {
                  const data = d.data() || {};

                  // compute dateTimestamp safely
                  let dateTimestamp = null;
                  if (data.timestamp && !Number.isNaN(Number(data.timestamp))) {
                    dateTimestamp = Number(data.timestamp);
                  } else {
                    dateTimestamp = safeParseTimestamp(data.date, data.time, 0);
                  }

                  return {
                    docId: d.id,
                    uid: data.uid || data.userId || d.id,
                    item: data.item || "Unknown item",
                    date: data.date || "00-00-0000",
                    time: data.time || "00:00:00 AM",
                    status: (data.status || "unknown").toString().toLowerCase(),
                    cost: Number(data.cost ?? data.amount ?? 0) || 0,
                    payment: data.payment || "unknown",
                    userId: data.userId || "0",
                    zoneId: data.zoneId || "0",
                    username: data.username || "anonymous",
                    gameUsername: data.gameUsername || "—",
                    utr: data.utr || null,
                    isTopup: data.isTopup ?? null,
                    orderId: data.orderId || "",
                    dateTimestamp,
                    __raw: data,
                  };
                });

                // remove any previously stored docs from this chunk in aggregated then add fresh partial
                // We keep aggregated in local variable stored on closure, so update it immutably
                // Strategy: rebuild aggregated by reading all current partials via fetching all chunk queries' latest results.
                // Simpler approach: for each change, fetch all docs matching ids using getDocs (stable but not realtime). But to keep realtime:
                // we'll push partial into aggregated, then regenerate unique map from aggregated and setOrders.
                // First, remove entries that belong to this chunk (match docId in chunk) then add new partial.
                const chunkDocIds = partial.map((p) => p.docId);
                // remove old items in aggregated that match these docIds
                for (let i = aggregated.length - 1; i >= 0; i--) {
                  if (chunkDocIds.includes(aggregated[i].docId)) aggregated.splice(i, 1);
                }
                // add new ones
                aggregated.push(...partial);

                // filter out topups then sort descending by timestamp
                const final = aggregated
                  .filter((o) => o && o.isTopup !== true)
                  .sort((a, b) => (b.dateTimestamp || 0) - (a.dateTimestamp || 0));

                setOrders(final);

                // cache (best-effort)
                try {
                  localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), orders: final }));
                } catch {}
              },
              (err) => {
                console.error("orders chunk snapshot error:", err);
              }
            );

            orderUnsubs.push(unsub);
            return unsub;
          });

          // wait for initial subscriptions to be created (not required, but ensures orderUnsubs filled)
          await Promise.all(chunkPromises);
        } catch (err) {
          console.error("Error processing user orders:", err);
        }
      },
      (err) => {
        console.error("user doc snapshot error:", err);
      }
    );

    // cleanup on unmount / uid change
    return () => {
      try {
        unsubUser && unsubUser();
      } catch {}
      try {
        cleanupOrderUnsubs();
      } catch {}
    };
  }, [uid, safeParseTimestamp]);

  // derive filteredOrders (search + status)
  const filteredOrders = useMemo(() => {
    const s = filter || "";
    return orders
      .filter((order) => order.isTopup !== true)
      .filter((order) => {
        if (!s) return true;
        const fields = [
          order.status,
          order.item,
          order.date,
          order.orderId,
          order.userId,
          order.zoneId,
          order.cost,
          order.username,
          order.docId,
          order.uid,
        ];
        const match = fields.some((f) => (f || "").toString().toLowerCase().includes(s));
        return match;
      })
      .filter((order) => {
        if (statusFilter === "all") return true;
        return (order.status || "").toLowerCase() === statusFilter;
      })
      .sort((a, b) => (b.dateTimestamp || 0) - (a.dateTimestamp || 0));
  }, [orders, filter, statusFilter]);

  const getStatusIcon = (status) => {
    const s = (status || "").toString().toLowerCase();
    switch (s) {
      case "completed":
        return <FaCheckCircle size={24} className="text-green-500" />;
      case "pending":
        return <FaHourglassHalf size={24} className="text-yellow-500" />;
      case "failed":
        return <FaTimesCircle size={24} className="text-red-500" />;
      default:
        return <FaTimesCircle size={24} className="text-gray-400" />;
    }
  };

  const getPriceColor = (status) => {
    const s = (status || "").toString().toLowerCase();
    switch (s) {
      case "completed":
        return isDarkMode ? "text-green-400" : "text-green-700";
      case "pending":
        return isDarkMode ? "text-yellow-400" : "text-yellow-700";
      case "failed":
        return isDarkMode ? "text-red-400" : "text-red-700";
      default:
        return isDarkMode ? "text-gray-400" : "text-gray-700";
    }
  };

  const Row = ({ index, style }) => {
    const order = filteredOrders[index];
    if (!order) return null;

    return (
      <div
        style={style}
        className="px-1 py-1 md:px-2 md:py-2"
      >
        <div
          className={`rounded-xl border p-2 md:p-4 cursor-pointer hover:shadow-lg transition-all duration-200 group ${isDark ? "bg-gray-800 border-gray-700 hover:border-purple-500" : "bg-white border-gray-100 hover:border-purple-300"}`}
        onClick={() => {
          setSelectedOrder(order);
          setShowModal(true);
        }}
      >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                {getStatusIcon(order.status)}
                <span className={`font-bold text-sm ${getStatusColor(order.status)}`}>
                  {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || "Unknown"}
                </span>
              </div>
              <span className={`font-semibold text-base truncate ${isDark ? "text-white" : "text-gray-800"}`}>
              {order.item}
            </span>
              <span className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                {order.date || "00-00-0000"} {order.time || "00:00:00 AM"}
            </span>
          </div>

            <div className="hidden md:block">
              <div className={`text-xs mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Order ID</div>
              <div className={`text-xs font-mono truncate ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                {order.orderId || order.docId || "N/A"}
              </div>
          </div>

            <div className="flex items-center justify-between md:justify-end gap-4">
              <div className="text-right">
                <div className={`text-xs mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Amount</div>
                <div className={`font-bold text-lg ${getPriceColor(order.status)}`}>
                  ₹{order.cost?.toFixed(2) ?? "0.00"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getStatusColor = (status) => {
    const s = (status || "").toString().toLowerCase();
    switch (s) {
      case "completed":
        return "text-green-700";
      case "pending":
        return "text-yellow-700";
      case "failed":
        return "text-red-700";
      default:
        return "text-gray-700";
    }
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setShowModal(false);
  };

  const isBrowser = typeof window !== "undefined";

  return (
    <div className={`min-h-screen-dvh bg-gradient-to-br py-8 transition-colors ${isDark ? "from-gray-900 via-gray-900 to-gray-800" : "from-gray-50 via-purple-50/30 to-indigo-50/30"}`}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-4xl md:text-5xl font-bold mb-2 flex items-center gap-3 ${isDark ? "text-white" : "text-gray-800"}`}>
            <FaShoppingBag className={isDark ? "text-purple-400" : "text-purple-600"} />
            My Orders
          </h1>
          <p className={isDark ? "text-gray-400" : "text-gray-600"}>View and manage all your orders</p>
        </div>

        {!uid && (
          <div className={`bg-gradient-to-r rounded-2xl p-8 md:p-12 text-center border-2 shadow-xl ${isDark ? "from-purple-900/30 to-indigo-900/30 border-purple-800" : "from-purple-50 to-indigo-50 border-purple-200"}`}>
            <FaShoppingBag className={`text-5xl md:text-6xl mx-auto mb-4 ${isDark ? "text-purple-400" : "text-purple-600"}`} />
            <h2 className={`text-2xl md:text-3xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-800"}`}>Sign in to view your orders</h2>
            <p className={`mb-6 max-w-2xl mx-auto ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              Create an account or sign in to view your order history, track deliveries, and manage your purchases.
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
        {/* Filters and Search */}
        <div className={`rounded-2xl shadow-xl p-6 mb-6 ${isDark ? "bg-gray-800" : "bg-white"}`}>
          {/* Status Filters */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <FaFilter className={isDark ? "text-purple-400" : "text-purple-600"} />
              <span className={`text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>Filter by Status</span>
            </div>
            <div className="flex flex-wrap gap-2">
        {["all", "pending", "completed", "failed"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    statusFilter === status
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg"
                      : isDark
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
            </div>
      </div>

          {/* Search */}
          <div className="relative">
            <FaSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
              placeholder="Search by ID, item, status, or date..."
              className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${isDark ? "border-gray-700 bg-gray-900 text-white focus:border-purple-400 focus:ring-purple-900" : "border-gray-200 bg-white text-gray-900 focus:border-purple-500 focus:ring-purple-200"}`}
        />
          </div>
      </div>

        {/* Orders List */}
      {orders.length === 0 ? (
          <div className={`rounded-2xl shadow-xl p-12 text-center ${isDark ? "bg-gray-800" : "bg-white"}`}>
            <FaShoppingBag className={`mx-auto text-6xl mb-4 ${isDark ? "text-gray-600" : "text-gray-300"}`} />
            <p className={`text-lg font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>No orders found</p>
            <p className={`text-sm mt-2 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Your orders will appear here once you make a purchase</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className={`rounded-2xl shadow-xl p-12 text-center ${isDark ? "bg-gray-800" : "bg-white"}`}>
            <FaSearch className={`mx-auto text-6xl mb-4 ${isDark ? "text-gray-600" : "text-gray-300"}`} />
            <p className={`text-lg font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>No orders match your filters</p>
            <p className={`text-sm mt-2 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className={`rounded-2xl shadow-xl p-6 ${isDark ? "bg-gray-800" : "bg-white"}`}>
            <div className="mb-4 flex items-center justify-between">
              <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                Showing <span className={`font-semibold ${isDark ? "text-white" : "text-gray-800"}`}>{filteredOrders.length}</span> of{" "}
                <span className={`font-semibold ${isDark ? "text-white" : "text-gray-800"}`}>{orders.length}</span> orders
              </p>
              <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>Click on any order to view details</p>
            </div>
          {isBrowser ? (
              <div className={`rounded-xl overflow-hidden border ${isDark ? "border-gray-700" : "border-gray-100"}`}>
                <List height={500} itemCount={filteredOrders.length} itemSize={120} width={"100%"}>
              {Row}
            </List>
              </div>
          ) : (
              <div className="space-y-3">
              {filteredOrders.map((o, i) => (
                  <div
                    key={o.docId ?? i}
                    onClick={() => {
                      setSelectedOrder(o);
                      setShowModal(true);
                    }}
                    className={`rounded-xl border p-2 md:p-4 cursor-pointer hover:shadow-lg transition-all duration-200 ${isDark ? "bg-gray-800 border-gray-700 hover:border-purple-500" : "bg-white border-gray-100 hover:border-purple-300"}`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className={`font-semibold ${isDark ? "text-white" : "text-gray-800"}`}>{o.item}</div>
                        <div className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>{o.date} {o.time}</div>
                      </div>
                      <div className={`font-bold text-lg ${getPriceColor(o.status)}`}>
                        ₹{o.cost?.toFixed(2) ?? "0.00"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
      )}

        {/* Order Details Modal */}
      {showModal && selectedOrder && (
          <div
            className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm ${isDark ? "bg-black/70" : "bg-black/60"}`}
            onClick={closeModal}
          >
            <div
              className={`rounded-2xl shadow-2xl max-w-2xl w-full mx-4 p-6 relative max-h-[90vh] overflow-y-auto ${isDark ? "bg-gray-800" : "bg-white"}`}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className={`absolute right-4 top-4 text-2xl transition-colors ${isDark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"}`}
                onClick={closeModal}
                aria-label="Close order details"
              >
                <FaTimes />
              </button>

              <h3 className={`text-2xl font-bold mb-6 flex items-center gap-2 ${isDark ? "text-white" : "text-gray-800"}`}>
                <FaShoppingBag className={isDark ? "text-purple-400" : "text-purple-600"} />
                Order Details
              </h3>

              <div className="space-y-4">
                <div className={`rounded-xl p-4 space-y-3 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
                  <div className={`flex items-center justify-between pb-3 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                    <span className={`text-sm font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}>Order ID</span>
                    <span className={`text-sm font-mono font-bold ${isDark ? "text-white" : "text-gray-800"}`}>
                      {selectedOrder.orderId || selectedOrder.docId || "N/A"}
                    </span>
                  </div>
                  <div className={`flex items-center justify-between pb-3 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                    <span className={`text-sm font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}>Item</span>
                    <span className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-800"}`}>{selectedOrder.item || "—"}</span>
                  </div>
                  <div className={`flex items-center justify-between pb-3 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                    <span className={`text-sm font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}>Status</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedOrder.status)}
                      <span className={`text-sm font-semibold capitalize ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status || "—"}
                      </span>
                    </div>
                  </div>
                  <div className={`flex items-center justify-between pb-3 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                    <span className={`text-sm font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}>Date & Time</span>
                    <span className={`text-sm ${isDark ? "text-gray-300" : "text-gray-800"}`}>
                      {selectedOrder.date || "00-00-0000"} {selectedOrder.time || "00:00:00 AM"}
                    </span>
                  </div>
                  <div className={`flex items-center justify-between pb-3 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                    <span className={`text-sm font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}>Amount</span>
                    <span className={`text-lg font-bold ${isDark ? "text-purple-400" : "text-purple-600"}`}>₹{selectedOrder.cost?.toFixed(2) ?? "0.00"}</span>
                  </div>
                  <div className={`flex items-center justify-between pb-3 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                    <span className={`text-sm font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}>Payment Method</span>
                    <span className={`text-sm ${isDark ? "text-gray-300" : "text-gray-800"}`}>{selectedOrder.payment || "—"}</span>
                  </div>
                  <div className={`flex items-center justify-between pb-3 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                    <span className={`text-sm font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}>User ID</span>
                    <span className={`text-xs font-mono ${isDark ? "text-gray-300" : "text-gray-700"}`}>{selectedOrder.userId || "0"}</span>
                  </div>
                  <div className={`flex items-center justify-between pb-3 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                    <span className={`text-sm font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}>Server ID</span>
                    <span className={`text-xs font-mono ${isDark ? "text-gray-300" : "text-gray-700"}`}>{selectedOrder.zoneId || "0"}</span>
                  </div>
                  <div className={`flex items-center justify-between pb-3 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                    <span className={`text-sm font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}>Username</span>
                    <span className={`text-sm ${isDark ? "text-gray-300" : "text-gray-800"}`}>{selectedOrder.username || "anonymous"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}>In-Game Name</span>
                    <span className={`text-sm ${isDark ? "text-gray-300" : "text-gray-800"}`}>{selectedOrder.gameUsername || "—"}</span>
                  </div>
                </div>

                {selectedOrder.payment === "upi" && selectedOrder.utr && (
                  <div className={`rounded-xl p-4 border ${isDark ? "bg-green-900/30 border-green-800" : "bg-green-50 border-green-200"}`}>
                    <div className={`text-sm font-semibold mb-2 ${isDark ? "text-green-400" : "text-green-800"}`}>UTR / Transaction ID</div>
                    <div className={`text-xs font-mono break-all ${isDark ? "text-green-300" : "text-green-700"}`}>{selectedOrder.utr}</div>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    onClick={closeModal}
                    className={`px-6 py-2.5 rounded-xl font-semibold transition-colors ${isDark ? "bg-gray-700 hover:bg-gray-600 text-gray-300" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
                  >
                    Close
                  </button>
                </div>
            </div>
          </div>
        </div>
      )}
          </>
        )}
      </div>
    </div>
  );
};

export default Orders;
