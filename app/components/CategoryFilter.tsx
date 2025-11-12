"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  getDocs,
  query as fsQuery,
  where,
  limit as fsLimit,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase/firebaseInit";
import CategoryDropdown from "./CategoryDropdown";
import ProductCard from "./ProductCard";
import { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";

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
  const [categories, setCategories] = useState<CategoryInterface[]>([]);
  const [products, setProducts] = useState<ProductInterface[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [availableSubcats, setAvailableSubcats] = useState<string[]>([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("");
  const [selectedLength, setSelectedLength] = useState<string>("");
  const [availableLengths, setAvailableLengths] = useState<string[]>([]);

  const PAGE_SIZE = 60;
  const lastVisibleRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(
    null
  );

  // 1) Build category list
  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, "products"));
      const byCat: Record<string, Record<string, number>> = {};
      snap.docs.forEach((d) => {
        const p = { id: d.id, ...(d.data() as Omit<ProductInterface, "id">) };
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

      setCategories(arr);
    })();
  }, []);

  // 2) Handle subcategories
  useEffect(
    () => {
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

      if (subcats.length === 1) {
        setSelectedSubCategory(subcats[0]);
      } else if (!subcats.includes(selectedSubCategory)) {
        setSelectedSubCategory("");
      }
    }, // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedCategory, selectedSubCategory]
  );

  // 3) Query products
  useEffect(() => {
    (async () => {
      const base = collection(db, "products");
      const clauses: import("firebase/firestore").QueryConstraint[] = [];

      if (selectedCategory)
        clauses.push(where("category", "==", selectedCategory));
      if (selectedSubCategory)
        clauses.push(where("subCategory", "==", selectedSubCategory));
      if (selectedLength) clauses.push(where("Length", "==", selectedLength));

      const q = fsQuery(base, ...clauses, fsLimit(PAGE_SIZE));
      const snap = await getDocs(q);
      lastVisibleRef.current = snap.docs[snap.docs.length - 1] || null;

      const rows = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ProductInterface, "id">),
      }));
      setProducts(rows);
    })();
  }, [selectedCategory, selectedSubCategory, selectedLength]);

  // 4) Derive lengths
  useEffect(() => {
    (async () => {
      if (!(selectedCategory && selectedSubCategory)) {
        setAvailableLengths([]);
        setSelectedLength("");
        return;
      }
      const q = fsQuery(
        collection(db, "products"),
        where("category", "==", selectedCategory),
        where("subCategory", "==", selectedSubCategory),
        fsLimit(500)
      );
      const snap = await getDocs(q);
      const unique = Array.from(
        new Set(
          snap.docs.map((d) =>
            String((d.data() as ProductInterface).Length || "")
          )
        )
      );
      unique.sort(sortLengths);
      setAvailableLengths(unique);

      if (selectedLength && !unique.includes(selectedLength)) {
        setSelectedLength("");
      }
    })();
  }, [selectedCategory, selectedSubCategory, selectedLength]);

  const filtered = useMemo(() => {
    return products
      .filter((p) => !selectedCategory || p.category === selectedCategory)
      .filter(
        (p) => !selectedSubCategory || p.subCategory === selectedSubCategory
      )
      .filter((p) => !selectedLength || p.Length === selectedLength)
      .slice()
      .sort((a, b) => sortLengths(a.Length, b.Length));
  }, [products, selectedCategory, selectedSubCategory, selectedLength]);

  // Delete by productIN
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
      setProducts((prev) => prev.filter((p) => p.productIN !== productIN));
    } catch (err) {
      console.error("Error deleting products:", err);
    }
  };

  const editProductByID = async (productINorId: string) => {
    window.location.href = `/products/${productINorId}/edit`;
  };

  return (
    <div className="space-y-4">
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

      <div className="w-full flex justify-center">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 max-w-7xl">
          {filtered.length > 0 ? (
            filtered.map((p) => (
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
