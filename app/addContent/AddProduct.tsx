"use client";
import React, { useEffect, useState } from "react";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import Button from "../components/Button";
import { db } from "../firebase/firebaseInit";

export default function AddProduct() {
  const [name, setName] = useState("");
  const [productIN, setProductIN] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [error, setError] = useState("");

  // Fetch all categories on load
  useEffect(() => {
    async function fetchCategories() {
      const snapshot = await getDocs(collection(db, "categories"));
      const categoryNames = snapshot.docs.map((doc) => doc.data().name);
      setCategories(categoryNames);
      if (categoryNames.length > 0) {
        setCategory(categoryNames[0]);
      }
    }

    fetchCategories();
  }, []);

  // Fetch subcategories for selected category
  useEffect(() => {
    async function fetchSubCategories() {
      if (!category) return;

      const q = query(
        collection(db, "categories"),
        where("name", "==", category)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        const subCats = data.subCategories || [];
        setSubCategories(subCats);
        if (subCats.length > 0) {
          setSubCategory(subCats[0]);
        } else {
          setSubCategory("");
        }
      }
    }

    fetchSubCategories();
  }, [category]);

  // Add product to `/products`
  async function firebaseAddProduct() {
    if (!name.trim() || !category) {
      setError("All fields are required");
      return;
    }

    try {
      const docRef = await addDoc(collection(db, "products"), {
        name: name.trim(),
        productIN,
        category,
        subCategory,
      });

      console.log("Product added with ID: ", docRef.id);
      setName("");
      setError("");
      window.location.reload(); // or update local state instead
    } catch (e) {
      console.error("Error adding product: ", e);
      setError("Failed to add product");
    }
  }

  return (
    <div>
      <h1 className="border-b-1 font-bold">Add Product</h1>
      <form
        id="add-product-form"
        className="flex gap-2 flex-col"
        onSubmit={(e) => {
          e.preventDefault();
          firebaseAddProduct();
        }}
      >
        <div>
          <label>
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
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
            Sub Category
            <select
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
              name="subCategory"
              id="subCategory"
              className="border p-1 rounded"
            >
              {subCategories.map((subCat) => (
                <option key={subCat} value={subCat}>
                  {subCat}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div>
          <label>
            Description
            <input
              type="text"
              name="productName"
              className="border p-1 rounded"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label>
            Product IN
            <input
              type="text"
              name="productIN"
              className="border p-1 rounded"
              required
              value={productIN}
              onChange={(e) => setProductIN(e.target.value)}
            />
          </label>
        </div>

        {error && <p className="text-red-500">{error}</p>}

        <Button form="add-product-form" type="submit">
          Add Product
        </Button>
      </form>
    </div>
  );
}
