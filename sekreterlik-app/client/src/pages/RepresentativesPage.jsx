import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ApiService from '../utils/ApiService';
import { decryptData } from '../utils/crypto';

const RepresentativesPage = () => {
  const [neighborhoodRepresentatives, setNeighborhoodRepresentatives] = useState([]);
  const [villageRepresentatives, setVillageRepresentatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('neighborhood'); // 'neighborhood' or 'village'
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [neighborhoodData, villageData] = await Promise.all([
        ApiService.getNeighborhoodRepresentatives(),
        ApiService.getVillageRepresentatives()
      ]);
      
      // Decrypt TC and phone fields
      const decryptedNeighborhoodData = neighborhoodData.map(rep => {
        let decryptedTc = rep.tc;
        let decryptedPhone = rep.phone;
        
        if (rep.tc && typeof rep.tc === 'string') {
          const tcResult = decryptData(rep.tc);
          decryptedTc = typeof tcResult === 'string' ? tcResult : (tcResult ? String(tcResult) : rep.tc);
        }
        
        if (rep.phone && typeof rep.phone === 'string') {
          const phoneResult = decryptData(rep.phone);
          decryptedPhone = typeof phoneResult === 'string' ? phoneResult : (phoneResult ? String(phoneResult) : rep.phone);
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
          decryptedTc = typeof tcResult === 'string' ? tcResult : (tcResult ? String(tcResult) : rep.tc);
        }
        
        if (rep.phone && typeof rep.phone === 'string') {
          const phoneResult = decryptData(rep.phone);
          decryptedPhone = typeof phoneResult === 'string' ? phoneResult : (phoneResult ? String(phoneResult) : rep.phone);
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
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredNeighborhoodReps.map((rep) => (
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
                        </tr>
                      ))}
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
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredVillageReps.map((rep) => (
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RepresentativesPage;

