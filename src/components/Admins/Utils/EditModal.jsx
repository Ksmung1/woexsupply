// EditModal.jsx
import React from "react";
import { FiX } from "react-icons/fi";
import { useAlert } from "../../../context/AlertContext";
import { useTheme } from "../../../context/ThemeContext";

/**
 * Reusable EditModal
 *
 * Props:
 * - show: boolean
 * - onClose: () => void
 * - selectedItem: object | null
 * - onChange: (field, value) => void
 * - onSave: () => Promise<void>
 * - onDelete: () => Promise<void>
 * - loading?: boolean
 * - collectionName?: string
 * - groups?: Array<{ key: string, label?: string, image?: string }>
 * - apiOptions?: Array<{ value: string, label?: string }>
 * - hideGroupsAndApi?: boolean (hide Groups and API sections)
 * - fields?: Array<{ label, field, type, placeholder }>
 * - confirmBeforeDelete?: boolean
 */
const EditModal = ({
  show,
  onClose,
  selectedItem,
  onChange,
  onSave,
  onDelete,
  loading = false,
  collectionName,
  groups = [],
  apiOptions = [{ value: "yokcash", label: "Yokcash" }, { value: "busan", label: "Busan" }, { value: "smile", label: "Smile" }],
  hideGroupsAndApi = false,
  fields = [
    { label: "Label", field: "label", type: "text", placeholder: "Label" },
    { label: "Diamonds", field: "diamonds", type: "text", placeholder: "Diamonds" },
    { label: "Type (small)", field: "type", type: "text", placeholder: "Type" },
    { label: "Rupees", field: "rupees", type: "number", placeholder: "Rupees" },
    { label: "Reseller Rupees", field: "resellerRupees", type: "number", placeholder: "Reseller" },
    { label: "False Rupees", field: "falseRupees", type: "number", placeholder: "Fake Rupees" },
    { label: "Price", field: "price", type: "number", placeholder: "Price" },
  ],
  confirmBeforeDelete = true,
}) => {
  const { isDark } = useTheme();
  const { showConfirm, showError } = useAlert();
  
  if (!show || !selectedItem) return null;

  const handleDelete = async () => {
    if (confirmBeforeDelete) {
      showConfirm(
        `Are you sure you want to delete "${selectedItem.id || selectedItem.label || "this item"}"? This action cannot be undone.`,
        async () => {
          try {
            if (onDelete) await onDelete(selectedItem.id);
          } catch (error) {
            showError(error?.message || "Failed to delete item");
          }
        },
        "Delete Item"
      );
      return;
    }
    try {
    if (onDelete) await onDelete(selectedItem.id);
    } catch (error) {
      showError(error?.message || "Failed to delete item");
    }
  };

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
      <div onClick={onClose} className={`absolute inset-0 backdrop-blur-sm ${isDark ? "bg-black/70" : "bg-black/60"}`} />

      <div className={`relative z-10 w-full md:w-[90%] lg:w-[70%] xl:w-[60%] max-h-[90vh] overflow-auto rounded-2xl shadow-2xl animate-scale-in ${isDark ? "bg-gray-800" : "bg-white"}`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-white">
                Edit Product {collectionName ? `— ${collectionName}` : ""}
          </h3>
              <p className="text-sm text-purple-100 mt-1">ID: {selectedItem.id}</p>
            </div>
            <button
              aria-label="Close edit"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors text-white"
            >
              <FiX size={24} />
          </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {fields.map(({ label, field, type, placeholder }) => (
              <div key={field} className="flex flex-col gap-2">
                <label className={`font-semibold text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>{label}</label>
              <input
                type={type}
                value={selectedItem[field] ?? ""}
                onChange={(e) => onChange(field, e.target.value)}
                placeholder={placeholder}
                  className={`w-full border-2 px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:border-purple-500 focus:ring-2 transition-all ${isDark ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:ring-purple-900" : "border-gray-200 bg-white text-gray-900 placeholder-gray-500 focus:ring-purple-200"}`}
              />
            </div>
          ))}
          </div>

          {/* Group and API - only show if not hidden */}
          {!hideGroupsAndApi && (groups.length > 0 || apiOptions.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-4">
              {groups.length > 0 && (
                <div className="flex flex-col gap-2">
                  <label className={`font-semibold text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>Group</label>
                  <div className="flex items-center gap-3">
                    <select
                      value={selectedItem.group ?? ""}
                      onChange={(e) => onChange("group", e.target.value)}
                      className={`flex-1 border-2 px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:border-purple-500 focus:ring-2 transition-all ${isDark ? "border-gray-600 bg-gray-700 text-white focus:ring-purple-900" : "border-gray-200 bg-white text-gray-900 focus:ring-purple-200"}`}
                    >
                      <option value="">Select Group</option>
                      {groups.map((g) => (
                        <option key={g.key} value={g.key}>
                          {g.label ?? g.key}
                        </option>
                      ))}
                    </select>
                    {selectedItem.group && (() => {
                      const sel = groups.find((g) => g.key === selectedItem.group);
                      return sel && sel.image ? (
                        <img src={sel.image} alt={sel.label ?? sel.key} className={`h-12 w-12 rounded-lg border-2 object-cover ${isDark ? "border-gray-600" : "border-gray-200"}`} />
                      ) : null;
                    })()}
                  </div>
                </div>
              )}

              {apiOptions.length > 0 && (
                <div className="flex flex-col gap-2">
                  <label className={`font-semibold text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>API</label>
                  {apiOptions && apiOptions.length > 0 ? (
                    <select
                      value={selectedItem.api ?? apiOptions[0].value}
                      onChange={(e) => onChange("api", e.target.value)}
                      className={`w-full border-2 px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:border-purple-500 focus:ring-2 transition-all ${isDark ? "border-gray-600 bg-gray-700 text-white focus:ring-purple-900" : "border-gray-200 bg-white text-gray-900 focus:ring-purple-200"}`}
                    >
                      {apiOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label ?? opt.value}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={selectedItem.api ?? "yokcash"}
                      readOnly
                      className={`w-full border-2 px-4 py-2.5 rounded-lg text-sm cursor-not-allowed ${isDark ? "border-gray-600 bg-gray-700 text-gray-400" : "border-gray-200 bg-gray-100 text-gray-600"}`}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className={`flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-6 border-t ${isDark ? "border-gray-700" : "border-gray-200"}`}>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="px-6 py-2.5 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </button>
            <button
              onClick={onSave}
              disabled={loading}
              className="px-6 py-2.5 rounded-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditModal;
