"use client";

import { ClipboardList, X } from "lucide-react";
import React from "react";
import CategoryButton from "./Buttons/CategoryButton";
import { useAuth } from "@/app/context/AuthContext";
import { auth } from "@/app/firebase/firebaseInit";
import { useRouter } from "next/navigation";

interface NavigationMenuProps {
  isOpen: boolean;
  toggleMenu: () => void;
}

export default function NavigationMenu({
  isOpen,
  toggleMenu,
}: NavigationMenuProps) {
  const { firebaseUser, loading } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      localStorage.removeItem("user");
      toggleMenu();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleAuthAction = () => {
    if (firebaseUser) {
      handleSignOut();
    } else {
      toggleMenu();
      router.push("/userSignIn");
    }
  };

  const navLinks = [
    { name: "Products", href: "/" },
    { name: "Adjustments", href: "productAdjustment" },
    { name: "TimberLink", href: "timberLinkHelper" },
    { name: "Recall Docket", href: "recallDockets" },
    { name: "Notes", href: "notes" },
  ];

  return (
    <>
      {/* Overlay Background */}
      {isOpen && <div className="fixed inset-0 z-10" onClick={toggleMenu} />}

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

            {/* Sign In/Sign Out Button */}
            {!loading && (
              <CategoryButton
                name={firebaseUser ? "Sign Out" : "Sign In"}
                onPress={handleAuthAction}
                key="auth-button"
              />
            )}
            {/* Sign In/Sign Out Button */}
            {loading && "loading"}
          </div>
        </div>
      </nav>
    </>
  );
}
