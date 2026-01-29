import React, { useState } from "react";
import CharismaProductList from "../components/Recharges/ProductsList/CharismaProductList";
import CharismaCheckout from "../components/Recharges/CharismaCheckout";
import RechargeFormZone from "../components/Recharges/RechargeFormZone";

const Charisma = () => {
  const [userId, setUserId] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [username, setUsername] = useState("");
  const [usernameExists, setUsernameExists] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // MLBB config for username checking
  const config = {
    product: "mobilelegends",
    productId: "13",
    storageKey: "charisma_prev_data",
    type: "useridandzoneid",
  };

  return (
    <div className="min-h-screen-dvh bg-gradient-to-br from-gray-50 via-purple-50/30 to-indigo-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 space-y-8 md:space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            Charisma Products
          </h1>
          <p className="text-gray-600 text-lg">
            Purchase charisma products - orders will be processed manually
          </p>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* LEFT — ProductList */}
          <div>
            <CharismaProductList
              selectedItem={selectedItem}
              setSelectedItem={setSelectedItem}
            />
          </div>

          {/* RIGHT — Form + Checkout */}
          <div id="form" className="space-y-6">
            <RechargeFormZone
              userId={userId}
              setUserId={setUserId}
              zoneId={zoneId}
              setZoneId={setZoneId}
              username={username}
              setUsername={setUsername}
              usernameExists={usernameExists}
              setUsernameExists={setUsernameExists}
              config={config}
            />

            <CharismaCheckout
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

export default Charisma;

