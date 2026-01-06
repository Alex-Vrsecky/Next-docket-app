/**
 * Script to initialize and populate the meta collection with categories
 * Run once to build the categories meta collection from existing products
 * 
 * Usage: node scripts/initCategoriesMeta.ts
 * (or using tsx: npx tsx scripts/initCategoriesMeta.ts)
 */

import * as admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";

// Initialize Firebase Admin
const serviceAccountPath = path.join(
  __dirname,
  "../firebase-service-account.json"
);

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} catch (error) {
  console.error("Failed to initialize Firebase Admin:", error);
  process.exit(1);
}

const db = admin.firestore();

interface CategoryData {
  name?: string;
  subCategories?: string[];
}

async function initCategoriesMeta() {
  try {
    console.log("Building categories from products collection...");

    const productsRef = db.collection("products");
    const snapshot = await productsRef.get();

    const categoryMap = new Map<string, Set<string>>();

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.category) {
        if (!categoryMap.has(data.category)) {
          categoryMap.set(data.category, new Set());
        }
        if (data.subCategory) {
          categoryMap.get(data.category)!.add(data.subCategory);
        }
      }
    });

    const categories: CategoryData[] = Array.from(
      categoryMap.entries()
    )
      .map(([name, subCats]) => ({
        name,
        subCategories: Array.from(subCats).sort(),
      }))
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));

    console.log(`Found ${categories.length} categories`);

    // Write to meta collection
    const metaRef = db.collection("meta").doc("categories");
    await metaRef.set({
      categories,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(
      "✓ Categories meta collection initialized successfully!"
    );
    console.log("\nCategories:");
    categories.forEach((cat) => {
      console.log(
        `  - ${cat.name} (${cat.subCategories?.length || 0} subcategories)`
      );
    });

    process.exit(0);
  } catch (error) {
    console.error("Error initializing categories meta:", error);
    process.exit(1);
  }
}

initCategoriesMeta();
