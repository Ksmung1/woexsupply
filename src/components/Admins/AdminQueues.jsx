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
import { useTheme } from "../../context/ThemeContext";

/**
 * AdminQueues
 * - Shows a table of ALL queues (realtime)
 * - Two actions per queue:
 *    1) Toggle (Completed <-> Pending)
 *    2) Mark Failed
 *
 * - Uses optimistic UI + rollback on error.
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

export default function AdminQueues() {
  const { isDark } = useTheme();
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const colRef = collection(db, "queues");
    const q = query(colRef, orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          // Filter out UPI payments without UTR (unpaid orders)
          .filter((queue) => {
            const isUpi =
              queue.payment === "upi" || queue.paymentType === "upi";
            const hasUtr = queue.utr && queue.utr.trim() !== "";
            // If it's UPI payment and no UTR, exclude it (they didn't pay)
            if (isUpi && !hasUtr) {
              return false;
            }
            return true;
          });
        setQueues(list);
        setLoading(false);
      },
      (err) => {
        console.error("AdminQueues onSnapshot error:", err);
        setError("Failed to load queues.");
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const updateStatus = async (queueId, newStatus) => {
    setSavingId(queueId);
    setError(null);

    const prev = queues;
    setQueues((cur) =>
      cur.map((q) => (q.id === queueId ? { ...q, status: newStatus } : q))
    );

    try {
      const ref = doc(db, "queues", queueId);
      await updateDoc(ref, { status: newStatus });
    } catch (err) {
      console.error("Failed to update queue status", err);
      setError("Failed to update status. Changes reverted.");
      setQueues(prev);
    } finally {
      setSavingId(null);
    }
  };

  const handleToggle = (queue) => {
    const current = String(queue.status ?? "pending").toLowerCase();
    const next = current === "completed" ? "pending" : "completed";
    updateStatus(queue.id, next);
  };

  const handleFail = (queue) => {
    updateStatus(queue.id, "failed");
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h1 className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Queues</h1>
        <span className={`text-xs px-2 py-1 rounded-full ${isDark ? "text-gray-400 bg-gray-800" : "text-gray-500 bg-gray-100"}`}>
          {queues.length} total
        </span>
      </div>

      {error && (
        <div className={`mb-3 p-2 rounded text-xs ${isDark ? "bg-red-900/30 text-red-400" : "bg-red-50 text-red-700"}`}>
          {error}
        </div>
      )}

      {loading ? (
        <div className={`text-xs py-4 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Loading queues…</div>
      ) : queues.length === 0 ? (
        <div className={`text-xs py-4 text-center rounded-lg ${isDark ? "text-gray-400 bg-gray-800" : "text-gray-600 bg-gray-50"}`}>
          No queues found.
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
                    Buyer
                  </th>
                  <th className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                    Item
                  </th>
                  <th className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                    Type
                  </th>
                  <th className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                    Cost
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
                {queues.map((queue) => (
                  <tr
                    key={queue.id}
                    className={`transition-colors ${isDark ? "hover:bg-gray-700/50" : "hover:bg-gray-50"}`}
                  >
                    <td className="px-3 py-2">
                      <span className={`text-xs font-mono truncate block max-w-[120px] ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                        {queue.id.slice(0, 8)}...
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`text-xs truncate block max-w-[120px] ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                        {queue.username ?? "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`text-xs truncate block max-w-[150px] ${isDark ? "text-gray-300" : "text-gray-700"}`}
                        title={queue.item ?? ""}
                      >
                        {queue.item ?? "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`text-xs capitalize truncate block max-w-[100px] ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        {queue.type ?? "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`text-xs font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                        {queue.cost != null ? `₹${queue.cost}` : "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                        {formatDate(queue.createdAt)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          "inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full capitalize " +
                          (queue.status === "completed"
                            ? isDark ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-700"
                            : queue.status === "failed"
                            ? isDark ? "bg-red-900/30 text-red-400" : "bg-red-100 text-red-700"
                            : isDark ? "bg-yellow-900/30 text-yellow-400" : "bg-yellow-100 text-yellow-700")
                        }
                      >
                        {queue.status ?? "pending"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggle(queue)}
                          disabled={savingId === queue.id}
                          className={`px-2 py-1 text-xs rounded-md border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? "border-gray-600 bg-gray-800 hover:bg-gray-700 text-gray-300" : "border-gray-300 bg-white hover:bg-gray-50 text-gray-700"}`}
                          title={
                            queue.status === "completed"
                              ? "Mark pending"
                              : "Mark completed"
                          }
                        >
                          {savingId === queue.id
                            ? "..."
                            : queue.status === "completed"
                            ? "Pending"
                            : "Complete"}
                        </button>
                        <button
                          onClick={() => handleFail(queue)}
                          disabled={
                            savingId === queue.id || queue.status === "failed"
                          }
                          className={`px-2 py-1 text-xs rounded-md border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? "border-red-700 bg-gray-800 text-red-400 hover:bg-red-900/30" : "border-red-300 bg-white text-red-600 hover:bg-red-50"}`}
                          title="Mark failed"
                        >
                          {savingId === queue.id ? "..." : "Fail"}
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
            {queues.map((queue) => (
              <div
                key={queue.id}
                className={`rounded-lg border p-3 hover:shadow-sm transition-shadow ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-mono truncate ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                      {queue.id.slice(0, 12)}...
                    </p>
                    <p className={`text-sm font-semibold truncate ${isDark ? "text-white" : "text-gray-900"}`}>
                      {queue.username ?? "—"}
                    </p>
                  </div>
                  <span
                    className={
                      "inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full capitalize flex-shrink-0 " +
                      (queue.status === "completed"
                        ? isDark ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-700"
                        : queue.status === "failed"
                        ? isDark ? "bg-red-900/30 text-red-400" : "bg-red-100 text-red-700"
                        : isDark ? "bg-yellow-900/30 text-yellow-400" : "bg-yellow-100 text-yellow-700")
                    }
                  >
                    {queue.status ?? "pending"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                  <div>
                    <span className={isDark ? "text-gray-400" : "text-gray-500"}>Item:</span>
                    <span className={`ml-1 truncate block ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                      {queue.item ?? "—"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={isDark ? "text-gray-400" : "text-gray-500"}>Cost:</span>
                    <span className={`font-semibold ml-1 ${isDark ? "text-white" : "text-gray-900"}`}>
                      {queue.cost != null ? `₹${queue.cost}` : "—"}
                    </span>
                  </div>
                  <div>
                    <span className={isDark ? "text-gray-400" : "text-gray-500"}>Type:</span>
                    <span className={`ml-1 capitalize ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                      {queue.type ?? "—"}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className={isDark ? "text-gray-400" : "text-gray-500"}>Time:</span>
                    <span className={`ml-1 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                      {formatDate(queue.createdAt)}
                    </span>
                  </div>
                </div>

                <div className={`flex gap-1.5 pt-2 border-t ${isDark ? "border-gray-700" : "border-gray-100"}`}>
                  <button
                    onClick={() => handleToggle(queue)}
                    disabled={savingId === queue.id}
                    className={`flex-1 px-2 py-1.5 text-xs rounded-md border transition-colors disabled:opacity-50 ${isDark ? "border-gray-600 bg-gray-800 hover:bg-gray-700 text-gray-300" : "border-gray-300 bg-white hover:bg-gray-50 text-gray-700"}`}
                  >
                    {savingId === queue.id
                      ? "..."
                      : queue.status === "completed"
                      ? "Pending"
                      : "Complete"}
                  </button>
                  <button
                    onClick={() => handleFail(queue)}
                    disabled={
                      savingId === queue.id || queue.status === "failed"
                    }
                    className={`flex-1 px-2 py-1.5 text-xs rounded-md border transition-colors disabled:opacity-50 ${isDark ? "border-red-700 bg-gray-800 text-red-400 hover:bg-red-900/30" : "border-red-300 bg-white text-red-600 hover:bg-red-50"}`}
                  >
                    {savingId === queue.id ? "..." : "Fail"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
