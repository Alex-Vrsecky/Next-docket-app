// app/components/CategoryFilter.tsx
"use client";

import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebaseInit";
import CategorySort from "./CategorySort";
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
}
interface CategoryInterface {
  name?: string;
  subCategories?: string[];
}

export default function CategoryFilter() {
  const [categories, setCategories] = useState<CategoryInterface[]>([]);
  const [products, setProducts] = useState<ProductInterface[]>([]);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // selections
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [availableSubcats, setAvailableSubcats] = useState<string[]>([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("");

  // fetch categories and products once
  useEffect(() => {
    async function fetchData() {
      const catSnap = await getDocs(collection(db, "categories"));
      const cats = catSnap.docs.map((d) => ({
        name: d.data().name as string,
        subCategories: d.data().subCategories as string[],
      }));
      setCategories(cats);

      const prodSnap = await getDocs(collection(db, "products"));
      setProducts(
        prodSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<ProductInterface, "id">),
        }))
      );
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedCategory) {
      setAvailableSubcats([]);
      setSelectedSubCategory("");
      return;
    }
    const cat = categories.find((c) => c.name === selectedCategory);
    setAvailableSubcats(cat?.subCategories ?? []);
    setSelectedSubCategory("");
  }, [selectedCategory, categories]);

  const filtered = products.filter((p) => {
    if (selectedCategory && p.category !== selectedCategory) return false;
    if (selectedSubCategory && p.subCategory !== selectedSubCategory)
      return false;
    return true;
  });

  return (
    <div className="space-y-4 p-4">
      <CategorySort sortOrder={sortOrder} onChange={setSortOrder} />
      <CategoryDropdown
        categories={categories}
        availableSubcats={availableSubcats}
        selectedCategory={selectedCategory}
        selectedSubCategory={selectedSubCategory}
        onCategoryChange={setSelectedCategory}
        onSubCategoryChange={setSelectedSubCategory}
        sortOrder={sortOrder}
      />
      <div className="grid grid-cols-2 gap-4 max-w-md">
        {filtered.length > 0 ? (
          filtered.map((p) => <ProductCard key={p.id} p={p} />)
        ) : (
          <p className="text-gray-500">No products match.</p>
        )}
      </div>
    </div>
  );
}
