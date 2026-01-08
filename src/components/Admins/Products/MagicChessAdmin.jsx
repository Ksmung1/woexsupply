// components/AdminProducts/MobileLegendsAdmin.jsx
import React, { useCallback, useEffect, useState } from "react";
import { db } from "../../../config/firebase";
import { collection, onSnapshot, doc, updateDoc, setDoc } from "firebase/firestore";
import { deleteItem } from "../Utils/DeleteItem";
import { FiPlus } from "react-icons/fi";
import { useAlert } from "../../../context/AlertContext";
import { useTheme } from "../../../context/ThemeContext";
import AddModal from "../Utils/AddModal";
import EditModal from "../Utils/EditModal";
import AdminProduct from "../Utils/AdminProduct";
import image from "../../../assets/images/game.png"

const MagicChessAdmin = ({ collectionName }) => {
  const { isDark } = useTheme();
  const { showError, showSuccess, showWarning } = useAlert();
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const [newItem, setNewItem] = useState({
    id: "",
    type: "",
    label: "",
    diamonds: "",
    rupees: "",
    resellerRupees: "",
    falseRupees: "",
    price: "",
    group: "",
    api: "",
  });

  const typeImageMap = {
    "mc-diamond": image,
    "mc-double": image,
    "mc-weekly": image,
  };

  const groups = [
    { key: "d", label: "Diamonds", image: undefined },
    { key: "dd", label: "Double", image: undefined },
    { key: "weekly", label: "Weekly" },
  ];

  const [activeGroup, setActiveGroup] = useState(groups[0]?.key || "");


  // derive groupLabels from groups so changes are reflected automatically
  const groupLabels = groups.reduce((acc, g) => {
    acc[g.key] = g.label ?? g.key;
    return acc;
  }, {});

  const fields = [
    { label: "ID", field: "id", type: "text", placeholder: "ID" },
    { label: "Label", field: "label", type: "text", placeholder: "Label" },
    { label: "Diamonds", field: "diamonds", type: "text", placeholder: "Diamonds" },
    { label: "Type (small)", field: "type", type: "text", placeholder: "Type" },
    { label: "Rupees", field: "rupees", type: "number", placeholder: "Rupees" },
    { label: "Reseller Rupees", field: "resellerRupees", type: "number", placeholder: "Reseller Rupees" },
    { label: "False Rupees", field: "falseRupees", type: "number", placeholder: "False Rupees" },
    { label: "Price", field: "price", type: "number", placeholder: "Price" },
  ];

  useEffect(() => {
    setLoading(true);
    const colRef = collection(db, collectionName);

    const unsub = onSnapshot(colRef, (snapshot) => {
      const list = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const apiOrder = { yokcash: 0, smile: 1, busan: 2 };
          const aApi = apiOrder[a.api || "yokcash"] ?? 999;
          const bApi = apiOrder[b.api || "yokcash"] ?? 999;
          if (aApi !== bApi) return aApi - bApi;
          return parseFloat(a?.rupees || 0) - parseFloat(b?.rupees || 0);
        });

      setItems(list);
      setLoading(false);
    });

    return () => unsub();
  }, [collectionName]);

  const toggleOutOfStock = useCallback(
    async (item) => {
      if (!item?.id) return;
      const docRef = doc(db, collectionName, item.id);
      await updateDoc(docRef, { outOfStock: !item.outOfStock });
    },
    [collectionName]
  );

  const handleHide = useCallback(
    async (id, currentHide) => {
      if (!id) return;
      try {
        const docRef = doc(db, collectionName, id);
        await updateDoc(docRef, { hide: !currentHide });
      } catch (error) {
        console.error("Error updating hide status:", error);
        showError("Failed to update product visibility: " + error.message);
      }
    },
    [collectionName]
  );

  const handleNewChange = (field, value) => {
    setNewItem((prev) => ({ ...prev, [field]: value }));
  };

  const handleJSONUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);
      if (!Array.isArray(jsonData)) {
        showError("Invalid JSON format: must be an array of products.");
        return;
      }
      setLoading(true);
      const batchPromises = jsonData.map(async (item) => {
        if (!item.id) return;
        const docRef = doc(db, collectionName, item.id);
        const {
          label = "",
          diamonds = 0,
          type = "unknown",
          rupees = 0,
          falseRupees = 0,
          resellerRupees = 0,
          price = 0,
          group = "specials",
          api = "yokcash",
        } = item;
        await setDoc(docRef, {
          id: item.id,
          label,
          diamonds,
          type,
          rupees,
          falseRupees,
          resellerRupees,
          price: parseFloat(price) || 0,
          group,
          api,
        });
      });
      await Promise.all(batchPromises);
      showSuccess("JSON imported successfully!");
    } catch (err) {
      console.error("JSON upload error:", err);
      showError("Failed to upload JSON: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = async () => {
    setLoading(true);
    const { id, label, diamonds, type, rupees, falseRupees, resellerRupees, price, group, api } = newItem;
    if (!id || !label || !type || !rupees || !group || !resellerRupees) {
      showWarning("Please fill all required fields");
      setLoading(false);
      return;
    }
    const docRef = doc(db, collectionName, id);
    await setDoc(docRef, {
      id,
      label,
      diamonds,
      type,
      rupees: parseFloat(rupees),
      falseRupees: parseFloat(falseRupees),
      resellerRupees: parseFloat(resellerRupees),
      price: parseFloat(price) || 0,
      group,
      api: api || "smile",
    });
    setNewItem({ id: "", type: "", label: "", diamonds: "", rupees: "", falseRupees: "", resellerRupees: "", price: "", group: "", api: "" });
    setShowAddForm(false);
    setLoading(false);
  };

  const filteredItems = items.filter((item) => {
    if (activeGroup === "specials") return item.group !== "d" && item.group !== "dd";
    return item.group === activeGroup;
  });

  return (
    <div className={`py-6 px-2 ${isDark ? "bg-gray-800 text-gray-100" : "bg-white text-gray-900"}`}>
      {/* Filter Tabs */}
      <div className="flex gap-3 mb-6 justify-left">
        {Object.entries(groupLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => {
              setActiveGroup(key);
              setSelectedItem(null);
            }}
            className={`px-2 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeGroup === key
                ? "bg-green-400 text-black"
                : isDark
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Products ({collectionName})</h2>
      </div>

      {loading ? (
        <p className={isDark ? "text-gray-400" : "text-gray-600"}>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => (
            <AdminProduct
              key={item.id}
              item={item}
              isSelected={selectedItem?.id === item.id}
              onSelect={(it) => setSelectedItem((prev) => (prev?.id === it.id ? null : it))}
              onToggleOutOfStock={toggleOutOfStock}
              onHideToggle={handleHide}
              typeImageMap={typeImageMap}
              defaultImage={image}
            />
          ))}
        </div>
      )}

      <EditModal
        show={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        selectedItem={selectedItem}
        onChange={(f, v) => setSelectedItem((s) => ({ ...s, [f]: v }))}
        onSave={async () => {
          setLoading(true);
          try {
            const docRef = doc(db, collectionName, selectedItem.id);
            await updateDoc(docRef, { ...selectedItem, price: parseFloat(selectedItem.price) || 0 });
            setSelectedItem(null);
          } finally {
            setLoading(false);
          }
        }}
        onDelete={async (id) => {
          const ok = await deleteItem({ collectionName, id, db });
          if (ok) setSelectedItem(null);
        }}
        loading={loading}
        collectionName={collectionName}
        groups={groups}
        apiOptions={[
          { value: "yokcash", label: "Yokcash" },
          { value: "busan", label: "Busan" },
        ]}
        confirmBeforeDelete={true}
        fields={fields}
      />

      <AddModal
        show={showAddForm}
        onClose={() => setShowAddForm(false)}
        newItem={newItem}
        handleNewChange={handleNewChange}
        handleAddNew={handleAddNew}
        handleJSONUpload={handleJSONUpload}
        loading={loading}
        collectionName={collectionName}
        groups={groups}
        apiOptions={[{ value: "smile", label: "Smile" }]}
        fields={fields}
      />

      {/* Floating + button */}
      <button aria-label="Add new product" onClick={() => setShowAddForm(true)} className="fixed bottom-13 left-6 z-40 flex items-center justify-center w-14 h-14 rounded-full shadow-lg transform hover:-translate-y-0.5 transition bg-blue-600 text-white">
        <FiPlus size={22} />
      </button>
    </div>
  );
};

export default MagicChessAdmin;
