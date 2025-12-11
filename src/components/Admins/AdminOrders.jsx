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

/**
 * AdminOrders (updated)
 * - Shows a table of ALL orders (realtime)
 * - Two actions per order:
 *    1) Toggle (Completed <-> Pending)
 *    2) Mark Failed
 *
 * - Uses optimistic UI + rollback on error.
 */

const formatDate = (val) => {
  if (!val) return "—";
  if (typeof val?.toDate === "function") return val.toDate().toLocaleString();
  try {
    return new Date(val).toLocaleString();
  } catch {
    return String(val);
  }
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const colRef = collection(db, "orders");
    const q = query(colRef, orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setOrders(list);
        setLoading(false);
      },
      (err) => {
        console.error("AdminOrders onSnapshot error:", err);
        setError("Failed to load orders.");
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const updateStatus = async (orderId, newStatus) => {
    setSavingId(orderId);
    setError(null);

    const prev = orders;
    setOrders((cur) => cur.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));

    try {
      const ref = doc(db, "orders", orderId);
      await updateDoc(ref, { status: newStatus });
    } catch (err) {
      console.error("Failed to update order status", err);
      setError("Failed to update status. Changes reverted.");
      setOrders(prev);
    } finally {
      setSavingId(null);
    }
  };

  const handleToggle = (order) => {
    const current = String(order.status ?? "pending").toLowerCase();
    const next = current === "completed" ? "pending" : "completed";
    updateStatus(order.id, next);
  };

  const handleFail = (order) => {
    updateStatus(order.id, "failed");
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Admin — Orders</h1>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">{error}</div>}

      {loading ? (
        <div className="text-sm text-gray-500">Loading orders…</div>
      ) : orders.length === 0 ? (
        <div className="text-sm text-gray-600">No orders found.</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded shadow-sm border">
          <table className="min-w-full divide-y">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Order ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Buyer</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">IGN / Zone</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Item</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Cost</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Created At</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-gray-800">{order.id}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{order.username ?? order.buyer ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {order.gameUsername ?? "—"}
                    {order.userId ? ` / ${order.userId} | ${order.zoneId}` : ""}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{order.item ?? order.product ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{order.cost != null ? `₹${order.cost}` : "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDate(order.createdAt)}</td>

                  <td className="px-4 py-3 text-sm">
                    <span
                      className={
                        "inline-flex items-center px-2 py-1 text-xs font-medium rounded-full capitalize " +
                        (order.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : order.status === "failed"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800")
                      }
                    >
                      {order.status ?? "pending"}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-sm text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggle(order)}
                        disabled={savingId === order.id}
                        className="px-3 py-1 rounded border bg-white text-sm"
                        title={order.status === "completed" ? "Mark as pending" : "Mark as completed"}
                      >
                        {savingId === order.id ? "Saving…" : order.status === "completed" ? "Set Pending" : "Set Completed"}
                      </button>

                      <button
                        onClick={() => handleFail(order)}
                        disabled={savingId === order.id || order.status === "failed"}
                        className="px-3 py-1 rounded border bg-white text-sm text-red-600"
                        title="Mark as failed"
                      >
                        {savingId === order.id ? "Saving…" : order.status === "failed" ? "Failed" : "Mark Failed"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {orders.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-sm text-gray-600">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
