"use client";

import { useState, useEffect } from "react";

import { doc, getDoc } from "firebase/firestore";
import { db } from "@/app/firebase/firebaseInit";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import NavigationMenu from "../../components/NavigationMenu";
import Header from "../../components/Header";
import CategoryDropdown from "../../components/CategoryDropdown";

export interface ProductInterface {
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

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

        console.log("First name:", firstName);

        if (
          firstName === "alex" ||
          firstName === "karlee" ||
          firstName === "ben"
        ) {
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        setError("Failed to load products.");
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [isAuthorized, isCheckingAuth]);

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
        <p className="text-gray-600 mt-2">This is the restricted section.</p>
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
    <div className="flex flex-col items-center min-h-screen bg-gray-50 pt-6">
      <NavigationMenu isOpen={isMenuOpen} toggleMenu={toggleMenu} />
      <Header />
      <div className="w-full max-w-[330px] mb-8">
        <div className="flex justify-center gap-2 mb-4">
          <CategoryDropdown />
        </div>
      </div>
    </div>
  );
}
