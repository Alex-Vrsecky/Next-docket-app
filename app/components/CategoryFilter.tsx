"use client";

import { useEffect, useState } from "react";
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

  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [availableSubcats, setAvailableSubcats] = useState<string[]>([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("");

  useEffect(() => {
    async function fetchProducts() {
      const prodSnap = await getDocs(collection(db, "products"));
      const allProducts = prodSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ProductInterface, "id">),
      }));

      setProducts(allProducts);

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

      const MIN_PRODUCTS_PER_CATEGORY = 5;

      const filteredCategoryArray: CategoryInterface[] = Object.entries(
        categoryMap
      )
        .filter(([_, subcatCounts]) => {
          const total = Object.values(subcatCounts).reduce((a, b) => a + b, 0);
          return total >= MIN_PRODUCTS_PER_CATEGORY;
        })
        .map(([categoryName, subcatCounts]) => ({
          name: categoryName,
          subCategories: Object.entries(subcatCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([subcat]) => subcat),
        }));

      setCategories(
        filteredCategoryArray.sort((a, b) => a.name!.localeCompare(b.name!))
      );
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
          <p className="text-gray-500">No products match.</p>
        )}
      </div>
    </div>
  );
}
