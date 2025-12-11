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
} from "firebase/firestore";

const USERS_COLLECTION = "users"; // change if your collection name is different

export default function AdminUsers() {
  const [users, setUsers] = useState([]); // full or queried list from Firestore
  const [display, setDisplay] = useState([]); // filtered list shown to UI
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);

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
      const colRef = collection(db, 'users');

      // optional: orderBy username so UI is predictable
      const q = query(colRef)

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

  // client-side filter when user types quickly (immediate UX)
  useEffect(() => {
    if (!debounced) {
      setDisplay(users);
      return;
    }
    const lower = debounced.toLowerCase();
    setDisplay(
      users.filter((u) =>
        String(u.username ?? "").toLowerCase().includes(lower)
      )
    );
  }, [debounced, users]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Admin — Users</h1>

      <div className="mb-4 flex gap-2 items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by username (prefix search supported)..."
          className="px-3 py-2 border rounded w-full max-w-md"
        />
        <div className="text-sm text-gray-500">{loading ? "Loading…" : `${display.length} shown`}</div>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">{error}</div>}

      <div className="overflow-x-auto bg-white rounded shadow-sm border">
        <table className="min-w-full divide-y overflow-x-auto">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">#</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Username</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Email</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Created</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">UID</th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y">
            {display.map((u, i) => (
              <tr key={u.id ?? u.uid ?? i} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-800">{i + 1}</td>
                <td className="px-4 py-3 text-sm text-gray-800">{u.name ?? "—"}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{u.email ?? "—"}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {u.createdAt && typeof u.createdAt.toDate === "function"
                    ? u.createdAt.toDate().toLocaleString()
                    : u.createdAt
                    ? new Date(u.createdAt).toLocaleString()
                    : "—"}
                </td>
                <td className="px-4 py-3 text-sm font-mono text-gray-700">{u.id ?? u.uid ?? "—"}</td>
              </tr>
            ))}

            {display.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-600">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
