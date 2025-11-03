import React from 'react';
import { useBackgroundSync } from '../hooks/useBackgroundSync';

const OfflineStatus = () => {
  const { isOnline, pendingSync, isSyncing, syncAllPending } = useBackgroundSync();

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white px-4 py-2 text-center text-sm font-medium">
      <div className="flex items-center justify-center space-x-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
        </svg>
        <span>İnternet bağlantısı yok - Offline modda çalışıyor</span>
        {pendingSync.length > 0 && (
          <span className="bg-yellow-600 px-2 py-1 rounded text-xs">
            {pendingSync.length} veri senkronizasyon bekliyor
          </span>
        )}
      </div>
    </div>
  );
};

export default OfflineStatus;
