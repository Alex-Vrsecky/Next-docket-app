"use client";
import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import Button from "../components/Button";
import { db } from "../firebase/firebaseInit";

export default function AddSubCategory() {
  const [categorySubName, setCategorySubName] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<string[]>([]);

  async function firebaseAddSubCategory() {
    if (!categorySubName.trim()) {
      setError("Sub-category name is required");
      return;
    }

    try {
      // Find the category document
      const categoryQuery = query(
        collection(db, "categories"),
        where("name", "==", category)
      );
      const snapshot = await getDocs(categoryQuery);

      if (snapshot.empty) {
        setError("Selected category not found");
        return;
      }

      const categoryDoc = snapshot.docs[0];
      const currentSubCategories = categoryDoc.data().subCategories || [];

      // Check if sub-category already exists
      if (currentSubCategories.includes(categorySubName.trim())) {
        setError("Sub-category already exists in this category");
        return;
      }

      // Add the sub-category to the array
      await updateDoc(categoryDoc.ref, {
        subCategories: arrayUnion(categorySubName.trim()),
      });

      console.log("Sub-category added");
      setCategorySubName("");
      setError("");
      window.location.reload();
    } catch (e) {
      console.error("Error adding sub-category: ", e);
      setError("Failed to add sub-category");
    }
  }

  useEffect(() => {
    async function fetchCategories() {
      const snapshot = await getDocs(collection(db, "categories"));
      const categoryNames = snapshot.docs.map((doc) => doc.data().name);
      setCategories(categoryNames);
      if (categoryNames.length > 0) setCategory(categoryNames[0]);
    }

    fetchCategories();
  }, []);

  return (
    <div>
      <h1 className="border-b-1 font-bold">Add Sub Category</h1>
      <form
        id="add-sub-category-form"
        onSubmit={(e) => {
          e.preventDefault();
          firebaseAddSubCategory();
        }}
      >
        <label>
          Category
          <select
            value={category}
            onChange={(e) => setCategory(e.currentTarget.value)}
            name="category"
            id="category"
            className="border p-1 rounded"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </label>

        <label>
          Sub Category Name
          <input
            type="text"
            name="subCategoryName"
            value={categorySubName}
            onChange={(e) => setCategorySubName(e.currentTarget.value)}
            className="border p-1 rounded"
          />
        </label>

        {error && <p className="text-red-500">{error}</p>}

        <Button form="add-sub-category-form" type="submit">
          Add Sub Category
        </Button>
      </form>
    </div>
  );
}
