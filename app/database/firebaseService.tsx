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
} from "firebase/firestore";
import { db } from "../firebase/firebaseInit";
import { ProductItem, SavedList, User } from "./types";

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
