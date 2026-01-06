// lib/firebaseService.ts
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  query,
  orderBy,
  addDoc,
  Timestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase/firebaseInit";
import { ProductItem, SavedList, User } from "./types";
import { CategoryInterface } from "../_types/categoryInterface";

// ============= META COLLECTION (Categories) =============

/**
 * Get all categories from the meta collection
 */
export async function getCategories(): Promise<CategoryInterface[]> {
  try {
    const metaRef = doc(db, "meta", "categories");
    const metaSnap = await getDoc(metaRef);

    if (metaSnap.exists()) {
      const data = metaSnap.data();
      return data.categories || [];
    }

    // If meta collection doesn't exist, build from products
    return await buildCategoriesFromProducts();
  } catch (error) {
    console.error("Error getting categories from meta:", error);
    return [];
  }
}

/**
 * Build categories from products collection (fallback)
 */
async function buildCategoriesFromProducts(): Promise<CategoryInterface[]> {
  try {
    const productsRef = collection(db, "products");
    const snapshot = await getDocs(productsRef);

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

    const categories: CategoryInterface[] = Array.from(
      categoryMap.entries()
    ).map(([name, subCats]) => ({
      name,
      subCategories: Array.from(subCats).sort(),
    }));

    return categories.sort((a, b) =>
      (a.name || "").localeCompare(b.name || "")
    );
  } catch (error) {
    console.error("Error building categories from products:", error);
    return [];
  }
}

/**
 * Update the meta collection with categories
 */
export async function updateCategoriesMeta(
  categories: CategoryInterface[]
): Promise<void> {
  try {
    const metaRef = doc(db, "meta", "categories");
    await setDoc(
      metaRef,
      {
        categories,
        lastUpdated: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Error updating categories meta:", error);
    throw error;
  }
}

/**
 * Rebuild the meta collection from the products collection
 * Use this to sync categories data
 */
export async function rebuildCategoriesMeta(): Promise<void> {
  try {
    const categories = await buildCategoriesFromProducts();
    await updateCategoriesMeta(categories);
    console.log("Categories meta rebuilt successfully");
  } catch (error) {
    console.error("Error rebuilding categories meta:", error);
    throw error;
  }
}

// Create or update user
export async function createUser(
  uid: string,
  firstName: string,
  lastName: string
) {
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, {
    firstName,
    lastName,
    createdAt: serverTimestamp(),
  });
}

// Get user data
export async function getUser(uid: string): Promise<User | null> {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return { uid, ...userSnap.data() } as User;
  }
  return null;
}

// Create a new saved list
export async function createSavedList(
  uid: string,
  listName: string,
  products: ProductItem[] = []
) {
  const listsRef = collection(db, "users", uid, "savedLists");
  const newListRef = doc(listsRef);

  await setDoc(newListRef, {
    name: listName,
    products,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return newListRef.id;
}

// Get all saved lists for a user
export async function getSavedLists(uid: string): Promise<SavedList[]> {
  const listsRef = collection(db, "users", uid, "savedLists");
  const querySnapshot = await getDocs(listsRef);

  const lists: SavedList[] = [];
  querySnapshot.forEach((doc) => {
    lists.push({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    } as SavedList);
  });

  return lists;
}

// Get a specific saved list
export async function getSavedList(
  uid: string,
  listId: string
): Promise<SavedList | null> {
  const listRef = doc(db, "users", uid, "savedLists", listId);
  const listSnap = await getDoc(listRef);

  if (listSnap.exists()) {
    return {
      id: listSnap.id,
      ...listSnap.data(),
      createdAt: listSnap.data().createdAt?.toDate(),
      updatedAt: listSnap.data().updatedAt?.toDate(),
    } as SavedList;
  }
  return null;
}

// Add product to a saved list
export async function addProductToList(
  uid: string,
  listId: string,
  product: ProductItem
) {
  const listRef = doc(db, "users", uid, "savedLists", listId);
  await updateDoc(listRef, {
    products: arrayUnion(product),
    updatedAt: serverTimestamp(),
  });
}

// Remove product from a saved list
export async function removeProductFromList(
  uid: string,
  listId: string,
  product: ProductItem
) {
  const listRef = doc(db, "users", uid, "savedLists", listId);
  await updateDoc(listRef, {
    products: arrayRemove(product),
    updatedAt: serverTimestamp(),
  });
}

// Update entire list
export async function updateSavedList(
  uid: string,
  listId: string,
  updates: Partial<SavedList>
) {
  const listRef = doc(db, "users", uid, "savedLists", listId);
  await updateDoc(listRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

// Delete a saved list
export async function deleteSavedList(uid: string, listId: string) {
  const listRef = doc(db, "users", uid, "savedLists", listId);
  await deleteDoc(listRef);
}

// Rename a saved list
export async function renameSavedList(
  uid: string,
  listId: string,
  newName: string
) {
  const listRef = doc(db, "users", uid, "savedLists", listId);
  await updateDoc(listRef, {
    name: newName,
    updatedAt: serverTimestamp(),
  });
}

export async function getSavedDockets(): Promise<SavedList[]> {
  try {
    const docketsRef = collection(db, "saved_dockets");
    const q = query(docketsRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as SavedList[];
  } catch (error) {
    console.error("Error getting saved dockets:", error);
    throw error;
  }
}

export async function getSavedDocket(
  docketId: string
): Promise<SavedList | null> {
  try {
    const docketRef = doc(db, "saved_dockets", docketId);
    const docketSnap = await getDoc(docketRef);

    if (docketSnap.exists()) {
      return {
        id: docketSnap.id,
        ...docketSnap.data(),
      } as SavedList;
    }
    return null;
  } catch (error) {
    console.error("Error getting docket:", error);
    throw error;
  }
}

export async function createSavedDocket(
  name: string,
  products: ProductItem[] = []
): Promise<string> {
  try {
    const docketsRef = collection(db, "saved_dockets");
    const docRef = await addDoc(docketsRef, {
      name: name.trim(),
      products: products,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating docket:", error);
    throw error;
  }
}

export async function deleteSavedDocket(docketId: string): Promise<void> {
  try {
    const docketRef = doc(db, "saved_dockets", docketId);
    await deleteDoc(docketRef);
  } catch (error) {
    console.error("Error deleting docket:", error);
    throw error;
  }
}

export async function updateDocketName(
  docketId: string,
  newName: string
): Promise<void> {
  try {
    const docketRef = doc(db, "saved_dockets", docketId);
    await updateDoc(docketRef, {
      name: newName.trim(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error updating docket name:", error);
    throw error;
  }
}
export interface StockStatus {
  [key: string]: {
    canRun: number;
    cantRun: number;
  };
}

export interface TimberStockDocument {
  stockStatus: StockStatus;
  lastUpdated: Timestamp;
  updatedBy?: string;
}

// Collection reference
const TIMBER_STOCK_COLLECTION = "timberStock";
const STOCK_DOC_ID = "currentStock"; // Single document for all stock data

/**
 * Save stock status to Firebase
 */
export const saveTimberStock = async (
  stockStatus: StockStatus,
  userId?: string
): Promise<void> => {
  try {
    const stockRef = doc(db, TIMBER_STOCK_COLLECTION, STOCK_DOC_ID);

    await setDoc(
      stockRef,
      {
        stockStatus,
        lastUpdated: Timestamp.now(),
        updatedBy: userId || "anonymous",
      },
      { merge: true }
    );

    console.log("Timber stock saved successfully");
  } catch (error) {
    console.error("Error saving timber stock:", error);
    throw error;
  }
};

/**
 * Get current stock status from Firebase
 */
export const getTimberStock = async (): Promise<StockStatus> => {
  try {
    const stockRef = doc(db, TIMBER_STOCK_COLLECTION, STOCK_DOC_ID);
    const stockSnap = await getDoc(stockRef);

    if (stockSnap.exists()) {
      const data = stockSnap.data() as TimberStockDocument;
      return data.stockStatus;
    }

    // Return empty stock if document doesn't exist
    return {};
  } catch (error) {
    console.error("Error getting timber stock:", error);
    throw error;
  }
};

/**
 * Update a specific stock item
 */
export const updateStockItem = async (
  itemKey: string,
  canRun: number,
  cantRun: number,
  userId?: string
): Promise<void> => {
  try {
    const stockRef = doc(db, TIMBER_STOCK_COLLECTION, STOCK_DOC_ID);

    await updateDoc(stockRef, {
      [`stockStatus.${itemKey}`]: {
        canRun,
        cantRun,
      },
      lastUpdated: Timestamp.now(),
      updatedBy: userId || "anonymous",
    });
  } catch (error) {
    console.error("Error updating stock item:", error);
    throw error;
  }
};

/**
 * Subscribe to real-time stock updates
 * Returns an unsubscribe function
 */
export const subscribeToTimberStock = (
  callback: (stockStatus: StockStatus) => void
): (() => void) => {
  const stockRef = doc(db, TIMBER_STOCK_COLLECTION, STOCK_DOC_ID);

  const unsubscribe = onSnapshot(
    stockRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as TimberStockDocument;
        callback(data.stockStatus);
      } else {
        callback({});
      }
    },
    (error) => {
      console.error("Error in stock subscription:", error);
    }
  );

  return unsubscribe;
};

/**
 * Reset all stock to zero
 */
export const resetTimberStock = async (userId?: string): Promise<void> => {
  try {
    const stockRef = doc(db, TIMBER_STOCK_COLLECTION, STOCK_DOC_ID);

    await setDoc(stockRef, {
      stockStatus: {},
      lastUpdated: Timestamp.now(),
      updatedBy: userId || "anonymous",
    });

    console.log("Timber stock reset successfully");
  } catch (error) {
    console.error("Error resetting timber stock:", error);
    throw error;
  }
};

/**
 * Get last update timestamp
 */
export const getLastUpdateTime = async (): Promise<Date | null> => {
  try {
    const stockRef = doc(db, TIMBER_STOCK_COLLECTION, STOCK_DOC_ID);
    const stockSnap = await getDoc(stockRef);

    if (stockSnap.exists()) {
      const data = stockSnap.data() as TimberStockDocument;
      return data.lastUpdated.toDate();
    }

    return null;
  } catch (error) {
    console.error("Error getting last update time:", error);
    return null;
  }
};