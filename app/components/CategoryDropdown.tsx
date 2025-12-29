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
  updateDoc,
  addDoc,
} from "firebase/firestore";
import { db } from "../firebase/firebaseInit";
import { motion, AnimatePresence } from "framer-motion";
import CategoryButton from "./Buttons/CategoryButton";
import LocalNavigationButton from "./Buttons/LocalNavigationButton";
import FilterButton from "./Buttons/FilterButton";
import SearchBar from "./SearchBar";
import ProductCard from "./Cards/ProductCard";
import ProductAdjustCard from "./Cards/ProductAdjustCard";
import { BulkRenameModal } from "./BulkRename";
import { usePathname } from "next/navigation";
import { sortLengths } from "../_lib/sortLengths";
import { ProductInterface } from "../_types/productInterface";
import { looksNumericish } from "../_lib/lookNumericish";
import { CategoryInterface } from "../_types/categoryInterface";

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
  { aisle: 5, name: "posts" },
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

  // All products from DB - fetched once
  const [allProducts, setAllProducts] = useState<ProductInterface[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("");
  const [selectedLength, setSelectedLength] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeView, setActiveView] = useState<"search" | "category">("search");
  const [showBulkRename, setShowBulkRename] = useState(false);

  // Edit/Add states
  const [editingProduct, setEditingProduct] = useState<ProductInterface | null>(
    null
  );
  const [isAddingNew, setIsAddingNew] = useState(false);

  const pathname = usePathname();
  const isManage = pathname === "/productAdjustment";

  // Fetch all products once on mount
  useEffect(() => {
    (async () => {
      try {
        console.log("Fetching products from Firestore...");
        setLoading(true);
        const snap = await getDocs(collection(db, "products"));
        const products = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<ProductInterface, "id">),
        }));
        setAllProducts(products);
        console.log(`Fetched ${products.length} products.`);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
    const searchLower = searchQuery.toLowerCase().trim();

    return allProducts
      .filter((p) => {
        if (!searchQuery) {
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
    allProducts,
    selectedCategory,
    selectedSubCategory,
    selectedLength,
    searchQuery,
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
    if (searchQuery) {
      setSelectedCategory("");
      setSelectedSubCategory("");
      setSelectedLength("");
    }
  }, [searchQuery]);

  // Add new product handler
  const handleAddNew = useCallback(() => {
    setShowBulkRename(false);
    setIsAddingNew((prev) => !prev);
    setEditingProduct(null);
  }, []);

  const handleBulkRename = useCallback(() => {
    setShowBulkRename((prev) => !prev);
    setIsAddingNew(false);
    setEditingProduct(null);
  }, []);

  // Edit product handler
  const handleEdit = useCallback(
    (productId: string) => {
      const product = allProducts.find((p) => p.id === productId);
      if (product) {
        setIsAddingNew(false);
        setEditingProduct(product);
      }
    },
    [allProducts]
  );

  // Save product handler (add or update)
  const handleSave = async (updatedProduct: ProductInterface) => {
    try {
      if (isAddingNew) {
        // Add new product
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

        setAllProducts((prev) => [...prev, newProduct]);
        setIsAddingNew(false);
        setEditingProduct(null);
      } else {
        // Update existing product
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

        setAllProducts((prev) =>
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

  // Cancel edit handler
  const handleCancel = useCallback(() => {
    setEditingProduct(null);
    setIsAddingNew(false);
  }, []);

  // Delete product by productIN
  const handleDelete = useCallback(
    async (productIN: string) => {
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

        // Clear editing state if deleted product was being edited
        if (editingProduct?.productIN === productIN) {
          setEditingProduct(null);
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error("Error deleting products:", err);
        alert("Failed to delete product: " + err.message);
      }
    },
    [editingProduct]
  );

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

  if (loading) {
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
                className="w-full mb-4 bg-[rgb(13,82,87)] text-white rounded-lg font-semibold hover:bg-[rgb(10,65,69)] transition-colors text-xs"
              >
                Bulk Rename Categories
              </button>
              <button
                onClick={handleAddNew}
                className="w-40 py-2 mb-4 bg-[rgb(13,82,87)] text-white rounded-lg font-semibold hover:bg-[rgb(10,65,69)] transition-colors text-xs"
                title="Add New Product"
              >
                Add New
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
          {(editingProduct || isAddingNew) && (
            <div className="mb-6 flex justify-center">
              <ProductAdjustCard
                p={editingProduct}
                onSave={handleSave}
                onCancel={handleCancel}
                isAdding={isAddingNew}
              />
            </div>
          )}

          {/* Bulk Rename */}
          {showBulkRename && (
            <BulkRenameModal
              products={allProducts}
              onClose={() => setShowBulkRename(false)}
              onSave={(updatedProducts) => {
                setAllProducts(updatedProducts);
                setShowBulkRename(false);
              }}
            />
          )}
          <div className="flex flex-wrap gap-4 justify-center max-w-[300px]">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  p={p}
                  onDelete={() => handleDelete(p.productIN)}
                  onEdit={() => handleEdit(p.id)}
                />
              ))
            ) : (
              <p className="col-span-full text-center text-gray-500">
                No products match your filters.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
