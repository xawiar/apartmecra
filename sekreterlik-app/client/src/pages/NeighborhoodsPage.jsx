import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ApiService from '../utils/ApiService';

const NeighborhoodsPage = () => {
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [neighborhoodRepresentatives, setNeighborhoodRepresentatives] = useState([]);
  const [neighborhoodSupervisors, setNeighborhoodSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroupNo, setFilterGroupNo] = useState('');
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupNoInput, setGroupNoInput] = useState('');

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
  });

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
    </div>
  );
};

export default NeighborhoodsPage;

