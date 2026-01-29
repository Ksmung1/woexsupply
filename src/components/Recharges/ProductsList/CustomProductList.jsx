import React, { useEffect, useRef, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../../config/firebase";
import { useUser } from "../../../context/UserContext";

/* ===== GROUP IMAGES ===== */
import firstRechargeImg from "../../../assets/images/dd.avif";
import group1 from "../../../assets/images/d1.jpg";
import group2 from "../../../assets/images/d3.jpg";
import group3 from "../../../assets/images/d4.jpg";
import group4 from "../../../assets/images/d5.jpg";
import group5 from "../../../assets/images/d2.jpg";
import defaultImg from "../../../assets/images/d1.jpg";

const collectionName = "customproductlist";

/* 🔒 SINGLE SOURCE OF TRUTH (LABEL + IMAGE) */
const GROUP_CONFIG = {
  group1: {
    label: "50 Recharge Task",
    image: group1,
  },
  group2: {
    label: "100 Recharge Task",
    image: group4,
  },
  group3: {
    label: "250 Recharge Task",
    image: group5,
  },
  group4: {
    label: "500 Recharge Task",
    image: group2,
  },
  group5: {
    label: "1000 Recharge Task",
    image: group3,
  },
};

const CustomProductList = ({ selectedItem, setSelectedItem }) => {
  const { user } = useUser();

  const [products, setProducts] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [activeGroup, setActiveGroup] = useState(null);

  const selectionRef = useRef(null);

  /* ================= FIRESTORE ================= */
  useEffect(() => {
    const colRef = collection(db, collectionName);

    const unsub = onSnapshot(
      colRef,
      (snap) => {
        const arr = [];
        snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
        setProducts(arr);
        setLoaded(true);
      },
      () => {
        setProducts([]);
        setLoaded(true);
      }
    );

    return () => unsub();
  }, []);

  /* ================= GROUPS ================= */
  const groups = Array.from(
    new Set(
      products
        .filter((p) => !p?.hide && typeof p.group === "string")
        .map((p) => p.group)
    )
  );

  /* Auto select first group */
  useEffect(() => {
    if (!activeGroup && groups.length > 0) {
      setActiveGroup(groups[0]);
    }
  }, [groups, activeGroup]);

  /* Scroll selected item into view */
  useEffect(() => {
    if (selectedItem && selectionRef.current) {
      selectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedItem]);

  if (!loaded) {
    return <div className="py-6 text-center">Loading products…</div>;
  }

  /* ================= FILTER ================= */
  const filteredList = products.filter(
    (item) => item && !item.hide && item.group === activeGroup
  );

  /* ================= HELPERS ================= */
  const getGroupImage = (group) => GROUP_CONFIG[group]?.image || defaultImg;

  const getGroupLabel = (group) =>
    GROUP_CONFIG[group]?.label || group.toUpperCase();

  const formatPrice = (item) => {
    const rupees = Number(item.rupees) || 0;
    const reseller = Number(item.resellerRupees) || 0;

    if (user?.role === "reseller" || user?.role === "prime") {
      return reseller || rupees;
    }
    if (user?.role === "vip") {
      return Math.round(rupees * 0.97);
    }
    return rupees;
  };

  /* ================= RENDER ================= */
  return (
    <div className="w-full space-y-4 text-gray-900">
      {/* ================= TABS (SCROLLABLE) ================= */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-1 pb-1">
        {groups.map((groupKey) => (
          <button
            key={groupKey}
            onClick={() => {
              setActiveGroup(groupKey);
              setSelectedItem?.(null);
            }}
            className={`flex-shrink-0 w-24 flex flex-col items-center gap-1 p-2 rounded-xl 
              text-[9px] font-semibold border transition-all
              ${
                activeGroup === groupKey
                  ? "bg-yellow-300/90 text-black border-gray-100 shadow-md scale-[1.03]"
                  : "bg-white text-gray-700 border-gray-300"
              }`}
          >
            <img
              src={getGroupImage(groupKey)}
              alt={getGroupLabel(groupKey)}
              className="w-14 h-10 object-contain"
            />
            <span className="truncate">{getGroupLabel(groupKey)}</span>
          </button>
        ))}
      </div>

      {/* ================= PRODUCTS ================= */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-2">
        {filteredList.map((item) => (
          <div
            key={item.id}
            ref={selectedItem?.id === item.id ? selectionRef : null}
            onClick={() => setSelectedItem?.(item)}
            className={`relative cursor-pointer p-2 rounded-md border bg-white overflow-hidden
              shadow-sm transition hover:shadow-lg
              ${
                selectedItem?.id === item.id
                  ? "ring-2 ring-blue-500"
                  : "border-gray-200"
              }`}
          >
            {item.outOfStock && (
              <div
                className="absolute -left-10 top-2 w-40 text-center 
                text-[8px] font-bold bg-red-600 text-white rotate-[-45deg] py-1"
              >
                OUT OF STOCK
              </div>
            )}

            <div className="flex justify-between items-start">
              <div className="flex gap-2">
                <img
                  src={getGroupImage(item.group)}
                  alt={item.label}
                  className="w-8 h-8 object-contain"
                />
                <div>
                  <div className="text-[10px] font-semibold">{item.label}</div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-semibold text-green-600">
                  ₹{formatPrice(item)}
                </div>
                {item.falseRupees && (
                  <div className="text-[10px] text-red-500 line-through">
                    ₹{item.falseRupees}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomProductList;
