"use client";

import React from "react";
import {
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase/firebaseInit";

interface ProductCardProps {
  name: string;
  category: string;
  subCategory: string;
}

export default function ProductCard({
  name,
  category,
  subCategory,
}: ProductCardProps) {
  const handleDeleteProduct = async () => {
    try {
      const q = query(
        collection(db, "products"),
        where("name", "==", name),
        where("category", "==", category),
        where("subCategory", "==", subCategory)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        console.error("Product not found");
        return;
      }

      await deleteDoc(snapshot.docs[0].ref);
      console.log("Product deleted");
      window.location.reload();
    } catch (e) {
      console.error("Failed to delete product", e);
    }
  };

  return (
    <div className="p-4 m-4 border rounded max-w-[350px]">
      <h1 className="font-bold text-md">{name}</h1>
      <p className="text-xs">Category: {category}</p>
      <p className="text-xs">Sub-category: {subCategory}</p>
      <button
        onClick={handleDeleteProduct}
        className="mt-2 px-2 py-1 text-xs font-bold bg-red-600 text-white rounded"
      >
        Delete Product
      </button>
    </div>
  );
}
