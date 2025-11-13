"use client";

import { ClipboardList, Menu, NotebookPen, X } from "lucide-react";
import CategoryFilter from "./components/CategoryFilter";
import { useState } from "react";
import CategoryButton from "./components/CategoryButton";

export default function HomePage() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const navLinks = [
    { name: "Adjust Products", href: "productAdjustment" },
    { name: "Decking Calculator", href: "deckingCalculator" },
    { name: "TimberLink Helper", href: "timberlinkHelper" },
    { name: "Saved Dockets", href: "savedDockets" },
    { name: "Sign in", href: "partOfTheShipPartOfTheCrew" },
  ];

  return (
    <main className="flex flex-col items-center min-h-screen bg-gray-50 p-6">
      {/* Overlay Background */}
      {isOpen && <div className="fixed inset-0  z-10" onClick={toggleMenu} />}

      {/* Slide-in Menu */}
      <nav
        className={`fixed top-0 right-0 h-full w-full bg-[rgb(13,82,87)] opacity-98 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Close Button */}
        <div className="flex justify-end p-4">
          <button
            onClick={toggleMenu}
            className="grid h-10 w-10 place-items-center rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-6 w-6 text-white" />
          </button>
        </div>

        {/* Menu Content */}
        <div className="flex flex-col px-6 space-y-2">
          {/* Logo in menu */}
          <div className="flex items-center justify-start gap-3 mb-8 pb-6 border-b border-gray-200">
            <div className="grid h-8 w-8 place-items-center rounded-md text-[rgb(13,82,87)] bg-white">
              <ClipboardList className="h-5 w-5" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">
              Select Feature
            </span>
          </div>
          <div className="flex flex-wrap justify-start w-[330px] gap-2">
            {/* Navigation Links */}
            {navLinks.map((link) => (
              <CategoryButton
                name={link.name}
                onPress={toggleMenu}
                href={link.href}
                key={link.name}
              />
            ))}
          </div>
        </div>
      </nav>

      {/* Header with logo and actions */}
      <div className="w-full max-w-[330px] flex items-center justify-between mb-6 px-4">
        {/* Left: Logo */}
        <div className="flex items-start gap-3">
          <div className="grid h-6 w-6 place-items-center rounded-md bg-[rgb(13,82,87)] text-white">
            <ClipboardList className="h-4 w-4" />
          </div>

          <span className="text-xl font-bold tracking-tight text-gray-900">
            Docket<span className="text-[rgb(13,82,87)]">App</span>
          </span>
        </div>

        {/* Center: Save List / Cart Icon */}
        <button
          className="relative grid h-10 w-10 place-items-center rounded-md hover:bg-gray-100 transition-colors"
          aria-label="View saved list"
        >
          <NotebookPen className="h-6 w-6 text-gray-700" />
          {/* Badge for item count */}
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[rgb(13,82,87)] text-white text-xs font-bold flex items-center justify-center">
            3
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
