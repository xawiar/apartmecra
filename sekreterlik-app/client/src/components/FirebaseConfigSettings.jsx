import React, { useState, useEffect } from 'react';
import FirebaseService from '../services/FirebaseService';
import { decryptData, encryptData } from '../utils/crypto';

const FirebaseConfigSettings = () => {
  const [apiKey, setApiKey] = useState('');
  const [authDomain, setAuthDomain] = useState('');
  const [projectId, setProjectId] = useState('');
  const [storageBucket, setStorageBucket] = useState('');
  const [messagingSenderId, setMessagingSenderId] = useState('');
  const [appId, setAppId] = useState('');
  const [measurementId, setMeasurementId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [showConfig, setShowConfig] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setMessage('');
      
      const USE_FIREBASE = import.meta.env.VITE_USE_FIREBASE === 'true';
      
      if (USE_FIREBASE) {
        try {
          const configDoc = await FirebaseService.getById('firebase_config', 'main');
          if (configDoc) {
            // Şifrelenmiş alanları decrypt et
            if (configDoc.apiKey && configDoc.apiKey.startsWith('U2FsdGVkX1')) {
              setApiKey(decryptData(configDoc.apiKey));
            } else {
              setApiKey(configDoc.apiKey || '');
            }
            
            setAuthDomain(configDoc.authDomain || '');
            setProjectId(configDoc.projectId || '');
            setStorageBucket(configDoc.storageBucket || '');
            setMessagingSenderId(configDoc.messagingSenderId || '');
            setAppId(configDoc.appId || '');
            setMeasurementId(configDoc.measurementId || '');
          } else {
            // Environment variable'lardan yükle, yoksa mevcut yapılandırmadan
            setApiKey(import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAAkFCVr_IrA9qR8gAgDAZMGGk-xGsY2nA');
            setAuthDomain(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'ilsekreterliki.firebaseapp.com');
            setProjectId(import.meta.env.VITE_FIREBASE_PROJECT_ID || 'ilsekreterliki');
            setStorageBucket(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'ilsekreterliki.firebasestorage.app');
            setMessagingSenderId(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '112937724027');
            setAppId(import.meta.env.VITE_FIREBASE_APP_ID || '1:112937724027:web:03e419ca720eea178c1ade');
            setMeasurementId(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-YMN4TEP8Z1');
          }
        } catch (error) {
          console.warn('Firebase config not found in Firestore, using environment variables:', error);
          setApiKey(import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAAkFCVr_IrA9qR8gAgDAZMGGk-xGsY2nA');
          setAuthDomain(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'ilsekreterliki.firebaseapp.com');
          setProjectId(import.meta.env.VITE_FIREBASE_PROJECT_ID || 'ilsekreterliki');
          setStorageBucket(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'ilsekreterliki.firebasestorage.app');
          setMessagingSenderId(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '112937724027');
          setAppId(import.meta.env.VITE_FIREBASE_APP_ID || '1:112937724027:web:03e419ca720eea178c1ade');
          setMeasurementId(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-YMN4TEP8Z1');
        }
      } else {
        setApiKey(import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAAkFCVr_IrA9qR8gAgDAZMGGk-xGsY2nA');
        setAuthDomain(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'ilsekreterliki.firebaseapp.com');
        setProjectId(import.meta.env.VITE_FIREBASE_PROJECT_ID || 'ilsekreterliki');
        setStorageBucket(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'ilsekreterliki.firebasestorage.app');
        setMessagingSenderId(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '112937724027');
        setAppId(import.meta.env.VITE_FIREBASE_APP_ID || '1:112937724027:web:03e419ca720eea178c1ade');
        setMeasurementId(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-YMN4TEP8Z1');
      }
    } catch (error) {
      console.error('Error loading Firebase config:', error);
      setMessage('Firebase yapılandırması yüklenirken hata oluştu');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage('');
      
      // Validasyon
      if (!apiKey || !authDomain || !projectId || !storageBucket || !messagingSenderId || !appId) {
        setMessage('Lütfen tüm zorunlu alanları doldurun (API Key, Auth Domain, Project ID, Storage Bucket, Messaging Sender ID, App ID)');
        setMessageType('error');
        return;
      }

      // Admin şifresi doğrulama
      if (!adminPassword.trim()) {
        setMessage('Lütfen admin şifresini girin');
        setMessageType('error');
        setShowPasswordModal(true);
        return;
      }

      // Admin şifresini doğrula
      const ApiService = (await import('../utils/ApiService')).default;
      const verifyResult = await ApiService.verifyAdminPassword(adminPassword.trim());
      
      if (!verifyResult.success) {
        setMessage(verifyResult.message || 'Admin şifresi yanlış');
        setMessageType('error');
        setAdminPassword(''); // Şifreyi temizle
        return;
      }

      const USE_FIREBASE = import.meta.env.VITE_USE_FIREBASE === 'true';
      
      if (USE_FIREBASE) {
        // Firebase yapılandırmasını şifreleyerek kaydet
        const encryptedApiKey = encryptData(apiKey.trim());
        
        await FirebaseService.create('firebase_config', 'main', {
          apiKey: encryptedApiKey,
          authDomain: authDomain.trim(),
          projectId: projectId.trim(),
          storageBucket: storageBucket.trim(),
          messagingSenderId: messagingSenderId.trim(),
          appId: appId.trim(),
          measurementId: measurementId.trim() || '',
          updated_at: new Date().toISOString()
        }, false);
        
        setMessage('Firebase yapılandırması başarıyla kaydedildi. Değişikliklerin etkili olması için sayfayı yenileyin.');
        setMessageType('success');
        setAdminPassword(''); // Şifreyi temizle
        setShowPasswordModal(false);
      } else {
        setMessage('Firebase kullanılmıyor. Yapılandırma environment variable olarak ayarlanmalıdır.');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error saving Firebase config:', error);
      setMessage('Firebase yapılandırması kaydedilirken hata oluştu: ' + error.message);
      setMessageType('error');
      setAdminPassword(''); // Şifreyi temizle
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Firebase Yapılandırması
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Farklı bir Firebase projesi kullanmak için yapılandırma bilgilerini girin. Bu bilgileri Firebase Console'dan alabilirsiniz.
        </p>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API Key <span className="text-red-500">*</span>
            </label>
            <input
              type={showConfig ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Auth Domain <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={authDomain}
              onChange={(e) => setAuthDomain(e.target.value)}
              placeholder="project-id.firebaseapp.com"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Project ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="project-id"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Storage Bucket <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={storageBucket}
              onChange={(e) => setStorageBucket(e.target.value)}
              placeholder="project-id.firebasestorage.app"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Messaging Sender ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={messagingSenderId}
              onChange={(e) => setMessagingSenderId(e.target.value)}
              placeholder="123456789012"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              App ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              placeholder="1:123456789012:web:abc123def456"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Measurement ID (Opsiyonel)
            </label>
            <input
              type="text"
              value={measurementId}
              onChange={(e) => setMeasurementId(e.target.value)}
              placeholder="G-XXXXXXXXXX"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {showConfig ? 'Gizle' : 'Göster'}
            </button>
          </div>
        </div>
      </div>

      {/* Admin Şifresi - Her zaman görünür */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
        <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-3">Güvenlik</h4>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Admin Şifresi <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            placeholder="Yapılandırmayı kaydetmek için admin şifresini girin"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Yapılandırma değişiklikleri için admin şifresi gereklidir
          </p>
        </div>
      </div>

          {message && (
            <div className={`p-3 rounded-lg ${
              messageType === 'success' 
                ? 'bg-green-50 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700' 
                : 'bg-red-50 dark:bg-red-900 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-700'
            }`}>
              {message}
            </div>
          )}

          <div className="flex items-center space-x-3">
            <button
              onClick={handleSave}
              disabled={saving || !adminPassword.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            <button
              onClick={loadConfig}
              disabled={loading}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Yenile
            </button>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">Bilgi</h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
          <li>Firebase yapılandırması şifrelenmiş olarak Firebase'de saklanır</li>
          <li>Yapılandırma değiştiğinde sayfayı yenilemeniz gerekir</li>
          <li>Bu bilgileri Firebase Console &gt; Project Settings &gt; General &gt; Your apps bölümünden alabilirsiniz</li>
          <li>Yeni bir Firebase projesi oluşturmak için <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="underline">Firebase Console</a>'u ziyaret edin</li>
        </ul>
      </div>
    </div>
  );
};

export default FirebaseConfigSettings;

