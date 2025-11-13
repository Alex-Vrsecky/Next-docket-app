"use client";

import { useState, useEffect } from "react";
import ProductCard from "../components/Cards/ProductCard";
import ProductAdjustCard from "../components/Cards/ProductAdjustCard";
import SearchBar from "../components/SearchBar";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/app/firebase/firebaseInit";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import NavigationMenu from "../components/NavigationMenu";

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
  const router = useRouter();
  const [editingProduct, setEditingProduct] = useState<ProductInterface | null>(
    null
  );
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [products, setProducts] = useState<ProductInterface[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // Check authentication and authorization
  useEffect(() => {
    const auth = getAuth();
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // User is not signed in, redirect to login
        router.push("/userSignIn");
        return;
      }

      try {
        // Try to get the first name from displayName
        let firstName = "";
        
        if (user.displayName) {
          firstName = user.displayName.split(" ")[0].toLowerCase();
        } else {
          // If displayName is not set, try to get from Firestore users collection
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            firstName = (userData.firstName || userData.name || "").toLowerCase();
          }
        }

        console.log("First name:", firstName); // Debug log

        // Check if the first name is Alex or Karlee
        if (firstName === "alex" || firstName === "karlee") {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
          setError("Access denied. Only Alex or Karlee can access this page.");
        }
      } catch (err) {
        console.error("Error checking authorization:", err);
        setIsAuthorized(false);
        setError("Error checking authorization.");
      }

      setIsCheckingAuth(false);
    });

    return () => unsubscribe();
  }, [router]);

  // Load products from Firebase
  useEffect(() => {
    if (!isAuthorized || isCheckingAuth) return;

    const loadProducts = async () => {
      try {
        setLoading(true);
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        setError("Failed to load products.");
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [isAuthorized, isCheckingAuth]);

  // Filter products based on search query
  const filteredProducts = products.filter((product) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      product.productIN.toLowerCase().includes(query) ||
      product.Desc.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query) ||
      product.subCategory.toLowerCase().includes(query) ||
      product.Length.toLowerCase().includes(query) ||
      product.priceWithNote.toLowerCase().includes(query)
    );
  });

  const handleAddNew = () => {
    setIsAddingNew(true);
    setEditingProduct(null);
  };

  const handleEdit = (productId: string) => {
    console.log("Edit clicked for product ID:", productId);
    const product = products.find((p) => p.id === productId);
    console.log("Found product:", product);
    if (product) {
      setIsAddingNew(false);
      setEditingProduct(product);
    }
  };

  const handleSave = async (updatedProduct: ProductInterface) => {
    try {
      if (isAddingNew) {
        const productsCollection = collection(db, "products");
        const docRef = await addDoc(productsCollection, {
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

        const newProduct = {
          ...updatedProduct,
          id: docRef.id,
        };

        setProducts((prev) => [...prev, newProduct]);
        setIsAddingNew(false);
        setEditingProduct(null);
      } else {
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
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Error saving product:", err);
      alert("Failed to save product: " + err.message);
    }
  };

  const handleCancel = () => {
    console.log("Cancel clicked");
    setEditingProduct(null);
    setIsAddingNew(false);
  };

  const handleDelete = async (productIN: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete product ${productIN}?`
    );
    if (!confirmDelete) return;

    try {
      const product = products.find((p) => p.productIN === productIN);
      if (!product) return;

      const productRef = doc(db, "products", product.id);
      await deleteDoc(productRef);

      setProducts((prev) => prev.filter((p) => p.productIN !== productIN));

      if (editingProduct?.productIN === productIN) {
        setEditingProduct(null);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Error deleting product:", err);
      alert("Failed to delete product: " + err.message);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Checking authorization...</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-600 text-xl font-semibold">Access Denied</div>
        <p className="text-gray-600 mt-2">
          Only Alex or Karlee can access this page.
        </p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 px-6 py-2 bg-[rgb(13,82,87)] text-white rounded-lg font-semibold hover:bg-[rgb(10,65,69)] transition-colors"
        >
          Go Home
        </button>
      </div>
    );
  }

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
    <div className="flex flex-col items-center p-6 min-h-screen bg-gray-50 ">
      <NavigationMenu isOpen={isMenuOpen} toggleMenu={toggleMenu} />
      
      <button
        onClick={toggleMenu}
        className="fixed top-4 right-4 z-40 p-3 bg-[rgb(13,82,87)] text-white rounded-lg hover:bg-[rgb(10,65,69)] transition-colors shadow-lg"
        aria-label="Toggle menu"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Product Management
      </h1>

      <div className="w-full max-w-[330px] mb-8">
        <div className="flex gap-2 mb-4">
          <div className="flex-1">
            <SearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              placeholder="Search products..."
            />
          </div>
          <button
            onClick={handleAddNew}
            className="px-4 py-3 bg-[rgb(13,82,87)] text-white rounded-lg font-semibold hover:bg-[rgb(10,65,69)] transition-colors whitespace-nowrap"
            title="Add New Product"
          >
            + Add
          </button>
        </div>

        {searchQuery && (
          <div className="text-sm text-gray-600">
            Found {filteredProducts.length} product
            {filteredProducts.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {filteredProducts.length > 5 && (
        <div className="mb-4 text-center">
          <p className="text-gray-600 text-sm">
            Showing 5 of {filteredProducts.length} products
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Use search to narrow down results
          </p>
        </div>
      )}

      {(editingProduct || isAddingNew) && (
          <div className="max-w-[380px] w-full max-h-[90vh] overflow-y-auto shadow-[0px_0px_4px_1px_rgba(0,0,0,0.25)] rounded-lg mb-5">
            <ProductAdjustCard
              p={isAddingNew ? null : editingProduct}
              onSave={handleSave}
              onCancel={handleCancel}
              isAdding={isAddingNew}
            />
          </div>
      )}

      {filteredProducts.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-6 ">
            {filteredProducts.slice(0, 5).map((product) => (
              <ProductCard
                key={product.id}
                p={product}
                onEdit={() => handleEdit(product.id)}
                onDelete={() => handleDelete(product.productIN)}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            {searchQuery
              ? "No products match your search"
              : "No products found"}
          </p>
          {searchQuery ? (
            <p className="text-gray-400 text-sm mt-2">
              Try adjusting your search terms
            </p>
          ) : (
            <>
              <p className="text-gray-400 text-sm mt-2">
                Get started by adding your first product
              </p>
              <button
                onClick={handleAddNew}
                className="mt-4 px-6 py-2 bg-[rgb(13,82,87)] text-white rounded-lg font-semibold hover:bg-[rgb(10,65,69)] transition-colors"
              >
                + Add New Product
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}