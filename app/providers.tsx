// app/providers.tsx
"use client";

import { HeroUIProvider } from "@heroui/react";
import { CategoriesProvider } from "./context/CategoriesContext";
import { ReactQueryProvider } from "./providers/ReactQueryProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HeroUIProvider>
      <ReactQueryProvider>
        <CategoriesProvider>{children}</CategoriesProvider>
      </ReactQueryProvider>
    </HeroUIProvider>
  );
}
