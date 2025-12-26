import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
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
  const { user, isAdmin } = useUser();
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
    // Check if user is admin
    if (!user || !isAdmin) {
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
  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
            Admin Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Manage your platform balances and products
          </p>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Smile Balance
                </p>
                {loading ? (
                  <div className="flex items-center gap-2">
                    <FaSpinner className="animate-spin text-purple-600" />
                    <span className="text-2xl font-bold text-gray-900">
                      Loading...
                    </span>
                  </div>
                ) : (
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
                    {smileBalance.toLocaleString()}
                  </p>
                )}
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                <FaWallet className="text-white text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600 mb-1">
                  GTU Balance
                </p>
                {loading ? (
                  <div className="flex items-center gap-2">
                    <FaSpinner className="animate-spin text-purple-600" />
                    <span className="text-2xl font-bold text-gray-900">
                      Loading...
                    </span>
                  </div>
                ) : (
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
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
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
            Overview
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Today's Orders */}
            <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FaShoppingCart className="text-purple-600 text-lg" />
                </div>
              </div>
              {statsLoading ? (
                <FaSpinner className="animate-spin text-gray-400 text-2xl" />
              ) : (
                <p className="text-2xl font-bold text-gray-900">
                  {stats.todayOrders}
                </p>
              )}
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Today's Orders
              </p>
            </div>

            {/* Total Orders */}
            <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FaBox className="text-blue-600 text-lg" />
                </div>
              </div>
              {statsLoading ? (
                <FaSpinner className="animate-spin text-gray-400 text-2xl" />
              ) : (
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalOrders}
                </p>
              )}
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Total Orders
              </p>
            </div>

            {/* Today's Revenue */}
            <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <FaRupeeSign className="text-green-600 text-lg" />
                </div>
              </div>
              {statsLoading ? (
                <FaSpinner className="animate-spin text-gray-400 text-2xl" />
              ) : (
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  ₹{stats.todayRevenue.toLocaleString()}
                </p>
              )}
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Today's Revenue
              </p>
            </div>

            {/* Total Revenue */}
            <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                  <FaRupeeSign className="text-pink-600 text-lg" />
                </div>
              </div>
              {statsLoading ? (
                <FaSpinner className="animate-spin text-gray-400 text-2xl" />
              ) : (
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  ₹{stats.totalRevenue.toLocaleString()}
                </p>
              )}
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Total Revenue
              </p>
            </div>

            {/* Today's Customers */}
            <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FaUser className="text-blue-600 text-lg" />
                </div>
              </div>
              {statsLoading ? (
                <FaSpinner className="animate-spin text-gray-400 text-2xl" />
              ) : (
                <p className="text-2xl font-bold text-gray-900">
                  {stats.todayCustomers}
                </p>
              )}
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Today's Customers
              </p>
            </div>

            {/* Total Customer */}
            <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <FaUsers className="text-yellow-600 text-lg" />
                </div>
              </div>
              {statsLoading ? (
                <FaSpinner className="animate-spin text-gray-400 text-2xl" />
              ) : (
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalCustomers}
                </p>
              )}
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
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
