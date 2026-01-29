import React, { useEffect, useRef, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../../config/firebase";
import { useUser } from "../../../context/UserContext";

import defaultImg from "../../../assets/images/hsr.png";
import express from "../../../assets/images/express-supply-pass.webp";

/**
 * HonkaiProductList
 * - Has tabs for filtering products
 * - Props: selectedItem, setSelectedItem (same contract as MobileLegends)
 * - Default collection: "hsrproductlist"
 */

const groupNames = {
  hsr: { label: "HSR", img: defaultImg },
  others: { label: "Others", img: express },
};

const collectionName = "hsrproductlist";

const HonkaiProductList = ({ selectedItem, setSelectedItem }) => {
  const { user } = useUser();
  const [products, setProducts] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [activeGroup, setActiveGroup] = useState("hsr");
  const selectionRef = useRef(null);

  // Firestore live fetch
  useEffect(() => {
    setLoaded(false);
    try {
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
  }, []); // collectionName is a constant

  // Scroll into view when selection changes
  useEffect(() => {
    if (selectedItem && selectionRef.current) {
      selectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedItem]);

  if (!loaded) return <div className="py-6 text-center">Loading products…</div>;

  // Filter products based on active group
  const filteredList = (products || []).filter((item) => {
    if (!item) return false;
    if (item.hide) return false;
    const t = (item.type || "").toLowerCase();
    if (activeGroup === "others") return t === "hsr-others";
    return item.group === activeGroup;
  });

  // Simple image selector - use express-supply-pass.webp for express items, hsr.png for others
  const getImageForItem = (item) => {
    const label = (item.label || "").toLowerCase();
    const type = (item.type || "").toLowerCase();

    // Check if it's an express supply pass item
    if (
      label.includes("express") ||
      label.includes("supply") ||
      type.includes("express") ||
      type.includes("supply")
    ) {
      return express;
    }

    // Default to hsr.png for all other items
    return defaultImg;
  };

  // Price formatting taking role into account (same logic as MobileLegends)
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
    <div className="w-full space-y-4 text-gray-900">
      {/* Tabs */}
      <div className="grid grid-cols-2 gap-3 mb-2">
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

      {/* Products grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-2">
        {[...filteredList]
          .sort((a, b) => {
            // sort by diamonds (numeric) ascending for predictable order
            const aD = Number(a.diamonds) || 0;
            const bD = Number(b.diamonds) || 0;
            return aD - bD;
          })
          .map((item) => {
            const imageSrc = getImageForItem(item);
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
                    <div>
                      <div className="text-[10px] font-semibold">
                        {Number(item.diamonds) || ""} {item.type || "Top Up"}
                      </div>
                      <div className="text-[9px] text-gray-500 mt-1 line-clamp-2">
                        {item.label}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-end justify-between">
                    <div className="text-right">
                      <div className="text-xs font-semibold text-green-600">
                        ₹{formatPrice(item)}
                      </div>
                      {item.falseRupees ? (
                        <div className="text-[10px] text-red-500 line-through">
                          ₹{item.falseRupees}
                        </div>
                      ) : null}
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

export default HonkaiProductList;
