"use client";

import React from "react";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/app/firebase/firebaseInit";

interface CategoryCardProps {
  category: string;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const handleDeleteCategory = async () => {
    try {
      // 1. Get category document
      const categoryQuery = query(
        collection(db, "categories"),
        where("name", "==", category)
      );
      const categorySnapshot = await getDocs(categoryQuery);

      if (categorySnapshot.empty) {
        console.error("Category not found");
        return;
      }

      const categoryDoc = categorySnapshot.docs[0];

      // 2. Delete sub-categories linked to the category
      const subCategoryQuery = query(
        collection(db, "sub-categories"),
        where("categories", "==", category)
      );
      const subCategorySnapshot = await getDocs(subCategoryQuery);
      const deleteSubCategoryPromises = subCategorySnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );
      await Promise.all(deleteSubCategoryPromises);
      console.log("Sub-categories deleted");

      // 3. Delete products linked to the category
      const productQuery = query(
        collection(db, "products"),
        where("category", "==", category)
      );
      const productSnapshot = await getDocs(productQuery);
      const deleteProductPromises = productSnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );
      await Promise.all(deleteProductPromises);
      console.log("Products deleted");

      // 4. Delete the category document
      await deleteDoc(categoryDoc.ref);
      console.log("Category deleted");

      window.location.reload(); // Or trigger state update
    } catch (e) {
      console.error("Failed to delete category and associated data", e);
    }
  };

  return (
    <div className="p-4 m-4 border rounded max-w-[350px]">
      <h1 className="font-bold text-md">{category}</h1>
      <button
        onClick={handleDeleteCategory}
        className="mt-1 px-3 py-1 bg-red-200 hover:bg-red-500 text-white text-xs rounded"
      >
        Delete Category, Sub-categories & Products
      </button>
    </div>
  );
}
