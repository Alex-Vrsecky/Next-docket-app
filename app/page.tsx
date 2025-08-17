// app/page.tsx (or wherever your main page is)
import CategoryFilter from "./components/CategoryFilter";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center min-h-screen bg-gray-50 p-6">
      <div className="mb-6 flex items-center gap-2 select-none">
        {/* Simple clipboard icon */}
        <div className="grid h-8 w-8 place-items-center rounded-md bg-[rgb(13,82,87)] text-white">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 3h6a2 2 0 0 1 2 2v1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h1V5a2 2 0 0 1 2-2z" />
            <path d="M9 5h6v2H9z" />
          </svg>
        </div>

        {/* Wordmark */}
        <span className="text-2xl font-bold tracking-tight text-gray-900">
          Docket<span className="text-[rgb(13,82,87)]">App</span>
        </span>
      </div>

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
