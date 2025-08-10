"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  getDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import { Button } from "@heroui/react";
import { Toaster, toast } from "sonner"; // npm i sonner
import { db } from "../../../firebase/firebaseInit"; // ⬅️ adjust if needed

// Optional: align with your existing interface naming
interface Product {
  Desc: string;
  Length: string;
  category: string;
  subCategory?: string;
  imageSrc?: string;
  priceWithNote?: string;
  productIN: string;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params?.id)
    ? params.id[0]
    : (params?.id as string | undefined);

  // Form state
  const [Desc, setDesc] = useState("");
  const [Length, setLength] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [imageSrc, setImageSrc] = useState("");
  const [priceWithNote, setPriceWithNote] = useState("");
  const [productIN, setProductIN] = useState("");

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");

  // For selects
  const [categories, setCategories] = useState<string[]>([]);
  const [subCategories, setSubCategories] = useState<string[]>([]);

  // Fetch categories list (from existing products)
  useEffect(() => {
    async function fetchCategories() {
      try {
        const snap = await getDocs(collection(db, "products"));
        const allCats = snap.docs
          .map((d) => (d.data().category as string) || "")
          .filter(Boolean);
        const uniqueCats = Array.from(new Set(allCats)).sort((a, b) =>
          a.localeCompare(b)
        );
        setCategories(uniqueCats);
      } catch (e) {
        console.error(e);
      }
    }
    fetchCategories();
  }, []);

  // Fetch product data by id
  useEffect(() => {
    if (!id) return;

    async function fetchProduct() {
      setLoading(true);
      setError("");
      try {
        const ref = doc(db, "products", id as string);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          setError("Product not found.");
          toast.error("Product not found.");
          setLoading(false);
          return;
        }
        const data = snap.data() as Product;
        setDesc(data.Desc || "");
        setLength(data.Length || "");
        setCategory(data.category || "");
        setSubCategory(data.subCategory || "");
        setImageSrc(data.imageSrc || "");
        setPriceWithNote(data.priceWithNote || "");
        setProductIN(data.productIN || "");
      } catch (e) {
        console.error(e);
        setError("Failed to fetch product.");
        toast.error("Failed to fetch product.");
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [id]);

  // Fetch subcategories for the selected category
  useEffect(() => {
    if (!category) {
      setSubCategories([]);
      return;
    }
    async function fetchSubCats() {
      try {
        const snap = await getDocs(collection(db, "products"));
        const list: string[] = [];
        snap.docs.forEach((d) => {
          const data = d.data();
          if (data.category === category && data.subCategory)
            list.push(data.subCategory as string);
        });
        const unique = Array.from(new Set(list)).sort((a, b) =>
          a.localeCompare(b)
        );
        setSubCategories(unique);
        // Keep current selection if still valid; otherwise clear
        if (unique.length && !unique.includes(subCategory)) {
          setSubCategory(unique[0]);
        }
      } catch (e) {
        console.error(e);
      }
    }
    fetchSubCats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  // Ensure the currently selected values are always present in the options
  const categoryOptions = useMemo(() => {
    const s = new Set(categories);
    if (category) s.add(category);
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [categories, category]);

  const subCategoryOptions = useMemo(() => {
    const s = new Set(subCategories);
    if (subCategory) s.add(subCategory);
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [subCategories, subCategory]);

  async function saveChanges() {
    if (!id) return;
    if (!Desc || !Length || !category || !productIN) {
      setError("Please fill in all required fields.");
      toast.error("Please fill in all required fields.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const ref = doc(db, "products", id);
      const payload: Product = {
        Desc,
        Length,
        category,
        subCategory,
        imageSrc,
        priceWithNote,
        productIN,
      };
      await updateDoc(ref, payload as any);
      toast.success("Changes saved.");
      // router.back(); // Uncomment if you want to go back after save
    } catch (e) {
      console.error(e);
      setError("Failed to save changes. See console for details.");
      toast.error("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  function confirmAddNew() {
    toast.custom(
      (t) => (
        <div className="border rounded-xl shadow bg-white p-4 w-[320px]">
          <div className="font-semibold mb-1">Add a new product?</div>
          <p className="text-sm text-gray-600 mb-3">
            You're currently editing an existing product. Do you want to switch
            and create a new one instead?
          </p>
          <div className="flex justify-end gap-2">
            <button
              className="px-3 py-1.5 border rounded"
              onClick={() => toast.dismiss(t)}
            >
              Keep editing
            </button>
            <button
              className="px-3 py-1.5 rounded bg-blue-600 text-white"
              onClick={() => {
                toast.dismiss(t);
                const draft = {
                  Desc,
                  Length,
                  category,
                  subCategory,
                  imageSrc,
                  priceWithNote,
                  productIN,
                };
                sessionStorage.setItem("productDraft", JSON.stringify(draft));
                router.push("/addContent"); // your Add page
              }}
            >
              Create new
            </button>
          </div>
        </div>
      ),
      { duration: 8000 }
    );
  }

  if (!id) {
    return (
      <div className="p-6">
        <p className="text-red-500">Missing product id in route.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-6 w-64 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="h-4 w-80 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-4 w-72 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-4 w-96 bg-gray-200 rounded animate-pulse mb-2" />
      </div>
    );
  }

  return (
    <div className="bg-white p-6 shadow rounded space-y-4">
      <Toaster richColors closeButton position="top-right" />

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Edit Product</h1>
        <div className="flex gap-2">
          <Button variant="flat" onPress={() => router.back()}>
            Back
          </Button>
          <Button color="primary" onPress={confirmAddNew}>
            Add Product
          </Button>
        </div>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveChanges();
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
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
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
            {subCategoryOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
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
          <label className="font-medium">Price</label>
          <input
            type="text"
            value={priceWithNote}
            onChange={(e) => setPriceWithNote(e.target.value)}
            placeholder="e.g. $18.00"
            className="border rounded p-2"
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
          <Button type="submit" color="primary" isDisabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
