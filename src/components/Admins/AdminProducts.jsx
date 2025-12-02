import React, { useState } from "react";
import games from "../../assets/files/games"; // your games array
import MobileLegendsAdmin from "./Products/MobileLegendsAdmin";
import MagicChessAdmin from "./Products/MagicChessAdmin";
import SuperSusAdmin from "./Products/SuperSusAdmin";
import BloodStrikeAdmin from "./Products/BloodStrikeAdmin";

const componentMap = {
  mlbb: MobileLegendsAdmin,
  mcgg: MagicChessAdmin,
  ss: SuperSusAdmin,
  bs: BloodStrikeAdmin
};

const AdminProducts = () => {
  // choose the default selected game (first one)
  const defaultGameKey = games.length ? (games[0].tag || "mlbb") : null;
  const [selected, setSelected] = useState(defaultGameKey);

  // helper to get component for a game
  const getComponentFor = (game) => {
    const key = game.tag ;
    return componentMap[key] ?? (() => <div className="p-4">No admin UI for <strong>{game.name}</strong></div>);
  };

  return (
    <div className=" mt-20 px-4">
      <div>

        {/* Tab list */}
        <div role="tablist" aria-label="Game tabs" className="flex gap-2 overflow-x-auto pb-2">
          {games.map((g) => {
            const key = g.tag;
            const isActive = key === selected;
            return (
              <button
                key={key}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${key}`}
                id={`tab-${key}`}
                onClick={() => setSelected(key)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap focus:outline-none focus:ring-2 ${
                  isActive
                    ? "bg-blue-600 text-white shadow"
                    : "bg-white text-gray-700 border border-gray-200 hover:shadow-sm"
                }`}
              >
                {g.tag.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Panels */}
      <div>
        {games.map((g) => {
          const key = g.tag;
          const PanelComponent = getComponentFor(g);
          const isActive = key === selected;
          return (
            <div
              key={key}
              id={`panel-${key}`}
              role="tabpanel"
              aria-labelledby={`tab-${key}`}
              hidden={!isActive}
            >
              {isActive && (
                <div className="mt-2 bg-white border border-gray-100 rounded-lg shadow-sm p-4">
                  <PanelComponent game={g} collectionName={g.collectionName}/>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminProducts;
