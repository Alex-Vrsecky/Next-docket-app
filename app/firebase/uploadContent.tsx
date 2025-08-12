// components/CSVUploader.tsx
"use client";

import { useState, type ChangeEvent } from "react";
import Papa from "papaparse";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/app/firebase/firebaseInit"; // adjust to your config

export default function CSVUploader() {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage("Uploading...");

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: Papa.ParseResult<any>) => {
        const products = results.data;
        const productsRef = collection(db, "categories");

        for (const product of products) {
          try {
            await addDoc(productsRef, product);
            console.log("Uploaded:", product.productIN || product.subCategory);
          } catch (err) {
            console.error("Error uploading:", product, err);
          }
        }

        setUploading(false);
        setMessage("Upload complete!");
      },
    });
  };

  return (
    <div className="p-4 border rounded">
      <h2 className="text-lg font-semibold mb-2">Upload Products CSV</h2>
      <input type="file" accept=".csv" onChange={handleFileUpload} />
      <p className="mt-2 text-sm text-gray-600">
        {uploading ? "Uploading..." : message}
      </p>
    </div>
  );
}
