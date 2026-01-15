// HomeMenu.jsx
import React, { useState, useCallback } from "react";
import { useTheme } from "../../context/ThemeContext";
import games from "../../assets/files/games";
import { GameCard } from "../Global/GameCard";

const HomeMenu = () => {
  const { isDark } = useTheme();
  const [loaded, setLoaded] = useState({});

  const markLoaded = useCallback((id) => {
    setLoaded((s) => {
      if (s[id]) return s;
      return { ...s, [id]: true };
    });
  }, []);

  const popularGames = games.filter((game) => game.filter === "popular");
  const allGames = games;

  return (
    <section className="py-3 md:py-6" id="coin">
      {/* Popular Games */}
      <div className="mb-3 md:mb-5">
        <div className="flex items-center justify-between mb-2">
          <h3
            className={`text-2xl md:text-3xl font-bold ${
              isDark ? "text-white" : "text-gray-800"
            }`}
          >
            Popular Games
          </h3>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
          {popularGames.map((g) => (
            <GameCard
              key={g.id}
              {...g}
              isLoaded={!!loaded[g.id]}
              onLoad={markLoaded}
            />
          ))}
        </div>
      </div>

      {/* All Games */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3
            className={`text-2xl md:text-3xl font-bold ${
              isDark ? "text-white" : "text-gray-800"
            }`}
          >
            All Games
          </h3>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4">
          {allGames.map((g) => (
            <GameCard
              key={g.id}
              {...g}
              isLoaded={!!loaded[g.id]}
              onLoad={markLoaded}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeMenu;
