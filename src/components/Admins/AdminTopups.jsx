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
        <h1 className="text-lg font-semibold text-gray-900">Topups</h1>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {topups.length} total
        </span>
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-50 text-red-700 rounded text-xs">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-xs text-gray-500 py-4">Loading topups…</div>
      ) : topups.length === 0 ? (
        <div className="text-xs text-gray-600 py-4 text-center bg-gray-50 rounded-lg">
          No topups found.
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto bg-white rounded-lg border border-gray-200">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {topups.map((topup) => (
                  <tr
                    key={topup.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
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
                      <span className="text-xs font-mono text-gray-600 truncate block max-w-[120px]">
                        {topup.id.slice(0, 8)}...
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-xs text-gray-800 truncate block max-w-[120px]">
                        {topup.username ??
                          topup.name ??
                          topup.user ??
                          topup.uid ??
                          "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-xs font-semibold text-gray-900">
                        ₹{topup.amount ?? topup.cost ?? topup.price ?? "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-xs text-gray-500">
                        {formatDate(topup.createdAt)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          "inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full capitalize " +
                          (topup.status === "completed" ||
                          topup.status === "success"
                            ? "bg-green-100 text-green-700"
                            : topup.status === "failed"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700")
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
                          className="px-2 py-1 text-xs rounded-md border border-gray-300 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                          className="px-2 py-1 text-xs rounded-md border border-red-300 bg-white text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-sm transition-shadow cursor-pointer"
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
                    <p className="text-xs font-mono text-gray-500 truncate">
                      {topup.id.slice(0, 12)}...
                    </p>
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {topup.username ?? topup.name ?? topup.uid ?? "—"}
                    </p>
                  </div>
                  <span
                    className={
                      "inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full capitalize flex-shrink-0 " +
                      (topup.status === "completed" ||
                      topup.status === "success"
                        ? "bg-green-100 text-green-700"
                        : topup.status === "failed"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700")
                    }
                  >
                    {topup.status ?? "pending"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                  <div>
                    <span className="text-gray-500">Amount:</span>
                    <span className="text-gray-900 font-semibold ml-1">
                      ₹{topup.amount ?? topup.cost ?? topup.price ?? "—"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-500">Time:</span>
                    <span className="text-gray-600 ml-1">
                      {formatDate(topup.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-1.5 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => handleToggle(topup)}
                    disabled={savingId === topup.id}
                    className="flex-1 px-2 py-1.5 text-xs rounded-md border border-gray-300 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
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
                    className="flex-1 px-2 py-1.5 text-xs rounded-md border border-red-300 bg-white text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
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
        <div className="fixed inset-0  bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <FaCoins className="text-purple-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Topup Details
                </h2>
              </div>
              <button
                onClick={() => setSelectedTopup(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes className="text-lg" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <span className="text-xs text-gray-500 block mb-1">
                    Topup ID
                  </span>
                  <p className="text-xs font-mono text-gray-900 break-all">
                    {selectedTopup.id ?? "—"}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <span className="text-xs text-gray-500 block mb-1">
                    Status
                  </span>
                  <span
                    className={
                      "inline-flex items-center px-2 py-1 text-xs font-medium rounded-full capitalize " +
                      (selectedTopup.status === "completed" ||
                      selectedTopup.status === "success"
                        ? "bg-green-100 text-green-700"
                        : selectedTopup.status === "failed"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700")
                    }
                  >
                    {selectedTopup.status ?? "pending"}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <span className="text-xs text-gray-500 block mb-1">User</span>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedTopup.username ??
                      selectedTopup.name ??
                      selectedTopup.user ??
                      selectedTopup.uid ??
                      "—"}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <span className="text-xs text-gray-500 block mb-1">
                    Amount
                  </span>
                  <p className="text-sm font-semibold text-gray-900">
                    ₹
                    {selectedTopup.amount ??
                      selectedTopup.cost ??
                      selectedTopup.price ??
                      "—"}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <span className="text-xs text-gray-500 block mb-1">
                    Created At
                  </span>
                  <p className="text-sm text-gray-700">
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
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      Additional Information
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {fieldsToShow.map((key) => {
                          const value = selectedTopup[key];
                          return (
                            <div
                              key={key}
                              className="flex justify-between items-start gap-4 text-xs"
                            >
                              <span className="text-gray-500 font-medium capitalize">
                                {key.replace(/([A-Z])/g, " $1").trim()}:
                              </span>
                              <span className="text-gray-700 text-right break-all flex-1">
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
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
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
