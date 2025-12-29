"use client";

import { useState, useEffect } from "react";
import {
  Trash2,
  Plus,
  Minus,
  Eye,
  EyeOff,
  RotateCcw,
  FileText,
} from "lucide-react";
import { useCart } from "@/app/context/CartContext";
import {
  getSavedDockets,
  createSavedDocket,
  deleteSavedDocket,
} from "@/app/database/firebaseService";
import { SavedList } from "../../database/types";
import Barcode from "react-barcode";
import Header from "../../components/Header";
import { Footer } from "../../components/Footer";

export default function RecallDocketPage() {
  const { cart, removeFromCart, updateQuantity, clearCart, addToCart } =
    useCart();
  const [docketName, setDocketName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedDockets, setSavedDockets] = useState<SavedList[]>([]);
  const [loadingDockets, setLoadingDockets] = useState(true);
  const [selectedBarcode, setSelectedBarcode] = useState<string | null>(null);
  const [productNotes, setProductNotes] = useState<{ [key: string]: string }>(
    {}
  );
  const [editingNote, setEditingNote] = useState<string | null>(null);

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
        note: productNotes[item.productIN] || "",
        addedAt: new Date().toISOString(),
      }));

      await createSavedDocket(docketName, products);

      clearCart();
      setDocketName("");
      setProductNotes({});

      await loadSavedDockets();

      alert("Docket saved successfully!");
    } catch (error) {
      console.error("Error saving docket:", error);
      alert("Failed to save docket");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRecallDocket = (docket: SavedList) => {
    // Warn if cart is not empty
    if (cart.length > 0) {
      if (
        !confirm(
          `Your current docket has ${cart.length} item(s). Recalling "${docket.name}" will replace your current docket. Continue?`
        )
      ) {
        return;
      }
    }

    // Clear current cart and notes
    clearCart();
    const newNotes: { [key: string]: string } = {};

    // Add all products from saved docket to cart
    docket.products.forEach((product) => {
      const cartProduct = {
        productId: product.productIN,
        productIN: product.productIN,
        description: product.productDesc,
        category: product.category,
        subCategory: product.subCategory,
        Length: product.Length,
        quantity: product.quantity,
        priceWithNote: "",
      };
      addToCart(cartProduct);

      // Restore notes
      if (product.note) {
        newNotes[product.productIN] = product.note;
      }
    });

    setProductNotes(newNotes);
    alert(`Docket "${docket.name}" recalled successfully!`);
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

  const handleNoteChange = (productIN: string, note: string) => {
    setProductNotes((prev) => ({
      ...prev,
      [productIN]: note,
    }));
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getTotalQuantity = (products: any[]) => {
    return products.reduce((sum, product) => sum + product.quantity, 0);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen w-full bg-gray-50 flex justify-center">
      <div className="w-full max-w-[450px] flex flex-col">
        <div className="flex justify-center items-center mt-5 px-4">
          <Header />
        </div>

        <div className="px-4 py-6 space-y-6">
          {/* Current Cart Section */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                Current Docket:{" "}
                <span className="font-medium">{cartTotal} items</span>
              </h2>
              {cart.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm("Clear all items from cart?")) {
                      clearCart();
                      setProductNotes({});
                    }
                  }}
                  className="text-red-600 hover:text-red-700 text-xs font-medium"
                >
                  Clear
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-base">Your cart is empty</p>
                <p className="text-gray-400 text-xs mt-2">
                  Add products to create a docket
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-6">
                  {cart.map((item) => (
                    <div
                      key={item.productIN}
                      className="bg-gray-50 p-3 rounded-lg"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 pr-2">
                          <h3 className="font-semibold text-sm text-gray-900">
                            {item.description}
                          </h3>
                          <p className="text-xs text-gray-600 mt-1">
                            {item.category} - {item.subCategory}
                          </p>
                          <p className="text-xs text-gray-600">{item.Length}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            IN: {item.productIN}
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            removeFromCart(item.productIN);
                            setProductNotes((prev) => {
                              const newNotes = { ...prev };
                              delete newNotes[item.productIN];
                              return newNotes;
                            });
                          }}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-center mb-3">
                        <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg">
                          <button
                            onClick={() =>
                              updateQuantity(item.productIN, item.quantity - 1)
                            }
                            className="p-2 hover:bg-gray-100 rounded-l-lg"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="px-4 font-semibold min-w-[3rem] text-center">
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
                      </div>

                      {/* Note Section */}
                      {editingNote === item.productIN ? (
                        <div className="mt-2">
                          <textarea
                            value={productNotes[item.productIN] || ""}
                            onChange={(e) =>
                              handleNoteChange(item.productIN, e.target.value)
                            }
                            placeholder="Add a note..."
                            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[rgb(13,82,87)] resize-none"
                            rows={2}
                            autoFocus
                          />
                          <button
                            onClick={() => setEditingNote(null)}
                            className="mt-1 text-xs text-teal-800 hover:text-teal-900 font-medium"
                          >
                            Done
                          </button>
                        </div>
                      ) : (
                        <div className="mt-2">
                          {productNotes[item.productIN] ? (
                            <div
                              onClick={() => setEditingNote(item.productIN)}
                              className="bg-yellow-50 border border-yellow-200 rounded p-2 cursor-pointer hover:bg-yellow-100 transition-colors"
                            >
                              <div className="flex items-start gap-2">
                                <FileText className="h-3 w-3 text-yellow-700 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-yellow-900 flex-1">
                                  {productNotes[item.productIN]}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setEditingNote(item.productIN)}
                              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                            >
                              <FileText className="h-3 w-3" />
                              <span>Add note</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Save Docket Form */}
                <div className="border-t pt-4">
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Docket Name:
                  </label>
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={docketName}
                      onChange={(e) => setDocketName(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleSaveDocket()
                      }
                      placeholder="Enter docket name"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(13,82,87)]"
                    />
                    <button
                      onClick={handleSaveDocket}
                      disabled={isSaving || !docketName.trim()}
                      className="w-full bg-[rgb(13,82,87)] text-white px-4 py-2.5 rounded-lg hover:bg-[rgb(10,65,69)] font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Saved Dockets
            </h2>

            {loadingDockets ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">Loading dockets...</p>
              </div>
            ) : savedDockets.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <p className="text-gray-500 text-sm">No saved dockets yet</p>
                <p className="text-gray-400 text-xs mt-2">
                  Save your first docket to see it here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {savedDockets.map((docket) => (
                  <div
                    key={docket.id}
                    className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
                  >
                    {/* Docket Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-base text-gray-900 mb-2">
                          {docket.name}
                        </h3>
                        <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                          <span>
                            <strong>{docket.products.length}</strong> types
                          </span>
                          <span>
                            <strong>{getTotalQuantity(docket.products)}</strong>{" "}
                            items
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 ml-2">
                        <button
                          onClick={() => handleRecallDocket(docket)}
                          className="p-2 bg-teal-800 hover:bg-teal-700 text-white rounded-lg transition-colors"
                          title="Recall this docket"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteDocket(docket.id, docket.name)
                          }
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete this docket"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Products List */}
                    {docket.products.length > 0 && (
                      <div className="space-y-2 mt-3">
                        {docket.products.map((product, index) => (
                          <div
                            key={index}
                            className={`bg-gray-50 p-3 rounded-lg transition-opacity duration-200 ${
                              selectedBarcode !== null &&
                              selectedBarcode !== product.productIN
                                ? "opacity-30"
                                : "opacity-100"
                            }`}
                          >
                            {/* Product Info Row */}
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <div className="text-sm font-semibold text-gray-900">
                                  {product.productDesc}
                                </div>
                                {product.productDesc !== product.Length && (
                                  <div className="text-xs text-gray-600">
                                    {product.Length}
                                  </div>
                                )}
                                <div className="text-xs text-gray-600 mt-1">
                                  {product.category}
                                </div>
                                {product.note && (
                                  <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded p-2">
                                    <div className="flex items-start gap-2">
                                      <FileText className="h-3 w-3 text-yellow-700 mt-0.5 flex-shrink-0" />
                                      <p className="text-xs text-yellow-900">
                                        {product.note}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="flex items-center text-xl font-bold text-gray-900">
                                  <span className="text-xs font-light text-gray-500 mr-2">
                                    Quanity:
                                  </span>
                                  {product.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    toggleBarcodeVisibility(product.productIN)
                                  }
                                >
                                  {selectedBarcode === product.productIN ? (
                                    <EyeOff className="h-5 w-5 text-gray-800" />
                                  ) : (
                                    <Eye className="h-5 w-5 text-gray-600 hover:text-gray-800" />
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Barcode Row */}
                            <div className="flex justify-center pt-2 border-t border-gray-200">
                              <Barcode
                                value={product.productIN || "0000000"}
                                displayValue={false}
                                height={35}
                                width={2}
                                fontSize={10}
                                background="transparent"
                                lineColor="#111827"
                                margin={0}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-gray-400 mt-3">
                      Created:{" "}
                      {new Date(docket.createdAt).toLocaleDateString("en-AU", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-auto">
          <Footer />
        </div>
      </div>
    </div>
  );
}