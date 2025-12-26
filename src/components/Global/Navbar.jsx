import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../../context/UserContext";
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
} from "react-icons/fa";
import { db } from "../../config/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import logo from "../../assets/images/logo.png";

// Desktop navigation items
const desktopNavItems = [
  { label: "Home", to: "/", icon: FaHome },
  { label: "Leaderboards", to: "/leaderboards", icon: FaTrophy },
  { label: "About", to: "/about", icon: FaInfoCircle },
];

// Mobile dropdown navigation items
const mobileNavItems = [
  { label: "Home", to: "/", icon: FaHome },
  { label: "Leaderboards", to: "/leaderboards", icon: FaTrophy },
  { label: "About", to: "/about", icon: FaInfoCircle },
  { label: "Orders", to: "/orders", icon: FaShoppingBag },
  { label: "Messages", to: "/messages", icon: FaEnvelope },
];

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();

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
      <header className="hidden md:block fixed top-0 left-0 w-full z-50 bg-white shadow-md">
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
                        ? "bg-purple-50 text-purple-600 shadow-sm"
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

            {/* Balance Display */}
            <button
              onClick={() => navigate("/wallet")}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              <FaCoins size={16} />
              <span className="text-sm">
                ₹{Math.round(parseFloat(user?.balance || 0))}
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
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                  <div className="py-1">
                    <button
                      onClick={handleProfileClick}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <FaUser size={14} />
                      <span>{user ? "Profile" : "Sign In"}</span>
                    </button>
                    <button
                      onClick={() => {
                        navigate("/orders");
                        setProfileMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <FaShoppingBag size={14} />
                      <span>My Orders</span>
                    </button>
                    <button
                      onClick={() => {
                        navigate("/wallet");
                        setProfileMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
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
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <FaBars size={20} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
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
                              ? "bg-purple-50 text-purple-600"
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
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white shadow-md">
        <div className="h-14 flex items-center justify-between px-3 gap-2">
          {/* Left side - Menu Dropdown */}
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Menu"
            >
              <FaBars size={20} className="text-gray-700" />
            </button>
            <button onClick={() => navigate("/")} className="flex-shrink-0">
              <img src={logo} className="h-6 w-auto" alt="Logo" />
            </button>
            {menuOpen && (
              <div className="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                <div className="py-2">
                  {mobileNavItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.to);
                    const hasNotification =
                      item.to === "/messages" && unreadCount > 0;
                    return (
                      <button
                        key={item.to}
                        onClick={() => {
                          navigate(item.to);
                          setMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors relative ${
                          active
                            ? "bg-purple-50 text-purple-600 font-semibold"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <Icon size={18} />
                        <span>{item.label}</span>
                        {hasNotification && (
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full"></span>
                        )}
                      </button>
                    );
                  })}
                  <div className="border-t border-gray-100 my-1"></div>
                  <button
                    onClick={() => {
                      handleProfileClick();
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm flex items-center gap-3 text-gray-700 hover:bg-gray-50 transition-colors"
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
                      className="w-full text-left px-4 py-3 text-sm flex items-center gap-3 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <FaShieldAlt size={18} />
                      <span>Admin Panel</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right side - Balance */}
          <button
            onClick={() => navigate("/wallet")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold shadow-sm flex-shrink-0"
          >
            <FaCoins size={14} />
            <span className="text-xs">
              ₹{parseFloat(user?.balance || 0).toFixed(0)}
            </span>
          </button>
        </div>
      </header>

      {/* Spacer for fixed headers */}
      <div className="h-16 md:block hidden" />
      <div className="h-14 md:hidden" />
    </>
  );
};

export default Navbar;
