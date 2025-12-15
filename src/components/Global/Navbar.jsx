import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { 
  FaHome, 
  FaCoins, 
  FaShoppingBag, 
  FaUser, 
  FaBars,
  FaSearch,
  FaTrophy,
  FaInfoCircle,
  FaGlobe,
  FaGamepad,
  FaShieldAlt
} from "react-icons/fa";
import HomeSearch from "../Homes/HomeSearch";
import logo from "../../assets/images/logo.png";
import { Trophy } from "lucide-react";

// Desktop navigation items
const desktopNavItems = [
  { label: "Home", to: "/", icon: FaHome },
  { label: "Leaderboards", to: "/leaderboards", icon: FaTrophy },
  { label: "About", to: "/about", icon: FaInfoCircle },
];

// Mobile bottom navigation items
const mobileNavItems = [
  { label: "Home", to: "/", icon: FaHome },
  { label: "Leaderboard", to: "/leaderboards", icon: Trophy },
  { label: "Orders", to: "/orders", icon: FaShoppingBag },
  { label: "Wallet", to: "/wallet", icon: FaCoins },
];

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();

  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
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

          {/* CENTER - Search */}
          <div className="flex-1 flex justify-center max-w-2xl mx-4">
            <HomeSearch />
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
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
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
            </nav>

            {/* Balance Display */}
            <button
              onClick={() => navigate("/wallet")}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              <FaCoins size={16} />
              <span className="text-sm">₹{parseFloat(user?.balance || 0).toFixed(2)}</span>
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

      {/* MOBILE BOTTOM NAVIGATION - Only visible on mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
        <div className="flex items-center justify-around h-16 px-2">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            return (
              <button
                key={item.to}
                onClick={() => navigate(item.to)}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 ${
                  active
                    ? "text-purple-600"
                    : "text-gray-500 hover:text-purple-500"
                }`}
              >
                <Icon size={20} className={active ? "mb-1" : ""} />
                <span className={`text-[10px] font-medium ${active ? "font-semibold" : ""}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* MOBILE TOP BAR - Logo, Search, Balance */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white shadow-md">
        <div className="h-14 flex items-center justify-between px-3 gap-2">
          {/* Logo */}
          <button
            onClick={() => navigate("/")}
            className="flex-shrink-0"
          >
            <img src={logo} className="h-6 w-auto" alt="Logo" />
          </button>

          {/* Search */}
          <div className="flex-1 min-w-0">
            <HomeSearch />
          </div>

          {/* Balance */}
          <button
            onClick={() => navigate("/wallet")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold shadow-sm flex-shrink-0"
          >
            <FaCoins size={14} />
            <span className="text-xs">₹{parseFloat(user?.balance || 0).toFixed(0)}</span>
          </button>
        </div>
      </header>

      {/* Spacer for fixed headers */}
      <div className="h-16 md:block hidden" />
      <div className="h-14 md:hidden block" />
    </>
  );
};

export default Navbar;
