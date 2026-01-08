// GameCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";

const fallbackSvg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='100%25' height='100%25' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-family='Arial' font-size='18'%3EImage%20not%20found%3C/text%3E%3C/svg%3E";

function GameCardComponent({ id, name, img, route, isLoaded, onLoad }) {
  const { isDark } = useTheme();
  
  return (
    <Link
      to={route}
      aria-label={name}
      className={`w-full group overflow-hidden gap-1 flex-col flex transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 active:scale-95 rounded-lg border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
    >
      <div className={`w-full rounded-lg overflow-hidden aspect-square relative ${isDark ? "bg-gray-700" : "bg-gray-100"}`}>
        {!isLoaded && (
          <div className={`absolute inset-0 animate-pulse bg-gradient-to-r ${isDark ? "from-gray-700 via-gray-600 to-gray-700" : "from-gray-100 via-gray-200 to-gray-100"}`} />
        )}

        <img
          src={img}
          alt={name}
          loading="lazy"
          onLoad={() => onLoad(id)}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          draggable={false}
          onError={(e) => {
            e.currentTarget.src = fallbackSvg;
          }}
        />
      </div>

      <div className="px-2 py-1 text-left text-center">
        <p className={`text-xs font-semibold text-center ${isDark ? "text-white" : "text-gray-800"}`}>{name}</p>
      </div>
    </Link>
  );
}

export const GameCard = React.memo(GameCardComponent);
