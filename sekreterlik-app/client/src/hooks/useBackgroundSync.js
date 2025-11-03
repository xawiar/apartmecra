import { useState, useEffect, useCallback } from 'react';

export const useBackgroundSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Register service worker for background sync
  useEffect(() => {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then((registration) => {
        console.log('Service Worker ready for background sync');
      });
    }
  }, []);

  // Add data to sync queue
  const addToSyncQueue = useCallback((data) => {
    const syncItem = {
      id: Date.now() + Math.random(),
      data,
      timestamp: new Date().toISOString(),
      retries: 0
    };

    setPendingSync(prev => [...prev, syncItem]);
    
    // Store in IndexedDB for persistence
    storePendingData(syncItem);
    
    // Try to sync immediately if online
    if (isOnline) {
      syncData(syncItem);
    }
  }, [isOnline]);

  // Sync specific data
  const syncData = useCallback(async (syncItem) => {
    if (!isOnline) {
      console.log('Offline - data queued for sync');
      return false;
    }

    try {
      setIsSyncing(true);
      
      // Determine API endpoint based on data type
      let endpoint = '/api/sync';
      let method = 'POST';
      
      if (syncItem.data.type === 'member') {
        endpoint = '/api/members';
        method = syncItem.data.action === 'update' ? 'PUT' : 'POST';
      } else if (syncItem.data.type === 'event') {
        endpoint = '/api/events';
        method = syncItem.data.action === 'update' ? 'PUT' : 'POST';
      } else if (syncItem.data.type === 'meeting') {
        endpoint = '/api/meetings';
        method = syncItem.data.action === 'update' ? 'PUT' : 'POST';
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(syncItem.data.payload)
      });

      if (response.ok) {
        // Remove from pending sync
        setPendingSync(prev => prev.filter(item => item.id !== syncItem.id));
        removePendingData(syncItem.id);
        console.log('Data synced successfully:', syncItem.data.type);
        return true;
      } else {
        throw new Error(`Sync failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Sync error:', error);
      
      // Increment retry count
      const updatedItem = {
        ...syncItem,
        retries: syncItem.retries + 1
      };
      
      if (updatedItem.retries < 3) {
        // Retry after delay
        setTimeout(() => syncData(updatedItem), 5000 * updatedItem.retries);
      } else {
        // Max retries reached, remove from queue
        setPendingSync(prev => prev.filter(item => item.id !== syncItem.id));
        removePendingData(syncItem.id);
      }
      
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline]);

  // Sync all pending data
  const syncAllPending = useCallback(async () => {
    if (!isOnline || pendingSync.length === 0) {
      return;
    }

    setIsSyncing(true);
    
    try {
      const syncPromises = pendingSync.map(item => syncData(item));
      await Promise.allSettled(syncPromises);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, pendingSync, syncData]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingSync.length > 0) {
      syncAllPending();
    }
  }, [isOnline, pendingSync.length, syncAllPending]);

  // Load pending data from IndexedDB on mount
  useEffect(() => {
    loadPendingData();
  }, []);

  return {
    isOnline,
    pendingSync,
    isSyncing,
    addToSyncQueue,
    syncData,
    syncAllPending
  };
};

// IndexedDB functions for storing pending sync data
const DB_NAME = 'sekreterlik-sync';
const DB_VERSION = 1;
const STORE_NAME = 'pending';

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

const storePendingData = async (data) => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.add(data);
  } catch (error) {
    console.error('Error storing pending data:', error);
  }
};

const loadPendingData = async () => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onsuccess = () => {
      const data = request.result;
      if (data.length > 0) {
        setPendingSync(data);
      }
    };
  } catch (error) {
    console.error('Error loading pending data:', error);
  }
};

const removePendingData = async (id) => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.delete(id);
  } catch (error) {
    console.error('Error removing pending data:', error);
  }
};
