"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  setDoc,
  arrayUnion,
  getDoc,
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

  // Track if we prefilled from a draft so we don't auto-select defaults that overwrite it
  const prefilledRef = useRef(false);

  // Prefill from sessionStorage (when coming from Edit page "Add Product")
  useEffect(() => {
    try {
      const raw =
        typeof window !== "undefined"
          ? sessionStorage.getItem("productDraft")
          : null;
      if (raw) {
        const d = JSON.parse(raw);
        setDesc(d.Desc || "");
        setLength(d.Length || "");
        setCategory(d.category || "");
        setSubCategory(d.subCategory || "");
        setImageSrc(d.imageSrc || "");
        setPriceWithNote(d.priceWithNote || "");
        setProductIN(d.productIN || "");
        prefilledRef.current = true;
        // Keep the draft so fields persist even if the user navigates away and back
        // If you prefer to clear it after hydration, uncomment the next line:
        // sessionStorage.removeItem("productDraft");
      }
    } catch (e) {
      console.warn("Failed to parse productDraft from sessionStorage");
    }
  }, []);

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
      // Only auto-select if we didn't prefill a category
      if (uniqueCats.length && !prefilledRef.current && !category)
        setCategory(uniqueCats[0]);
    }
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function fetchSubCategories() {
      if (!category) {
        setSubCategories([]);
        return;
      }

      // A) From products (back-compat)
      const snapshot = await getDocs(collection(db, "products"));
      const fromProducts: string[] = [];
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data() as any;
        if (data.category === category && data.subCategory) {
          fromProducts.push(String(data.subCategory));
        }
      });

      // B) From metadata
      const key = slug(category);
      const metaSnap = await getDoc(doc(db, "category_meta", key));
      const fromMeta: string[] = metaSnap.exists()
        ? metaSnap.data()?.subcategories ?? []
        : [];

      // Combine (case-insensitive unique) + sort alpha
      const combined = uniqCI([...fromProducts, ...fromMeta]).sort((a, b) =>
        a.localeCompare(b)
      );

      setSubCategories(combined);
      // Only set a default if user/draft hasn't already chosen one
      setSubCategory((prev) => prev || combined[0] || "");
    }
    fetchSubCategories();
  }, [category]);

  // Add new category to Firestore (products collection)
  const addNewCategory = async () => {
    if (!newCategory.trim()) {
      setError("Please enter a category name.");
      return;
    }
    try {
      const key = slug(newCategory);
      const metaRef = doc(db, "category_meta", key);

      await setDoc(
        metaRef,
        { name: newCategory.trim(), subcategories: [] },
        { merge: true }
      );

      setCategories((prev) =>
        uniqCI([...prev, newCategory]).sort((a, b) => a.localeCompare(b))
      );
      setCategory(newCategory.trim());
      setNewCategory("");
      setError("");
      // toast.success("Category added!");
    } catch (e) {
      console.error("Error adding category: ", e);
      setError("Failed to add category.");
    }
  };

  const slug = (s: string) =>
    (s || "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-_]/g, "");

  const uniqCI = (arr: string[]) => {
    const map = new Map<string, string>();
    arr.forEach((v) => {
      const k = (v || "").trim().toLowerCase();
      if (k) map.set(k, v.trim());
    });
    return Array.from(map.values());
  };

  // Add new subcategory to Firestore (for selected category)
  const addNewSubCategory = async () => {
    const sub = newSubCategory.trim();
    if (!sub || !category) {
      setError("Please select a category and enter a subcategory name.");
      return;
    }
    try {
      const key = slug(category);
      const metaRef = doc(db, "category_meta", key);

      // Ensure category doc exists
      await setDoc(
        metaRef,
        { name: category, subcategories: [] },
        { merge: true }
      );

      // Add subcategory (unique server-side)
      await updateDoc(metaRef, {
        subcategories: arrayUnion(sub),
      });

      // Reflect in UI (unique client-side)
      setSubCategories((prev) =>
        uniqCI([...prev, sub]).sort((a, b) => a.localeCompare(b))
      );
      setSubCategory(sub);
      setNewSubCategory("");
      setError("");
      // toast.success("Subcategory added!");
    } catch (e) {
      console.error("Error adding subcategory: ", e);
      setError("Failed to add subcategory.");
    }
  };

  // Add product to Firestore
  async function firebaseAddProduct() {
    if (!Desc || !Length || !category || !productIN) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      // Add the product
      await addDoc(collection(db, "products"), {
        Desc,
        Length,
        category,
        subCategory,
        imageSrc,
        priceWithNote,
        productIN,
      });

      // Ensure meta knows about this subCategory
      if (subCategory?.trim()) {
        const key = slug(category);
        await setDoc(
          doc(db, "category_meta", key),
          { name: category, subcategories: [] },
          { merge: true }
        );
        await updateDoc(doc(db, "category_meta", key), {
          subcategories: arrayUnion(subCategory.trim()),
        });
      }

      // (Keep form data as you already do)
      sessionStorage.setItem(
        "productDraft",
        JSON.stringify({
          Desc,
          Length,
          category,
          subCategory,
          imageSrc,
          priceWithNote,
          productIN,
        })
      );

      // toast.success("Product added!");
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
            {categories.map((c, i) => (
              <option key={i + c} value={c}>
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
