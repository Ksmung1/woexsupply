// AddModal.jsx
import { FiX } from "react-icons/fi";
import { useTheme } from "../../../context/ThemeContext";

/**
 * AddModal - reusable add-item modal
 *
 * Props:
 * - show: boolean
 * - onClose: () => void
 * - newItem: object (form state)
 * - handleNewChange: (field, value) => void
 * - handleAddNew: () => void
 * - handleJSONUpload: (e) => void
 * - loading: boolean
 * - collectionName?: string (optional UI display)
 * - groups?: Array<{ key: string, label?: string, image?: string }>
 * - apiOptions?: Array<{ value: string, label?: string }>
 * - hideGroupsAndApi?: boolean (hide Groups and API sections)
 * - initialValues?: Partial<object>
 */
const AddModal = ({
  show,
  onClose,
  newItem,
  handleNewChange,
  handleAddNew,
  handleJSONUpload,
  loading,
  collectionName,
  groups=[], // array of { key, label, image? }
  apiOptions = [
    { value: "smile", label: "Smile" },
  ],
  hideGroupsAndApi = false,
  fields = [
    { label: "ID", field: "id", type: "text", placeholder: "ID" },
    { label: "Label", field: "label", type: "text", placeholder: "Label" },
    { label: "Diamonds", field: "diamonds", type: "text", placeholder: "Diamonds" },
    { label: "Type (small)", field: "type", type: "text", placeholder: "Type" },
    { label: "Rupees", field: "rupees", type: "number", placeholder: "Rupees" },
    { label: "Reseller Rupees", field: "resellerRupees", type: "number", placeholder: "Reseller Rupees" },
    { label: "False Rupees", field: "falseRupees", type: "number", placeholder: "False Rupees" },
    { label: "Price", field: "price", type: "number", placeholder: "Price" },
  ],
  initialValues = {},
}) => {
  const { isDark } = useTheme();
  if (!show) return null;
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
      {/* backdrop */}
      <div onClick={onClose} className={`absolute inset-0 backdrop-blur-sm ${isDark ? "bg-black/70" : "bg-black/60"}`} />

      {/* panel */}
      <div className={`relative z-10 w-full md:w-[90%] lg:w-[70%] xl:w-[60%] max-h-[90vh] overflow-auto rounded-2xl shadow-2xl animate-scale-in ${isDark ? "bg-gray-800" : "bg-white"}`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <h3 className="text-xl md:text-2xl font-bold text-white">
            Add New Product{collectionName ? ` — ${collectionName}` : ""}
          </h3>
            <button
              aria-label="Close add product"
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
                value={newItem[field] ?? initialValues[field] ?? ""}
                onChange={(e) => handleNewChange(field, e.target.value)}
                placeholder={placeholder}
                  className={`w-full border-2 px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:border-purple-500 focus:ring-2 transition-all ${isDark ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:ring-purple-900" : "border-gray-200 bg-white text-gray-900 placeholder-gray-500 focus:ring-purple-200"}`}
              />
            </div>
          ))}
          </div>

          {/* Groups and API - only show if not hidden */}
          {!hideGroupsAndApi && (groups.length > 0 || apiOptions.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-4">
              {groups.length > 0 && (
                <div className="flex flex-col gap-2">
                  <label className={`font-semibold text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>Group</label>
                  <div className="flex items-center gap-3">
                    <select
                      value={newItem.group ?? ""}
                      onChange={(e) => handleNewChange("group", e.target.value)}
                      className={`flex-1 border-2 px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:border-purple-500 focus:ring-2 transition-all ${isDark ? "border-gray-600 bg-gray-700 text-white focus:ring-purple-900" : "border-gray-200 bg-white text-gray-900 focus:ring-purple-200"}`}
                    >
                      <option value="">Select Group</option>
                      {groups.map((g) => (
                        <option key={g.key} value={g.key}>
                          {g.label ?? g.key}
                        </option>
                      ))}
                    </select>
                    {newItem.group && (
                      (() => {
                        const selected = groups.find((g) => g.key === newItem.group);
                        return selected && selected.image ? (
                          <img src={selected.image} alt={selected.label ?? selected.key} className={`h-12 w-12 rounded-lg border-2 object-cover ${isDark ? "border-gray-600" : "border-gray-200"}`} />
                        ) : null;
                      })()
                    )}
                  </div>
                </div>
              )}

              {apiOptions.length > 0 && (
                <div className="flex flex-col gap-2">
                  <label className={`font-semibold text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>API</label>
                  <select
                    value={newItem.api ?? apiOptions[0]?.value ?? ""}
                    onChange={(e) => handleNewChange("api", e.target.value)}
                    className={`w-full border-2 px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:border-purple-500 focus:ring-2 transition-all ${isDark ? "border-gray-600 bg-gray-700 text-white focus:ring-purple-900" : "border-gray-200 bg-white text-gray-900 focus:ring-purple-200"}`}
                  >
                    {apiOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label ?? opt.value}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* JSON Upload */}
          <div className={`mt-6 p-4 rounded-lg border-2 border-dashed ${isDark ? "bg-gray-900 border-gray-600" : "bg-gray-50 border-gray-300"}`}>
            <label htmlFor="jsoninput" className={`block font-semibold text-sm mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              Upload from JSON
            </label>
            <input
              type="file"
              id="jsoninput"
              accept=".json,application/json"
              onChange={handleJSONUpload}
              className={`w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold cursor-pointer ${isDark ? "text-gray-400 file:bg-purple-900/30 file:text-purple-300 hover:file:bg-purple-900/50" : "text-gray-600 file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"}`}
            />
          </div>

          {/* Action Buttons */}
          <div className={`flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-6 border-t ${isDark ? "border-gray-700" : "border-gray-200"}`}>
            <button
              onClick={onClose}
              className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 ${isDark ? "text-gray-300 bg-gray-700 hover:bg-gray-600" : "text-gray-700 bg-gray-100 hover:bg-gray-200"}`}
            >
              Cancel
            </button>
            <button
              onClick={handleAddNew}
              disabled={loading}
              className="px-6 py-2.5 rounded-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Adding...
                </>
              ) : (
                "Add Product"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddModal;
