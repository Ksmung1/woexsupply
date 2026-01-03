import React, { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
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
  const { user } = useUser();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, "accounts"),
      where("uid", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const accountsList = [];
        snapshot.forEach((doc) => {
          accountsList.push({ id: doc.id, ...doc.data() });
        });
        setAccounts(accountsList);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching accounts:", error);
        // If orderBy fails, try without it
        const q2 = query(
          collection(db, "accounts"),
          where("uid", "==", user.uid)
        );
        const unsubscribe2 = onSnapshot(
          q2,
          (snapshot) => {
            const accountsList = [];
            snapshot.forEach((doc) => {
              accountsList.push({ id: doc.id, ...doc.data() });
            });
            // Sort by date on client side
            accountsList.sort((a, b) => {
              const dateA = a.createdAt?.toDate
                ? a.createdAt.toDate().getTime()
                : new Date(a.createdAt || 0).getTime();
              const dateB = b.createdAt?.toDate
                ? b.createdAt.toDate().getTime()
                : new Date(b.createdAt || 0).getTime();
              return dateB - dateA;
            });
            setAccounts(accountsList);
            setLoading(false);
          },
          (err) => {
            console.error("Error fetching accounts (fallback):", err);
            setAccounts([]);
            setLoading(false);
          }
        );
        return () => unsubscribe2();
      }
    );

    return () => unsubscribe();
  }, [user, navigate]);

  const formatDate = (dateValue) => {
    if (!dateValue) return "Date not available";
    try {
      let date;
      if (typeof dateValue?.toDate === "function") {
        date = dateValue.toDate();
      } else if (dateValue?.seconds) {
        date = new Date(dateValue.seconds * 1000);
      } else if (typeof dateValue === "string" || typeof dateValue === "number") {
        date = new Date(dateValue);
      } else {
        return "Invalid date";
      }
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }
      return format(date, "PPp");
    } catch (error) {
      return "Date not available";
    }
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
      return "bg-green-50 text-green-700 border-green-200";
    }
    if (s === "failed") {
      return "bg-red-50 text-red-700 border-red-200";
    }
    return "bg-yellow-50 text-yellow-700 border-yellow-200";
  };

  const statusOptions = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "Sold", label: "Sold" },
    { value: "Available", label: "Available" },
  ];

  const filteredAccounts =
    statusFilter === "all"
      ? accounts
      : accounts.filter(
          (acc) => acc.status?.toLowerCase() === statusFilter.toLowerCase()
        );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-purple-600 text-4xl mx-auto mb-4" />
          <p className="text-gray-600">Loading your accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl px-4 md:px-6 lg:px-8 mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            My Game Accounts
          </h1>
          <p className="text-gray-600">
            View the status of your purchased game accounts
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="mb-6 flex gap-3 overflow-x-auto pb-2">
          {statusOptions.map((option) => {
            const count =
              option.value === "all"
                ? accounts.length
                : accounts.filter(
                    (acc) =>
                      acc.status?.toLowerCase() === option.value.toLowerCase()
                  ).length;
            return (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value)}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all shadow-sm ${
                  statusFilter === option.value
                    ? "bg-blue-600 text-white shadow-lg scale-105"
                    : "bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                }`}
              >
                {option.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Accounts List */}
        {filteredAccounts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <FaGamepad className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              No accounts found
              {statusFilter !== "all" && ` with status "${statusFilter}"`}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              {statusFilter === "all"
                ? "You haven't purchased any game accounts yet."
                : "Try selecting a different filter or purchase a new account."}
            </p>
            {statusFilter === "all" && (
              <button
                onClick={() => navigate("/game-acc")}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                <FaGamepad className="w-5 h-5" />
                <span>Browse Game Accounts</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAccounts.map((account) => (
              <div
                key={account.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow"
              >
                {/* Image */}
                <div className="relative aspect-video bg-gray-200 overflow-hidden">
                  {account.images && account.images.length > 0 ? (
                    <img
                      src={account.images[0]}
                      alt={account.gameLabel}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <FaGamepad className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        account.status === "Sold"
                          ? "bg-green-500 text-white"
                          : account.status === "Available"
                          ? "bg-blue-500 text-white"
                          : "bg-yellow-500 text-white"
                      }`}
                    >
                      {account.status || "Pending"}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                    {account.gameLabel || "Game Account"}
                  </h3>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FaRupeeSign className="w-4 h-4" />
                      <span className="font-semibold text-gray-900">
                        ₹{account.rupees || 0}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FaPhone className="w-4 h-4" />
                      <span>{account.phoneNumber || "N/A"}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FaCalendar className="w-4 h-4" />
                      <span>{formatDate(account.createdAt)}</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2 p-3 rounded-lg border-2 bg-gray-50">
                    {getStatusIcon(account.status)}
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-500">
                        Status
                      </p>
                      <p
                        className={`text-sm font-semibold ${getStatusColor(
                          account.status
                        ).split(" ")[1]}`}
                      >
                        {String(account.status || "pending").toUpperCase()}
                      </p>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        account.payment === "coin"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      Paid via {account.payment === "coin" ? "Coin" : "UPI"}
                    </span>
                  </div>
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

