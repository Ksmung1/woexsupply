import React from "react";

const AdminProduct = ({
  item,
  isSelected,
  onSelect,
  onToggleOutOfStock,
  onHideToggle,
  typeImageMap = {},
  defaultImage = "/assets/images/default.png", // ← fallback image
}) => {
  // Smart type resolver
  const resolvedType = (item.type || "").toLowerCase();

  const imageSrc =
    typeImageMap[resolvedType] || typeImageMap[item.type] || defaultImage;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(item)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect(item);
      }}
      className={`flex justify-between items-center p-3 rounded-2xl border shadow-md transition-all duration-200 hover:shadow-lg relative cursor-pointer
        ${isSelected ? "ring-2 ring-offset-2 ring-blue-500" : ""}`}
    >
      {/* API tag */}
      <span
        onClick={(e) => {
          e.stopPropagation();
          onToggleOutOfStock(item);
        }}
        className={`absolute -top-2 right-0 text-[10px] px-2 py-[2px] rounded-sm text-white font-semibold ${
          item.api === "yokcash"
            ? "bg-blue-500"
            : item.api === "busan"
            ? "bg-pink-400"
            : "bg-green-500"
        }`}
      >
        {item.api}
      </span>

      {/* Left-side: Image + label */}
      <div className="flex gap-3 items-center">
        <div className="w-10 h-10 flex items-center justify-center">
          <img
            className="w-full h-full object-contain rounded-lg"
            src={imageSrc}
            onError={(e) => {
              e.currentTarget.src = defaultImage;
            }}
            alt={item.type}
          />
        </div>

        <div className="flex flex-col relative">
          <span className="text-[11px] font-semibold">
            {item.diamonds}{" "}
            {item.type?.includes("weekly")
              ? "Weekly Pass"
              : item.type?.includes("twilight")
              ? "Twilight Pass"
              : "Diamonds"}
          </span>
          <p className="text-xs text-gray-500">{item.label}</p>

          {/* Stock badge */}
          <span
            onClick={(e) => {
              e.stopPropagation();
              onToggleOutOfStock(item);
            }}
            className={`absolute -top-5 left-0 text-[10px] px-2 py-[2px] rounded-sm text-white font-semibold ${
              item.outOfStock ? "bg-red-500" : "bg-green-500"
            }`}
          >
            {item.outOfStock ? "Out Stock" : "In Stock"}
          </span>
        </div>
      </div>

      {/* Right-side: Pricing + Hide toggle */}
      <div className="flex flex-col items-end gap-1">
        <div className="text-right">
          <p className="text-sm font-bold text-blue-600">
            ₹{item.rupees} |{" "}
            <span className="text-red-600 text-[12px] line-through">
              ₹{item.falseRupees}
            </span>
          </p>
          {item.resellerRupees && (
            <p className="text-xs font-medium text-gray-500">
              Reseller: ₹{item.resellerRupees}
            </p>
          )}
          <p className="text-[10px] text-gray-500">Price: {item.price}</p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onHideToggle(item.id, item?.hide);
          }}
          className={`text-xs cursor-pointer px-3 py-[4px] rounded font-medium text-white ${
            item.hide ? "bg-orange-500" : "bg-gray-500"
          }`}
        >
          {item.hide ? "SHOW" : "HIDE"}
        </button>
      </div>
    </div>
  );
};

export default React.memo(AdminProduct);
