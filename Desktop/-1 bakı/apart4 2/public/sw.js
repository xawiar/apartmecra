// Service Worker for Apart4 PWA
const CACHE_NAME = 'apart4-v1.0.2'; // Updated to force cache refresh
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  // Icons are now embedded as data URIs in manifest.json
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('Service Worker: Cache failed', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          console.log('Service Worker: Serving from cache', event.request.url);
          return response;
        }
        
        console.log('Service Worker: Fetching from network', event.request.url);
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch((error) => {
            console.log('Service Worker: Fetch failed', error);
            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
          });
      })
  );
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Sync offline data when connection is restored
      syncOfflineData()
    );
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received');
  
  let notificationData = {
    title: 'Apart4 Bildirimi',
    body: 'Yeni bildirim',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    data: {}
  };

  // Parse push data
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.notification?.title || data.title || notificationData.title,
        body: data.notification?.body || data.message || data.body || notificationData.body,
        icon: data.notification?.icon || data.icon || notificationData.icon,
        badge: data.notification?.badge || data.badge || notificationData.badge,
        data: data.data || data,
        tag: data.data?.notificationId || data.tag || 'apartmecra-notification',
        requireInteraction: false,
        silent: false, // Enable sound - browser will play default notification sound
        sound: '/notification-sound.mp3', // Custom sound file (if supported)
        vibrate: [200, 100, 200, 100, 200],
        renotify: true, // Re-notify if notification with same tag exists
        actions: [
          {
            action: 'view',
            title: 'Görüntüle',
            icon: '/icon-96x96.png'
          },
          {
            action: 'close',
            title: 'Kapat',
            icon: '/icon-96x96.png'
          }
        ]
      };
    } catch (e) {
      // If JSON parsing fails, use text
      notificationData.body = event.data.text();
    }
  }

  // Play notification sound
  playNotificationSound();

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Play notification sound in service worker
// Note: Service workers can't directly play audio, but we can use the notification's sound property
// The browser will play the default notification sound when silent: false
function playNotificationSound() {
  console.log('Service Worker: Notification sound will be played by browser');
  // The sound is handled by the browser when we set silent: false in notification options
}

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification click received', event);
  
  event.notification.close();

  const action = event.action;
  const notificationData = event.notification.data || {};

  if (action === 'view' || !action) {
    // Open or focus the app
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // If app is already open, focus it
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === '/' || client.url.includes(self.location.origin)) {
            return client.focus();
          }
        }
        
        // If app is not open, open it
        const urlToOpen = notificationData.link || '/';
        return clients.openWindow(urlToOpen);
      })
    );
  } else if (action === 'close') {
    // Just close the notification
    event.notification.close();
  }
});

// Helper function for syncing offline data
async function syncOfflineData() {
  try {
    // Get offline data from IndexedDB
    const offlineData = await getOfflineData();
    
    if (offlineData && offlineData.length > 0) {
      // Sync with server
      for (const data of offlineData) {
        await syncDataToServer(data);
      }
      
      // Clear offline data after successful sync
      await clearOfflineData();
    }
  } catch (error) {
    console.log('Service Worker: Sync failed', error);
  }
}

// Placeholder functions for offline data management
async function getOfflineData() {
  // Implementation for getting offline data from IndexedDB
  return [];
}

async function syncDataToServer(data) {
  // Implementation for syncing data to server
  console.log('Syncing data:', data);
}

async function clearOfflineData() {
  // Implementation for clearing offline data
  console.log('Clearing offline data');
}