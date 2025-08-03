"use client";

import React, { useEffect, useState } from "react";
import { getDocs, collection } from "firebase/firestore";
import { db } from "../firebase/firebaseInit";
import ProductCard from "../components/ProductCard";
import CategoryCard from "../components/CategoryCard";
import Navigation from "../components/Navigation";
import JsBarcode from "jsbarcode";
import SubCategoryCard from "../components/SubCategoryCard";

interface ProductInterface {
  Desc: string;
  Extra: string;
  LengthCoveragePackaging: string;
  category: string;
  id: string;
  imageSrc: string;
  priceWithNote: string;
  productIN: string;
  subCategory: string;
  Length: string;
}

interface CategoryInterface {
  name?: string;
  subCategories?: string[];
}

export default function ViewContent() {
  const [categories, setCategories] = useState<CategoryInterface[]>([]);
  const [products, setProducts] = useState<ProductInterface[]>([]);

  // Fetch Firestore content
  async function fetchContent() {
    try {
      const categoriesSnapshot = await getDocs(collection(db, "categories"));
      const productsSnapshot = await getDocs(collection(db, "products"));

      const categoriesData: CategoryInterface[] = categoriesSnapshot.docs.map(
        (doc) => doc.data() as CategoryInterface
      );

      const productsData: ProductInterface[] = productsSnapshot.docs.map(
        (doc) => ({
          ...(doc.data() as ProductInterface),
        })
      );

      setCategories(categoriesData);
      setProducts(productsData);
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
      try {
        JsBarcode(`#${barcodeId}`, product.productIN, {
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
          <CategoryCard key={i} category={category.name!} />
        ))}
      </div>

      <h1 className="text-2xl font-bold mb-4">Current Subcategories</h1>
      <div className="flex flex-wrap max-w-[900px]">
        {categories.map((category, i) => (
          <div key={i} className="mr-6 mb-4">
            <h2 className="text-xl font-bold">{category.name}</h2>
            <div className="flex flex-wrap">
              {category.subCategories?.map((subCategory, j) => (
                <SubCategoryCard
                  key={j}
                  category={category.name!}
                  subCategory={subCategory}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <h1 className="text-2xl font-bold mb-4">Current Products</h1>
      <div className="flex flex-wrap max-w-[900px]">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            p={product}
            onDelete={(id: string) =>
              setProducts((prev) => prev.filter((prod) => prod.id !== id))
            }
          />
        ))}
      </div>
    </div>
  );
}
