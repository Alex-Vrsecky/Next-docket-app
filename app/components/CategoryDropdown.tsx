// app/components/CategoryDropdown.tsx
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
  return (
    <div className="flex gap-2 mb-2">
      <select
        className="border rounded p-2 w-[150px]"
        value={selectedCategory}
        onChange={(e) => onCategoryChange(e.target.value)}
      >
        <option value="">—all categories—</option>
        {[...categories]
          .sort((a, b) =>
            sortOrder === "asc"
              ? (a.name || "").localeCompare(b.name || "")
              : (b.name || "").localeCompare(a.name || "")
          )
          .map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
      </select>
      <select
        className="border rounded p-2 disabled:opacity-50"
        value={selectedSubCategory}
        onChange={(e) => onSubCategoryChange(e.target.value)}
        disabled={!availableSubcats.length}
      >
        <option value="">—all sub‑categories—</option>
        {availableSubcats.map((sub) => (
          <option key={sub} value={sub}>
            {sub}
          </option>
        ))}
      </select>
    </div>
  );
}
