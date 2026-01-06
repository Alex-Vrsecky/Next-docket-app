"use client";

import React, { useState, useEffect } from "react";
import Barcode from "react-barcode";
import { useCategories } from "@/app/context/CategoriesContext";

interface ProductInterface {
  Desc: string;
  Extra: string;
  LengthCoveragePackaging: string;
  category: string;
  id: string;
  imageSrc: string;
  priceWithNote: string;
  productIN: string;
  subCategory: string;
  Length: string;
}

interface ProductAdjustCardProps {
  p: ProductInterface | null;
  onSave: (updatedProduct: ProductInterface) => void;
  onCancel: () => void;
  isAdding?: boolean;
}

const DEFAULT_PRODUCT: ProductInterface = {
  Desc: "",
  Extra: "",
  LengthCoveragePackaging: "",
  category: "",
  id: "",
  imageSrc: "",
  priceWithNote: "",
  productIN: "",
  subCategory: "",
  Length: "",
};

export default function ProductAdjustCard({
  p,
  onSave,
  onCancel,
  isAdding = false,
}: ProductAdjustCardProps) {
  const [formData, setFormData] = useState<ProductInterface>(
    p ? { ...p } : DEFAULT_PRODUCT
  );
  const { categoryNames, categories } = useCategories();

  // State for category-subcategory mapping
  const [categorySubCategoryMap, setCategorySubCategoryMap] = useState<
    Map<string, Set<string>>
  >(new Map());

  // State for showing new input fields
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [showNewSubCategory, setShowNewSubCategory] = useState(false);

  // Build category map from context categories
  useEffect(() => {
    const categoryMap = new Map<string, Set<string>>();
    categories.forEach((cat) => {
      if (cat.name) {
        categoryMap.set(
          cat.name,
          new Set(cat.subCategories || [])
        );
      }
    });
    setCategorySubCategoryMap(categoryMap);
  }, [categories]);

  // Update form data when p prop changes
  useEffect(() => {
    if (p) {
      setFormData({ ...p });
      setShowNewCategory(false);
      setShowNewSubCategory(false);
    } else if (isAdding) {
      setFormData(DEFAULT_PRODUCT);
      setShowNewCategory(false);
      setShowNewSubCategory(false);
    }
  }, [p, isAdding]);

  // Get filtered subcategories based on selected category
  const getFilteredSubCategories = (): string[] => {
    if (!formData.category) return [];
    const subCats = categorySubCategoryMap.get(formData.category);
    return subCats ? Array.from(subCats).sort() : [];
  };

  const handleChange = (field: keyof ProductInterface, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "__new__") {
      setShowNewCategory(true);
      setFormData((prev) => ({ ...prev, category: "", subCategory: "" }));
    } else {
      setShowNewCategory(false);
      setFormData((prev) => ({ ...prev, category: value, subCategory: "" }));
    }
  };

  const handleSubCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "__new__") {
      setShowNewSubCategory(true);
      setFormData((prev) => ({ ...prev, subCategory: "" }));
    } else {
      setShowNewSubCategory(false);
      setFormData((prev) => ({ ...prev, subCategory: value }));
    }
  };

  const handleSave = () => {
    onSave(formData);
  };

  const filteredSubCategories = getFilteredSubCategories();

  return (
    <div className="flex flex-col w-full max-w-[350px] bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">
        {isAdding ? "Add New Product" : "Adjust Product Details"}
      </h2>

      {/* Two-column grid for inputs */}
      <div className="grid grid-cols-1 gap-4 mb-6">
        {/* Category */}
        <div className={"md:col-span-2"}>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Category
          </label>
          {!showNewCategory ? (
            <select
              value={formData.category}
              onChange={handleCategoryChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(13,82,87)] focus:border-transparent bg-white"
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
                value={formData.category}
                onChange={(e) => handleChange("category", e.target.value)}
                placeholder="Enter new category"
                className="flex-1 px-3 py-2 text-sm border-2 border-green-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                autoFocus
              />
              <button
                onClick={() => {
                  setShowNewCategory(false);
                  setShowNewSubCategory(false);
                  setFormData((prev) => ({
                    ...prev,
                    category: p?.category || "",
                    subCategory: p?.subCategory || "",
                  }));
                }}
                className="px-3 py-2 text-xs bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                title="Cancel new category"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Subcategory */}
        <div className={"md:col-span-2"}>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Subcategory
          </label>
          {!showNewSubCategory ? (
            <select
              value={formData.subCategory}
              onChange={handleSubCategoryChange}
              disabled={!formData.category}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(13,82,87)] focus:border-transparent bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {formData.category
                  ? "Select a subcategory"
                  : "Select a category first"}
              </option>
              {formData.category && (
                <option
                  value="__new__"
                  className="font-semibold text-green-700"
                >
                  + Add New Subcategory
                </option>
              )}
              {filteredSubCategories.map((subCat) => (
                <option key={subCat} value={subCat}>
                  {subCat}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.subCategory}
                onChange={(e) => handleChange("subCategory", e.target.value)}
                placeholder="Enter new subcategory"
                className="flex-1 px-3 py-2 text-sm border-2 border-green-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                autoFocus
              />
              <button
                onClick={() => {
                  setShowNewSubCategory(false);
                  if (!showNewCategory) {
                    setFormData((prev) => ({
                      ...prev,
                      subCategory: p?.subCategory || "",
                    }));
                  }
                }}
                className="px-3 py-2 text-xs bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                title="Cancel new subcategory"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Description
          </label>
          <input
            type="text"
            value={formData.Desc}
            onChange={(e) => handleChange("Desc", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(13,82,87)] focus:border-transparent"
          />
        </div>

        {/* Product IN */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Product IN
          </label>
          <input
            type="text"
            value={formData.productIN}
            onChange={(e) => handleChange("productIN", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(13,82,87)] focus:border-transparent"
          />
        </div>

        {/* Length */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Length
          </label>
          <input
            type="text"
            value={formData.Length}
            onChange={(e) => handleChange("Length", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(13,82,87)] focus:border-transparent"
          />
        </div>
      </div>

      {/* Preview Section */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Preview</h3>
        <div className="relative w-80 h-28 mx-auto">
          <div className="w-full h-full bg-white rounded-lg shadow-[0px_0px_4px_1px_rgba(0,0,0,0.25)] overflow-hidden">
            {/* Left section */}
            <div className="absolute left-4 top-3 flex flex-col gap-0.5 max-w-[140px]">
              <p className="text-black text-[10px] font-normal font-inter break-words">
                {formData.category || "Category"}
              </p>
              <p className="text-black text-xs font-extrabold font-inter break-words">
                {formData.Desc || "—"}
              </p>
              <h3 className="text-black text-xs font-medium font-inter leading-tight break-words">
                {formData.subCategory || "—"}
              </h3>
              <p className="text-black text-[10px] font-bold font-inter mt-0.5 break-words">
                IN: {formData.productIN || "0000000"}
              </p>
            </div>

            {/* Barcode */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-[180px] h-16 flex items-center justify-end mr-3">
                <Barcode
                  value={formData.productIN || "0000000"}
                  height={40}
                  width={1.3}
                  fontSize={8}
                  background="transparent"
                  lineColor="#111827"
                  margin={0}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between gap-3">
        <button
          onClick={onCancel}
          className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-[rgb(13,82,87)] text-white rounded-lg font-semibold hover:bg-[rgb(10,65,69)] transition-colors"
        >
          {isAdding ? "Add Product" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
