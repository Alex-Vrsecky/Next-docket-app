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

// ---------- helpers ----------
const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

// your preferred category order (case-insensitive, partial-match friendly)
const CATEGORY_PRIORITY = [
  "treated",
  "untreated",
  "all fencing",
  "fencing",
  "all sleepers",
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
  for (let i = 0; i < CATEGORY_PRIORITY.length; i++) {
    if (n.includes(CATEGORY_PRIORITY[i])) return i;
  }
  return Number.POSITIVE_INFINITY; // goes after ranked items
}

// Try to turn a length like "2.4m", "2400mm", "2400", "2.7 m H3" into a comparable number (millimetres)
function lengthToMM(raw: string): number {
  if (!raw) return Number.POSITIVE_INFINITY;
  const s = raw.toLowerCase().replace(/\s+/g, "");
  // grab the first number (int or decimal)
  const m = s.match(/(\d*\.?\d+)/);
  if (!m) return Number.POSITIVE_INFINITY;
  const num = parseFloat(m[1]);
  if (Number.isNaN(num)) return Number.POSITIVE_INFINITY;

  if (s.includes("mm")) return num; // already mm
  if (s.includes("m")) return Math.round(num * 1000); // metres -> mm

  // No units:
  // heuristic: integers >= 100 are probably millimetres; decimals are metres
  if (Number.isInteger(num) && num >= 100) return num;
  return Math.round(num * 1000);
}

function sortLengths(a: string, b: string) {
  const da = lengthToMM(a);
  const db = lengthToMM(b);
  if (da !== db) return da - db;
  return collator.compare(a, b); // tie-breaker
}

function looksNumericish(v: string) {
  return /\d/.test(v || "");
}

export default function CategoryFilter() {
  const [categories, setCategories] = useState<CategoryInterface[]>([]);
  const [products, setProducts] = useState<ProductInterface[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [availableSubcats, setAvailableSubcats] = useState<string[]>([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("");
  const [selectedLength, setSelectedLength] = useState<string>("");
  const [availableLengths, setAvailableLengths] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchProducts() {
      const prodSnap = await getDocs(collection(db, "products"));
      const allProducts = prodSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ProductInterface, "id">),
      }));

      setProducts(allProducts);

      // Build category -> subcategory counts
      const categoryMap: Record<string, Record<string, number>> = {};
      for (const p of allProducts) {
        const cat = p.category || "";
        const sub = p.subCategory || "";
        if (!cat) continue;
        categoryMap[cat] ||= {};
        if (sub) categoryMap[cat][sub] = (categoryMap[cat][sub] || 0) + 1;
      }

      const MIN_PRODUCTS_PER_CATEGORY = 1;

      const categoryArray: CategoryInterface[] = Object.entries(categoryMap)
        .map(([categoryName, subcatCounts]) => {
          const total = Object.values(subcatCounts).reduce((a, b) => a + b, 0);

          // Smart sort subcategories:
          // - if names look numeric (e.g., sizes), sort naturally (numeric-aware)
          // - else sort by popularity desc, then alpha
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
        .filter((c) => (c.total || 0) >= MIN_PRODUCTS_PER_CATEGORY)
        .sort((a, b) => {
          // Respect your custom category order first
          const ra = categoryRank(a.name || "");
          const rb = categoryRank(b.name || "");
          if (ra !== rb) return ra - rb;
          // Finally by alpha
          return collator.compare(a.name || "", b.name || "");
        })
        .map((rest) => rest); // drop total

      setCategories(categoryArray);
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
    const subcats = (cat?.subCategories ?? [])
      .slice()
      .sort((a, b) => collator.compare(a, b));
    setAvailableSubcats(subcats);

    // Auto-select if there's only one
    if (subcats.length === 1) {
      setSelectedSubCategory(subcats[0]);
    } else if (!subcats.includes(selectedSubCategory)) {
      setSelectedSubCategory("");
    }
  }, [selectedCategory, categories]);

  // Whenever the category or subcategory changes, filter products and derive available lengths
  useEffect(() => {
    if (selectedCategory && selectedSubCategory) {
      const filteredProducts = products.filter(
        (p) =>
          p.category === selectedCategory &&
          p.subCategory === selectedSubCategory
      );

      const uniqueLengths = Array.from(
        new Set(filteredProducts.map((p) => p.Length))
      ).map(String);
      uniqueLengths.sort(sortLengths);
      setAvailableLengths(uniqueLengths);
    } else {
      setAvailableLengths([]);
      setSelectedLength("");
    }
  }, [selectedCategory, selectedSubCategory, products]);

  const term = search.trim().toLowerCase();

  const filtered = products
    .filter((p) => !selectedCategory || p.category === selectedCategory)
    .filter(
      (p) => !selectedSubCategory || p.subCategory === selectedSubCategory
    )
    .filter((p) => !selectedLength || p.Length === selectedLength)
    // search by description
    .filter((p) => !term || (p.Desc || "").toLowerCase().includes(term));

  return (
    <div className="space-y-4 ">
      <div className="w-full max-w-[900px] mb-4 flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search description…"
          className="border rounded p-2 flex-1"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="px-3 py-2 border rounded"
            aria-label="Clear search"
          >
            Clear
          </button>
        )}
      </div>
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
          filtered
            .slice()
            // Optional: sort the visible cards by length ascending when a length is selected
            .sort((a, b) => sortLengths(a.Length, b.Length))
            .map((p) => (
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
