"use client";

import React, { useState, useMemo } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/app/firebase/firebaseInit";
import { ProductInterface } from "@/app/_types/productInterface";
import { useCategories } from "@/app/context/CategoriesContext";

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (products: ProductInterface[]) => void;
}

interface BulkProductForm {
  category: string;
  subCategory: string;
  description: string;
  extra: string;
  lengths: string; // Comma-separated lengths
  inNumbers: string; // Comma-separated IN numbers
}

/**
 * Bulk import modal for products with same description but different lengths
 * Useful for quickly adding multiple length variations of the same product
 */
export function BulkImportModal({
  isOpen,
  onClose,
  onSuccess,
}: BulkImportModalProps) {
  const [formData, setFormData] = useState<BulkProductForm>({
    category: "",
    subCategory: "",
    description: "",
    extra: "",
    lengths: "",
    inNumbers: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [showNewSubCategory, setShowNewSubCategory] = useState(false);

  const { categoryNames, categories } = useCategories();

  const categorySubCategoryMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    categories.forEach((cat) => {
      if (cat.name) {
        map.set(cat.name, new Set(cat.subCategories || []));
      }
    });
    return map;
  }, [categories]);

  const getFilteredSubCategories = (): string[] => {
    if (!formData.category) return [];
    const subCats = categorySubCategoryMap.get(formData.category);
    return subCats ? Array.from(subCats).sort() : [];
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "__new__") {
      setShowNewCategory(true);
      setFormData((prev) => ({
        ...prev,
        category: "",
        subCategory: "",
      }));
    } else {
      setShowNewCategory(false);
      setFormData((prev) => ({
        ...prev,
        category: value,
        subCategory: "",
      }));
    }
  };

  const handleSubCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "__new__") {
      setShowNewSubCategory(true);
      setFormData((prev) => ({
        ...prev,
        subCategory: "",
      }));
    } else {
      setShowNewSubCategory(false);
      setFormData((prev) => ({
        ...prev,
        subCategory: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Validation
    if (
      !formData.category ||
      !formData.subCategory ||
      !formData.description ||
      !formData.lengths ||
      !formData.inNumbers
    ) {
      setError("Please fill in all required fields");
      return;
    }

    // Parse lengths
    const lengths = formData.lengths
      .split(",")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lengths.length === 0) {
      setError("Please enter at least one length");
      return;
    }

    // Parse IN numbers (required)
    const inNumbers = formData.inNumbers
      .split(",")
      .map((i) => i.trim())
      .filter((i) => i.length > 0);

    // Validate IN numbers match lengths
    if (inNumbers.length !== lengths.length) {
      setError(
        `Number of IN numbers (${inNumbers.length}) must match number of lengths (${lengths.length})`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const productsRef = collection(db, "products");
      const createdProducts: ProductInterface[] = [];

      // Create a product for each length
      for (let idx = 0; idx < lengths.length; idx++) {
        const length = lengths[idx];
        const productIN = inNumbers[idx];

        const productData = {
          category: formData.category,
          subCategory: formData.subCategory,
          Desc: formData.description,
          Extra: formData.extra,
          Length: length,
          productIN: productIN,
          imageSrc: "",
          LengthCoveragePackaging: "",
          createdAt: serverTimestamp(),
        };

        const docRef = await addDoc(productsRef, productData);

        createdProducts.push({
          ...productData,
          id: docRef.id,
        } as ProductInterface);
      }

      setSuccessMessage(`✓ Created ${createdProducts.length} products!`);
      onSuccess(createdProducts);

      // Reset form
      setFormData({
        category: "",
        subCategory: "",
        description: "",
        extra: "",
        lengths: "",
        inNumbers: "",
      });

      // Close after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error("Error creating products:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create products"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              Bulk Import Products
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ✕
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Category *
              </label>
              {!showNewCategory ? (
                <select
                  value={formData.category}
                  onChange={handleCategoryChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                >
                  <option value="">Select a category</option>
                  <option
                    value="__new__"
                    className="font-semibold text-green-700"
                  >
                    + Add New Category
                  </option>
                  {categoryNames.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    placeholder="Enter new category"
                    className="flex-1 px-3 py-2 text-sm border-2 border-green-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewCategory(false);
                      setShowNewSubCategory(false);
                      setFormData((prev) => ({
                        ...prev,
                        category: "",
                        subCategory: "",
                      }));
                    }}
                    className="px-3 py-2 text-xs bg-gray-200 hover:bg-gray-300 rounded-lg"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Subcategory */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Subcategory *
              </label>
              {!showNewSubCategory ? (
                <select
                  value={formData.subCategory}
                  onChange={handleSubCategoryChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                  disabled={!formData.category}
                >
                  <option value="">Select a subcategory</option>
                  <option
                    value="__new__"
                    className="font-semibold text-green-700"
                  >
                    + Add New Subcategory
                  </option>
                  {getFilteredSubCategories().map((subcat) => (
                    <option key={subcat} value={subcat}>
                      {subcat}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="subCategory"
                    value={formData.subCategory}
                    onChange={handleChange}
                    placeholder="Enter new subcategory"
                    className="flex-1 px-3 py-2 text-sm border-2 border-green-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewSubCategory(false);
                      setFormData((prev) => ({
                        ...prev,
                        subCategory: "",
                      }));
                    }}
                    className="px-3 py-2 text-xs bg-gray-200 hover:bg-gray-300 rounded-lg"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Description *
              </label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="e.g., Treated Pine Timber"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            {/* Lengths */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Lengths (comma-separated) *
              </label>
              <textarea
                name="lengths"
                value={formData.lengths}
                onChange={handleChange}
                placeholder="e.g., 1800mm, 2.4m, 3000mm, 3m"
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter lengths separated by commas. One product will be created
                per length.
              </p>
            </div>

            {/* IN Numbers */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                IN Numbers (comma-separated) *
              </label>
              <textarea
                name="inNumbers"
                value={formData.inNumbers}
                onChange={handleChange}
                placeholder="e.g., 1034784, 3782908, 123763, 198273"
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter custom IN numbers separated by commas. Must match the
                number of lengths.
              </p>
            </div>

            {/* Preview */}
            {formData.lengths && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-700 mb-2">
                  Preview:{" "}
                  {formData.lengths.split(",").filter((l) => l.trim()).length}{" "}
                  products will be created
                </p>
                <div className="text-xs text-gray-600 space-y-1">
                  {formData.lengths
                    .split(",")
                    .filter((l) => l.trim())
                    .map((length, idx) => (
                      <div key={idx}>
                        {formData.subCategory} {length.trim()}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 disabled:opacity-50 transition-colors text-sm"
              >
                {isSubmitting ? "Creating..." : "Create Products"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
