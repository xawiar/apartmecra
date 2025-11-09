import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ApiService from '../utils/ApiService';
import { decryptData } from '../utils/crypto';
import CryptoJS from 'crypto-js';
import * as XLSX from 'xlsx';
import Modal from '../components/Modal';

const RepresentativesPage = () => {
  const [neighborhoodRepresentatives, setNeighborhoodRepresentatives] = useState([]);
  const [villageRepresentatives, setVillageRepresentatives] = useState([]);
  const [neighborhoodVisitCounts, setNeighborhoodVisitCounts] = useState({});
  const [villageVisitCounts, setVillageVisitCounts] = useState({});
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('neighborhood'); // 'neighborhood' or 'village'
  const [searchTerm, setSearchTerm] = useState('');
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [smsMessage, setSmsMessage] = useState('');
  const [sendingSms, setSendingSms] = useState(false);
  const [smsResult, setSmsResult] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [neighborhoodData, villageData] = await Promise.all([
        ApiService.getNeighborhoodRepresentatives(),
        ApiService.getVillageRepresentatives()
      ]);
      
      // Decrypt TC and phone fields
      const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'ilsekreterlik-app-encryption-key-2024-secret-very-long-key-for-security';
      
      const forceDecrypt = (encryptedValue) => {
        if (!encryptedValue || typeof encryptedValue !== 'string') return encryptedValue;
        if (!encryptedValue.startsWith('U2FsdGVkX1')) return encryptedValue; // Not encrypted
        
        try {
          const bytes = CryptoJS.AES.decrypt(encryptedValue, ENCRYPTION_KEY);
          const decrypted = bytes.toString(CryptoJS.enc.Utf8);
          if (decrypted && decrypted.trim() !== '') {
            return decrypted;
          }
        } catch (e) {
          // Decrypt failed, try decryptData
          const result = decryptData(encryptedValue);
          if (result && typeof result === 'string' && result !== encryptedValue) {
            return result;
          }
        }
        return encryptedValue;
      };
      
      const decryptedNeighborhoodData = neighborhoodData.map(rep => {
        let decryptedTc = rep.tc;
        let decryptedPhone = rep.phone;
        
        if (rep.tc && typeof rep.tc === 'string') {
          const tcResult = decryptData(rep.tc);
          if (typeof tcResult === 'string' && tcResult.length > 0 && tcResult !== rep.tc) {
            decryptedTc = tcResult;
          } else if (rep.tc.startsWith('U2FsdGVkX1')) {
            // Force decrypt if it looks encrypted
            decryptedTc = forceDecrypt(rep.tc);
          }
        }
        
        if (rep.phone && typeof rep.phone === 'string') {
          const phoneResult = decryptData(rep.phone);
          if (typeof phoneResult === 'string' && phoneResult.length > 0 && phoneResult !== rep.phone) {
            decryptedPhone = phoneResult;
          } else if (rep.phone.startsWith('U2FsdGVkX1')) {
            // Force decrypt if it looks encrypted
            decryptedPhone = forceDecrypt(rep.phone);
          }
        }
        
        return {
          ...rep,
          tc: decryptedTc,
          phone: decryptedPhone
        };
      });
      
      const decryptedVillageData = villageData.map(rep => {
        let decryptedTc = rep.tc;
        let decryptedPhone = rep.phone;
        
        if (rep.tc && typeof rep.tc === 'string') {
          const tcResult = decryptData(rep.tc);
          if (typeof tcResult === 'string' && tcResult.length > 0 && tcResult !== rep.tc) {
            decryptedTc = tcResult;
          } else if (rep.tc.startsWith('U2FsdGVkX1')) {
            // Force decrypt if it looks encrypted
            decryptedTc = forceDecrypt(rep.tc);
          }
        }
        
        if (rep.phone && typeof rep.phone === 'string') {
          const phoneResult = decryptData(rep.phone);
          if (typeof phoneResult === 'string' && phoneResult.length > 0 && phoneResult !== rep.phone) {
            decryptedPhone = phoneResult;
          } else if (rep.phone.startsWith('U2FsdGVkX1')) {
            // Force decrypt if it looks encrypted
            decryptedPhone = forceDecrypt(rep.phone);
          }
        }
        
        return {
          ...rep,
          tc: decryptedTc,
          phone: decryptedPhone
        };
      });
      
      setNeighborhoodRepresentatives(decryptedNeighborhoodData);
      setVillageRepresentatives(decryptedVillageData);
    } catch (error) {
      console.error('Error fetching representatives:', error);
      setError('Temsilciler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Representatives yüklendikten sonra ziyaret sayılarını hesapla
  useEffect(() => {
    if (neighborhoodRepresentatives.length > 0 || villageRepresentatives.length > 0) {
      fetchVisitCountsAndEvents();
    }
  }, [neighborhoodRepresentatives, villageRepresentatives]);

  const fetchVisitCountsAndEvents = async () => {
    try {
      // Etkinlikleri yükle
      const eventsData = await ApiService.getEvents(false); // Sadece aktif etkinlikler
      setEvents(eventsData || []);
      
      // Etkinliklerden gerçek ziyaret sayılarını hesapla
      const neighborhoodCounts = {};
      const villageCounts = {};
      
      // Tüm temsilcilerin mahalle/köy ID'lerini topla
      neighborhoodRepresentatives.forEach(rep => {
        if (rep.neighborhood_id) {
          neighborhoodCounts[rep.neighborhood_id] = 0;
        }
      });
      
      villageRepresentatives.forEach(rep => {
        if (rep.village_id) {
          villageCounts[rep.village_id] = 0;
        }
      });
      
      // Her etkinlik için ziyaret sayılarını hesapla
      eventsData.forEach(event => {
        if (event.selectedLocationTypes && event.selectedLocations) {
          const locationTypes = event.selectedLocationTypes;
          const locations = event.selectedLocations;
          
          // Neighborhood ziyaret sayıları
          if (locationTypes.includes('neighborhood') && locations.neighborhood) {
            const neighborhoodIds = locations.neighborhood;
            neighborhoodIds.forEach(neighborhoodId => {
              const id = String(neighborhoodId);
              if (neighborhoodCounts[id] !== undefined) {
                neighborhoodCounts[id] = (neighborhoodCounts[id] || 0) + 1;
              } else {
                neighborhoodCounts[id] = 1;
              }
            });
          }
          
          // Village ziyaret sayıları
          if (locationTypes.includes('village') && locations.village) {
            const villageIds = locations.village;
            villageIds.forEach(villageId => {
              const id = String(villageId);
              if (villageCounts[id] !== undefined) {
                villageCounts[id] = (villageCounts[id] || 0) + 1;
              } else {
                villageCounts[id] = 1;
              }
            });
          }
        }
      });
      
      setNeighborhoodVisitCounts(neighborhoodCounts);
      setVillageVisitCounts(villageCounts);
    } catch (error) {
      console.error('Error fetching visit counts and events:', error);
    }
  };

  // Temsilcinin katılım sayısını hesapla
  const getAttendanceStats = (rep, isNeighborhood = true) => {
    const locationId = isNeighborhood ? rep.neighborhood_id : rep.village_id;
    const memberId = String(rep.member_id);
    
    // Katılması gereken ziyaret sayısı (location için toplam ziyaret sayısı)
    const requiredVisits = isNeighborhood 
      ? (neighborhoodVisitCounts[locationId] || 0)
      : (villageVisitCounts[locationId] || 0);
    
    // Katıldığı ziyaret sayısı (member_id ile katıldığı etkinlik sayısı)
    let attendedVisits = 0;
    events.forEach(event => {
      if (event.selectedLocationTypes && event.selectedLocations) {
        const locationType = isNeighborhood ? 'neighborhood' : 'village';
        if (event.selectedLocationTypes.includes(locationType)) {
          const locationIds = event.selectedLocations[locationType] || [];
          if (locationIds.includes(locationId) || locationIds.includes(String(locationId))) {
            // Bu etkinlikte bu location var, şimdi temsilci katılmış mı kontrol et
            if (event.attendees && event.attendees.length > 0) {
              const attended = event.attendees.find(a => 
                String(a.memberId) === memberId && a.attended === true
              );
              if (attended) {
                attendedVisits++;
              }
            }
          }
        }
      }
    });
    
    return {
      required: requiredVisits,
      attended: attendedVisits
    };
  };

  const filteredNeighborhoodReps = neighborhoodRepresentatives.filter(rep =>
    rep.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rep.neighborhood_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rep.tc?.includes(searchTerm) ||
    rep.phone?.includes(searchTerm)
  );

  const filteredVillageReps = villageRepresentatives.filter(rep =>
    rep.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rep.village_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rep.tc?.includes(searchTerm) ||
    rep.phone?.includes(searchTerm)
  );

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/election-preparation"
            className="text-indigo-600 hover:text-indigo-800 mb-2 inline-flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Seçime Hazırlık
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Temsilciler</h1>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowSmsModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            SMS Gönder
          </button>
          <button
            onClick={() => {
              const excelData = [
                activeTab === 'neighborhood' 
                  ? ['Mahalle Adı', 'İlçe', 'Belde', 'Temsilci Adı', 'Temsilci TC', 'Temsilci Telefon', 'Grup No']
                  : ['Köy Adı', 'İlçe', 'Belde', 'Temsilci Adı', 'Temsilci TC', 'Temsilci Telefon', 'Grup No']
              ];
              
              const reps = activeTab === 'neighborhood' ? filteredNeighborhoodReps : filteredVillageReps;
              reps.forEach(rep => {
                excelData.push([
                  rep.neighborhood_name || rep.village_name || '',
                  rep.district_name || '',
                  rep.town_name || '',
                  rep.name || '',
                  rep.tc || '',
                  rep.phone || '',
                  rep.group_no || ''
                ]);
              });
              
              const ws = XLSX.utils.aoa_to_sheet(excelData);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, activeTab === 'neighborhood' ? 'Mahalle Temsilcileri' : 'Köy Temsilcileri');
              
              const fileName = `${activeTab === 'neighborhood' ? 'mahalle' : 'koy'}_temsilcileri_${new Date().toISOString().split('T')[0]}.xlsx`;
              XLSX.writeFile(wb, fileName);
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Excel'e Aktar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('neighborhood')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'neighborhood'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Mahalle Temsilcileri ({neighborhoodRepresentatives.length})
            </button>
            <button
              onClick={() => setActiveTab('village')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'village'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Köy Temsilcileri ({villageRepresentatives.length})
            </button>
          </nav>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <input
            type="text"
            placeholder="İsim, TC, telefon veya mahalle/köy adı ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'neighborhood' ? (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Mahalle Temsilcileri</h2>
              {filteredNeighborhoodReps.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz mahalle temsilcisi eklenmemiş'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ad Soyad
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          TC
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Telefon
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Mahalle
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          İlçe
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Belde
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Katılım
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredNeighborhoodReps.map((rep) => {
                        const attendanceStats = getAttendanceStats(rep, true);
                        return (
                          <tr key={rep.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {rep.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {rep.tc}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {rep.phone || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {rep.neighborhood_name || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {rep.district_name || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {rep.town_name || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {attendanceStats.attended}/{attendanceStats.required}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Köy Temsilcileri</h2>
              {filteredVillageReps.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz köy temsilcisi eklenmemiş'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ad Soyad
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          TC
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Telefon
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Köy
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          İlçe
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Belde
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Katılım
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredVillageReps.map((rep) => {
                        const attendanceStats = getAttendanceStats(rep, false);
                        return (
                          <tr key={rep.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {rep.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {rep.tc}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {rep.phone || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {rep.village_name || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {rep.district_name || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {rep.town_name || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {attendanceStats.attended}/{attendanceStats.required}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* SMS Modal */}
      <Modal
        isOpen={showSmsModal}
        onClose={() => {
          setShowSmsModal(false);
          setSmsMessage('');
          setSmsResult(null);
        }}
        title={`${activeTab === 'neighborhood' ? 'Mahalle' : 'Köy'} Temsilcilerine SMS Gönder`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mesaj Metni <span className="text-red-500">*</span>
            </label>
            <textarea
              value={smsMessage}
              onChange={(e) => setSmsMessage(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Gönderilecek mesajı yazın. Mesaj başına temsilci adı otomatik olarak eklenecektir (Sn [temsilci adı], [mesaj])."
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Mesaj formatı: "Sn [temsilci adı], [mesaj metni]"
            </p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Gönderilecek temsilci sayısı: {activeTab === 'neighborhood' ? filteredNeighborhoodReps.length : filteredVillageReps.length}
            </p>
          </div>

          {smsResult && (
            <div className={`p-4 rounded-lg ${
              smsResult.success 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800' 
                : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800'
            }`}>
              <p className="font-medium">{smsResult.message}</p>
              {smsResult.sent > 0 && (
                <p className="mt-2 text-sm">Başarılı: {smsResult.sent} SMS</p>
              )}
              {smsResult.failed > 0 && (
                <p className="mt-2 text-sm">Başarısız: {smsResult.failed} SMS</p>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowSmsModal(false);
                setSmsMessage('');
                setSmsResult(null);
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              İptal
            </button>
            <button
              onClick={async () => {
                if (!smsMessage.trim()) {
                  alert('Lütfen mesaj metnini girin');
                  return;
                }

                const reps = activeTab === 'neighborhood' ? filteredNeighborhoodReps : filteredVillageReps;
                if (reps.length === 0) {
                  alert('Gönderilecek temsilci bulunamadı');
                  return;
                }

                if (!window.confirm(`${reps.length} temsilciye SMS göndermek istediğinize emin misiniz?`)) {
                  return;
                }

                try {
                  setSendingSms(true);
                  setSmsResult(null);
                  
                  const repIds = reps.map(rep => String(rep.id));
                  const result = await ApiService.sendSmsToRepresentatives(
                    activeTab === 'neighborhood' ? 'neighborhood' : 'village',
                    smsMessage,
                    repIds
                  );
                  
                  setSmsResult(result);
                  
                  if (result.success) {
                    setTimeout(() => {
                      setShowSmsModal(false);
                      setSmsMessage('');
                      setSmsResult(null);
                    }, 3000);
                  }
                } catch (error) {
                  console.error('Error sending SMS:', error);
                  setSmsResult({
                    success: false,
                    message: 'SMS gönderilirken hata oluştu: ' + error.message
                  });
                } finally {
                  setSendingSms(false);
                }
              }}
              disabled={sendingSms || !smsMessage.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendingSms ? 'Gönderiliyor...' : 'SMS Gönder'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RepresentativesPage;

