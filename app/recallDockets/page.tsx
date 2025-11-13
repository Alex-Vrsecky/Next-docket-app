"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, Plus, Minus, Eye, EyeOff } from "lucide-react";
import { useCart } from "@/app/context/CartContext";
import {
  getSavedDockets,
  createSavedDocket,
  deleteSavedDocket,
} from "@/app/database/firebaseService";
import { SavedList } from "../database/types";
import Barcode from "react-barcode";

export default function RecallDocketPage() {
  const router = useRouter();
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const [docketName, setDocketName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedDockets, setSavedDockets] = useState<SavedList[]>([]);
  const [loadingDockets, setLoadingDockets] = useState(true);
  const [selectedBarcode, setSelectedBarcode] = useState<string | null>(null);

  useEffect(() => {
    loadSavedDockets();
  }, []);

  const loadSavedDockets = async () => {
    try {
      const dockets = await getSavedDockets();
      setSavedDockets(dockets);
    } catch (error) {
      console.error("Error loading dockets:", error);
    } finally {
      setLoadingDockets(false);
    }
  };

  const handleSaveDocket = async () => {
    if (!docketName.trim()) {
      alert("Please enter a docket name");
      return;
    }

    if (cart.length === 0) {
      alert("Cart is empty. Add some products first.");
      return;
    }

    setIsSaving(true);

    try {
      const products = cart.map((item) => ({
        productId: item.productIN,
        productDesc: item.description,
        category: item.category,
        subCategory: item.subCategory,
        Length: item.Length,
        quantity: item.quantity,
        productIN: item.productIN,
        priceWithNote: item.priceWithNote,
        addedAt: new Date().toISOString(),
      }));

      await createSavedDocket(docketName, products);

      clearCart();
      setDocketName("");

      await loadSavedDockets();

      alert("Docket saved successfully!");
    } catch (error) {
      console.error("Error saving docket:", error);
      alert("Failed to save docket");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleBarcodeVisibility = (productIN: string) => {
    setSelectedBarcode((prev) => (prev === productIN ? null : productIN));
  };

  const handleDeleteDocket = async (docketId: string, name: string) => {
    if (!confirm(`Delete docket "${name}"? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteSavedDocket(docketId);
      await loadSavedDockets();
    } catch (error) {
      console.error("Error deleting docket:", error);
      alert("Failed to delete docket");
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getTotalQuantity = (products: any[]) => {
    return products.reduce((sum, product) => sum + product.quantity, 0);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen barcode max-w-[450px] flex flex-col justify-self-center">
      <button
        onClick={() => router.back()}
        className="m-4 p-2 hover:bg-teal-700  bg-teal-800 rounded-lg transition-colors"
      >
        <ArrowLeft className="h-10 w-10 text-white" />
      </button>
      <div className="max-w-[450px] mx-auto px-4 py-6 space-y-8">
        {/* Current Cart Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Current Docket:{" "}
              <span className="font-medium">{cartTotal} items</span>
            </h2>
            {cart.length > 0 && (
              <button
                onClick={() => {
                  if (confirm("Clear all items from cart?")) {
                    clearCart();
                  }
                }}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Clear Cart
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Your cart is empty</p>
              <p className="text-gray-400 text-sm mt-2">
                Add products to create a docket
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-6">
                {cart.map((item) => (
                  <div
                    key={item.productIN}
                    className="flex items-center justify-between bg-gray-50 p-4 rounded-lg"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {item.description}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {item.category} - {item.subCategory} {item.Length}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        IN: {item.productIN}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg">
                        <button
                          onClick={() =>
                            updateQuantity(item.productIN, item.quantity - 1)
                          }
                          className="p-2 hover:bg-gray-100 rounded-l-lg"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="px-3 font-semibold min-w-[2rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.productIN, item.quantity + 1)
                          }
                          className="p-2 hover:bg-gray-100 rounded-r-lg"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.productIN)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Save Docket Form */}
              <div className="border-t pt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Docket Name:
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={docketName}
                    onChange={(e) => setDocketName(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSaveDocket()}
                    placeholder="Enter docket name"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(13,82,87)]"
                  />
                  <button
                    onClick={handleSaveDocket}
                    disabled={isSaving || !docketName.trim()}
                    className="bg-[rgb(13,82,87)] text-white px-6 py-2 rounded-lg hover:bg-[rgb(10,65,69)] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? "Saving..." : "Save Docket"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Saved Dockets Section */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Saved Dockets
          </h2>

          {loadingDockets ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading dockets...</p>
            </div>
          ) : savedDockets.length === 0 ? (
            <div className="bg-white rounded-lg shadow-[0px_0px_4px_1px_rgba(0,0,9,0.25)] p-8 text-center">
              <p className="text-gray-500">No saved dockets yet</p>
              <p className="text-gray-400 text-sm mt-2">
                Save your first docket to see it here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {savedDockets.map((docket) => (
                <div
                  key={docket.id}
                  className="bg-white rounded-lg shadow-[0px_0px_4px_1px_rgba(0,0,0,0.25)] p-5 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 mb-2">
                        {docket.name}
                      </h3>

                      <div className="flex gap-4 text-sm text-gray-600 mb-3">
                        <span>
                          <strong>{docket.products.length}</strong> product
                          types
                        </span>
                        <span>
                          <strong>{getTotalQuantity(docket.products)}</strong>{" "}
                          total items
                        </span>
                      </div>
                      <div className="flex gap-4 text-sm text-gray-600 mb-3">
                        <span>
                          <strong>description</strong>
                        </span>
                        <span className="ml-3">
                          <strong>category</strong>
                        </span>
                        <span className="ml-8">
                          <strong>barcode</strong>
                        </span>
                        <span className="ml-10">
                          <strong>quantity</strong>
                        </span>
                      </div>

                      {docket.products.length > 0 && (
                        <div className="space-y-2">
                          {docket.products.map((product, index) => (
                            <div
                              key={index}
                              className={`flex items-center justify-start text-sm bg-gray-50 p-2 rounded transition-opacity duration-200 ${
                                selectedBarcode !== null &&
                                selectedBarcode !== product.productIN
                                  ? "opacity-7"
                                  : "opacity-100"
                              }`}
                            >
                              <div className="flex flex-col mr-5 w-[80px]">
                                {product.productDesc == product.Length ? (
                                  <span>{product.productDesc}</span>
                                ) : (
                                  <>
                                    <span>{product.productDesc}</span>
                                    <span>{product.Length}</span>
                                  </>
                                )}
                              </div>
                              <span className="font-semibold w-[50px] mr-4">
                                {product.category}
                              </span>
                              <Barcode
                                value={product.productIN || "0000000"}
                                displayValue={false}
                                height={40}
                                width={1.3}
                                fontSize={8}
                                background="transparent"
                                lineColor={"#111827"}
                                margin={0}
                              />
                              <span className="text-black text-3xl ml-5 w-9">
                                {product.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  toggleBarcodeVisibility(product.productIN)
                                }
                                className="ml-2"
                              >
                                {selectedBarcode === product.productIN ? (
                                  <EyeOff className="h-5 w-5 text-gray-800" />
                                ) : (
                                  <Eye className="h-5 w-5 text-gray-600 hover:text-gray-800" />
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <p className="text-xs text-gray-400 mt-3">
                        Created:{" "}
                        {new Date(docket.createdAt).toLocaleDateString(
                          "en-AU",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                        <button
                          onClick={() =>
                            handleDeleteDocket(docket.id, docket.name)
                          }
                          className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
