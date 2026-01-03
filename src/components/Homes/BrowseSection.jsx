import React from "react";
import { useNavigate } from "react-router-dom";
import { FaGamepad, FaGlobe } from "react-icons/fa";

const BrowseSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-8 md:py-12">
      <div className="mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
          Browse Services
        </h2>
        <p className="text-gray-600 text-sm md:text-base">
          Explore our premium game accounts and region checking tools
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Game Accounts Card */}
        <div
          onClick={() => navigate("/game-acc")}
          className="group relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-1 border border-gray-200 hover:border-purple-400"
        >
          <div className="relative p-6 flex flex-col items-center justify-center min-h-[150px]">
            {/* Icon */}
            <div className="mb-3">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                <FaGamepad className="text-white text-2xl" />
              </div>
            </div>

            {/* Label */}
            <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
              Game Accounts
            </h3>
          </div>
        </div>

        {/* Region Checker Card */}
        <div
          onClick={() => navigate("/region-checker")}
          className="group relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-1 border border-gray-200 hover:border-blue-400"
        >
          <div className="relative p-6 flex flex-col items-center justify-center min-h-[150px]">
            {/* Icon */}
            <div className="mb-3">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                <FaGlobe className="text-white text-2xl" />
              </div>
            </div>

            {/* Label */}
            <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
              Region Checker
            </h3>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BrowseSection;

