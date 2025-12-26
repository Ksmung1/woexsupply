import React, { useEffect, useState } from "react";
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
import { FaSpinner } from "react-icons/fa";

const USERS_COLLECTION = "users"; // change if your collection name is different

export default function AdminUsers() {
  const [users, setUsers] = useState([]); // full or queried list from Firestore
  const [display, setDisplay] = useState([]); // filtered list shown to UI
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);
  const [roleFilter, setRoleFilter] = useState("all"); // "all", "customer", "reseller"
  const [updatingRole, setUpdatingRole] = useState(null); // Track which user's role is being updated

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
          setUsers(list);
          setDisplay(list);
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
        setUsers(list);
        setDisplay(list);
      } catch (err) {
        console.error("search users error:", err);
        setError("Search failed. Falling back to client-side filtering.");
        // fallback: try reading whole collection once and filter locally
        try {
          const colRef = collection(db, USERS_COLLECTION);
          const allSnap = await getDocs(query(colRef, orderBy("username")));
          const all = allSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setUsers(all);
          const filtered = all.filter((u) =>
            String(u.username ?? "")
              .toLowerCase()
              .includes(debounced.toLowerCase())
          );
          setDisplay(filtered);
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
    let filtered = users;

    // Apply role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter((u) => {
        const userRole = u.role || "customer"; // Default to "customer" if no role
        return userRole === roleFilter;
      });
    }

    // Apply search filter
    if (debounced) {
      const lower = debounced.toLowerCase();
      filtered = filtered.filter((u) =>
        String(u.username ?? u.name ?? "")
          .toLowerCase()
          .includes(lower)
      );
    }

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
        <h1 className="text-lg font-semibold text-gray-900">Users</h1>
        <div className="flex items-center gap-3">
          {/* Role Toggle */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setRoleFilter("all")}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                roleFilter === "all"
                  ? "bg-white text-purple-600 shadow-sm"
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
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {display.length} {loading ? "loading..." : "shown"}
          </span>
        </div>
      </div>

      <div className="mb-3 flex gap-2 items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search username..."
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm flex-1 sm:max-w-xs focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-50 text-red-700 rounded text-xs">
          {error}
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto bg-white rounded-lg border border-gray-200">
        <table className="min-w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                #
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Username
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Email
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

          <tbody className="divide-y divide-gray-100">
            {display.map((u, i) => {
              const userRole = u.role || "customer";
              const isUpdating = updatingRole === (u.id ?? u.uid);
              return (
                <tr
                  key={u.id ?? u.uid ?? i}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-3 py-2">
                    <span className="text-xs text-gray-500">#{i + 1}</span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-xs font-medium text-gray-900 truncate block max-w-[150px]">
                      {u.name ?? u.username ?? "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className="text-xs text-gray-600 truncate block max-w-[200px]"
                      title={u.email ?? ""}
                    >
                      {u.email ?? "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">
                        {userRole === "reseller" ? "Reseller" : "Customer"}
                      </span>
                      <button
                        onClick={() => toggleUserRole(u.id ?? u.uid, userRole)}
                        disabled={isUpdating}
                        className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                          userRole === "reseller"
                            ? "bg-purple-600"
                            : "bg-gray-300"
                        } ${
                          isUpdating
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
                    <span className="text-xs text-gray-500">
                      {formatUserDate(u.createdAt)}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className="text-xs font-mono text-gray-500 truncate block max-w-[180px]"
                      title={u.id ?? u.uid ?? ""}
                    >
                      {u.id ?? u.uid ?? "—"}
                    </span>
                  </td>
                </tr>
              );
            })}

            {display.length === 0 && !loading && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-6 text-center text-xs text-gray-500"
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
          <div className="text-center py-6 text-xs text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
            No users found.
          </div>
        ) : (
          display.map((u, i) => {
            const userRole = u.role || "customer";
            const isUpdating = updatingRole === (u.id ?? u.uid);
            return (
              <div
                key={u.id ?? u.uid ?? i}
                className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-gray-400">#{i + 1}</span>
                  <p className="text-sm font-semibold text-gray-900 truncate flex-1">
                    {u.name ?? u.username ?? "—"}
                  </p>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <span className="text-gray-700 ml-1 truncate block">
                      {u.email ?? "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Role:</span>
                      <span className="text-xs text-gray-700">
                        {userRole === "reseller" ? "Reseller" : "Customer"}
                      </span>
                      <button
                        onClick={() => toggleUserRole(u.id ?? u.uid, userRole)}
                        disabled={isUpdating}
                        className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 ${
                          userRole === "reseller"
                            ? "bg-purple-600"
                            : "bg-gray-300"
                        } ${
                          isUpdating
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
                      <span className="text-gray-500">Joined:</span>
                      <span className="text-gray-600 ml-1">
                        {formatUserDate(u.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">UID:</span>
                    <span className="text-gray-500 font-mono ml-1 text-[10px] truncate block">
                      {u.id ?? u.uid ?? "—"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
