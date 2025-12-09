// src/config/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';
import logger from '../utils/logger';

// Firebase configuration
// Use environment variables if available, fallback to hardcoded values for backward compatibility
// This allows gradual migration to environment variables without breaking existing deployments
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDRYJ8wJpjIi4qF1jzLe14xtmb7iTT4jsc",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "apartmecra-elz.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "apartmecra-elz",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "apartmecra-elz.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "669151390046",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:669151390046:web:30590b4e09a529d17d47cf",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-4J8KGT8KJ5"
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

logger.log('✅ Firebase initialized successfully');
logger.log('📊 Project:', firebaseConfig.projectId);

// Export Firebase services
export { auth, db, storage, analytics };
export default app;