// js/auth.js

import { auth, updateProfile } from './firebase-init.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

// Current user
export function currentUser() {
  return auth.currentUser;
}

// Require authentication for pages
export async function requireAuth() {
  return new Promise((resolve, reject) => {
    const unsub = auth.onAuthStateChanged(user => {
      unsub();
      if (user) resolve(user);
      else {
        window.location.href = 'login.html?next=' + encodeURIComponent(location.pathname);
        reject(new Error("Not logged in"));
      }
    });
  });
}

// Sign up
export async function signUp({ name, email, password }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (name) await updateProfile(cred.user, { displayName: name });
  await sendEmailVerification(cred.user); // Fire email verification
  return cred.user;
}

// Sign in
export async function signIn(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

// Sign out
export async function signOut() {
  await fbSignOut(auth);
}

// Send password reset email
export async function sendReset(email) {
  return sendPasswordResetEmail(auth, email);
}

// Google sign-in
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
}
