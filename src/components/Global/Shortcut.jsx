import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CiShop } from "react-icons/ci";
import { CgGames } from "react-icons/cg";
import { EarthIcon, ShoppingBagIcon, MessageCircle } from "lucide-react";
import { useUser } from "../../context/UserContext";
import { useTheme } from "../../context/ThemeContext";
import { db } from "../../config/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

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
  {
    label: "Status Checker",
    routes: ["/region-checker"],
    icon: <CgGames size={24} />,
  },
  {
    label: "My orders",
    routes: ["/orders"],
    icon: <ShoppingBagIcon size={24} />,
  },
  {
    label: "Messages",
    routes: ["/messages"],
    icon: <MessageCircle size={24} />,
  },
];

function Shortcut() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const { isDark } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);

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

  const handleClick = (route) => {
    if (location.pathname !== route) navigate(route);
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 flex justify-between items-center safe-bottom
      py-2 border-t z-10 h-16 md:hidden
      ${
        isDark
          ? "bg-gray-900 border-gray-700 text-gray-300"
          : "bg-white border-gray-300 text-gray-700"
      }`}
    >
      {shortcutItems.map(({ label, routes, icon }) => {
        const isActive = routes.includes(location.pathname);
        const hasNotification = routes.includes("/messages") && unreadCount > 0;

        return (
          <button
            key={label}
            onClick={() => handleClick(routes[0])}
            className={`flex flex-col flex-1 items-center justify-center 
            cursor-pointer select-none text-xs transition-all duration-200 
            py-1 relative
            ${
              isActive
                ? isDark
                  ? "text-blue-400 font-semibold"
                  : "text-blue-600 font-semibold"
                : isDark
                ? "text-gray-400 hover:text-white"
                : "text-gray-600 hover:text-blue-500"
            }`}
          >
            <span className="mb-1 relative">
              {icon}
              {hasNotification && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </span>
            <p className="text-[11px]">{label}</p>
          </button>
        );
      })}
    </div>
  );
}

export default Shortcut;
