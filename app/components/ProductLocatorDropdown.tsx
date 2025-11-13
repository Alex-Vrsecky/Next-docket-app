"use client";

import CategoryButton from "./Buttons/CategoryButton";
import LocalNavigationButton from "./Buttons/LocalNavigationButton";
import FilterButton from "./Buttons/FilterButton";
import SearchBar from "./SearchBar";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CategoryInterface {
  name?: string;
  subCategories?: string[];
}

interface CategoryDropdownProps {
  categories: CategoryInterface[];
  availableSubcats: string[];
  selectedCategory: string;
  selectedSubCategory: string;
  selectedLength: string;
  onCategoryChange: (category: string) => void;
  onSubCategoryChange: (sub: string) => void;
  onLengthChange: (length: string) => void;
  availableLengths: string[];
  onSearchChange: (search: string) => void;
  searchQuery: string;
}

export default function CategoryDropdown({
  categories,
  availableSubcats,
  selectedLength,
  onCategoryChange,
  onSubCategoryChange,
  onLengthChange,
  availableLengths,
  onSearchChange,
  searchQuery,
}: CategoryDropdownProps) {
  const [activeView, setActiveView] = useState<"search" | "category">("search");

  const handleLengthChange = (length: string) => {
    if (selectedLength === length) {
      onLengthChange("");
    } else {
      onLengthChange(length);
    }
  };

  return (
    <div className="flex flex-col gap-2 p-4 items-center">
      {/* View Toggle Buttons */}
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
            onSearchChange("");
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
              onSearchChange={onSearchChange}
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
                {categories
                  .filter((c) => c.name)
                  .map((c, index) => (
                    <motion.div
                      key={c.name}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: 0.1 + index * 0.03,
                        duration: 0.2,
                      }}
                    >
                      <CategoryButton
                        name={c.name!}
                        onPress={() => onCategoryChange(c.name!)}
                      />
                    </motion.div>
                  ))}
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
                  className="w-full mb-4 overflow-hidden"
                >
                  <div className="flex justify-end mb-2">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
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
                          onPress={() => onSubCategoryChange(sub)}
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
                  className="w-full"
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
    </div>
  );
}