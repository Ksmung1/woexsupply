import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CiShop } from "react-icons/ci";
import { CgGames } from "react-icons/cg";
import { EarthIcon, ShoppingBagIcon, Wallet } from "lucide-react";

const shortcutItems = [
  {
    label: "Home",
    routes: ["/"],
    icon: <CiShop size={24} />,
  },
  {
    label: "Browse",
    routes: ["/browse"],
    icon: <EarthIcon size={24} />,
  },
  // {
  //   label: "Region Checker",
  //   routes: ["/region-checker"],
  //   icon: <CgGames size={24} />,
  // },
  {
    label: "My orders",
    routes: ["/orders"],
    icon: <ShoppingBagIcon size={24} />,
  },
  {
    label: "My wallet",
    routes: ["/wallet"],
    icon: <Wallet size={24} />,
  },
];

function Shortcut() {
  const navigate = useNavigate();
  const location = useLocation();
  const isDarkMode = false;

  const handleClick = (route) => {
    if (location.pathname !== route) navigate(route);
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 flex justify-between items-center 
      py-2 border-t z-10 h-16 sm:px-40
      ${isDarkMode ? "bg-gray-900 border-gray-700 text-gray-300" : "bg-white border-gray-300 text-gray-700"}`}
    >
      {shortcutItems.map(({ label, routes, icon }) => {
        const isActive = routes.includes(location.pathname);

        return (
          <button
            key={label}
            onClick={() => handleClick(routes[0])}
            className={`flex flex-col flex-1 items-center justify-center 
            cursor-pointer select-none text-xs transition-all duration-200 
            py-1
            ${isActive
              ? isDarkMode
                ? "text-blue-400 font-semibold"
                : "text-blue-600 font-semibold"
              : isDarkMode
              ? "text-gray-400 hover:text-white"
              : "text-gray-600 hover:text-blue-500"
            }`}
          >
            <span className="mb-1">{icon}</span>
            <p className="text-[11px]">{label}</p>
          </button>
        );
      })}
    </div>
  );
}

export default Shortcut;
