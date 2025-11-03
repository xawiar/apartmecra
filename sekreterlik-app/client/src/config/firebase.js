// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAAkFCVr_IrA9qR8gAgDAZMGGk-xGsY2nA",
  authDomain: "ilsekreterliki.firebaseapp.com",
  projectId: "ilsekreterliki",
  storageBucket: "ilsekreterliki.firebasestorage.app",
  messagingSenderId: "112937724027",
  appId: "1:112937724027:web:03e419ca720eea178c1ade",
  measurementId: "G-YMN4TEP8Z1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services - Browser-safe initialization
let analytics = null;
let auth = null;
let db = null;
let storage = null;

if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (error) {
    console.error('Firebase initialization error:', error);
    // Fallback: Initialize without analytics
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  }
} else {
  // Server-side: Only initialize core services
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

export { analytics, auth, db, storage };

export default app;

