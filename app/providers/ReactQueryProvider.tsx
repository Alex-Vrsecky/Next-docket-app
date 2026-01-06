"use client";

import React, { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a client for React Query with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - cache data for 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes - keep unused data for 10 minutes
      retry: 1, // Retry failed queries once
      refetchOnWindowFocus: false, // Don't refetch when window gains focus
      refetchOnReconnect: true, // Refetch when connection is restored
    },
    mutations: {
      retry: 1,
    },
  },
});

export function ReactQueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
