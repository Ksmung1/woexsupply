import { useCallback, useEffect, useState } from "react";
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

const BloodStrikeAdmin = ({ collectionName  }) => {
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
    "ss-bloodstrike": image,
    "ss-others": image,
  };

  const groups = [
    { key: "bloodstrike", label: "bloodstrikes", image: undefined },
    { key: "others", label: "Others", image: undefined },
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
          api = "smile",
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
    <div className={`min-h-screen-dvh py-6 md:py-8 ${isDark ? "bg-gray-900" : "bg-gradient-to-br from-gray-50 via-purple-50/30 to-indigo-50/30"}`}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h2 className={`text-2xl md:text-3xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-800"}`}>Products</h2>
          <p className={`text-sm md:text-base ${isDark ? "text-gray-400" : "text-gray-600"}`}>{collectionName}</p>
        </div>

      {/* Filter Tabs */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-wrap gap-2 md:gap-3">
        {Object.entries(groupLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => {
              setActiveGroup(key);
              setSelectedItem(null);
            }}
                className={`px-4 py-2 md:px-5 md:py-2.5 rounded-lg text-sm md:text-base font-semibold transition-all duration-200 ${
                  activeGroup === key
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg"
                    : isDark
                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                }`}
          >
            {label}
          </button>
        ))}
      </div>
      </div>

        {/* Products Grid */}
      {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className={`w-12 h-12 border-4 ${isDark ? "border-purple-400" : "border-purple-600"} border-t-transparent rounded-full animate-spin mx-auto mb-4`}></div>
              <p className={`${isDark ? "text-gray-400" : "text-gray-600"} font-medium`}>Loading products...</p>
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className={`${isDark ? "bg-gray-800" : "bg-white"} rounded-2xl shadow-xl p-8 md:p-12 text-center`}>
            <div className="text-6xl mb-4">📦</div>
            <p className={`${isDark ? "text-gray-400" : "text-gray-600"} font-medium text-lg mb-2`}>No products found</p>
            <p className={`${isDark ? "text-gray-500" : "text-gray-500"} text-sm`}>Try selecting a different group or add a new product</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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

      </div>

      {/* Floating + button */}
      <button
        aria-label="Add new product"
        onClick={() => setShowAddForm(true)}
        className="fixed bottom-6 md:bottom-8 right-6 md:right-8 z-40 flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full shadow-2xl transform hover:scale-110 hover:shadow-3xl transition-all duration-300 bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
      >
        <FiPlus size={24} className="md:w-6 md:h-6" />
      </button>
    </div>
  );
};

export default BloodStrikeAdmin;
