'use client';

import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, getDocs, query, orderBy, doc, getDoc, Timestamp, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseInit';
import Header from '../../components/Header';
import NavigationMenu from '../../components/NavigationMenu';
import { useRouter, usePathname } from 'next/navigation';

interface Note {
  id: string;
  text: string;
  author: string;
  date: Date;
  createdAt: Timestamp;
}

export default function NotesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [userName, setUserName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // Check authentication
  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push(`/userSignIn?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      try {
        let firstName = '';
        let lastName = '';

        if (user.displayName) {
          const nameParts = user.displayName.split(' ');
          firstName = nameParts[0];
          lastName = nameParts[nameParts.length - 1];
        } else {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            firstName = userData.firstName || userData.name || user.email?.split('@')[0] || '';
            lastName = userData.lastName || '';
          }
        }

        setUserName(`${firstName} ${lastName.charAt(0).toUpperCase()}`);
        setIsAuthorized(true);
      } catch (err) {
        console.error('Error checking authentication:', err);
        setError('Error checking authentication.');
      } finally {
        setIsCheckingAuth(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Fetch notes
  useEffect(() => {
    if (!isCheckingAuth && isAuthorized) {
      const fetchNotes = async () => {
        try {
          const notesQuery = query(collection(db, 'notes'), orderBy('createdAt', 'desc'));
          const querySnapshot = await getDocs(notesQuery);
          const fetchedNotes: Note[] = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            text: doc.data().text,
            author: doc.data().author,
            date: doc.data().createdAt.toDate(),
            createdAt: doc.data().createdAt,
          }));
          setNotes(fetchedNotes);
        } catch (err) {
          console.error('Error fetching notes:', err);
          setError('Error loading notes.');
        } finally {
          setLoading(false);
        }
      };

      fetchNotes();
    }
  }, [isCheckingAuth, isAuthorized]);

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      alert('Please enter a note');
      return;
    }

    try {
      const docRef = await addDoc(collection(db, 'notes'), {
        text: newNote,
        author: userName,
        createdAt: Timestamp.now(),
      });

      const newNoteObj: Note = {
        id: docRef.id,
        text: newNote,
        author: userName,
        date: new Date(),
        createdAt: Timestamp.now(),
      };

      setNotes([newNoteObj, ...notes]);
      setNewNote('');
    } catch (err) {
      console.error('Error adding note:', err);
      alert('Failed to add note');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'notes', noteId));
      setNotes(notes.filter((note) => note.id !== noteId));
    } catch (err) {
      console.error('Error deleting note:', err);
      alert('Failed to delete note');
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNoteId(note.id);
    setEditingText(note.text);
  };

  const handleSaveEdit = async () => {
    if (!editingText.trim()) {
      alert('Note cannot be empty');
      return;
    }

    try {
      await updateDoc(doc(db, 'notes', editingNoteId!), {
        text: editingText,
      });

      setNotes(
        notes.map((note) =>
          note.id === editingNoteId ? { ...note, text: editingText } : note
        )
      );
      setEditingNoteId(null);
      setEditingText('');
    } catch (err) {
      console.error('Error editing note:', err);
      alert('Failed to edit note');
    }
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingText('');
  };

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading notes...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center pt-6 min-h-screen bg-gray-50">
      <NavigationMenu isOpen={isMenuOpen} toggleMenu={toggleMenu} />
      <Header />
      <main className="p-4 w-full px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-gray-900">Notes</h1>

          {error && <p className="text-green-800 mb-4">{error}</p>}

          {/* Add Note Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add a new note:
            </label>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(13,82,87)] resize-none"
              placeholder="Write your note here..."
            />
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Signed as: <span className="font-semibold">{userName}</span>
              </p>
              <button
                onClick={handleAddNote}
                className="px-4 py-2 bg-[rgb(13,82,87)] text-white rounded-lg hover:bg-[rgb(10,65,69)] transition-colors font-medium"
              >
                Post Note
              </button>
            </div>
          </div>

          {/* Notes List */}
          <div className="space-y-4">
            {notes.length === 0 ? (
              <p className="text-center text-gray-500">No notes yet. Be the first to add one!</p>
            ) : (
              notes.map((note) => (
                <div key={note.id} className="bg-white rounded-lg shadow-md p-6">
                  {editingNoteId === note.id ? (
                    <div>
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(13,82,87)] resize-none mb-3"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition-colors text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          className="px-3 py-1 bg-[rgb(13,82,87)] text-white rounded hover:bg-[rgb(10,65,69)] transition-colors text-sm"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-gray-800 mb-4 whitespace-pre-wrap">{note.text}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="font-semibold">{note.author}</span>
                          <span>{note.date.toLocaleDateString()} {note.date.toLocaleTimeString()}</span>
                        </div>
                        {note.author === userName && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditNote(note)}
                              className="px-3 py-1 bg-transparent text-black rounded hover:cursor-pointer transition-all text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="px-3 py-1 bg-transparent text-black rounded  text-sm hover:cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
