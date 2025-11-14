"use client";

import Header from "./components/Header";
import CategoryDropdown from "./components/CategoryDropdown";
import { Footer } from "./components/Footer";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center min-h-screen bg-gray-50 p-6">
      <Header />
      <CategoryDropdown />
      <Footer />
    </main>
  );
}

