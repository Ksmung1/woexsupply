import React, { useState, useEffect, useCallback } from "react";
import { db, storage } from "../../config/firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  setDoc,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiImage,
  FiUpload,
  FiX,
} from "react-icons/fi";
import { useAlert } from "../../context/AlertContext";
import { useUser } from "../../context/UserContext";
import { useTheme } from "../../context/ThemeContext";
import { FaSpinner } from "react-icons/fa";
import { format } from "date-fns";

const AdminGameAccounts = () => {
  const { isDark } = useTheme();
  const { showError, showSuccess, showWarning } = useAlert();
  const { user } = useUser();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState({});
  const [imagePreviews, setImagePreviews] = useState({});

  // Initialize postedBy with current user
  const getInitialPostedBy = () => {
    return user?.name || user?.email || user?.username || "Admin";
  };

  const [newAccount, setNewAccount] = useState({
    id: "",
    label: "",
    rupees: "",
    postedBy: getInitialPostedBy(),
    status: "Available",
    images: [],
    date: serverTimestamp(),
  });

  // Update postedBy when user changes
  useEffect(() => {
    if (user) {
      const postedByUser =
        user?.name || user?.email || user?.username || "Admin";
      setNewAccount((prev) => ({ ...prev, postedBy: postedByUser }));
    }
  }, [user]);

  // Fetch accounts
  useEffect(() => {
    setLoading(true);
    const colRef = collection(db, "gameAccounts");

    const unsub = onSnapshot(
      colRef,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setAccounts(list);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching game accounts:", err);
        showError("Failed to load game accounts");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [showError]);

  // Filter accounts to show only Available accounts
  const filteredAccounts = accounts.filter((acc) => {
    // Handle accounts without status field - treat as "Available"
    const accountStatus = (acc.status || "Available").toLowerCase();
    return accountStatus === "available";
  });

  // Handle add new account
  const handleAddNew = async () => {
    if (!newAccount.id || !newAccount.label || !newAccount.rupees) {
      showWarning("Please fill all required fields (ID, Label, Rupees)");
      return;
    }

    setSaving(true);
    try {
      // Get current user info for postedBy
      const postedByUser =
        user?.name || user?.email || user?.username || "Admin";

      const accountData = {
        id: newAccount.id,
        label: newAccount.label,
        rupees: parseFloat(newAccount.rupees) || 0,
        postedBy: postedByUser,
        status: newAccount.status || "Available",
        images: Array.isArray(newAccount.images)
          ? newAccount.images
          : newAccount.images
          ? [newAccount.images]
          : [],
        date: serverTimestamp(),
      };

      const docRef = doc(db, "gameAccounts", newAccount.id);
      await setDoc(docRef, accountData);

      showSuccess("Game account added successfully!");
      setShowAddModal(false);
      // Reset form but keep user info for postedBy
      const resetPostedBy =
        user?.name || user?.email || user?.username || "Admin";
      setNewAccount({
        id: "",
        label: "",
        rupees: "",
        postedBy: resetPostedBy,
        status: "Available",
        images: [],
        date: serverTimestamp(),
      });
      setImagePreviews({});
    } catch (error) {
      console.error("Error adding account:", error);
      showError("Failed to add game account");
    } finally {
      setSaving(false);
    }
  };

  // Handle update account
  const handleUpdate = async (accountId, updates) => {
    setSaving(true);
    try {
      const docRef = doc(db, "gameAccounts", accountId);
      await updateDoc(docRef, {
        ...updates,
        date: updates.date || serverTimestamp(),
      });
      showSuccess("Game account updated successfully!");
      setSelectedAccount(null);
    } catch (error) {
      console.error("Error updating account:", error);
      showError("Failed to update game account");
    } finally {
      setSaving(false);
    }
  };

  // Handle delete account
  const handleDelete = async (accountId) => {
    if (!window.confirm("Are you sure you want to delete this account?")) {
      return;
    }

    setSaving(true);
    try {
      const docRef = doc(db, "gameAccounts", accountId);
      await deleteDoc(docRef);
      showSuccess("Game account deleted successfully!");
    } catch (error) {
      console.error("Error deleting account:", error);
      showError("Failed to delete game account");
    } finally {
      setSaving(false);
    }
  };

  // Format date helper
  const formatDate = (dateValue) => {
    if (!dateValue) return "Date not available";
    try {
      let date;
      if (typeof dateValue?.toDate === "function") {
        date = dateValue.toDate();
      } else if (dateValue?.seconds) {
        date = new Date(dateValue.seconds * 1000);
      } else if (
        typeof dateValue === "string" ||
        typeof dateValue === "number"
      ) {
        date = new Date(dateValue);
      } else {
        return "Invalid date";
      }
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }
      return format(date, "PPp");
    } catch (error) {
      return "Date not available";
    }
  };

  // Handle single image file upload
  const handleImageUpload = async (file, index = null, isNew = false) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showError("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError("Image size should be less than 5MB");
      return;
    }

    const uploadKey = isNew
      ? index !== null
        ? `new-${index}`
        : `new-add-${Date.now()}`
      : index !== null
      ? `edit-${index}`
      : `edit-add-${Date.now()}`;
    setUploadingImages((prev) => ({ ...prev, [uploadKey]: true }));

    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => ({ ...prev, [uploadKey]: reader.result }));
      };
      reader.readAsDataURL(file);

      // Upload to Firebase Storage
      const timestamp = Date.now();
      const fileName = `accounts/${timestamp}-${file.name}`;
      const storageRef = ref(storage, fileName);

      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      // Update images array
      if (isNew) {
        if (index !== null) {
          // Replace existing image
          const newImages = [...(newAccount.images || [])];
          newImages[index] = downloadURL;
          setNewAccount({ ...newAccount, images: newImages });
        } else {
          // Add new image
          setNewAccount({
            ...newAccount,
            images: [...(newAccount.images || []), downloadURL],
          });
        }
      } else {
        if (index !== null) {
          // Replace existing image
          const newImages = [...(selectedAccount.images || [])];
          newImages[index] = downloadURL;
          setSelectedAccount({ ...selectedAccount, images: newImages });
        } else {
          // Add new image
          setSelectedAccount({
            ...selectedAccount,
            images: [...(selectedAccount.images || []), downloadURL],
          });
        }
      }

      showSuccess("Image uploaded successfully!");
    } catch (error) {
      console.error("Error uploading image:", error);
      showError("Failed to upload image: " + error.message);
    } finally {
      setUploadingImages((prev) => ({ ...prev, [uploadKey]: false }));
    }
  };

  // Handle multiple image file uploads
  const handleMultipleImageUpload = async (files, isNew = false) => {
    if (!files || files.length === 0) return;

    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );

    if (imageFiles.length === 0) {
      showError("Please select image files");
      return;
    }

    // Validate file sizes
    const invalidFiles = imageFiles.filter(
      (file) => file.size > 5 * 1024 * 1024
    );
    if (invalidFiles.length > 0) {
      showError(
        `${invalidFiles.length} file(s) exceed 5MB limit. Please select smaller files.`
      );
      return;
    }

    showSuccess(`Uploading ${imageFiles.length} image(s)...`);

    // Set loading state for all bulk uploads
    const bulkUploadKey = isNew ? "new-bulk-upload" : "edit-bulk-upload";
    setUploadingImages((prev) => ({ ...prev, [bulkUploadKey]: true }));

    const uploadedUrls = [];
    const uploadPromises = imageFiles.map(async (file, idx) => {
      try {
        // Create preview
        const reader = new FileReader();
        const previewKey = isNew
          ? `new-bulk-${Date.now()}-${idx}`
          : `edit-bulk-${Date.now()}-${idx}`;
        reader.onloadend = () => {
          setImagePreviews((prev) => ({
            ...prev,
            [previewKey]: reader.result,
          }));
        };
        reader.readAsDataURL(file);

        // Upload to Firebase Storage
        const timestamp = Date.now();
        const fileName = `accounts/${timestamp}-${idx}-${file.name}`;
        const storageRef = ref(storage, fileName);

        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        uploadedUrls.push(downloadURL);

        return downloadURL;
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        showError(`Failed to upload ${file.name}`);
        return null;
      }
    });

    try {
      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter((url) => url !== null);

      if (successfulUploads.length > 0) {
        // Update images array with all uploaded URLs
        if (isNew) {
          setNewAccount({
            ...newAccount,
            images: [...(newAccount.images || []), ...successfulUploads],
          });
        } else {
          setSelectedAccount({
            ...selectedAccount,
            images: [...(selectedAccount.images || []), ...successfulUploads],
          });
        }

        showSuccess(
          `Successfully uploaded ${successfulUploads.length} image(s)!`
        );
      }
    } catch (error) {
      console.error("Error uploading multiple images:", error);
      showError("Failed to upload some images");
    } finally {
      // Clear bulk upload loading state
      setUploadingImages((prev) => {
        const newState = { ...prev };
        delete newState[bulkUploadKey];
        return newState;
      });
    }
  };

  // Handle image URL input (for manual URL entry)
  const handleImageUrlChange = (value, index = null, isNew = false) => {
    if (isNew) {
      if (index !== null) {
        const newImages = [...(newAccount.images || [])];
        newImages[index] = value;
        setNewAccount({ ...newAccount, images: newImages });
      } else {
        setNewAccount({
          ...newAccount,
          images: [...(newAccount.images || []), value],
        });
      }
    } else {
      if (index !== null) {
        const newImages = [...(selectedAccount.images || [])];
        newImages[index] = value;
        setSelectedAccount({ ...selectedAccount, images: newImages });
      } else {
        setSelectedAccount({
          ...selectedAccount,
          images: [...(selectedAccount.images || []), value],
        });
      }
    }
  };

  const handleRemoveImage = async (index, isNew = false) => {
    const images = isNew ? newAccount.images : selectedAccount.images;
    const imageUrl = images?.[index];

    // If it's a Firebase Storage URL, optionally delete from storage
    if (imageUrl && imageUrl.includes("firebasestorage.googleapis.com")) {
      try {
        // Extract the path from the URL
        const urlParts = imageUrl.split("/o/");
        if (urlParts.length > 1) {
          const pathPart = urlParts[1].split("?")[0];
          const decodedPath = decodeURIComponent(pathPart);
          const storageRef = ref(storage, decodedPath);
          await deleteObject(storageRef);
        }
      } catch (error) {
        console.warn("Could not delete image from storage:", error);
        // Continue with removing from array even if storage delete fails
      }
    }

    if (isNew) {
      const newImages = [...(newAccount.images || [])];
      newImages.splice(index, 1);
      setNewAccount({ ...newAccount, images: newImages });
    } else {
      const newImages = [...(selectedAccount.images || [])];
      newImages.splice(index, 1);
      setSelectedAccount({ ...selectedAccount, images: newImages });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FaSpinner
          className={`animate-spin text-4xl ${
            isDark ? "text-purple-400" : "text-purple-600"
          }`}
        />
      </div>
    );
  }

  return (
    <div
      className={`py-4 px-2 sm:px-4 min-h-screen-dvh ${
        isDark ? "bg-gray-900" : "bg-gray-50"
      }`}
    >
      {/* Header with Add Button */}
      <div
        className={`mb-6 rounded-lg shadow-sm p-4 sm:p-6 ${
          isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        } border`}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h2
              className={`text-2xl sm:text-3xl font-bold ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              Game Accounts
            </h2>
            <p
              className={`text-sm mt-1 ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Manage game accounts for sale
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md hover:shadow-lg"
          >
            <FiPlus className="w-5 h-5" />
            <span>Add New Account</span>
          </button>
        </div>
      </div>

      {/* Accounts Grid */}
      {filteredAccounts.length === 0 ? (
        <div
          className={`rounded-lg shadow-lg p-8 text-center ${
            isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          } border`}
        >
          <FiImage
            className={`w-16 h-16 mx-auto mb-4 ${
              isDark ? "text-gray-600" : "text-gray-400"
            }`}
          />
          <p
            className={`text-lg font-medium mb-2 ${
              isDark ? "text-gray-300" : "text-gray-700"
            }`}
          >
            No available game accounts found
          </p>
          <p
            className={`text-sm mb-4 ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Click 'Add New Account' to create your first available game account
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            <FiPlus className="w-5 h-5" />
            <span>Add Your First Account</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAccounts.map((account) => (
            <div
              key={account.id}
              className={`rounded-lg shadow-lg overflow-hidden border hover:shadow-xl transition-shadow ${
                isDark
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              {/* Image */}
              <div
                className={`relative aspect-video overflow-hidden ${
                  isDark ? "bg-gray-700" : "bg-gray-200"
                }`}
              >
                {account.images && account.images.length > 0 ? (
                  <img
                    src={account.images[0]}
                    alt={account.label}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <FiImage className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      account.status === "Available"
                        ? "bg-green-500 text-white"
                        : account.status === "Sold"
                        ? "bg-red-500 text-white"
                        : "bg-yellow-500 text-white"
                    }`}
                  >
                    {account.status || "Available"}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3
                  className={`font-bold mb-2 line-clamp-2 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {account.label}
                </h3>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-lg font-bold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    ₹{account.rupees || 0}
                  </span>
                </div>
                <p
                  className={`text-xs mb-3 ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {formatDate(account.date)}
                </p>
                {account.images && account.images.length > 1 && (
                  <p
                    className={`text-xs mb-3 ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {account.images.length} images
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setSelectedAccount(account)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <FiEdit2 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(account.id)}
                    className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    disabled={saving}
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div
          className={`fixed inset-0 flex items-center justify-center z-50 p-4 ${
            isDark ? "bg-black/70" : "bg-black/50"
          } backdrop-blur-sm`}
        >
          <div
            className={`rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${
              isDark ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div
              className={`sticky top-0 border-b p-4 flex items-center justify-between ${
                isDark
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <h2
                className={`text-xl font-bold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Add Game Account
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"
                }`}
              >
                <FiPlus
                  className={`w-5 h-5 rotate-45 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Account ID *
                </label>
                <input
                  type="text"
                  value={newAccount.id}
                  onChange={(e) =>
                    setNewAccount({ ...newAccount, id: e.target.value })
                  }
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    isDark
                      ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400"
                      : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"
                  }`}
                  placeholder="Unique account ID"
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Label *
                </label>
                <input
                  type="text"
                  value={newAccount.label}
                  onChange={(e) =>
                    setNewAccount({ ...newAccount, label: e.target.value })
                  }
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    isDark
                      ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400"
                      : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"
                  }`}
                  placeholder="Game account label"
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Rupees *
                </label>
                <input
                  type="number"
                  value={newAccount.rupees}
                  onChange={(e) =>
                    setNewAccount({ ...newAccount, rupees: e.target.value })
                  }
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    isDark
                      ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400"
                      : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"
                  }`}
                  placeholder="Price in rupees"
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Posted By
                </label>
                <input
                  type="text"
                  value={user?.name || user?.email || user?.username || "Admin"}
                  disabled
                  className={`w-full px-4 py-2 border rounded-lg cursor-not-allowed ${
                    isDark
                      ? "border-gray-600 bg-gray-700 text-gray-400"
                      : "border-gray-300 bg-gray-100 text-gray-600"
                  }`}
                  placeholder="Posted by (auto-filled)"
                />
                <p
                  className={`text-xs mt-1 ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Automatically set to current user
                </p>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Status
                </label>
                <select
                  value={newAccount.status}
                  onChange={(e) =>
                    setNewAccount({ ...newAccount, status: e.target.value })
                  }
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    isDark
                      ? "border-gray-600 bg-gray-700 text-white"
                      : "border-gray-300 bg-white text-gray-900"
                  }`}
                >
                  <option value="Available">Available</option>
                  <option value="pending">Pending</option>
                  <option value="Sold">Sold</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Images
                </label>
                <div className="space-y-3">
                  {newAccount.images?.map((img, idx) => {
                    const previewKey = `new-${idx}`;
                    const uploadKey = `new-${idx}`;
                    const isUploading = uploadingImages[uploadKey];
                    const preview = imagePreviews[previewKey] || img;
                    return (
                      <div
                        key={idx}
                        className={`border rounded-lg p-3 ${
                          isDark ? "border-gray-600" : "border-gray-300"
                        }`}
                      >
                        <div className="flex gap-3 mb-2">
                          {preview && (
                            <div className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 relative">
                              <img
                                src={preview}
                                alt={`Preview ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                              {isUploading && (
                                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                                  <div className="text-center">
                                    <FaSpinner className="animate-spin w-6 h-6 text-white mx-auto mb-1" />
                                    <span className="text-xs text-white font-medium">
                                      Uploading...
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          {isUploading && !preview && (
                            <div className="w-20 h-20 rounded-lg border-2 border-dashed border-blue-400 bg-blue-50 flex items-center justify-center flex-shrink-0">
                              <div className="text-center">
                                <FaSpinner className="animate-spin w-6 h-6 text-blue-600 mx-auto mb-1" />
                                <span className="text-xs text-blue-600 font-medium">
                                  Uploading...
                                </span>
                              </div>
                            </div>
                          )}
                          <div className="flex-1 space-y-2">
                            <input
                              type="text"
                              value={img}
                              onChange={(e) =>
                                handleImageUrlChange(e.target.value, idx, true)
                              }
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                                isDark
                                  ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400"
                                  : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"
                              }`}
                              placeholder="Image URL or upload file below"
                              disabled={isUploading}
                            />
                            <label
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm font-medium transition-colors ${
                                isUploading
                                  ? isDark
                                    ? "bg-blue-900/30 text-blue-400 cursor-wait"
                                    : "bg-blue-100 text-blue-700 cursor-wait"
                                  : isDark
                                  ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                              }`}
                            >
                              <FiUpload className="w-4 h-4" />
                              <span>
                                {isUploading ? "Uploading..." : "Upload Image"}
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) handleImageUpload(file, idx, true);
                                  e.target.value = ""; // Reset input
                                }}
                                className="hidden"
                                disabled={isUploading}
                              />
                              {isUploading && (
                                <FaSpinner className="animate-spin w-4 h-4" />
                              )}
                            </label>
                          </div>
                          <button
                            onClick={() => handleRemoveImage(idx, true)}
                            className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex-shrink-0"
                            disabled={isUploading}
                          >
                            <FiX className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  <div className="space-y-2">
                    {uploadingImages["new-bulk-upload"] && (
                      <div className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
                        <FaSpinner className="animate-spin w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">
                          Uploading images to Firebase...
                        </span>
                      </div>
                    )}
                    <label
                      className={`flex flex-col items-center justify-center w-full px-4 py-6 border-2 border-dashed rounded-lg transition-colors ${
                        uploadingImages["new-bulk-upload"]
                          ? isDark
                            ? "border-blue-400 bg-blue-900/30 cursor-wait"
                            : "border-blue-400 bg-blue-50 cursor-wait"
                          : isDark
                          ? "border-gray-600 hover:border-blue-500 cursor-pointer"
                          : "border-gray-300 hover:border-blue-500 cursor-pointer"
                      }`}
                    >
                      {uploadingImages["new-bulk-upload"] ? (
                        <>
                          <FaSpinner className="animate-spin w-8 h-8 text-blue-600 mb-2" />
                          <span className="text-sm font-medium text-blue-700">
                            Uploading Images...
                          </span>
                        </>
                      ) : (
                        <>
                          <FiUpload className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-sm font-medium text-gray-600">
                            Upload Images (Multiple Selection Allowed)
                          </span>
                          <span className="text-xs text-gray-500 mt-1">
                            Click to select multiple images or drag and drop
                          </span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          const files = e.target.files;
                          if (files && files.length > 0) {
                            handleMultipleImageUpload(files, true);
                          }
                          e.target.value = ""; // Reset input
                        }}
                        className="hidden"
                        disabled={uploadingImages["new-bulk-upload"]}
                      />
                    </label>
                    <button
                      onClick={() =>
                        setNewAccount({
                          ...newAccount,
                          images: [...(newAccount.images || []), ""],
                        })
                      }
                      className={`w-full px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                        isDark
                          ? "border-gray-600 hover:bg-gray-700 text-gray-300"
                          : "border-gray-300 hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      + Add Image URL (Manual)
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAddNew}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {saving ? "Adding..." : "Add Account"}
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isDark
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {selectedAccount && (
        <div
          className={`fixed inset-0 flex items-center justify-center z-50 p-4 ${
            isDark ? "bg-black/70" : "bg-black/50"
          } backdrop-blur-sm`}
        >
          <div
            className={`rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${
              isDark ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div
              className={`sticky top-0 border-b p-4 flex items-center justify-between ${
                isDark
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <h2
                className={`text-xl font-bold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Edit Game Account
              </h2>
              <button
                onClick={() => setSelectedAccount(null)}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"
                }`}
              >
                <FiPlus
                  className={`w-5 h-5 rotate-45 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Account ID
                </label>
                <input
                  type="text"
                  value={selectedAccount.id}
                  disabled
                  className={`w-full px-4 py-2 border rounded-lg ${
                    isDark
                      ? "border-gray-600 bg-gray-700 text-gray-400"
                      : "border-gray-300 bg-gray-100 text-gray-600"
                  }`}
                />
                <p
                  className={`text-xs mt-1 ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  ID cannot be changed
                </p>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Label *
                </label>
                <input
                  type="text"
                  value={selectedAccount.label || ""}
                  onChange={(e) =>
                    setSelectedAccount({
                      ...selectedAccount,
                      label: e.target.value,
                    })
                  }
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    isDark
                      ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400"
                      : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"
                  }`}
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Rupees *
                </label>
                <input
                  type="number"
                  value={selectedAccount.rupees || ""}
                  onChange={(e) =>
                    setSelectedAccount({
                      ...selectedAccount,
                      rupees: e.target.value,
                    })
                  }
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    isDark
                      ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400"
                      : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"
                  }`}
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Posted By
                </label>
                <input
                  type="text"
                  value={selectedAccount.postedBy || ""}
                  disabled
                  className={`w-full px-4 py-2 border rounded-lg cursor-not-allowed ${
                    isDark
                      ? "border-gray-600 bg-gray-700 text-gray-400"
                      : "border-gray-300 bg-gray-100 text-gray-600"
                  }`}
                />
                <p
                  className={`text-xs mt-1 ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Original poster (cannot be changed)
                </p>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Status
                </label>
                <select
                  value={selectedAccount.status || "Available"}
                  onChange={(e) =>
                    setSelectedAccount({
                      ...selectedAccount,
                      status: e.target.value,
                    })
                  }
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    isDark
                      ? "border-gray-600 bg-gray-700 text-white"
                      : "border-gray-300 bg-white text-gray-900"
                  }`}
                >
                  <option value="Available">Available</option>
                  <option value="pending">Pending</option>
                  <option value="Sold">Sold</option>
                </select>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Images
                </label>
                <div className="space-y-3">
                  {selectedAccount.images?.map((img, idx) => {
                    const previewKey = `edit-${idx}`;
                    const uploadKey = `edit-${idx}`;
                    const isUploading = uploadingImages[uploadKey];
                    const preview = imagePreviews[previewKey] || img;
                    return (
                      <div
                        key={idx}
                        className={`border rounded-lg p-3 ${
                          isDark ? "border-gray-600" : "border-gray-300"
                        }`}
                      >
                        <div className="flex gap-3 mb-2">
                          {preview && (
                            <div className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 relative">
                              <img
                                src={preview}
                                alt={`Preview ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                              {isUploading && (
                                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                                  <div className="text-center">
                                    <FaSpinner className="animate-spin w-6 h-6 text-white mx-auto mb-1" />
                                    <span className="text-xs text-white font-medium">
                                      Uploading...
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          {isUploading && !preview && (
                            <div className="w-20 h-20 rounded-lg border-2 border-dashed border-blue-400 bg-blue-50 flex items-center justify-center flex-shrink-0">
                              <div className="text-center">
                                <FaSpinner className="animate-spin w-6 h-6 text-blue-600 mx-auto mb-1" />
                                <span className="text-xs text-blue-600 font-medium">
                                  Uploading...
                                </span>
                              </div>
                            </div>
                          )}
                          <div className="flex-1 space-y-2">
                            <input
                              type="text"
                              value={img}
                              onChange={(e) =>
                                handleImageUrlChange(e.target.value, idx, false)
                              }
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                                isDark
                                  ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400"
                                  : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"
                              }`}
                              placeholder="Image URL or upload file below"
                              disabled={isUploading}
                            />
                            <label
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm font-medium transition-colors ${
                                isUploading
                                  ? isDark
                                    ? "bg-blue-900/30 text-blue-400 cursor-wait"
                                    : "bg-blue-100 text-blue-700 cursor-wait"
                                  : isDark
                                  ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                              }`}
                            >
                              <FiUpload className="w-4 h-4" />
                              <span>
                                {isUploading ? "Uploading..." : "Upload Image"}
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) handleImageUpload(file, idx, false);
                                  e.target.value = ""; // Reset input
                                }}
                                className="hidden"
                                disabled={isUploading}
                              />
                              {isUploading && (
                                <FaSpinner className="animate-spin w-4 h-4" />
                              )}
                            </label>
                          </div>
                          <button
                            onClick={() => handleRemoveImage(idx, false)}
                            className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex-shrink-0"
                            disabled={isUploading}
                          >
                            <FiX className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  <div className="space-y-2">
                    {uploadingImages["edit-bulk-upload"] && (
                      <div className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
                        <FaSpinner className="animate-spin w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">
                          Uploading images to Firebase...
                        </span>
                      </div>
                    )}
                    <label
                      className={`flex flex-col items-center justify-center w-full px-4 py-6 border-2 border-dashed rounded-lg transition-colors ${
                        uploadingImages["edit-bulk-upload"]
                          ? isDark
                            ? "border-blue-400 bg-blue-900/30 cursor-wait"
                            : "border-blue-400 bg-blue-50 cursor-wait"
                          : isDark
                          ? "border-gray-600 hover:border-blue-500 cursor-pointer"
                          : "border-gray-300 hover:border-blue-500 cursor-pointer"
                      }`}
                    >
                      {uploadingImages["edit-bulk-upload"] ? (
                        <>
                          <FaSpinner className="animate-spin w-8 h-8 text-blue-600 mb-2" />
                          <span className="text-sm font-medium text-blue-700">
                            Uploading Images...
                          </span>
                        </>
                      ) : (
                        <>
                          <FiUpload className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-sm font-medium text-gray-600">
                            Upload Images (Multiple Selection Allowed)
                          </span>
                          <span className="text-xs text-gray-500 mt-1">
                            Click to select multiple images or drag and drop
                          </span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          const files = e.target.files;
                          if (files && files.length > 0) {
                            handleMultipleImageUpload(files, false);
                          }
                          e.target.value = ""; // Reset input
                        }}
                        className="hidden"
                        disabled={uploadingImages["edit-bulk-upload"]}
                      />
                    </label>
                    <button
                      onClick={() =>
                        setSelectedAccount({
                          ...selectedAccount,
                          images: [...(selectedAccount.images || []), ""],
                        })
                      }
                      className={`w-full px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                        isDark
                          ? "border-gray-600 hover:bg-gray-700 text-gray-300"
                          : "border-gray-300 hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      + Add Image URL (Manual)
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() =>
                    handleUpdate(selectedAccount.id, {
                      label: selectedAccount.label,
                      rupees: parseFloat(selectedAccount.rupees) || 0,
                      postedBy: selectedAccount.postedBy || "",
                      status: selectedAccount.status || "Available",
                      images: selectedAccount.images || [],
                    })
                  }
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => setSelectedAccount(null)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isDark
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminGameAccounts;
