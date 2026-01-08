import React, { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import games from "../../assets/files/games";
import MobileLegendsAdmin from "./Products/MobileLegendsAdmin";
import MagicChessAdmin from "./Products/MagicChessAdmin";
import BloodStrikeAdmin from "./Products/BloodStrikeAdmin";
import HonkaiAdmin from "./Products/HonkaiAdmin";
import GenshinAdmin from "./Products/GenshinAdmin";
import SuperSusAdmin from "./Products/SuperSusAdmin";
import CharismaAdmin from "./Products/CharismaAdmin";
import SkinAdmin from "./Products/SkinAdmin";
import CustomAdmin from "./Products/CustomAdmin";

const componentMap = {
  mlbb: MobileLegendsAdmin,
  mcgg: MagicChessAdmin,
  ss: SuperSusAdmin,
  bs: BloodStrikeAdmin,
  hsr: HonkaiAdmin,
  gi: GenshinAdmin,
  custom: CustomAdmin,

  charisma: CharismaAdmin,
  skin: SkinAdmin,
};

const AdminProducts = () => {
  const { isDark } = useTheme();
  const gamesArray = Array.isArray(games) ? games : [];
  // Filter out charisma and skin from games array to avoid duplicates
  const filteredGames = gamesArray.filter(
    (game) => game.tag !== "charisma" && game.tag !== "skin"
  );
  // Add manual product tabs
  const manualProducts = [
    {
      tag: "charisma",
      name: "Charisma",
      collectionName: "charismaproductlist",
    },
    { tag: "skin", name: "Skin", collectionName: "skinproductlist" },
  ];
  const allProducts = [...filteredGames, ...manualProducts];
  const defaultGameKey = allProducts[0]?.tag ?? null;
  const [selected, setSelected] = useState(defaultGameKey);

  const getComponentFor = (game) => {
    const key = game?.tag;
    return (
      componentMap[key] ??
      (() => (
        <div className="p-4">
          No admin UI for <strong>{game?.name ?? "Unknown"}</strong>
        </div>
      ))
    );
  };

  if (!allProducts.length) {
    return (
      <div className="py-4 px-4">
        <div className={`border-l-4 p-4 ${isDark ? "bg-yellow-900/30 border-yellow-600" : "bg-yellow-50 border-yellow-400"}`}>
          <p className={isDark ? "text-gray-200" : "text-gray-900"}>No products configured.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-2 sm:py-4 px-2 sm:px-4">
      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {allProducts.map((g, idx) => {
          const key = g.tag ?? `game-${idx}`;
          const isActive = key === selected;
          return (
            <button
              key={key}
              onClick={() => setSelected(key)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm whitespace-nowrap transition-all ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg"
                  : isDark
                  ? "bg-gray-800 text-gray-300 border border-gray-700 hover:shadow-sm hover:bg-gray-700"
                  : "bg-white text-gray-700 border border-gray-200 hover:shadow-sm hover:bg-gray-50"
              }`}
            >
              {g.name || key.toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* Panels */}
      {allProducts.map((g, idx) => {
        const key = g.tag ?? `game-${idx}`;
        const PanelComponent = getComponentFor(g);
        const isActive = key === selected;

        return (
          <div key={key} hidden={!isActive}>
            {isActive && (
              <div className={`border rounded-lg shadow-sm p-3 sm:p-4 lg:p-6 mt-2 sm:mt-4 ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
                <PanelComponent game={g} collectionName={g.collectionName} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AdminProducts;
