// AddModal.jsx
import { FiX } from "react-icons/fi";

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
  if (!show) return null;
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-black/40" />

      {/* panel */}
      <div className="relative z-10 w-full md:w-[70%] lg:w-[50%] max-h-[80vh] overflow-auto rounded-lg p-6 shadow-lg bg-white border">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">
            Add New Product{collectionName ? ` — ${collectionName}` : ""}
          </h3>
          <button aria-label="Close add product" onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <FiX size={22} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {fields.map(({ label, field, type, placeholder }) => (
            <div key={field} className="flex flex-col gap-1 text-left">
              <label className="font-medium text-sm">{label}</label>
              <input
                type={type}
                value={newItem[field] ?? initialValues[field] ?? ""}
                onChange={(e) => handleNewChange(field, e.target.value)}
                placeholder={placeholder}
                className="border px-3 py-2 rounded text-sm bg-white border-gray-300 text-gray-900"
              />
            </div>
          ))}

          {/* Groups (provided by parent) */}
          <div className="flex flex-col gap-2">
            <label className="font-medium text-sm">Group</label>
            <div className="flex items-center gap-3">
              <select
                value={newItem.group ?? ""}
                onChange={(e) => handleNewChange("group", e.target.value)}
                className="border px-3 py-2 rounded text-sm w-full bg-white border-gray-300 text-gray-900"
              >
                <option value="">Select Group</option>
                {groups.map((g) => (
                  <option key={g.key} value={g.key}>
                    {g.label ?? g.key}
                  </option>
                ))}
              </select>

              {/* show preview if parent provided an image for the selected group */}
              {newItem.group && (
                (() => {
                  const selected = groups.find((g) => g.key === newItem.group);
                  return selected && selected.image ? (
                    <img src={selected.image} alt={selected.label ?? selected.key} className="h-10 w-10 rounded-md border" />
                  ) : null;
                })()
              )}
            </div>
          </div>

          {/* API options */}
          <div className="flex flex-col gap-2">
            <label className="font-medium text-sm">API</label>
            <select
              value={newItem.api ?? apiOptions[0]?.value ?? ""}
              onChange={(e) => handleNewChange("api", e.target.value)}
              className="border px-3 py-2 rounded text-sm w-full bg-white border-gray-300 text-gray-900"
            >
              {apiOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label ?? opt.value}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300">
              Cancel
            </button>
            <button onClick={handleAddNew} disabled={loading} className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-60">
              {loading ? "Adding..." : "Add Product"}
            </button>
          </div>

          <div className="mt-4">
            <label htmlFor="jsoninput" className="block font-medium text-sm mb-1">
              Upload from JSON
            </label>
            <input type="file" id="jsoninput" accept=".json,application/json" onChange={handleJSONUpload} className="text-sm" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddModal;
