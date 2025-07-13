// migrations/fixCategories.js
import admin from "firebase-admin";
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});
const db = admin.firestore();

(async () => {
  const cats = await db.collection("categories").get();
  for (const doc of cats.docs) {
    const data = doc.data();
    if (typeof data.subCategories === "string") {
      let arr = [];
      try {
        arr = JSON.parse(data.subCategories);
        if (!Array.isArray(arr)) throw new Error();
      } catch {
        console.error(`Doc ${doc.id} has non-JSON subCategories`, data.subCategories);
        continue;
      }
      await doc.ref.update({ subCategories: arr });
      console.log(`Fixed ${doc.id}`);
    }
  }
  console.log("Done fixing existing category docs.");
  process.exit(0);
})();
