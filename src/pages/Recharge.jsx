import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";

import MobileLegendsProductList from "../components/Recharges/ProductsList/MobileLegendsProductList";
import MagicChessProductList from "../components/Recharges/ProductsList/MagicChessProductList";

import RechargeDisplay from "../components/Recharges/RechargeDisplay";
import RechargeForm from "../components/Recharges/RechargeForm";
import RechargeCheckout from "../components/Recharges/RechargeCheckout";
import SupersusProductList from "../components/Recharges/ProductsList/SuperSusProductList";
import BloodStrikeProductList from "../components/Recharges/ProductsList/BloodStrikeProductList";
import GenshinProductList from "../components/Recharges/ProductsList/GenshinProductList";
import HonkaiProductList from "../components/Recharges/ProductsList/HonkaiProductList";
import CustomProductList from "../components/Recharges/ProductsList/CustomProductList";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import { FaUser } from "react-icons/fa";

// Map games → product list component
const PRODUCT_COMPONENTS = {
  mlbb: MobileLegendsProductList,
  mcgg: MagicChessProductList,
  supersus: SupersusProductList,
  bloodstrike: BloodStrikeProductList,
  gi: GenshinProductList,
  hsr: HonkaiProductList,
  custom: CustomProductList,
};

const Recharge = () => {
  const { gamename } = useParams();
  const {user} = useUser()
  const {isDark} = useTheme()
  const formRef = useRef(null);
  const gameKey = gamename?.toLowerCase();
  const navigate = useNavigate();

  const ProductList = PRODUCT_COMPONENTS[gameKey];

  const [userId, setUserId] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [username, setUsername] = useState("");
  const [usernameExists, setUsernameExists] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    if (selectedItem && formRef.current) {
      formRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [selectedItem]);

    if (!user) {
      return (
        <div className={`min-h-screen-dvh bg-gradient-to-br flex items-center justify-center px-4 ${isDark ? "from-gray-900 via-gray-800 to-gray-900" : "from-purple-50 via-indigo-50 to-pink-50"}`}>
          <div className={`max-w-md w-full rounded-3xl shadow-2xl p-8 text-center ${isDark ? "bg-gray-800" : "bg-white"}`}>
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center">
              <FaUser className="text-white text-4xl" />
            </div>
            <h2 className={`text-3xl font-bold mb-3 ${isDark ? "text-white" : "text-gray-800"}`}>
              Sign In Required
            </h2>
            <p className={isDark ? "text-gray-400 mt-2" : "text-gray-600 mt-2"}>
              Please sign in to recharge Games.
            </p>
            <button
              onClick={() => navigate("/authentication-selection")}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Sign In Now
            </button>
          </div>
        </div>
      );
    }
  
  

  if (!ProductList) {
    return (
      <div className="min-h-screen-dvh bg-gradient-to-br from-gray-50 via-purple-50/30 to-indigo-50/30 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Game Not Supported
          </h1>
          <p className="text-gray-600 text-lg">
            The game <strong>{gamename}</strong> is not available.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isDark ? "min-h-screen-dvh bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800" : "min-h-screen-dvh bg-gradient-to-br from-gray-50 via-purple-50/30 to-indigo-50/30"} py-8`}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 space-y-8 md:space-y-12">
        {/* Game header */}
        <RechargeDisplay gamename={gameKey} />

        {/* Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* LEFT — ONLY ProductList */}
          <div>
            <ProductList
              selectedItem={selectedItem}
              setSelectedItem={setSelectedItem}
            />
          </div>

          {/* RIGHT — Form + Checkout */}
          <div id="form" ref={formRef} className="space-y-6">
            <RechargeForm
              userId={userId}
              setUserId={setUserId}
              zoneId={zoneId}
              setZoneId={setZoneId}
              username={username}
              setUsername={setUsername}
              usernameExists={usernameExists}
              setUsernameExists={setUsernameExists}
            />

            <RechargeCheckout
              selectedItem={selectedItem}
              setSelectedItem={setSelectedItem}
              userId={userId}
              setUserId={setUserId}
              zoneId={zoneId}
              setZoneId={setZoneId}
              username={username}
              setUsername={setUsername}
              usernameExists={usernameExists}
              setUsernameExists={setUsernameExists}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Recharge;
