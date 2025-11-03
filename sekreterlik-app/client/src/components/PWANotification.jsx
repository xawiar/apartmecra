import React from 'react';
import { usePWA } from '../hooks/usePWA';

const PWANotification = () => {
  const { isOnline, isInstallable, installApp } = usePWA();

  if (!isOnline) {
    return (
      <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>İnternet bağlantısı yok - Offline modda çalışıyor</span>
        </div>
      </div>
    );
  }

  if (isInstallable) {
    return (
      <div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <span>Uygulamayı yükleyebilirsiniz</span>
          </div>
          <button
            onClick={installApp}
            className="ml-4 bg-white text-blue-500 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100"
          >
            Yükle
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default PWANotification;


