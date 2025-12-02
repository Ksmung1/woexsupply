// GameCard.jsx
import React from "react";
import { Link } from "react-router-dom";

const fallbackSvg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='100%25' height='100%25' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-family='Arial' font-size='18'%3EImage%20not%20found%3C/text%3E%3C/svg%3E";

function GameCardComponent({ id, name, img, route, isLoaded, onLoad }) {
  return (
    <Link
      to={route}
      aria-label={name}
      className="w-full group rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-md transition transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
    >
      <div className="w-full aspect-square bg-gray-100 relative">
        {!isLoaded && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100" />
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

      <div className="px-2 py-1 text-left">
        <p className="text-xs font-semibold text-gray-800 truncate">{name}</p>
      </div>
    </Link>
  );
}

export const GameCard = React.memo(GameCardComponent);
