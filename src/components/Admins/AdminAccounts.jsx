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
import { FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaSpinner } from "react-icons/fa";

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

export default function AdminAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const colRef = collection(db, "accounts");
    const q = query(colRef, orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAccounts(list);
        setLoading(false);
      },
      (err) => {
        console.error("AdminAccounts onSnapshot error:", err);
        setError("Failed to load accounts.");
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const updateAccountStatus = async (accountId, newStatus) => {
    setSavingId(accountId);
    setError(null);

    const prev = accounts;
    setAccounts((cur) =>
      cur.map((a) => (a.id === accountId ? { ...a, status: newStatus } : a))
    );

    try {
      const ref = doc(db, "accounts", accountId);
      await updateDoc(ref, { status: newStatus });

      // If marking as Sold or Available, also update the game account status
      if (newStatus === "Sold" || newStatus === "Available") {
        const account = accounts.find((a) => a.id === accountId);
        if (account && account.gameAccountId) {
          const gameRef = doc(db, "gameAccounts", account.gameAccountId);
          await updateDoc(gameRef, { status: newStatus });
        }
      }
    } catch (err) {
      console.error("Failed to update account status", err);
      setError("Failed to update status. Changes reverted.");
      setAccounts(prev);
    } finally {
      setSavingId(null);
    }
  };

  const handleMarkSold = (account) => {
    updateAccountStatus(account.id, "Sold");
  };

  const handleMarkAvailable = (account) => {
    updateAccountStatus(account.id, "Available");
  };

  const getStatusIcon = (status) => {
    const s = String(status || "pending").toLowerCase();
    if (s === "completed" || s === "sold") {
      return <FaCheckCircle className="text-green-600 text-lg" />;
    }
    if (s === "failed") {
      return <FaTimesCircle className="text-red-600 text-lg" />;
    }
    return <FaHourglassHalf className="text-yellow-600 text-lg" />;
  };

  const getStatusColor = (status) => {
    const s = String(status || "pending").toLowerCase();
    if (s === "completed" || s === "sold") {
      return "text-green-700 bg-green-50";
    }
    if (s === "failed") {
      return "text-red-700 bg-red-50";
    }
    return "text-yellow-700 bg-yellow-50";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FaSpinner className="animate-spin text-purple-600 text-4xl" />
      </div>
    );
  }

  if (error && accounts.length === 0) {
    return (
      <div className="py-4 px-4">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 px-2 sm:px-4">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
          Game Account Purchases
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Manage game account purchases and their status
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <p className="text-yellow-700 text-sm">{error}</p>
        </div>
      )}

      {accounts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-600">No account purchases yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Game Account
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    WhatsApp Number
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {accounts.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {account.gameLabel || "N/A"}
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {account.gameAccountId || "N/A"}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {account.phoneNumber || account.contact || "N/A"}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Buyer: {account.username || "N/A"}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        ₹{account.rupees || 0}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          account.payment === "coin"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {account.payment === "coin" ? "Coin" : "UPI"}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(account.status)}
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            account.status
                          )}`}
                        >
                          {String(account.status || "pending").toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(account.createdAt)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        {account.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleMarkSold(account)}
                              disabled={savingId === account.id}
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                            >
                              {savingId === account.id ? (
                                <FaSpinner className="animate-spin inline" />
                              ) : (
                                "Mark Sold"
                              )}
                            </button>
                            <button
                              onClick={() => handleMarkAvailable(account)}
                              disabled={savingId === account.id}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                            >
                              {savingId === account.id ? (
                                <FaSpinner className="animate-spin inline" />
                              ) : (
                                "Mark Available"
                              )}
                            </button>
                          </>
                        )}
                        {account.status === "Sold" && (
                          <button
                            onClick={() => handleMarkAvailable(account)}
                            disabled={savingId === account.id}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                          >
                            {savingId === account.id ? (
                              <FaSpinner className="animate-spin inline" />
                            ) : (
                              "Mark Available"
                            )}
                          </button>
                        )}
                        {account.status === "Available" && (
                          <button
                            onClick={() => handleMarkSold(account)}
                            disabled={savingId === account.id}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                          >
                            {savingId === account.id ? (
                              <FaSpinner className="animate-spin inline" />
                            ) : (
                              "Mark Sold"
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
        </div>
      )}
    </div>
  );
}

