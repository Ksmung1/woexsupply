// src/pages/Queues.jsx
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
  FaClipboardList,
  FaFilter,
  FaTimes,
} from "react-icons/fa";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";

const Queues = () => {
  const { user, signInWithGoogle } = useUser();
  const { isDark } = useTheme();
  const uid = user?.uid;
  // no redirect; show inline login CTA when not signed in

  const [queues, setQueues] = useState([]);
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedQueue, setSelectedQueue] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // debounce search input
  useEffect(() => {
    const t = setTimeout(() => setFilter(input.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [input]);

  // safe timestamp parsing
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

  // load queues by reading user's queue[] and then querying queues collection for those ids
  useEffect(() => {
    if (!uid) {
      setQueues([]);
      return;
    }

    const cacheKey = `queues_root_${uid}`;
    const cacheExpiry = 7 * 12 * 60 * 60 * 1000; // 84 hours

    const loadCache = () => {
      try {
        const raw = localStorage.getItem(cacheKey);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || !parsed.timestamp || !Array.isArray(parsed.queues)) return null;
        if (Date.now() - parsed.timestamp < cacheExpiry) return parsed.queues;
        return null;
      } catch {
        return null;
      }
    };

    let unsubUser = null;
    let queueUnsubs = [];

    const cleanupQueueUnsubs = () => {
      queueUnsubs.forEach((u) => {
        try {
          u && u();
        } catch {}
      });
      queueUnsubs = [];
    };

    const userRef = doc(db, "users", uid);
    unsubUser = onSnapshot(
      userRef,
      async (snap) => {
        try {
          const userData = snap.exists() ? snap.data() : {};
          const ids = Array.isArray(userData.queue) ? userData.queue.filter(Boolean) : [];

          if (!ids || ids.length === 0) {
            setQueues([]);
            localStorage.removeItem(cacheKey);
            cleanupQueueUnsubs();
            return;
          }

          const cached = loadCache();
          if (cached && Array.isArray(cached) && cached.length > 0) {
            setQueues(cached);
          }

          cleanupQueueUnsubs();

          const chunks = [];
          for (let i = 0; i < ids.length; i += 10) chunks.push(ids.slice(i, i + 10));

          const aggregated = [];

          const chunkPromises = chunks.map(async (chunk) => {
            const q = query(collection(db, "queues"), where(documentId(), "in", chunk));
            const unsub = onSnapshot(
              q,
              (snapQueues) => {
                const partial = snapQueues.docs.map((d) => {
                  const data = d.data() || {};

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
                    type: data.type || "—",
                    dateTimestamp,
                    __raw: data,
                  };
                });

                const chunkDocIds = partial.map((p) => p.docId);
                for (let i = aggregated.length - 1; i >= 0; i--) {
                  if (chunkDocIds.includes(aggregated[i].docId)) aggregated.splice(i, 1);
                }
                aggregated.push(...partial);

                const final = aggregated.sort((a, b) => (b.dateTimestamp || 0) - (a.dateTimestamp || 0));

                setQueues(final);

                try {
                  localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), queues: final }));
                } catch {}
              },
              (err) => {
                console.error("queues chunk snapshot error:", err);
              }
            );

            queueUnsubs.push(unsub);
            return unsub;
          });

          await Promise.all(chunkPromises);
        } catch (err) {
          console.error("Error processing user queues:", err);
        }
      },
      (err) => {
        console.error("user doc snapshot error:", err);
      }
    );

    return () => {
      try {
        unsubUser && unsubUser();
      } catch {}
      try {
        cleanupQueueUnsubs();
      } catch {}
    };
  }, [uid, safeParseTimestamp]);

  const filteredQueues = useMemo(() => {
    const s = filter || "";
    return queues
      .filter((queue) => {
        if (!s) return true;
        const fields = [
          queue.status,
          queue.item,
          queue.date,
          queue.userId,
          queue.zoneId,
          queue.cost,
          queue.username,
          queue.docId,
          queue.uid,
          queue.type,
        ];
        const match = fields.some((f) => (f || "").toString().toLowerCase().includes(s));
        return match;
      })
      .filter((queue) => {
        if (statusFilter === "all") return true;
        return (queue.status || "").toLowerCase() === statusFilter;
      })
      .sort((a, b) => (b.dateTimestamp || 0) - (a.dateTimestamp || 0));
  }, [queues, filter, statusFilter]);

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
        return isDark ? "text-green-400" : "text-green-700";
      case "pending":
        return isDark ? "text-yellow-400" : "text-yellow-700";
      case "failed":
        return isDark ? "text-red-400" : "text-red-700";
      default:
        return isDark ? "text-gray-400" : "text-gray-700";
    }
  };

  const Row = ({ index, style }) => {
    const queue = filteredQueues[index];
    if (!queue) return null;

    return (
      <div style={style} className="px-2 py-2">
        <div
          className={`rounded-xl border p-4 cursor-pointer hover:border-purple-300 hover:shadow-lg transition-all duration-200 group ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}
          onClick={() => {
            setSelectedQueue(queue);
            setShowModal(true);
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                {getStatusIcon(queue.status)}
                <span className={`font-bold text-sm ${getStatusColor(queue.status)}`}>
                  {queue.status?.charAt(0).toUpperCase() + queue.status?.slice(1) || "Unknown"}
                </span>
              </div>
              <span className={`font-semibold text-base truncate ${isDark ? "text-white" : "text-gray-800"}`}>
                {queue.item}
              </span>
              <span className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                {queue.date || "00-00-0000"} {queue.time || "00:00:00 AM"}
              </span>
            </div>

            <div className="hidden md:block">
              <div className={`text-xs mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Type</div>
              <div className={`text-xs font-semibold capitalize ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                {queue.type || "N/A"}
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-4">
              <div className="text-right">
                <div className={`text-xs mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Amount</div>
                <div className={`font-bold text-lg ${getPriceColor(queue.status)}`}>
                  ₹{queue.cost?.toFixed(2) ?? "0.00"}
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
        return isDark ? "text-green-400" : "text-green-700";
      case "pending":
        return isDark ? "text-yellow-400" : "text-yellow-700";
      case "failed":
        return isDark ? "text-red-400" : "text-red-700";
      default:
        return isDark ? "text-gray-400" : "text-gray-700";
    }
  };

  const closeModal = () => {
    setSelectedQueue(null);
    setShowModal(false);
  };

  const isBrowser = typeof window !== "undefined";

  return (
    <div className={`min-h-screen-dvh bg-gradient-to-br py-8 ${isDark ? "from-gray-900 via-gray-900 to-gray-800" : "from-gray-50 via-purple-50/30 to-indigo-50/30"}`}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-4xl md:text-5xl font-bold mb-2 flex items-center gap-3 ${isDark ? "text-white" : "text-gray-800"}`}>
            <FaClipboardList className="text-purple-600" />
            My Queues
          </h1>
          <p className={isDark ? "text-gray-400" : "text-gray-600"}>View and manage all your queue items</p>
        </div>

        {!uid && (
          <div className={`bg-gradient-to-r rounded-2xl p-8 md:p-12 text-center border-2 shadow-xl ${isDark ? "from-purple-900/30 to-indigo-900/30 border-purple-800" : "from-purple-50 to-indigo-50 border-purple-200"}`}>
            <FaClipboardList className="text-5xl md:text-6xl text-purple-600 mx-auto mb-4" />
            <h2 className={`text-2xl md:text-3xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-800"}`}>Sign in to view your queues</h2>
            <p className={`mb-6 max-w-2xl mx-auto ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              Create an account or sign in to view your queue items and track their status.
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
                  <FaFilter className="text-purple-600" />
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
                  placeholder="Search by item, status, type, or date..."
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all ${isDark ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400" : "border-gray-200 bg-white text-gray-900"}`}
                />
              </div>
            </div>

            {/* Queues List */}
            {queues.length === 0 ? (
              <div className={`rounded-2xl shadow-xl p-12 text-center ${isDark ? "bg-gray-800" : "bg-white"}`}>
                <FaClipboardList className={`mx-auto text-6xl mb-4 ${isDark ? "text-gray-600" : "text-gray-300"}`} />
                <p className={`text-lg font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>No queues found</p>
                <p className={`text-sm mt-2 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Your queue items will appear here once you make a purchase</p>
              </div>
            ) : filteredQueues.length === 0 ? (
              <div className={`rounded-2xl shadow-xl p-12 text-center ${isDark ? "bg-gray-800" : "bg-white"}`}>
                <FaSearch className={`mx-auto text-6xl mb-4 ${isDark ? "text-gray-600" : "text-gray-300"}`} />
                <p className={`text-lg font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>No queues match your filters</p>
                <p className={`text-sm mt-2 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Try adjusting your search or filter criteria</p>
              </div>
            ) : (
              <div className={`rounded-2xl shadow-xl p-6 ${isDark ? "bg-gray-800" : "bg-white"}`}>
                <div className="mb-4 flex items-center justify-between">
                  <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                    Showing <span className={`font-semibold ${isDark ? "text-white" : "text-gray-800"}`}>{filteredQueues.length}</span> of{" "}
                    <span className={`font-semibold ${isDark ? "text-white" : "text-gray-800"}`}>{queues.length}</span> queues
                  </p>
                  <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}>Click on any queue to view details</p>
                </div>
                {isBrowser ? (
                  <div className={`rounded-xl overflow-hidden border ${isDark ? "border-gray-700" : "border-gray-100"}`}>
                    <List height={500} itemCount={filteredQueues.length} itemSize={120} width={"100%"}>
                      {Row}
                    </List>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredQueues.map((q, i) => (
                      <div
                        key={q.docId ?? i}
                        onClick={() => {
                          setSelectedQueue(q);
                          setShowModal(true);
                        }}
                        className={`rounded-xl border p-4 cursor-pointer hover:border-purple-300 hover:shadow-lg transition-all duration-200 ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className={`font-semibold ${isDark ? "text-white" : "text-gray-800"}`}>{q.item}</div>
                            <div className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>{q.date} {q.time}</div>
                          </div>
                          <div className={`font-bold text-lg ${getPriceColor(q.status)}`}>
                            ₹{q.cost?.toFixed(2) ?? "0.00"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Queue Details Modal */}
            {showModal && selectedQueue && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                onClick={closeModal}
              >
                <div
                  className={`rounded-2xl shadow-2xl max-w-2xl w-full mx-4 p-6 relative max-h-[90vh] overflow-y-auto ${isDark ? "bg-gray-800" : "bg-white"}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className={`absolute right-4 top-4 text-2xl transition-colors ${isDark ? "text-gray-400 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"}`}
                    onClick={closeModal}
                    aria-label="Close queue details"
                  >
                    <FaTimes />
                  </button>

                  <h3 className={`text-2xl font-bold mb-6 flex items-center gap-2 ${isDark ? "text-white" : "text-gray-800"}`}>
                    <FaClipboardList className="text-purple-600" />
                    Queue Details
                  </h3>

                  <div className="space-y-4">
                    <div className={`rounded-xl p-4 space-y-3 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
                      <div className={`flex items-center justify-between pb-3 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                        <span className={`text-sm font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}>Queue ID</span>
                        <span className={`text-sm font-mono font-bold ${isDark ? "text-white" : "text-gray-800"}`}>
                          {selectedQueue.docId || "N/A"}
                        </span>
                      </div>
                      <div className={`flex items-center justify-between pb-3 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                        <span className={`text-sm font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}>Item</span>
                        <span className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-800"}`}>{selectedQueue.item || "—"}</span>
                      </div>
                      <div className={`flex items-center justify-between pb-3 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                        <span className={`text-sm font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}>Type</span>
                        <span className={`text-sm font-semibold capitalize ${isDark ? "text-white" : "text-gray-800"}`}>{selectedQueue.type || "—"}</span>
                      </div>
                      <div className={`flex items-center justify-between pb-3 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                        <span className={`text-sm font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}>Status</span>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(selectedQueue.status)}
                          <span className={`text-sm font-semibold capitalize ${getStatusColor(selectedQueue.status)}`}>
                            {selectedQueue.status || "—"}
                          </span>
                        </div>
                      </div>
                      <div className={`flex items-center justify-between pb-3 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                        <span className={`text-sm font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}>Date & Time</span>
                        <span className={`text-sm ${isDark ? "text-gray-300" : "text-gray-800"}`}>
                          {selectedQueue.date || "00-00-0000"} {selectedQueue.time || "00:00:00 AM"}
                        </span>
                      </div>
                      <div className={`flex items-center justify-between pb-3 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                        <span className={`text-sm font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}>Amount</span>
                        <span className="text-lg font-bold text-purple-600">₹{selectedQueue.cost?.toFixed(2) ?? "0.00"}</span>
                      </div>
                      <div className={`flex items-center justify-between pb-3 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                        <span className={`text-sm font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}>Payment Method</span>
                        <span className={`text-sm ${isDark ? "text-gray-300" : "text-gray-800"}`}>{selectedQueue.payment || "—"}</span>
                      </div>
                      <div className={`flex items-center justify-between pb-3 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                        <span className={`text-sm font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}>User ID</span>
                        <span className={`text-xs font-mono ${isDark ? "text-gray-300" : "text-gray-700"}`}>{selectedQueue.userId || "0"}</span>
                      </div>
                      <div className={`flex items-center justify-between pb-3 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                        <span className={`text-sm font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}>Server ID</span>
                        <span className={`text-xs font-mono ${isDark ? "text-gray-300" : "text-gray-700"}`}>{selectedQueue.zoneId || "0"}</span>
                      </div>
                      <div className={`flex items-center justify-between pb-3 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                        <span className={`text-sm font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}>Username</span>
                        <span className={`text-sm ${isDark ? "text-gray-300" : "text-gray-800"}`}>{selectedQueue.username || "anonymous"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}>In-Game Name</span>
                        <span className={`text-sm ${isDark ? "text-gray-300" : "text-gray-800"}`}>{selectedQueue.gameUsername || "—"}</span>
                      </div>
                    </div>

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

export default Queues;

