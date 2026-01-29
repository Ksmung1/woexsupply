import React from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { FaGamepad, FaGlobe } from "react-icons/fa";

const Browse = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen-dvh bg-gradient-to-br py-12 transition-colors ${isDark ? "from-gray-900 via-gray-900 to-gray-800" : "from-gray-50 via-purple-50/30 to-indigo-50/30"}`}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className={`text-4xl md:text-5xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
            Browse Our Services
          </h1>
          <p className={`text-lg max-w-2xl mx-auto ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            Explore our game accounts and region checking tools
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Game Accounts Card */}
          <div
            onClick={() => navigate("/game-acc")}
            className={`group relative rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-2 border-2 ${isDark ? "bg-gray-800 border-gray-700 hover:border-purple-400" : "bg-white border-gray-200 hover:border-purple-500"}`}
          >
            <div className="relative p-8 flex flex-col items-center justify-center min-h-[200px]">
              {/* Icon */}
              <div className="mb-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <FaGamepad className="text-white text-3xl" />
                </div>
              </div>

              {/* Label */}
              <h2 className={`text-2xl md:text-3xl font-bold transition-colors ${isDark ? "text-white group-hover:text-purple-400" : "text-gray-900 group-hover:text-purple-600"}`}>
                Game Accounts
              </h2>
            </div>
          </div>

          {/* Region Checker Card */}
          <div
            onClick={() => navigate("/region-checker")}
            className={`group relative rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-2 border-2 ${isDark ? "bg-gray-800 border-gray-700 hover:border-purple-400" : "bg-white border-gray-200 hover:border-purple-500"}`}
          >
            <div className="relative p-8 flex flex-col items-center justify-center min-h-[200px]">
              {/* Icon */}
              <div className="mb-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <FaGlobe className="text-white text-3xl" />
                </div>
              </div>

              {/* Label */}
              <h2 className={`text-2xl md:text-3xl font-bold transition-colors ${isDark ? "text-white group-hover:text-blue-400" : "text-gray-900 group-hover:text-blue-600"}`}>
                Region Checker
              </h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Browse;
