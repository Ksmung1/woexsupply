import React, { useEffect, useRef, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../../config/firebase";
import { useUser } from "../../../context/UserContext";

import defaultImg from "../../../assets/images/genshin.png";
import otherImg from "../../../assets/images/blessing.png";

/**
 * GenshinProductList
 * - No groups / no tabs
 * - Props: selectedItem, setSelectedItem (same contract as MobileLegends)
 * - Default collection: "genshinproductlist"
 */

const collectionName = "giproductlist";

const GenshinProductList = ({ selectedItem, setSelectedItem }) => {
  const { user } = useUser();
  const [products, setProducts] = useState([]);
  const [loaded, setLoaded] = useState(false);
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

  // Filter out hidden items
  const visibleProducts = (products || []).filter((p) => p && !p.hide);

  // Simple image selector - use blessing.png for blessing items, genshin.png for others
  const getImageForItem = (item) => {
    const label = (item.label || "").toLowerCase();
    const type = (item.type || "").toLowerCase();

    // Check if it's a blessing/welkin moon item
    if (
      label.includes("blessing") ||
      label.includes("welkin") ||
      type.includes("blessing") ||
      type.includes("welkin")
    ) {
      return otherImg;
    }

    // Default to genshin.png for all other items
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
      {/* Optional header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">Genshin Products</h3>
        <p className="text-sm text-gray-500">Tap a product to select</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-2">
        {[...visibleProducts]
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

export default GenshinProductList;
