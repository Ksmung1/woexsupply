import React from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";

const fallbackSvg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='100%25' height='100%25' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-family='Arial' font-size='18'%3EImage%20not%20found%3C/text%3E%3C/svg%3E";

function GameCardComponent({ id, name, tag, img, route, isLoaded, onLoad }) {
  const { isDark } = useTheme();

  return (
    <Link
      to={route}
      aria-label={name}
      className="group w-full flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-lg rounded-lg border border-gray-300 overflow-hidden"
    >
      {/* Image */}
      <div
        className={`relative w-full aspect-square overflow-hidden ${
          isDark ? "bg-gray-700" : "bg-gray-100"
        }`}
      >
        {!isLoaded && (
          <div
            className={`absolute inset-0 animate-pulse bg-gradient-to-r ${
              isDark
                ? "from-gray-700 via-gray-600 to-gray-700"
                : "from-gray-200 via-gray-100 to-gray-200"
            }`}
          />
        )}

        <img
          src={img}
          alt={name}
          loading="lazy"
          draggable={false}
          onLoad={() => onLoad(id)}
          onError={(e) => (e.currentTarget.src = fallbackSvg)}
          className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>

      {/* Text */}
      <div
        className={`px-2 py-1 text-center ${
          isDark ? "bg-gray-800" : "bg-white"
        }`}
      >
        <p
          className={`text-sm font-semibold truncate ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          {name}
        </p>
        {/* <p className="text-xs text-gray-500">{tag}</p> */}
      </div>
    </Link>
  );
}

export const GameCard = React.memo(GameCardComponent);
