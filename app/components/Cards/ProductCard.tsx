// components/ProductCard.tsx
"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Barcode from "react-barcode";
import { useCart } from "@/app/context/CartContext";
import { ArrowBigDownIcon, ArrowBigUpIcon } from "lucide-react";

interface ProductInterface {
  Desc: string;
  Extra: string;
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
  const isManage = pathname === "/productAdjustment";
  const [quantity, setQuantity] = useState(0);
  const { addToCart, cart } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  // Get current quantity in cart
  const cartItem = cart.find((item) => item.productIN === p.productIN);
  const cartQuantity = cartItem ? cartItem.quantity : 0;

  // Update local quantity when cart changes
  useEffect(() => {
    if (cartQuantity > 0) {
      setQuantity(cartQuantity);
    }
  }, [cartQuantity]);

  const handleAddToDocket = () => {
    if (quantity < 0) {
      alert("Quantity must be at least 0");
      return;
    }

    setIsAdding(true);

    const cartProduct = {
      productId: p.id,
      productIN: p.productIN,
      description: p.Desc,
      category: p.category,
      subCategory: p.subCategory,
      Length: p.Length,
      quantity: quantity,
      priceWithNote: p.priceWithNote,
    };

    addToCart(cartProduct);

    // Visual feedback
    setTimeout(() => {
      setIsAdding(false);
    }, 300);
  };

  return (
    <div className={`relative ${isManage ? "h-35" : "h-32"} w-100`}>
      {/* Main card background */}
      <div className="w-full h-full bg-white rounded-lg shadow-[0px_0px_4px_1px_rgba(0,0,0,0.25)] overflow-hidden">
        {/* Left section - Text info */}
        <div className="absolute left-2 top-3 flex flex-col gap-0.5 max-w-[140px]">
          <p className="text-black text-[10px] font-normal font-inter break-words">
            {p.category || "Category"}
          </p>

          <p className="text-black text-xs font-extrabold font-inter break-words">
            {p.Desc || "—"}
          </p>

          <h3 className="text-black text-xs font-medium font-inter leading-tight break-words">
            {p.subCategory || "—"} {p.Length || "—"}
          </h3>

          <p className="text-black text-[10px] font-bold font-inter mt-0.5 break-words">
            IN: {p.productIN || "0000000"}
          </p>
        </div>

        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <div className="w-[180px] h-16 flex items-center justify-end mr-3 mb-2">
            <Barcode
              value={p.productIN || "0000000"}
              displayValue={false}
              height={40}
              width={1.3}
              fontSize={8}
              background="transparent"
              lineColor="#111827"
              margin={0}
            />
          </div>
          {!isManage && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                className="py-1 px-2 h-6 w-16 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(13,82,87)]"
              />
              <button
                onClick={handleAddToDocket}
                disabled={isAdding}
                className={`h-6 w-9 px-3 rounded-lg shadow-[0px_0px_4px_1px_rgba(0,0,0,0.25)] flex items-center justify-center transition-colors ${
                  isAdding ? "bg-green-600" : "bg-teal-800 hover:bg-teal-700"
                }`}
              >
                <span className="text-white text-[10px] font-bold font-inter">
                  {isAdding ? "✓" : "Add"}
                </span>
              </button>
              <button
                onClick={() => setQuantity(Math.max(0, quantity - 1))}
                className="h-6 w-2 px-3 rounded-lg shadow-[0px_0px_4px_1px_rgba(0,0,0,0.25)] flex items-center justify-center transition-colors bg-teal-800 hover:bg-teal-700"
              >
                <span className="text-white text-[10px] font-bold font-inter">
                  <ArrowBigDownIcon className="h-4 w-4" />
                </span>
              </button>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="h-6 w-2 px-3 rounded-lg shadow-[0px_0px_4px_1px_rgba(0,0,0,0.25)] flex items-center justify-center transition-colors bg-teal-800 hover:bg-teal-700"
              >
                <span className="text-white text-[10px] font-bold font-inter">
                  <ArrowBigUpIcon className="h-4 w-4" />
                </span>
              </button>
            </div>
          )}
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