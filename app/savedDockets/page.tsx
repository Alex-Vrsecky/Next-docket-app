"use client";

import { useState, useEffect } from "react";
import { auth } from "@/app/firebase/firebaseInit";
import {
  getSavedLists,
  createSavedList,
  deleteSavedList,
} from "@/app/database/firebaseService";
import { SavedList } from "../database/types";

export default function SavedListsComponent() {
  const [lists, setLists] = useState<SavedList[]>([]);
  const [newListName, setNewListName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const userLists = await getSavedLists(user.uid);
      setLists(userLists);
    } catch (error) {
      console.error("Error loading lists:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateList = async () => {
    const user = auth.currentUser;
    if (!user || !newListName.trim()) return;

    try {
      await createSavedList(user.uid, newListName);
      setNewListName("");
      await loadLists();
    } catch (error) {
      console.error("Error creating list:", error);
    }
  };

  const handleDeleteList = async (listId: string) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      await deleteSavedList(user.uid, listId);
      await loadLists();
    } catch (error) {
      console.error("Error deleting list:", error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Saved Lists</h2>

      {/* Create new list */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
          placeholder="New list name"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
        />
        <button
          onClick={handleCreateList}
          className="bg-[rgb(13,82,87)] text-white px-6 py-2 rounded-lg hover:bg-[rgb(10,65,69)]"
        >
          Create
        </button>
      </div>

      {/* Display lists */}
      <div className="space-y-4">
        {lists.map((list) => (
          <div
            key={list.id}
            className="bg-white p-4 rounded-lg shadow border border-gray-200"
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">{list.name}</h3>
                <p className="text-sm text-gray-500">
                  {list.products.length} products
                </p>
              </div>
              <button
                onClick={() => handleDeleteList(list.id)}
                className="text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
// ```

// **Firebase Firestore Structure:**
// ```
// users/
//   {uid}/
//     firstName: "John"
//     lastName: "Doe"
//     createdAt: timestamp
    
//     savedLists/
//       {listId}/
//         name: "My Build List"
//         products: [
//           { id: "1", name: "Product 1", quantity: 5 },
//           { id: "2", name: "Product 2", quantity: 3 }
//         ]
//         createdAt: timestamp
//         updatedAt: timestamp
// ```

// **Firebase Console Setup:**
// 1. Go to Firebase Console
// 2. Enable Anonymous Authentication (or Email/Password if preferred)
// 3. Create Firestore Database
// 4. Set security rules (for development):
// ```
// rules_version = '2';
// service cloud.firestore {
//   match /databases/{database}/documents {
//     match /users/{userId} {
//       allow read, write: if request.auth != null && request.auth.uid == userId;
      
//       match /savedLists/{listId} {
//         allow read, write: if request.auth != null && request.auth.uid == userId;
//       }
//     }
//   }
// }