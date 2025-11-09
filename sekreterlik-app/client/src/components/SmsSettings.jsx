import React, { useState, useEffect } from 'react';
import FirebaseService from '../services/FirebaseService';
import { decryptData, encryptData } from '../utils/crypto';
import ApiService from '../utils/ApiService';

const SmsSettings = () => {
  const [provider, setProvider] = useState('netgsm'); // 'netgsm', 'twilio', etc.
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [sender, setSender] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);
  
  // Otomatik SMS ayarları
  const [autoSmsForMeetings, setAutoSmsForMeetings] = useState(false);
  const [autoSmsForEvents, setAutoSmsForEvents] = useState(false);
  const [autoSmsForCustom, setAutoSmsForCustom] = useState(false);
  const [meetingCustomText, setMeetingCustomText] = useState('');
  const [eventCustomText, setEventCustomText] = useState('');

  useEffect(() => {
    loadConfig();
    loadAutoSmsSettings();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setMessage('');
      
      const USE_FIREBASE = import.meta.env.VITE_USE_FIREBASE === 'true';
      
      if (USE_FIREBASE) {
        try {
          const configDoc = await FirebaseService.getById('sms_config', 'main');
          if (configDoc) {
            setProvider(configDoc.provider || 'netgsm');
            
            if (configDoc.apiKey) {
              const decryptedKey = configDoc.apiKey.startsWith('U2FsdGVkX1') 
                ? decryptData(configDoc.apiKey)
                : configDoc.apiKey;
              setApiKey(decryptedKey);
            }
            
            if (configDoc.apiSecret) {
              const decryptedSecret = configDoc.apiSecret.startsWith('U2FsdGVkX1') 
                ? decryptData(configDoc.apiSecret)
                : configDoc.apiSecret;
              setApiSecret(decryptedSecret);
            }
            
            setSender(configDoc.sender || '');
          }
        } catch (error) {
          console.warn('SMS config not found in Firestore');
        }
      }
    } catch (error) {
      console.error('Error loading SMS config:', error);
      setMessage('SMS yapılandırması yüklenirken hata oluştu');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const loadAutoSmsSettings = async () => {
    try {
      const USE_FIREBASE = import.meta.env.VITE_USE_FIREBASE === 'true';
      
      if (USE_FIREBASE) {
        try {
          const settingsDoc = await FirebaseService.getById('sms_auto_settings', 'main');
          if (settingsDoc) {
            setAutoSmsForMeetings(settingsDoc.autoSmsForMeetings || false);
            setAutoSmsForEvents(settingsDoc.autoSmsForEvents || false);
            setAutoSmsForCustom(settingsDoc.autoSmsForCustom || false);
            setMeetingCustomText(settingsDoc.meetingCustomText || '');
            setEventCustomText(settingsDoc.eventCustomText || '');
          }
        } catch (error) {
          console.warn('Auto SMS settings not found');
        }
      }
    } catch (error) {
      console.error('Error loading auto SMS settings:', error);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage('');
      
      // Validasyon
      if (!apiKey || !apiSecret) {
        setMessage('Lütfen API Key ve API Secret alanlarını doldurun');
        setMessageType('error');
        return;
      }

      const USE_FIREBASE = import.meta.env.VITE_USE_FIREBASE === 'true';
      
      if (USE_FIREBASE) {
        // SMS yapılandırmasını kaydet
        const configData = {
          provider: provider,
          apiKey: encryptData(apiKey),
          apiSecret: encryptData(apiSecret),
          sender: sender || 'NETGSM',
          updatedAt: new Date().toISOString()
        };

        await FirebaseService.createOrUpdate('sms_config', 'main', configData);
        
        // Otomatik SMS ayarlarını kaydet
        const autoSettingsData = {
          autoSmsForMeetings: autoSmsForMeetings,
          autoSmsForEvents: autoSmsForEvents,
          autoSmsForCustom: autoSmsForCustom,
          meetingCustomText: meetingCustomText,
          eventCustomText: eventCustomText,
          updatedAt: new Date().toISOString()
        };

        await FirebaseService.createOrUpdate('sms_auto_settings', 'main', autoSettingsData);
        
        setMessage('SMS yapılandırması başarıyla kaydedildi');
        setMessageType('success');
      }
    } catch (error) {
      console.error('Error saving SMS config:', error);
      setMessage('SMS yapılandırması kaydedilirken hata oluştu: ' + error.message);
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  const handleTestSms = async () => {
    try {
      setSaving(true);
      setMessage('');
      
      if (!apiKey || !apiSecret) {
        setMessage('Lütfen önce SMS yapılandırmasını kaydedin');
        setMessageType('error');
        return;
      }

      // Test SMS gönder (kendi numarasına veya test numarasına)
      const testPhone = prompt('Test SMS göndermek için telefon numarası girin (5XXXXXXXXX formatında):');
      if (!testPhone) {
        return;
      }

      const USE_FIREBASE = import.meta.env.VITE_USE_FIREBASE === 'true';
      
      if (USE_FIREBASE) {
        // SMS servisini kullanarak test SMS gönder
        const { default: smsService } = await import('../services/SmsService');
        await smsService.loadConfig();
        
        const result = await smsService.sendSms(testPhone, 'Bu bir test SMS mesajıdır. SMS yapılandırması başarılı!');
        
        if (result.success) {
          setMessage('Test SMS başarıyla gönderildi!');
          setMessageType('success');
        } else {
          setMessage('Test SMS gönderilemedi: ' + result.message);
          setMessageType('error');
        }
      }
    } catch (error) {
      console.error('Error sending test SMS:', error);
      setMessage('Test SMS gönderilirken hata oluştu: ' + error.message);
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">SMS Yapılandırması</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          SMS göndermek için gerekli yapılandırma ayarlarını buradan yapabilirsiniz.
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          messageType === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
        }`}>
          {message}
        </div>
      )}

      {/* SMS Servis Sağlayıcısı */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">SMS Servis Sağlayıcısı</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Servis Sağlayıcı
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="netgsm">Netgsm</option>
              <option value="twilio">Twilio (Yakında)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API Key (Kullanıcı Kodu) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="API Key girin"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {showApiKey ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.736m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API Secret (Şifre) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showApiSecret ? 'text' : 'password'}
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="API Secret girin"
              />
              <button
                type="button"
                onClick={() => setShowApiSecret(!showApiSecret)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {showApiSecret ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.736m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Gönderen Adı (Sender)
            </label>
            <input
              type="text"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="NETGSM (varsayılan)"
              maxLength={11}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Maksimum 11 karakter. Boş bırakılırsa "NETGSM" kullanılır.
            </p>
          </div>
        </div>
      </div>

      {/* Otomatik SMS Ayarları */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Otomatik SMS Ayarları</h3>
        
        <div className="space-y-4">
          {/* Planlanan Toplantılar için Otomatik SMS */}
          <div className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex-1">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSmsForMeetings}
                  onChange={(e) => setAutoSmsForMeetings(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                  Planlanan Toplantılar için Otomatik SMS
                </span>
              </label>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 ml-7">
                Planlanan toplantı oluşturulduğunda seçili bölgelerdeki üyelere otomatik SMS gönderilir.
              </p>
            </div>
          </div>

          {autoSmsForMeetings && (
            <div className="ml-7">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Toplantı SMS'i için Özel Metin
              </label>
              <textarea
                value={meetingCustomText}
                onChange={(e) => setMeetingCustomText(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Özel metin ekleyin (opsiyonel). Örnek: Lütfen zamanında katılım sağlayınız."
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Mesaj formatı: "Sayın [üye adı], [tarih] tarihinde [saat] saatinde toplantı planlanmıştır. [özel metin]"
              </p>
            </div>
          )}

          {/* Planlanan Etkinlikler için Otomatik SMS */}
          <div className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex-1">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSmsForEvents}
                  onChange={(e) => setAutoSmsForEvents(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                  Planlanan Etkinlikler için Otomatik SMS
                </span>
              </label>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 ml-7">
                Planlanan etkinlik oluşturulduğunda seçili bölgelerdeki üyelere otomatik SMS gönderilir.
              </p>
            </div>
          </div>

          {autoSmsForEvents && (
            <div className="ml-7">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Etkinlik SMS'i için Özel Metin
              </label>
              <textarea
                value={eventCustomText}
                onChange={(e) => setEventCustomText(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Özel metin ekleyin (opsiyonel). Örnek: Lütfen zamanında katılım sağlayınız."
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Mesaj formatı: "Sayın [üye adı], [tarih] tarihinde [saat] saatinde etkinlik planlanmıştır. [özel metin]"
              </p>
            </div>
          )}

          {/* Özel Mesaj için Otomatik SMS */}
          <div className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex-1">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSmsForCustom}
                  onChange={(e) => setAutoSmsForCustom(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                  Özel Mesaj için Otomatik SMS
                </span>
              </label>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 ml-7">
                Bir üyeye özel mesaj gönderildiğinde veya gruba mesaj gönderildiğinde otomatik SMS gönderilir.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={handleTestSms}
          disabled={saving || !apiKey || !apiSecret}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
        >
          Test SMS Gönder
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-700 border border-transparent rounded-lg text-sm font-medium text-white hover:from-indigo-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>
    </div>
  );
};

export default SmsSettings;

