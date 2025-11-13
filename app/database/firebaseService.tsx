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
} from "firebase/firestore";
import { db } from "../firebase/firebaseInit";
import { Product, SavedList, User } from "./types";

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
  products: Product[] = []
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
  product: Product
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
  product: Product
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