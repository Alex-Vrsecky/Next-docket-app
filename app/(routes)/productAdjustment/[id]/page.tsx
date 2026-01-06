"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/app/firebase/firebaseInit";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import NavigationMenu from "@/app/components/NavigationMenu";
import Header from "@/app/components/Header";
import ProductAdjustCard from "@/app/components/Cards/ProductAdjustCard";
import { ProductInterface } from "@/app/_types/productInterface";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const productId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [product, setProduct] = useState<ProductInterface | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // Check authentication and authorization
  useEffect(() => {
    const auth = getAuth();
    let isMounted = true;
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        setIsCheckingAuth(false);
        setError("Authentication check timed out");
      }
    }, 10000); // 10 second timeout

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return;

      clearTimeout(timeoutId);

      if (!user) {
        router.push(
          `/userSignIn?redirect=${encodeURIComponent("/productAdjustment")}`
        );
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
          setError(
            "Access denied. Only authorized users can access this page."
          );
        }
      } catch (err) {
        console.error("Error checking authorization:", err);
        setError("Error checking authorization.");
      } finally {
        if (isMounted) {
          setIsCheckingAuth(false);
        }
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [router]);

  // Fetch product data
  useEffect(() => {
    if (!isCheckingAuth && isAuthorized && productId) {
      (async () => {
        try {
          setLoading(true);
          
          // Try to fetch by document ID first
          const productRef = doc(db, "products", productId);
          const productSnap = await getDoc(productRef);
          
          if (productSnap.exists()) {
            const fetchedProduct = {
              id: productSnap.id,
              ...(productSnap.data() as Omit<ProductInterface, "id">),
            };
            setProduct(fetchedProduct);
          } else {
            setError("Product not found");
          }
        } catch (err) {
          console.error("Error fetching product:", err);
          setError("Error loading product");
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [isCheckingAuth, isAuthorized, productId]);

  const handleSave = async (updatedProduct: ProductInterface) => {
    try {
      const docId = productId;
      const productRef = doc(db, "products", docId);
      
      await updateDoc(productRef, {
        Desc: updatedProduct.Desc || "",
        Extra: updatedProduct.Extra || "",
        LengthCoveragePackaging: updatedProduct.LengthCoveragePackaging || "",
        category: updatedProduct.category || "",
        imageSrc: updatedProduct.imageSrc || "",
        priceWithNote: updatedProduct.priceWithNote || "",
        productIN: updatedProduct.productIN || "",
        subCategory: updatedProduct.subCategory || "",
        Length: updatedProduct.Length || "",
      });

      setShowSuccess(true);
      setTimeout(() => {
        const queryString = searchParams.toString();
        router.push(`/productAdjustment${queryString ? `?${queryString}` : ""}`);
      }, 500);
    } catch (err) {
      console.error("Error saving product:", err);
      alert("Failed to save product: " + (err instanceof Error ? err.message : String(err)));
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading product...</p>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <NavigationMenu isOpen={isMenuOpen} toggleMenu={toggleMenu} />
        <main className="p-4">
          <div className="text-center text-red-500">
            <p>{error}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Go Back
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationMenu isOpen={isMenuOpen} toggleMenu={toggleMenu} />
      <Header />
      <main className="p-4 flex flex-col items-center justify-center">
        <div className="w-full max-w-2xl">
          <h1 className="text-2xl font-bold mb-6">Edit Product</h1>
          {showSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-center gap-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-700 font-semibold">Product saved successfully</span>
            </div>
          )}
          {product && (
            <ProductAdjustCard
              p={product}
              onSave={handleSave}
              onCancel={handleCancel}
              isAdding={false}
            />
          )}
        </div>
      </main>
    </div>
  );
}
