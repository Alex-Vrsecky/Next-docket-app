"use client";

import React, { useState, useMemo } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/app/firebase/firebaseInit";
import { ProductInterface } from "@/app/_types/productInterface";
import { useCategories } from "@/app/context/CategoriesContext";

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (product: ProductInterface) => void;
}

/**
 * Quick add modal for fast single product entry
 * Minimal form for quick data entry without all the details
 */
export function QuickAddModal({
  isOpen,
  onClose,
  onSuccess,
}: QuickAddModalProps) {
  const [formData, setFormData] = useState({
    category: "",
    subCategory: "",
    description: "",
    length: "",
    inNumber: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    // Validation
    if (
      !formData.category ||
      !formData.subCategory ||
      !formData.description ||
      !formData.inNumber
    ) {
      setError("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const productIN = formData.inNumber;

      const productData = {
        category: formData.category,
        subCategory: formData.subCategory,
        Desc: formData.description,
        Extra: "",
        Length: formData.length || "N/A",
        productIN: productIN,
        imageSrc: "",
        LengthCoveragePackaging: "",
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "products"), productData);

      onSuccess({
        ...productData,
        id: docRef.id,
      } as ProductInterface);

      // Reset form
      setFormData({
        category: "",
        subCategory: "",
        description: "",
        length: "",
        inNumber: "",
      });

      // Close after 1.5 seconds
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Error creating product:", err);
      setError(err instanceof Error ? err.message : "Failed to create product");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">Quick Add Product</h2>
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

          <form onSubmit={handleSubmit} className="space-y-3">
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
                  <option value="__new__" className="font-semibold text-green-700">
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
                  <option value="__new__" className="font-semibold text-green-700">
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
                placeholder="Timber"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            {/* Length (Optional) */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Length
              </label>
              <input
                type="text"
                name="length"
                value={formData.length}
                onChange={handleChange}
                placeholder="e.g., 2400mm"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            {/* IN Number (Required) */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                IN Number *
              </label>
              <input
                type="text"
                name="inNumber"
                value={formData.inNumber}
                onChange={handleChange}
                placeholder="e.g., 1042784"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

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
                {isSubmitting ? "Adding..." : "Add Product"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
