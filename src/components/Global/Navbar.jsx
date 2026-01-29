import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { useTheme } from "../../context/ThemeContext";
import {
  FaHome,
  FaCoins,
  FaShoppingBag,
  FaUser,
  FaBars,
  FaTrophy,
  FaInfoCircle,
  FaShieldAlt,
  FaEnvelope,
  FaClipboardList,
  FaGamepad,
  FaMoon,
  FaSun,
} from "react-icons/fa";
import { db } from "../../config/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import logo from "../../assets/images/logo.png";
import { Earth, EarthIcon } from "lucide-react";

// Desktop navigation items
const desktopNavItems = [
  { label: "Home", to: "/", icon: FaHome },
  { label: "Leaderboards", to: "/leaderboards", icon: FaTrophy },
  { label: "About", to: "/about", icon: FaInfoCircle },
  { label: "Browse", to: "/browse", icon: EarthIcon },
];

// Mobile dropdown navigation items
const mobileNavItems = [
  { label: "Home", to: "/", icon: FaHome },
  { label: "Leaderboards", to: "/leaderboards", icon: FaTrophy },
  { label: "About", to: "/about", icon: FaInfoCircle },
  { label: "Orders", to: "/orders", icon: FaShoppingBag },
  { label: "Accounts", to: "/accounts", icon: FaGamepad },
  { label: "Queues", to: "/queues", icon: FaClipboardList },
];

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const { isDark, toggleTheme } = useTheme();

  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef(null);
  const profileRef = useRef(null);

  // Close menus on route change
  useEffect(() => {
    setMenuOpen(false);
    setProfileMenuOpen(false);
  }, [location.pathname]);

  // Close menus when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Track unread messages
  useEffect(() => {
    if (!user?.uid) {
      setUnreadCount(0);
      return;
    }

    const messagesRef = collection(db, "messages");
    const q = query(
      messagesRef,
      where("recipientId", "==", user.uid),
      where("read", "==", false)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setUnreadCount(snapshot.size);
      },
      (error) => {
        console.error("Error fetching unread messages:", error);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Active route checker
  const isActive = (to) => {
    const path = location.pathname;
    if (to === "/") return path === "/";
    return path.startsWith(to);
  };

  const handleProfileClick = () => {
    setMenuOpen(false);
    setProfileMenuOpen(false);
    if (user) navigate("/profile");
    else navigate("/authentication-selection");
  };

  return (
    <>
      {/* DESKTOP NAVBAR - Only visible on md and above */}
      <header
        className={`hidden md:block fixed top-0 left-0 w-full z-50 shadow-md safe-top ${
          isDark ? "bg-gray-900 shadow-gray-800" : "bg-white"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          {/* LEFT - Logo */}
          <div className="flex items-center gap-4 min-w-[200px]">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <img src={logo} className="h-8 w-auto" alt="Logo" />
            </button>
          </div>

          {/* RIGHT - Navigation, Balance, Profile */}
          <div className="flex items-center gap-3 min-w-[200px] justify-end">
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {desktopNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.to);
                return (
                  <button
                    key={item.to}
                    onClick={() => navigate(item.to)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                      active
                        ? isDark
                          ? "bg-purple-900/30 text-purple-400 shadow-sm"
                          : "bg-purple-50 text-purple-600 shadow-sm"
                        : isDark
                        ? "text-gray-300 hover:bg-gray-800 hover:text-purple-400"
                        : "text-gray-700 hover:bg-gray-50 hover:text-purple-600"
                    }`}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              {/* Messages Link with Notification */}
              <button
                onClick={() => navigate("/messages")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                  isActive("/messages")
                    ? "bg-purple-50 text-purple-600 shadow-sm"
                    : "text-gray-700 hover:bg-gray-50 hover:text-purple-600"
                }`}
              >
                <FaEnvelope size={16} />
                <span>Messages</span>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>
            </nav>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
              }`}
              aria-label="Toggle dark mode"
            >
              {isDark ? (
                <FaSun size={18} className="text-yellow-500" />
              ) : (
                <FaMoon size={18} className="text-gray-700" />
              )}
            </button>

            {/* Balance Display */}
            <button
              onClick={() => navigate("/wallet")}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              <FaCoins size={16} />
              <span className="text-sm">
                {Math.round(parseFloat(user?.balance || 0))} WCoins
              </span>
            </button>

            {/* Profile Menu */}
            <div ref={profileRef} className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="w-8 h-8 rounded-full border-2 border-purple-500"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white font-semibold">
                    <FaUser size={14} />
                  </div>
                )}
              </button>

              {/* Profile Dropdown */}
              {profileMenuOpen && (
                <div
                  className={`absolute right-0 mt-2 w-48 rounded-xl shadow-xl border overflow-hidden z-50 ${
                    isDark
                      ? "bg-gray-800 border-gray-700"
                      : "bg-white border-gray-100"
                  }`}
                >
                  <div className="py-1">
                    <button
                      onClick={handleProfileClick}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                        isDark
                          ? "text-gray-300 hover:bg-gray-700"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <FaUser size={14} />
                      <span>{user ? "Profile" : "Sign In"}</span>
                    </button>
                    <button
                      onClick={() => {
                        navigate("/orders");
                        setProfileMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                        isDark
                          ? "text-gray-300 hover:bg-gray-700"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <FaShoppingBag size={14} />
                      <span>My Orders</span>
                    </button>
                    <button
                      onClick={() => {
                        navigate("/accounts");
                        setProfileMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                        isDark
                          ? "text-gray-300 hover:bg-gray-700"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <FaGamepad size={14} />
                      <span>My Accounts</span>
                    </button>
                    <button
                      onClick={() => {
                        navigate("/queues");
                        setProfileMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                        isDark
                          ? "text-gray-300 hover:bg-gray-700"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <FaClipboardList size={14} />
                      <span>Queues</span>
                    </button>
                    <button
                      onClick={() => {
                        navigate("/wallet");
                        setProfileMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                        isDark
                          ? "text-gray-300 hover:bg-gray-700"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <FaCoins size={14} />
                      <span>Wallet</span>
                    </button>
                    {user?.role === "admin" && (
                      <button
                        onClick={() => {
                          navigate("/admin");
                          setProfileMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <FaShieldAlt size={14} />
                        <span>Admin Panel</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button (for tablet) */}
            <div ref={menuRef} className="lg:hidden relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
                }`}
              >
                <FaBars size={20} />
              </button>

              {menuOpen && (
                <div
                  className={`absolute right-0 mt-2 w-48 rounded-xl shadow-xl border overflow-hidden z-50 ${
                    isDark
                      ? "bg-gray-800 border-gray-700"
                      : "bg-white border-gray-100"
                  }`}
                >
                  <div className="py-1">
                    {desktopNavItems.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.to);
                      return (
                        <button
                          key={item.to}
                          onClick={() => {
                            navigate(item.to);
                            setMenuOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                            active
                              ? isDark
                                ? "bg-purple-900/30 text-purple-400"
                                : "bg-purple-50 text-purple-600"
                              : isDark
                              ? "text-gray-300 hover:bg-gray-700"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <Icon size={16} />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE TOP BAR - Menu, Logo, Balance */}
      <header
        className={`md:hidden fixed top-0 left-0 right-0 z-40 shadow-md safe-top ${
          isDark ? "bg-gray-900 shadow-gray-800" : "bg-white"
        }`}
      >
        <div className="h-14 flex items-center justify-between px-3 gap-2">
          {/* Left side - Menu Dropdown */}
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
              }`}
              aria-label="Menu"
            >
              <FaBars
                size={20}
                className={isDark ? "text-gray-300" : "text-gray-700"}
              />
            </button>
            <button onClick={() => navigate("/")} className="flex-shrink-0">
              <img src={logo} className="h-6 w-auto" alt="Logo" />
            </button>
            {menuOpen && (
              <div
                className={`absolute left-0 mt-2 w-56 rounded-xl shadow-xl border overflow-hidden z-50 ${
                  isDark
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-100"
                }`}
              >
                <div className="py-2">
                  {mobileNavItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.to);
                    return (
                      <button
                        key={item.to}
                        onClick={() => {
                          navigate(item.to);
                          setMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors ${
                          active
                            ? isDark
                              ? "bg-purple-900/30 text-purple-400 font-semibold"
                              : "bg-purple-50 text-purple-600 font-semibold"
                            : isDark
                            ? "text-gray-300 hover:bg-gray-700"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <Icon size={18} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                  <div
                    className={`border-t my-1 ${
                      isDark ? "border-gray-700" : "border-gray-100"
                    }`}
                  ></div>
                  <button
                    onClick={() => {
                      handleProfileClick();
                      setMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors ${
                      isDark
                        ? "text-gray-300 hover:bg-gray-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <FaUser size={18} />
                    <span>{user ? "Profile" : "Sign In"}</span>
                  </button>
                  {user?.role === "admin" && (
                    <button
                      onClick={() => {
                        navigate("/admin");
                        setMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors ${
                        isDark
                          ? "text-red-400 hover:bg-red-900/30"
                          : "text-red-600 hover:bg-red-50"
                      }`}
                    >
                      <FaShieldAlt size={18} />
                      <span>Admin Panel</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right side - Theme Switcher and Balance */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
              }`}
              aria-label="Toggle dark mode"
            >
              {isDark ? (
                <FaSun size={18} className="text-yellow-500" />
              ) : (
                <FaMoon
                  size={18}
                  className={isDark ? "text-gray-300" : "text-gray-700"}
                />
              )}
            </button>

            {/* Wallet Button */}
            <button
              onClick={() => navigate("/wallet")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold shadow-sm flex-shrink-0"
            >
              <FaCoins size={14} />
              <span className="text-xs">
                {parseFloat(user?.balance || 0).toFixed(0)} WCoins
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Spacer for fixed headers */}
      <div className="spacer-desktop md:block hidden" />
      <div className="spacer-mobile md:hidden" />
    </>
  );
};

export default Navbar;
