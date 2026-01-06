"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  query as fsQuery,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebaseInit";
import { motion, AnimatePresence } from "framer-motion";
import CategoryButton from "./Buttons/CategoryButton";
import LocalNavigationButton from "./Buttons/LocalNavigationButton";
import FilterButton from "./Buttons/FilterButton";
import SearchBar from "./SearchBar";
import ProductCard from "./Cards/ProductCard";
import { BulkEditModal } from "./BulkEditModal";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { sortLengths } from "../_lib/sortLengths";
import { ProductInterface } from "../_types/productInterface";
import { looksNumericish } from "../_lib/lookNumericish";
import { CategoryInterface } from "../_types/categoryInterface";
import { useDebounce } from "../_lib/useDebounce";
import { useProducts } from "../_lib/hooks/useProducts";

// ---------- helpers (defined outside component) ----------
const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

const CATEGORY_PRIORITY_OBJECT = [
  { aisle: 5, name: "untreated pine" },
  { aisle: 4, name: "treated pine" },
  { aisle: 1, name: "fencing" },
  { aisle: 1, name: "sleepers" },
  { aisle: 999, name: "offcuts" },
  { aisle: 6, name: "yellow tongue" },
  { aisle: 2, name: "posts" },
  { aisle: 3, name: "decking" },
  { aisle: 2, name: "cement sheet" },
  { aisle: 6, name: "plaster board" },
  { aisle: 999, name: "blocks / brick" },
  { aisle: 4, name: "concrete" },
  { aisle: 999, name: "grass" },
  { aisle: 999, name: "losp" },
  { aisle: 5, name: "lvls" },
  { aisle: 999, name: "masonite" },
  { aisle: 6, name: "ply mdf particleboard" },
  { aisle: 999, name: "screening" },
  { aisle: 1, name: "steel retainer" },
  { aisle: 999, name: "weather board" },
];

export default function CategoryDropdown() {
  const [, startTransition] = useTransition();

  // Pagination constants
  const ITEMS_PER_PAGE = 50;

  // Fetch products using React Query (automatic caching)
  const { data: products = [], isLoading } = useProducts();

  // All products from DB - fetched once
  const [allProducts, setAllProducts] = useState<ProductInterface[]>([]);
  const [displayedProducts, setDisplayedProducts] = useState<
    ProductInterface[]
  >([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("");
  const [selectedLength, setSelectedLength] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300); // Debounce search with 300ms delay
  const [activeView, setActiveView] = useState<"search" | "category">(
    "category"
  );

  // Selection states
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set()
  );
  const [showBulkEdit, setShowBulkEdit] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isManage = pathname === "/productAdjustment";

  // Initialize filter state from URL parameters
  useEffect(() => {
    const category = searchParams.get("category") || "";
    const subCategory = searchParams.get("subCategory") || "";
    const length = searchParams.get("length") || "";
    const search = searchParams.get("search") || "";

    if (category) setSelectedCategory(category);
    if (subCategory) setSelectedSubCategory(subCategory);
    if (length) setSelectedLength(length);
    if (search) setSearchQuery(search);
  }, [searchParams]);

  // Fetch all products once on mount
  useEffect(() => {
    if (products && products.length > 0) {
      setAllProducts(products);

      // Display first page
      const pageSize = ITEMS_PER_PAGE;
      setDisplayedProducts(products.slice(0, pageSize));
      setCurrentPage(1);
      setHasMore(products.length > pageSize);

      console.log(
        `Fetched ${products.length} products. Displaying first ${pageSize}.`
      );
    }
  }, [products, ITEMS_PER_PAGE]);

  // Derive categories from all products (unsorted initially for faster render)
  const categories = useMemo(() => {
    const byCat: Record<string, Record<string, number>> = {};

    allProducts.forEach((p) => {
      const cat = p.category || "";
      const sub = p.subCategory || "";
      if (!cat) return;

      byCat[cat] ||= {};
      if (sub) byCat[cat][sub] = (byCat[cat][sub] || 0) + 1;
    });

    const arr: CategoryInterface[] = Object.entries(byCat).map(
      ([categoryName, subcatCounts]) => {
        const total = Object.values(subcatCounts).reduce((a, b) => a + b, 0);
        const entries = Object.entries(subcatCounts);
        const numericish = entries.every(([name]) => looksNumericish(name));

        const subCategories = entries
          .sort((a, b) => {
            if (numericish) return collator.compare(a[0], b[0]);
            if (b[1] !== a[1]) return b[1] - a[1];
            return collator.compare(a[0], b[0]);
          })
          .map(([subcat]) => subcat);

        return { name: categoryName, subCategories, total };
      }
    );

    return arr;
  }, [allProducts]);

  // Helper function to find aisle for a category
  const findAisle = (categoryName: string): number => {
    const found = CATEGORY_PRIORITY_OBJECT.find(
      (item) => item.name.toLowerCase() === categoryName.toLowerCase()
    );
    return found?.aisle ?? 999; // 999 = unknown/last
  };

  // Sort categories by aisle (non-blocking with useTransition)
  const [sortedCategories, setSortedCategories] = useState<CategoryInterface[]>(
    []
  );

  useEffect(() => {
    startTransition(() => {
      const sorted = [...categories].sort((a, b) => {
        const aisleA = findAisle(a.name || "");
        const aisleB = findAisle(b.name || "");
        if (aisleA !== aisleB) return aisleA - aisleB;
        return collator.compare(a.name || "", b.name || "");
      });
      setSortedCategories(sorted);
    });
  }, [categories, startTransition]);

  // Derive available subcategories based on selected category
  const availableSubcats = useMemo(() => {
    if (!selectedCategory) return [];
    const cat = sortedCategories.find((c) => c.name === selectedCategory);
    return cat?.subCategories ?? [];
  }, [selectedCategory, sortedCategories]);

  // Derive available lengths based on selected category and subcategory
  const availableLengths = useMemo(() => {
    if (!selectedCategory || !selectedSubCategory) return [];

    const lengths = allProducts
      .filter(
        (p) =>
          p.category === selectedCategory &&
          p.subCategory === selectedSubCategory
      )
      .map((p) => String(p.Length || ""));

    const unique = Array.from(new Set(lengths));
    unique.sort(sortLengths);
    return unique;
  }, [selectedCategory, selectedSubCategory, allProducts]);

  // Filter products based on selections AND search query
  const filteredProducts = useMemo(() => {
    const searchLower = debouncedSearchQuery.toLowerCase().trim();

    return displayedProducts
      .filter((p) => {
        if (!debouncedSearchQuery) {
          if (selectedCategory && p.category !== selectedCategory) return false;
          if (selectedSubCategory && p.subCategory !== selectedSubCategory)
            return false;
          if (selectedLength && p.Length !== selectedLength) return false;
          return true;
        }

        if (searchLower) {
          const matchesSearch =
            (p.category || "").toLowerCase().includes(searchLower) ||
            (p.subCategory || "").toLowerCase().includes(searchLower) ||
            (p.Desc || "").toLowerCase().includes(searchLower) ||
            (p.Extra || "").toLowerCase().includes(searchLower) ||
            (p.productIN || "").toLowerCase().includes(searchLower) ||
            (p.Length || "").toLowerCase().includes(searchLower) ||
            (p.LengthCoveragePackaging || "")
              .toLowerCase()
              .includes(searchLower);

          return matchesSearch;
        }

        return true;
      })
      .sort((a, b) => sortLengths(a.Length, b.Length));
  }, [
    displayedProducts,
    selectedCategory,
    selectedSubCategory,
    selectedLength,
    debouncedSearchQuery,
  ]);

  // Reset subcategory when category changes
  useEffect(() => {
    if (!selectedCategory) {
      setSelectedSubCategory("");
      setSelectedLength("");
      return;
    }

    if (availableSubcats.length === 1) {
      setSelectedSubCategory(availableSubcats[0]);
    } else if (!availableSubcats.includes(selectedSubCategory)) {
      setSelectedSubCategory("");
      setSelectedLength("");
    }
  }, [selectedCategory, availableSubcats, selectedSubCategory]);

  // Reset length when subcategory changes
  useEffect(() => {
    if (!selectedSubCategory) {
      setSelectedLength("");
      return;
    }

    if (!availableLengths.includes(selectedLength)) {
      setSelectedLength("");
    }
  }, [selectedSubCategory, availableLengths, selectedLength]);

  // Clear category filters when searching
  useEffect(() => {
    if (debouncedSearchQuery) {
      setSelectedCategory("");
      setSelectedSubCategory("");
      setSelectedLength("");
    }
  }, [debouncedSearchQuery]);

  // Load more products when a category is selected
  useEffect(() => {
    if (selectedCategory && allProducts.length > displayedProducts.length) {
      setTimeout(() => {
        setDisplayedProducts(allProducts);
      }, 300);
    }
  }, [selectedCategory, allProducts, displayedProducts.length]);

  // Pagination handlers
  const handleLoadMore = useCallback(() => {
    const nextPage = currentPage + 1;
    const start = (nextPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const newProducts = allProducts.slice(0, end);
    setDisplayedProducts(newProducts);
    setCurrentPage(nextPage);
    setHasMore(end < allProducts.length);
  }, [currentPage, allProducts]);

  const handlePreviousPage = useCallback(() => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      const end = prevPage * ITEMS_PER_PAGE;
      const newProducts = allProducts.slice(0, end);
      setDisplayedProducts(newProducts);
      setCurrentPage(prevPage);
      setHasMore(true); // Always can go next after going back
    }
  }, [currentPage, allProducts]);


  const handleBulkRename = useCallback(() => {
    router.push("/bulkRenameCategories");
  }, [router]);

  // Selection handlers
  const handleSelectProduct = useCallback((productId: string) => {
    setSelectedProducts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map((p) => p.id)));
    }
  }, [filteredProducts, selectedProducts.size]);

  const handleBulkEdit = useCallback(() => {
    setShowBulkEdit((prev) => !prev);
  }, []);

  // Delete product by productIN
  const handleDelete = useCallback(async (productIN: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete product ${productIN}?`
    );
    if (!confirmDelete) return;

    try {
      const q = fsQuery(
        collection(db, "products"),
        where("productIN", "==", productIN)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        console.warn("No products found with productIN:", productIN);
        return;
      }

      await Promise.all(
        snapshot.docs.map((snap) => deleteDoc(doc(db, "products", snap.id)))
      );

      setAllProducts((prev) => prev.filter((p) => p.productIN !== productIN));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Error deleting products:", err);
      alert("Failed to delete product: " + err.message);
    }
  }, []);

  const handleLengthChange = useCallback(
    (length: string) => {
      if (selectedLength === length) {
        setSelectedLength("");
      } else {
        setSelectedLength(length);
      }
    },
    [selectedLength]
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-500">Loading products...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Filters Section */}
      <div className="flex flex-col gap-2 p-4">
        {/* View Toggle Buttons */}
        {isManage && (
          <>
            <div className="flex gap-2">
              <button
                onClick={handleBulkRename}
                className="w-full h-8 mb-4 bg-[rgb(13,82,87)] text-white rounded-lg font-semibold hover:bg-[rgb(10,65,69)] transition-colors text-xs"
              >
                Bulk Rename Categories
              </button>
            </div>
          </>
        )}
        <div className="flex gap-2 w-full max-w-[350px] mb-2">
          <LocalNavigationButton
            name="Search"
            onPress={() => setActiveView("search")}
            isActive={activeView === "search"}
          />
          <LocalNavigationButton
            name="Category"
            onPress={() => {
              setActiveView("category");
              setSearchQuery("");
            }}
            isActive={activeView === "category"}
          />
        </div>

        {/* Animated View Transitions */}
        <AnimatePresence mode="wait">
          {/* Search View */}
          {activeView === "search" && (
            <motion.section
              key="search"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="w-full max-w-[350px]"
            >
              <SearchBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                placeholder="Search products..."
              />
            </motion.section>
          )}

          {/* Category View */}
          {activeView === "category" && (
            <motion.section
              key="category"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="w-full max-w-[350px]"
            >
              {/* Category Buttons */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="w-full mb-4"
              >
                <div className="flex justify-end mb-2">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Categories
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {sortedCategories
                    .filter((c) => c.name)
                    .map((c, index) => {
                      const aisle = findAisle(c.name || "");
                      return (
                        <motion.div
                          key={c.name}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{
                            delay: 0.1 + index * 0.03,
                            duration: 0.2,
                          }}
                          className="relative"
                        >
                          {aisle !== 999 && (
                            <div className="absolute -top-2 -right-2 bg-[rgb(13,82,87)] text-white text-xs font-semibold rounded-full w-6 h-6 flex items-center justify-center z-10">
                              {aisle}
                            </div>
                          )}
                          <CategoryButton
                            name={c.name!}
                            onPress={() => setSelectedCategory(c.name!)}
                          />
                        </motion.div>
                      );
                    })}
                </div>
              </motion.div>

              {/* Subcategory Buttons */}
              <AnimatePresence mode="wait">
                {availableSubcats.length > 0 && (
                  <motion.div
                    key="subcategories"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-[350px] mb-4"
                  >
                    <div className="flex justify-end mb-2">
                      <span className="text-xs font-medium text-gray-500 uppercase">
                        Subcategories
                      </span>
                    </div>
                    <hr className="border-t border-black/20 mb-2 shadow-sm shadow-black/20" />
                    <div className="grid grid-cols-4 gap-4">
                      {availableSubcats.map((sub, index) => (
                        <motion.div
                          key={sub}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{
                            delay: index * 0.03,
                            duration: 0.2,
                          }}
                        >
                          <CategoryButton
                            name={sub}
                            onPress={() => setSelectedSubCategory(sub)}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Length Filter */}
              <AnimatePresence mode="wait">
                {availableLengths.length > 1 && (
                  <motion.div
                    key="lengths"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-[350px] mb-4"
                  >
                    <div className="flex justify-end mb-2">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Lengths
                      </span>
                    </div>
                    <hr className="border-t border-black/20 mb-2 shadow-sm shadow-black/20" />
                    <div className="grid grid-cols-4 gap-4">
                      {[...availableLengths]
                        .sort(
                          (a, b) => (parseFloat(a) || 0) - (parseFloat(b) || 0)
                        )
                        .map((length, index) => (
                          <motion.div
                            key={length}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{
                              delay: index * 0.02,
                              duration: 0.2,
                            }}
                          >
                            <FilterButton
                              name={length}
                              onPress={() => handleLengthChange(length)}
                            />
                          </motion.div>
                        ))
                        .reverse()}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Products Display Section */}
        <div className="w-full flex flex-col items-center justify-center">
          {/* Bulk Edit */}
          {showBulkEdit && selectedProducts.size > 0 && (
            <BulkEditModal
              products={
                Array.from(selectedProducts)
                  .map((id) => allProducts.find((p) => p.id === id))
                  .filter(Boolean) as ProductInterface[]
              }
              onClose={() => setShowBulkEdit(false)}
              onSave={(updatedProducts) => {
                const updatedAll = allProducts.map((p) => {
                  const updated = updatedProducts.find((u) => u.id === p.id);
                  return updated || p;
                });
                setAllProducts(updatedAll);
                setShowBulkEdit(false);
                setSelectedProducts(new Set());
              }}
            />
          )}

          {/* Selection Controls */}
          {isManage && selectedProducts.size > 0 && (
            <div className="mb-4 w-full max-w-[350px] flex gap-2">
              <button
                onClick={handleSelectAll}
                className="flex-1 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200 transition-colors text-sm"
              >
                {selectedProducts.size === filteredProducts.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
              <button
                onClick={handleBulkEdit}
                className="flex-1 py-2 bg-[rgb(13,82,87)] text-white rounded-lg font-semibold hover:bg-[rgb(10,65,69)] transition-colors text-sm"
              >
                Edit ({selectedProducts.size})
              </button>
              <button
                onClick={() => setSelectedProducts(new Set())}
                className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-sm"
              >
                Clear
              </button>
            </div>
          )}
          <div className="flex flex-wrap gap-4 justify-center max-w-[300px]">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  p={p}
                  onDelete={() => handleDelete(p.productIN)}
                  filters={{
                    category: selectedCategory,
                    subCategory: selectedSubCategory,
                    length: selectedLength,
                    search: searchQuery,
                  }}
                  isSelected={selectedProducts.has(p.id)}
                  onSelect={handleSelectProduct}
                />
              ))
            ) : (
              <p className="col-span-full text-center text-gray-500">
                No products match your filters.
              </p>
            )}
          </div>

          {/* Pagination Controls */}
          {allProducts.length > ITEMS_PER_PAGE && (
            <div className="mt-6 w-full max-w-[350px] flex gap-2 justify-center">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                ← Previous
              </button>
              <div className="px-4 py-2 flex items-center text-sm font-medium text-gray-600">
                Page {currentPage} of{" "}
                {Math.ceil(allProducts.length / ITEMS_PER_PAGE)}
              </div>
              <button
                onClick={handleLoadMore}
                disabled={!hasMore}
                className="px-4 py-2 bg-[rgb(13,82,87)] text-white rounded-lg font-semibold hover:bg-[rgb(10,65,69)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
