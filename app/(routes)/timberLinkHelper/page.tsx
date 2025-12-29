"use client";

import React, { useState, useEffect, useRef } from "react";
import { timberSizes } from "../timberLinkHelper/stock";
import { Loader2, Cloud, CloudOff, Printer, TruckIcon } from "lucide-react";
import {
  saveTimberStock,
  getTimberStock,
  subscribeToTimberStock,
  resetTimberStock,
} from "@/app/database/firebaseService";
import { useAuth } from "@/app/context/AuthContext";
import Header from "../../components/Header";

interface StockStatus {
  [key: string]: {
    canRun: number;
    cantRun: number;
  };
}

export default function TimberTrackerPage() {
  const [stockStatus, setStockStatus] = useState<StockStatus>({});
  const [expandedSizes, setExpandedSizes] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [showPrintList, setShowPrintList] = useState(false);
  const { firebaseUser } = useAuth();

  // Track if changes are local (should sync) or from Firebase (shouldn't sync)
  const isLocalChange = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load initial data from Firebase
  useEffect(() => {
    const loadStock = async () => {
      try {
        setIsLoading(true);
        const stock = await getTimberStock();
        setStockStatus(stock);
      } catch (error) {
        console.error("Error loading stock:", error);
        setSyncError("Failed to load stock data");
      } finally {
        setIsLoading(false);
      }
    };

    loadStock();
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToTimberStock((newStock) => {
      isLocalChange.current = false; // Mark as remote change
      setStockStatus(newStock);
      setSyncError(null);
    });

    return () => unsubscribe();
  }, []);

  // Debounced save to Firebase - only for local changes
  useEffect(() => {
    // Don't save if still loading or if this was a remote update
    if (isLoading || !isLocalChange.current) {
      return;
    }

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSyncing(true);
        await saveTimberStock(stockStatus, firebaseUser?.uid);
        setSyncError(null);
        isLocalChange.current = false; // Reset after successful save
      } catch (error) {
        console.error("Error syncing stock:", error);
        setSyncError("Failed to sync data");
      } finally {
        setIsSyncing(false);
      }
    }, 1000); // Save 1 second after last change

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [stockStatus, isLoading, firebaseUser]);

  const updateStock = (
    sizeKey: string,
    type: "canRun" | "cantRun",
    increment: boolean
  ) => {
    isLocalChange.current = true; // Mark as local change
    setStockStatus((prev) => {
      const current = prev[sizeKey] || { canRun: 0, cantRun: 0 };
      const newValue = increment
        ? current[type] + 1
        : Math.max(0, current[type] - 1);

      return {
        ...prev,
        [sizeKey]: {
          ...current,
          [type]: newValue,
        },
      };
    });
  };

  const toggleExpand = (sizeKey: string) => {
    setExpandedSizes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sizeKey)) {
        newSet.delete(sizeKey);
      } else {
        newSet.add(sizeKey);
      }
      return newSet;
    });
  };

  const getSizeTotal = (treatment: string, size: string, lengths: string[]) => {
    let canRun = 0;
    let cantRun = 0;

    lengths.forEach((length) => {
      const lengthKey = `${treatment}-${size}-${length}`;
      const status = stockStatus[lengthKey] || { canRun: 0, cantRun: 0 };
      canRun += status.canRun;
      cantRun += status.cantRun;
    });

    return { canRun, cantRun };
  };

  const handleReset = async () => {
    if (window.confirm("Are you sure you want to reset all stock counts?")) {
      try {
        setIsSyncing(true);
        isLocalChange.current = false; // Don't trigger sync for reset
        await resetTimberStock(firebaseUser?.uid);
        setStockStatus({});
        setSyncError(null);
      } catch (error) {
        console.error("Error resetting stock:", error);
        setSyncError("Failed to reset stock");
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const renderLengthRow = (size: string, length: string, treatment: string) => {
    const lengthKey = `${treatment}-${size}-${length}`;
    const status = stockStatus[lengthKey] || { canRun: 0, cantRun: 0 };

    return (
      <div
        key={lengthKey}
        className="flex items-center gap-2 py-2 border-t border-gray-200"
      >
        <div className="w-16 text-xs font-medium text-gray-700">{length}</div>

        <div className="flex-1 flex items-center gap-1">
          <button
            onClick={() => updateStock(lengthKey, "canRun", false)}
            className="w-6 h-6 bg-[rgb(13,82,87)] text-white rounded hover:bg-[rgb(10,65,69)] transition-colors font-bold text-xs"
            disabled={isSyncing}
          >
            -
          </button>
          <div className="flex-1 text-center font-bold text-black text-md">
            {status.canRun}
          </div>
          <button
            onClick={() => updateStock(lengthKey, "canRun", true)}
            className="w-6 h-6 bg-[rgb(13,82,87)] text-white rounded hover:bg-[rgb(10,65,69)] transition-colors font-bold text-xs"
            disabled={isSyncing}
          >
            +
          </button>
        </div>

        <div className="flex-1 flex items-center gap-1">
          <button
            onClick={() => updateStock(lengthKey, "cantRun", false)}
            className="w-6 h-6 bg-[rgb(13,82,87)] text-white rounded hover:bg-[rgb(10,65,69)] transition-colors font-bold text-xs"
            disabled={isSyncing}
          >
            -
          </button>
          <div className="flex-1 text-center font-bold text-black text-md">
            {status.cantRun}
          </div>
          <button
            onClick={() => updateStock(lengthKey, "cantRun", true)}
            className="w-6 h-6 bg-[rgb(13,82,87)] text-white rounded hover:bg-[rgb(10,65,69)] transition-colors font-bold text-xs"
            disabled={isSyncing}
          >
            +
          </button>
        </div>
      </div>
    );
  };

  const renderSizeCard = (
    size: string,
    treatment: string,
    lengths: string[]
  ) => {
    const sizeKey = `${treatment}-${size}`;
    const isExpanded = expandedSizes.has(sizeKey);
    const totals = getSizeTotal(treatment, size, lengths);

    return (
      <div
        key={sizeKey}
        className="border border-gray-300 rounded-lg bg-white shadow-sm overflow-hidden"
      >
        <button
          onClick={() => toggleExpand(sizeKey)}
          className="w-full p-3 text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="font-semibold text-sm text-gray-800">{size}</div>
            <div className="text-xs text-gray-500">
              {isExpanded ? "▼" : "▶"}
            </div>
          </div>
          <div className="flex gap-3 mt-2 text-xs">
            <div>
              <span className="text-gray-600">Can: </span>
              <span className="font-bold text-green-600">{totals.canRun}</span>
            </div>
            <div>
              <span className="text-gray-600">Can&apos;t: </span>
              <span className="font-bold text-red-600">{totals.cantRun}</span>
            </div>
            <div>
              <span className="text-gray-600">Total: </span>
              <span className="font-bold text-blue-600">
                {totals.canRun + totals.cantRun}
              </span>
            </div>
          </div>
        </button>

        {isExpanded && (
          <div className="px-3 pb-3">
            <div className="flex items-center gap-2 pb-2 text-xs font-semibold text-gray-600">
              <div className="w-16">Length</div>
              <div className="flex-1 text-center">Can Run</div>
              <div className="flex-1 text-center">Can&apos;t Run</div>
            </div>
            {lengths.map((length) => renderLengthRow(size, length, treatment))}
          </div>
        )}
      </div>
    );
  };

  const getTotalStats = () => {
    const totals = Object.values(stockStatus).reduce(
      (acc, curr) => ({
        canRun: acc.canRun + curr.canRun,
        cantRun: acc.cantRun + curr.cantRun,
      }),
      { canRun: 0, cantRun: 0 }
    );
    return totals;
  };

  const totals = getTotalStats();

  // Print List Component
  const PrintList = () => {
    const getAllItems = () => {
      const items: Array<{
        treatment: string;
        size: string;
        length: string;
        canRun: number;
        cantRun: number;
      }> = [];

      // Process untreated
      Object.entries(timberSizes.untreated).forEach(([size, data]) => {
        data.lengths.forEach((length) => {
          const lengthKey = `untreated-${size}-${length}`;
          const status = stockStatus[lengthKey];
          if (status && (status.canRun > 0 || status.cantRun > 0)) {
            items.push({
              treatment: "Untreated",
              size,
              length,
              canRun: status.canRun,
              cantRun: status.cantRun,
            });
          }
        });
      });

      // Process treated
      Object.entries(timberSizes.treated).forEach(([size, data]) => {
        data.lengths.forEach((length) => {
          const lengthKey = `treated-${size}-${length}`;
          const status = stockStatus[lengthKey];
          if (status && (status.canRun > 0 || status.cantRun > 0)) {
            items.push({
              treatment: "Treated",
              size,
              length,
              canRun: status.canRun,
              cantRun: status.cantRun,
            });
          }
        });
      });

      return items;
    };

    const items = getAllItems();

    return (
      <div className="w-full flex items-center justify-center mb-5">
        <div className="bg-white rounded-lg shadow-md w-full max-h-[90vh] overflow-auto print:max-h-none print:shadow-none print:rounded-none">
          {/* Header - Hidden on print */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-3 flex justify-between items-center print:hidden">
            <h2 className="text-base font-bold text-gray-800">
              Stock List - {new Date().toLocaleDateString()}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1 px-3 py-1.5 bg-teal-800 text-white rounded-lg hover:bg-teal-900 transition-colors text-xs"
              >
                <Printer className="h-3 w-3" />
                Print
              </button>
              <button
                onClick={() => setShowPrintList(false)}
                className="px-3 py-1.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-xs"
              >
                Close
              </button>
            </div>
          </div>

          {/* Print Header - Only shown on print */}
          <div className="hidden print:block p-6 border-b border-gray-300">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Timber Stock List
            </h1>
            <p className="text-gray-600">
              Date: {new Date().toLocaleDateString()}{" "}
              {new Date().toLocaleTimeString()}
            </p>
            <div className="mt-4 flex gap-6 text-sm">
              <div>
                <span className="font-semibold">Can Run:</span>{" "}
                <span className="text-green-600 font-bold">
                  {totals.canRun}
                </span>
              </div>
              <div>
                <span className="font-semibold">Racking:</span>{" "}
                <span className="text-yellow-600 font-bold">
                  {totals.cantRun}
                </span>
              </div>
              <div>
                <span className="font-semibold">Total Packs:</span>{" "}
                <span className="text-blue-600 font-bold">
                  {totals.canRun + totals.cantRun}
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-3">
            {items.length === 0 ? (
              <p className="text-center text-gray-500 py-6 text-sm">
                No items in stock to display
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left py-2 px-1 font-bold text-gray-800">
                        Treatment
                      </th>
                      <th className="text-left py-2 px-1 font-bold text-gray-800">
                        Size
                      </th>
                      <th className="text-left py-2 px-1 font-bold text-gray-800">
                        Length
                      </th>
                      <th className="text-center py-2 px-1 font-bold text-green-700">
                        Run
                      </th>
                      <th className="text-center py-2 px-1 font-bold text-yellow-700">
                        Rack
                      </th>
                      <th className="text-center py-2 px-1 font-bold text-blue-700">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr
                        key={index}
                        className="border-b border-gray-200 hover:bg-gray-50 print:hover:bg-white"
                      >
                        <td className="py-1.5 px-1 text-xs">
                          {item.treatment}
                        </td>
                        <td className="py-1.5 px-1 text-xs font-medium">
                          {item.size}
                        </td>
                        <td className="py-1.5 px-1 text-xs">{item.length}</td>
                        <td className="py-1.5 px-1 text-center font-bold text-green-600">
                          {item.canRun}
                        </td>
                        <td className="py-1.5 px-1 text-center font-bold text-yellow-600">
                          {item.cantRun}
                        </td>
                        <td className="py-1.5 px-1 text-center font-bold text-blue-600">
                          {item.canRun + item.cantRun}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-300 font-bold bg-gray-50">
                      <td colSpan={3} className="py-2 px-1 text-right text-xs">
                        TOTALS:
                      </td>
                      <td className="py-2 px-1 text-center text-green-600 text-xs">
                        {totals.canRun}
                      </td>
                      <td className="py-2 px-1 text-center text-yellow-600 text-xs">
                        {totals.cantRun}
                      </td>
                      <td className="py-2 px-1 text-center text-blue-600 text-xs">
                        {totals.canRun + totals.cantRun}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-teal-800 mx-auto mb-2" />
          <p className="text-gray-600">Loading stock data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block,
          .print\\:block * {
            visibility: visible;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-gray-50 px-6 flex justify-center">
        <div className="w-full max-w-[450px]">
          <div className="flex items-center justify-center mt-5 mb-4">
            <Header />
          </div>
          {/* Sync Status Indicator */}
          <div className="flex items-center gap-2">
            {isSyncing ? (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Syncing...</span>
              </div>
            ) : syncError ? (
              <div className="flex items-center gap-1 text-xs text-red-600">
                <CloudOff className="h-4 w-4" />
                <span>{syncError}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <Cloud className="h-4 w-4" />
                <span>Synced</span>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 mb-4 sticky top-4 z-10">
            <h1 className="text-xl font-bold text-gray-800 mb-3">
              <span className="flex justify-start items-center gap-2">
                <TruckIcon className="bg-teal-800 text-white rounded-xl p-1.5 h-10 w-10" />
                TimberLink Helper
              </span>
            </h1>
            <div className="flex gap-4 text-sm">
              <div className="flex-1 bg-green-50 rounded p-2">
                <div className="text-gray-600 text-xs">Can Run</div>
                <div className="text-green-600 font-bold text-lg">
                  {totals.canRun}
                </div>
              </div>
              <div className="flex-1 bg-yellow-50 rounded p-2">
                <div className="text-gray-600 text-xs">Racking</div>
                <div className="text-yellow-600 font-bold text-lg">
                  {totals.cantRun}
                </div>
              </div>
              <div className="flex-1 bg-blue-50 rounded p-2">
                <div className="text-gray-600 text-xs">Total Packs</div>
                <div className="text-blue-600 font-bold text-lg">
                  {totals.canRun + totals.cantRun}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col my-6 space-y-3">
            <button
              onClick={() => setShowPrintList((prev) => !prev)}
              className="w-full bg-teal-800 text-white py-3 rounded-lg font-semibold hover:bg-teal-900 transition-colors flex items-center justify-center gap-2"
            >
              <Printer className="h-5 w-5" />
              Print Stock List
            </button>
            <button
              onClick={handleReset}
              disabled={isSyncing}
              className="w-full bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSyncing ? "Resetting..." : "Reset All"}
            </button>
          </div>
          {/* Print List Modal */}
          {showPrintList && <PrintList />}
          <div className="space-y-6">
            {/* Untreated Section */}
            <div>
              <h2 className="text-lg font-bold text-white mb-3 bg-teal-900 p-2 rounded">
                Untreated Timber
              </h2>
              <div className="space-y-3">
                {Object.entries(timberSizes.untreated).map(([size, data]) =>
                  renderSizeCard(size, "untreated", data.lengths)
                )}
              </div>
            </div>

            {/* Treated Section */}
            <div>
              <h2 className="text-lg font-bold text-white mb-3 bg-teal-900 p-2 rounded">
                Treated Timber
              </h2>
              <div className="space-y-3">
                {Object.entries(timberSizes.treated).map(([size, data]) =>
                  renderSizeCard(size, "treated", data.lengths)
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
