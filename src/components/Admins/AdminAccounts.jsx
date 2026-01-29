import React, { useEffect, useState } from "react";
import { db } from "../../config/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaSpinner,
} from "react-icons/fa";
import { useTheme } from "../../context/ThemeContext";

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
  const { isDark } = useTheme();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState(null);
  const [buyerUsernames, setBuyerUsernames] = useState({}); // uid -> username mapping

  // Fetch buyer usernames for sold accounts
  useEffect(() => {
    const fetchBuyerUsernames = async () => {
      const soldAccounts = accounts.filter(
        (acc) => acc.status?.toLowerCase() === "sold" && acc.paymentMeta?.uid
      );

      if (soldAccounts.length === 0) return;

      // Get UIDs that we haven't fetched yet
      const uidsToFetch = soldAccounts
        .map((acc) => acc.paymentMeta.uid)
        .filter((uid) => uid && !buyerUsernames[uid]);

      if (uidsToFetch.length === 0) return;

      // Fetch usernames for UIDs we don't have yet
      const usernamePromises = uidsToFetch.map(async (uid) => {
        try {
          const userDoc = await getDoc(doc(db, "users", uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            return {
              uid,
              username: userData.name || userData.username || userData.email || uid,
            };
          }
        } catch (err) {
          console.error(`Error fetching user ${uid}:`, err);
        }
        return null;
      });

      const results = await Promise.all(usernamePromises);
      const newUsernames = {};
      results.forEach((result) => {
        if (result) {
          newUsernames[result.uid] = result.username;
        }
      });

      if (Object.keys(newUsernames).length > 0) {
        setBuyerUsernames((prev) => ({ ...prev, ...newUsernames }));
      }
    };

    fetchBuyerUsernames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts]);

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
    if (s === "sold") return <FaCheckCircle className={isDark ? "text-green-400" : "text-green-600"} />;
    if (s === "failed")
      return <FaTimesCircle className={isDark ? "text-red-400" : "text-red-600"} />;
    return <FaHourglassHalf className={isDark ? "text-yellow-400" : "text-yellow-600"} />;
  };

  const getBuyerDisplay = (account) => {
    // If sold and has paymentMeta.uid, show username from users collection
    if (account.status?.toLowerCase() === "sold" && account.paymentMeta?.uid) {
      const uid = account.paymentMeta.uid;
      const username = buyerUsernames[uid];
      if (username) {
        return username;
      }
      // If username not loaded yet, show loading or UID
      return `Loading... (${uid.slice(0, 8)}...)`;
    }
    // Fallback to old structure
    return account.boughtBy?.phoneNumber || account.boughtBy?.username || "—";
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <FaSpinner className={`animate-spin text-4xl ${isDark ? "text-purple-400" : "text-purple-600"}`} />
      </div>
    );
  }

  return (
    <div className="py-4 px-2 sm:px-4">
      <h2 className={`text-xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>Game Account Purchases</h2>

      {error && (
        <div className={`mb-4 border-l-4 p-4 ${isDark ? "bg-red-900/30 border-red-600" : "bg-red-50 border-red-400"}`}>
          <p className={`text-sm ${isDark ? "text-red-400" : "text-red-700"}`}>{error}</p>
        </div>
      )}

      {accounts.length === 0 ? (
        <div className={`p-6 rounded shadow text-center ${isDark ? "bg-gray-800" : "bg-white"}`}>
          <p className={isDark ? "text-gray-300" : "text-gray-700"}>No purchases yet.</p>
        </div>
      ) : (
        <div className={`rounded shadow overflow-x-auto ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border`}>
          <table className="min-w-full">
            <thead className={`border-b ${isDark ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
              <tr>
                <th className={`px-4 py-3 text-left text-xs font-semibold ${isDark ? "text-gray-400" : "text-gray-700"}`}>Game</th>
                <th className={`px-4 py-3 text-left text-xs font-semibold ${isDark ? "text-gray-400" : "text-gray-700"}`}>Buyer</th>
                <th className={`px-4 py-3 text-left text-xs font-semibold ${isDark ? "text-gray-400" : "text-gray-700"}`}>Amount</th>
                <th className={`px-4 py-3 text-left text-xs font-semibold ${isDark ? "text-gray-400" : "text-gray-700"}`}>Payment</th>
                <th className={`px-4 py-3 text-left text-xs font-semibold ${isDark ? "text-gray-400" : "text-gray-700"}`}>Status</th>
                <th className={`px-4 py-3 text-left text-xs font-semibold ${isDark ? "text-gray-400" : "text-gray-700"}`}>Date</th>
                <th className={`px-4 py-3 text-left text-xs font-semibold ${isDark ? "text-gray-400" : "text-gray-700"}`}>Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? "divide-gray-700" : "divide-gray-200"}`}>
              {accounts.map((a) => (
                <tr key={a.id} className={isDark ? "hover:bg-gray-700/50" : "hover:bg-gray-50"}>
                  <td className="px-4 py-3">
                    <div className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                      {a.label || a.gameLabel || "N/A"}
                    </div>
                    <div className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                      ID: {a.id}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className={isDark ? "text-white" : "text-gray-900"}>
                      {getBuyerDisplay(a)}
                    </div>
                    {a.status?.toLowerCase() === "sold" && a.paymentMeta?.uid && (
                      <div className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                        UID: {a.paymentMeta.uid.slice(0, 8)}...
                      </div>
                    )}
                  </td>

                  <td className={`px-4 py-3 font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                    ₹{a.paymentMeta?.amount || a.rupees || 0}
                  </td>

                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded ${isDark ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-800"}`}>
                      {(a.paymentMeta?.paymentType || a.boughtBy?.paymentMethod || "N/A")?.toUpperCase()}
                    </span>
                  </td>

                  <td className="px-4 py-3 flex items-center gap-2">
                    {getStatusIcon(a.status)}
                    <span className={`text-xs font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      {a.status?.toUpperCase() || "N/A"}
                    </span>
                  </td>

                  <td className={`px-4 py-3 text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    {formatDate(a.paymentMeta?.createdAt || a.boughtBy?.purchasedAt || a.date)}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {a.status?.toLowerCase() !== "sold" && (
                        <button
                          onClick={() => updateStatus(a.id, "sold")}
                          disabled={savingId === a.id}
                          className={`px-3 py-1 rounded text-xs transition-colors disabled:opacity-50 ${isDark ? "bg-green-600 hover:bg-green-700" : "bg-green-600 hover:bg-green-700"} text-white`}
                        >
                          {savingId === a.id ? (
                            <FaSpinner className="animate-spin inline" />
                          ) : (
                            "Mark Sold"
                          )}
                        </button>
                      )}

                      {a.status?.toLowerCase() !== "available" && (
                        <button
                          onClick={() =>
                            updateStatus(a.id, "available")
                          }
                          disabled={savingId === a.id}
                          className={`px-3 py-1 rounded text-xs transition-colors disabled:opacity-50 ${isDark ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-600 hover:bg-blue-700"} text-white`}
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
