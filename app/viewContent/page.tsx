"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  getDocs,
  collection,
  query as fsQuery,
  where,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase/firebaseInit";
import ProductCard from "../components/ProductCard";
import Navigation from "../components/Navigation";
import JsBarcode from "jsbarcode";

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

export default function ViewContent() {
  const [products, setProducts] = useState<ProductInterface[]>([]);
  const [search, setSearch] = useState("");

  // Fetch only products
  async function fetchProducts() {
    try {
      const snapshot = await getDocs(collection(db, "products"));
      const data = snapshot.docs.map((docSnap) => ({
        ...(docSnap.data() as ProductInterface),
        id: docSnap.id,
      }));
      setProducts(data);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  // Derived: filtered products by Desc (case-insensitive)
  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter((p) => (p.Desc || "").toLowerCase().includes(term));
  }, [products, search]);

  // Generate barcodes only for currently rendered items
  useEffect(() => {
    filteredProducts.forEach((prod, idx) => {
      try {
        const el = document.querySelector(
          `#barcode-${idx}`
        ) as SVGElement | null;
        if (el) {
          JsBarcode(el, prod.productIN, {
            format: "CODE128",
            displayValue: true,
            fontSize: 14,
            height: 40,
          });
        }
      } catch (err) {
        console.warn("Barcode failed for", prod.productIN, err);
      }
    });
  }, [filteredProducts]);

  // Delete by productIN
  const deleteProductByIN = async (productIN: string) => {
    try {
      const q = fsQuery(
        collection(db, "products"),
        where("id", "==", productIN)
      );
      const snapshot = await getDocs(q);

      // delete all matching docs
      await Promise.all(
        snapshot.docs.map((snap) => deleteDoc(doc(db, "products", snap.id)))
      );

      // update local state
      setProducts((prev) => prev.filter((p) => p.productIN !== productIN));

      alert(`Deleted all products with ID ${productIN}.`);
    } catch (err) {
      console.error("Error deleting products:", err);
      alert("Failed to delete product(s).");
    }
  };

  const editProductByID = async (productIN: string) => {
    // redirect to edit page
    window.location.href = `/products/${productIN}/edit`;
  };

  return (
    <div className="flex flex-col items-center p-4">
      <Navigation />

      <h1 className="text-2xl font-bold mb-4">Current Products</h1>

      {/* Search bar */}
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
      <div className="flex flex-wrap max-w-[900px]">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            p={product}
            onDelete={() => deleteProductByIN(product.productIN)}
            onEdit={(id) => editProductByID(id)}
          />
        ))}
      </div>

      {/* Optional: empty state */}
      {filteredProducts.length === 0 && (
        <p className="text-gray-500 mt-6">
          No products match that description.
        </p>
      )}
    </div>
  );
}
