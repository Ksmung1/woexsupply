import React, { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { format } from "date-fns";
import {
  FaSpinner,
  FaCheckCircle,
  FaHourglassHalf,
  FaTimesCircle,
  FaGamepad,
  FaRupeeSign,
  FaCalendar,
  FaPhone,
} from "react-icons/fa";

const MyAccounts = () => {
  const { user, signInWithGoogle } = useUser();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!user) {
      return;
    }

    setLoading(true);

    const baseQuery = query(
      collection(db, "gameAccounts"),
      where("boughtBy.uid", "==", user.uid),
      orderBy("boughtBy.purchasedAt", "desc")
    );

    const unsubscribe = onSnapshot(
      baseQuery,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAccounts(list);
        setLoading(false);
      },
      async (error) => {
        console.error("Index missing, falling back:", error);

        // Fallback without orderBy
        const fallbackQuery = query(
          collection(db, "gameAccounts"),
          where("boughtBy.uid", "==", user.uid)
        );

        const unsubFallback = onSnapshot(fallbackQuery, (snap) => {
          const list = snap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          list.sort((a, b) => {
            const aTime = a.boughtBy?.purchasedAt?.toDate?.()?.getTime() || 0;
            const bTime = b.boughtBy?.purchasedAt?.toDate?.()?.getTime() || 0;
            return bTime - aTime;
          });

          setAccounts(list);
          setLoading(false);
        });

        return () => unsubFallback();
      }
    );

    return () => unsubscribe();
  }, [user, navigate]);

  const formatDate = (value) => {
    if (!value) return "N/A";
    try {
      const date =
        typeof value.toDate === "function"
          ? value.toDate()
          : new Date(value);
      return isNaN(date) ? "N/A" : format(date, "PPp");
    } catch {
      return "N/A";
    }
  };

  const getStatusIcon = (status) => {
    const s = String(status || "pending").toLowerCase();
    if (s === "sold") return <FaCheckCircle className="text-green-600" />;
    if (s === "failed") return <FaTimesCircle className="text-red-600" />;
    return <FaHourglassHalf className="text-yellow-600" />;
  };

  const statusOptions = ["all", "pending", "sold"];

  const filteredAccounts =
    statusFilter === "all"
      ? accounts
      : accounts.filter(
          (a) => a.status?.toLowerCase() === statusFilter
        );

  if (!user) {
    return (
      <div className={`min-h-screen-dvh flex items-center justify-center ${isDark ? "bg-gray-900" : "bg-white"}`}>
        <div className="text-center">
          <p className={isDark ? "text-gray-400 mb-4" : "text-gray-600 mb-4"}>
            Sign in to view your game accounts
          </p>
          <button
            onClick={signInWithGoogle}
            className="inline-flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold shadow-md"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`min-h-screen-dvh flex items-center justify-center ${isDark ? "bg-gray-900" : "bg-white"}`}>
        <FaSpinner className="animate-spin text-4xl text-blue-600" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen-dvh py-8 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className="max-w-7xl mx-auto px-4">
        <h1 className={`text-3xl font-bold mb-6 ${isDark ? "text-white" : "text-gray-900"}`}>My Game Accounts</h1>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          {statusOptions.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded ${
                statusFilter === s
                  ? "bg-blue-600 text-white"
                  : isDark
                  ? "bg-gray-800 border border-gray-700 text-gray-300"
                  : "bg-white border border-gray-300 text-gray-700"
              }`}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>

        {/* List */}
        {filteredAccounts.length === 0 ? (
          <div className={`text-center p-8 rounded shadow ${isDark ? "bg-gray-800" : "bg-white"}`}>
            <FaGamepad className={`mx-auto text-4xl mb-4 ${isDark ? "text-gray-600" : "text-gray-400"}`} />
            <p className={isDark ? "text-gray-400" : "text-gray-700"}>No purchased accounts found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAccounts.map((account) => (
              <div
                key={account.id}
                className={`rounded shadow overflow-hidden ${isDark ? "bg-gray-800" : "bg-white"}`}
              >
                {/* Image */}
                <div className={`aspect-video ${isDark ? "bg-gray-700" : "bg-gray-200"}`}>
                  {account.images?.[0] ? (
                    <img
                      src={account.images[0]}
                      alt={account.gameLabel}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <FaGamepad className={`text-4xl ${isDark ? "text-gray-600" : "text-gray-400"}`} />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 space-y-2">
                  <h3 className={`font-bold text-lg ${isDark ? "text-white" : "text-gray-900"}`}>
                    {account.gameLabel}
                  </h3>

                  <div className={`flex items-center gap-2 text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    <FaRupeeSign />
                    ₹{account.paymentMeta?.amount || 0}
                  </div>

                  <div className={`flex items-center gap-2 text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    <FaPhone />
                    {account.boughtBy?.phoneNumber || "N/A"}
                  </div>

                  <div className={`flex items-center gap-2 text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    <FaCalendar />
                    {formatDate(account.boughtBy?.purchasedAt)}
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    {getStatusIcon(account.status)}
                    <span className={`font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      {account.status?.toUpperCase()}
                    </span>
                  </div>

                  <span className={`inline-block mt-2 px-3 py-1 text-xs rounded ${isDark ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-800"}`}>
                    Paid via {account.boughtBy?.paymentMethod?.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyAccounts;
