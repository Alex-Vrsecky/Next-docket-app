"use client";

import React, { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/app/firebase/firebaseInit";
import { ProductInterface } from "@/app/_types/productInterface";
import Papa from "papaparse";

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (products: ProductInterface[]) => void;
}

interface ParsedProduct {
  category: string;
  subCategory: string;
  Desc: string;
  Extra: string;
  Length: string;
  productIN: string;
  error?: string;
}

/**
 * CSV import modal with validation and preview
 * Expected CSV columns: category, subCategory, description, extra, length
 */
export function CSVImportModal({
  isOpen,
  onClose,
  onSuccess,
}: CSVImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [step, setStep] = useState<"upload" | "preview" | "importing">("upload");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      setError("Please select a CSV file");
      return;
    }

    setFile(selectedFile);
    setError(null);
    setValidationErrors([]);
  };

  const validateAndParseCSV = async () => {
    if (!file) return;

    setIsValidating(true);
    setError(null);
    setValidationErrors([]);

    try {
      // Read file
      const text = await file.text();

      // Parse CSV
      const results = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim().toLowerCase(),
      });

      if (results.errors && results.errors.length > 0) {
        setError("Error parsing CSV file");
        setIsValidating(false);
        return;
      }

      // Validate and transform products
      const errors: string[] = [];
      const products: ParsedProduct[] = [];

      (results.data as Record<string, string>[]).forEach((row, idx) => {
        const rowNum = idx + 2; // +2 because of header row and 1-based indexing
        const rowErrors: string[] = [];

        // Extract fields (support various column names)
        const category =
          row.category ||
          row.cat ||
          row["product category"] ||
          "";
        const subCategory =
          row.subcategory ||
          row.subcat ||
          row["sub category"] ||
          row.size ||
          "";
        const desc =
          row.description ||
          row.desc ||
          row.name ||
          row.product ||
          "";
        const extra = row.extra || row.notes || "";
        const length = row.length || row.size || "";

        // Validation
        if (!category.trim())
          rowErrors.push("Category is required");
        if (!subCategory.trim())
          rowErrors.push("Sub-category is required");
        if (!desc.trim())
          rowErrors.push("Description is required");

        if (rowErrors.length > 0) {
          errors.push(
            `Row ${rowNum}: ${rowErrors.join(", ")}`
          );
          return;
        }

        // Create product
        const productIN = `${desc}-${length}`
          .replace(/\s+/g, "-")
          .toLowerCase()
          .substring(0, 50);

        products.push({
          category: category.trim(),
          subCategory: subCategory.trim(),
          Desc: desc.trim(),
          Extra: extra.trim(),
          Length: length.trim() || "N/A",
          productIN: productIN,
        });
      });

      if (products.length === 0) {
        setError("No valid products found in CSV");
        setIsValidating(false);
        return;
      }

      setParsedProducts(products);
      setValidationErrors(errors);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse CSV");
    } finally {
      setIsValidating(false);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    setError(null);

    try {
      const productsRef = collection(db, "products");
      const createdProducts: ProductInterface[] = [];

      for (const product of parsedProducts) {
        const docRef = await addDoc(productsRef, {
          ...product,
          imageSrc: "",
          LengthCoveragePackaging: "",
          createdAt: serverTimestamp(),
        });

        createdProducts.push({
          ...product,
          id: docRef.id,
        } as ProductInterface);
      }

      onSuccess(createdProducts);
      setStep("importing");

      // Reset after 2 seconds
      setTimeout(() => {
        setFile(null);
        setParsedProducts([]);
        setStep("upload");
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import products");
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">Import Products from CSV</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ✕
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {step === "upload" && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700 mb-2 block">
                    Select CSV File
                  </span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-teal-50 file:text-teal-700
                      hover:file:bg-teal-100"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    CSV columns: category, subCategory, description, extra, length
                  </p>
                </label>
              </div>

              {file && (
                <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
                  ✓ Selected: {file.name}
                </div>
              )}

              <div className="p-3 bg-blue-50 rounded-lg text-xs text-gray-700 space-y-1">
                <p className="font-semibold">CSV Format Example:</p>
                <pre className="overflow-x-auto bg-white p-2 rounded border border-blue-200">
{`category,subCategory,description,extra,length
Treated Pine,2x4,Timber,Premium,2400mm
Untreated Pine,2x6,Lumber,,4800mm`}
                </pre>
              </div>

              <button
                onClick={validateAndParseCSV}
                disabled={!file || isValidating}
                className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 disabled:opacity-50 transition-colors text-sm"
              >
                {isValidating ? "Validating..." : "Validate & Preview"}
              </button>
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-4">
              {validationErrors.length > 0 && (
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="text-xs font-semibold text-yellow-800 mb-2">
                    ⚠️ {validationErrors.length} row(s) with issues:
                  </p>
                  <div className="text-xs text-yellow-700 space-y-1 max-h-32 overflow-y-auto">
                    {validationErrors.map((err, idx) => (
                      <div key={idx}>• {err}</div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">
                  Ready to import: {parsedProducts.length} products
                </p>
                <div className="max-h-64 overflow-y-auto border rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold">Category</th>
                        <th className="px-3 py-2 text-left font-semibold">SubCat</th>
                        <th className="px-3 py-2 text-left font-semibold">Description</th>
                        <th className="px-3 py-2 text-left font-semibold">Length</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedProducts.map((p, idx) => (
                        <tr key={idx} className="border-t hover:bg-gray-50">
                          <td className="px-3 py-2">{p.category}</td>
                          <td className="px-3 py-2">{p.subCategory}</td>
                          <td className="px-3 py-2">{p.Desc}</td>
                          <td className="px-3 py-2">{p.Length}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setStep("upload")}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-sm"
                >
                  Back
                </button>
                <button
                  onClick={handleImport}
                  disabled={isImporting}
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 disabled:opacity-50 transition-colors text-sm"
                >
                  {isImporting ? "Importing..." : `Import ${parsedProducts.length} Products`}
                </button>
              </div>
            </div>
          )}

          {step === "importing" && (
            <div className="py-8 text-center">
              <p className="text-lg font-semibold text-green-600">
                ✓ Successfully imported {parsedProducts.length} products!
              </p>
              <p className="text-xs text-gray-500 mt-2">Closing in a moment...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
