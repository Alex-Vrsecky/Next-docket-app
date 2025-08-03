// app/page.tsx (or wherever your main page is)
import CategoryFilter from "./components/CategoryFilter";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-6">Docket App</h1>
      <CategoryFilter />
      <Footer />
    </main>
  );
}

function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="w-full bg-gray-100 mt-8">
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row justify-between items-center">
        <p className="text-gray-600 text-sm">
          © {year} Docket App. All rights reserved. <br />{" "}
          <span className="text-xs">
            Developed & Maintained by Alex Vrsecky
          </span>
          <br />{" "}
          <span className="text-xs">Based on LoadAndGo by Jeremy Thompson</span>
        </p>
        <div className="space-x-4 mt-2 sm:mt-0">
          <a href="#" className="text-gray-600 hover:text-gray-800 text-sm">
            Privacy Policy
          </a>
          <a href="#" className="text-gray-600 hover:text-gray-800 text-sm">
            Terms of Service
          </a>
        </div>
      </div>
    </footer>
  );
}

// /* <p>Built and managed by Alex Vrsecky</p>
// <p></p>
