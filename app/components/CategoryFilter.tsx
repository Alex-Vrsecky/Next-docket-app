"use client";

import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebaseInit";
import CategoryDropdown from "./CategoryDropdown";
import ProductCard from "./ProductCard";

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

interface CategoryInterface {
  name?: string;
  subCategories?: string[];
  total?: number;
}

export default function CategoryFilter() {
  const [categories, setCategories] = useState<CategoryInterface[]>([]);
  const [products, setProducts] = useState<ProductInterface[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [availableSubcats, setAvailableSubcats] = useState<string[]>([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("");
  const [selectedLength, setSelectedLength] = useState<string>(""); // Change to array to handle multiple lengths
  const [availableLengths, setAvailableLengths] = useState<string[]>([]);

  useEffect(() => {
    async function fetchProducts() {
      const prodSnap = await getDocs(collection(db, "products"));
      const allProducts = prodSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ProductInterface, "id">),
      }));

      setProducts(allProducts);

      // Set up categories with their subcategories
      const categoryMap: Record<string, Record<string, number>> = {};

      for (const p of allProducts) {
        if (!categoryMap[p.category]) {
          categoryMap[p.category] = {};
        }
        if (p.subCategory) {
          categoryMap[p.category][p.subCategory] =
            (categoryMap[p.category][p.subCategory] || 0) + 1;
        }
      }

      const MIN_PRODUCTS_PER_CATEGORY = 1;

      const filteredCategoryArray: CategoryInterface[] = Object.entries(
        categoryMap
      )
        .map(([categoryName, subcatCounts]) => {
          const total = Object.values(subcatCounts).reduce((a, b) => a + b, 0);
          return {
            name: categoryName,
            subCategories: Object.entries(subcatCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([subcat]) => subcat),
            total,
          };
        })
        .filter((c) => c.total >= MIN_PRODUCTS_PER_CATEGORY)
        .sort((a, b) => b.total - a.total); // Sort by popularity
      // Remove `.total` before setting state
      setCategories(filteredCategoryArray.map((rest) => ({ ...rest })));
    }

    fetchProducts();
  }, []);

  useEffect(() => {
    if (!selectedCategory) {
      setAvailableSubcats([]);
      setSelectedSubCategory("");
      return;
    }

    const cat = categories.find((c) => c.name === selectedCategory);
    const subcats = cat?.subCategories ?? [];

    setAvailableSubcats(subcats);

    // Auto-select if there's only one
    if (subcats.length === 1) {
      setSelectedSubCategory(subcats[0]);
    } else {
      setSelectedSubCategory("");
    }
  }, [selectedCategory, categories]);

  // Whenever the category or subcategory changes, filter products and derive available lengths
  useEffect(() => {
    if (selectedCategory && selectedSubCategory) {
      // Filter products based on selected category and subcategory
      const filteredProducts = products.filter(
        (p) =>
          p.category === selectedCategory &&
          p.subCategory === selectedSubCategory
      );

      // Get unique lengths from the filtered products
      const uniqueLengths = Array.from(
        new Set(filteredProducts.map((p) => p.Length))
      ).map(String);
      setAvailableLengths(uniqueLengths);
    } else {
      // Reset available lengths if no category or subcategory is selected
      setAvailableLengths([]);
      setSelectedLength(""); // Reset selected length
    }
  }, [selectedCategory, selectedSubCategory, products, selectedLength.length]);

  // Apply filters: category, subcategory, and length
  // Apply filters: category, subcategory, and length
  const filtered = products.filter((p) => {
    if (selectedCategory && p.category !== selectedCategory) return false;
    if (selectedSubCategory && p.subCategory !== selectedSubCategory)
      return false;
    // only show when it matches exactly (or when "All Lengths" aka empty string)
    if (selectedLength && p.Length !== selectedLength) return false;
    return true;
  });

  return (
    <div className="space-y-4 ">
      <CategoryDropdown
        categories={categories}
        availableSubcats={availableSubcats}
        selectedCategory={selectedCategory}
        selectedSubCategory={selectedSubCategory}
        selectedLength={selectedLength}
        onCategoryChange={setSelectedCategory}
        onSubCategoryChange={setSelectedSubCategory}
        onLengthChange={setSelectedLength}
        availableLengths={availableLengths}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mx-auto">
        {filtered.length > 0 ? (
          filtered.map((p) => (
            <ProductCard
              key={p.id}
              p={p}
              onDelete={(id) =>
                setProducts((prev) => prev.filter((item) => item.id !== id))
              }
            />
          ))
        ) : (
          <p className="text-gray-500">No products match your filters.</p>
        )}
      </div>
    </div>
  );
}
