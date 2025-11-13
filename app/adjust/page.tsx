"use client";

import { useState, useEffect } from "react";
import ProductCard from "../components/Cards/ProductCard";
import ProductAdjustCard from "../components/Cards/ProductAdjustCard";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/app/firebase/firebaseInit";

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

export default function Page() {
  const [editingProduct, setEditingProduct] = useState<ProductInterface | null>(
    null
  );
  const [products, setProducts] = useState<ProductInterface[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load products from Firebase
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const productsCollection = collection(db, "products");
        const snapshot = await getDocs(productsCollection);

        const loadedProducts = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            Desc: data.Desc || "",
            Extra: data.Extra || "",
            LengthCoveragePackaging: data.LengthCoveragePackaging || "",
            category: data.category || "",
            imageSrc: data.imageSrc || "",
            priceWithNote: data.priceWithNote || "",
            productIN: data.productIN || "",
            subCategory: data.subCategory || "",
            Length: data.Length || "",
          } as ProductInterface;
        });

        console.log("Loaded products:", loadedProducts);
        setProducts(loadedProducts);
      } catch (err: any) {
        console.error("Error loading products:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const handleEdit = (productId: string) => {
    console.log("Edit clicked for product ID:", productId);
    const product = products.find((p) => p.id === productId);
    console.log("Found product:", product);
    if (product) {
      setEditingProduct(product);
    }
  };

  const handleSave = async (updatedProduct: ProductInterface) => {
    try {
      const productRef = doc(db, "products", updatedProduct.id);
      await updateDoc(productRef, {
        Desc: updatedProduct.Desc,
        Extra: updatedProduct.Extra,
        LengthCoveragePackaging: updatedProduct.LengthCoveragePackaging,
        category: updatedProduct.category,
        imageSrc: updatedProduct.imageSrc,
        priceWithNote: updatedProduct.priceWithNote,
        productIN: updatedProduct.productIN,
        subCategory: updatedProduct.subCategory,
        Length: updatedProduct.Length,
      });

      setProducts((prev) =>
        prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
      );
      setEditingProduct(null);
    } catch (err: any) {
      console.error("Error updating product:", err);
      alert("Failed to update product: " + err.message);
    }
  };

  const handleCancel = () => {
    console.log("Cancel clicked");
    setEditingProduct(null);
  };

  const handleDelete = async (productIN: string) => {
    try {
      const product = products.find((p) => p.productIN === productIN);
      if (!product) return;

      const productRef = doc(db, "products", product.id);
      await deleteDoc(productRef);

      setProducts((prev) => prev.filter((p) => p.productIN !== productIN));
    } catch (err: any) {
      console.error("Error deleting product:", err);
      alert("Failed to delete product: " + err.message);
    }
  };

  console.log("Current editing product:", editingProduct);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading products...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Product Management
      </h1>

      {/* Debug info */}
      {editingProduct && (
        <div className="mb-4 p-2 bg-yellow-100 text-xs">
          Editing: {editingProduct.productIN}
        </div>
      )}

      {editingProduct ? (
        <div className="flex justify-center">
          <ProductAdjustCard
            p={editingProduct}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      ) : (
        <>
          {products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No products found</p>
              <p className="text-gray-400 text-sm mt-2">
                Add products to get started
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  p={product}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}