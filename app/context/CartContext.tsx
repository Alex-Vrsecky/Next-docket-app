// app/context/CartContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface CartProduct {
  productId: string;
  productIN: string;
  description: string;
  category: string;
  subCategory: string;
  Length: string;
  quantity: number;
  priceWithNote: string;
}

interface CartContextType {
  cart: CartProduct[];
  addToCart: (product: CartProduct) => void;
  removeFromCart: (productIN: string) => void;
  updateQuantity: (productIN: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartProduct[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("docketCart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("docketCart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: CartProduct) => {
    setCart((prev) => {
      // Check if product already exists
      const existingIndex = prev.findIndex(
        (item) => item.productIN === product.productIN
      );

      if (existingIndex >= 0) {
        // Update quantity if exists
        const updated = [...prev];
        updated[existingIndex].quantity += product.quantity;
        return updated;
      } else {
        // Add new product
        return [...prev, product];
      }
    });
  };

  const removeFromCart = (productIN: string) => {
    setCart((prev) => prev.filter((item) => item.productIN !== productIN));
  };

  const updateQuantity = (productIN: string, quantity: number) => {
    if (quantity < 1) return;
    setCart((prev) =>
      prev.map((item) =>
        item.productIN === productIN ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}