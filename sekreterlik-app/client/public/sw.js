const CACHE_NAME = 'sekreterlik-v6-clear-archived-396dfd0';
// Vite geliştirme ortamında sabit bundle yolları yok; yalnızca güvenli, mevcut dosyaları önbelleğe al
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      // addAll bazı istekler başarısız olduğunda tümünü reddedebilir; tek tek ve hataları yutarak ekle
      await Promise.all(urlsToCache.map(async (url) => {
        try {
          const resp = await fetch(url, { cache: 'no-store' });
          if (resp && resp.ok) {
            await cache.put(url, resp.clone());
          }
        } catch (_) {
          // mevcut olmayan dosyaları atla
        }
      }));
      console.log('Cache primed');
    } catch (e) {
      // hiçbir şey yapma – SW kurulumu yine de tamamlanacak
      console.warn('Cache warmup error:', e);
    }
  })());
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  // Skip localhost:5000 requests - backend API is not available in production
  if (url.includes('localhost:5000') || url.includes('/api/health') || url.includes('/api/archive/documents') || url.includes('/api/district-officials') || url.includes('/api/visits/counts') || url.includes('/api/districts') || url.includes('/deputy-inspectors')) {
    // Don't intercept these requests - let them fail silently
    // Return a dummy response to prevent errors
    event.respondWith(new Response('', { status: 200, statusText: 'OK' }));
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request).catch((error) => {
          // Silently handle fetch errors (especially for localhost:5000)
          console.warn('Fetch error (silently ignored):', error);
          // Return a dummy response to prevent error
          return new Response('', { status: 503, statusText: 'Service Unavailable' });
        });
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  let data = {};
  if (event.data) {
    data = event.data.json();
  }
  
  const options = {
    body: data.body || 'Yeni bildirim',
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/badge-72x72.png',
    data: data.data || {},
    actions: data.actions || [
      {
        action: 'view',
        title: 'Görüntüle'
      },
      {
        action: 'close',
        title: 'Kapat'
      }
    ],
    requireInteraction: data.requireInteraction || true,
    silent: data.silent || false
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Bildirim', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received:', event);
  
  event.notification.close();
  
  if (event.action === 'view') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // Just close the notification
    console.log('Notification closed');
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Background sync function
async function doBackgroundSync() {
  try {
    console.log('Background sync started');
    
    // Get pending data from IndexedDB
    const pendingData = await getPendingData();
    
    if (pendingData.length > 0) {
      console.log('Syncing pending data:', pendingData);
      
      // Send pending data to server
      for (const data of pendingData) {
        try {
          await fetch('/api/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
          });
          
          // Remove from pending data
          await removePendingData(data.id);
        } catch (error) {
          console.error('Error syncing data:', error);
        }
      }
    }
    
    console.log('Background sync completed');
  } catch (error) {
    console.error('Background sync error:', error);
  }
}

// IndexedDB functions for background sync
async function getPendingData() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('sekreterlik-sync', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['pending'], 'readonly');
      const store = transaction.objectStore('pending');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('pending')) {
        db.createObjectStore('pending', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

async function removePendingData(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('sekreterlik-sync', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['pending'], 'readwrite');
      const store = transaction.objectStore('pending');
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
  });
}
