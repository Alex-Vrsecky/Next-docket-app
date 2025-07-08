"use client";

import React from "react";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  arrayRemove,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase/firebaseInit";

interface SubCategoryCardProps {
  category: string;
  subCategory: string;
}

export default function SubCategoryCard({
  category,
  subCategory,
}: SubCategoryCardProps) {
  const handleDeleteSubCategory = async () => {
    try {
      // 1. Remove subCategory from category document
      const categoryQuery = query(
        collection(db, "categories"),
        where("name", "==", category)
      );
      const categorySnapshot = await getDocs(categoryQuery);

      if (categorySnapshot.empty) {
        console.error("Category not found");
        return;
      }

      const categoryDocRef = categorySnapshot.docs[0].ref;

      await updateDoc(categoryDocRef, {
        subCategories: arrayRemove(subCategory),
      });
      console.log("Sub-category removed from category");

      // 2. Delete all products under that sub-category
      const productQuery = query(
        collection(db, "products"),
        where("category", "==", category),
        where("subCategory", "==", subCategory)
      );
      const productSnapshot = await getDocs(productQuery);

      const deletePromises = productSnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );
      await Promise.all(deletePromises);
      console.log("Products under sub-category deleted");

      window.location.reload();
    } catch (e) {
      console.error("Failed to remove sub-category and related products", e);
    }
  };

  return (
    <div className="p-4 m-4 border rounded max-w-[350px]">
      <h1 className="font-bold text-lg">Sub-category: {subCategory}</h1>
      <p className="text-sm text-gray-600">From category: {category}</p>
      <button
        onClick={handleDeleteSubCategory}
        className="mt-2 px-3 py-1 bg-red-600 text-white rounded"
      >
        Remove Sub-category & Products
      </button>
    </div>
  );
}
