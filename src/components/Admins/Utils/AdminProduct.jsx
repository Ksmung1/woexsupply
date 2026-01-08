import React from "react";
import { useTheme } from "../../../context/ThemeContext";

const AdminProduct = ({
  item,
  isSelected,
  onSelect,
  onToggleOutOfStock,
  onHideToggle,
  typeImageMap = {},
  defaultImage = "/assets/images/default.png", // ← fallback image
}) => {
  const { isDark } = useTheme();
  // Smart type resolver
  const resolvedType = (item.type || "").toLowerCase();

  // Use item.image if available, otherwise fall back to typeImageMap or defaultImage
  const imageSrc =
    item.image || typeImageMap[resolvedType] || typeImageMap[item.type] || defaultImage;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(item)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect(item);
      }}
      className={`rounded-xl border-2 shadow-md transition-all duration-200 relative cursor-pointer overflow-hidden
        ${isDark ? "bg-gray-800" : "bg-white"}
        ${isSelected ? "ring-2 ring-purple-500 ring-offset-2 border-purple-500" : isDark ? "border-gray-700 hover:border-purple-500" : "border-gray-200 hover:border-purple-300"}
        hover:shadow-xl`}
    >
      {/* API tag */}
      <span
        onClick={(e) => {
          e.stopPropagation();
          onToggleOutOfStock(item);
        }}
        className={`absolute top-2 right-2 text-[10px] md:text-xs px-2 py-1 rounded-md text-white font-semibold shadow-md ${
          item.api === "yokcash"
            ? "bg-blue-500"
            : item.api === "busan"
            ? "bg-pink-500"
            : "bg-green-500"
        }`}
      >
        {item.api?.toUpperCase()}
      </span>

      {/* Stock badge */}
      <span
        onClick={(e) => {
          e.stopPropagation();
          onToggleOutOfStock(item);
        }}
        className={`absolute top-2 left-2 text-[10px] md:text-xs px-2 py-1 rounded-md text-white font-semibold shadow-md ${
          item.outOfStock ? "bg-red-500" : "bg-green-500"
        }`}
      >
        {item.outOfStock ? "OUT OF STOCK" : "IN STOCK"}
      </span>

      {/* Content */}
      <div className="p-4 md:p-5 pt-12 md:pt-14">
        <div className="flex gap-3 md:gap-4 items-start mb-4">
          {/* Image */}
          <div className={`w-16 h-16 md:w-20 md:h-20 flex-shrink-0 flex items-center justify-center rounded-lg border ${isDark ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"}`}>
            <img
              className="w-full h-full object-contain rounded-lg"
              src={imageSrc}
              onError={(e) => {
                e.currentTarget.src = defaultImage;
              }}
              alt={item.type}
            />
          </div>

          {/* Label and Diamonds */}
          <div className="flex-1 min-w-0">
            <p className={`text-sm md:text-base font-semibold mb-1 truncate ${isDark ? "text-white" : "text-gray-800"}`}>
              {item.label}
            </p>
            <div className="flex items-center gap-2">
              <span className={`text-xs md:text-sm font-bold ${isDark ? "text-purple-400" : "text-purple-600"}`}>
                {item.diamonds}
              </span>
              <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            {item.type?.includes("weekly")
              ? "Weekly Pass"
              : item.type?.includes("twilight")
              ? "Twilight Pass"
              : "Diamonds"}
          </span>
            </div>
        </div>
      </div>

        {/* Pricing */}
        <div className={`space-y-2 mb-4 pb-4 border-b ${isDark ? "border-gray-700" : "border-gray-100"}`}>
          <div className="flex items-baseline gap-2">
            <span className={`text-lg md:text-xl font-bold ${isDark ? "text-white" : "text-gray-800"}`}>
              ₹{item.rupees}
            </span>
            {item.falseRupees && (
              <span className="text-xs md:text-sm text-red-500 line-through">
              ₹{item.falseRupees}
            </span>
            )}
          </div>
          {item.resellerRupees && (
            <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              Reseller: <span className="font-semibold">₹{item.resellerRupees}</span>
            </p>
          )}
          {item.price && (
            <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}>
              Price: <span className="font-medium">₹{item.price}</span>
            </p>
          )}
        </div>

        {/* Hide/Show Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onHideToggle(item.id, item?.hide);
          }}
          className={`w-full text-xs md:text-sm font-semibold py-2 px-4 rounded-lg transition-all duration-200 ${
            item.hide
              ? "bg-orange-500 hover:bg-orange-600 text-white"
              : isDark
              ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
              : "bg-gray-200 hover:bg-gray-300 text-gray-700"
          }`}
        >
          {item.hide ? "SHOW PRODUCT" : "HIDE PRODUCT"}
        </button>
      </div>
    </div>
  );
};

export default React.memo(AdminProduct);
