import React, { useEffect, useState } from "react";
import { db } from "../../config/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  doc,
} from "firebase/firestore";
import { FaTimes, FaCoins } from "react-icons/fa";
import { useTheme } from "../../context/ThemeContext";

/**
 * AdminTopups
 * - Shows a table of ALL topups (realtime)
 * - Two actions per topup:
 *    1) Toggle (Completed <-> Pending)
 *    2) Mark Failed
 * - Sorted by date (newest first)
 */

const formatDate = (val) => {
  if (!val) return "—";
  let date;
  if (typeof val?.toDate === "function") {
    date = val.toDate();
  } else {
    try {
      date = new Date(val);
    } catch {
      return String(val);
    }
  }
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

export default function AdminTopups() {
  const { isDark } = useTheme();
  const [topups, setTopups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState(null);
  const [selectedTopup, setSelectedTopup] = useState(null); // Selected topup for details view

  useEffect(() => {
    setLoading(true);
    setError(null);

    const colRef = collection(db, "topups");
    const q = query(colRef, orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setTopups(list);
        setLoading(false);
      },
      (err) => {
        console.error("AdminTopups onSnapshot error:", err);
        setError("Failed to load topups.");
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const updateStatus = async (topupId, newStatus) => {
    setSavingId(topupId);
    setError(null);

    const prev = topups;
    setTopups((cur) =>
      cur.map((t) => (t.id === topupId ? { ...t, status: newStatus } : t))
    );

    try {
      const ref = doc(db, "topups", topupId);
      await updateDoc(ref, { status: newStatus });
    } catch (err) {
      console.error("Failed to update topup status", err);
      setError("Failed to update status. Changes reverted.");
      setTopups(prev);
    } finally {
      setSavingId(null);
    }
  };

  const handleToggle = (topup) => {
    const current = String(topup.status ?? "pending").toLowerCase();
    const next = current === "completed" ? "pending" : "completed";
    updateStatus(topup.id, next);
  };

  const handleFail = (topup) => {
    updateStatus(topup.id, "failed");
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h1 className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Topups</h1>
        <span className={`text-xs px-2 py-1 rounded-full ${isDark ? "text-gray-400 bg-gray-800" : "text-gray-500 bg-gray-100"}`}>
          {topups.length} total
        </span>
      </div>

      {error && (
        <div className={`mb-3 p-2 rounded text-xs ${isDark ? "bg-red-900/30 text-red-400" : "bg-red-50 text-red-700"}`}>
          {error}
        </div>
      )}

      {loading ? (
        <div className={`text-xs py-4 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Loading topups…</div>
      ) : topups.length === 0 ? (
        <div className={`text-xs py-4 text-center rounded-lg ${isDark ? "text-gray-400 bg-gray-800" : "text-gray-600 bg-gray-50"}`}>
          No topups found.
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className={`hidden lg:block overflow-x-auto rounded-lg border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <table className="min-w-full">
              <thead className={`border-b ${isDark ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                <tr>
                  <th className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                    ID
                  </th>
                  <th className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                    User
                  </th>
                  <th className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                    Amount
                  </th>
                  <th className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                    Time
                  </th>
                  <th className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                    Status
                  </th>
                  <th className={`px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className={`divide-y ${isDark ? "divide-gray-700" : "divide-gray-100"}`}>
                {topups.map((topup) => (
                  <tr
                    key={topup.id}
                    className={`transition-colors cursor-pointer ${isDark ? "hover:bg-gray-700/50" : "hover:bg-gray-50"}`}
                    onClick={(e) => {
                      // Don't open details if clicking on interactive elements
                      if (
                        !e.target.closest("button") &&
                        !e.target.closest("input")
                      ) {
                        setSelectedTopup(topup);
                      }
                    }}
                  >
                    <td className="px-3 py-2">
                      <span className={`text-xs font-mono truncate block max-w-[120px] ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                        {topup.id.slice(0, 8)}...
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`text-xs truncate block max-w-[120px] ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                        {topup.username ??
                          topup.name ??
                          topup.user ??
                          topup.uid ??
                          "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`text-xs font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                        ₹{topup.amount ?? topup.cost ?? topup.price ?? "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                        {formatDate(topup.createdAt)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          "inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full capitalize " +
                          (topup.status === "completed" ||
                          topup.status === "success"
                            ? isDark ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-700"
                            : topup.status === "failed"
                            ? isDark ? "bg-red-900/30 text-red-400" : "bg-red-100 text-red-700"
                            : isDark ? "bg-yellow-900/30 text-yellow-400" : "bg-yellow-100 text-yellow-700")
                        }
                      >
                        {topup.status ?? "pending"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggle(topup)}
                          disabled={savingId === topup.id}
                          className={`px-2 py-1 text-xs rounded-md border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? "border-gray-600 bg-gray-800 hover:bg-gray-700 text-gray-300" : "border-gray-300 bg-white hover:bg-gray-50 text-gray-700"}`}
                          title={
                            topup.status === "completed" ||
                            topup.status === "success"
                              ? "Mark pending"
                              : "Mark completed"
                          }
                        >
                          {savingId === topup.id
                            ? "..."
                            : topup.status === "completed" ||
                              topup.status === "success"
                            ? "Pending"
                            : "Complete"}
                        </button>
                        <button
                          onClick={() => handleFail(topup)}
                          disabled={
                            savingId === topup.id || topup.status === "failed"
                          }
                          className={`px-2 py-1 text-xs rounded-md border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? "border-red-700 bg-gray-800 text-red-400 hover:bg-red-900/30" : "border-red-300 bg-white text-red-600 hover:bg-red-50"}`}
                          title="Mark failed"
                        >
                          {savingId === topup.id ? "..." : "Fail"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile/Tablet Card View */}
          <div className="lg:hidden space-y-2">
            {topups.map((topup) => (
              <div
                key={topup.id}
                className={`rounded-lg border p-3 hover:shadow-sm transition-shadow cursor-pointer ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
                onClick={(e) => {
                  // Don't open details if clicking on interactive elements
                  if (
                    !e.target.closest("button") &&
                    !e.target.closest("input")
                  ) {
                    setSelectedTopup(topup);
                  }
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-mono truncate ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                      {topup.id.slice(0, 12)}...
                    </p>
                    <p className={`text-sm font-semibold truncate ${isDark ? "text-white" : "text-gray-900"}`}>
                      {topup.username ?? topup.name ?? topup.uid ?? "—"}
                    </p>
                  </div>
                  <span
                    className={
                      "inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full capitalize flex-shrink-0 " +
                      (topup.status === "completed" ||
                      topup.status === "success"
                        ? isDark ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-700"
                        : topup.status === "failed"
                        ? isDark ? "bg-red-900/30 text-red-400" : "bg-red-100 text-red-700"
                        : isDark ? "bg-yellow-900/30 text-yellow-400" : "bg-yellow-100 text-yellow-700")
                    }
                  >
                    {topup.status ?? "pending"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                  <div>
                    <span className={isDark ? "text-gray-400" : "text-gray-500"}>Amount:</span>
                    <span className={`font-semibold ml-1 ${isDark ? "text-white" : "text-gray-900"}`}>
                      ₹{topup.amount ?? topup.cost ?? topup.price ?? "—"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={isDark ? "text-gray-400" : "text-gray-500"}>Time:</span>
                    <span className={`ml-1 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                      {formatDate(topup.createdAt)}
                    </span>
                  </div>
                </div>

                <div className={`flex gap-1.5 pt-2 border-t ${isDark ? "border-gray-700" : "border-gray-100"}`}>
                  <button
                    onClick={() => handleToggle(topup)}
                    disabled={savingId === topup.id}
                    className={`flex-1 px-2 py-1.5 text-xs rounded-md border transition-colors disabled:opacity-50 ${isDark ? "border-gray-600 bg-gray-800 hover:bg-gray-700 text-gray-300" : "border-gray-300 bg-white hover:bg-gray-50 text-gray-700"}`}
                  >
                    {savingId === topup.id
                      ? "..."
                      : topup.status === "completed" ||
                        topup.status === "success"
                      ? "Pending"
                      : "Complete"}
                  </button>
                  <button
                    onClick={() => handleFail(topup)}
                    disabled={
                      savingId === topup.id || topup.status === "failed"
                    }
                    className={`flex-1 px-2 py-1.5 text-xs rounded-md border transition-colors disabled:opacity-50 ${isDark ? "border-red-700 bg-gray-800 text-red-400 hover:bg-red-900/30" : "border-red-300 bg-white text-red-600 hover:bg-red-50"}`}
                  >
                    {savingId === topup.id ? "..." : "Fail"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Topup Details Modal */}
      {selectedTopup && (
        <div className={`fixed inset-0 flex items-center justify-center z-50 p-4 ${isDark ? "bg-black/70" : "bg-black/50"} backdrop-blur-sm`}>
          <div className={`rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 ${isDark ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? "bg-purple-900/30" : "bg-purple-100"}`}>
                  <FaCoins className={isDark ? "text-purple-400" : "text-purple-600"} />
                </div>
                <h2 className={`text-xl font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                  Topup Details
                </h2>
              </div>
              <button
                onClick={() => setSelectedTopup(null)}
                className={`transition-colors ${isDark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"}`}
              >
                <FaTimes className="text-lg" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`rounded-lg p-4 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
                  <span className={`text-xs block mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    Topup ID
                  </span>
                  <p className={`text-xs font-mono break-all ${isDark ? "text-gray-200" : "text-gray-900"}`}>
                    {selectedTopup.id ?? "—"}
                  </p>
                </div>
                <div className={`rounded-lg p-4 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
                  <span className={`text-xs block mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    Status
                  </span>
                  <span
                    className={
                      "inline-flex items-center px-2 py-1 text-xs font-medium rounded-full capitalize " +
                      (selectedTopup.status === "completed" ||
                      selectedTopup.status === "success"
                        ? isDark ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-700"
                        : selectedTopup.status === "failed"
                        ? isDark ? "bg-red-900/30 text-red-400" : "bg-red-100 text-red-700"
                        : isDark ? "bg-yellow-900/30 text-yellow-400" : "bg-yellow-100 text-yellow-700")
                    }
                  >
                    {selectedTopup.status ?? "pending"}
                  </span>
                </div>
                <div className={`rounded-lg p-4 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
                  <span className={`text-xs block mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>User</span>
                  <p className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                    {selectedTopup.username ??
                      selectedTopup.name ??
                      selectedTopup.user ??
                      selectedTopup.uid ??
                      "—"}
                  </p>
                </div>
                <div className={`rounded-lg p-4 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
                  <span className={`text-xs block mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    Amount
                  </span>
                  <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                    ₹
                    {selectedTopup.amount ??
                      selectedTopup.cost ??
                      selectedTopup.price ??
                      "—"}
                  </p>
                </div>
                <div className={`rounded-lg p-4 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
                  <span className={`text-xs block mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    Created At
                  </span>
                  <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    {formatDate(selectedTopup.createdAt)}
                  </p>
                </div>
              </div>

              {/* Additional Topup Data */}
              {(() => {
                // Only show these specific fields in Additional Information
                const allowedFields = [
                  "date",
                  "gameUsername",
                  "id",
                  "item",
                  "payment",
                  "product",
                  "productId",
                  "status",
                  "time",
                  "type",
                  "uid",
                  "userId",
                  "username",
                  "utr",
                  "zoneId",
                  "api",
                  "completedAt",
                  "cost",
                  "createdAt",
                ];

                // Get fields that are in allowedFields but not already shown in main grid
                const mainGridFields = [
                  "id",
                  "status",
                  "username",
                  "name",
                  "user",
                  "uid",
                  "amount",
                  "cost",
                  "price",
                  "createdAt",
                ];

                const additionalFields = allowedFields.filter(
                  (field) => !mainGridFields.includes(field)
                );

                const fieldsToShow = additionalFields.filter((field) =>
                  selectedTopup.hasOwnProperty(field)
                );

                if (fieldsToShow.length === 0) return null;

                return (
                  <div className={`border-t pt-4 ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                    <h3 className={`text-sm font-semibold mb-3 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      Additional Information
                    </h3>
                    <div className={`rounded-lg p-4 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {fieldsToShow.map((key) => {
                          const value = selectedTopup[key];
                          return (
                            <div
                              key={key}
                              className="flex justify-between items-start gap-4 text-xs"
                            >
                              <span className={`font-medium capitalize ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                                {key.replace(/([A-Z])/g, " $1").trim()}:
                              </span>
                              <span className={`text-right break-all flex-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                                {typeof value === "object" && value !== null
                                  ? JSON.stringify(value, null, 2)
                                  : String(value ?? "—")}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedTopup(null)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${isDark ? "text-gray-300 bg-gray-700 hover:bg-gray-600" : "text-gray-700 bg-gray-100 hover:bg-gray-200"}`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
