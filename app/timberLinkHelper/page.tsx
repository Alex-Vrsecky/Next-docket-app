"use client";

import React, { useState, useEffect } from "react";
import { timberSizes } from "@/app/timberLinkHelper/stock";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Cloud, CloudOff } from "lucide-react";
import {
  saveTimberStock,
  getTimberStock,
  subscribeToTimberStock,
  resetTimberStock,
} from "@/app/database/firebaseService";
import { useAuth } from "@/app/context/AuthContext";

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
  const router = useRouter();
  const { firebaseUser } = useAuth();

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
      setStockStatus(newStock);
      setSyncError(null);
    });

    return () => unsubscribe();
  }, []);

  // Debounced save to Firebase
  useEffect(() => {
    if (!isLoading && Object.keys(stockStatus).length >= 0) {
      const timeoutId = setTimeout(async () => {
        try {
          setIsSyncing(true);
          await saveTimberStock(stockStatus, firebaseUser?.uid);
          setSyncError(null);
        } catch (error) {
          console.error("Error syncing stock:", error);
          setSyncError("Failed to sync data");
        } finally {
          setIsSyncing(false);
        }
      }, 5000); // Save 1 second after last change

      return () => clearTimeout(timeoutId);
    }
  }, [stockStatus, isLoading, firebaseUser]);

  const updateStock = (
    sizeKey: string,
    type: "canRun" | "cantRun",
    increment: boolean
  ) => {
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
            className="w-6 h-6 bg-red-500 text-white rounded hover:bg-red-600 transition-colors font-bold text-xs"
            disabled={isSyncing}
          >
            -
          </button>
          <div className="flex-1 text-center font-bold text-green-600 text-sm">
            {status.canRun}
          </div>
          <button
            onClick={() => updateStock(lengthKey, "canRun", true)}
            className="w-6 h-6 bg-green-500 text-white rounded hover:bg-green-600 transition-colors font-bold text-xs"
            disabled={isSyncing}
          >
            +
          </button>
        </div>

        <div className="flex-1 flex items-center gap-1">
          <button
            onClick={() => updateStock(lengthKey, "cantRun", false)}
            className="w-6 h-6 bg-red-500 text-white rounded hover:bg-red-600 transition-colors font-bold text-xs"
            disabled={isSyncing}
          >
            -
          </button>
          <div className="flex-1 text-center font-bold text-red-600 text-sm">
            {status.cantRun}
          </div>
          <button
            onClick={() => updateStock(lengthKey, "cantRun", true)}
            className="w-6 h-6 bg-green-500 text-white rounded hover:bg-green-600 transition-colors font-bold text-xs"
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
    <div className="min-h-screen bg-gray-50 p-4 flex justify-center">
      <div className="w-full max-w-[450px]">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-teal-700 bg-teal-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>

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
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 mb-4 sticky top-4 z-10">
          <h1 className="text-xl font-bold text-gray-800 mb-3">
            Timber Stock Tracker
          </h1>
          <div className="flex gap-4 text-sm">
            <div className="flex-1 bg-green-50 rounded p-2">
              <div className="text-gray-600 text-xs">Can Run</div>
              <div className="text-green-600 font-bold text-lg">
                {totals.canRun}
              </div>
            </div>
            <div className="flex-1 bg-red-50 rounded p-2">
              <div className="text-gray-600 text-xs">Can&apos;t Run</div>
              <div className="text-red-600 font-bold text-lg">
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

        <div className="space-y-6">
          {/* Untreated Section */}
          <div>
            <h2 className="text-lg font-bold text-white mb-3 bg-teal-800 p-2 rounded">
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
            <h2 className="text-lg font-bold text-white mb-3 bg-teal-800 p-2 rounded">
              Treated Timber
            </h2>
            <div className="space-y-3">
              {Object.entries(timberSizes.treated).map(([size, data]) =>
                renderSizeCard(size, "treated", data.lengths)
              )}
            </div>
          </div>
        </div>

        {/* Reset Button */}
        <button
          onClick={handleReset}
          disabled={isSyncing}
          className="w-full mt-6 bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSyncing ? "Resetting..." : "Reset All"}
        </button>
      </div>
    </div>
  );
}