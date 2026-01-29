import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import displayML from "../../assets/images/ml-logo.avif";
import displayMCGG from "../../assets/images/download.jpg";
import mlLogo from "../../assets/images/ml-logo.avif";
import mcLogo from "../../assets/images/mcgg.jpeg";
import ssLogo from "../../assets/images/supersus.webp";
import displaySS from "../../assets/images/Supersus-bg.jpg";
import bsLogo from "../../assets/images/blood-strike.webp";
import displayBS from "../../assets/images/blood-strike-bg.jpg";
import genLogo from "../../assets/images/genshin.jpg";
import hsrLogo from "../../assets/images/honkai.avif";
import displayGI from "../../assets/images/genshin-bg.jpg";
import displayHSR from "../../assets/images/honkai-display.avif";
import { IoIosInformationCircle } from "react-icons/io";

const gameInfo = {
  "/recharge/mlbb": {
    name: "Mobile Legends: Bang Bang",
    image:
      "https://i.pinimg.com/1200x/71/c0/c0/71c0c0d9badbea70104b3ef0d0daa955.jpg",
    guide: [
      "Go to Profile on Mobile Legends",
      "Tap on the User ID — it will auto-copy UserID & ZoneID",
      "Paste the copied ID — it will auto-fill the fields",
      "Check username; if correct, proceed",
      "Click Purchase",
      "Confirm",
      "Enjoy!",
    ],
    logo: mlLogo,
  },
  "/recharge/mcgg": {
    name: "Magic Chess Go Go",
    image: displayMCGG,
    guide: [
      "Open Magic Chess Go Go",
      "Go to your Profile and copy UID & Server ID",
      "Paste the copied ID into our site",
      "Check if your nickname appears",
      "Click Purchase",
      "Confirm the amount",
      "Enjoy your items!",
    ],
    logo: mcLogo,
  },
  "/recharge/supersus": {
    name: "Super Sus",
    image: displaySS,
    guide: [
      "Open Super Sus",
      "Go to your Profile and copy UID & Server ID",
      "Paste the copied ID into our site",
      "Check if your nickname appears",
      "Click Purchase",
      "Confirm the amount",
      "Enjoy your items!",
    ],
    logo: ssLogo,
  },
  "/recharge/bloodstrike": {
    name: "Blood Strike",
    image: displayBS,
    guide: [
      "Open Blood Strike",
      "Go to your Profile and copy UID & Server ID",
      "Paste the copied ID into our site",
      "Check if your nickname appears",
      "Click Purchase",
      "Confirm the amount",
      "Enjoy your items!",
    ],
    logo: bsLogo,
  },
  "/recharge/hsr": {
    name: "Honkai Star Rail",
    image: displayHSR,
    guide: [
      "Open Honkai Star Rail",
      "Go to your Profile and copy UID & Server ID",
      "Paste the copied ID into our site",
      "Check if your nickname appears",
      "Click Purchase",
      "Confirm the amount",
      "Enjoy your items!",
    ],
    logo: hsrLogo,
  },
  "/recharge/gi": {
    name: "Genshin Impact",
    image: displayGI,
    guide: [
      "Open Genshin Impact",
      "Go to your Profile and copy UID & Server ID",
      "Paste the copied ID into our site",
      "Check if your nickname appears",
      "Click Purchase",
      "Confirm the amount",
      "Enjoy your items!",
    ],
    logo: genLogo,
  },
  "/recharge/custom": {
    name: "Custom Packs",
    image:
      "https://i.pinimg.com/1200x/71/c0/c0/71c0c0d9badbea70104b3ef0d0daa955.jpg",
    guide: [
      "Go to Profile on Mobile Legends",
      "Tap on the User ID — it will auto-copy UserID & ZoneID",
      "Paste the copied ID — it will auto-fill the fields",
      "Check username; if correct, proceed",
      "Click Purchase",
      "Confirm",
      "Enjoy!",
    ],
    logo: mlLogo,
  },
};

const RechargeDisplay = () => {
  const [showGuide, setShowGuide] = useState(false);
  const location = useLocation();
  const { isDark: isDarkMode } = useTheme();
  const currentGame = gameInfo[location.pathname] || gameInfo["/recharge"];
  return (
    <>
      {/* Mobile View */}
      <div
        className="relative w-full h-[180px] md:h-[250px] lg:hidden overflow-hidden"
        style={{
          backgroundImage: `url(${currentGame.image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Overlay for darkening */}
        <div
          className={`absolute inset-0 z-0 ${
            isDarkMode
              ? "bg-gradient-to-r from-black/80 to-black/40"
              : "bg-gradient-to-r from-black/60 to-black/30"
          }`}
        />

        {/* Content - Logo, Name, Tags grouped in bottom-left */}
        <div
          className={`relative z-10 h-full flex items-end justify-between ${
            isDarkMode ? "text-gray-200" : "text-white"
          }`}
        >
          {/* Left Side - Logo, Name, Tags */}
          <div className="p-3 md:p-4 flex items-end gap-2">
            {/* Logo */}
            <div className="w-12 h-12 md:w-14 md:h-14 overflow-hidden flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-lg border border-white/10">
              <img
                className="w-full h-full object-cover"
                src={currentGame.logo}
                alt={currentGame.slug || "game logo"}
              />
            </div>

            {/* Name and Tags */}
            <div className="flex flex-col gap-1.5">
              {/* Game Name */}
              <h2
                className={`text-xs md:text-sm font-bold leading-tight ${
                  isDarkMode ? "text-gray-200" : "text-white"
                }`}
              >
                {currentGame.name}
              </h2>

              {/* Tags */}
              <div className="grid grid-cols-3 gap-1">
                {[
                  "24/7 Chat Support",
                  "Safe Payment",
                  "Official Store",
                  "Service Guarantee",
                  "Instant Delivery",
                ].map((tag, i) => (
                  <span
                    key={i}
                    className={`px-2 py-0.5 text-[6px] md:text-[8px] w-fit text-center font-semibold rounded-md ${
                      isDarkMode
                        ? "bg-gray-700/80 text-gray-300"
                        : "bg-white/95 text-gray-900 backdrop-blur-sm shadow-sm"
                    } transition-all duration-200`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side - How to Purchase Button */}
          <div className="p-3 md:p-4">
            <button
              className="flex items-center gap-1 bg-white/90 hover:bg-white text-gray-900 px-2 py-1 text-[9px] md:text-[10px] font-medium transition-colors rounded-md shadow-sm"
              onClick={() => setShowGuide(true)}
            >
              <IoIosInformationCircle className="text-[10px] md:text-xs" />
              <span className="hidden sm:inline">How to purchase</span>
              <span className="sm:hidden">Guide</span>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop View - Cover background with guide on right */}
      <div
        className="hidden lg:block relative w-full h-[400px] overflow-hidden"
        style={{
          backgroundImage: `url(${currentGame.image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/20 z-0" />

        {/* Content */}
        <div className="relative z-10 h-full flex">
          {/* Left Side - Logo, Name, and Tags grouped in bottom-left */}
          <div className="flex-1 p-6 flex items-end text-white">
            <div className="flex items-end gap-3">
              {/* Logo */}
              <div className="w-20 h-20 overflow-hidden flex items-center justify-center bg-black/30 backdrop-blur-sm rounded-lg border border-white/10">
                <img
                  className="w-full h-full object-cover"
                  src={currentGame.logo}
                  alt={currentGame.slug || "game logo"}
                />
              </div>

              {/* Name and Tags */}
              <div className="flex flex-col gap-2">
                {/* Game Name */}
                <h2 className="text-xl font-bold text-white leading-tight">
                  {currentGame.name}
                </h2>

                {/* Tags */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    "24/7 Chat Support",
                    "Safe Payment",
                    "Official Store",
                    "Service Guarantee",
                    "Instant Delivery",
                  ].map((tag, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 text-[10px] font-semibold bg-white/95 text-gray-900 backdrop-blur-sm shadow-sm hover:bg-white hover:shadow-md transition-all duration-200 rounded-lg"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - How to Purchase Guide */}
          <div className="w-80 bg-white/95 backdrop-blur-md p-5 overflow-y-auto border-l-2 border-purple-300/30">
            <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-purple-200">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <IoIosInformationCircle className="text-purple-600 text-base" />
                How to Purchase
              </h3>
              <button
                className="text-gray-500 hover:text-purple-600 text-lg leading-none transition-colors p-1.5 hover:bg-purple-50 rounded-lg"
                onClick={() => setShowGuide(true)}
                aria-label="View full guide"
              >
                <IoIosInformationCircle />
              </button>
            </div>
            <ol className="space-y-2.5">
              {currentGame.guide.map((step, i) => (
                <li
                  key={i}
                  className="flex gap-3 items-start group hover:bg-purple-50/50 p-2.5 -mx-2.5 transition-all duration-200"
                >
                  <span className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-md">
                    {i + 1}
                  </span>
                  <span className="text-xs text-gray-700 leading-relaxed pt-1 group-hover:text-gray-900 transition-colors flex-1">
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl bg-white overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-white">
                    How to Purchase
                  </h3>
                  <p className="text-sm text-purple-100 mt-1">Quick Tutorial</p>
                </div>
                <button
                  className="p-2 hover:bg-white/20 transition-colors text-white text-2xl leading-none"
                  onClick={() => setShowGuide(false)}
                  aria-label="Close tutorial"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 md:p-8">
              {/* Game Info */}
              <div className="flex gap-4 items-center mb-6 pb-6 border-b border-gray-200">
                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 border-gray-200 shadow-md">
                  <img
                    src={currentGame.logo}
                    alt={currentGame.slug || "game logo"}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-lg md:text-xl font-bold text-gray-800 mb-1">
                    {currentGame.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    Read carefully and understand before you make a transaction
                  </p>
                </div>
              </div>

              {/* Guide Steps */}
              <div className="bg-gray-50 px-6 py-5 border border-gray-200">
                <h4 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">
                  Step-by-Step Guide
                </h4>
                <ol className="space-y-3">
                  {currentGame.guide.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex-shrink-0 w-7 h-7 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="text-sm md:text-base text-gray-700 leading-relaxed pt-0.5">
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Close Button */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowGuide(false)}
                  className="px-6 py-2.5 font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all duration-200"
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RechargeDisplay;
