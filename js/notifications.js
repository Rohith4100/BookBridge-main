// js/notifications.js
import { db } from "./firebase-init.js";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  serverTimestamp,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/**
 * Publisher updates request (accept/reject) and notifies requester.
 * If accepted -> mark book available:false
 */
export async function updateRequestStatus(
  bookId,
  requestId,
  newStatus,
  publisherEmail,
  requesterUid,
  bookTitle,
  ownerPhone
) {
  const requestRef = doc(db, "books", bookId, "requests", requestId);
  await updateDoc(requestRef, { status: newStatus });

  // If accepted, mark book unavailable
  if (newStatus === 'accepted') {
    try {
      const bookRef = doc(db, "books", bookId);
      await updateDoc(bookRef, { available: false });
    } catch (e) {
      // don't block the notification if book update fails, but log
      console.error("Failed to mark book unavailable:", e);
    }
  }

  const notifRef = collection(db, "notifications", requesterUid, "items");
  
  // MODIFIED BLOCK START: Construct clear message with both email and phone
  let contactDetails = `Contact: ${publisherEmail}`;
  if (ownerPhone) {
      contactDetails += ` / Phone: ${ownerPhone}`; 
  }

  const message =
    newStatus === "accepted"
      // UPDATED MESSAGE: Include the constructed contactDetails string directly.
      ? `Your request for "${bookTitle}" has been accepted! You can contact the publisher to arrange the exchange. ${contactDetails}`
      : `Your request for "${bookTitle}" has been rejected by the publisher`;
  // MODIFIED BLOCK END
  
  await addDoc(notifRef, {
    message,
    status: newStatus,
    bookId,
    requestId,
    publisherEmail,
    createdAt: serverTimestamp(),
    read: false
  });

  // Keep only 20 latest notifications for the requester
  const snap = await getDocs(query(notifRef, orderBy("createdAt", "desc")));
  if (snap.size > 20) {
    const excess = snap.docs.slice(20);
    for (const d of excess) {
      await deleteDoc(d.ref);
    }
  }
}