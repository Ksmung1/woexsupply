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
import {
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaSpinner,
} from "react-icons/fa";

const formatDate = (val) => {
  if (!val) return "—";
  const date =
    typeof val?.toDate === "function" ? val.toDate() : new Date(val);
  if (isNaN(date)) return "—";

  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

export default function AdminAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);

    const q = query(
      collection(db, "gameAccounts"),
      orderBy("paymentMeta.createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setAccounts(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }))
        );
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError("Failed to load accounts");
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const updateStatus = async (accountId, newStatus) => {
    setSavingId(accountId);
    setError(null);

    const prev = accounts;
    setAccounts((cur) =>
      cur.map((a) =>
        a.id === accountId ? { ...a, status: newStatus } : a
      )
    );

    try {
      await updateDoc(doc(db, "gameAccounts", accountId), {
        status: newStatus,
      });
    } catch (err) {
      console.error(err);
      setAccounts(prev);
      setError("Failed to update status");
    } finally {
      setSavingId(null);
    }
  };

  const getStatusIcon = (status) => {
    const s = String(status).toLowerCase();
    if (s === "sold") return <FaCheckCircle className="text-green-600" />;
    if (s === "failed")
      return <FaTimesCircle className="text-red-600" />;
    return <FaHourglassHalf className="text-yellow-600" />;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <FaSpinner className="animate-spin text-4xl text-purple-600" />
      </div>
    );
  }

  return (
    <div className="py-4 px-2 sm:px-4">
      <h2 className="text-xl font-bold mb-4">Game Account Purchases</h2>

      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {accounts.length === 0 ? (
        <div className="bg-white p-6 rounded shadow text-center">
          No purchases yet.
        </div>
      ) : (
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="min-w-full divide-y">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs">Game</th>
                <th className="px-4 py-3 text-left text-xs">Buyer</th>
                <th className="px-4 py-3 text-left text-xs">Amount</th>
                <th className="px-4 py-3 text-left text-xs">Payment</th>
                <th className="px-4 py-3 text-left text-xs">Status</th>
                <th className="px-4 py-3 text-left text-xs">Date</th>
                <th className="px-4 py-3 text-left text-xs">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {accounts.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium">
                      {a.gameLabel || "N/A"}
                    </div>
                    <div className="text-xs text-gray-500">
                      ID: {a.id}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div>{a.boughtBy?.phoneNumber || "—"}</div>
                    <div className="text-xs text-gray-500">
                      {a.boughtBy?.username || "—"}
                    </div>
                  </td>

                  <td className="px-4 py-3 font-semibold">
                    ₹{a.paymentMeta?.amount || 0}
                  </td>

                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                      {a.boughtBy?.paymentMethod?.toUpperCase()}
                    </span>
                  </td>

                  <td className="px-4 py-3 flex items-center gap-2">
                    {getStatusIcon(a.status)}
                    <span className="text-xs font-semibold">
                      {a.status?.toUpperCase()}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatDate(a.boughtBy?.purchasedAt)}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {a.status !== "sold" && (
                        <button
                          onClick={() => updateStatus(a.id, "sold")}
                          disabled={savingId === a.id}
                          className="px-3 py-1 bg-green-600 text-white rounded text-xs"
                        >
                          {savingId === a.id ? (
                            <FaSpinner className="animate-spin inline" />
                          ) : (
                            "Mark Sold"
                          )}
                        </button>
                      )}

                      {a.status !== "available" && (
                        <button
                          onClick={() =>
                            updateStatus(a.id, "available")
                          }
                          disabled={savingId === a.id}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-xs"
                        >
                          {savingId === a.id ? (
                            <FaSpinner className="animate-spin inline" />
                          ) : (
                            "Mark Available"
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
