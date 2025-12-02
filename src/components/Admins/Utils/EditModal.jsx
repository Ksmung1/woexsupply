// EditModal.jsx
import React from "react";
import { FiX } from "react-icons/fi";

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
  if (!show || !selectedItem) return null;

  const handleDelete = async () => {
    if (confirmBeforeDelete) {
      const ok = window.confirm(`Delete ${selectedItem.id || selectedItem.label || "this item"}? This cannot be undone.`);
      if (!ok) return;
    }
    if (onDelete) await onDelete(selectedItem.id);
  };

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 w-full md:w-[70%] lg:w-[50%] max-h-[80vh] overflow-auto rounded-lg p-6 shadow-lg bg-white border">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">
            Edit Product {collectionName ? `— ${collectionName}` : ""} {" "}
            <span className="text-sm text-gray-500">({selectedItem.id})</span>
          </h3>
          <button aria-label="Close edit" onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <FiX size={22} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {fields.map(({ label, field, type, placeholder }) => (
            <div key={field} className="flex flex-col gap-1 text-left">
              <label className="font-medium text-sm">{label}</label>
              <input
                type={type}
                value={selectedItem[field] ?? ""}
                onChange={(e) => onChange(field, e.target.value)}
                placeholder={placeholder}
                className="border px-3 py-2 rounded text-sm bg-white border-gray-300 text-gray-900"
              />
            </div>
          ))}

          {/* Group selector (data-driven) */}
          <div className="flex flex-col gap-2 mt-2">
            <label className="font-medium text-sm">Group</label>
            <div className="flex items-center gap-3">
              <select
                value={selectedItem.group ?? ""}
                onChange={(e) => onChange("group", e.target.value)}
                className="border px-3 py-2 rounded text-sm w-full bg-white border-gray-300 text-gray-900"
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
                return sel && sel.image ? <img src={sel.image} alt={sel.label ?? sel.key} className="h-10 w-10 rounded-md border" /> : null;
              })()}
            </div>
          </div>

          {/* API (locked or editable depending on presence of apiOptions) */}
          <div className="flex flex-col gap-2 mt-2">
            <label className="font-medium text-sm">API</label>
            {apiOptions && apiOptions.length > 0 ? (
              <select
                value={selectedItem.api ?? apiOptions[0].value}
                onChange={(e) => onChange("api", e.target.value)}
                className="border px-3 py-2 rounded text-sm w-full bg-white border-gray-300 text-gray-900"
              >
                {apiOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label ?? opt.value}
                  </option>
                ))}
              </select>
            ) : (
              <input type="text" value={selectedItem.api ?? "yokcash"} readOnly className="border px-3 py-2 rounded text-sm bg-gray-100 w-full" />
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button onClick={handleDelete} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded">
              {loading ? "Deleting..." : "Delete"}
            </button>
            <button onClick={onSave} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded">
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditModal;
