"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  query as fsQuery,
  where,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase/firebaseInit";
import ProductCard from "./ProductCard";
import ProductLocatorDropdown from "./ProductLocatorDropdown";

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

// ---------- helpers ----------
const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

const CATEGORY_PRIORITY = [
  "untreated pine",
  "treated pine",
  "fencing",
  "sleepers",
  "offcuts",
  "yellowtongue",
  "post",
  "poles",
  "decking",
  "cement sheets",
  "plaster",
];

function categoryRank(name: string): number {
  const n = (name || "").toLowerCase();

  // First check for exact matches
  const exactIndex = CATEGORY_PRIORITY.indexOf(n);
  if (exactIndex !== -1) return exactIndex;

  // Then check for partial matches
  for (let i = 0; i < CATEGORY_PRIORITY.length; i++) {
    if (n.includes(CATEGORY_PRIORITY[i])) return i;
  }

  return Number.POSITIVE_INFINITY;
}

function lengthToMM(raw: string): number {
  if (!raw) return Number.POSITIVE_INFINITY;
  const s = raw.toLowerCase().replace(/\s+/g, "");
  const m = s.match(/(\d*\.?\d+)/);
  if (!m) return Number.POSITIVE_INFINITY;
  const num = parseFloat(m[1]);
  if (Number.isNaN(num)) return Number.POSITIVE_INFINITY;
  if (s.includes("mm")) return num;
  if (s.includes("m")) return Math.round(num * 1000);
  if (Number.isInteger(num) && num >= 100) return num;
  return Math.round(num * 1000);
}

function sortLengths(a: string, b: string) {
  const da = lengthToMM(a);
  const db = lengthToMM(b);
  if (da !== db) return da - db;
  return collator.compare(a, b);
}

function looksNumericish(v: string) {
  return /\d/.test(v || "");
}

export default function CategoryFilter() {
  // All products from DB - fetched once
  const [allProducts, setAllProducts] = useState<ProductInterface[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("");
  const [selectedLength, setSelectedLength] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Fetch all products once on mount
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const snap = await getDocs(collection(db, "products"));
        const products = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<ProductInterface, "id">),
        }));
        setAllProducts(products);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Derive categories from all products
  const categories = useMemo(() => {
    const byCat: Record<string, Record<string, number>> = {};

    allProducts.forEach((p) => {
      const cat = p.category || "";
      const sub = p.subCategory || "";
      if (!cat) return;

      byCat[cat] ||= {};
      if (sub) byCat[cat][sub] = (byCat[cat][sub] || 0) + 1;
    });

    const arr: CategoryInterface[] = Object.entries(byCat)
      .map(([categoryName, subcatCounts]) => {
        const total = Object.values(subcatCounts).reduce((a, b) => a + b, 0);
        const entries = Object.entries(subcatCounts);
        const numericish = entries.every(([name]) => looksNumericish(name));

        const subCategories = entries
          .sort((a, b) => {
            if (numericish) return collator.compare(a[0], b[0]);
            if (b[1] !== a[1]) return b[1] - a[1];
            return collator.compare(a[0], b[0]);
          })
          .map(([subcat]) => subcat);

        return { name: categoryName, subCategories, total };
      })
      .sort((a, b) => {
        const ra = categoryRank(a.name || "");
        const rb = categoryRank(b.name || "");
        if (ra !== rb) return ra - rb;
        return collator.compare(a.name || "", b.name || "");
      });

    return arr;
  }, [allProducts]);

  // Derive available subcategories based on selected category
  const availableSubcats = useMemo(() => {
    if (!selectedCategory) return [];

    const cat = categories.find((c) => c.name === selectedCategory);
    // Don't re-sort - use the order from categories memo
    return cat?.subCategories ?? [];
  }, [selectedCategory, categories]);

  // Derive available lengths based on selected category and subcategory
  const availableLengths = useMemo(() => {
    if (!selectedCategory || !selectedSubCategory) return [];

    const lengths = allProducts
      .filter(
        (p) =>
          p.category === selectedCategory &&
          p.subCategory === selectedSubCategory
      )
      .map((p) => String(p.Length || ""));

    const unique = Array.from(new Set(lengths));
    unique.sort(sortLengths);
    return unique;
  }, [selectedCategory, selectedSubCategory, allProducts]);

  // Filter products based on selections AND search query
  const filteredProducts = useMemo(() => {
    const searchLower = searchQuery.toLowerCase().trim();

    return allProducts
      .filter((p) => {
        // Apply category filters only if not searching
        if (!searchQuery) {
          if (selectedCategory && p.category !== selectedCategory) return false;
          if (selectedSubCategory && p.subCategory !== selectedSubCategory)
            return false;
          if (selectedLength && p.Length !== selectedLength) return false;
          return true;
        }

        // Apply search filter
        if (searchLower) {
          const matchesSearch =
            (p.category || "").toLowerCase().includes(searchLower) ||
            (p.subCategory || "").toLowerCase().includes(searchLower) ||
            (p.Desc || "").toLowerCase().includes(searchLower) ||
            (p.Extra || "").toLowerCase().includes(searchLower) ||
            (p.productIN || "").toLowerCase().includes(searchLower) ||
            (p.Length || "").toLowerCase().includes(searchLower) ||
            (p.LengthCoveragePackaging || "")
              .toLowerCase()
              .includes(searchLower);

          return matchesSearch;
        }

        return true;
      })
      .sort((a, b) => sortLengths(a.Length, b.Length));
  }, [
    allProducts,
    selectedCategory,
    selectedSubCategory,
    selectedLength,
    searchQuery,
  ]);

  // Reset subcategory when category changes
  useEffect(() => {
    if (!selectedCategory) {
      setSelectedSubCategory("");
      setSelectedLength("");
      return;
    }

    // Auto-select if only one subcategory
    if (availableSubcats.length === 1) {
      setSelectedSubCategory(availableSubcats[0]);
    } else if (!availableSubcats.includes(selectedSubCategory)) {
      setSelectedSubCategory("");
      setSelectedLength("");
    }
  }, [selectedCategory, availableSubcats, selectedSubCategory]);

  // Reset length when subcategory changes
  useEffect(() => {
    if (!selectedSubCategory) {
      setSelectedLength("");
      return;
    }

    if (!availableLengths.includes(selectedLength)) {
      setSelectedLength("");
    }
  }, [selectedSubCategory, availableLengths, selectedLength]);

  // Clear category filters when searching
  useEffect(() => {
    if (searchQuery) {
      setSelectedCategory("");
      setSelectedSubCategory("");
      setSelectedLength("");
    }
  }, [searchQuery]);

  // Delete product by productIN
  const deleteProductByIN = async (productIN: string) => {
    try {
      const q = fsQuery(
        collection(db, "products"),
        where("productIN", "==", productIN)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        console.warn("No products found with productIN:", productIN);
        return;
      }

      await Promise.all(
        snapshot.docs.map((snap) => deleteDoc(doc(db, "products", snap.id)))
      );

      // Update local state
      setAllProducts((prev) => prev.filter((p) => p.productIN !== productIN));
    } catch (err) {
      console.error("Error deleting products:", err);
    }
  };

  const editProductByID = (productID: string) => {
    window.location.href = `/products/${productID}/edit`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-500">Loading products...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <ProductLocatorDropdown
        categories={categories}
        availableSubcats={availableSubcats}
        selectedCategory={selectedCategory}
        selectedSubCategory={selectedSubCategory}
        selectedLength={selectedLength}
        onCategoryChange={setSelectedCategory}
        onSubCategoryChange={setSelectedSubCategory}
        onLengthChange={setSelectedLength}
        availableLengths={availableLengths}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="w-full flex justify-center">
        <div className="flex flex-wrap gap-4 justify-center max-w-[300px]">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((p) => (
              <ProductCard
                key={p.id}
                p={p}
                onDelete={() => deleteProductByIN(p.productIN)}
                onEdit={() => editProductByID(p.id)}
              />
            ))
          ) : (
            <p className="col-span-full text-center text-gray-500">
              No products match your filters.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}