// js/books.js
import { db } from './firebase-init.js';
import { currentUser } from './auth.js';
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  getDoc,
  doc,
  query,
  orderBy,
  deleteDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const BOOKS = 'books';

/**
 * Add a new book (owner must be logged in)
 */
// MODIFIED: Added ownerPhone argument
export async function addBook({ title, author, edition, condition, price, isFree, description, ownerPhone }) {
  const user = currentUser();
  if (!user) throw new Error('You must be logged in to publish a book.');

  const payload = {
    title,
    author,
    edition: edition || '',
    condition: condition || '',
    price: isFree ? 0 : Number(price || 0),
    isFree: Boolean(isFree),
    description: description || '',
    ownerUid: user.uid,
    ownerName: user.displayName || user.email,
    ownerEmail: user.email || '',
    ownerPhone: ownerPhone || '', // MODIFIED: Store the owner's phone
    createdAt: serverTimestamp(),
    available: true, // default available
  };

  await addDoc(collection(db, BOOKS), payload);
}

/**
 * Fetch all books (newest first)
 * returns [{ id, ...data }]
 */
export async function getBooks() {
  const snap = await getDocs(query(collection(db, BOOKS), orderBy('createdAt', 'desc')));
  const rows = [];
  snap.forEach(d => rows.push({ id: d.id, ...d.data() }));
  return rows;
}

/**
 * Return the latest request document (object) made by a given user for a book
 * returns null or: { id, status, requesterUid, requestedAt, ... }
 */
export async function getRequestForUser(bookId, userUid) {
  if (!bookId || !userUid) return null;
  const reqSnap = await getDocs(collection(db, 'books', bookId, 'requests'));
  let best = null;
  reqSnap.forEach(r => {
    const data = r.data();
    if (data.requesterUid === userUid) {
      // choose the most recent requestedAt
      const ts = data.requestedAt?.toDate ? data.requestedAt.toDate().getTime() : 0;
      const bestTs = best?.requestedAt?.toDate ? best.requestedAt.toDate().getTime() : 0;
      if (!best || ts >= bestTs) best = { id: r.id, ref: r.ref, ...data };
    }
  });
  return best;
}

/**
 * Request a book (creates a requests sub-doc and notifies publisher)
 */
export async function requestBook(bookId) {
  const user = currentUser();
  if (!user) {
    // caller pages usually redirect to login; we throw so UI can decide
    throw new Error('Login required to request a book');
  }

  const bookRef = doc(db, BOOKS, bookId);
  const bookSnap = await getDoc(bookRef);
  if (!bookSnap.exists()) throw new Error('Book not found');
  const bookData = bookSnap.data();

  if (bookData.ownerUid === user.uid) {
    throw new Error("You can't request your own book.");
  }

  // If user already has a pending/accepted request, return a helpful message
  const existing = await getRequestForUser(bookId, user.uid);
  if (existing && existing.status === 'pending') {
    throw new Error('You already requested this book. Please wait for the publisher to respond.');
  }
  if (existing && existing.status === 'accepted') {
    throw new Error('Your request for this book has already been accepted.');
  }

  // Create request under books/{bookId}/requests
  await addDoc(collection(db, BOOKS, bookId, 'requests'), {
    requesterUid: user.uid,
    requesterName: user.displayName || user.email,
    requesterEmail: user.email || '',
    requestedAt: serverTimestamp(),
    status: 'pending'
  });

  // Notify publisher about the new request
  const notifRef = collection(db, "notifications", bookData.ownerUid, "items");
  const message = `New request for your book "${bookData.title}" from ${user.displayName || user.email}`;
  await addDoc(notifRef, {
    message,
    status: 'pending',
    bookId,
    requesterUid: user.uid,
    requesterEmail: user.email || '',
    publisherEmail: bookData.ownerEmail || bookData.ownerName || '',
    createdAt: serverTimestamp(),
    read: false
  });

  // Keep only latest 20 notifications for publisher (best-effort)
  const snap = await getDocs(query(notifRef, orderBy("createdAt", "desc")));
  if (snap.size > 20) {
    const excess = snap.docs.slice(20);
    for (const d of excess) {
      await deleteDoc(d.ref);
    }
  }
}

/**
 * Delete a book (only owner)
 */
export async function deleteBook(bookId) {
  const user = currentUser();
  if (!user) throw new Error("Not logged in");
  const bookRef = doc(db, BOOKS, bookId);
  const bookSnap = await getDoc(bookRef);
  if (!bookSnap.exists()) throw new Error("Book not found");
  const bookData = bookSnap.data();
  if (bookData.ownerUid !== user.uid) {
    throw new Error("You do not have permission to delete this book");
  }
  await deleteDoc(bookRef);
}

/**
 * Utility: mark book availability (used by notifications when a publisher accepts)
 */
export async function setBookAvailability(bookId, available) {
  const bookRef = doc(db, BOOKS, bookId);
  await updateDoc(bookRef, { available: Boolean(available) });
}