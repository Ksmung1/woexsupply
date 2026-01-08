import React, { useEffect, useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { db } from "../../config/firebase"; // your initialized Firestore instance
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  startAt,
  endAt,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { FaSpinner, FaTimes } from "react-icons/fa";

const USERS_COLLECTION = "users"; // change if your collection name is different

export default function AdminUsers() {
  const { isDark } = useTheme();
  const [users, setUsers] = useState([]); // full or queried list from Firestore
  const [display, setDisplay] = useState([]); // filtered list shown to UI
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);
  const [roleFilter, setRoleFilter] = useState("all"); // "all", "customer", "reseller"
  const [updatingRole, setUpdatingRole] = useState(null); // Track which user's role is being updated
  const [updatingBalance, setUpdatingBalance] = useState(null); // Track which user's balance is being updated
  const [balanceInputs, setBalanceInputs] = useState({}); // Track balance input values
  const [balanceConfirm, setBalanceConfirm] = useState(null); // { userId, user, oldBalance, newBalance }

  // debounce input to avoid too many queries
  const [debounced, setDebounced] = useState(search);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setError(null);
    setLoading(true);

    // if search is empty -> subscribe to whole collection (real-time)
    if (!debounced) {
      const colRef = collection(db, "users");

      // optional: orderBy username so UI is predictable
      const q = query(colRef);

      const unsub = onSnapshot(
        q,
        (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          // Sort users alphabetically by username/name (includes all users, even those without roles)
          list.sort((a, b) => {
            const nameA = (a.username || a.name || "").toLowerCase();
            const nameB = (b.username || b.name || "").toLowerCase();
            return nameA.localeCompare(nameB);
          });
          // Ensure all users are included (users without roles are treated as customers)
          setUsers(list);
          setDisplay(list);
          // Initialize balance inputs
          const initialBalances = {};
          list.forEach((u) => {
            if (u.id || u.uid) {
              initialBalances[u.id ?? u.uid] = u.balance ?? 0;
            }
          });
          setBalanceInputs(initialBalances);
          setLoading(false);
        },
        (err) => {
          console.error("onSnapshot users error:", err);
          setError("Failed to load users.");
          setLoading(false);
        }
      );

      return () => unsub();
    }

    // if there's a search term -> do prefix query
    // works for prefix matches: username starts with `debounced`
    // requires an index on username (simple ordered field)
    const doQuery = async () => {
      try {
        const colRef = collection(db, USERS_COLLECTION);
        // build prefix query: username >= debounced AND username <= debounced + \uf8ff
        const q = query(
          colRef,
          orderBy("username"),
          startAt(debounced),
          endAt(debounced + "\uf8ff")
        );

        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // Sort users alphabetically by username/name (includes all users, even those without roles)
        list.sort((a, b) => {
          const nameA = (a.username || a.name || "").toLowerCase();
          const nameB = (b.username || b.name || "").toLowerCase();
          return nameA.localeCompare(nameB);
        });
        // All users are included, including those without roles (treated as customers)
        setUsers(list);
        setDisplay(list);
        // Initialize balance inputs
        const initialBalances = {};
        list.forEach((u) => {
          if (u.id || u.uid) {
            initialBalances[u.id ?? u.uid] = u.balance ?? 0;
          }
        });
        setBalanceInputs(initialBalances);
      } catch (err) {
        console.error("search users error:", err);
        setError("Search failed. Falling back to client-side filtering.");
        // fallback: try reading whole collection once and filter locally
        try {
          const colRef = collection(db, USERS_COLLECTION);
          const allSnap = await getDocs(query(colRef, orderBy("username")));
          const all = allSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
          // Sort users alphabetically by username/name (includes all users, even those without roles)
          all.sort((a, b) => {
            const nameA = (a.username || a.name || "").toLowerCase();
            const nameB = (b.username || b.name || "").toLowerCase();
            return nameA.localeCompare(nameB);
          });
          // All users are included, including those without roles (treated as customers)
          setUsers(all);
          const filtered = all.filter((u) =>
            String(u.username ?? "")
              .toLowerCase()
              .includes(debounced.toLowerCase())
          );
          // Filtered results also include users without roles
          setDisplay(filtered);
          // Initialize balance inputs
          const initialBalances = {};
          all.forEach((u) => {
            if (u.id || u.uid) {
              initialBalances[u.id ?? u.uid] = u.balance ?? 0;
            }
          });
          setBalanceInputs(initialBalances);
        } catch (fallbackErr) {
          console.error("fallback fetch error:", fallbackErr);
        }
      } finally {
        setLoading(false);
      }
    };

    doQuery();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]); // run when debounced search changes

  // client-side filter when user types quickly (immediate UX) and role filter
  useEffect(() => {
    let filtered = [...users]; // Create a copy to avoid mutating original

    // Apply role filter (users without roles are treated as customers and included)
    if (roleFilter !== "all") {
      filtered = filtered.filter((u) => {
        // Treat users without roles (null, undefined, empty) as customers
        const userRole = u.role || "customer";
        return userRole === roleFilter;
      });
    }

    // Apply search filter (includes all users, even those without roles)
    if (debounced) {
      const lower = debounced.toLowerCase();
      filtered = filtered.filter((u) =>
        String(u.username ?? u.name ?? "")
          .toLowerCase()
          .includes(lower)
      );
    }

    // Ensure alphabetical sorting is maintained (all users including those without roles)
    filtered.sort((a, b) => {
      const nameA = (a.username || a.name || "").toLowerCase();
      const nameB = (b.username || b.name || "").toLowerCase();
      return nameA.localeCompare(nameB);
    });

    setDisplay(filtered);
  }, [debounced, users, roleFilter]);

  // Toggle user role between customer and reseller
  const toggleUserRole = async (userId, currentRole) => {
    if (updatingRole === userId) return; // Prevent double clicks

    setUpdatingRole(userId);
    try {
      const userRef = doc(db, USERS_COLLECTION, userId);
      const newRole = currentRole === "reseller" ? "customer" : "reseller";
      await updateDoc(userRef, {
        role: newRole,
      });
    } catch (err) {
      console.error("Error updating user role:", err);
      setError("Failed to update user role.");
    } finally {
      setUpdatingRole(null);
    }
  };

  // Show confirmation dialog for balance update
  const confirmBalanceUpdate = (userId, newBalance) => {
    const user = users.find((u) => (u.id ?? u.uid) === userId);
    if (!user) return;

    const parsedBalance = parseFloat(newBalance);
    if (isNaN(parsedBalance)) {
      setError("Invalid balance amount.");
      return;
    }

    const oldBalance = user.balance ?? 0;
    setBalanceConfirm({
      userId,
      user,
      oldBalance,
      newBalance: parsedBalance,
    });
  };

  // Update user balance (called after confirmation)
  const updateBalance = async () => {
    if (!balanceConfirm) return;
    const { userId, newBalance } = balanceConfirm;

    if (updatingBalance === userId) return; // Prevent double clicks

    setUpdatingBalance(userId);
    try {
      const userRef = doc(db, USERS_COLLECTION, userId);
      await updateDoc(userRef, {
        balance: newBalance,
      });
      // Clear the input value after successful update
      setBalanceInputs((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
      setBalanceConfirm(null); // Close confirmation dialog
    } catch (err) {
      console.error("Error updating user balance:", err);
      setError("Failed to update user balance.");
    } finally {
      setUpdatingBalance(null);
    }
  };

  // Handle balance input change
  const handleBalanceChange = (userId, value) => {
    setBalanceInputs((prev) => ({
      ...prev,
      [userId]: value,
    }));
  };

  const formatUserDate = (val) => {
    if (!val) return "—";
    let date;
    if (typeof val?.toDate === "function") {
      date = val.toDate();
    } else {
      try {
        date = new Date(val);
      } catch {
        return "—";
      }
    }
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / 86400000);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffDays < 1) return "Today";
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffMonths < 1) return `${Math.floor(diffDays / 7)}w ago`;
    if (diffMonths < 12) return `${diffMonths}mo ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h1 className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Users</h1>
        <div className="flex items-center gap-3">
          {/* Role Toggle */}
          <div className={`flex items-center gap-2 rounded-lg p-1 ${isDark ? "bg-gray-800" : "bg-gray-100"}`}>
            <button
              onClick={() => setRoleFilter("all")}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                roleFilter === "all"
                  ? isDark
                  ? "bg-gray-700 text-purple-400 shadow-sm"
                  : "bg-white text-purple-600 shadow-sm"
                  : isDark
                  ? "text-gray-400 hover:text-gray-200"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setRoleFilter("customer")}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                roleFilter === "customer"
                  ? "bg-white text-purple-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Customer
            </button>
            <button
              onClick={() => setRoleFilter("reseller")}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                roleFilter === "reseller"
                  ? "bg-white text-purple-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Reseller
            </button>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${isDark ? "text-gray-400 bg-gray-800" : "text-gray-500 bg-gray-100"}`}>
            {display.length} {loading ? "loading..." : "shown"}
          </span>
        </div>
      </div>

      <div className="mb-3 flex gap-2 items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search username..."
          className={`px-3 py-1.5 border rounded-lg text-sm flex-1 sm:max-w-xs focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${isDark ? "border-gray-600 bg-gray-800 text-white" : "border-gray-300 bg-white text-gray-900"}`}
        />
      </div>

      {error && (
        <div className={`mb-3 p-2 rounded text-xs ${isDark ? "bg-red-900/30 text-red-400" : "bg-red-50 text-red-700"}`}>
          {error}
        </div>
      )}

      {/* Desktop Table View */}
      <div className={`hidden lg:block overflow-x-auto rounded-lg border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        <table className="min-w-full">
          <thead className={`border-b ${isDark ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
            <tr>
              <th className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                #
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Username
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Email
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Balance
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Role
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                UID
              </th>
            </tr>
          </thead>

          <tbody className={`divide-y ${isDark ? "divide-gray-700" : "divide-gray-100"}`}>
            {display.map((u, i) => {
              // Treat users without roles as customers
              const userRole = u.role || "customer";
              const isUpdating = updatingRole === (u.id ?? u.uid);
              const isUpdatingBalance = updatingBalance === (u.id ?? u.uid);
              const currentBalance =
                balanceInputs[u.id ?? u.uid] !== undefined
                  ? balanceInputs[u.id ?? u.uid]
                  : u.balance ?? 0;
              const userId = u.id ?? u.uid;

              return (
                <tr
                  key={userId ?? i}
                  className={`transition-colors ${isDark ? "hover:bg-gray-700/50" : "hover:bg-gray-50"}`}
                >
                  <td className="px-3 py-2">
                    <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>#{i + 1}</span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`text-xs font-medium truncate block max-w-[150px] ${isDark ? "text-white" : "text-gray-900"}`}>
                      {u.name ?? u.username ?? "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`text-xs truncate block max-w-[200px] ${isDark ? "text-gray-300" : "text-gray-600"}`}
                      title={u.email ?? ""}
                    >
                      {u.email ?? "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className="text-xs text-gray-600 truncate block max-w-[150px]"
                      title={u.phone ?? ""}
                    >
                      {u.phone ?? "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={currentBalance}
                        onChange={(e) =>
                          handleBalanceChange(userId, e.target.value)
                        }
                        onBlur={(e) => {
                          const newValue = parseFloat(e.target.value);
                          if (
                            !isNaN(newValue) &&
                            newValue !== parseFloat(u.balance ?? 0)
                          ) {
                            confirmBalanceUpdate(userId, e.target.value);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.target.blur();
                          }
                        }}
                        disabled={isUpdatingBalance}
                        className={`w-24 px-2 py-1 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:cursor-not-allowed ${isDark ? "border-gray-600 bg-gray-800 text-white disabled:bg-gray-700" : "border-gray-300 bg-white text-gray-900 disabled:bg-gray-100"}`}
                      />
                      {isUpdatingBalance && (
                        <FaSpinner className="animate-spin text-purple-600 text-xs" />
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">
                        {userRole === "reseller"
                          ? "Reseller"
                          : userRole === "admin"
                          ? "Admin"
                          : "Customer"}
                      </span>
                      <button
                        onClick={() => toggleUserRole(userId, userRole)}
                        disabled={isUpdating || userRole === "admin"}
                        className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                          userRole === "reseller"
                            ? "bg-purple-600"
                            : "bg-gray-300"
                        } ${
                          isUpdating || userRole === "admin"
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer"
                        }`}
                        role="switch"
                        aria-checked={userRole === "reseller"}
                        aria-label={`Toggle role to ${
                          userRole === "reseller" ? "customer" : "reseller"
                        }`}
                      >
                        {isUpdating ? (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <FaSpinner className="animate-spin text-white text-xs" />
                          </span>
                        ) : (
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              userRole === "reseller"
                                ? "translate-x-5"
                                : "translate-x-1"
                            }`}
                          />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                      {formatUserDate(u.createdAt)}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`text-xs font-mono truncate block max-w-[180px] ${isDark ? "text-gray-400" : "text-gray-500"}`}
                      title={userId ?? ""}
                    >
                      {userId ?? "—"}
                    </span>
                  </td>
                </tr>
              );
            })}

            {display.length === 0 && !loading && (
              <tr>
                <td
                  colSpan={8}
                  className={`px-3 py-6 text-center text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
                >
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile/Tablet Card View */}
      <div className="lg:hidden space-y-2">
        {display.length === 0 && !loading ? (
          <div className={`text-center py-6 text-xs rounded-lg border ${isDark ? "text-gray-400 bg-gray-800 border-gray-700" : "text-gray-500 bg-gray-50 border-gray-200"}`}>
            No users found.
          </div>
        ) : (
          display.map((u, i) => {
            // Treat users without roles as customers
            const userRole = u.role || "customer";
            const isUpdating = updatingRole === (u.id ?? u.uid);
            const isUpdatingBalance = updatingBalance === (u.id ?? u.uid);
            const currentBalance =
              balanceInputs[u.id ?? u.uid] !== undefined
                ? balanceInputs[u.id ?? u.uid]
                : u.balance ?? 0;
            const userId = u.id ?? u.uid;

            return (
              <div
                key={userId ?? i}
                className={`rounded-lg border p-3 hover:shadow-sm transition-shadow ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>#{i + 1}</span>
                  <p className={`text-sm font-semibold truncate flex-1 ${isDark ? "text-white" : "text-gray-900"}`}>
                    {u.name ?? u.username ?? "—"}
                  </p>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className={isDark ? "text-gray-400" : "text-gray-500"}>Email:</span>
                    <span className={`ml-1 truncate block ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      {u.email ?? "—"}
                    </span>
                  </div>
                  <div>
                    <span className={isDark ? "text-gray-400" : "text-gray-500"}>Phone:</span>
                    <span className={`ml-1 truncate block ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      {u.phone ?? "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={isDark ? "text-gray-400" : "text-gray-500"}>Balance:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={currentBalance}
                          onChange={(e) =>
                            handleBalanceChange(userId, e.target.value)
                          }
                          onBlur={(e) => {
                            const newValue = parseFloat(e.target.value);
                            if (
                              !isNaN(newValue) &&
                              newValue !== parseFloat(u.balance ?? 0)
                            ) {
                              confirmBalanceUpdate(userId, e.target.value);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.target.blur();
                            }
                          }}
                          disabled={isUpdatingBalance}
                          className={`w-20 px-2 py-1 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:cursor-not-allowed ${isDark ? "border-gray-600 bg-gray-800 text-white disabled:bg-gray-700" : "border-gray-300 bg-white text-gray-900 disabled:bg-gray-100"}`}
                        />
                        {isUpdatingBalance && (
                          <FaSpinner className="animate-spin text-purple-600 text-xs" />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={isDark ? "text-gray-400" : "text-gray-500"}>Role:</span>
                      <span className={`text-xs ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        {userRole === "reseller"
                          ? "Reseller"
                          : userRole === "admin"
                          ? "Admin"
                          : "Customer"}
                      </span>
                      <button
                        onClick={() => toggleUserRole(userId, userRole)}
                        disabled={isUpdating || userRole === "admin"}
                        className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 ${
                          userRole === "reseller"
                            ? "bg-purple-600"
                            : "bg-gray-300"
                        } ${
                          isUpdating || userRole === "admin"
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer"
                        }`}
                        role="switch"
                        aria-checked={userRole === "reseller"}
                        aria-label={`Toggle role to ${
                          userRole === "reseller" ? "customer" : "reseller"
                        }`}
                      >
                        {isUpdating ? (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <FaSpinner className="animate-spin text-white text-xs" />
                          </span>
                        ) : (
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              userRole === "reseller"
                                ? "translate-x-5"
                                : "translate-x-1"
                            }`}
                          />
                        )}
                      </button>
                    </div>
                    <div>
                      <span className={isDark ? "text-gray-400" : "text-gray-500"}>Joined:</span>
                      <span className={`ml-1 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                        {formatUserDate(u.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className={isDark ? "text-gray-400" : "text-gray-500"}>UID:</span>
                    <span className={`font-mono ml-1 text-[10px] truncate block ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                      {userId ?? "—"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Balance Update Confirmation Modal */}
      {balanceConfirm && (
        <div className={`fixed inset-0 bg-black flex items-center justify-center z-50 p-4 ${isDark ? "bg-opacity-70" : "bg-opacity-50"}`}>
          <div className={`rounded-lg shadow-xl max-w-md w-full p-6 ${isDark ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                Confirm Balance Update
              </h2>
              <button
                onClick={() => setBalanceConfirm(null)}
                className={`transition-colors ${isDark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"}`}
              >
                <FaTimes className="text-sm" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className={`rounded-lg p-4 space-y-2 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
                <div>
                  <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>Username:</span>
                  <p className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                    {balanceConfirm.user.name ??
                      balanceConfirm.user.username ??
                      "—"}
                  </p>
                </div>
                <div>
                  <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>Email:</span>
                  <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    {balanceConfirm.user.email ?? "—"}
                  </p>
                </div>
                <div>
                  <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>UID:</span>
                  <p className={`text-xs font-mono break-all ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                    {balanceConfirm.userId}
                  </p>
                </div>
                <div>
                  <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>Role:</span>
                  <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    {balanceConfirm.user.role === "reseller"
                      ? "Reseller"
                      : balanceConfirm.user.role === "admin"
                      ? "Admin"
                      : "Customer"}
                  </p>
                </div>
              </div>

              <div className={`border-t border-b py-4 ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                    Current Balance:
                  </span>
                  <span className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                    ${balanceConfirm.oldBalance.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>New Balance:</span>
                  <span className={`text-sm font-semibold ${isDark ? "text-purple-400" : "text-purple-600"}`}>
                    ${balanceConfirm.newBalance.toFixed(2)}
                  </span>
                </div>
                <div className={`mt-2 pt-2 border-t ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      Change:
                    </span>
                    <span
                      className={`text-sm font-semibold ${
                        balanceConfirm.newBalance >= balanceConfirm.oldBalance
                          ? isDark ? "text-green-400" : "text-green-600"
                          : isDark ? "text-red-400" : "text-red-600"
                      }`}
                    >
                      {balanceConfirm.newBalance >= balanceConfirm.oldBalance
                        ? "+"
                        : ""}
                      $
                      {(
                        balanceConfirm.newBalance - balanceConfirm.oldBalance
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setBalanceConfirm(null)}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${isDark ? "text-gray-300 bg-gray-700 hover:bg-gray-600" : "text-gray-700 bg-gray-100 hover:bg-gray-200"}`}
              >
                Cancel
              </button>
              <button
                onClick={updateBalance}
                disabled={updatingBalance === balanceConfirm.userId}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {updatingBalance === balanceConfirm.userId ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Confirm Update"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
