import React, { useState, useEffect } from 'react';
import FirebaseService from '../services/FirebaseService';
import { decryptData, encryptData } from '../utils/crypto';

const GroqApiSettings = () => {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    loadApiKey();
  }, []);

  const loadApiKey = async () => {
    try {
      setLoading(true);
      setMessage('');
      
      // Firebase'den API key'i yükle
      const USE_FIREBASE = import.meta.env.VITE_USE_FIREBASE === 'true';
      
      if (USE_FIREBASE) {
        try {
          const configDoc = await FirebaseService.getById('groq_api_config', 'main');
          if (configDoc && configDoc.api_key) {
            // API key şifrelenmiş olabilir, decrypt et
            const decryptedKey = configDoc.api_key.startsWith('U2FsdGVkX1') 
              ? decryptData(configDoc.api_key)
              : configDoc.api_key;
            setApiKey(decryptedKey);
          } else {
            // Eğer Firebase'de yoksa, environment variable'dan al
            const envKey = import.meta.env.VITE_GROQ_API_KEY;
            if (envKey) {
              setApiKey(envKey);
            }
          }
        } catch (error) {
          console.error('Error loading Groq API key:', error);
          // Eğer Firebase'de yoksa, environment variable'dan al
          const envKey = import.meta.env.VITE_GROQ_API_KEY;
          if (envKey) {
            setApiKey(envKey);
          }
        }
      } else {
        // Firebase kullanılmıyorsa, environment variable'dan al
        const envKey = import.meta.env.VITE_GROQ_API_KEY;
        if (envKey) {
          setApiKey(envKey);
        }
      }
    } catch (error) {
      console.error('Error loading Groq API key:', error);
      setMessage('API anahtarı yüklenirken hata oluştu');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage('');
      
      if (!apiKey.trim()) {
        setMessage('Lütfen Groq API anahtarını girin');
        setMessageType('error');
        return;
      }

      // API key formatını kontrol et (gsk_ ile başlamalı)
      if (!apiKey.trim().startsWith('gsk_')) {
        setMessage('Geçersiz Groq API anahtarı formatı. API anahtarı "gsk_" ile başlamalıdır.');
        setMessageType('error');
        return;
      }

      // Firebase'e kaydet
      const USE_FIREBASE = import.meta.env.VITE_USE_FIREBASE === 'true';
      
      if (USE_FIREBASE) {
        // API key'i şifreleyerek kaydet
        const encryptedKey = encryptData(apiKey.trim());
        
        const configData = {
          api_key: encryptedKey,
          updated_at: new Date().toISOString()
        };
        
        // setDoc kullanarak kaydet (id: 'main', encrypt: false - zaten şifreledik)
        await FirebaseService.create('groq_api_config', 'main', configData, false);
        
        setMessage('Groq API anahtarı başarıyla kaydedildi');
        setMessageType('success');
      } else {
        setMessage('Firebase kullanılmıyor. API anahtarı environment variable olarak ayarlanmalıdır.');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error saving Groq API key:', error);
      setMessage('API anahtarı kaydedilirken hata oluştu: ' + error.message);
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      setMessage('');
      
      if (!apiKey.trim()) {
        setMessage('Lütfen önce API anahtarını kaydedin');
        setMessageType('error');
        return;
      }

      // Test için basit bir API çağrısı yap
      const testResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'user', content: 'Test' }
          ],
          max_tokens: 10
        })
      });

      if (testResponse.ok) {
        setMessage('API anahtarı geçerli ve çalışıyor! ✅');
        setMessageType('success');
      } else {
        const errorData = await testResponse.json();
        setMessage('API anahtarı geçersiz: ' + (errorData.error?.message || 'Bilinmeyen hata'));
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error testing Groq API key:', error);
      setMessage('API anahtarı test edilirken hata oluştu: ' + error.message);
      setMessageType('error');
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
          Groq Chatbot API Ayarları
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Groq API anahtarınızı buradan yönetebilirsiniz. API anahtarı değiştiğinde buraya yeni anahtarı girebilirsiniz.
        </p>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Groq API Anahtarı
            </label>
            <div className="flex items-center space-x-2">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="gsk_..."
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {showApiKey ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.736m-16.822 0a10.025 10.025 0 01-1.563-3.029M15.59 15.59l-3.29-3.29m0 0l-3.29-3.29m3.29 3.29L12 12m-3.29-3.29L12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              API anahtarınızı <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">Groq Console</a>'dan alabilirsiniz.
            </p>
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
              disabled={saving || !apiKey.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            <button
              onClick={handleTest}
              disabled={!apiKey.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Test Et
            </button>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">Bilgi</h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
          <li>API anahtarı şifrelenmiş olarak Firebase'de saklanır</li>
          <li>API anahtarı değiştiğinde buraya yeni anahtarı girebilirsiniz</li>
          <li>Test butonu ile API anahtarının geçerli olup olmadığını kontrol edebilirsiniz</li>
          <li>API anahtarı "gsk_" ile başlamalıdır</li>
        </ul>
      </div>
    </div>
  );
};

export default GroqApiSettings;

