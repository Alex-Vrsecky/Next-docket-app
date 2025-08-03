"use client";

import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { Button } from "@heroui/react";
import { db } from "../firebase/firebaseInit";

export default function AddProduct() {
  const [Desc, setDesc] = useState(""); // description
  const [Length, setLength] = useState(""); // e.g. "2.4m"
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [imageSrc, setImageSrc] = useState(""); // URL
  const [priceWithNote, setPriceWithNote] = useState(""); // e.g. "$18.00"
  const [productIN, setProductIN] = useState(""); // e.g. "8032702"
  const [categories, setCategories] = useState<string[]>([]);
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState(""); // For new category input
  const [newSubCategory, setNewSubCategory] = useState(""); // For new subcategory input
  const [error, setError] = useState("");

  // Fetch all categories from the products collection on load
  useEffect(() => {
    async function fetchCategories() {
      const snapshot = await getDocs(collection(db, "products"));
      // Pull out every category, filter out empty strings, then dedupe via Set
      const allCats = snapshot.docs
        .map((doc) => (doc.data().category as string) || "")
        .filter((n) => n);

      // Deduplicate and sort alphabetically
      const uniqueCats = Array.from(new Set(allCats)).sort((a, b) =>
        a.localeCompare(b)
      );

      setCategories(uniqueCats);
      if (uniqueCats.length) setCategory(uniqueCats[0]);
    }
    fetchCategories();
  }, []);

  // Fetch subcategories for selected category from products collection
  useEffect(() => {
    async function fetchSubCategories() {
      if (!category) return;

      const snapshot = await getDocs(collection(db, "products"));
      const subCategoriesList: string[] = [];

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.category === category && data.subCategory) {
          subCategoriesList.push(data.subCategory);
        }
      });

      // Deduplicate and sort subcategories
      const uniqueSubs = Array.from(new Set(subCategoriesList)).sort((a, b) =>
        a.localeCompare(b)
      );

      setSubCategories(uniqueSubs);
      setSubCategory(uniqueSubs[0] || ""); // Auto-select the first subcategory if available
    }
    fetchSubCategories();
  }, [category]);

  // Add new category to Firestore (products collection)
  const addNewCategory = async () => {
    if (!newCategory) {
      setError("Please enter a category name.");
      return;
    }
    try {
      // Add the new category to the products collection (just as an example, using addDoc)
      await addDoc(collection(db, "products"), {
        category: newCategory,
        subCategory: "", // New category will have no subcategory initially
        Desc: "",
        Length: "",
        imageSrc: "",
        priceWithNote: "",
        productIN: "",
      });

      setCategories((prev) => [...prev, newCategory]);
      setCategory(newCategory); // Auto-select the new category
      setNewCategory(""); // Clear the input field
      setError(""); // Clear any errors
      alert("Category added!");
    } catch (e) {
      console.error("Error adding category: ", e);
      setError("Failed to add category.");
    }
  };

  // Add new subcategory to Firestore (for selected category)
  const addNewSubCategory = async () => {
    if (!newSubCategory || !category) {
      setError("Please select a category and enter a subcategory name.");
      return;
    }
    try {
      // Update the products where the category matches to add the new subcategory
      const snapshot = await getDocs(collection(db, "products"));
      const productsToUpdate = snapshot.docs.filter((doc) => {
        const data = doc.data();
        return data.category === category;
      });

      // Update subcategories for each product in the selected category
      for (const productDoc of productsToUpdate) {
        const productRef = doc(db, "products", productDoc.id);
        await updateDoc(productRef, {
          subCategory: newSubCategory,
        });
      }

      // Update local state to reflect the new subcategory
      setSubCategories((prev) => [...prev, newSubCategory]);
      setSubCategory(newSubCategory); // Auto-select the new subcategory
      setNewSubCategory(""); // Clear the input field
      setError(""); // Clear any errors
      alert("Subcategory added!");
    } catch (e) {
      console.error("Error adding subcategory: ", e);
      setError("Failed to add subcategory.");
    }
  };

  // Add product to Firestore
  async function firebaseAddProduct() {
    // basic validation
    if (!Desc || !Length || !category || !productIN) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      await addDoc(collection(db, "products"), {
        Desc,
        Length,
        category,
        subCategory,
        imageSrc,
        priceWithNote,
        productIN,
      });
      // clear form
      setDesc("");
      setLength("");
      setImageSrc("");
      setPriceWithNote("");
      setProductIN("");
      setError("");
      alert("Product added!");
    } catch (e) {
      console.error("Error adding product: ", e);
      setError("Failed to add product. See console for details.");
    }
  }

  return (
    <div className="bg-white p-6 shadow rounded space-y-4">
      <h1 className="text-xl font-bold">Add New Product</h1>
      {error && <p className="text-red-500">{error}</p>}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          firebaseAddProduct();
        }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {/* Desc */}
        <div className="flex flex-col">
          <label className="font-medium">Description *</label>
          <input
            type="text"
            value={Desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="e.g. 200 x 50mm"
            className="border rounded p-2"
            required
          />
        </div>

        {/* Length */}
        <div className="flex flex-col">
          <label className="font-medium">Length *</label>
          <input
            type="text"
            value={Length}
            onChange={(e) => setLength(e.target.value)}
            placeholder="e.g. 2.4m"
            className="border rounded p-2"
            required
          />
        </div>

        {/* Category */}
        <div className="flex flex-col">
          <label className="font-medium">Category *</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border rounded p-2"
            required
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {/* Add new category input */}
          <div className="mt-2 flex">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Add new category"
              className="border rounded p-2 mr-2"
            />
            <button
              type="button"
              onClick={addNewCategory}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Add Category
            </button>
          </div>
        </div>

        {/* Subcategory */}
        <div className="flex flex-col">
          <label className="font-medium">Subcategory</label>
          <select
            value={subCategory}
            onChange={(e) => setSubCategory(e.target.value)}
            className="border rounded p-2"
          >
            <option value="">— none —</option>
            {subCategories.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {/* Add new subcategory input */}
          <div className="mt-2 flex">
            <input
              type="text"
              value={newSubCategory}
              onChange={(e) => setNewSubCategory(e.target.value)}
              placeholder="Add new subcategory"
              className="border rounded p-2 mr-2"
            />
            <button
              type="button"
              onClick={addNewSubCategory}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Add Subcategory
            </button>
          </div>
        </div>

        {/* imageSrc */}
        <div className="flex flex-col md:col-span-2">
          <label className="font-medium">Image URL</label>
          <input
            type="url"
            value={imageSrc}
            onChange={(e) => setImageSrc(e.target.value)}
            placeholder="https://..."
            className="border rounded p-2"
          />
        </div>

        {/* priceWithNote */}
        <div className="flex flex-col">
          <label className="font-medium">Price *</label>
          <input
            type="text"
            value={priceWithNote}
            onChange={(e) => setPriceWithNote(e.target.value)}
            placeholder="e.g. $18.00"
            className="border rounded p-2"
            required
          />
        </div>

        {/* productIN */}
        <div className="flex flex-col">
          <label className="font-medium">Product IN *</label>
          <input
            type="text"
            value={productIN}
            onChange={(e) => setProductIN(e.target.value)}
            placeholder="e.g. 8032702"
            className="border rounded p-2"
            required
          />
        </div>

        {/* submit */}
        <div className="md:col-span-2 flex justify-end">
          <Button type="submit">Add Product</Button>
        </div>
      </form>
    </div>
  );
}
