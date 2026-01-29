import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import AdminProducts from "../components/Admins/AdminProducts";
import axios from "axios";
import {
  FaCoins,
  FaWallet,
  FaSpinner,
  FaShoppingCart,
  FaBox,
  FaRupeeSign,
  FaUser,
  FaUsers,
} from "react-icons/fa";

const baseUrl = import.meta.env.VITE_BACKEND_URL;

const Admin = () => {
  const { user, isAdmin, signInWithGoogle } = useUser();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [smileBalance, setSmileBalance] = useState(0);
  const [gtBalance, setGtBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayOrders: 0,
    totalOrders: 0,
    todayRevenue: 0,
    totalRevenue: 0,
    todayCustomers: 0,
    totalCustomers: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const getSmileBalance = async () => {
    try {
      const res = await axios.post(`${baseUrl}/smile/get-smile-balance`);
      return res.data.smile_points;
    } catch (error) {
      console.error("Error fetching Smile balance:", error);
      return 0;
    }
  };

  const getGTUBalance = async () => {
    try {
      const res = await axios.get(`${baseUrl}/gamestopup/balance`);
      return res.data.data;
    } catch (error) {
      console.error("Error fetching GTU balance:", error);
      return 0;
    }
  };

  const getDashboardStats = async () => {
    try {
      const res = await axios.get(`${baseUrl}/admin/dashboard-stats`);
      return res.data.stats;
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      return {
        todayOrders: 0,
        totalOrders: 0,
        todayRevenue: 0,
        totalRevenue: 0,
        todayCustomers: 0,
        totalCustomers: 0,
      };
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setStatsLoading(true);
      try {
        const [balance, gBalance, dashboardStats] = await Promise.all([
          getSmileBalance(),
          getGTUBalance(),
          getDashboardStats(),
        ]);
        setGtBalance(gBalance);
        setSmileBalance(balance);
        setStats(dashboardStats);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
        setStatsLoading(false);
      }
    };

    fetchData();
  }, [user, isAdmin, navigate]);

  // Show loading or redirect if not admin
  if (!isAdmin) {
    return null;
  }

  if (!user) {
    return (
      <div className={`min-h-screen-dvh flex items-center justify-center ${isDark ? "bg-gray-900" : "bg-white"}`}>
        <div className="text-center">
          <p className={isDark ? "text-gray-400 mb-4" : "text-gray-600 mb-4"}>
            Sign in to access the Admin dashboard
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

  return (
    <div className={`min-h-screen-dvh bg-gradient-to-br p-3 sm:p-4 lg:p-6 transition-colors ${isDark ? "from-gray-900 to-gray-800" : "from-gray-50 to-gray-100"}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className={`text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
            Admin Dashboard
          </h1>
          <p className={`text-sm sm:text-base ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            Manage your platform balances and products
          </p>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className={`rounded-xl shadow-lg p-4 sm:p-6 border hover:shadow-xl transition-shadow ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium mb-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                  Smile Balance
                </p>
                {loading ? (
                  <div className="flex items-center gap-2">
                    <FaSpinner className={`animate-spin ${isDark ? "text-purple-400" : "text-purple-600"}`} />
                    <span className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                      Loading...
                    </span>
                  </div>
                ) : (
                  <p className={`text-2xl sm:text-3xl font-bold truncate ${isDark ? "text-white" : "text-gray-900"}`}>
                    {smileBalance.toLocaleString()}
                  </p>
                )}
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                <FaWallet className="text-white text-xl" />
              </div>
            </div>
          </div>

          <div className={`rounded-xl shadow-lg p-4 sm:p-6 border hover:shadow-xl transition-shadow ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium mb-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                  GTU Balance
                </p>
                {loading ? (
                  <div className="flex items-center gap-2">
                    <FaSpinner className={`animate-spin ${isDark ? "text-purple-400" : "text-purple-600"}`} />
                    <span className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                      Loading...
                    </span>
                  </div>
                ) : (
                  <p className={`text-2xl sm:text-3xl font-bold truncate ${isDark ? "text-white" : "text-gray-900"}`}>
                    {gtBalance.toLocaleString()}
                  </p>
                )}
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                <FaCoins className="text-white text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Overview Section */}
        <div className="mb-6 sm:mb-8">
          <h2 className={`text-xl sm:text-2xl font-bold mb-4 sm:mb-6 ${isDark ? "text-white" : "text-gray-900"}`}>
            Overview
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Today's Orders */}
            <div className={`rounded-xl shadow-lg p-4 border hover:shadow-xl transition-shadow ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? "bg-purple-900/30" : "bg-purple-100"}`}>
                  <FaShoppingCart className={`text-lg ${isDark ? "text-purple-400" : "text-purple-600"}`} />
                </div>
              </div>
              {statsLoading ? (
                <FaSpinner className={`animate-spin text-2xl ${isDark ? "text-gray-500" : "text-gray-400"}`} />
              ) : (
                <p className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                  {stats.todayOrders}
                </p>
              )}
              <p className={`text-xs sm:text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                Today's Orders
              </p>
            </div>

            {/* Total Orders */}
            <div className={`rounded-xl shadow-lg p-4 border hover:shadow-xl transition-shadow ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? "bg-blue-900/30" : "bg-blue-100"}`}>
                  <FaBox className={`text-lg ${isDark ? "text-blue-400" : "text-blue-600"}`} />
                </div>
              </div>
              {statsLoading ? (
                <FaSpinner className={`animate-spin text-2xl ${isDark ? "text-gray-500" : "text-gray-400"}`} />
              ) : (
                <p className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                  {stats.totalOrders}
                </p>
              )}
              <p className={`text-xs sm:text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                Total Orders
              </p>
            </div>

            {/* Today's Revenue */}
            <div className={`rounded-xl shadow-lg p-4 border hover:shadow-xl transition-shadow ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? "bg-green-900/30" : "bg-green-100"}`}>
                  <FaRupeeSign className={`text-lg ${isDark ? "text-green-400" : "text-green-600"}`} />
                </div>
              </div>
              {statsLoading ? (
                <FaSpinner className={`animate-spin text-2xl ${isDark ? "text-gray-500" : "text-gray-400"}`} />
              ) : (
                <p className={`text-xl sm:text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                  ₹{stats.todayRevenue.toLocaleString()}
                </p>
              )}
              <p className={`text-xs sm:text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                Today's Revenue
              </p>
            </div>

            {/* Total Revenue */}
            <div className={`rounded-xl shadow-lg p-4 border hover:shadow-xl transition-shadow ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? "bg-pink-900/30" : "bg-pink-100"}`}>
                  <FaRupeeSign className={`text-lg ${isDark ? "text-pink-400" : "text-pink-600"}`} />
                </div>
              </div>
              {statsLoading ? (
                <FaSpinner className={`animate-spin text-2xl ${isDark ? "text-gray-500" : "text-gray-400"}`} />
              ) : (
                <p className={`text-xl sm:text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                  ₹{stats.totalRevenue.toLocaleString()}
                </p>
              )}
              <p className={`text-xs sm:text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                Total Revenue
              </p>
            </div>

            {/* Today's Customers */}
            <div className={`rounded-xl shadow-lg p-4 border hover:shadow-xl transition-shadow ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? "bg-blue-900/30" : "bg-blue-100"}`}>
                  <FaUser className={`text-lg ${isDark ? "text-blue-400" : "text-blue-600"}`} />
                </div>
              </div>
              {statsLoading ? (
                <FaSpinner className={`animate-spin text-2xl ${isDark ? "text-gray-500" : "text-gray-400"}`} />
              ) : (
                <p className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                  {stats.todayCustomers}
                </p>
              )}
              <p className={`text-xs sm:text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                Today's Customers
              </p>
            </div>

            {/* Total Customer */}
            <div className={`rounded-xl shadow-lg p-4 border hover:shadow-xl transition-shadow ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? "bg-yellow-900/30" : "bg-yellow-100"}`}>
                  <FaUsers className={`text-lg ${isDark ? "text-yellow-400" : "text-yellow-600"}`} />
                </div>
              </div>
              {statsLoading ? (
                <FaSpinner className={`animate-spin text-2xl ${isDark ? "text-gray-500" : "text-gray-400"}`} />
              ) : (
                <p className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                  {stats.totalCustomers}
                </p>
              )}
              <p className={`text-xs sm:text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                Total Customer
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
