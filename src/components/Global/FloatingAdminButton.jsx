import React from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { FaShieldAlt } from "react-icons/fa";

const FloatingAdminButton = () => {
  const { user, isAdmin } = useUser();
  const navigate = useNavigate();

  // Only show on mobile and only for admins
  if (!user || !isAdmin) return null;

  const handleClick = () => {
    navigate("/admin");
  };

  return (
    <button
      onClick={handleClick}
      className="md:hidden fixed bottom-24 right-4 z-50 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-full p-4 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center group"
      aria-label="Admin Panel"
      title="Admin Panel"
    >
      <FaShieldAlt className="text-xl" />
      <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white animate-pulse"></span>
    </button>
  );
};

export default FloatingAdminButton;

