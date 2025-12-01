// src/config/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDRYJ8wJpjIi4qF1jzLe14xtmb7iTT4jsc",
  authDomain: "apartmecra-elz.firebaseapp.com",
  projectId: "apartmecra-elz",
  storageBucket: "apartmecra-elz.firebasestorage.app",
  messagingSenderId: "669151390046",
  appId: "1:669151390046:web:30590b4e09a529d17d47cf",
  measurementId: "G-4J8KGT8KJ5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Initialize Analytics only in browser environment
let analytics = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

console.log('✅ Firebase initialized successfully');
console.log('📊 Project:', firebaseConfig.projectId);

// Export Firebase services
export { auth, db, storage, analytics };
export default app;