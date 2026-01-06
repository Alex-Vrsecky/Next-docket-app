"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { getCategories } from "../database/firebaseService";
import { CategoryInterface } from "../_types/categoryInterface";

interface CategoriesContextType {
  categories: CategoryInterface[];
  categoryNames: string[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(
  undefined
);

export function CategoriesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [categories, setCategories] = useState<CategoryInterface[]>([]);
  const [categoryNames, setCategoryNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const cats = await getCategories();
      setCategories(cats);
      setCategoryNames(
        cats
          .map((cat) => cat.name)
          .filter(Boolean)
          .sort() as string[]
      );
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch categories"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <CategoriesContext.Provider
      value={{
        categories,
        categoryNames,
        loading,
        error,
        refetch: fetchCategories,
      }}
    >
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories(): CategoriesContextType {
  const context = useContext(CategoriesContext);
  if (!context) {
    throw new Error("useCategories must be used within a CategoriesProvider");
  }
  return context;
}
