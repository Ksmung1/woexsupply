import React, { useState } from "react";
import axios from "axios";
import { useTheme } from "../context/ThemeContext";
import { Search, User, Server, AlertCircle, CheckCircle } from "lucide-react";

const RegionChecker = () => {
  const { isDark } = useTheme();

  const [userId, setUserId] = useState("");
  const [double50, setDouble50] = useState(false);
  const [double150, setDouble150] = useState(false);
  const [double250, setDouble250] = useState(false);
  const [double500, setDouble500] = useState(false);
  const [serverId, setServerId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [goods, setGoods] = useState([]);
  const DAILY_LIMIT = 5;

const canCheckToday = () => {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const raw = localStorage.getItem("ml_region_checks");

  if (!raw) {
    return { allowed: true, count: 0, today };
  }

  try {
    const parsed = JSON.parse(raw);
    if (parsed.date !== today) {
      return { allowed: true, count: 0, today };
    }
    return {
      allowed: parsed.count < DAILY_LIMIT,
      count: parsed.count,
      today,
    };
  } catch {
    return { allowed: true, count: 0, today };
  }
};

const incrementCheck = () => {
  const today = new Date().toISOString().slice(0, 10);
  const raw = localStorage.getItem("ml_region_checks");

  let count = 0;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed.date === today) {
        count = parsed.count || 0;
      }
    } catch {}
  }

  localStorage.setItem(
    "ml_region_checks",
    JSON.stringify({ date: today, count: count + 1 })
  );
};

const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setResult(null);
  setSubmitted(false);

  if (!userId) return setError("Please enter User ID");
  if (!serverId) return setError("Please enter Server ID");

  // 🔒 Frontend daily limit (soft)
  const limit = canCheckToday();
  if (!limit.allowed) {
    return setError("Daily limit reached (5 checks per day)");
  }

  try {
    setLoading(true);
    const res = await axios.get(
      `${import.meta.env.VITE_BACKEND_URL}/ml/get-username/${userId}/${serverId}`
    );

    setResult(res.data);

    const shopEvents = res.data?.data?.data?.shop_events;
    if (shopEvents?.length && shopEvents[0].goods) {
      setGoods(shopEvents[0].goods);
    } else {
      setGoods([]);
    }

    // ✅ Increment only on success
    incrementCheck();
    setSubmitted(true);
  } catch (err) {
    setError(err.response?.data?.error || "Something went wrong");
  } finally {
    setLoading(false);
  }
};


  return (
    <div
      className={`min-h-screen-dvh flex items-start mt-10 justify-center p-4 ${
        isDark
          ? "bg-zinc-950"
          : "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
      }`}
    >
      <div className="relative w-full max-w-md">
        <div
          className={`rounded-2xl border shadow-xl ${
            isDark
              ? "bg-zinc-900 border-zinc-800"
              : "bg-white/80 border-white/40"
          }`}
        >
          <div className="p-8 pb-6 text-center">
            <div
              className={`mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-xl ${
                isDark ? "bg-zinc-800" : "bg-blue-100"
              }`}
            >
              <Search
                className={`${isDark ? "text-zinc-300" : "text-blue-600"}`}
              />
            </div>
            <h1
              className={`text-2xl font-bold ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              ML Status Checker
            </h1>
            <p
              className={`text-sm ${
                isDark ? "text-zinc-400" : "text-gray-600"
              }`}
            >
              Lookup player information instantly
            </p>
          </div>

          <div className="px-8 pb-8 space-y-4">
            <div>
              <label
                className={`text-sm font-medium flex items-center gap-2 ${
                  isDark ? "text-zinc-300" : "text-gray-700"
                }`}
              >
                <User size={16} /> User ID
              </label>
              <input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border ${
                  isDark
                    ? "bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500"
                    : "bg-white border-gray-300"
                }`}
              />
            </div>

            <div>
              <label
                className={`text-sm font-medium flex items-center gap-2 ${
                  isDark ? "text-zinc-300" : "text-gray-700"
                }`}
              >
                <Server size={16} /> Server ID
              </label>
              <input
                value={serverId}
                onChange={(e) => setServerId(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border ${
                  isDark
                    ? "bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500"
                    : "bg-white border-gray-300"
                }`}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`w-full rounded-lg py-3 font-semibold transition ${
                isDark
                  ? "bg-zinc-800 text-white hover:bg-zinc-700"
                  : "bg-blue-600 text-white hover:bg-blue-500"
              }`}
            >
              {loading ? "Checking..." : "Get Information"}
            </button>

            {error && (
              <div
                className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
                  isDark
                    ? "bg-red-900/30 text-red-400 border border-red-800"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                <AlertCircle size={16} /> {error}
              </div>
            )}

            {result && submitted && (
              <div
                className={`rounded-xl p-4 border ${
                  isDark
                    ? "bg-zinc-800 border-zinc-700"
                    : "bg-green-50 border-green-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle
                    className={`${
                      isDark ? "text-green-400" : "text-green-600"
                    }`}
                  />
                  <span
                    className={`font-semibold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Player Found
                  </span>
                </div>

                <div
                  className={`text-sm ${
                    isDark ? "text-zinc-300" : "text-gray-700"
                  }`}
                >
                  <div>
                    Username:{" "}
                    <span className="font-semibold">{result.username}</span>
                  </div>
                  <div>
                    Region:{" "}
                    <span className="font-semibold">{result.region}</span>
                  </div>
                </div>

                {goods.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {goods.map((item, i) => (
                      <div
                        key={i}
                        className={`flex justify-between rounded-md p-2 text-sm ${
                          isDark ? "bg-zinc-900 text-zinc-300" : "bg-white/60"
                        }`}
                      >
                        <span>{item.title}</span>
                        <span
                          className={
                            item.reached_limit
                              ? "text-red-500"
                              : "text-green-500"
                          }
                        >
                          {item.reached_limit ? "Limit Reached" : "Available"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <p
          className={`mt-6 text-center text-xs ${
            isDark ? "text-zinc-500" : "text-gray-600"
          }`}
        >
          Made in Woex
        </p>
      </div>
    </div>
  );
};

export default RegionChecker;
