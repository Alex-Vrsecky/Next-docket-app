// scripts/fixCategories.js
import admin from "firebase-admin";
import path from "path";

// load your service account
const serviceAccount = require(path.resolve(__dirname, "../serviceAccountKey.json"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

(async () => {
  const snapshot = await db.collection("categories").get();
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (typeof data.subCategories === "string") {
      let arr;
      try {
        arr = JSON.parse(data.subCategories);
        if (!Array.isArray(arr)) throw new Error("Not an array");
      } catch (e) {
        console.error(`❌ ${doc.id} has invalid JSON:`, data.subCategories);
        continue;
      }
      await doc.ref.update({ subCategories: arr });
      console.log(`✅ Fixed ${doc.id}`);
    }
  }
  console.log("✅ Done fixing categories.");
  process.exit(0);
})();

