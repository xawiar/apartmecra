// src/config/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Check if Firebase is enabled (all required config values must be present)
const isFirebaseEnabled = () => {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.storageBucket &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId
  );
};

// Initialize Firebase services
let app = null;
let auth = null;
let db = null;
let storage = null;
let analytics = null;

if (isFirebaseEnabled()) {
  try {
    // Initialize Firebase app
    app = initializeApp(firebaseConfig);
    
    // Initialize Firebase services
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    
    // Initialize Analytics only in browser environment
    if (typeof window !== 'undefined') {
      analytics = getAnalytics(app);
    }
    
    console.log('✅ Firebase initialized successfully');
    console.log('📊 Project:', firebaseConfig.projectId);
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
    console.log('🚫 Falling back to local mode');
  }
} else {
  console.log('🚫 Firebase is disabled - Missing environment variables');
  console.log('📁 Data source: db.json (Local JSON Server on port 3001)');
}

// Export Firebase services
export { auth, db, storage, analytics };
export default app;