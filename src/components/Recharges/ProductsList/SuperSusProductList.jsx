import React, { useEffect, useRef, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../../config/firebase";
import { useUser } from "../../../context/UserContext";

import diamondImg from "../../../assets/images/large-goldstar.png";
import others from "../../../assets/images/supersus-monthly.png";
import defaultImg from "../../../assets/images/small-goldstar.png";
import smallPacks from "../../../assets/images/medium-goldstar.png";
import mediumPacks from "../../../assets/images/big-goldstar.png";
import largePacks from "../../../assets/images/large-goldstar.png";
import monthly from "../../../assets/images/supersus-monthly.png";
import vip from "../../../assets/images/supersus-supervip.png";
import weekly from "../../../assets/images/supersus-weekly.webp";
import superPass from "../../../assets/images/image.png";
import superPassPackage from "../../../assets/images/image copy.png";
/**
 * MobileLegendsProductList
 * - Now accepts `collectionName` prop (default: "mlproductlist")
 * - Does NOT require an "order" field (no orderBy)
 * - Safer numeric parsing and type checks
 */

const groupNames = {
  goldstar: { label: "Goldstar", img: diamondImg },
  others: { label: "Others", img: others },
};
const collectionName = "ssproductlist";
const SupersusProductList = ({ selectedItem, setSelectedItem }) => {
  const { user } = useUser();
  const [products, setProducts] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [activeGroup, setActiveGroup] = useState("goldstar");
  const selectionRef = useRef(null);

  // Firestore live fetch (uses passed collectionName)
  useEffect(() => {
    setLoaded(false);
    try {
      console.log(collectionName);
      const colRef = collection(db, collectionName);
      const unsub = onSnapshot(
        colRef,
        (snap) => {
          const arr = [];
          snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
          setProducts(arr);
          setLoaded(true);
        },
        (err) => {
          console.error(`${collectionName} snapshot error:`, err);
          setProducts([]);
          setLoaded(true);
        }
      );

      return () => unsub();
    } catch (err) {
      console.error("Error creating snapshot listener:", err);
      setProducts([]);
      setLoaded(true);
      return () => {};
    }
  }, [collectionName]);

  // After selecting, bring selection into view
  useEffect(() => {
    if (selectedItem && selectionRef.current) {
      selectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedItem]);

  if (!loaded) return <div className="py-6 text-center">Loading products…</div>;

  const filteredList = (products || []).filter((item) => {
    if (!item) return false;
    if (item.hide) return false;
    const t = (item.type || "").toLowerCase();
    if (activeGroup === "others") return t === "ss-others";
    return item.group === activeGroup;
  });

  const getImageByGroupOrType = (item) => {
    const diamonds = Number(item.diamonds) || 0;
    const t = (item.type || "").toLowerCase();
    const label = (item.label || "").toLowerCase();

    // Handle "others" group images based on label
    if (item.group === "others" || t === "ss-others") {
      if (label.includes("weekly")) return weekly;
      if (label.includes("monthly")) return monthly;
      if (label.includes("super vip") || label.includes("supervip")) return vip;
      if (label.includes("super pass package")) return superPassPackage;
      if (label.includes("super pass")) return superPass;
      return defaultImg;
    }

    // Handle "goldstar" group images based on diamonds amount
    // If not "others" group, treat as goldstar
    if (diamonds >= 2000) return largePacks;
    if (diamonds >= 1000) return mediumPacks;
    if (diamonds >= 500) return diamondImg;
    if (diamonds >= 100) return smallPacks;
    return smallPacks;
  };

  const formatPrice = (item) => {
    const rupees = Number(item.rupees) || 0;
    const reseller = Number(item.resellerRupees) || 0;

    let parsedAmount = rupees;
    if (user?.role === "reseller" || user?.role === "prime") {
      parsedAmount = reseller || rupees;
    } else if (user?.role === "vip") {
      parsedAmount = Math.round(rupees * 0.97);
    }
    return parsedAmount;
  };

  return (
    <div className="w-full space-y-4  text-gray-900">
      {/* Tabs */}
      <div className="grid grid-cols-4 gap-3 mb-2">
        {Object.entries(groupNames).map(([key, { label, img }]) => (
          <button
            key={key}
            onClick={() => {
              setActiveGroup(key);
              setSelectedItem?.(null);
            }}
            className={`flex flex-col items-center gap-1 p-2 px-0 rounded-lg text-[8px] line-clamp-1 font-semibold border transition-all ${
              activeGroup === key
                ? "bg-yellow-300/90 text-black border-gray-100"
                : "bg-white text-gray-700 border-gray-300"
            }`}
          >
            <img
              src={img}
              alt={label}
              className="w-9 h-9 rounded-sm object-cover"
            />
            <span className="mt-1">{label}</span>
          </button>
        ))}
      </div>

      {/* Notes */}
      {activeGroup === "dd" && (
        <div className="p-3 rounded-md shadow text-sm border-l-4 bg-yellow-100 border-yellow-500 text-yellow-800">
          <strong>Note:</strong> Double Diamonds are only available for
          first-time purchases. If you've already purchased, please choose
          regular diamonds.
        </div>
      )}

      {/* Products grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-2">
        {[...filteredList]
          .sort((a, b) => {
            const aD = Number(a.diamonds) || 0;
            const bD = Number(b.diamonds) || 0;
            return aD - bD;
          })
          .map((item) => {
            const imageSrc = getImageByGroupOrType(item);
            return (
              <div
                key={item.id}
                ref={selectedItem?.id === item.id ? selectionRef : null}
                onClick={() => setSelectedItem?.(item)}
                className={`relative flex flex-col justify-between cursor-pointer p-2 rounded-md border shadow-sm transition hover:shadow-lg bg-white overflow-hidden border-gray-200 ${
                  selectedItem?.id === item.id ? "ring-2 ring-blue-500" : ""
                }`}
              >
                {item.outOfStock && (
                  <div className="absolute -left-10 top-2 w-40 text-center text-[8px] font-bold bg-red-600 text-white rotate-[-45deg] py-1">
                    OUT OF STOCK
                  </div>
                )}

                <div className="flex items-left justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 flex items-center">
                      <img
                        src={imageSrc}
                        alt={item.label}
                        className="w-full h-full object-cover rounded-sm"
                      />
                    </div>
                    <div className="">
                      <div className="text-[10px] line-clamp- font-semibold">
                        {item.group === "others" ||
                        (item.type || "").toLowerCase() === "ss-others" ? (
                          item.label
                        ) : (
                          <>
                            {Number(item.diamonds) || ""}{" "}
                            {item.type === "double diamond"
                              ? "Double"
                              : item.type === "ml-weekly"
                              ? "Weekly"
                              : item.type === "ml-twilight"
                              ? "Twilight"
                              : "Goldstar"}
                          </>
                        )}
                      </div>
                      {item.group !== "others" &&
                        (item.type || "").toLowerCase() !== "ss-others" && (
                          <div className="text-[9px] text-gray-500 mt-1 line-clamp-2">
                            {item.label}
                          </div>
                        )}
                    </div>
                  </div>

                  <div className="flex items-end justify-between">
                    <div className="text-right">
                      <div className="text-xs font-semibold text-green-600">
                        ₹{formatPrice(item)}
                      </div>
                      <div className="text-[10px] text-red-500 line-through">
                        ₹{item.falseRupees}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default SupersusProductList;
