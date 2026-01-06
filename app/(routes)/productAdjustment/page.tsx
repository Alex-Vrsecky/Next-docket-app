"use client";

import { useState, useEffect } from "react";

import { doc, getDoc } from "firebase/firestore";
import { db } from "@/app/firebase/firebaseInit";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import NavigationMenu from "../../components/NavigationMenu";
import Header from "../../components/Header";
import CategoryDropdown from "../../components/CategoryDropdown";
import { BulkImportModal } from "../../components/BulkImportModal";
import { QuickAddModal } from "../../components/QuickAddModal";
import { CSVImportModal } from "../../components/CSVImportModal";

export default function Page() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Import modal states
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);

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
        router.push(`/userSignIn?redirect=${encodeURIComponent(pathname)}`);
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
          firstName === "ben" ||
          firstName === "mark"
        ) {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
          setError(
            "Access denied. Only Alex, Karlee, Ben, or Mark can access this page."
          );
        }
      } catch (err) {
        console.error("Error checking authorization:", err);
        setIsAuthorized(false);
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
  }, [router, pathname]);

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

      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm max-w-[350px]">
          {successMessage}
        </div>
      )}

      <div className="w-full max-w-[300px]">
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setShowQuickAdd(true)}
            className="px-3 py-2 bg-[rgb(13,82,87)] text-white rounded-lg font-semibold hover:bg-[rgb(10,65,69)] transition-colors text-xs"
            title="Add single product quickly"
          >
            Add
          </button>
          <button
            onClick={() => setShowBulkImport(true)}
            className="px-3 py-2 bg-[rgb(13,82,87)] text-white rounded-lg font-semibold hover:bg-[rgb(10,65,69)] transition-colors text-xs"
            title="Add same product with different lengths"
          >
            Bulk Add
          </button>
          <button
            onClick={() => setShowCSVImport(true)}
            className="px-3 py-2 bg-[rgb(13,82,87)] text-white rounded-lg font-semibold hover:bg-[rgb(10,65,69)] transition-colors text-xs"
            title="Import from CSV file"
          >
            CSV Import
          </button>
        </div>
      </div>

      <div className="w-full max-w-[330px] mb-8">
        <div className="flex justify-center gap-2 mb-4">
          <CategoryDropdown />
        </div>
      </div>

      {/* Import Modals */}
      <QuickAddModal
        isOpen={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        onSuccess={(product) => {
          setSuccessMessage(`✓ Added: ${product.Desc}`);
          setTimeout(() => setSuccessMessage(null), 3000);
        }}
      />

      <BulkImportModal
        isOpen={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        onSuccess={(products) => {
          setSuccessMessage(`✓ Added ${products.length} products`);
          setTimeout(() => setSuccessMessage(null), 3000);
        }}
      />

      <CSVImportModal
        isOpen={showCSVImport}
        onClose={() => setShowCSVImport(false)}
        onSuccess={(products) => {
          setSuccessMessage(`✓ Imported ${products.length} products`);
          setTimeout(() => setSuccessMessage(null), 3000);
        }}
      />
    </div>
  );
}
