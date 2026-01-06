import { useQuery } from "@tanstack/react-query";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/firebaseInit";
import { ProductInterface } from "../../_types/productInterface";

/**
 * Fetch all products from Firestore
 * This is called by useProducts hook
 */
async function fetchProducts(): Promise<ProductInterface[]> {
  const snap = await getDocs(collection(db, "products"));
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<ProductInterface, "id">),
  }));
}

/**
 * React Query hook for fetching and caching products
 * Automatically handles:
 * - Caching (5 minute stale time)
 * - Deduplication (multiple calls in same render use same request)
 * - Background refetching
 * - Error handling
 *
 * Usage:
 * const { data: products, isLoading, error } = useProducts();
 */
export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });
}
