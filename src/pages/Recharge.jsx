import React, { useState } from "react";
import { useParams } from "react-router-dom";

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
  const gameKey = gamename?.toLowerCase();

  const ProductList = PRODUCT_COMPONENTS[gameKey];

  const [userId, setUserId] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [username, setUsername] = useState("");
  const [usernameExists, setUsernameExists] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  if (!ProductList) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-indigo-50/30 flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-indigo-50/30 py-8">
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
          <div id="form" className="space-y-6">
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
