// app/providers.tsx
"use client";

import { HeroUIProvider } from "@heroui/react";
import { CategoriesProvider } from "./context/CategoriesContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HeroUIProvider>
      <CategoriesProvider>{children}</CategoriesProvider>
    </HeroUIProvider>
  );
}
