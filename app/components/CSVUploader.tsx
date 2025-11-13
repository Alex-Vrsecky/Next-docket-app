// components/CSVUploader.tsx
"use client";

import { useState } from "react";
import Papa from "papaparse";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/app/firebase/firebaseInit"; // adjust to your config

export default function CSVUploader() {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [collectionName, setCollectionName] = useState("products");

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage("Uploading...");

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: Papa.ParseResult<Record<string, string>>) => {
        const products = results.data;
        const productsRef = collection(db, collectionName);

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
      <label className="block mb-2">
        Collection Name:
        <input
          type="text"
          value={collectionName}
          onChange={(e) => setCollectionName(e.target.value)}
          className="mt-1 block w-full border rounded p-2"
        />
      </label>
      <input
        className="cursor-pointer"
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
      />
      <p className="mt-2 text-sm text-gray-600">
        {uploading ? "Uploading..." : message}
      </p>
    </div>
  );
}
