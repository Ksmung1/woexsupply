import React, { useState, useEffect } from "react";
import { db, auth } from "../../config/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import axios from "axios";
import { useTheme } from "../../context/ThemeContext";
import { useAlert } from "../../context/AlertContext";
import { FaTrash, FaCopy, FaSync } from "react-icons/fa";

const AdminCoupons = () => {
  const { isDark } = useTheme();
  const { showSuccess, showError } = useAlert();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newValue, setNewValue] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "coupons"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCoupons(list);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching coupons:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 12; i++) {
      if (i > 0 && i % 4 === 0) result += "-";
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedCode(result);
  };

  useEffect(() => {
    generateCode();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newValue || parseFloat(newValue) <= 0) {
      showError("Please enter a valid amount");
      return;
    }

    setCreating(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/admin/coupon/create`,
        { value: parseFloat(newValue), code: generatedCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showSuccess(response.data.success);
      setNewValue("");
      generateCode();
    } catch (error) {
      console.error("Error creating coupon:", error);
      showError(error.response?.data?.error || "Failed to create coupon");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) return;
    try {
      const token = await auth.currentUser.getIdToken();
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/admin/coupon/delete`,
        { id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showSuccess("Coupon deleted");
    } catch (error) {
      console.error("Error deleting coupon:", error);
      showError(error.response?.data?.error || "Failed to delete coupon");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showSuccess("Code copied to clipboard");
  };

  return (
    <div className={`p-6 rounded-2xl shadow-lg ${isDark ? "bg-gray-800" : "bg-white"}`}>
      <h2 className={`text-2xl font-bold mb-6 ${isDark ? "text-white" : "text-gray-800"}`}>
        Manage Coupons
      </h2>

      {/* Create Form */}
      <form onSubmit={handleCreate} className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
            Coupon Code
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={generatedCode}
              readOnly
              className={`w-full p-3 rounded-lg border ${
                isDark
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-gray-50 border-gray-300 text-gray-900"
              } font-mono text-center tracking-wider`}
            />
            <button
              type="button"
              onClick={generateCode}
              className={`p-3 rounded-lg border ${
                isDark
                  ? "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                  : "bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <FaSync />
            </button>
          </div>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
            Value (Wcoins)
          </label>
          <input
            type="number"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="Enter amount"
            className={`w-full p-3 rounded-lg border ${
              isDark
                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
            } focus:ring-2 focus:ring-purple-500 focus:outline-none`}
          />
        </div>

        <button
          type="submit"
          disabled={creating}
          className={`h-[50px] px-6 rounded-lg font-semibold text-white transition-all ${
            creating
              ? "bg-purple-400 cursor-not-allowed"
              : "bg-purple-600 hover:bg-purple-700 shadow-md hover:shadow-lg"
          }`}
        >
          {creating ? "Creating..." : "Generate Coupon"}
        </button>
      </form>

      {/* Coupons List */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className={`border-b ${isDark ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-600"}`}>
              <th className="py-3 px-4 font-semibold">Code</th>
              <th className="py-3 px-4 font-semibold">Value</th>
              <th className="py-3 px-4 font-semibold">Status</th>
              <th className="py-3 px-4 font-semibold">Created At</th>
              <th className="py-3 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
            {loading ? (
              <tr>
                <td colSpan="5" className="py-8 text-center">Loading...</td>
              </tr>
            ) : coupons.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-gray-500">No coupons found</td>
              </tr>
            ) : (
              coupons.map((coupon) => (
                <tr
                  key={coupon.id}
                  className={`border-b transition-colors ${
                    isDark ? "border-gray-700 hover:bg-gray-700/50" : "border-gray-100 hover:bg-gray-50"
                  }`}
                >
                  <td className="py-3 px-4 font-mono font-medium flex items-center gap-2">
                    {coupon.code}
                    <button
                      onClick={() => copyToClipboard(coupon.code)}
                      className="text-gray-400 hover:text-purple-500 transition-colors"
                      title="Copy Code"
                    >
                      <FaCopy size={12} />
                    </button>
                  </td>
                  <td className="py-3 px-4 font-semibold text-green-500">
                    {coupon.value}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        coupon.isRedeemed
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      }`}
                    >
                      {coupon.isRedeemed ? "Redeemed" : "Active"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-xs">
                    {coupon.createdAt?.toDate().toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDelete(coupon.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Delete"
                    >
                      <FaTrash size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminCoupons;
