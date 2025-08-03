"use client";

import React, { useEffect, useState } from "react";
import {
  getDocs,
  collection,
  query,
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

  // Generate barcodes in each <svg id="barcode-INDEX" />
  useEffect(() => {
    products.forEach((prod, idx) => {
      try {
        JsBarcode(`#barcode-${idx}`, prod.productIN, {
          format: "CODE128",
          displayValue: true,
          fontSize: 14,
          height: 40,
        });
      } catch (err) {
        console.warn("Barcode failed for", prod.productIN, err);
      }
    });
  }, [products]);

  // Delete by productIN
  const deleteProductByIN = async (productIN: string) => {
    try {
      const q = query(
        collection(db, "products"),
        where("productIN", "==", productIN)
      );
      const snapshot = await getDocs(q);

      // delete all matching docs
      await Promise.all(
        snapshot.docs.map((snap) => deleteDoc(doc(db, "products", snap.id)))
      );

      // update local state
      setProducts((prev) => prev.filter((p) => p.productIN !== productIN));

      alert(`Deleted all products with IN ${productIN}.`);
    } catch (err) {
      console.error("Error deleting products:", err);
      alert("Failed to delete product(s).");
    }
  };

  return (
    <div className="flex flex-col items-center p-4">
      <Navigation />

      <h1 className="text-2xl font-bold mb-4">Current Products</h1>
      <div className="flex flex-wrap max-w-[900px]">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            p={product}
            onDelete={() => deleteProductByIN(product.productIN)}
          />
        ))}
      </div>
    </div>
  );
}
