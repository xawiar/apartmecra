import React, { useState, useEffect } from 'react';
import FirebaseService from '../services/FirebaseService';
import { decryptData, encryptData } from '../utils/crypto';

const GroqApiSettings = () => {
  const [selectedProvider, setSelectedProvider] = useState('groq'); // 'groq', 'gemini', 'chatgpt'
  const [groqApiKey, setGroqApiKey] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [chatgptApiKey, setChatgptApiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    loadApiKeys();
    loadSelectedProvider();
  }, []);

  const loadSelectedProvider = async () => {
    try {
      const USE_FIREBASE = import.meta.env.VITE_USE_FIREBASE === 'true';
      if (USE_FIREBASE) {
        try {
          const configDoc = await FirebaseService.getById('ai_provider_config', 'main');
          if (configDoc && configDoc.provider) {
            setSelectedProvider(configDoc.provider);
          }
        } catch (error) {
          console.warn('AI provider config not found, using default (groq)');
        }
      }
    } catch (error) {
      console.error('Error loading AI provider:', error);
    }
  };

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      setMessage('');
      
      const USE_FIREBASE = import.meta.env.VITE_USE_FIREBASE === 'true';
      
      if (USE_FIREBASE) {
        // Groq API Key
        try {
          const groqConfig = await FirebaseService.getById('groq_api_config', 'main');
          if (groqConfig && groqConfig.api_key) {
            const decryptedKey = groqConfig.api_key.startsWith('U2FsdGVkX1') 
              ? decryptData(groqConfig.api_key)
              : groqConfig.api_key;
            setGroqApiKey(decryptedKey);
          } else {
            const envKey = import.meta.env.VITE_GROQ_API_KEY;
            if (envKey) setGroqApiKey(envKey);
          }
        } catch (error) {
          const envKey = import.meta.env.VITE_GROQ_API_KEY;
          if (envKey) setGroqApiKey(envKey);
        }

        // Gemini API Key
        try {
          const geminiConfig = await FirebaseService.getById('gemini_api_config', 'main');
          if (geminiConfig && geminiConfig.api_key) {
            const decryptedKey = geminiConfig.api_key.startsWith('U2FsdGVkX1') 
              ? decryptData(geminiConfig.api_key)
              : geminiConfig.api_key;
            setGeminiApiKey(decryptedKey);
          } else {
            const envKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (envKey) setGeminiApiKey(envKey);
          }
        } catch (error) {
          const envKey = import.meta.env.VITE_GEMINI_API_KEY;
          if (envKey) setGeminiApiKey(envKey);
        }

        // ChatGPT API Key
        try {
          const chatgptConfig = await FirebaseService.getById('chatgpt_api_config', 'main');
          if (chatgptConfig && chatgptConfig.api_key) {
            const decryptedKey = chatgptConfig.api_key.startsWith('U2FsdGVkX1') 
              ? decryptData(chatgptConfig.api_key)
              : chatgptConfig.api_key;
            setChatgptApiKey(decryptedKey);
          } else {
            const envKey = import.meta.env.VITE_OPENAI_API_KEY;
            if (envKey) setChatgptApiKey(envKey);
          }
        } catch (error) {
          const envKey = import.meta.env.VITE_OPENAI_API_KEY;
          if (envKey) setChatgptApiKey(envKey);
        }
      } else {
        setGroqApiKey(import.meta.env.VITE_GROQ_API_KEY || '');
        setGeminiApiKey(import.meta.env.VITE_GEMINI_API_KEY || '');
        setChatgptApiKey(import.meta.env.VITE_OPENAI_API_KEY || '');
      }
    } catch (error) {
      console.error('Error loading API keys:', error);
      setMessage('API anahtarları yüklenirken hata oluştu');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentApiKey = () => {
    switch (selectedProvider) {
      case 'groq': return groqApiKey;
      case 'gemini': return geminiApiKey;
      case 'chatgpt': return chatgptApiKey;
      default: return '';
    }
  };

  const setCurrentApiKey = (value) => {
    switch (selectedProvider) {
      case 'groq': setGroqApiKey(value); break;
      case 'gemini': setGeminiApiKey(value); break;
      case 'chatgpt': setChatgptApiKey(value); break;
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage('');
      
      const currentKey = getCurrentApiKey();
      
      if (!currentKey.trim()) {
        setMessage(`Lütfen ${selectedProvider === 'groq' ? 'Groq' : selectedProvider === 'gemini' ? 'Gemini' : 'ChatGPT'} API anahtarını girin`);
        setMessageType('error');
        return;
      }

      // API key formatını kontrol et
      if (selectedProvider === 'groq' && !currentKey.trim().startsWith('gsk_')) {
        setMessage('Geçersiz Groq API anahtarı formatı. API anahtarı "gsk_" ile başlamalıdır.');
        setMessageType('error');
        return;
      }

      if (selectedProvider === 'chatgpt' && !currentKey.trim().startsWith('sk-')) {
        setMessage('Geçersiz ChatGPT API anahtarı formatı. API anahtarı "sk-" ile başlamalıdır.');
        setMessageType('error');
        return;
      }

      const USE_FIREBASE = import.meta.env.VITE_USE_FIREBASE === 'true';
      
      if (USE_FIREBASE) {
        // API key'i şifreleyerek kaydet
        const encryptedKey = encryptData(currentKey.trim());
        
        const configData = {
          api_key: encryptedKey,
          updated_at: new Date().toISOString()
        };
        
        // Provider'a göre collection adı
        const collectionName = `${selectedProvider}_api_config`;
        await FirebaseService.create(collectionName, 'main', configData, false);
        
        // Seçilen provider'ı kaydet
        await FirebaseService.create('ai_provider_config', 'main', {
          provider: selectedProvider,
          updated_at: new Date().toISOString()
        }, false);
        
        setMessage(`${selectedProvider === 'groq' ? 'Groq' : selectedProvider === 'gemini' ? 'Gemini' : 'ChatGPT'} API anahtarı başarıyla kaydedildi`);
        setMessageType('success');
      } else {
        setMessage('Firebase kullanılmıyor. API anahtarı environment variable olarak ayarlanmalıdır.');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error saving API key:', error);
      setMessage('API anahtarı kaydedilirken hata oluştu: ' + error.message);
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      setMessage('');
      
      const currentKey = getCurrentApiKey();
      
      if (!currentKey.trim()) {
        setMessage('Lütfen önce API anahtarını kaydedin');
        setMessageType('error');
        return;
      }

      let testResponse;
      
      if (selectedProvider === 'groq') {
        testResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentKey.trim()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: 'Test' }],
            max_tokens: 10
          })
        });
      } else if (selectedProvider === 'gemini') {
        testResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${currentKey.trim()}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: 'Test' }]
            }]
          })
        });
      } else if (selectedProvider === 'chatgpt') {
        testResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentKey.trim()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: 'Test' }],
            max_tokens: 10
          })
        });
      }

      if (testResponse && testResponse.ok) {
        setMessage('API anahtarı geçerli ve çalışıyor! ✅');
        setMessageType('success');
      } else {
        const errorData = await testResponse?.json().catch(() => ({}));
        setMessage('API anahtarı geçersiz: ' + (errorData.error?.message || 'Bilinmeyen hata'));
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error testing API key:', error);
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

  const providerInfo = {
    groq: {
      name: 'Groq',
      placeholder: 'gsk_...',
      link: 'https://console.groq.com/keys',
      description: 'Ücretsiz ve hızlı AI servisi. 30 RPM limiti.'
    },
    gemini: {
      name: 'Google Gemini',
      placeholder: 'AIza...',
      link: 'https://makersuite.google.com/app/apikey',
      description: 'Google\'ın AI servisi. Ücretsiz tier mevcut.'
    },
    chatgpt: {
      name: 'OpenAI ChatGPT',
      placeholder: 'sk-...',
      link: 'https://platform.openai.com/api-keys',
      description: 'OpenAI\'nin ChatGPT servisi. Ücretli, ancak güçlü.'
    }
  };

  const currentInfo = providerInfo[selectedProvider];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Chatbot AI API Ayarları
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Kullanmak istediğiniz AI servisini seçin ve API anahtarınızı girin. API anahtarı değiştiğinde buraya yeni anahtarı girebilirsiniz.
        </p>
      </div>

      {/* AI Provider Seçimi */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          AI Servisi Seçin
        </label>
        <select
          value={selectedProvider}
          onChange={(e) => setSelectedProvider(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
        >
          <option value="groq">Groq (Ücretsiz - Önerilen)</option>
          <option value="gemini">Google Gemini (Ücretsiz)</option>
          <option value="chatgpt">OpenAI ChatGPT (Ücretli)</option>
        </select>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {currentInfo.description}
        </p>
      </div>

      {/* API Key Input */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {currentInfo.name} API Anahtarı
            </label>
            <div className="flex items-center space-x-2">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={getCurrentApiKey()}
                onChange={(e) => setCurrentApiKey(e.target.value)}
                placeholder={currentInfo.placeholder}
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
              API anahtarınızı <a href={currentInfo.link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">{currentInfo.name} Console</a>'dan alabilirsiniz.
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
              disabled={saving || !getCurrentApiKey().trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            <button
              onClick={handleTest}
              disabled={!getCurrentApiKey().trim()}
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
          <li>Seçtiğiniz AI servisi chatbot tarafından kullanılacaktır</li>
          <li>API anahtarı değiştiğinde buraya yeni anahtarı girebilirsiniz</li>
          <li>Test butonu ile API anahtarının geçerli olup olmadığını kontrol edebilirsiniz</li>
          <li>Groq: "gsk_" ile başlamalı | Gemini: "AIza" ile başlamalı | ChatGPT: "sk-" ile başlamalı</li>
        </ul>
      </div>
    </div>
  );
};

export default GroqApiSettings;
