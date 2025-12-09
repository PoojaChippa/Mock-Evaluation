// js/firebaseConfig.js
// Import Firebase modules from CDN (modular SDK)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// TODO: Replace with your project's config (from Firebase console)
const firebaseConfig = {
  apiKey: "AIzaSyBV4cl0ESnPCR2EtQQuT6TDQB6zvw6KiUE",
  authDomain: "time-tracking-web-applic-f14cc.firebaseapp.com",
  projectId: "time-tracking-web-applic-f14cc",
  storageBucket: "time-tracking-web-applic-f14cc.firebasestorage.app",
  messagingSenderId: "151114071786",
  appId: "1:151114071786:web:6eb5eb5be6ab9decfd2193",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

console.log("firebaseConfig.js → app name:", app.name);
console.log("firebaseConfig.js → auth object:", auth);

export { app, auth, db, googleProvider };
