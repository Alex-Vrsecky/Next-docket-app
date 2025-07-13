const admin = require("firebase-admin");

// INIT: Replace with your service account path if not running on Firebase Hosting
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});
const db = admin.firestore();

async function fixSubCategories() {
  const catsRef = db.collection("categories");
  const snap = await catsRef.get();
  for (const doc of snap.docs) {
    let { subCategories } = doc.data();
    if (typeof subCategories === "string") {
      try {
        const parsed = JSON.parse(subCategories);
        if (Array.isArray(parsed)) {
          await doc.ref.update({ subCategories: parsed });
          console.log(`Fixed: ${doc.id}:`, parsed);
        }
      } catch (e: any) {
        console.error(`Skipping ${doc.id}: couldn't parse`, e.message);
      }
    }
  }
  console.log("Done.");
}

fixSubCategories();
