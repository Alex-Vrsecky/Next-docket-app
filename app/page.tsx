// app/page.tsx (or wherever your main page is)
import CategoryFilter from "./components/CategoryFilter";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-6">Browse Products</h1>
      <CategoryFilter />
    </main>
  );
}
