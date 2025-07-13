import { db } from './firebaseInit';
import {
  collection,
  getDocs,
  updateDoc
} from "firebase/firestore";

async function migrateSubcats() {
  const snaps = await getDocs(collection(db, 'categories'));
  for (const doc of snaps.docs) {
    const data = doc.data();
    if (typeof data.subCategories === 'string') {
      let arr: string[];
      try {
        arr = JSON.parse(data.subCategories);
      } catch {
        console.error(`Bad JSON in ${doc.id}`, data.subCategories);
        continue;
      }
      await updateDoc(doc.ref, { subCategories: arr });
      console.log(`Updated ${doc.id}`);
    }
  }
}

migrateSubcats().catch(console.error);
