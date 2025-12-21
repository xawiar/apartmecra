// src/services/notifications.js
// Push notification service for PWA

import { messaging } from '../config/firebase.js';
import { getToken, onMessage } from 'firebase/messaging';
import { getCurrentUser } from './firebaseAuth';
import { updateDocument, getDocument } from './firebaseDb';
import { COLLECTIONS } from './firebaseDb';

// VAPID public key - Bu key'i Firebase Console'dan almanız gerekiyor
// Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
const VAPID_KEY = import.meta.env.VITE_FCM_VAPID_KEY || '';

/**
 * Request notification permission from user
 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return { granted: false, error: 'Browser does not support notifications' };
  }

  if (Notification.permission === 'granted') {
    return { granted: true, permission: 'granted' };
  }

  if (Notification.permission === 'denied') {
    return { granted: false, error: 'Notification permission denied' };
  }

  try {
    const permission = await Notification.requestPermission();
    return { 
      granted: permission === 'granted', 
      permission 
    };
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return { granted: false, error: error.message };
  }
};

/**
 * Get FCM token for push notifications
 */
export const getFCMToken = async () => {
  if (!messaging) {
    console.warn('Firebase Messaging is not initialized');
    return null;
  }

  try {
    // Check if service worker is registered
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      
      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration
      });

      if (token) {
        console.log('FCM Token obtained:', token);
        // Save token to user document
        await saveFCMTokenToUser(token);
        return token;
      } else {
        console.warn('No FCM token available');
        return null;
      }
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

/**
 * Save FCM token to user document in Firestore
 */
const saveFCMTokenToUser = async (token) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.uid) {
      console.warn('No current user found');
      return;
    }

    // Find user document by email or uid
    const { getDocs, query, where, collection } = await import('firebase/firestore');
    const { db } = await import('../config/firebase.js');
    const usersRef = collection(db, COLLECTIONS.USERS);
    
    let userDocId = null;
    
    // Try to find by email
    if (currentUser.email) {
      const emailQuery = query(usersRef, where('email', '==', currentUser.email));
      const emailSnapshot = await getDocs(emailQuery);
      if (!emailSnapshot.empty) {
        userDocId = emailSnapshot.docs[0].id;
      }
    }
    
    // If not found, try to find by siteId (for site users)
    if (!userDocId && currentUser.email && currentUser.email.includes('@site.local')) {
      const siteId = currentUser.email.replace('@site.local', '');
      const siteIdQuery = query(usersRef, where('siteId', '==', siteId), where('role', '==', 'site_user'));
      const siteIdSnapshot = await getDocs(siteIdQuery);
      if (!siteIdSnapshot.empty) {
        userDocId = siteIdSnapshot.docs[0].id;
      }
    }

    if (userDocId) {
      // Update user document with FCM token
      await updateDocument(COLLECTIONS.USERS, userDocId, {
        fcmToken: token,
        fcmTokenUpdatedAt: new Date().toISOString()
      });
      console.log('FCM token saved to user document');
    } else {
      console.warn('User document not found for FCM token');
    }
  } catch (error) {
    console.error('Error saving FCM token:', error);
  }
};

/**
 * Initialize push notifications
 */
export const initializePushNotifications = async () => {
  // Request permission
  const permissionResult = await requestNotificationPermission();
  
  if (!permissionResult.granted) {
    console.warn('Notification permission not granted');
    return { success: false, error: permissionResult.error || 'Permission denied' };
  }

  // Get FCM token
  const token = await getFCMToken();
  
  if (!token) {
    return { success: false, error: 'Failed to get FCM token' };
  }

  // Listen for foreground messages
  if (messaging) {
    onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      
      // Show notification even when app is in foreground
      if (Notification.permission === 'granted') {
        showNotification(payload);
      }
    });
  }

  return { success: true, token };
};

/**
 * Show browser notification
 */
export const showNotification = (payload) => {
  if (Notification.permission !== 'granted') {
    return;
  }

  const title = payload.notification?.title || payload.data?.title || 'Yeni Bildirim';
  const body = payload.notification?.body || payload.data?.message || 'Yeni bir bildiriminiz var';
  const icon = payload.notification?.icon || '/icon-192x192.png';
  const badge = '/icon-72x72.png';
  
  const notification = new Notification(title, {
    body: body,
    icon: icon,
    badge: badge,
    tag: payload.data?.notificationId || 'apartmecra-notification',
    requireInteraction: false,
    silent: false, // Enable sound
    vibrate: [200, 100, 200],
    data: payload.data || {}
  });

  // Play notification sound
  playNotificationSound();

  // Handle notification click
  notification.onclick = (event) => {
    event.preventDefault();
    window.focus();
    notification.close();
    
    // Navigate to relevant page if link provided
    if (payload.data?.link) {
      window.location.href = payload.data.link;
    }
  };
};

/**
 * Play notification sound
 */
export const playNotificationSound = () => {
  try {
    // Create audio context for notification sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create a simple beep sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800; // Frequency in Hz
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (error) {
    console.warn('Could not play notification sound:', error);
    // Fallback: Try to play a simple beep using HTML5 Audio
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWi77+efTRAMUKfj8LZjHAY4kdfyzHksBSR3x/DdkEAKFF606euoVRQKRp/g8r5sIQUrgc7y2Yk2CBdou+/nn00QDFCn4/C2YxwGOJHX8sx5LAUkd8fw3ZBAC');
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Ignore errors if audio cannot play
      });
    } catch (e) {
      // Ignore all audio errors
    }
  }
};

/**
 * Get user's FCM token from Firestore
 */
export const getUserFCMToken = async (userId) => {
  try {
    const userDoc = await getDocument(COLLECTIONS.USERS, userId);
    if (userDoc.success && userDoc.data) {
      return userDoc.data.fcmToken || null;
    }
    return null;
  } catch (error) {
    console.error('Error getting user FCM token:', error);
    return null;
  }
};

