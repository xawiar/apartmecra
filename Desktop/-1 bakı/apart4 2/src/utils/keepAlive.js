// src/utils/keepAlive.js
// Keep-alive mechanism to ensure app stays active for push notifications

let keepAliveInterval = null;
let wakeLock = null;

/**
 * Start keep-alive mechanism
 * This ensures the app and service worker stay active even when app is in background
 */
export const startKeepAlive = async () => {
  // Request Wake Lock API (if supported) to prevent device from sleeping
  if ('wakeLock' in navigator) {
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      console.log('Wake Lock acquired');
      
      // Handle wake lock release
      wakeLock.addEventListener('release', () => {
        console.log('Wake Lock released');
      });
    } catch (error) {
      console.warn('Wake Lock not available:', error);
    }
  }
  
  // Keep service worker alive with periodic messages
  if ('serviceWorker' in navigator) {
    keepAliveInterval = setInterval(async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        // Send keep-alive message to service worker
        if (registration.active) {
          registration.active.postMessage({ 
            type: 'keep-alive', 
            timestamp: Date.now() 
          });
        }
        
        // Also ping the service worker by making a fetch request
        // This ensures the service worker stays active
        // Use GET instead of HEAD to avoid cache errors
        try {
          await fetch('/sw.js', { 
            method: 'GET',
            cache: 'no-cache'
          });
        } catch (error) {
          // Ignore fetch errors
        }
      } catch (error) {
        console.warn('Keep-alive ping failed:', error);
      }
    }, 30000); // Every 30 seconds
    
    console.log('Keep-alive mechanism started');
  }
  
  // Register periodic background sync (if supported and service worker is active)
  if ('serviceWorker' in navigator && 'periodicSync' in window.ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Only register if service worker is active
      if (registration.active) {
        try {
          await registration.periodicSync.register('keep-alive', {
            minInterval: 60000 // 1 minute
          });
          console.log('Periodic background sync registered');
        } catch (error) {
          // Permission denied or not supported - this is OK
          if (error.name !== 'NotAllowedError') {
            console.warn('Periodic background sync not available:', error);
          }
        }
      }
    } catch (error) {
      // Ignore errors - periodic sync is optional
    }
  }
  
  // Listen for visibility changes to re-acquire wake lock
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible' && wakeLock === null) {
      if ('wakeLock' in navigator) {
        try {
          wakeLock = await navigator.wakeLock.request('screen');
          console.log('Wake Lock re-acquired');
        } catch (error) {
          console.warn('Failed to re-acquire wake lock:', error);
        }
      }
    }
  });
};

/**
 * Stop keep-alive mechanism
 */
export const stopKeepAlive = async () => {
  // Clear interval
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
  
  // Release wake lock
  if (wakeLock) {
    try {
      await wakeLock.release();
      wakeLock = null;
      console.log('Wake Lock released');
    } catch (error) {
      console.warn('Failed to release wake lock:', error);
    }
  }
  
  // Unregister periodic background sync
  if ('serviceWorker' in navigator && 'periodicSync' in window.ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.periodicSync.unregister('keep-alive');
      console.log('Periodic background sync unregistered');
    } catch (error) {
      console.warn('Failed to unregister periodic sync:', error);
    }
  }
  
  console.log('Keep-alive mechanism stopped');
};

/**
 * Check if user is logged in
 */
const isUserLoggedIn = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  return !!(token && user);
};

/**
 * Initialize keep-alive only if user is logged in
 */
export const initializeKeepAlive = async () => {
  if (isUserLoggedIn()) {
    await startKeepAlive();
  }
};

/**
 * Cleanup keep-alive on logout
 */
export const cleanupKeepAlive = async () => {
  await stopKeepAlive();
};

