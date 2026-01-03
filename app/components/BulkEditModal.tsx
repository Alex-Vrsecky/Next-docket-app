'use client';
import { useState } from "react";
import { ProductInterface } from "../_types/productInterface";
import { doc, writeBatch } from "firebase/firestore";
import { db } from "../firebase/firebaseInit";

export function BulkEditModal({
  products,
  onClose,
  onSave,
}: {
  products: ProductInterface[];
  onClose: () => void;
  onSave: (updatedProducts: ProductInterface[]) => void;
}) {
  const [editField, setEditField] = useState<keyof ProductInterface | "">(
    ""
  );
  const [newValue, setNewValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBulkEdit = async () => {
    if (!editField || newValue === "") {
      alert("Please select a field and enter a value");
      return;
    }

    const confirmEdit = window.confirm(
      `Update ${editField} to "${newValue}" for ${products.length} product${products.length !== 1 ? "s" : ""}?`
    );

    if (!confirmEdit) return;

    setIsProcessing(true);

    try {
      const batch = writeBatch(db);
      const updatedProducts = [...products];

      products.forEach((product) => {
        const productRef = doc(db, "products", product.id);
        batch.update(productRef, {
          [editField]: newValue,
        });

        // Update local state
        const index = updatedProducts.findIndex((p) => p.id === product.id);
        if (index !== -1) {
          updatedProducts[index] = {
            ...updatedProducts[index],
            [editField]: newValue,
          };
        }
      });

      await batch.commit();
      onSave(updatedProducts);
      alert("Products updated successfully!");
      onClose();
    } catch (err) {
      console.error("Error updating products:", err);
      alert(
        "Failed to update products: " +
          (err instanceof Error ? err.message : String(err))
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const fields: (keyof ProductInterface)[] = [
    "category",
    "subCategory",
    "Length",
    "Desc",
    "Extra",
    "priceWithNote",
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Bulk Edit ({products.length} products)
        </h2>

        {/* Field Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Field to edit:
          </label>
          <select
            value={editField}
            onChange={(e) => {
              setEditField(e.target.value as keyof ProductInterface);
              setNewValue("");
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(13,82,87)]"
          >
            <option value="">Select a field</option>
            {fields.map((field) => (
              <option key={field} value={field}>
                {field}
              </option>
            ))}
          </select>
        </div>

        {/* Value Input */}
        {editField && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New value for {editField}:
            </label>
            <textarea
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder={`Enter new ${editField}`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(13,82,87)]"
              rows={3}
            />
          </div>
        )}

        {/* Preview */}
        {editField && newValue && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Preview:</strong> Will update {editField} to:{" "}
              <span className="font-mono text-xs bg-white px-1 rounded">
                {newValue}
              </span>
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleBulkEdit}
            disabled={!editField || !newValue || isProcessing}
            className="px-4 py-2 bg-[rgb(13,82,87)] text-white rounded-lg font-semibold hover:bg-[rgb(10,65,69)] transition-colors disabled:opacity-50"
          >
            {isProcessing ? "Updating..." : "Update"}
          </button>
        </div>
      </div>
    </div>
  );
}
