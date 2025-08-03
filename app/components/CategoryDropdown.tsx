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
      <hr className="border-black" />
      {/* Category buttons (flex layout with wrapping) */}
      <div className="overflow-x-auto">
        <div className="flex flex-wrap gap-2 sm:gap-4 w-full">
          <button
            onClick={() => onCategoryChange("")}
            className={`px-2 py-1 text-md sm:text-[20px] rounded-md whitespace-normal border ${
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
              className={`px-2 py-1 text-md sm:text-[20px] rounded-md whitespace-normal border ${
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

      <hr className="border-black" />

      {/* Subcategory buttons */}
      <div className="overflow-x-auto">
        <div className="flex flex-wrap gap-2 sm:gap-4 w-full">
          <button
            onClick={() => onSubCategoryChange("")}
            disabled={!availableSubcats.length}
            className={`px-2 py-1 text-md sm:text-[20px] rounded-md whitespace-normal border ${
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
              className={`px-2 py-1 text-md sm:text-[20px] rounded-md whitespace-normal border ${
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

      <hr className="border-black" />

      {/* Length filter dropdown (single-select) */}
      <div className="overflow-x-auto">
        <div className="flex flex-wrap gap-2 sm:gap-4 w-full">
          <button
            onClick={() => onLengthChange("")}
            disabled={!availableLengths.length}
            className={`px-2 py-1 text-md sm:text-[20px] rounded-md whitespace-normal border ${
              selectedLength === ""
                ? "bg-yellow-600 text-white"
                : "bg-white text-gray-800"
            } ${
              !availableLengths.length ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            All Lengths
          </button>

          {[...availableLengths]
            .sort((a, b) => parseFloat(a) - parseFloat(b))
            .map((length) => (
              <button
                key={length}
                onClick={() => handleLengthChange(length)}
                className={`px-2 py-1 text-md sm:text-[20px] rounded-md whitespace-normal border ${
                  selectedLength === length
                    ? "bg-yellow-900 text-white"
                    : "bg-white text-gray-800"
                }`}
              >
                {length}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
