// PWA Utility Functions
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully:', registration);
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available, show update notification
              showUpdateNotification();
            }
          });
        }
      });
      
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
};

// Show update notification
const showUpdateNotification = () => {
  if (confirm('Yeni güncelleme mevcut! Sayfayı yenilemek ister misiniz?')) {
    window.location.reload();
  }
};

// Install PWA prompt
export const showInstallPrompt = () => {
  let deferredPrompt;
  
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    
    // Show install button
    showInstallButton();
  });
  
  // Handle install button click
  window.addEventListener('installButtonClick', async () => {
    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      
      // Clear the deferredPrompt
      deferredPrompt = null;
    }
  });
};

// Show install button in UI
const showInstallButton = () => {
  // Create install button
  const installButton = document.createElement('button');
  installButton.textContent = 'Uygulamayı Yükle';
  installButton.className = 'btn btn-primary position-fixed';
  installButton.style.cssText = `
    bottom: 20px;
    right: 20px;
    z-index: 9999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `;
  
  installButton.addEventListener('click', () => {
    window.dispatchEvent(new Event('installButtonClick'));
    installButton.remove();
  });
  
  document.body.appendChild(installButton);
  
  // Auto-hide after 10 seconds
  setTimeout(() => {
    if (installButton.parentNode) {
      installButton.remove();
    }
  }, 10000);
};

// Check if app is installed
export const isAppInstalled = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
};

// Handle app install
export const handleAppInstall = () => {
  window.addEventListener('appinstalled', (evt) => {
    console.log('PWA was installed');
    // Track installation
    if (typeof gtag !== 'undefined') {
      gtag('event', 'pwa_install', {
        event_category: 'PWA',
        event_label: 'App Installed'
      });
    }
  });
};

// Initialize PWA
export const initializePWA = async () => {
  // Register Service Worker for PWA functionality
  if ('serviceWorker' in navigator) {
    try {
      // First, unregister old service workers to prevent conflicts
      const oldRegistrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        oldRegistrations.map(registration => registration.unregister())
      );
      
      // Register new service worker
      await registerServiceWorker();
      console.log('PWA Service Worker registered');
    } catch (error) {
      console.error('Error registering service worker:', error);
    }
  }
  
  // Show install prompt
  showInstallPrompt();
  
  // Handle app install
  handleAppInstall();
  
  console.log('PWA initialized');
};

// Offline detection
export const isOnline = () => {
  return navigator.onLine;
};

// Handle online/offline events
export const handleConnectionChange = (callback) => {
  const updateOnlineStatus = () => {
    callback(navigator.onLine);
  };
  
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  
  return () => {
    window.removeEventListener('online', updateOnlineStatus);
    window.removeEventListener('offline', updateOnlineStatus);
  };
};

// Request notification permission
export const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};

// Show notification
export const showNotification = (title, options = {}) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(title, {
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgIDxkZWZzPgogICAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImdyYWQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgogICAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiMwZDZlZmQ7c3RvcC1vcGFjaXR5OjEiIC8+CiAgICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojNjYxMGYyO3N0b3Atb3BhY2l0eToxIiAvPgogICAgICA8L2xpbmVhckdyYWRpZW50PgogICAgPC9kZWZzPgogICAgPHJlY3Qgd2lkdGg9IjE5MiIgaGVpZ2h0PSIxOTIiIGZpbGw9InVybCgjZ3JhZCkiIHJ4PSIyOC44Ii8+CiAgICA8dGV4dCB4PSI1MCUiIHk9IjUwJSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgCiAgICAgICAgICBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSI+QTQ8L3RleHQ+CiAgPC9zdmc+',
    badge: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzIiIGhlaWdodD0iNzIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgICA8ZGVmcz4KICAgICAgPGxpbmVhckdyYWRpZW50IGlkPSJncmFkIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KICAgICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojMGQ2ZWZkO3N0b3Atb3BhY2l0eToxIiAvPgogICAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3R5bGU9InN0b3AtY29sb3I6IzY2MTBmMjtzdG9wLW9wYWNpdHk6MSIgLz4KICAgICAgPC9saW5lYXJHcmFkaWVudD4KICAgIDwvZGVmcz4KICAgIDxyZWN0IHdpZHRoPSI3MiIgaGVpZ2h0PSI3MiIgZmlsbD0idXJsKCNncmFkKSIgcng9IjEwLjgiLz4KICAgIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiAKICAgICAgICAgIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyOC44IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiPkE0PC90ZXh0PgogIDwvc3ZnPg==',
      ...options
    });
    
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    
    return notification;
  }
};

// Background sync for offline data
export const registerBackgroundSync = (tag, callback) => {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    navigator.serviceWorker.ready.then((registration) => {
      return registration.sync.register(tag);
    });
  }
};

// Cache management
export const clearCache = async () => {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('All caches cleared');
  }
};

// Get cache size
export const getCacheSize = async () => {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    let totalSize = 0;
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      
      for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }
    }
    
    return totalSize;
  }
  return 0;
};
