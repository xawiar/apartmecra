import React, { useState } from 'react';
import FirebaseService from '../services/FirebaseService';
import { useAuth } from '../contexts/AuthContext';

const ClearAllDataPage = () => {
  const { user, isLoggedIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [results, setResults] = useState([]);

  // Tüm collection'lar (admin hariç)
  const COLLECTIONS_TO_CLEAR = [
    'members',
    'meetings',
    'events',
    'tasks',
    'member_users',
    'member_registrations',
    'regions',
    'positions',
    'districts',
    'towns',
    'neighborhoods',
    'villages',
    'stks',
    'mosques',
    'event_categories',
    'neighborhood_representatives',
    'village_representatives',
    'neighborhood_supervisors',
    'village_supervisors',
    'district_officials',
    'town_officials',
    'district_management_members',
    'town_management_members',
    'ballot_boxes',
    'ballot_box_observers',
    'messages',
    'message_groups',
    'personal_documents',
    'archive'
  ];

  const clearAllData = async () => {
    // Son bir kez onay al
    const confirmed = window.confirm(
      '⚠️ DİKKAT! Bu işlem TÜM VERİLERİ silecektir (Admin kullanıcısı hariç).\n\n' +
      'Bu işlem GERİ ALINAMAZ!\n\n' +
      'Devam etmek istediğinize emin misiniz?\n\n' +
      'Son onay için tekrar "OK" tuşuna basın.'
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setStatus('');
    setError('');
    setResults([]);

    try {
      let totalDeleted = 0;
      const resultsList = [];

      // Admin UID'yi al (Firebase Auth'dan)
      const adminCollection = await FirebaseService.getAll('admin');
      const adminDoc = adminCollection && adminCollection.length > 0 ? adminCollection[0] : null;
      const adminUid = adminDoc?.uid || null;
      const adminUsername = adminDoc?.username || 'admin';

      console.log('Admin info:', { adminUid, adminUsername, adminDoc });

      // Her collection'ı temizle
      for (const collectionName of COLLECTIONS_TO_CLEAR) {
        try {
          setStatus(`Temizleniyor: ${collectionName}...`);
          setResults([...resultsList]);
          
          let deleted = 0;
          const allDocs = await FirebaseService.getAll(collectionName);
          
          // Members ve member_users için admin kontrolü yap
          if (collectionName === 'members' || collectionName === 'member_users') {
            for (const doc of allDocs) {
              // Admin kontrolü
              const isAdmin = 
                doc.username === 'admin' || 
                doc.username === adminUsername ||
                doc.email === 'admin@ilsekreterlik.local' ||
                doc.uid === adminUid ||
                doc.id === 'main' ||
                doc.role === 'admin' ||
                doc.type === 'admin';
              
              if (!isAdmin) {
                try {
                  await FirebaseService.delete(collectionName, doc.id);
                  deleted++;
                } catch (deleteError) {
                  console.error(`Error deleting ${collectionName} document ${doc.id}:`, deleteError);
                }
              }
            }
          } else {
            // Diğer collection'lar için tüm kayıtları sil
            for (const doc of allDocs) {
              try {
                await FirebaseService.delete(collectionName, doc.id);
                deleted++;
              } catch (deleteError) {
                console.error(`Error deleting ${collectionName} document ${doc.id}:`, deleteError);
              }
            }
          }
          
          totalDeleted += deleted;
          resultsList.push(`${collectionName}: ${deleted} kayıt silindi (toplam ${allDocs.length})`);
          setResults([...resultsList]);
          
        } catch (error) {
          console.error(`Error clearing ${collectionName}:`, error);
          resultsList.push(`${collectionName}: HATA - ${error.message}`);
          setResults([...resultsList]);
        }
      }

      setStatus(`✅ Tamamlandı! Toplam ${totalDeleted} kayıt silindi.`);
      const resultsText = resultsList.join('\n');
      
      alert(`✅ Tamamlandı!\n\nToplam ${totalDeleted} kayıt silindi.\n\nDetaylar:\n${resultsText}`);
      
    } catch (error) {
      console.error('Error clearing data:', error);
      setError('Veri temizlenirken hata oluştu: ' + error.message);
      alert('Hata: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Admin kontrolü
  if (!isLoggedIn || !user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 font-semibold">Bu sayfaya erişmek için admin yetkisi gereklidir.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-red-600 mb-4">⚠️ Tüm Verileri Temizle</h1>
        
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-red-800 mb-3">DİKKAT!</h2>
          <ul className="list-disc list-inside space-y-2 text-red-700">
            <li>Bu işlem <strong>TÜM VERİLERİ</strong> silecektir</li>
            <li>Admin kullanıcısı <strong>KORUNACAKTIR</strong></li>
            <li>Bu işlem <strong>GERİ ALINAMAZ!</strong></li>
            <li>Silinecekler:
              <ul className="list-disc list-inside ml-6 mt-2">
                <li>Tüm üyeler (admin hariç)</li>
                <li>Arşivlenmiş üyeler (admin hariç)</li>
                <li>Görev ve yetkiler (positions)</li>
                <li>Bölgeler (regions)</li>
                <li>Köyler (villages)</li>
                <li>Mahalleler (neighborhoods)</li>
                <li>Temsilciler (representatives, supervisors, officials)</li>
                <li>Başkanlar (presidents)</li>
                <li>Toplantılar (meetings)</li>
                <li>Etkinlikler (events)</li>
                <li>Görevler (tasks)</li>
                <li>Camiler (mosques)</li>
                <li>STK'lar (stks)</li>
                <li>Ve diğer tüm veriler...</li>
              </ul>
            </li>
          </ul>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {status && (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
            {status}
          </div>
        )}

        {results.length > 0 && (
          <div className="bg-gray-100 border border-gray-300 rounded p-4 mb-4 max-h-96 overflow-y-auto">
            <h3 className="font-semibold mb-2">İşlem Sonuçları:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {results.map((result, index) => (
                <li key={index}>{result}</li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={clearAllData}
          disabled={loading}
          className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-colors ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Temizleniyor...
            </span>
          ) : (
            '⚠️ TÜM VERİLERİ SİL (Admin Hariç)'
          )}
        </button>
      </div>
    </div>
  );
};

export default ClearAllDataPage;

