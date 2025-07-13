// scripts/rebuildCategories.js
import admin from "firebase-admin";
import path from "path";

const serviceAccount = require(path.resolve(__dirname, "../serviceAccountKey.json"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

(async () => {
  // 1) Load all products
  const prodSnap = await db.collection("products").get();
  const map = new Map(); // category → Set<subCategory>

  prodSnap.docs.forEach((d) => {
    const { category, subCategory } = d.data();
    if (!category) return;
    if (!map.has(category)) map.set(category, new Set());
    if (subCategory) map.get(category).add(subCategory);
  });

  // 2) Overwrite categories collection
  for (const [name, subSet] of map.entries()) {
    const subs = Array.from(subSet);
    const docId = name.toLowerCase().replace(/\s+/g, "_");
    await db
      .collection("categories")
      .doc(docId)
      .set({ name, subCategories: subs }, { merge: true });
    console.log(`🗂️  Wrote '${name}' → ${subs.length} subCategories`);
  }

  console.log("✅ Rebuild complete.");
  process.exit(0);
})();
