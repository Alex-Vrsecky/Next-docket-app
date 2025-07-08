"use client";

import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase/firebaseInit";
import Navigation from "./components/Navigation";
import JsBarcode from "jsbarcode";

export default function Home() {
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<{
    type: "category" | "subCategory";
    value: string;
  } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);

  // Fetch all data once on load
  useEffect(() => {
    const fetchData = async () => {
      try {
        const catSnap = await getDocs(collection(db, "categories"));
        const categoryList = catSnap.docs.map((doc) => doc.data().name);
        setCategories(categoryList);

        const subCatSnap = await getDocs(collection(db, "sub-categories"));
        const subCategoryList = subCatSnap.docs.map((doc) => doc.data().name);
        setSubCategories(subCategoryList);

        const productSnap = await getDocs(collection(db, "products"));
        const productList = productSnap.docs.map((doc) => doc.data());
        setProducts(productList);
      } catch (error) {
        console.error("Error loading Firestore data:", error);
      }
    };

    fetchData();
  }, []);

  // Apply filter when selected
  useEffect(() => {
    if (!selectedFilter) {
      setFilteredProducts([]);
      return;
    }

    if (selectedFilter.type === "category") {
      const matched = products.filter(
        (p) => p.category === selectedFilter.value
      );
      setFilteredProducts(matched);
    } else if (selectedFilter.type === "subCategory") {
      let matched = products.filter(
        (p) => p.subCategory === selectedFilter.value
      );

      // If a category is also selected, filter by both category and subcategory
      if (selectedCategory) {
        matched = matched.filter((p) => p.category === selectedCategory);
      }

      setFilteredProducts(matched);
    }
  }, [selectedFilter, selectedCategory, products]);

  // Filtered search lists
  const filteredCategories = categories.filter((cat) =>
    cat.toLowerCase().includes(search.toLowerCase())
  );
  const filteredSubCategories = subCategories.filter((sub) =>
    sub.toLowerCase().includes(search.toLowerCase())
  );

  // Search products by name
  const searchedProducts = products.filter((product) =>
    product.name?.toLowerCase().includes(search.toLowerCase())
  );

  // Generate barcode for each product
  useEffect(() => {
    // Generate barcodes for filtered products
    if (filteredProducts.length > 0) {
      filteredProducts.forEach((product, index) => {
        if (product.productIN) {
          const canvas = document.getElementById(`barcode-${index}`);
          if (canvas) {
            try {
              JsBarcode(canvas, product.productIN, {
                format: "CODE128",
                width: 2,
                height: 50,
                displayValue: true,
                fontSize: 12,
                margin: 10,
              });
            } catch (error) {
              console.error("Error generating barcode:", error);
            }
          }
        }
      });
    }

    // Generate barcodes for search results
    if (search && searchedProducts.length > 0 && !selectedFilter) {
      searchedProducts.forEach((product, index) => {
        if (product.productIN) {
          const canvas = document.getElementById(`barcode-search-${index}`);
          if (canvas) {
            try {
              JsBarcode(canvas, product.productIN, {
                format: "CODE128",
                width: 2,
                height: 50,
                displayValue: true,
                fontSize: 12,
                margin: 10,
              });
            } catch (error) {
              console.error("Error generating barcode:", error);
            }
          }
        }
      });
    }
  }, [filteredProducts, searchedProducts, search, selectedFilter]);

  // Get subcategories for the selected category
  const getSubcategoriesForCategory = (category: string) => {
    const categoryProducts = products.filter((p) => p.category === category);
    const categorySubcategories = [
      ...new Set(categoryProducts.map((p) => p.subCategory)),
    ];
    return categorySubcategories.filter(
      (sub) => sub && sub.toLowerCase().includes(search.toLowerCase())
    );
  };

  const handleCategoryClick = (cat: string) => {
    setSelectedCategory(cat);
    setSelectedFilter({ type: "category", value: cat });
  };

  const handleSubCategoryClick = (sub: string) => {
    setSelectedFilter({ type: "subCategory", value: sub });
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedFilter(null);
  };

  return (
    <div className="flex flex-col items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <header className="flex w-full h-[50px] flex-col justify-center bg-[#0d5257] items-center gap-4">
        <h1 className="text-2xl font-bold text-white">
          Croydon Bunnings Docket App
        </h1>
      </header>

      <Navigation />

      <main className="w-full max-w-4xl">
        <input
          type="text"
          placeholder="Search categories, sub-categories, or product names..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-2 mb-6 border border-gray-300 rounded"
        />

        {/* Filterable Categories */}
        {filteredCategories.length > 0 && (
          <>
            <h2 className="font-semibold text-lg mb-2">Categories</h2>
            <ul className="flex flex-wrap gap-2 mb-4">
              {filteredCategories.map((cat) => (
                <li
                  key={cat}
                  onClick={() => handleCategoryClick(cat)}
                  className={`p-2 border rounded hover:bg-gray-100 cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-blue-100 border-blue-500"
                      : ""
                  }`}
                >
                  {cat}
                </li>
              ))}
            </ul>
          </>
        )}

        {/* Subcategories for selected category */}
        {selectedCategory && (
          <>
            <h2 className="font-semibold text-lg mb-2">
              Sub-categories for {selectedCategory}
            </h2>
            <ul className="flex flex-wrap gap-2 mb-4">
              {getSubcategoriesForCategory(selectedCategory).map((sub) => (
                <li
                  key={sub}
                  onClick={() => handleSubCategoryClick(sub)}
                  className={`p-2 border rounded hover:bg-gray-100 cursor-pointer ${
                    selectedFilter?.type === "subCategory" &&
                    selectedFilter?.value === sub
                      ? "bg-green-100 border-green-500"
                      : ""
                  }`}
                >
                  {sub}
                </li>
              ))}
            </ul>
          </>
        )}

        {/* Filterable Subcategories (when no category selected) */}
        {!selectedCategory && filteredSubCategories.length > 0 && (
          <>
            <h2 className="font-semibold text-lg mb-2">All Sub-categories</h2>
            <ul className="flex flex-wrap gap-2 mb-6">
              {filteredSubCategories.map((sub) => (
                <li
                  key={sub}
                  onClick={() => handleSubCategoryClick(sub)}
                  className={`p-2 border rounded hover:bg-gray-100 cursor-pointer ${
                    selectedFilter?.type === "subCategory" &&
                    selectedFilter?.value === sub
                      ? "bg-green-100 border-green-500"
                      : ""
                  }`}
                >
                  {sub}
                </li>
              ))}
            </ul>
          </>
        )}

        {/* Clear filters button */}
        {(selectedCategory || selectedFilter) && (
          <button
            onClick={clearFilters}
            className="mb-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Clear Filters
          </button>
        )}

        {/* Display Products Found by Search */}
        {search && searchedProducts.length > 0 && !selectedFilter && (
          <div className="mt-6">
            <h2 className="text-xl font-bold mb-4">
              Products matching "{search}"
            </h2>
            <ul className="grid sm:grid-cols-2 gap-4">
              {searchedProducts.map((product, i) => (
                <li
                  key={i}
                  className="border p-4 rounded shadow-sm bg-white max-w-[400px]"
                >
                  <p className="font-semibold">{product.name}</p>
                  <p className="text-sm">Category: {product.category}</p>
                  <p className="text-sm">Sub-category: {product.subCategory}</p>
                  <p className="text-xs text-gray-500">
                    Product IN: {product.productIN}
                  </p>
                  {product.productIN && (
                    <div className="mt-2">
                      <canvas id={`barcode-search-${i}`}></canvas>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* No results message */}
        {search &&
          searchedProducts.length === 0 &&
          filteredCategories.length === 0 &&
          filteredSubCategories.length === 0 && (
            <div className="mt-6">
              <p className="text-gray-500">No results found for "{search}"</p>
            </div>
          )}

        {/* Display Products Based on Filter */}
        {selectedFilter && (
          <div className="mt-10">
            <h2 className="text-xl font-bold mb-4">
              Products under {selectedFilter.type}: {selectedFilter.value}
            </h2>
            {filteredProducts.length > 0 ? (
              <ul className="grid sm:grid-cols-2 gap-4">
                {filteredProducts.map((product, i) => (
                  <li
                    key={i}
                    className="border p-4 rounded shadow-sm bg-white max-w-[400px]"
                  >
                    <p className="font-semibold">{product.name}</p>
                    <p className="text-sm">Category: {product.category}</p>
                    <p className="text-sm">
                      Sub-category: {product.subCategory}
                    </p>
                    <p className="text-xs text-gray-500">
                      Product IN: {product.productIN}
                    </p>
                    {product.productIN && (
                      <div className="mt-2">
                        <canvas id={`barcode-${i}`}></canvas>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No products found.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
