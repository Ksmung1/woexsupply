import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { RxHamburgerMenu } from "react-icons/rx";
import HomeSearch from "../Homes/HomeSearch";
import logo from "../../assets/images/logo.png"
import axios from "axios";
import { Bitcoin, Coins, CoinsIcon } from "lucide-react";

const navItems = [
  { label: "Home", to: "/" },
  { label: "Leaderboards", to: "/leaderboards" },
  { label: "About", to: "/about" },
];

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);

  // avatar
  const photoURL = user?.photoURL ?? null;

  // close menus on route change (this fixes navigation not showing view)
  useEffect(() => {
    setMenuOpen(false);
    setMoreOpen(false);
  }, [location.pathname]);

  // expose helper so other components can close menus after navigate(route)
  useEffect(() => {
    window.__closeNavbarMenus = () => {
      setMenuOpen(false);
      setMoreOpen(false);
    };
    return () => {
      try {
        // clean up
        if (window.__closeNavbarMenus) delete window.__closeNavbarMenus;
      } catch {}
    };
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  // Close "More" dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreOpen(false);
      }
    };
    if (moreOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [moreOpen]);

  // Active route checker
  const isActive = (to) => {
    const path = location.pathname;
    if (to === "/") return path === "/";
    return path.startsWith(to);
  };


  const NavItem = ({ item, onClick, isMobile = false }) => {
    const active = isActive(item.to);
    return (
      <button
        onClick={onClick}
        aria-current={active ? "page" : undefined}
        className={`w-full md:w-auto text-left md:text-center 
          px-3 rounded-lg p-2 transition-colors duration-200
          ${
            active
              ? "bg-blue-50 text-blue-600 font-semibold shadow-sm"
              : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
          }
          ${isMobile ? "text-base" : "text-sm"}`}
      >
        {item.label}
      </button>
    );
  };

  // Desktop nav split for overflow
  const VISIBLE_COUNT = 3;
  const visibleNav = navItems.slice(0, VISIBLE_COUNT);
  const overflowNav = navItems.slice(VISIBLE_COUNT);

  const handleAvatarClick = () => {
    // close menus then navigate
    setMenuOpen(false);
    setMoreOpen(false);
    if (user) navigate("/profile");
    else navigate("/authentication-selection");
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 h-16 flex items-center justify-between gap-1">
          {/* LEFT — Hamburger + Logo */}
          <div className="flex items-center gap-2 justify-start min-w-[80px]">

            {/* Hamburger */}
            <div ref={menuRef} className="relative">
              <button
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 active:scale-95 transition"
                onClick={() => setMenuOpen((s) => !s)}
                aria-expanded={menuOpen}
                aria-label="Toggle menu"
              >
                <RxHamburgerMenu size={22} />
              </button>

              {/* MOBILE MENU */}
              <div
                className={`fixed inset-x-4 top-20 z-40 md:hidden transform-gpu transition-all duration-200 origin-top-right
                  ${menuOpen ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"}`}
              >
                <div className="w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                  <nav className="flex flex-col divide-y divide-gray-100">
                    <div className="px-3 py-3">
                      {navItems.map((item) => (
                        <div key={item.to} className="mb-1 last:mb-0">
                          <NavItem
                            item={item}
                            isMobile
                            onClick={() => {
                              navigate(item.to);
                              setMenuOpen(false);
                              setMoreOpen(false);
                            }}
                          />
                        </div>
                      ))}

                    </div>
                      <div className="px-3 py-3 bg-red-50">
                   
                        <div
                          onClick={() => {
                            setMenuOpen(false);
                            setMoreOpen(false);
                            navigate("/admin");
                          }}
                          className="flex items-center gap-3 cursor-pointer px-2 py-2 hover:bg-gray-100 rounded-md"
                        >
                            <div className="text-sm px-2 font-bold text-red-500">
                              Admin
                            </div>
                        </div>                  
                    </div>

                    
            {/* coin */}
            <div className="flex border p-2 border-gray-200 py-1 rounded-md gap-2 items-center">
              <Bitcoin/>
              <p>{parseFloat(user?.balance || 0).toFixed(2)}</p>
            </div>
                  </nav>
                </div>
              </div>
            </div>

            {/* LOGO */}
            <button
              onClick={() => {
                setMenuOpen(false);
                setMoreOpen(false);
                navigate("/");
              }}

            >
              <img src={logo} className="w-full h-7" alt="" />
            </button>
          </div>

          {/* CENTER — HOMESearch */}
          <div className="flex-1 flex justify-center pl-1">
            <div className="w-full max-w-xl">
              <HomeSearch />
            </div>
          </div>

          {/* RIGHT — Desktop nav + avatar */}
          <div className="hidden md:flex items-center gap-3 min-w-[200px] justify-end">

            {/* Desktop inline nav */}
            <nav className="flex items-center gap-2">
              {visibleNav.map((item) => (
                <button
                  key={item.to}
                  onClick={() => {
                   setMenuOpen(false);
                    setMoreOpen(false);
                    navigate(item.to);
           
                  }}
                  className={`text-sm px-3 py-2 rounded-md ${
                    isActive(item.to)
                      ? "bg-blue-50 text-blue-600 font-semibold"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <div onClick={()=>navigate('/admin')} className="text-sm text-red-600  font-semibold bg-red-50 p-2">Admin</div>

              {/* MORE */}
              {navItems.length > VISIBLE_COUNT && (
                <div className="relative" ref={moreRef}>
                  <button
                    onClick={() => setMoreOpen((s) => !s)}
                    className="text-sm px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50"
                    aria-expanded={moreOpen}
                  >
                    <RxHamburgerMenu/>
                  </button>

                  {moreOpen && (
                    <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-100 rounded-md shadow-lg z-50">
                      <ul>
                        {navItems
                          .slice(VISIBLE_COUNT)
                          .map((item) => (
                            <li key={item.to}>
                              <button
                                onClick={() => {
                                                         setMoreOpen(false);
                                  setMenuOpen(false);
                                  navigate(item.to);
                 
                                }}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-gray-700"
                              >
                                {item.label}
                              </button>
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </nav>

          </div>

          
            {/* coin */}
            <div className="flex border p-2 border-gray-200 py-1 rounded-md gap-2 items-center">
              <Bitcoin/>
              <p>{parseFloat(user?.balance || 0).toFixed(2)}</p>
            </div>

        </div>
      </div>
    </header>
  );
};

export default Navbar;
