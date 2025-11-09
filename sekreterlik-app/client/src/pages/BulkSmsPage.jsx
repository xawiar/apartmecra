import React, { useState, useEffect } from 'react';
import ApiService from '../utils/ApiService';
import Modal from '../components/Modal';

const BulkSmsPage = () => {
  const [regions, setRegions] = useState([]);
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  
  // Ek seçenekler
  const [includeObservers, setIncludeObservers] = useState(false);
  const [includeChiefObservers, setIncludeChiefObservers] = useState(false);
  const [includeTownPresidents, setIncludeTownPresidents] = useState(false);
  
  // İleri tarihli mesaj
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledSms, setScheduledSms] = useState([]);
  const [showScheduledModal, setShowScheduledModal] = useState(false);

  useEffect(() => {
    loadRegions();
    loadScheduledSms();
    
    // Planlanmış SMS'leri kontrol et (her dakika)
    const interval = setInterval(() => {
      checkAndProcessScheduledSms();
    }, 60000); // Her 60 saniyede bir
    
    return () => clearInterval(interval);
  }, []);

  const loadRegions = async () => {
    try {
      setLoading(true);
      const regionsData = await ApiService.getRegions();
      setRegions(regionsData || []);
    } catch (error) {
      console.error('Error loading regions:', error);
      alert('Bölgeler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleRegionToggle = (regionName) => {
    setSelectedRegions(prev => {
      if (prev.includes(regionName)) {
        return prev.filter(r => r !== regionName);
      } else {
        return [...prev, regionName];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedRegions.length === regions.length) {
      setSelectedRegions([]);
    } else {
      setSelectedRegions(regions.map(r => r.name));
    }
  };

  const loadScheduledSms = async () => {
    try {
      const USE_FIREBASE = import.meta.env.VITE_USE_FIREBASE === 'true';
      if (USE_FIREBASE) {
        const { default: FirebaseApiService } = await import('../utils/FirebaseApiService');
        const scheduled = await FirebaseApiService.getScheduledSms('pending');
        setScheduledSms(scheduled || []);
      }
    } catch (error) {
      console.error('Error loading scheduled SMS:', error);
    }
  };

  const checkAndProcessScheduledSms = async () => {
    try {
      const USE_FIREBASE = import.meta.env.VITE_USE_FIREBASE === 'true';
      if (USE_FIREBASE) {
        const { default: FirebaseApiService } = await import('../utils/FirebaseApiService');
        await FirebaseApiService.processScheduledSms();
        // Planlanmış SMS listesini yenile
        await loadScheduledSms();
      }
    } catch (error) {
      console.error('Error processing scheduled SMS:', error);
    }
  };

  const handleSend = async () => {
    if (!message.trim()) {
      alert('Lütfen mesaj metnini girin');
      return;
    }

    if (selectedRegions.length === 0 && !includeObservers && !includeChiefObservers && !includeTownPresidents) {
      alert('Lütfen en az bir bölge seçin veya müşahit/belde başkanı seçeneklerinden birini işaretleyin');
      return;
    }

    // İleri tarihli mesaj kontrolü
    if (isScheduled) {
      if (!scheduledDate) {
        alert('Lütfen planlanan tarih ve saati girin');
        return;
      }

      const scheduledDateTime = new Date(scheduledDate);
      const now = new Date();
      
      if (scheduledDateTime <= now) {
        alert('Planlanan tarih gelecekte olmalıdır');
        return;
      }

      // SMS'i planla
      try {
        setSending(true);
        const USE_FIREBASE = import.meta.env.VITE_USE_FIREBASE === 'true';
        if (USE_FIREBASE) {
          const { default: FirebaseApiService } = await import('../utils/FirebaseApiService');
          const result = await FirebaseApiService.scheduleSms({
            message,
            regions: selectedRegions,
            memberIds: [],
            scheduledDate,
            options: {
              includeObservers,
              includeChiefObservers,
              includeTownPresidents
            }
          });

          if (result.success) {
            alert(`SMS başarıyla planlandı. ${new Date(scheduledDate).toLocaleString('tr-TR')} tarihinde gönderilecek.`);
            setMessage('');
            setSelectedRegions([]);
            setIsScheduled(false);
            setScheduledDate('');
            setIncludeObservers(false);
            setIncludeChiefObservers(false);
            setIncludeTownPresidents(false);
            await loadScheduledSms();
          } else {
            alert('SMS planlanırken hata oluştu: ' + result.message);
          }
        }
      } catch (error) {
        console.error('Error scheduling SMS:', error);
        alert('SMS planlanırken hata oluştu: ' + error.message);
      } finally {
        setSending(false);
      }
      return;
    }

    // Hemen gönder
    const recipientCount = selectedRegions.length;
    const recipientTypes = [];
    if (selectedRegions.length > 0) recipientTypes.push('üyelere');
    if (includeObservers) recipientTypes.push('müşahitlere');
    if (includeChiefObservers) recipientTypes.push('baş müşahitlere');
    if (includeTownPresidents) recipientTypes.push('belde başkanlarına');

    if (!window.confirm(`${recipientTypes.join(', ')} SMS göndermek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      setSending(true);
      setResult(null);
      
      const result = await ApiService.sendBulkSms(message, selectedRegions, [], {
        includeObservers,
        includeChiefObservers,
        includeTownPresidents
      });
      setResult(result);
      setShowResultModal(true);
      
      if (result.success) {
        setMessage('');
        setSelectedRegions([]);
        setIncludeObservers(false);
        setIncludeChiefObservers(false);
        setIncludeTownPresidents(false);
      }
    } catch (error) {
      console.error('Error sending bulk SMS:', error);
      alert('SMS gönderilirken hata oluştu: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="py-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Toplu SMS Gönder</h1>

        {/* Bölge Seçimi */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Bölgeler <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              {selectedRegions.length === regions.length ? 'Tümünü Kaldır' : 'Tümünü Seç'}
            </button>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-60 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3">
              {regions.map(region => (
                <label
                  key={region.id}
                  className="flex items-center p-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500 transition duration-200 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedRegions.includes(region.name)}
                    onChange={() => handleRegionToggle(region.name)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{region.name}</span>
                </label>
              ))}
            </div>
          )}
          
          {selectedRegions.length > 0 && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {selectedRegions.length} bölge seçildi
            </p>
          )}
        </div>

        {/* Ek Seçenekler */}
        <div className="mb-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Ek Alıcılar
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={includeObservers}
                onChange={(e) => setIncludeObservers(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Müşahitler</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={includeChiefObservers}
                onChange={(e) => setIncludeChiefObservers(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Baş Müşahitler</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={includeTownPresidents}
                onChange={(e) => setIncludeTownPresidents(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Belde Başkanları</span>
            </label>
          </div>
        </div>

        {/* Mesaj */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Mesaj Metni <span className="text-red-500">*</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Gönderilecek mesajı yazın. Mesaj başına üye adı otomatik olarak eklenecektir (Sn [üye adı], [mesaj])."
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Mesaj formatı: "Sn [üye adı], [mesaj metni]"
          </p>
        </div>

        {/* İleri Tarihli Mesaj */}
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <label className="flex items-center mb-3">
            <input
              type="checkbox"
              checked={isScheduled}
              onChange={(e) => setIsScheduled(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              İleri Tarihli Mesaj (Planlanmış SMS)
            </span>
          </label>
          {isScheduled && (
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Planlanan Tarih ve Saat <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Seçilen tarih ve saat geldiğinde SMS otomatik olarak gönderilecektir.
              </p>
            </div>
          )}
        </div>

        {/* Planlanmış SMS Listesi */}
        {scheduledSms.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Planlanmış SMS'ler ({scheduledSms.length})
              </label>
              <button
                type="button"
                onClick={() => setShowScheduledModal(true)}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
              >
                Tümünü Gör
              </button>
            </div>
            <div className="max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3 space-y-2">
              {scheduledSms.slice(0, 3).map((sms) => (
                <div key={sms.id} className="bg-white dark:bg-gray-700 rounded p-2 text-xs">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {new Date(sms.scheduledDate).toLocaleString('tr-TR')}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 truncate">
                    {sms.message.substring(0, 50)}...
                  </div>
                </div>
              ))}
              {scheduledSms.length > 3 && (
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  ... ve {scheduledSms.length - 3} planlanmış SMS daha
                </div>
              )}
            </div>
          </div>
        )}

        {/* Gönder Butonu */}
        <div className="flex justify-end">
          <button
            onClick={handleSend}
            disabled={
              sending || 
              !message.trim() || 
              (selectedRegions.length === 0 && !includeObservers && !includeChiefObservers && !includeTownPresidents) ||
              (isScheduled && !scheduledDate)
            }
            className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-700 border border-transparent rounded-lg text-sm font-medium text-white hover:from-indigo-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending 
              ? (isScheduled ? 'Planlanıyor...' : 'Gönderiliyor...') 
              : (isScheduled ? 'SMS Planla' : 'SMS Gönder')
            }
          </button>
        </div>
      </div>

      {/* Sonuç Modal */}
      <Modal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        title="SMS Gönderim Sonucu"
      >
        {result && (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${
              result.success 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800' 
                : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800'
            }`}>
              <p className="font-medium">{result.message}</p>
              {result.sent > 0 && (
                <p className="mt-2 text-sm">Başarılı: {result.sent} SMS</p>
              )}
              {result.failed > 0 && (
                <p className="mt-2 text-sm">Başarısız: {result.failed} SMS</p>
              )}
            </div>

            {result.errors && result.errors.length > 0 && (
              <div className="max-h-60 overflow-y-auto">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hata Detayları:</h3>
                <ul className="space-y-1">
                  {result.errors.slice(0, 10).map((error, index) => (
                    <li key={index} className="text-xs text-gray-600 dark:text-gray-400">
                      {error.member || error.representative}: {error.error}
                    </li>
                  ))}
                  {result.errors.length > 10 && (
                    <li className="text-xs text-gray-500 dark:text-gray-500">
                      ... ve {result.errors.length - 10} hata daha
                    </li>
                  )}
                </ul>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => setShowResultModal(false)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Tamam
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Planlanmış SMS Modal */}
      <Modal
        isOpen={showScheduledModal}
        onClose={() => setShowScheduledModal(false)}
        title="Planlanmış SMS'ler"
      >
        <div className="space-y-4">
          {scheduledSms.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              Planlanmış SMS bulunmamaktadır.
            </p>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-3">
              {scheduledSms.map((sms) => (
                <div key={sms.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                        {new Date(sms.scheduledDate).toLocaleString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {sms.message}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        Bölgeler: {sms.regions?.length > 0 ? sms.regions.join(', ') : 'Tümü'}
                        {sms.options?.includeObservers && ' | Müşahitler'}
                        {sms.options?.includeChiefObservers && ' | Baş Müşahitler'}
                        {sms.options?.includeTownPresidents && ' | Belde Başkanları'}
                      </div>
                      <div className="mt-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          sms.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                            : sms.status === 'sent'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                            : sms.status === 'failed'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {sms.status === 'pending' && 'Beklemede'}
                          {sms.status === 'sent' && 'Gönderildi'}
                          {sms.status === 'failed' && 'Başarısız'}
                          {sms.status === 'cancelled' && 'İptal Edildi'}
                        </span>
                      </div>
                    </div>
                    {sms.status === 'pending' && (
                      <button
                        onClick={async () => {
                          if (window.confirm('Bu planlanmış SMS\'i iptal etmek istediğinize emin misiniz?')) {
                            try {
                              const USE_FIREBASE = import.meta.env.VITE_USE_FIREBASE === 'true';
                              if (USE_FIREBASE) {
                                const { default: FirebaseApiService } = await import('../utils/FirebaseApiService');
                                await FirebaseApiService.cancelScheduledSms(sms.id);
                                await loadScheduledSms();
                                alert('SMS iptal edildi');
                              }
                            } catch (error) {
                              console.error('Error cancelling SMS:', error);
                              alert('SMS iptal edilirken hata oluştu: ' + error.message);
                            }
                          }
                        }}
                        className="ml-3 px-3 py-1 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border border-red-300 dark:border-red-700 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        İptal Et
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end">
            <button
              onClick={() => setShowScheduledModal(false)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Kapat
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BulkSmsPage;

