"use client";

import { Suspense } from "react";
import Header from "./components/Header";
import CategoryDropdown from "./components/CategoryDropdown";
import { Footer } from "./components/Footer";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center min-h-screen bg-gray-50 p-6">
      <Header />
      <Suspense fallback={<div>Loading products...</div>}>
        <CategoryDropdown />
      </Suspense>
      <Footer />
    </main>
  );
}

