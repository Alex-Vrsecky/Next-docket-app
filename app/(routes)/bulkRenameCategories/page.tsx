'use client';
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/firebaseInit";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { ProductInterface } from "../../_types/productInterface";
import { BulkRenameModal } from "../../components/BulkRename";
import Header from "@/app/components/Header";

const AUTHORIZED_USERS = ["alex", "karlee", "ben"];

export default function BulkRenameCategoriesPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductInterface[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

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
              user.email?.split("@")[0] ||
              ""
            ).toLowerCase();
          }
        }

        if (AUTHORIZED_USERS.includes(firstName)) {
          setIsAuthorized(true);
          setIsCheckingAuth(false);
        } else {
          router.push("/");
          return;
        }
      } catch {
        router.push("/userSignIn");
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Fetch products
  useEffect(() => {
    if (!isAuthorized) return;

    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const data = querySnapshot.docs.map(
          (doc) =>
            ({
              ...doc.data(),
              id: doc.id,
            }) as ProductInterface
        );
        setProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [isAuthorized]);

  if (isCheckingAuth || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 p-6">
        <Header />
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors"
          >
            ← Back
          </button>
        </div>

        <BulkRenameModal
          products={products}
          onClose={() => router.back()}
          onSave={(updatedProducts) => {
            setProducts(updatedProducts);
            router.back();
          }}
        />
      </div>
    </div>
  );
}
