"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, collection, addDoc } from "firebase/firestore";
import { db } from "@/app/firebase/firebaseInit";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import NavigationMenu from "@/app/components/NavigationMenu";
import Header from "@/app/components/Header";
import ProductAdjustCard from "@/app/components/Cards/ProductAdjustCard";
import { ProductInterface } from "@/app/_types/productInterface";

export default function NewProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // Check authentication and authorization
  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/userSignIn");
        return;
      }

      try {
        let firstName = "";

        if (user.displayName) {
          firstName = user.displayName.split(" ")[0].toLowerCase();
        } else {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            firstName = (
              userData.firstName ||
              userData.name ||
              ""
            ).toLowerCase();
          }
        }

        if (
          firstName === "alex" ||
          firstName === "karlee" ||
          firstName === "ben"
        ) {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
          setError("Access denied. Only authorized users can access this page.");
        }
      } catch (err) {
        console.error("Error checking authorization:", err);
        setError("Error checking authorization.");
      } finally {
        setIsCheckingAuth(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!isCheckingAuth && isAuthorized) {
      setLoading(false);
    }
  }, [isCheckingAuth, isAuthorized]);

  const defaultProduct: ProductInterface = {
    Desc: "",
    Extra: "",
    LengthCoveragePackaging: "",
    category: "",
    id: "",
    imageSrc: "",
    priceWithNote: "",
    productIN: "",
    subCategory: "",
    Length: "",
  };

  const handleSave = async (newProduct: ProductInterface) => {
    try {
      const productsCollection = collection(db, "products");
      await addDoc(productsCollection, {
        Desc: newProduct.Desc || "",
        Extra: newProduct.Extra || "",
        LengthCoveragePackaging: newProduct.LengthCoveragePackaging || "",
        category: newProduct.category || "",
        imageSrc: newProduct.imageSrc || "",
        priceWithNote: newProduct.priceWithNote || "",
        productIN: newProduct.productIN || "",
        subCategory: newProduct.subCategory || "",
        Length: newProduct.Length || "",
      });

      setShowSuccess(true);
      setTimeout(() => {
        const queryString = searchParams.toString();
        router.push(`/productAdjustment${queryString ? `?${queryString}` : ""}`);
      }, 500);
    } catch (err) {
      console.error("Error creating product:", err);
      alert("Failed to create product: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleCancel = () => {
    const queryString = searchParams.toString();
    router.push(`/productAdjustment${queryString ? `?${queryString}` : ""}`);
  };

  if (isCheckingAuth || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 font-semibold">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationMenu isOpen={isMenuOpen} toggleMenu={toggleMenu} />
      <Header />
      <main className="p-4 flex flex-col items-center justify-center">
        <div className="w-full max-w-2xl">
          <h1 className="text-2xl font-bold mb-6">Add New Product</h1>
          {showSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-center gap-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-700 font-semibold">Product created successfully</span>
            </div>
          )}
          <ProductAdjustCard
            p={defaultProduct}
            onSave={handleSave}
            onCancel={handleCancel}
            isAdding={true}
          />
        </div>
      </main>
    </div>
  );
}
