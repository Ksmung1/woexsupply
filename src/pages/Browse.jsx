import React from "react";
import { useNavigate } from "react-router-dom";
import { FaGamepad, FaGlobe } from "react-icons/fa";

const Browse = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-indigo-50/30 py-12">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Browse Our Services
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore our game accounts and region checking tools
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Game Accounts Card */}
          <div
            onClick={() => navigate("/game-acc")}
            className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-2 border-2 border-transparent hover:border-purple-500"
          >
            <div className="relative p-8 flex flex-col items-center justify-center min-h-[200px]">
              {/* Icon */}
              <div className="mb-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <FaGamepad className="text-white text-3xl" />
                </div>
              </div>

              {/* Label */}
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                Game Accounts
              </h2>
            </div>
          </div>

          {/* Region Checker Card */}
          <div
            onClick={() => navigate("/region-checker")}
            className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-2 border-2 border-transparent hover:border-blue-500"
          >
            <div className="relative p-8 flex flex-col items-center justify-center min-h-[200px]">
              {/* Icon */}
              <div className="mb-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <FaGlobe className="text-white text-3xl" />
                </div>
              </div>

              {/* Label */}
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
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

