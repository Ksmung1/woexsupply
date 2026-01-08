import React, { useCallback, useEffect, useState } from "react";
import { db, storage } from "../../../config/firebase";
import { collection, onSnapshot, doc, updateDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { deleteItem } from "../Utils/DeleteItem";
import { FiPlus, FiUpload, FiX } from "react-icons/fi";
import { useAlert } from "../../../context/AlertContext";
import { useTheme } from "../../../context/ThemeContext";
import AddModal from "../Utils/AddModal";
import EditModal from "../Utils/EditModal";
import AdminProduct from "../Utils/AdminProduct";
import image from "../../../assets/images/game.png";

const CharismaAdmin = ({ collectionName = "charismaproductlist" }) => {
  const { isDark } = useTheme();
  const { showError, showSuccess, showWarning } = useAlert();
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const [newItem, setNewItem] = useState({
    label: "",
    rupees: "",
    resellerRupees: "",
    falseRupees: "",
    image: "",
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [editingImagePreview, setEditingImagePreview] = useState(null);
  const [uploadingEditImage, setUploadingEditImage] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showEditImageUpload, setShowEditImageUpload] = useState(false);

  const fields = [
    { label: "Label", field: "label", type: "text", placeholder: "Product Label" },
    { label: "Rupees", field: "rupees", type: "number", placeholder: "Price in Rupees" },
    { label: "Reseller Rupees", field: "resellerRupees", type: "number", placeholder: "Reseller Price" },
    { label: "False Rupees", field: "falseRupees", type: "number", placeholder: "Strikethrough Price" },
    { label: "Image URL", field: "image", type: "text", placeholder: "Image URL" },
  ];

  useEffect(() => {
    setLoading(true);
    const colRef = collection(db, collectionName);

    const unsub = onSnapshot(colRef, (snapshot) => {
      const list = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
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
      } catch (err) {
        console.error("Error toggling hide:", err);
        showError("Failed to toggle hide");
      }
    },
    [collectionName, showError]
  );

  const handleNewChange = (field, value) => {
    setNewItem((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError("Image size should be less than 5MB");
      return;
    }

    setUploadingImage(true);
    try {
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Upload to Firebase Storage
      const timestamp = Date.now();
      const fileName = `charisma/${timestamp}-${file.name}`;
      const storageRef = ref(storage, fileName);

      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      // Update the image field
      setNewItem((prev) => ({ ...prev, image: downloadURL }));
      showSuccess("Image uploaded successfully!");
      // Close the upload modal after successful upload
      setTimeout(() => {
        setShowImageUpload(false);
      }, 1000);
    } catch (err) {
      console.error("Error uploading image:", err);
      showError("Failed to upload image: " + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setNewItem((prev) => ({ ...prev, image: "" }));
    setImagePreview(null);
  };

  const handleEditImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showError("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError("Image size should be less than 5MB");
      return;
    }

    setUploadingEditImage(true);
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      const timestamp = Date.now();
      const fileName = `charisma/${timestamp}-${file.name}`;
      const storageRef = ref(storage, fileName);

      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      setSelectedItem((prev) => ({ ...prev, image: downloadURL }));
      showSuccess("Image uploaded successfully!");
      // Close the upload modal after successful upload
      setTimeout(() => {
        setShowEditImageUpload(false);
      }, 1000);
    } catch (err) {
      console.error("Error uploading image:", err);
      showError("Failed to upload image: " + err.message);
    } finally {
      setUploadingEditImage(false);
    }
  };

  const handleAddNew = async () => {
    if (!newItem.label || !newItem.rupees) {
      showWarning("Please fill in label and rupees");
      return;
    }

    setLoading(true);
    try {
      const { name, description, ...itemWithoutExtra } = newItem;
      const itemToAdd = {
        ...itemWithoutExtra,
        rupees: parseFloat(newItem.rupees) || 0,
        resellerRupees: parseFloat(newItem.resellerRupees) || parseFloat(newItem.rupees) || 0,
        falseRupees: parseFloat(newItem.falseRupees) || 0,
        image: newItem.image || image,
        outOfStock: false,
        hide: false,
      };

      const docId = `charisma-${Date.now()}`;
      await setDoc(doc(db, collectionName, docId), itemToAdd);
      showSuccess("Product added successfully");
      setShowAddForm(false);
      setNewItem({
        label: "",
        rupees: "",
        resellerRupees: "",
        falseRupees: "",
        image: "",
      });
      setImagePreview(null);
    } catch (err) {
      console.error("Error adding product:", err);
      showError("Failed to add product");
    } finally {
      setLoading(false);
    }
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
        if (!item.label || !item.rupees) return;
        const docId = item.id || `charisma-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const itemToAdd = {
          label: item.label || "",
          rupees: parseFloat(item.rupees) || 0,
          resellerRupees: parseFloat(item.resellerRupees) || parseFloat(item.rupees) || 0,
          falseRupees: parseFloat(item.falseRupees) || 0,
          image: item.image || image,
          outOfStock: item.outOfStock || false,
          hide: item.hide || false,
        };
        const docRef = doc(db, collectionName, docId);
        await setDoc(docRef, itemToAdd);
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

  const handleDelete = async (id) => {
    const ok = await deleteItem({ collectionName, id, db });
    if (ok) {
      showSuccess("Item deleted successfully!");
    } else {
      showError("Failed to delete item");
    }
  };

  if (loading) {
    return <div className={`p-4 ${isDark ? "text-gray-400" : "text-gray-600"}`}>Loading products...</div>;
  }

  return (
    <div className={`p-4 ${isDark ? "bg-gray-800" : "bg-white"}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Charisma Products</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <FiPlus />
          Add Product
        </button>
      </div>

      <AddModal
        show={showAddForm}
        onClose={() => {
          setShowAddForm(false);
          setImagePreview(null);
          setShowImageUpload(false);
        }}
        newItem={newItem}
        handleNewChange={handleNewChange}
        handleAddNew={handleAddNew}
        handleJSONUpload={handleJSONUpload}
        loading={loading}
        collectionName={collectionName}
        fields={fields}
        hideGroupsAndApi={true}
      />

      {/* Image Upload Button - appears when AddModal is open */}
      {showAddForm && !showImageUpload && (
        <div className="fixed bottom-4 right-4 z-[9999]">
          <button
            onClick={() => setShowImageUpload(true)}
            className="flex items-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg shadow-lg hover:bg-purple-700 transition-colors"
          >
            <FiUpload />
            <span>Upload Image</span>
          </button>
        </div>
      )}

      {/* Image Upload Overlay - appears when clicked */}
      {showAddForm && showImageUpload && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-end p-4 pointer-events-none">
          <div className={`relative z-10 rounded-xl shadow-2xl p-6 max-w-sm w-full pointer-events-auto border-2 ${isDark ? "bg-gray-800 border-purple-600" : "bg-white border-purple-200"}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-800"}`}>Upload Image</h3>
              <button
                onClick={() => {
                  setShowImageUpload(false);
                }}
                className={`p-2 rounded-lg transition-colors ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
              >
                <FiX className={isDark ? "text-gray-400" : "text-gray-600"} />
              </button>
            </div>

            {imagePreview || newItem.image ? (
              <div className="relative mb-4">
                <img
                  src={imagePreview || newItem.image}
                  alt="Preview"
                  className={`w-full h-48 object-cover rounded-lg border-2 ${isDark ? "border-gray-600" : "border-gray-200"}`}
                />
                <button
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                  title="Remove image"
                >
                  <FiX />
                </button>
              </div>
            ) : (
              <div className="mb-4">
                <label className={`block w-full p-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-purple-500 transition-colors ${isDark ? "border-gray-600 bg-gray-700" : "border-gray-300 bg-gray-50"}`}>
                  <div className="text-center">
                    <FiUpload className={`mx-auto text-3xl mb-2 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                    <p className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      {uploadingImage ? "Uploading..." : "Click to upload"}
                    </p>
                    <p className={`text-xs mt-1 ${isDark ? "text-gray-500" : "text-gray-500"}`}>PNG, JPG, WEBP (Max 5MB)</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {newItem.image && (
              <div className={`p-2 border rounded-lg ${isDark ? "bg-green-900/30 border-green-800" : "bg-green-50 border-green-200"}`}>
                <p className={`text-xs font-medium mb-1 ${isDark ? "text-green-400" : "text-green-700"}`}>✓ Image uploaded</p>
                <p className={`text-xs break-all truncate ${isDark ? "text-gray-400" : "text-gray-500"}`} title={newItem.image}>
                  {newItem.image.substring(0, 40)}...
                </p>
              </div>
            )}
          </div>
        </div>
      )}


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <AdminProduct
            key={item.id}
            item={item}
            isSelected={selectedItem?.id === item.id}
            onSelect={(it) => setSelectedItem((prev) => (prev?.id === it.id ? null : it))}
            onToggleOutOfStock={toggleOutOfStock}
            onHideToggle={handleHide}
            typeImageMap={{}}
            defaultImage={image}
          />
        ))}
      </div>

      {items.length === 0 && (
        <div className={`text-center py-8 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
          No products found. Add your first product!
        </div>
      )}

      <EditModal
        show={!!selectedItem}
        onClose={() => {
          setSelectedItem(null);
          setEditingImagePreview(null);
          setShowEditImageUpload(false);
        }}
        selectedItem={selectedItem}
        onChange={(f, v) => setSelectedItem((s) => ({ ...s, [f]: v }))}
        onSave={async () => {
          setLoading(true);
          try {
            const docRef = doc(db, collectionName, selectedItem.id);
            await updateDoc(docRef, {
              ...selectedItem,
              rupees: parseFloat(selectedItem.rupees) || 0,
              resellerRupees: parseFloat(selectedItem.resellerRupees) || 0,
              falseRupees: parseFloat(selectedItem.falseRupees) || 0,
            });
            setSelectedItem(null);
            setEditingImagePreview(null);
            showSuccess("Product updated successfully");
          } catch (err) {
            console.error("Error updating product:", err);
            showError("Failed to update product");
          } finally {
            setLoading(false);
          }
        }}
        onDelete={async (id) => {
          await handleDelete(id);
          setSelectedItem(null);
          setEditingImagePreview(null);
        }}
        loading={loading}
        collectionName={collectionName}
        fields={fields}
        hideGroupsAndApi={true}
        confirmBeforeDelete={true}
      />

      {/* Image Upload Button for Editing - appears when EditModal is open */}
      {selectedItem && !showEditImageUpload && (
        <div className="fixed bottom-4 right-4 z-[9999]">
          <button
            onClick={() => setShowEditImageUpload(true)}
            className="flex items-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg shadow-lg hover:bg-purple-700 transition-colors"
          >
            <FiUpload />
            <span>Update Image</span>
          </button>
        </div>
      )}

      {/* Image Upload for Editing - appears when clicked */}
      {selectedItem && showEditImageUpload && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-end p-4 pointer-events-none">
          <div className={`relative z-10 rounded-xl shadow-2xl p-6 max-w-sm w-full pointer-events-auto border-2 ${isDark ? "bg-gray-800 border-purple-600" : "bg-white border-purple-200"}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-800"}`}>Update Image</h3>
              <button
                onClick={() => {
                  setShowEditImageUpload(false);
                }}
                className={`p-2 rounded-lg transition-colors ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
              >
                <FiX className={isDark ? "text-gray-400" : "text-gray-600"} />
              </button>
            </div>

            {editingImagePreview || selectedItem.image ? (
              <div className="relative mb-4">
                <img
                  src={editingImagePreview || selectedItem.image}
                  alt="Preview"
                  className={`w-full h-48 object-cover rounded-lg border-2 ${isDark ? "border-gray-600" : "border-gray-200"}`}
                />
                <button
                  onClick={() => {
                    setSelectedItem((prev) => ({ ...prev, image: "" }));
                    setEditingImagePreview(null);
                  }}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                  title="Remove image"
                >
                  <FiX />
                </button>
              </div>
            ) : (
              <div className="mb-4">
                <label className={`block w-full p-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-purple-500 transition-colors ${isDark ? "border-gray-600 bg-gray-700" : "border-gray-300 bg-gray-50"}`}>
                  <div className="text-center">
                    <FiUpload className={`mx-auto text-3xl mb-2 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                    <p className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      {uploadingEditImage ? "Uploading..." : "Click to upload"}
                    </p>
                    <p className={`text-xs mt-1 ${isDark ? "text-gray-500" : "text-gray-500"}`}>PNG, JPG, WEBP (Max 5MB)</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEditImageUpload}
                    disabled={uploadingEditImage}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {selectedItem.image && (
              <div className={`p-2 border rounded-lg ${isDark ? "bg-green-900/30 border-green-800" : "bg-green-50 border-green-200"}`}>
                <p className={`text-xs font-medium mb-1 ${isDark ? "text-green-400" : "text-green-700"}`}>✓ Image set</p>
                <p className={`text-xs break-all truncate ${isDark ? "text-gray-400" : "text-gray-500"}`} title={selectedItem.image}>
                  {selectedItem.image.substring(0, 40)}...
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CharismaAdmin;

