"use client";

import React, { useEffect, useState } from "react";
import { getDocs, collection, DocumentData } from "firebase/firestore";
import { db } from "../firebase/firebaseInit";
import ProductCard from "../components/ProductCard";
import CategoryCard from "../components/CategoryCard";
import Navigation from "../components/Navigation";
import JsBarcode from "jsbarcode";
import SubCategoryCard from "../components/SubCategoryCard";

interface Category {
  name: string;
  subCategories: string[]; // optional if you store subcategories inside
}

type Categories = Category[];

export default function ViewContent() {
  const [categories, setCategories] = useState<Categories | []>([]);
  const [products, setProducts] = useState<DocumentData[]>([]);

  // Fetch Firestore content
  async function fetchContent() {
    try {
      const categoriesSnapshot = await getDocs(collection(db, "categories"));
      const productsSnapshot = await getDocs(collection(db, "products"));

      const categories: Categories = categoriesSnapshot.docs.map(
        (doc) => doc.data() as Category
      );

      const products = productsSnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id, // useful if you want to use doc ID for barcode
      }));

      setCategories(categories);
      setProducts(products);
    } catch (error) {
      console.error("Error fetching content:", error);
    }
  }

  useEffect(() => {
    fetchContent();
  }, []);

  // Generate barcodes after products are loaded
  useEffect(() => {
    products.forEach((product, index) => {
      const barcodeId = `barcode-${index}`;
      const value = product.productIN;

      try {
        JsBarcode(`#${barcodeId}`, value.toString(), {
          format: "CODE128",
          displayValue: true,
          fontSize: 14,
          height: 40,
        });
      } catch (err) {
        console.warn("Failed to generate barcode:", err);
      }
    });
  }, [products]);

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <Navigation />
      <h1 className="text-2xl font-bold mb-4">Current Categories</h1>
      <div className="flex flex-wrap max-w-[900px]">
        {categories.map((category, i) => (
          <CategoryCard key={i} category={category.name} />
        ))}
      </div>

      <h1 className="text-2xl font-bold mb-4">Current Subcategories</h1>
      <div className="flex flex-warp max-w-[900px]">
        {categories.map((category) =>
          category.subCategories.map((subCategory, j) => (
            <SubCategoryCard
              key={j}
              category={category.name}
              subCategory={subCategory}
            />
          ))
        )}
      </div>

      <h1 className="text-2xl font-bold mb-4">Current Products</h1>
      <div className="flex flex-wrap max-w-[900px]">
        {products.map((product, i) => (
          <ProductCard
            key={i}
            name={product.name}
            category={product.category}
            subCategory={product.subCategory}
          />
        ))}
      </div>
    </div>
  );
}
