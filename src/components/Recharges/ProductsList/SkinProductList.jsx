import React, { useEffect, useRef, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../../config/firebase";
import { useUser } from "../../../context/UserContext";
import defaultImg from "../../../assets/images/game.png";

const collectionName = "skinproductlist";

const SkinProductList = ({ selectedItem, setSelectedItem }) => {
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
  }, []);

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
    return true;
  });

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
      <h2 className="text-xl font-bold mb-4">Skin Products</h2>

      {/* Products grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-2">
        {[...filteredList]
          .sort((a, b) => {
            const aPrice = Number(a.rupees) || 0;
            const bPrice = Number(b.rupees) || 0;
            return aPrice - bPrice;
          })
          .map((item) => {
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
                        src={item.image || defaultImg}
                        alt={item.label}
                        className="w-full h-full object-cover rounded-sm"
                      />
                    </div>
                    <div className="">
                      <div className="text-[10px] line-clamp-1 font-semibold">
                        {item.label || item.name || "Skin Product"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-end justify-between mt-2">
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
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default SkinProductList;
