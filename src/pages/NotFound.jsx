// src/pages/NotFound.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { FaHome, FaArrowLeft, FaExclamationTriangle } from "react-icons/fa";

const NotFound = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen-dvh bg-gradient-to-br flex items-center justify-center py-12 transition-colors ${isDark ? "from-gray-900 via-gray-900 to-gray-800" : "from-gray-50 via-purple-50/30 to-indigo-50/30"}`}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 w-full">
        <div className="max-w-2xl mx-auto text-center">
          {/* 404 Number */}
          <div className="mb-8">
            <h1 className={`text-9xl md:text-[12rem] font-bold text-transparent bg-clip-text bg-gradient-to-r animate-pulse ${isDark ? "from-purple-400 via-indigo-400 to-purple-400" : "from-purple-600 via-indigo-600 to-purple-600"}`}>
              404
            </h1>
          </div>

          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center shadow-2xl">
              <FaExclamationTriangle className="text-white text-4xl" />
            </div>
          </div>

          {/* Message */}
          <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-800"}`}>
            Page Not Found
          </h2>
          <p className={`text-lg mb-8 max-w-md mx-auto ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            Oops! The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
            >
              <FaHome size={18} />
              Go to Home
            </button>
            <button
              onClick={() => navigate(-1)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold border-2 transition-all duration-200 ${isDark ? "bg-gray-800 text-gray-300 border-gray-700 hover:border-purple-500 hover:bg-purple-900/30" : "bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50"}`}
            >
              <FaArrowLeft size={18} />
              Go Back
            </button>
          </div>

          {/* Additional Help */}
          <div className={`mt-12 pt-8 border-t ${isDark ? "border-gray-700" : "border-gray-200"}`}>
            <p className={`text-sm mb-4 ${isDark ? "text-gray-400" : "text-gray-500"}`}>You might be looking for:</p>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { label: "Home", path: "/" },
                { label: "Browse Games", path: "/browse" },
                { label: "My Orders", path: "/orders" },
                { label: "Wallet", path: "/wallet" },
              ].map((link) => (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${isDark ? "bg-gray-800 text-gray-300 border-gray-700 hover:border-purple-500 hover:bg-purple-900/30" : "bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50"}`}
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
