"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getDocs, collection } from "firebase/firestore";
import { db } from "../firebase/firebaseInit";
import Navigation from "../components/Navigation";
import JsBarcode from "jsbarcode";
import CategoryFilter from "../components/CategoryFilter";

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
    return products.filter((p) => (p.Desc || "").toLowerCase());
  }, [products]);

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

  return (
    <div className="flex flex-col items-center">
      <Navigation />
      <CategoryFilter />
    </div>
  );
}
