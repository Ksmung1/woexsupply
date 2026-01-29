import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { signOut } from "firebase/auth";
import {
  doc,
  onSnapshot,
  getDocs,
  query,
  collection,
  where,
  updateDoc,
  documentId,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../config/firebase";
import { useUser } from "../context/UserContext";
import { format } from "date-fns";
import {
  FaUser,
  FaTrophy,
  FaMedal,
  FaCoins,
  FaShoppingBag,
  FaEnvelope,
  FaPhone,
  FaCalendar,
  FaEdit,
  FaCheck,
  FaTimes,
  FaSpinner,
  FaCrown,
  FaChartLine,
  FaGamepad,
  FaClipboardList,
  FaSignOutAlt,
} from "react-icons/fa";

const Profile = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { user: ctxUser, setUser: setCtxUser, signInWithGoogle } = useUser();
  const uid = ctxUser?.uid ?? ctxUser?.id ?? null;

  // no redirect; show inline login CTA when not signed in
  if (!uid) {
    return (
      <div className={`min-h-screen-dvh flex items-center justify-center ${isDark ? "bg-gray-900" : "bg-white"}`}>
        <div className="text-center">
          <p className={isDark ? "text-gray-400 mb-4" : "text-gray-600 mb-4"}>
            Sign in to view your profile
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

  const [userDoc, setUserDoc] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [ordersCount, setOrdersCount] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [phoneInput, setPhoneInput] = useState("");
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Leaderboards state
  const [topSpenders, setTopSpenders] = useState([]);
  const [topOrderCount, setTopOrderCount] = useState([]);
  const [loadingLeaderboards, setLoadingLeaderboards] = useState(true);
  const [activeTab, setActiveTab] = useState("spenders");
  const [lastUpdated, setLastUpdated] = useState(null);

  // Subscribe to user document
  useEffect(() => {
    if (!uid) {
      setUserDoc(null);
      setLoadingUser(false);
      return;
    }
    setLoadingUser(true);
    const ref = doc(db, "users", uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = { uid: snap.id, ...snap.data() };
          setUserDoc(data);
          setPhoneInput((cur) => (cur ? cur : data.phone ?? ""));
          setLoadingUser(false);
        } else {
          setUserDoc(null);
          setPhoneInput("");
          setLoadingUser(false);
        }
      },
      (err) => {
        console.error("Profile: user snapshot error", err);
        setError("Unable to load profile.");
        setLoadingUser(false);
      }
    );

    return () => unsub();
  }, [uid]);

  // Compute ordersCount & totalSpent (including game accounts and charisma, excluding topups)
  useEffect(() => {
    let active = true;
    const compute = async () => {
      setOrdersLoading(true);
      setOrdersCount(0);
      setTotalSpent(0);

      if (!uid) {
        setOrdersCount(0);
        setTotalSpent(0);
        setOrdersLoading(false);
        return;
      }

      try {
        let matchedCount = 0;
        let matchedTotal = 0;

        // 1. Get game account purchases from accounts collection
        try {
          const accountsQuery = query(
            collection(db, "accounts"),
            where("uid", "==", uid),
            where("status", "in", ["pending", "sold"])
          );
          const accountsSnapshot = await getDocs(accountsQuery);
          accountsSnapshot.forEach((docSnap) => {
            const accountData = docSnap.data();
            const amount = Number(accountData?.rupees ?? 0) || 0;
            if (amount > 0) {
              matchedCount++;
              matchedTotal += amount;
            }
          });
        } catch (err) {
          console.error("Profile: error fetching accounts", err);
        }

        // 2. Get charisma purchases from orders collection (type === "charisma" OR isManual === true)
        try {
          // Query for charisma orders (type === "charisma")
          const charismaQuery = query(
            collection(db, "orders"),
            where("uid", "==", uid),
            where("type", "==", "charisma")
          );
          const charismaSnapshot = await getDocs(charismaQuery);
          const countedOrderIds = new Set();

          charismaSnapshot.forEach((docSnap) => {
            const orderData = docSnap.data();
            const status = orderData?.status;
            // Only count completed/successful orders
            if (status === "completed" || status === "success") {
              countedOrderIds.add(docSnap.id);
              const amount =
                Number(
                  orderData?.total ?? orderData?.amount ?? orderData?.cost ?? 0
                ) || 0;
              if (amount > 0) {
                matchedCount++;
                matchedTotal += amount;
              }
            }
          });

          // Query for manual orders (isManual === true) that aren't already counted
          const manualQuery = query(
            collection(db, "orders"),
            where("uid", "==", uid),
            where("isManual", "==", true)
          );
          const manualSnapshot = await getDocs(manualQuery);

          manualSnapshot.forEach((docSnap) => {
            // Skip if already counted as charisma
            if (countedOrderIds.has(docSnap.id)) return;

            const orderData = docSnap.data();
            const status = orderData?.status;
            // Only count completed/successful orders
            if (status === "completed" || status === "success") {
              const amount =
                Number(
                  orderData?.total ?? orderData?.amount ?? orderData?.cost ?? 0
                ) || 0;
              if (amount > 0) {
                matchedCount++;
                matchedTotal += amount;
              }
            }
          });
        } catch (err) {
          console.error("Profile: error fetching charisma orders", err);
        }

        // 3. Get regular orders (excluding topups and charisma/manual orders)
        // Regular orders are those in user.orders array that don't have type="charisma" or isManual=true
        const orderIds = Array.isArray(userDoc?.orders) ? userDoc.orders : [];
        if (orderIds.length > 0) {
          const chunks = [];
          for (let i = 0; i < orderIds.length; i += 10) {
            chunks.push(orderIds.slice(i, i + 10));
          }

          for (const chunk of chunks) {
            const q = query(
              collection(db, "orders"),
              where(documentId(), "in", chunk)
            );
            const snapshot = await getDocs(q);
            snapshot.forEach((docSnap) => {
              const o = docSnap.data();
              // Exclude charisma and manual orders (already counted above)
              if (o?.type === "charisma" || o?.isManual === true) {
                return;
              }

              const status = o?.status;
              const success =
                o?.success === undefined
                  ? status === "completed" || status === "success"
                  : !!o?.success;
              if (success) {
                matchedCount++;
                const amount =
                  Number(o?.total ?? o?.amount ?? o?.cost ?? 0) || 0;
                matchedTotal += amount;
              }
            });
          }
        }

        if (!active) return;
        setOrdersCount(matchedCount);
        setTotalSpent(matchedTotal);
        setOrdersLoading(false);
      } catch (err) {
        console.error("Profile: error computing orders", err);
        setError("Unable to load orders.");
        setOrdersLoading(false);
      }
    };

    compute();

    return () => {
      active = false;
    };
  }, [userDoc, uid]);

  // Phone save handler
  const savePhone = async () => {
    setError("");
    setSuccess("");
    if (!uid) {
      setError("No user logged in.");
      return;
    }
    const phone = (phoneInput || "").trim();
    const digits = phone.replace(/[^\d]/g, "");
    if (digits.length < 6) {
      setError("Please enter a valid phone number (at least 6 digits).");
      return;
    }

    setSavingPhone(true);
    try {
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, { phone });
      if (setCtxUser) {
        setCtxUser((prev) => ({ ...(prev || {}), phone }));
      }
      setSuccess("Phone number updated successfully!");
      setIsEditingPhone(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Profile: error saving phone", err);
      setError("Failed to save phone number. Please try again.");
    } finally {
      setSavingPhone(false);
    }
  };
  const logout = async () => {
    try {
      await signOut(auth);
      console.log("User signed out successfully");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Fetch leaderboards
  useEffect(() => {
    const fetchLeaderboards = async () => {
      setLoadingLeaderboards(true);
      try {
        const spendersDoc = await getDoc(
          doc(db, "leaderboards", "topSpenders")
        );
        if (spendersDoc.exists()) {
          const data = spendersDoc.data();
          setTopSpenders(data.data || []);
          if (data.updatedAt) {
            setLastUpdated(data.updatedAt);
          }
        }

        const ordersDoc = await getDoc(
          doc(db, "leaderboards", "topOrderCount")
        );
        if (ordersDoc.exists()) {
          setTopOrderCount(ordersDoc.data().data || []);
        }
      } catch (err) {
        console.error("Error fetching leaderboards:", err);
      } finally {
        setLoadingLeaderboards(false);
      }
    };

    fetchLeaderboards();

    const unsubscribeSpenders = onSnapshot(
      doc(db, "leaderboards", "topSpenders"),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setTopSpenders(data.data || []);
          if (data.updatedAt) {
            setLastUpdated(data.updatedAt);
          }
        }
      }
    );

    const unsubscribeOrders = onSnapshot(
      doc(db, "leaderboards", "topOrderCount"),
      (snap) => {
        if (snap.exists()) {
          setTopOrderCount(snap.data().data || []);
        }
      }
    );

    return () => {
      unsubscribeSpenders();
      unsubscribeOrders();
    };
  }, []);

  const createdAtDisplay = useMemo(() => {
    const ts = userDoc?.createdAt;
    if (!ts) return "—";
    try {
      const d = ts?.toDate
        ? ts.toDate()
        : typeof ts === "string"
        ? new Date(ts)
        : new Date(ts);
      return format(d, "PPP");
    } catch {
      return "—";
    }
  }, [userDoc]);

  // Get user rank
  const userRank = useMemo(() => {
    if (!uid) return null;
    const list = activeTab === "spenders" ? topSpenders : topOrderCount;
    const index = list.findIndex((u) => u.uid === uid);
    return index >= 0 ? index + 1 : null;
  }, [uid, topSpenders, topOrderCount, activeTab]);

  if (!uid) {
    return (
      <div className={`min-h-screen-dvh bg-gradient-to-br flex items-center justify-center px-4 ${isDark ? "from-gray-900 via-gray-800 to-gray-900" : "from-purple-50 via-indigo-50 to-pink-50"}`}>
        <div className={`max-w-md w-full rounded-3xl shadow-2xl p-8 text-center ${isDark ? "bg-gray-800" : "bg-white"}`}>
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center">
            <FaUser className="text-white text-4xl" />
          </div>
          <h2 className={`text-3xl font-bold mb-3 ${isDark ? "text-white" : "text-gray-800"}`}>
            Sign In Required
          </h2>
          <p className={isDark ? "text-gray-400" : "text-gray-600"}>
            Please sign in to view your profile and access all features.
          </p>
          <button
            onClick={() => navigate("/authentication-selection")}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Sign In Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen-dvh bg-gradient-to-br py-6 md:py-8 ${isDark ? "from-gray-900 via-gray-900 to-gray-800" : "from-gray-50 via-purple-50/30 to-indigo-50/30"}`}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-6 md:mb-8">
          <h1 className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-2 flex items-center gap-3 ${isDark ? "text-white" : "text-gray-800"}`}>
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
              <FaUser className="text-white text-lg md:text-xl" />
            </div>
            <span>My Profile</span>
          </h1>
          <p className={`text-sm md:text-base ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            Manage your account and track your activity
          </p>
        </div>

        {/* Profile Card Section */}
        {loadingUser ? (
          <div className={`rounded-2xl shadow-xl p-8 mb-6 ${isDark ? "bg-gray-800" : "bg-white"}`}>
            <div className="animate-pulse space-y-4">
              <div className={`w-32 h-32 rounded-full mx-auto ${isDark ? "bg-gray-700" : "bg-gray-200"}`} />
              <div className={`h-6 rounded w-48 mx-auto ${isDark ? "bg-gray-700" : "bg-gray-200"}`} />
              <div className={`h-4 rounded w-64 mx-auto ${isDark ? "bg-gray-700" : "bg-gray-200"}`} />
            </div>
          </div>
        ) : userDoc ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <div className={`rounded-2xl shadow-xl p-6 md:p-8 hover:shadow-2xl transition-all duration-300 border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
                <div className="flex flex-col items-center text-center">
                  {/* Avatar */}
                  <div className="relative mb-4">
                    <div className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden ring-4 ring-purple-100 shadow-lg">
                      {userDoc.photoURL ? (
                        <img
                          src={userDoc.photoURL}
                          alt={userDoc.name || userDoc.email || "avatar"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-3xl md:text-4xl font-bold">
                          {(userDoc.name || userDoc.email || "U")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      )}
                    </div>
                    {userDoc.role === "admin" && (
                      <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                        <FaCrown className="text-white text-sm" />
                      </div>
                    )}
                  </div>

                  {/* Name & Email */}
                  <h2 className={`text-xl md:text-2xl font-bold mb-1 ${isDark ? "text-white" : "text-gray-900"}`}>
                    {userDoc.name || "No name"}
                  </h2>
                  <p className={`text-sm mb-4 flex items-center justify-center gap-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    <FaEnvelope className="text-xs" />
                    {userDoc.email || "No email"}
                  </p>

                  {/* Member Since */}
                  <div className={`w-full mb-4 p-3 rounded-xl ${isDark ? "bg-gray-700/50" : "bg-gradient-to-r from-purple-50 to-indigo-50"}`}>
                    <div className={`flex items-center justify-center gap-2 text-xs mb-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      <FaCalendar className="text-purple-600" />
                      <span>Member since</span>
                    </div>
                    <div className={`text-sm font-semibold ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                      {createdAtDisplay}
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="w-full">
                    <label className={`text-xs font-semibold block mb-2 flex items-center gap-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      <FaPhone className="text-purple-600" />
                      <span>Phone Number</span>
                    </label>
                    {!isEditingPhone && userDoc.phone ? (
                      <div className={`flex items-center justify-between p-3 rounded-xl border ${isDark ? "bg-gray-700/50 border-gray-600" : "bg-gray-50 border-gray-200"}`}>
                        <span className={`text-sm font-medium ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                          {userDoc.phone}
                        </span>
                        <button
                          onClick={() => {
                            setIsEditingPhone(true);
                            setPhoneInput(userDoc.phone || "");
                            setError("");
                            setSuccess("");
                          }}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        >
                          <FaEdit className="text-sm" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <input
                          value={phoneInput}
                          onChange={(e) => {
                            setPhoneInput(e.target.value);
                            setError("");
                          }}
                          placeholder="Enter mobile number"
                          className={`w-full border-2 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${isDark ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400" : "border-gray-200 bg-white text-gray-900"}`}
                        />
                        <div className="flex gap-2">
                          <button
                            disabled={savingPhone}
                            onClick={savePhone}
                            className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-2 px-4 rounded-xl hover:from-purple-700 hover:to-indigo-700 disabled:opacity-60 transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                          >
                            {savingPhone ? (
                              <FaSpinner className="animate-spin" />
                            ) : (
                              <>
                                <FaCheck />
                                <span>Save</span>
                              </>
                            )}
                          </button>
                          <button
                            disabled={savingPhone}
                            onClick={() => {
                              setIsEditingPhone(false);
                              setPhoneInput(userDoc.phone || "");
                              setError("");
                            }}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors disabled:opacity-60"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      </div>
                    )}
                    {error && (
                      <div className={`mt-2 text-xs p-2 rounded-lg ${isDark ? "text-red-400 bg-red-900/30" : "text-red-600 bg-red-50"}`}>
                        {error}
                      </div>
                    )}
                    {success && (
                      <div className={`mt-2 text-xs p-2 rounded-lg ${isDark ? "text-green-400 bg-green-900/30" : "text-green-600 bg-green-50"}`}>
                        {success}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <div className="flex items-center justify-between mb-3">
                    <FaShoppingBag className="text-2xl opacity-80" />
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <FaChartLine className="text-xl" />
                    </div>
                  </div>
                  <div className="text-sm opacity-90 mb-1">Total Orders</div>
                  <div className="text-3xl font-bold">
                    {ordersLoading ? (
                      <FaSpinner className="animate-spin inline" />
                    ) : (
                      ordersCount.toLocaleString()
                    )}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <div className="flex items-center justify-between mb-3">
                    <FaCoins className="text-2xl opacity-80" />
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <FaChartLine className="text-xl" />
                    </div>
                  </div>
                  <div className="text-sm opacity-90 mb-1">Total Spent</div>
                  <div className="text-3xl font-bold">
                    {ordersLoading ? (
                      <FaSpinner className="animate-spin inline" />
                    ) : (
                      `₹${Number(totalSpent).toLocaleString()}`
                    )}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <div className="flex items-center justify-between mb-3">
                    <FaTrophy className="text-2xl opacity-80" />
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <FaMedal className="text-xl" />
                    </div>
                  </div>
                  <div className="text-sm opacity-90 mb-1">Your Rank</div>
                  <div className="text-3xl font-bold">
                    {userRank ? `#${userRank}` : "—"}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className={`rounded-2xl shadow-xl p-6 border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
                <h3 className={`text-lg font-bold mb-4 ${isDark ? "text-white" : "text-gray-800"}`}>
                  Quick Actions
                </h3>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                  <button
                    onClick={() => navigate("/orders")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200 border ${isDark ? "bg-gray-700/50 border-gray-600 hover:bg-gray-700" : "bg-gradient-to-br from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 border-purple-100"}`}
                  >
                    <FaShoppingBag className="text-purple-600 text-xl" />
                    <span className={`text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      Orders
                    </span>
                  </button>
                  <button
                    onClick={() => navigate("/accounts")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200 border ${isDark ? "bg-gray-700/50 border-gray-600 hover:bg-gray-700" : "bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 border-blue-100"}`}
                  >
                    <FaGamepad className="text-blue-600 text-xl" />
                    <span className={`text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      Accounts
                    </span>
                  </button>
                  <button
                    onClick={() => navigate("/queues")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200 border ${isDark ? "bg-gray-700/50 border-gray-600 hover:bg-gray-700" : "bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border-green-100"}`}
                  >
                    <FaClipboardList className="text-green-600 text-xl" />
                    <span className={`text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      Queues
                    </span>
                  </button>
                  <button
                    onClick={() => navigate("/wallet")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200 border ${isDark ? "bg-gray-700/50 border-gray-600 hover:bg-gray-700" : "bg-gradient-to-br from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100 border-yellow-100"}`}
                  >
                    <FaCoins className="text-yellow-600 text-xl" />
                    <span className={`text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      Wallet
                    </span>
                  </button>
                  <button
                    onClick={logout}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200 border ${isDark ? "bg-gray-700/50 border-gray-600 hover:bg-gray-700" : "bg-gradient-to-br from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100 border-yellow-100"}`}
                  >
                    <FaSignOutAlt className="text-red-600 text-xl" />
                    <span className={`text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      Logout
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={`rounded-2xl shadow-xl p-8 text-center ${isDark ? "bg-gray-800" : "bg-white"}`}>
            <p className={isDark ? "text-gray-400" : "text-gray-600"}>No profile data available.</p>
          </div>
        )}

        {/* Leaderboards Section */}
        <div className={`rounded-2xl shadow-xl p-6 md:p-8 border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h2 className={`text-2xl md:text-3xl font-bold mb-2 flex items-center gap-3 ${isDark ? "text-white" : "text-gray-800"}`}>
                <FaTrophy className="text-yellow-500" />
                Global Leaderboards
              </h2>
              {lastUpdated && (
                <p className={`text-xs md:text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  Last updated:{" "}
                  {format(
                    lastUpdated.toDate
                      ? lastUpdated.toDate()
                      : new Date(lastUpdated),
                    "PPp"
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className={`flex gap-2 mb-6 border-b overflow-x-auto ${isDark ? "border-gray-700" : "border-gray-200"}`}>
            <button
              onClick={() => setActiveTab("spenders")}
              className={`px-4 md:px-6 py-3 font-semibold transition-all duration-200 border-b-2 whitespace-nowrap ${
                activeTab === "spenders"
                  ? "border-purple-600 text-purple-600"
                  : isDark
                  ? "border-transparent text-gray-400 hover:text-gray-300"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <FaCoins className="inline mr-2" />
              Top Spenders
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-4 md:px-6 py-3 font-semibold transition-all duration-200 border-b-2 whitespace-nowrap ${
                activeTab === "orders"
                  ? "border-purple-600 text-purple-600"
                  : isDark
                  ? "border-transparent text-gray-400 hover:text-gray-300"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <FaShoppingBag className="inline mr-2" />
              Most Orders
            </button>
          </div>

          {/* Leaderboard Content */}
          {loadingLeaderboards ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {(activeTab === "spenders" ? topSpenders : topOrderCount).map(
                (user, index) => {
                  const isCurrentUser = uid && user.uid === uid;
                  const rank = index + 1;
                  const medalColor =
                    rank === 1
                      ? "from-yellow-400 to-yellow-600"
                      : rank === 2
                      ? "from-gray-300 to-gray-500"
                      : rank === 3
                      ? "from-orange-400 to-orange-600"
                      : "from-purple-100 to-indigo-100";

                  return (
                    <div
                      key={user.uid || index}
                      className={`flex items-center gap-3 md:gap-4 p-4 rounded-xl border-2 transition-all duration-200 ${
                        isCurrentUser
                          ? isDark
                          ? "bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border-purple-500 shadow-lg scale-105"
                          : "bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-400 shadow-lg scale-105"
                          : isDark
                          ? "bg-gray-800 border-gray-700 hover:shadow-md hover:scale-[1.02]"
                          : "bg-white border-gray-200 hover:shadow-md hover:scale-[1.02]"
                      }`}
                    >
                      {/* Rank */}
                      <div
                        className={`w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-r ${medalColor} flex items-center justify-center text-white font-bold text-sm md:text-lg shadow-md flex-shrink-0`}
                      >
                        {rank <= 3 ? (
                          <FaMedal className="text-xl md:text-2xl" />
                        ) : (
                          rank
                        )}
                      </div>

                      {/* Avatar */}
                      <div className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden ring-2 ring-gray-200 flex-shrink-0">
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt={user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg md:text-xl">
                            {(user.name || "A").charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={`font-bold truncate text-sm md:text-base ${isDark ? "text-white" : "text-gray-800"}`}>
                            {user.name || "Anonymous"}
                          </h3>
                          {isCurrentUser && (
                            <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full whitespace-nowrap">
                              You
                            </span>
                          )}
                        </div>
                        {user.email && (
                          <p className={`text-xs md:text-sm truncate ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                            {user.email}
                          </p>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="text-right flex-shrink-0">
                        {activeTab === "spenders" ? (
                          <>
                            <div className="text-lg md:text-2xl font-bold text-purple-600">
                              ₹{Number(user.totalSpent || 0).toLocaleString()}
                            </div>
                            <div className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                              {user.orderCount || 0}{" "}
                              {user.orderCount === 1 ? "order" : "orders"}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-lg md:text-2xl font-bold text-indigo-600">
                              {user.orderCount || 0}
                            </div>
                            <div className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                              ₹{Number(user.totalSpent || 0).toLocaleString()}{" "}
                              spent
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                }
              )}

              {(activeTab === "spenders" ? topSpenders : topOrderCount)
                .length === 0 && (
                <div className={`text-center py-12 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  <FaTrophy className={`text-4xl mx-auto mb-4 ${isDark ? "text-gray-600" : "text-gray-300"}`} />
                  <p>No leaderboard data available yet.</p>
                  <p className="text-sm mt-2">
                    Leaderboards update every hour.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
