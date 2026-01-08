import React, { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import axios from "axios";
import { Search, User, Server, AlertCircle, CheckCircle } from "lucide-react";

const RegionChecker = () => {
  const { isDark } = useTheme();

  const [userId, setUserId] = useState("");
  const [serverId, setServerId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setSubmitted(false);
    if (!userId) {
      setError("Please enter User ID");
      return;
    }
    if (!serverId) {
      setError("Please enter Server ID");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/ml/get-username/${userId}/${serverId}`
      );
      console.log(res);
      console.log(res.data);
      setResult(res.data);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen mt-2 md:mt-0 flex items-start md:items-center justify-center p-4 transition-all duration-500 ${
        isDark
          ? "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
          : "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
      }`}
    >
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl opacity-20 ${
            isDark ? "bg-purple-500" : "bg-blue-400"
          }`}
        ></div>
        <div
          className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-20 ${
            isDark ? "bg-blue-500" : "bg-purple-400"
          }`}
        ></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div
          className={`backdrop-blur-xl rounded-2xl shadow-2xl border transition-all duration-500 hover:shadow-3xl transform hover:-translate-y-1 ${
            isDark
              ? "bg-white/10 border-gray-900 shadow-black/50"
              : "bg-white/80 border-gray-300 shadow-black/30"
          }`}
        >
          {/* Header */}
          <div className="p-8 pb-6">
            <div className="flex items-center justify-center mb-6">
              <div
                className={`p-4 rounded-2xl ${
                  isDark ? "bg-purple-500/20" : "bg-blue-500/20"
                }`}
              >
                <Search
                  className={`w-8 h-8 ${
                    isDark ? "text-purple-400" : "text-blue-600"
                  }`}
                />
              </div>
            </div>
            <h1
              className={`text-2xl font-bold text-center mb-2 ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              ML Region Checker
            </h1>
            <p
              className={`text-center text-sm ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Lookup player information instantly
            </p>
          </div>

          {/* Form */}
          <div className="px-8 pb-8">
            <div className="space-y-4">
              {/* User ID */}
              <div className="space-y-2">
                <label
                  className={`text-sm font-medium flex items-center gap-2 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  <User size={16} />
                  User ID
                </label>
                <input
                  type="text"
                  placeholder="Enter user ID..."
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  required
                  className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    isDark
                      ? "bg-white/10 border-white/20 text-white placeholder-gray-400 focus:ring-purple-500 focus:ring-offset-slate-900"
                      : "bg-white/70 border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:ring-offset-white"
                  }`}
                />
              </div>

              {/* Server ID */}
              <div className="space-y-2">
                <label
                  className={`text-sm font-medium flex items-center gap-2 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  <Server size={16} />
                  Server ID
                </label>
                <input
                  type="text"
                  placeholder="Enter server ID..."
                  value={serverId}
                  onChange={(e) => setServerId(e.target.value)}
                  required
                  className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    isDark
                      ? "bg-white/10 border-white/20 text-white placeholder-gray-400 focus:ring-purple-500 focus:ring-offset-slate-900"
                      : "bg-white/70 border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:ring-offset-white"
                  }`}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={loading}
                className={`w-full py-3 px-6 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                  isDark
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 focus:ring-purple-500 focus:ring-offset-slate-900"
                    : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 focus:ring-blue-500 focus:ring-offset-white"
                } ${loading ? "animate-pulse" : ""}`}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Searching...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Search size={18} />
                    Get Region
                  </div>
                )}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div
                className={`mt-6 p-2 rounded-xl border-l-4 flex items-center gap-3 ${
                  isDark
                    ? "bg-red-500/10 border-red-500 text-red-400"
                    : "bg-red-50 border-red-500 text-red-700"
                }`}
              >
                <AlertCircle size={20} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Result */}
            {result && submitted && (
              <div
                className={`mt-6 p-2 rounded-xl border backdrop-blur-sm ${
                  isDark
                    ? "bg-green-500/10 border-green-500/30"
                    : "bg-green-50 border-green-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle
                    className={`w-5 h-5 ${
                      isDark ? "text-green-400" : "text-green-600"
                    }`}
                  />
                  <h3
                    className={`font-semibold ${
                      isDark ? "text-green-400" : "text-green-700"
                    }`}
                  >
                    Player Found!
                  </h3>
                </div>

                <div className="space-y-3">
                  <div
                    className={`flex justify-between items-center p-3 rounded-lg ${
                      isDark ? "bg-white/5" : "bg-white/50"
                    }`}
                  >
                    <span
                      className={`font-xs ${
                        isDark ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Username:
                    </span>
                    <span
                      className={`font-semibold ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {result.username}
                    </span>
                  </div>

                  <div
                    className={`flex justify-between items-center p-3 rounded-lg ${
                      isDark ? "bg-white/5" : "bg-white/50"
                    }`}
                  >
                    <span
                      className={`font-medium ${
                        isDark ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Region:
                    </span>
                    <span
                      className={`font-semibold ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {result.region}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p
            className={`text-xs ${
              isDark ? "text-gray-500" : "text-gray-600"
            }`}
          >
            Made in WoexSupply
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegionChecker;
