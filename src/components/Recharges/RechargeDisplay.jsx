import { useState } from "react";
import { useLocation } from "react-router-dom";
import displayML from "../../assets/images/ml-logo.avif";
import displayMCGG from "../../assets/images/mcgg.avif";
import mlLogo from "../../assets/images/ml-logo.avif";
import mcLogo from "../../assets/images/mcgg.avif"
import ssLogo from '../../assets/images/supersus.webp'
import displaySS from "../../assets/images/Supersus-bg.jpg"
import bsLogo from "../../assets/images/blood-strike.webp"
import displayBS from "../../assets/images/blood-strike-bg.jpg"
import genLogo from "../../assets/images/genshin.jpg"
import hsrLogo from "../../assets/images/honkai.avif"
import displayGI from "../../assets/images/genshin-bg.jpg"
import displayHSR from "../../assets/images/honkai-display.avif"
import { IoIosInformationCircle } from "react-icons/io";

const gameInfo = {
  "/recharge/mlbb": {
    name: "Mobile Legends: Bang Bang",
    image: displayML,
    guide: [
      "Go to Profile on Mobile Legends",
      "Tap on the User ID — it will auto-copy UserID & ZoneID",
      "Paste the copied ID — it will auto-fill the fields",
      "Check username; if correct, proceed",
      "Click Purchase",
      "Confirm",
      "Enjoy!"
    ],
    logo: mlLogo
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
      "Enjoy your items!"
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
      "Enjoy your items!"
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
      "Enjoy your items!"
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
      "Enjoy your items!"
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
      "Enjoy your items!"
    ],
    logo: genLogo,
  }

};

const RechargeDisplay = () => {
  const [showGuide, setShowGuide] = useState(false);
  const location = useLocation();
  const isDarkMode = false
  const currentGame = gameInfo[location.pathname] || gameInfo["/recharge"];
return (
<div className="relative w-full h-[200px] md:h-[300px] overflow-hidden shadow-lg"
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
          : "bg-gradient-to-r from-black/70 to-black/20"
      }`}
    />

    {/* Content on top of background */}
    <div
      className={`relative z-10 p-4 md:p-6 flex flex-col gap-2 items-center justify-end h-full ${
        isDarkMode ? "text-gray-200" : "text-white"
      }`}
    >
      <div className="flex gap-2 items-center">
   <div className="w-20 aspect-square rounded-sm overflow-hidden flex items-center justify-center bg-black/10">
  <img
    className="w-full h-full object-cover"
    src={currentGame.logo}
    alt={currentGame.slug || "game logo"}
  />
</div>
        <div>
          <h2
            className={`text-lg md:text-lg font-bold ${
              isDarkMode ? "text-gray-200" : "text-white"
            }`}
          >
            {currentGame.name}
          </h2>
          <div className="flex flex-wrap gap-2 text-sm">
            {["24/7 Chat Support", "Safe Payment", "Official Store", "Service Guarantee", "Instant Delivery"].map((tag, i) => (
              <span
                key={i}
                className={`px-1 py-[1px] text-[9px] rounded ${
                  isDarkMode
                    ? "bg-gray-700 text-gray-300"
                    : "bg-white/90 text-black"
                }`}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <button
        className="mt-4 absolute bottom-0 right-0 text-xs flex items-center gap-1 bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded shadow"
        onClick={() => setShowGuide(true)}
      >
        <IoIosInformationCircle className="text-lg" />
        How to purchase
      </button>
    </div>

    {/* Modal */}
{showGuide && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
    <div
      className={`relative w-full max-w-md rounded-xl border shadow-2xl ${
        isDarkMode
          ? "bg-gray-900 border-green-400 text-gray-300"
          : "bg-white border-green-400 text-gray-900"
      }`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between px-4 py-2 rounded-t-xl text-white ${
          isDarkMode ? "bg-green-700" : "bg-gradient-to-r from-green-500 to-green-600"
        }`}
      >
        <span className="text-lg font-bold">Woex Supply</span>
        <button
          className="text-xl font-bold hover:text-red-400 cursor-pointer"
          onClick={() => setShowGuide(false)}
          aria-label="Close tutorial"
        >
          ×
        </button>
      </div>

      {/* Body */}
      <div className="p-4">
        <p className="text-sm font-bold mb-2">Quick Tutorial</p>

        {/* Game Info */}
        <div className="flex gap-4 items-center mb-4">
          <div className="w-16 aspect-square rounded overflow-hidden relative">
            <img
              src={currentGame.logo}
              alt={currentGame.slug || "game logo"}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
          <div>
            <p className={`text-md font-bold font-serif ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>
              {currentGame.name}
            </p>
            <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}>
              Read carefully and understand before you make a transaction
            </p>
          </div>
        </div>

        {/* Guide Steps */}
        <div
          className={`rounded-lg px-4 py-3 shadow-inner border-2 text-sm leading-relaxed ${
            isDarkMode
              ? "bg-gray-800 border-gray-700 text-gray-300"
              : "bg-gray-50 border-gray-200 text-black"
          }`}
        >
          <ol className="list-decimal list-outside pl-4 space-y-1">
            {currentGame.guide.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  </div>
)}

  </div>
);

};

export default RechargeDisplay;
