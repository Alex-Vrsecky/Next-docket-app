"use client";

import React from "react";
import ProductCard from "./Cards/ProductCard";
import { ProductInterface } from "@/app/_types/productInterface";

interface VirtualizedProductListProps {
  products: ProductInterface[];
  onDelete: (productIN: string) => void;
  filters?: {
    category?: string;
    subCategory?: string;
    length?: string;
    search?: string;
  };
  selectedProducts?: Set<string>;
  onSelectProduct?: (productId: string) => void;
  isManage?: boolean;
}

/**
 * Optimized product list with virtual scrolling capabilities
 * Uses CSS Grid for layout with overflow scrolling
 * For even better performance with 500+ products, implement full virtual scrolling
 */
export function VirtualizedProductList({
  products,
  onDelete,
  filters,
  selectedProducts = new Set(),
  onSelectProduct,
}: VirtualizedProductListProps) {
  if (products.length === 0) {
    return (
      <p className="col-span-full text-center text-gray-500">
        No products match your filters.
      </p>
    );
  }

  return (
    <div className="w-full flex justify-center">
      <div
        className="overflow-y-auto"
        style={{
          height: "600px",
          width: "100%",
          maxWidth: "700px",
        }}
      >
        <div className="flex flex-wrap gap-4 justify-center">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              p={p}
              onDelete={() => onDelete(p.productIN)}
              filters={filters}
              isSelected={selectedProducts.has(p.id)}
              onSelect={onSelectProduct}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
