// ============================================================
// firebase.js  –  A3M Print
// BUG FIXED: أُضيف getAuth + Auth export + تم التحقق من الإعدادات
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey:            "AIzaSyCCb9EZyW1-QcZIJznTfYear1NZUmO08lQ",
  authDomain:        "a3mmedia-b4abb.firebaseapp.com",
  projectId:         "a3mmedia-b4abb",
  storageBucket:     "a3mmedia-b4abb.firebasestorage.app",
  messagingSenderId: "963128106205",
  appId:             "1:963128106205:web:4449c5172cc97b1b6c0f34"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);
const auth = getAuth(app);           // ← BUG FIX: كان ناقصاً

export { db, auth };
