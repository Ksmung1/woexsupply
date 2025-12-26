import React, { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot, getDocs, query, collection, where, updateDoc, documentId, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { useUser } from "../context/UserContext";
import { format } from "date-fns";
import { FaUser, FaTrophy, FaMedal, FaCoins, FaShoppingBag } from "react-icons/fa";

/**
 * Profile.jsx
 *
 * - Shows user photo, name, email, createdAt
 * - If phone missing, allows input + save
 * - Counts total orders (user.orders array; shows 0 if none)
 * - Sums totalSpent by looking up the orders collection for matching IDs and summing amounts
 * - Responsive, Tailwind-based UI
 *
 * NOTES:
 * - This expects your user document to live at "users/{uid}" and contain:
 *     - name, email, photoURL, createdAt (timestamp), phone (optional), orders: string[] (order IDs)
 * - Orders collection is expected at "orders" with documents where doc.id matches the IDs in user.orders
 *   and each order doc has fields like: success (boolean) and total / amount / cost (number).
 */

const Profile = () => {
  const { user: ctxUser, setUser: setCtxUser } = useUser(); // from your UserContext
  const uid = ctxUser?.uid ?? ctxUser?.id ?? null;

  const [userDoc, setUserDoc] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [ordersCount, setOrdersCount] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [phoneInput, setPhoneInput] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);
  const [error, setError] = useState("");

  // Leaderboards state
  const [topSpenders, setTopSpenders] = useState([]);
  const [topOrderCount, setTopOrderCount] = useState([]);
  const [loadingLeaderboards, setLoadingLeaderboards] = useState(true);
  const [activeTab, setActiveTab] = useState("spenders"); // "spenders" or "orders"
  const [lastUpdated, setLastUpdated] = useState(null);

  // subscribe to user document
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
          // prefill phone input when doc arrives (but don't overwrite if user typed)
          setPhoneInput((cur) => (cur ? cur : data.phone ?? ""));
          setLoadingUser(false);
        } else {
          // no doc found
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

  // compute ordersCount & totalSpent by fetching orders collection for user's order IDs
  useEffect(() => {
    let active = true;
    const compute = async () => {
      setOrdersLoading(true);
      setOrdersCount(0);
      setTotalSpent(0);

      const orderIds = Array.isArray(userDoc?.orders) ? userDoc.orders : [];
      if (!orderIds.length) {
        setOrdersCount(0);
        setTotalSpent(0);
        setOrdersLoading(false);
        return;
      }

      try {
        // Firestore 'in' queries accept max 10 items. We'll chunk if necessary.
        const chunks = [];
        for (let i = 0; i < orderIds.length; i += 10) {
          chunks.push(orderIds.slice(i, i + 10));
        }

        let matchedCount = 0;
        let matchedTotal = 0;

        for (const chunk of chunks) {
          const q = query(collection(db, "orders"), where(documentId(), "in", chunk));
          const snapshot = await getDocs(q);
          snapshot.forEach((docSnap) => {
            const o = docSnap.data();
            // consider order success flag; default to true if missing
            const success = o?.success === undefined ? true : !!o?.success;
            if (success) {
              matchedCount++;
              const amount = Number(o?.total ?? o?.amount ?? o?.cost ?? 0) || 0;
              matchedTotal += amount;
            }
          });
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
  }, [userDoc]);

  // phone save handler
  const savePhone = async () => {
    setError("");
    if (!uid) {
      setError("No user logged in.");
      return;
    }
    const phone = (phoneInput || "").trim();
    // basic validation: digits, +, -, spaces allowed; require 6+ digits
    const digits = phone.replace(/[^\d]/g, "");
    if (digits.length < 6) {
      setError("Please enter a valid phone number (at least 6 digits).");
      return;
    }

    setSavingPhone(true);
    try {
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, { phone });
      // optimistic update in context (if available)
      if (setCtxUser) {
        setCtxUser((prev) => ({ ...(prev || {}), phone }));
      }
    } catch (err) {
      console.error("Profile: error saving phone", err);
      setError("Failed to save phone number. Please try again.");
    } finally {
      setSavingPhone(false);
    }
  };

  // Fetch leaderboards
  useEffect(() => {
    const fetchLeaderboards = async () => {
      setLoadingLeaderboards(true);
      try {
        // Fetch top spenders
        const spendersDoc = await getDoc(doc(db, "leaderboards", "topSpenders"));
        if (spendersDoc.exists()) {
          const data = spendersDoc.data();
          setTopSpenders(data.data || []);
          if (data.updatedAt) {
            setLastUpdated(data.updatedAt);
          }
        }

        // Fetch top order count
        const ordersDoc = await getDoc(doc(db, "leaderboards", "topOrderCount"));
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

    // Set up real-time listener for leaderboards updates
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
    // handle Firestore Timestamp or ISO string or Date
    try {
      const d = ts?.toDate ? ts.toDate() : typeof ts === "string" ? new Date(ts) : new Date(ts);
      return format(d, "PPP");
    } catch {
      return "—";
    }
  }, [userDoc]);

  // UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-indigo-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <FaTrophy className="text-purple-600" />
            Leaderboards
          </h1>
          <p className="text-gray-600">Top players and spenders on our platform</p>
        </div>

        {/* Leaderboards Section - Always visible */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            {/* Header with last updated */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Global Leaderboards</h2>
                {lastUpdated && (
                  <p className="text-xs text-gray-500 mt-1">
                    Last updated: {format(lastUpdated.toDate ? lastUpdated.toDate() : new Date(lastUpdated), "PPp")}
                  </p>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200">
              <button
                onClick={() => setActiveTab("spenders")}
                className={`px-6 py-3 font-semibold transition-all duration-200 border-b-2 ${
                  activeTab === "spenders"
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <FaCoins className="inline mr-2" />
                Top Spenders
              </button>
              <button
                onClick={() => setActiveTab("orders")}
                className={`px-6 py-3 font-semibold transition-all duration-200 border-b-2 ${
                  activeTab === "orders"
                    ? "border-purple-600 text-purple-600"
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
                {(activeTab === "spenders" ? topSpenders : topOrderCount).map((user, index) => {
                  const isCurrentUser = uid && user.uid === uid;
                  const rank = index + 1;
                  const medalColor =
                    rank === 1 ? "from-yellow-400 to-yellow-600" :
                    rank === 2 ? "from-gray-300 to-gray-500" :
                    rank === 3 ? "from-orange-400 to-orange-600" :
                    "from-purple-100 to-indigo-100";

                  return (
                    <div
                      key={user.uid || index}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 ${
                        isCurrentUser
                          ? "bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-400 shadow-lg"
                          : "bg-white border-gray-200 hover:shadow-md"
                      }`}
                    >
                      {/* Rank */}
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${medalColor} flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                        {rank <= 3 ? (
                          <FaMedal className="text-2xl" />
                        ) : (
                          rank
                        )}
                      </div>

                      {/* Avatar */}
                      <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-gray-200">
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt={user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xl">
                            {(user.name || "A").charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-800 truncate">
                            {user.name || "Anonymous"}
                            {isCurrentUser && (
                              <span className="ml-2 text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">
                                You
                              </span>
                            )}
                          </h3>
                        </div>
                        {user.email && (
                          <p className="text-sm text-gray-500 truncate">{user.email}</p>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="text-right">
                        {activeTab === "spenders" ? (
                          <>
                            <div className="text-2xl font-bold text-purple-600">
                              ₹{Number(user.totalSpent || 0).toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {user.orderCount || 0} {user.orderCount === 1 ? "order" : "orders"}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-2xl font-bold text-indigo-600">
                              {user.orderCount || 0}
                            </div>
                            <div className="text-xs text-gray-500">
                              ₹{Number(user.totalSpent || 0).toLocaleString()} spent
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}

                {((activeTab === "spenders" ? topSpenders : topOrderCount).length === 0) && (
                  <div className="text-center py-12 text-gray-500">
                    <FaTrophy className="text-4xl mx-auto mb-4 text-gray-300" />
                    <p>No leaderboard data available yet.</p>
                    <p className="text-sm mt-2">Leaderboards update every hour.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Profile Section - Only show if logged in */}
        {!uid && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-8 text-center border-2 border-purple-200">
            <FaUser className="text-5xl text-purple-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Sign in to view your profile</h2>
            <p className="text-gray-600 mb-4">Create an account to track your orders, spending, and see your ranking!</p>
          </div>
        )}

        {uid && (
          <>
            <div className="mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                <FaUser className="text-purple-600" />
                Your Profile
              </h2>
              <p className="text-gray-600">Manage your account and view your activity</p>
            </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Profile card */}
        <div className="col-span-1 bg-white border border-gray-200 rounded-xl p-6 shadow-lg">
          {loadingUser ? (
            <div className="animate-pulse space-y-3">
              <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
              <div className="h-3 bg-gray-200 rounded w-5/6 mx-auto" />
            </div>
          ) : userDoc ? (
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-28 h-28 rounded-full overflow-hidden ring-1 ring-gray-100">
                {userDoc.photoURL ? (
                  <img
                    src={userDoc.photoURL}
                    alt={userDoc.name || userDoc.email || "avatar"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold">
                    {(userDoc.name || userDoc.email || "U").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900">{userDoc.name || "No name"}</h2>
                <p className="text-sm text-gray-500">{userDoc.email || "No email"}</p>
              </div>

              <div className="w-full mt-2">
                <div className="text-xs text-gray-500">Member since</div>
                <div className="text-sm font-medium text-gray-800">{createdAtDisplay}</div>
              </div>

              <div className="w-full mt-3">
                <label className="text-xs text-gray-500 block mb-1">Mobile number</label>
                {userDoc.phone ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="text-sm font-medium">{userDoc.phone}</div>
                    <button
                      onClick={() => setPhoneInput(userDoc.phone || "")}
                      className="text-xs text-blue-600 underline"
                    >
                      Edit
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="Enter mobile number"
                      className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    <button
                      disabled={savingPhone}
                      onClick={savePhone}
                      className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-60"
                    >
                      {savingPhone ? "Saving..." : "Save"}
                    </button>
                  </div>
                )}
              </div>

              {error && <div className="text-xs text-red-600 mt-2">{error}</div>}
            </div>
          ) : (
            <div className="text-center text-sm text-gray-600 py-8">No profile data available.</div>
          )}
        </div>

        {/* Right top: Stats */}
        <div className="col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-lg flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Account summary</h3>
            <div className="text-sm text-gray-500">Welcome back</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-gray-200 bg-gradient-to-br from-purple-50 to-indigo-50 text-center hover:shadow-md transition-shadow">
              <div className="text-sm text-gray-600 font-medium">Total Orders</div>
              <div className="mt-2 text-2xl font-bold text-purple-700">
                {ordersLoading ? "…" : ordersCount}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 bg-gradient-to-br from-green-50 to-emerald-50 text-center hover:shadow-md transition-shadow">
              <div className="text-sm text-gray-600 font-medium">Total Spent</div>
              <div className="mt-2 text-2xl font-bold text-green-700">
                {ordersLoading ? "…" : `₹${Number(totalSpent).toLocaleString()}`}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 bg-gradient-to-br from-blue-50 to-cyan-50 text-center hover:shadow-md transition-shadow">
              <div className="text-sm text-gray-600 font-medium">Phone Number</div>
              <div className="mt-2 text-lg font-semibold text-blue-700">{userDoc?.phone ?? "Not set"}</div>
            </div>
          </div>

          {/* Recent orders preview (optional) */}
          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-2">Recent orders</h4>
            <div className="space-y-2">
              {/* We only have an orders count and fetched total - if you want full order listing,
                  you can fetch the snapshots above and store them. For now we show the ids if present */}
              {userDoc?.orders?.length ? (
                userDoc.orders.slice(0, 6).map((id) => (
                  <div key={id} className="flex items-center justify-between bg-white p-3 rounded-md border">
                    <div className="text-sm text-gray-700 truncate">{id}</div>
                    <div className="text-sm text-gray-500">view</div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500">No orders yet.</div>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">

            <button
              onClick={() => {
                // navigate to orders page if you have one
                window.location.href = "/orders";
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold hover:from-purple-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all"
            >
              View All Orders
            </button>
          </div>
        </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
};

export default Profile;
