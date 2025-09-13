// js/firebase-init.js
// Using Firebase v10+ modular SDK via CDN imports from HTML pages with type="module"

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged as _onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// 1) Put YOUR config here (Project Settings → Web App)
const firebaseConfig = {
  apiKey: "AIzaSyCKW5ouLC5TsU9NFhCyxxdEQFhnX8dVEGw",
  authDomain: "bookloop-123.firebaseapp.com",
  projectId: "bookloop-123",
  storageBucket: "bookloop-123.firebasestorage.app",
  messagingSenderId: "779676022906",
  appId: "1:779676022906:web:6e647d0e4379a4e60223c3"
};


// 2) Initialize
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Small passthrough helper so pages can import consistently
export const onAuthStateChanged = _onAuthStateChanged;
export { updateProfile };
