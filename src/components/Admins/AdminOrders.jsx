import React, { useEffect, useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { db } from "../../config/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  doc,
} from "firebase/firestore";
import { FaTimes, FaShoppingBag } from "react-icons/fa";

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

export default function AdminOrders() {
  const { isDark } = useTheme();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null); // Selected order for details view

  useEffect(() => {
    setLoading(true);
    setError(null);

    const colRef = collection(db, "orders");
    const q = query(colRef, orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          // Filter out game account orders (product === "Game Account")
          .filter((order) => order.product !== "Game Account");
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
    setOrders((cur) =>
      cur.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );

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
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h1 className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Orders</h1>
        <span className={`text-xs px-2 py-1 rounded-full ${isDark ? "text-gray-400 bg-gray-800" : "text-gray-500 bg-gray-100"}`}>
          {orders.length} total
        </span>
      </div>

      {error && (
        <div className={`mb-3 p-2 rounded text-xs ${isDark ? "bg-red-900/30 text-red-400" : "bg-red-50 text-red-700"}`}>
          {error}
        </div>
      )}

      {loading ? (
        <div className={`text-xs py-4 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Loading orders…</div>
      ) : orders.length === 0 ? (
        <div className={`text-xs py-4 text-center rounded-lg ${isDark ? "text-gray-400 bg-gray-800" : "text-gray-600 bg-gray-50"}`}>
          No orders found.
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
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className={`transition-colors cursor-pointer ${isDark ? "hover:bg-gray-700/50" : "hover:bg-gray-50"}`}
                    onClick={(e) => {
                      // Don't open details if clicking on interactive elements
                      if (
                        !e.target.closest("button") &&
                        !e.target.closest("input")
                      ) {
                        setSelectedOrder(order);
                      }
                    }}
                  >
                    <td className="px-3 py-2">
                      <span className={`text-xs font-mono truncate block max-w-[120px] ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                        {order.id.slice(0, 8)}...
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`text-xs truncate block max-w-[120px] ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                        {order.username ?? order.buyer ?? "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`text-xs truncate block max-w-[150px] ${isDark ? "text-gray-300" : "text-gray-700"}`}
                        title={order.item ?? order.product ?? ""}
                      >
                        {order.item ?? order.product ?? "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`text-xs font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                        {order.cost != null ? `₹${order.cost}` : "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                        {formatDate(order.createdAt)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          "inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full capitalize " +
                          (order.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : order.status === "failed"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700")
                        }
                      >
                        {order.status ?? "pending"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggle(order)}
                          disabled={savingId === order.id}
                          className={`px-2 py-1 text-xs rounded-md border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? "border-gray-600 bg-gray-800 hover:bg-gray-700 text-gray-300" : "border-gray-300 bg-white hover:bg-gray-50 text-gray-700"}`}
                          title={
                            order.status === "completed"
                              ? "Mark pending"
                              : "Mark completed"
                          }
                        >
                          {savingId === order.id
                            ? "..."
                            : order.status === "completed"
                            ? "Pending"
                            : "Complete"}
                        </button>
                        <button
                          onClick={() => handleFail(order)}
                          disabled={
                            savingId === order.id || order.status === "failed"
                          }
                          className={`px-2 py-1 text-xs rounded-md border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? "border-red-700 bg-gray-800 text-red-400 hover:bg-red-900/30" : "border-red-300 bg-white text-red-600 hover:bg-red-50"}`}
                          title="Mark failed"
                        >
                          {savingId === order.id ? "..." : "Fail"}
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
            {orders.map((order) => (
              <div
                key={order.id}
                className={`rounded-lg border p-3 hover:shadow-sm transition-shadow cursor-pointer ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
                onClick={(e) => {
                  // Don't open details if clicking on interactive elements
                  if (
                    !e.target.closest("button") &&
                    !e.target.closest("input")
                  ) {
                    setSelectedOrder(order);
                  }
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-mono truncate ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                      {order.id.slice(0, 12)}...
                    </p>
                    <p className={`text-sm font-semibold truncate ${isDark ? "text-white" : "text-gray-900"}`}>
                      {order.username ?? order.buyer ?? "—"}
                    </p>
                  </div>
                  <span
                    className={
                      "inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full capitalize flex-shrink-0 " +
                      (order.status === "completed"
                        ? isDark ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-700"
                        : order.status === "failed"
                        ? isDark ? "bg-red-900/30 text-red-400" : "bg-red-100 text-red-700"
                        : isDark ? "bg-yellow-900/30 text-yellow-400" : "bg-yellow-100 text-yellow-700")
                    }
                  >
                    {order.status ?? "pending"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                  <div>
                    <span className={isDark ? "text-gray-400" : "text-gray-500"}>Item:</span>
                    <span className={`ml-1 truncate block ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                      {order.item ?? order.product ?? "—"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={isDark ? "text-gray-400" : "text-gray-500"}>Cost:</span>
                    <span className={`font-semibold ml-1 ${isDark ? "text-white" : "text-gray-900"}`}>
                      {order.cost != null ? `₹${order.cost}` : "—"}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className={isDark ? "text-gray-400" : "text-gray-500"}>Time:</span>
                    <span className={`ml-1 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                </div>

                <div className={`flex gap-1.5 pt-2 border-t ${isDark ? "border-gray-700" : "border-gray-100"}`}>
                  <button
                    onClick={() => handleToggle(order)}
                    disabled={savingId === order.id}
                    className={`flex-1 px-2 py-1.5 text-xs rounded-md border transition-colors disabled:opacity-50 ${isDark ? "border-gray-600 bg-gray-800 hover:bg-gray-700 text-gray-300" : "border-gray-300 bg-white hover:bg-gray-50 text-gray-700"}`}
                  >
                    {savingId === order.id
                      ? "..."
                      : order.status === "completed"
                      ? "Pending"
                      : "Complete"}
                  </button>
                  <button
                    onClick={() => handleFail(order)}
                    disabled={
                      savingId === order.id || order.status === "failed"
                    }
                    className={`flex-1 px-2 py-1.5 text-xs rounded-md border transition-colors disabled:opacity-50 ${isDark ? "border-red-700 bg-gray-800 text-red-400 hover:bg-red-900/30" : "border-red-300 bg-white text-red-600 hover:bg-red-50"}`}
                  >
                    {savingId === order.id ? "..." : "Fail"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className={`fixed inset-0 flex items-center justify-center z-50 p-4 ${isDark ? "bg-black/70" : "bg-black/50"} backdrop-blur-sm`}>
          <div className={`rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 ${isDark ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? "bg-purple-900/30" : "bg-purple-100"}`}>
                  <FaShoppingBag className={isDark ? "text-purple-400" : "text-purple-600"} />
                </div>
                <h2 className={`text-xl font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                  Order Details
                </h2>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className={`transition-colors ${isDark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"}`}
              >
                <FaTimes className="text-lg" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`rounded-lg p-4 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
                  <span className={`text-xs block mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    Order ID
                  </span>
                  <p className={`text-xs font-mono break-all ${isDark ? "text-gray-200" : "text-gray-900"}`}>
                    {selectedOrder.id ?? "—"}
                  </p>
                </div>
                <div className={`rounded-lg p-4 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
                  <span className={`text-xs block mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    Status
                  </span>
                  <span
                    className={
                      "inline-flex items-center px-2 py-1 text-xs font-medium rounded-full capitalize " +
                      (selectedOrder.status === "completed"
                        ? isDark ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-700"
                        : selectedOrder.status === "failed"
                        ? isDark ? "bg-red-900/30 text-red-400" : "bg-red-100 text-red-700"
                        : isDark ? "bg-yellow-900/30 text-yellow-400" : "bg-yellow-100 text-yellow-700")
                    }
                  >
                    {selectedOrder.status ?? "pending"}
                  </span>
                </div>
                <div className={`rounded-lg p-4 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
                  <span className={`text-xs block mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    Buyer
                  </span>
                  <p className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                    {selectedOrder.username ?? selectedOrder.buyer ?? "—"}
                  </p>
                </div>
                <div className={`rounded-lg p-4 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
                  <span className={`text-xs block mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Item</span>
                  <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    {selectedOrder.item ?? selectedOrder.product ?? "—"}
                  </p>
                </div>
                <div className={`rounded-lg p-4 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
                  <span className={`text-xs block mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Cost</span>
                  <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                    {selectedOrder.cost != null
                      ? `₹${selectedOrder.cost}`
                      : "—"}
                  </p>
                </div>
                <div className={`rounded-lg p-4 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
                  <span className={`text-xs block mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    Created At
                  </span>
                  <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    {formatDate(selectedOrder.createdAt)}
                  </p>
                </div>
              </div>

              {/* Additional Order Data */}
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
                  "buyer",
                  "item",
                  "product",
                  "cost",
                  "createdAt",
                ];

                const additionalFields = allowedFields.filter(
                  (field) => !mainGridFields.includes(field)
                );

                const fieldsToShow = additionalFields.filter((field) =>
                  selectedOrder.hasOwnProperty(field)
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
                          const value = selectedOrder[key];
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
                onClick={() => setSelectedOrder(null)}
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
