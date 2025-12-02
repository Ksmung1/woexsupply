import React, { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot, getDocs, query, collection, where, updateDoc, documentId } from "firebase/firestore";
import { db } from "../config/firebase";
import { useUser } from "../context/UserContext";
import { format } from "date-fns";

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
    <div className="max-w-5xl mt-20 mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Profile card */}
        <div className="col-span-1 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
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
        <div className="col-span-2 bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Account summary</h3>
            <div className="text-sm text-gray-500">Welcome back</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 rounded-lg border border-gray-100 bg-gray-50 text-center">
              <div className="text-sm text-gray-500">Total orders</div>
              <div className="mt-2 text-xl font-bold text-gray-900">
                {ordersLoading ? "…" : ordersCount}
              </div>
            </div>

            <div className="p-3 rounded-lg border border-gray-100 bg-gray-50 text-center">
              <div className="text-sm text-gray-500">Total spent</div>
              <div className="mt-2 text-xl font-bold text-gray-900">
                {ordersLoading ? "…" : `₦${Number(totalSpent).toLocaleString()}`}
              </div>
            </div>

            <div className="p-3 rounded-lg border border-gray-100 bg-gray-50 text-center">
              <div className="text-sm text-gray-500">Saved phone</div>
              <div className="mt-2 text-lg text-gray-900">{userDoc?.phone ?? "—"}</div>
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
              className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
            >
              View all orders
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
