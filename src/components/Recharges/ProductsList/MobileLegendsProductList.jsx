import React, { useEffect, useRef, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../../config/firebase";
import { useUser } from "../../../context/UserContext";

import firstRechargeImg from "../../../assets/images/dd.avif";
import weeklyImg from "../../../assets/images/weekly.avif";
import twilightImg from "../../../assets/images/twilight.jpg";
import defaultImg from "../../../assets/images/d1.jpg";
import smallPacks from "../../../assets/images/small-packs.png";
import mediumPacks from "../../../assets/images/medium-packs.png";
import largePacks from "../../../assets/images/large-packs.png";
import hvp from "../../../assets/images/hvp.png";
import mellite from "../../../assets/images/elite-bundle.webp";
import mEpic from "../../../assets/images/epic-bundle.webp";

/**
 * MobileLegendsProductList
 * 
 * 
 * - Now accepts `collectionName` prop (default: "mlproductlist")
 * - Does NOT require an "order" field (no orderBy)
 * - Safer numeric parsing and type checks
 */

const groupNames = {
  dd: {
    label: "First Recharge",
    img: firstRechargeImg,
  },
  d: {
    label: "Diamonds",
    img: mediumPacks,
  },
  weekly: {
    label: "Weekly Pass",
    img: weeklyImg,
  },
  twilight: {
    label: "Others",
    img: twilightImg,
  },
};
const collectionName = "mlbbproductlist";
const MobileLegendsProductList = ({ selectedItem, setSelectedItem }) => {
  const { user } = useUser();
  const [products, setProducts] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [activeGroup, setActiveGroup] = useState("dd");
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

  const filteredList = (products || [])
    .filter((item) => {
      if (!item) return false;
      if (item.hide) return false;
      const t = (item.type || "").toLowerCase();
      if (activeGroup === "twilight") return t === "ml-twilight" || t === "twilight pass" || item.group === "twilight";
      if (activeGroup === "weekly") return t === "ml-weekly";
      return item.group === activeGroup;
    })
    .sort((a, b) => a.rupees - b.rupees);

  const getImageByGroupOrType = (item) => {
    const diamonds = Number(item.diamonds) || 0;
    const t = (item.type || "").toLowerCase();
    if (item.label === "High-Value Pass") return hvp;
    if (item.label === "Weekly Elite Bundle") return mellite;
    if (item.label === "Monthly Epic Bundle") return mEpic;
    if (t === "weekly") return weeklyImg;
    if (t === "twilight pass") return hvp;

    if (item.group === "d") {
      if (diamonds >= 2000) return largePacks;
      if (diamonds >= 1000) return mediumPacks;
      if (diamonds >= 500) return mediumPacks;
      if (diamonds >= 100) return smallPacks;
      return smallPacks;
    }

    if (item.group === "dd") return firstRechargeImg;
    if (item.group === "weekly") return weeklyImg;
    if (item.group === "twilight") return twilightImg;
    return defaultImg;
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
      <div className="grid grid-cols-4 gap-3 mb-4">
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
              className="w-14 h-10 rounded-sm object-contain"
            />
            <span className="mt-">{label}</span>
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
                    <div className="w-8 h-8 flex object-contain items-center">
                      <img
                        src={imageSrc}
                        alt={item.label}
                        className="w-full h-full object-contain rounded-sm"
                      />
                    </div>
                    <div className="">
                      <div className="text-[10px] font-semibold line-clamp-2">
                        {item.label}
                      </div>
                      <div className="text-[9px] text-gray-500 mt-1">
                        {Number(item.diamonds) ? `${Number(item.diamonds)} Diamonds` : ""}
                      </div>
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

export default MobileLegendsProductList;
