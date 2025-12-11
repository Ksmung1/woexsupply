import React, { useState } from "react";
import games from "../../assets/files/games";
import MobileLegendsAdmin from "./Products/MobileLegendsAdmin";
import MagicChessAdmin from "./Products/MagicChessAdmin";
import BloodStrikeAdmin from "./Products/BloodStrikeAdmin";
import HonkaiAdmin from "./Products/HonkaiAdmin";
import GenshinAdmin from "./Products/GenshinAdmin";
import SuperSusAdmin from "./Products/SuperSusAdmin";

const componentMap = {
  mlbb: MobileLegendsAdmin,
  mcgg: MagicChessAdmin,
  ss: SuperSusAdmin,
  bs: BloodStrikeAdmin,
  hsr: HonkaiAdmin,
  gi: GenshinAdmin,
};

const AdminProducts = () => {
  const gamesArray = Array.isArray(games) ? games : [];
  const defaultGameKey = gamesArray[0]?.tag ?? null;
  const [selected, setSelected] = useState(defaultGameKey);

  const getComponentFor = (game) => {
    const key = game?.tag;
    return componentMap[key] ?? (() => (
      <div className="p-4">
        No admin UI for <strong>{game?.name ?? "Unknown"}</strong>
      </div>
    ));
  };

  if (!gamesArray.length) {
    return (
      <div className="py-4 px-4">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <p>No games configured.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 px-4">
      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {gamesArray.map((g, idx) => {
          const key = g.tag ?? `game-${idx}`;
          const isActive = key === selected;
          return (
            <button
              key={key}
              onClick={() => setSelected(key)}
              className={`px-3 py-1.5 rounded-md text-sm whitespace-nowrap ${
                isActive
                  ? "bg-blue-600 text-white shadow"
                  : "bg-white text-gray-700 border border-gray-200 hover:shadow-sm"
              }`}
            >
              {key.toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* Panels */}
      {gamesArray.map((g, idx) => {
        const key = g.tag ?? `game-${idx}`;
        const PanelComponent = getComponentFor(g);
        const isActive = key === selected;

        return (
          <div key={key} hidden={!isActive}>
            {isActive && (
              <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-4">
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
