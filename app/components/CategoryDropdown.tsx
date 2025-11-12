"use client";

import { Button } from "@heroui/react";
import CategoryButton from "./CategoryButton";
import LocalNavigationButton from "./LocalNavigationButton";

interface CategoryInterface {
  name?: string;
  subCategories?: string[];
}

interface CategoryDropdownProps {
  categories: CategoryInterface[];
  availableSubcats: string[];
  selectedCategory: string;
  selectedSubCategory: string;
  selectedLength: string; // Keep this as a single string to allow only one selection
  onCategoryChange: (category: string) => void;
  onSubCategoryChange: (sub: string) => void;
  onLengthChange: (length: string) => void; // Change to handle single selection
  availableLengths: string[];
}

export default function CategoryDropdown({
  categories,
  availableSubcats,
  selectedCategory,
  selectedSubCategory,
  selectedLength,
  onCategoryChange,
  onSubCategoryChange,
  onLengthChange,
  availableLengths,
}: CategoryDropdownProps) {
  const sortedCategories = [...categories].sort((a, b) =>
    (a.name || "").localeCompare(b.name || "")
  );

  const handleLengthChange = (length: string) => {
    if (selectedLength === length) {
      // Deselect the length if it's already selected
      onLengthChange("");
    } else {
      // Select the new length
      onLengthChange(length);
    }
  };

  return (
    <div className="space-y-4">
      {/* Select search button */}
      <div className="flex">
        <LocalNavigationButton name="Search" onPress={() => null} />
        <LocalNavigationButton name="Category" onPress={() => null} />
      </div>

      {/* Category buttons */}
      <div className="h-full max-w-sm grid content-center row-span-2">
        <div className="grid grid-cols-4 gap-1">
          {sortedCategories
            .filter((c) => c.name)
            .map((c) => (
              <CategoryButton
                key={c.name}
                name={c.name!}
                onPress={() => onCategoryChange(c.name!)}
              />
            ))}
        </div>
      </div>

      <hr className="border-black/20" />

      {/* Subcategory buttons */}
      <div className="h-full max-w-sm grid content-center row-span-2">
        <div className="grid grid-cols-4 gap-4">
          {availableSubcats.map((sub) => (
            <CategoryButton
              key={sub}
              name={sub}
              onPress={() => onSubCategoryChange(sub)}
            />
          ))}
        </div>
      </div>

      <hr className="border-black/20" />

      {/* Length filter */}
      <div className="overflow-x-auto snap-x pt-1">
        <div className="flex flex-wrap gap-2 sm:gap-3 w-full justify-center">
          <button
            onClick={() => onLengthChange("")}
            disabled={!availableLengths.length}
            className={[
              "px-3 py-1.5 text-md sm:text-[20px] rounded-xs border shadow-sm transition snap-start",
              "hover:-translate-y-px hover:shadow",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[rgb(13,82,87)]",
              selectedLength === ""
                ? "bg-yellow-600 text-white border-yellow-600"
                : "bg-white text-gray-800 border-gray-300 hover:border-[rgb(13,82,87)]",
              !availableLengths.length &&
                "opacity-50 cursor-not-allowed hover:shadow-none hover:translate-y-0",
            ].join(" ")}
          >
            ngths
          </button>

          {[...availableLengths]
            .sort((a, b) => (parseFloat(a) || 0) - (parseFloat(b) || 0))
            .map((length) => (
              <button
                key={length}
                onClick={() => handleLengthChange(length)}
                className={[
                  "px-3 py-1.5 text-md sm:text-[20px] rounded-xs border shadow-sm transition",
                  "hover:-translate-y-px hover:shadow",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[rgb(13,82,87)]",
                  selectedLength === length
                    ? "bg-yellow-900 text-white border-yellow-900"
                    : "bg-white text-gray-800 border-gray-300 hover:border-[rgb(13,82,87)]",
                ].join(" ")}
              >
                {length}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
