import React from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { FaShieldAlt } from "react-icons/fa";

const FloatingAdminButton = () => {
  const navigate = useNavigate();
  const { isAdmin } = useUser();

  // Only show on desktop and if user is admin
  if (!isAdmin) return null;

  return (
    <button
      onClick={() => navigate("/admin")}
      className="hidden md:flex fixed bottom-6 right-6 z-50 items-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
      aria-label="Admin Panel"
    >
      <FaShieldAlt className="text-lg group-hover:rotate-12 transition-transform duration-300" />
      <span className="hidden lg:inline-block">Admin</span>
    </button>
  );
};

export default FloatingAdminButton;

