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

// Map games → product list component
const PRODUCT_COMPONENTS = {
  mlbb: MobileLegendsProductList,
  mcgg: MagicChessProductList,
  supersus: SupersusProductList,
  bloodstrike: BloodStrikeProductList,
  gi: GenshinProductList,
  hsr: HonkaiProductList
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
      <div className="py-24 text-center text-gray-700">
        <h1 className="text-3xl font-bold">Game Not Supported</h1>
        <p className="text-gray-500 mt-3 text-lg">
          The game <strong>{gamename}</strong> is not available.
        </p>
      </div>
    );
  }

  return (
    <div className="pt-20 px-4 md:px-10 max-w-7xl mx-auto space-y-8 md:space-y-12">
      
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
  );
};

export default Recharge;
