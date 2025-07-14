"use client";

interface CategoryInterface {
  name?: string;
  subCategories?: string[];
}

interface CategoryDropdownProps {
  categories: CategoryInterface[];
  availableSubcats: string[];
  selectedCategory: string;
  selectedSubCategory: string;
  onCategoryChange: (category: string) => void;
  onSubCategoryChange: (sub: string) => void;
  sortOrder: "asc" | "desc";
}

export default function CategoryDropdown({
  categories,
  availableSubcats,
  selectedCategory,
  selectedSubCategory,
  onCategoryChange,
  onSubCategoryChange,
  sortOrder,
}: CategoryDropdownProps) {
  const sortedCategories = [...categories].sort((a, b) =>
    sortOrder === "asc"
      ? (a.name || "").localeCompare(b.name || "")
      : (b.name || "").localeCompare(a.name || "")
  );

  return (
    <div className="space-y-4">
      {/* Category buttons (scrollable row on mobile) */}
      <div className="overflow-x-auto">
        <div className="flex gap-2 w-max sm:w-auto flex-nowrap sm:flex-wrap">
          <button
            onClick={() => onCategoryChange("")}
            className={`px-4 py-2 text-sm rounded-lg whitespace-nowrap border ${
              selectedCategory === ""
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-800"
            }`}
          >
            All Categories
          </button>
          {sortedCategories.map((c) => (
            <button
              key={c.name}
              onClick={() => onCategoryChange(c.name!)}
              className={`px-4 py-2 text-sm rounded-lg whitespace-nowrap border ${
                selectedCategory === c.name
                  ? "bg-green-900 text-white"
                  : "bg-white text-gray-800"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>
      <br />
      <br />

      {/* Subcategory buttons */}
      <div className="overflow-x-auto">
        <div className="flex gap-2 w-max sm:w-auto flex-nowrap sm:flex-wrap">
          <button
            onClick={() => onSubCategoryChange("")}
            disabled={!availableSubcats.length}
            className={`px-4 py-2 text-sm rounded-lg whitespace-nowrap border ${
              selectedSubCategory === ""
                ? "bg-green-700 text-white"
                : "bg-white text-gray-800"
            } ${
              !availableSubcats.length ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            All Sub-Categories
          </button>

          {availableSubcats.map((sub) => (
            <button
              key={sub}
              onClick={() => onSubCategoryChange(sub)}
              className={`px-4 py-2 text-sm rounded-lg whitespace-nowrap border ${
                selectedSubCategory === sub
                  ? "bg-green-900 text-white"
                  : "bg-white text-gray-800"
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
