// app/components/CategorySort.tsx
"use client";

interface CategorySortProps {
  sortOrder: "asc" | "desc";
  onChange: (val: "asc" | "desc") => void;
}
export default function CategorySort({
  sortOrder,
  onChange,
}: CategorySortProps) {
  return (
    <div className="flex gap-2 items-center mb-2">
      <label htmlFor="sortOrder" className="text-sm">
        Sort categories:
      </label>
      <select
        id="sortOrder"
        className="border rounded p-2"
        value={sortOrder}
        onChange={(e) => onChange(e.target.value as "asc" | "desc")}
      >
        <option value="asc">A–Z</option>
        <option value="desc">Z–A</option>
      </select>
    </div>
  );
}
