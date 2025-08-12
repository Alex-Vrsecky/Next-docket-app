"use client";
import { useState } from "react";
import { collection, addDoc, getDocs } from "firebase/firestore";
import Button from "../components/Button";
import { db } from "../firebase/firebaseInit";

export default function AddCategory() {
  const [categoryName, setCategoryName] = useState("");
  const [error, setError] = useState("");

  async function firebaseAddCategory() {
    if (!categoryName.trim()) {
      setError("Category name is required");
      return;
    }

    try {
      // Check if category already exists
      const categoriesSnapshot = await getDocs(collection(db, "categories"));
      const existingCategoryNames = categoriesSnapshot.docs.map((doc) =>
        doc.data().name?.toLowerCase().trim()
      );

      if (existingCategoryNames.includes(categoryName.toLowerCase().trim())) {
        setError("Category already exists");
        return;
      }

      // Add category with empty subCategories array
      const docRef = await addDoc(collection(db, "categories"), {
        name: categoryName.trim(),
        subCategories: [],
      });

      console.log("Document written with ID: ", docRef.id);
      setCategoryName("");
      setError("");
      window.location.reload(); // Optional: remove if using client state instead
    } catch (e) {
      console.error("Error adding document: ", e);
      setError("Failed to add category");
    }
  }

  return (
    <div>
      <h1 className="border-b-1 font-bold">Add Category</h1>
      <form
        id="add-category-form"
        onSubmit={(e) => {
          e.preventDefault();
          firebaseAddCategory();
        }}
      >
        <label>
          Category Name
          <input
            type="text"
            name="categoryName"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            className="border p-1 rounded"
          />
        </label>
        {error && <p className="text-red-500">{error}</p>}
        <Button form="add-category-form" type="submit">
          Add Category
        </Button>
      </form>
    </div>
  );
}
