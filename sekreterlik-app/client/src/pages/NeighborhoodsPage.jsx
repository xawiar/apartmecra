import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ApiService from '../utils/ApiService';
import Modal from '../components/Modal';
import * as XLSX from 'xlsx';

const NeighborhoodsPage = () => {
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [neighborhoodRepresentatives, setNeighborhoodRepresentatives] = useState([]);
  const [neighborhoodSupervisors, setNeighborhoodSupervisors] = useState([]);
  const [visitCounts, setVisitCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroupNo, setFilterGroupNo] = useState('');
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupNoInput, setGroupNoInput] = useState('');
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);
  const [visitDetails, setVisitDetails] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [neighborhoodsData, representativesData, supervisorsData] = await Promise.all([
        ApiService.getNeighborhoods(),
        ApiService.getNeighborhoodRepresentatives(),
        ApiService.getNeighborhoodSupervisors()
      ]);
      setNeighborhoods(neighborhoodsData);
      setNeighborhoodRepresentatives(representativesData);
      setNeighborhoodSupervisors(supervisorsData);
    } catch (error) {
      console.error('Error fetching neighborhoods:', error);
      setError('Mahalleler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Neighborhoods yüklendikten sonra ziyaret sayılarını hesapla
  useEffect(() => {
    if (neighborhoods.length > 0) {
      fetchVisitCounts();
    }
  }, [neighborhoods]);

  const fetchVisitCounts = async () => {
    try {
      // Etkinliklerden gerçek ziyaret sayılarını hesapla
      const events = await ApiService.getEvents(false); // Sadece aktif etkinlikler
      
      const counts = {};
      
      // Tüm mahalleler için başlangıç değeri 0
      neighborhoods.forEach(neighborhood => {
        counts[neighborhood.id] = 0;
      });
      
      // Her etkinlik için mahalle ziyaret sayılarını hesapla
      events.forEach(event => {
        if (event.selectedLocationTypes && event.selectedLocations) {
          const locationTypes = event.selectedLocationTypes;
          const locations = event.selectedLocations;
          
          if (locationTypes.includes('neighborhood') && locations.neighborhood) {
            const neighborhoodIds = locations.neighborhood;
            neighborhoodIds.forEach(neighborhoodId => {
              const id = String(neighborhoodId);
              if (counts[id] !== undefined) {
                counts[id] = (counts[id] || 0) + 1;
              } else {
                counts[id] = 1;
              }
            });
          }
        }
      });
      
      setVisitCounts(counts);
    } catch (error) {
      console.error('Error fetching visit counts:', error);
    }
  };

  const handleVisitCountClick = async (neighborhood) => {
    setSelectedNeighborhood(neighborhood);
    setShowVisitModal(true);
    
    try {
      // Tüm etkinlikleri al
      const events = await ApiService.getEvents(false); // Sadece aktif etkinlikler
      
      // Bu mahalle için ziyaret detaylarını bul
      const details = [];
      events.forEach(event => {
        if (event.selectedLocationTypes && event.selectedLocations) {
          const locationTypes = event.selectedLocationTypes;
          const locations = event.selectedLocations;
          
          if (locationTypes.includes('neighborhood') && locations.neighborhood) {
            const neighborhoodIds = locations.neighborhood;
            if (neighborhoodIds.includes(neighborhood.id) || neighborhoodIds.includes(String(neighborhood.id))) {
              details.push({
                eventName: event.name || 'Etkinlik',
                eventDate: event.date || '',
                eventDescription: event.description || ''
              });
            }
          }
        }
      });
      
      // Tarihe göre sırala (en yeni önce)
      details.sort((a, b) => {
        const dateA = new Date(a.eventDate);
        const dateB = new Date(b.eventDate);
        return dateB - dateA;
      });
      
      setVisitDetails(details);
    } catch (error) {
      console.error('Error fetching visit details:', error);
      setVisitDetails([]);
    }
  };

  const handleGroupNoChange = async (neighborhoodId, groupNo) => {
    try {
      await ApiService.updateNeighborhood(neighborhoodId, { group_no: groupNo || null });
      await fetchData();
      setEditingGroup(null);
      setGroupNoInput('');
    } catch (error) {
      console.error('Error updating group no:', error);
      alert('Grup numarası güncellenirken hata oluştu');
    }
  };

  // Calculate neighborhoods without representatives
  const neighborhoodsWithReps = new Set(
    neighborhoodRepresentatives.map(rep => rep.neighborhood_id).filter(Boolean)
  );
  const neighborhoodsWithoutReps = neighborhoods.filter(
    n => !neighborhoodsWithReps.has(n.id)
  ).length;

  const filteredNeighborhoods = neighborhoods.filter(neighborhood => {
    const matchesSearch = 
      neighborhood.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      neighborhood.district_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      neighborhood.town_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGroup = filterGroupNo 
      ? String(neighborhood.group_no || '') === String(filterGroupNo)
      : true;
    
    return matchesSearch && matchesGroup;
  }).sort((a, b) => {
    // Sort by group_no first (nulls last)
    const groupA = a.group_no ? parseInt(a.group_no) : 999999;
    const groupB = b.group_no ? parseInt(b.group_no) : 999999;
    if (groupA !== groupB) {
      return groupA - groupB;
    }
    // Then sort by name
    return (a.name || '').localeCompare(b.name || '');
  });

  const exportToExcel = () => {
    const excelData = [
      ['Mahalle Adı', 'İlçe', 'Belde', 'Grup No', 'Temsilci', 'Temsilci Telefon', 'Müfettiş', 'Müfettiş Telefon']
    ];

    filteredNeighborhoods.forEach(neighborhood => {
      const representative = neighborhoodRepresentatives.find(rep => String(rep.neighborhood_id) === String(neighborhood.id));
      const supervisor = neighborhoodSupervisors.find(sup => String(sup.neighborhood_id) === String(neighborhood.id));
      
      excelData.push([
        neighborhood.name || '',
        neighborhood.district_name || '',
        neighborhood.town_name || '',
        neighborhood.group_no || '',
        representative?.name || '',
        representative?.phone || '',
        supervisor?.name || '',
        supervisor?.phone || ''
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mahalleler');
    
    const fileName = `mahalleler_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Mahalleler</h1>
        </div>
        <button
          onClick={exportToExcel}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Excel'e Aktar
        </button>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-blue-800">
            <span className="font-semibold">Toplam Mahalle:</span> {neighborhoods.length} | 
            <span className="font-semibold ml-2">Temsilci Atanmamış:</span> {neighborhoodsWithoutReps}
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
        <input
          type="text"
          placeholder="Mahalle adı, ilçe veya belde ile ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
        <div className="flex items-center space-x-2">
          <label htmlFor="filterGroupNo" className="text-sm text-gray-700 whitespace-nowrap">Grup No Filtrele:</label>
          <input
            type="number"
            id="filterGroupNo"
            value={filterGroupNo}
            onChange={(e) => setFilterGroupNo(e.target.value)}
            className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Tümü"
            min="1"
          />
          {filterGroupNo && (
            <button
              onClick={() => setFilterGroupNo('')}
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              Temizle
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredNeighborhoods.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz mahalle eklenmemiş'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mahalle Adı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İlçe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Belde
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grup
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Temsilci
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Müfettiş
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ziyaret Sayısı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Temsilci Durumu
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredNeighborhoods.map((neighborhood) => {
                  const hasRepresentative = neighborhoodsWithReps.has(neighborhood.id);
                  const representative = neighborhoodRepresentatives.find(rep => rep.neighborhood_id === neighborhood.id);
                  const supervisor = neighborhoodSupervisors.find(sup => sup.neighborhood_id === neighborhood.id);
                  const isEditing = editingGroup === neighborhood.id;
                  
                  return (
                    <tr key={neighborhood.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {neighborhood.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {neighborhood.district_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {neighborhood.town_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {isEditing ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              value={groupNoInput}
                              onChange={(e) => setGroupNoInput(e.target.value)}
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="Grup"
                              min="1"
                              autoFocus
                            />
                            <button
                              onClick={() => handleGroupNoChange(neighborhood.id, groupNoInput)}
                              className="text-green-600 hover:text-green-800 text-sm"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => {
                                setEditingGroup(null);
                                setGroupNoInput('');
                              }}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            {neighborhood.group_no ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                Grup {neighborhood.group_no}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                            <button
                              onClick={() => {
                                setEditingGroup(neighborhood.id);
                                setGroupNoInput(neighborhood.group_no || '');
                              }}
                              className="text-indigo-600 hover:text-indigo-800 text-xs"
                            >
                              ✏️
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {representative?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {supervisor?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => handleVisitCountClick(neighborhood)}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 hover:bg-purple-200 transition-colors cursor-pointer"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {visitCounts[neighborhood.id] || 0} ziyaret
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {hasRepresentative ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Temsilci Atanmış
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Temsilci Atanmamış
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Visit Details Modal */}
      <Modal
        isOpen={showVisitModal}
        onClose={() => {
          setShowVisitModal(false);
          setSelectedNeighborhood(null);
          setVisitDetails([]);
        }}
        title={`${selectedNeighborhood?.name || 'Mahalle'} - Ziyaret Detayları`}
        size="lg"
      >
        <div className="space-y-4">
          {visitDetails.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Bu mahalle için henüz ziyaret kaydı bulunmamaktadır.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visitDetails.map((detail, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                        {detail.eventName}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span className="font-medium">Tarih:</span> {detail.eventDate ? new Date(detail.eventDate).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : '-'}
                      </p>
                      {detail.eventDescription && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {detail.eventDescription}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default NeighborhoodsPage;

