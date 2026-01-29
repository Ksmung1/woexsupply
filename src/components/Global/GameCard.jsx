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
      className="group flex flex-col items-center text-center focus:outline-none"
    >
      {/* Icon */}
      <div className="relative w-20 md:w-24 h-20 md:h-24 aspect-square">
        {!isLoaded && (
          <div
            className={`absolute inset-0 rounded-2xl animate-pulse ${
              isDark ? "bg-gray-700" : "bg-gray-200"
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
          className={`w-full h-full object-cover rounded-2xl transition-all duration-200
            ${isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"}
            group-hover:scale-105`}
        />
      </div>

      {/* Name */}
      <p
        className={`mt-2 text-xs sm:text-sm font-medium leading-tight line-clamp-2
          ${isDark ? "text-gray-100" : "text-gray-800"}`}
      >
        {name}
      </p>

      {/* Tag / Region */}
      {/* {tag && (
        <p
          className={`text-[11px] ${
            isDark ? "text-gray-400" : "text-gray-500"
          }`}
        >
          ({tag})
        </p>
      )} */}
    </Link>
  );
}

export const GameCard = React.memo(GameCardComponent);
