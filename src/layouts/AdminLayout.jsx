import React, { useEffect, useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase";
import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import LoadingPage from "../components/Global/LoadingPage";
import {
  FaTachometerAlt,
  FaShoppingBag,
  FaUsers,
  FaBox,
  FaSignOutAlt,
  FaShieldAlt,
  FaBars,
  FaTimes,
  FaEnvelope,
  FaClipboardList,
  FaGamepad,
  FaStore,
  FaWallet,
} from "react-icons/fa";

const AdminLayout = () => {
  const { user, isAdmin, loading } = useUser();
  const [maintenance, setMaintenance] = useState(false);
  const [loadingMaintenance, setLoadingMaintenance] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const ref = doc(db, "settings", "website");

    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setMaintenance(!!snap.data().maintenance);
      }
      setLoadingMaintenance(false);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    // Wait for loading to complete before checking permissions
    if (!loading) {
      // Redirect if not admin
      if (!user || !isAdmin) {
        navigate("/");
      }
    }
  }, [user, isAdmin, loading, navigate]);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const toggleMaintenance = async () => {
    const nextValue = !maintenance;

    const confirmed = window.confirm(
      nextValue
        ? "⚠️ Enable maintenance mode?\n\nThis will block the website for all users."
        : "✅ Disable maintenance mode?\n\nThe website will go live immediately."
    );

    if (!confirmed) return;

    try {
      const ref = doc(db, "settings", "website");
      await updateDoc(ref, { maintenance: nextValue });
    } catch (err) {
      console.error("Maintenance toggle failed:", err);
      alert("❌ Failed to update maintenance mode");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Show loading page until user data is fetched from DB
  if (loading) {
    return <LoadingPage />;
  }

  // Show loading or nothing if not admin
  if (!user || !isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { to: "/admin", label: "Dashboard", icon: FaTachometerAlt },
    { to: "/admin/orders", label: "Orders", icon: FaShoppingBag },
    { to: "/admin/topups", label: "Topups", icon: FaWallet },
    { to: "/admin/queues", label: "Queues", icon: FaClipboardList },
    { to: "/admin/users", label: "Users", icon: FaUsers },
    { to: "/admin/accounts", label: "Accounts", icon: FaGamepad },
    { to: "/admin/game-accounts", label: "Game Accounts", icon: FaStore },
    { to: "/admin/products", label: "Products", icon: FaBox },
    { to: "/admin/messages", label: "Messages", icon: FaEnvelope },
  ];

  const isActive = (path) => {
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0  bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 lg:z-auto w-64 bg-white shadow-xl border-r border-gray-200 flex flex-col transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo/Header */}
        <div className="p-4 lg:p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <FaShieldAlt className="text-white text-lg" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg lg:text-xl font-bold text-gray-900">
                Admin Panel
              </h1>
              <p className="text-xs text-gray-500">Control Center</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close sidebar"
          >
            <FaTimes className="text-gray-600" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 lg:p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg transition-all duration-200 ${
                  active
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg"
                    : "text-gray-700 hover:bg-gray-100 hover:text-purple-600"
                }`}
              >
                <Icon
                  className={`flex-shrink-0 ${
                    active ? "text-white" : "text-gray-500"
                  }`}
                />
                <span className="font-medium text-sm lg:text-base">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-3 lg:p-4 border-t border-gray-200">
          <button
            onClick={toggleMaintenance}
            disabled={loadingMaintenance}
            className={`w-full flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 lg:py-3 rounded-lg 
    font-medium text-sm lg:text-base mb-2 transition-colors
    ${
      maintenance
        ? "bg-green-50 text-green-700 hover:bg-green-100"
        : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
    }
    ${loadingMaintenance ? "opacity-50 cursor-not-allowed" : ""}
  `}
          >
            <FaShieldAlt />
            <span>
              {loadingMaintenance
                ? "Checking Maintenance..."
                : maintenance
                ? "Disable Maintenance"
                : "Enable Maintenance"}
            </span>
          </button>

          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 lg:py-3 rounded-lg 
               bg-red-50 text-red-600 hover:bg-red-100 transition-colors 
               font-medium text-sm lg:text-base"
          >
            <FaSignOutAlt />
            <span>Exit</span>
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Bar */}
        <header className="w-full bg-white shadow-sm border-b border-gray-200 px-3 sm:px-4 lg:px-6 py-3 lg:py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Open sidebar"
              >
                <FaBars className="text-gray-600 text-lg" />
              </button>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                {navItems.find((item) => isActive(item.to))?.label || "Admin"}
              </h2>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-purple-500 flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm sm:text-base flex-shrink-0">
                  {user?.name?.[0]?.toUpperCase() || "A"}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
