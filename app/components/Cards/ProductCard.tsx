"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Barcode from "react-barcode";

interface ProductInterface {
  Desc: string;
  Extra: string;
  LengthCoveragePackaging: string;
  category: string;
  id: string;
  imageSrc: string;
  priceWithNote: string;
  productIN: string;
  subCategory: string;
  Length: string;
}

export default function ProductCard({
  p,
  onDelete,
  onEdit,
}: {
  p: ProductInterface;
  onDelete: (id: string) => void;
  onEdit?: (id: string) => void;
}) {
  const pathname = usePathname();
  const isManage = pathname === "/adjust";

  return (
    <div className="relative w-80 h-28">
      {/* Main card background */}
      <div className="w-full h-full bg-white rounded-lg shadow-[0px_0px_4px_1px_rgba(0,0,0,0.25)] overflow-hidden">
        {/* Left section - Text info (constrained width to prevent overlap) */}
        <div className="absolute left-4 top-3 flex flex-col gap-0.5 max-w-[140px]">
          {/* Category */}
          <p className="text-black text-[10px] font-normal font-inter break-words">
            {p.category || "Category"}
          </p>

          {/* Description info */}
          <p className="text-black text-xs font-extrabold font-inter break-words">
            {p.Desc || "—"}
          </p>

          {/* Subcategory / Size - Main Title */}
          <h3 className="text-black text-xs font-medium font-inter leading-tight break-words">
            {p.subCategory || "—"}
          </h3>

          {/* Product IN */}
          <p className="text-black text-[10px] font-bold font-inter mt-0.5 break-words">
            IN: {p.productIN || "0000000"}
          </p>
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <div className="w-[180px] h-16 flex items-center justify-end mr-3">
            <Barcode
              value={p.productIN || "0000000"}
              height={40}
              width={1.3}
              fontSize={8}
              background="transparent"
              lineColor="#111827"
              margin={0}
            />
          </div>
        </div>
        {/* Bottom buttons */}
        {isManage && (
          <div className="absolute left-4 bottom-3 flex gap-2">
            <button
              onClick={() => onEdit?.(p.id)}
              className="h-5 px-3 bg-teal-800 rounded-lg shadow-[0px_0px_4px_1px_rgba(0,0,0,0.25)] flex items-center justify-center hover:bg-teal-700 transition-colors"
            >
              <span className="text-white text-[10px] font-bold font-inter">
                Edit
              </span>
            </button>
            <button
              onClick={() => {
                if (
                  confirm(
                    `Delete product "${p.productIN || p.id}"? This cannot be undone.`
                  )
                ) {
                  onDelete(p.productIN);
                }
              }}
              className="h-5 px-3 bg-red-600 rounded-lg shadow-[0px_0px_4px_1px_rgba(0,0,0,0.25)] flex items-center justify-center hover:bg-red-700 transition-colors"
            >
              <span className="text-white text-[10px] font-bold font-inter">
                Delete
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}