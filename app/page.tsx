"use client";

import { ClipboardList, Menu, NotebookPen } from "lucide-react";
import CategoryFilter from "./components/CategoryFilter";
import { useEffect, useState } from "react";
import NavigationMenu from "./components/NavigationMenu";
import { useAuth } from "../app/context/AuthContext";
import { getSavedDocket } from "./database/firebaseService";
import { SavedList } from "./database/types";
import { useRouter } from "next/navigation";
import { useCart } from "./context/CartContext";

export default function HomePage() {
  const [isOpen, setIsOpen] = useState(false);
  const [dockets, setDockets] = useState<SavedList | null>(null);
  const { firebaseUser, loading } = useAuth();

  const toggleMenu = () => setIsOpen(!isOpen);

  // Get user name from localStorage
  const getUserName = () => {
    if (typeof window !== "undefined") {
      const userJson = localStorage.getItem("user");
      if (userJson) {
        const user = JSON.parse(userJson);
        return user.firstName;
      }
    }
    return null;
  };

  useEffect(() => {
    async function fetchDocket() {
      if (firebaseUser) {
        const docket = await getSavedDocket(firebaseUser.uid);
        setDockets(docket);
      }
    }

    fetchDocket();
  }, [firebaseUser]);

  const userName = getUserName();
  const router = useRouter();
  const cart = useCart().cart;

  return (
    <main className="flex flex-col items-center min-h-screen bg-gray-50 p-6">
      <NavigationMenu isOpen={isOpen} toggleMenu={toggleMenu} />

      {/* Header with logo and actions */}
      <div className="w-full max-w-[330px] flex items-center justify-between mb-6 px-4">
        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          <div className="grid h-6 w-6 place-items-center rounded-md bg-[rgb(13,82,87)] text-white">
            <ClipboardList className="h-4 w-4" />
          </div>

          <span className="text-xl font-bold tracking-tight text-gray-900">
            Docket<span className="text-[rgb(13,82,87)]">App</span>
          </span>

          {/* Show user name if signed in */}
          {!loading && firebaseUser && userName && (
            <span className="text-sm font-medium text-gray-700">
              {userName}
            </span>
          )}
        </div>

        {/* Center: Save List / Cart Icon */}
        <button
          className="relative grid h-10 w-10 place-items-center rounded-md hover:bg-gray-100 transition-colors"
          aria-label="View saved list"
          onClick={() => router.push("/recallDockets")}
        >
          <NotebookPen className="h-6 w-6 text-gray-700" />
          {/* Badge for item count */}
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[rgb(13,82,87)] text-white text-xs font-bold flex items-center justify-center cursor-pointer">
            {cart.length}
          </span>
        </button>

        {/* Right: Hamburger Menu */}
        <button
          onClick={toggleMenu}
          className="grid h-10 w-10 place-items-center rounded-md hover:bg-gray-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6 text-gray-700" />
        </button>
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