'use client';
import { useState } from "react";
import { ProductInterface } from "../productAdjustment/page";
import { doc, writeBatch } from "firebase/firestore";
import { db } from "../firebase/firebaseInit";

// Bulk Rename Modal Component
export function BulkRenameModal({
  products,
  onClose,
  onSave,
}: {
  products: ProductInterface[];
  onClose: () => void;
  onSave: (updatedProducts: ProductInterface[]) => void;
}) {
  const [renameType, setRenameType] = useState<"category" | "subcategory">(
    "category"
  );
  const [oldValue, setOldValue] = useState("");
  const [newValue, setNewValue] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Get unique categories and subcategories
  const categories = Array.from(new Set(products.map((p) => p.category)))
    .filter(Boolean)
    .sort();
  const subcategories = Array.from(new Set(products.map((p) => p.subCategory)))
    .filter(Boolean)
    .sort();

  // Get subcategories for selected category
  const subcategoriesForCategory = selectedCategory
    ? Array.from(
        new Set(
          products
            .filter((p) => p.category === selectedCategory)
            .map((p) => p.subCategory)
        )
      )
        .filter(Boolean)
        .sort()
    : [];

  const getAffectedCount = () => {
    if (renameType === "category") {
      return products.filter((p) => p.category === oldValue).length;
    } else {
      if (selectedCategory) {
        return products.filter(
          (p) => p.category === selectedCategory && p.subCategory === oldValue
        ).length;
      }
      return products.filter((p) => p.subCategory === oldValue).length;
    }
  };

  const handleBulkRename = async () => {
    if (!oldValue || !newValue) {
      alert("Please fill in both old and new values");
      return;
    }

    if (oldValue === newValue) {
      alert("Old and new values cannot be the same");
      return;
    }

    const affectedCount = getAffectedCount();
    const confirmRename = window.confirm(
      `This will rename ${affectedCount} product${affectedCount !== 1 ? "s" : ""}. Continue?`
    );

    if (!confirmRename) return;

    setIsProcessing(true);

    try {
      const batch = writeBatch(db);
      const updatedProducts = [...products];

      products.forEach((product) => {
        let shouldUpdate = false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updates: any = {};

        if (renameType === "category" && product.category === oldValue) {
          updates.category = newValue;
          shouldUpdate = true;
        } else if (renameType === "subcategory") {
          if (selectedCategory) {
            if (
              product.category === selectedCategory &&
              product.subCategory === oldValue
            ) {
              updates.subCategory = newValue;
              shouldUpdate = true;
            }
          } else if (product.subCategory === oldValue) {
            updates.subCategory = newValue;
            shouldUpdate = true;
          }
        }

        if (shouldUpdate) {
          const productRef = doc(db, "products", product.id);
          batch.update(productRef, updates);

          // Update local state
          const index = updatedProducts.findIndex((p) => p.id === product.id);
          if (index !== -1) {
            updatedProducts[index] = { ...updatedProducts[index], ...updates };
          }
        }
      });

      await batch.commit();
      onSave(updatedProducts);
      alert(
        `Successfully renamed ${affectedCount} product${affectedCount !== 1 ? "s" : ""}!`
      );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Error in bulk rename:", error);
      alert("Failed to rename: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 w-[350px] shadow-[0px_0px_4px_1px_rgba(0,0,0,0.25)] mb-5 ">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Bulk Rename</h2>

      {/* Rename Type Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          What to rename:
        </label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="category"
              checked={renameType === "category"}
              onChange={(e) => {
                setRenameType(e.target.value as "category");
                setOldValue("");
                setNewValue("");
                setSelectedCategory("");
              }}
              className="mr-2"
            />
            Category
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="subcategory"
              checked={renameType === "subcategory"}
              onChange={(e) => {
                setRenameType(e.target.value as "subcategory");
                setOldValue("");
                setNewValue("");
                setSelectedCategory("");
              }}
              className="mr-2"
            />
            Subcategory
          </label>
        </div>
      </div>

      {/* Category Selection (for subcategory rename) */}
      {renameType === "subcategory" && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Category (optional):
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setOldValue("");
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(13,82,87)]"
          >
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Old Value Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Current {renameType}:
        </label>
        <select
          value={oldValue}
          onChange={(e) => setOldValue(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(13,82,87)]"
        >
          <option value="">Select {renameType}</option>
          {renameType === "category"
            ? categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))
            : (selectedCategory ? subcategoriesForCategory : subcategories).map(
                (subCat) => (
                  <option key={subCat} value={subCat}>
                    {subCat}
                  </option>
                )
              )}
        </select>
      </div>

      {/* New Value Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          New {renameType} name:
        </label>
        <input
          type="text"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder={`Enter new ${renameType} name`}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(13,82,87)]"
        />
      </div>

      {/* Preview */}
      {oldValue && newValue && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Preview:</strong> {getAffectedCount()} product
            {getAffectedCount() !== 1 ? "s" : ""} will be updated
          </p>
          <p className="text-xs text-blue-600 mt-1">
            {`${oldValue} → ${newValue}`}
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
          onClick={handleBulkRename}
          disabled={!oldValue || !newValue || isProcessing}
          className="px-4 py-2 bg-[rgb(13,82,87)] text-white rounded-lg font-semibold hover:bg-[rgb(10,65,69)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? "Processing..." : "Rename"}
        </button>
      </div>
    </div>
  );
}