"use client";

import { ClipboardList, Menu, NotebookPen } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";
import NavigationMenu from "./NavigationMenu";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const { firebaseUser, loading } = useAuth();

  const toggleMenu = () => setIsOpen(!isOpen);

  // Get user name from localStorage - only on client
  useEffect(() => {
    const userJson = localStorage.getItem("user");
    if (userJson) {
      const user = JSON.parse(userJson);
      setUserName(user.firstName);
    }
  }, []);

  const router = useRouter();
  const cart = useCart().cart;

  return (
    <>
      <NavigationMenu isOpen={isOpen} toggleMenu={toggleMenu} />
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
    </>
  );
}
