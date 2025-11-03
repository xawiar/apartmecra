import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ApiService from '../utils/ApiService';

const DistrictDetailsPage = () => {
  const { id } = useParams();
  const [district, setDistrict] = useState(null);
  const [officials, setOfficials] = useState([]);
  const [deputyInspectors, setDeputyInspectors] = useState([]);
  const [towns, setTowns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchDistrictDetails();
    }
  }, [id]);

  const fetchDistrictDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch district
      const districts = await ApiService.getDistricts();
      const districtData = districts.find(d => d.id === parseInt(id));
      setDistrict(districtData);

      // Fetch officials
      const officialsData = await ApiService.getDistrictOfficials();
      const districtOfficials = officialsData.filter(official => official.district_id === parseInt(id));
      setOfficials(districtOfficials);

      // Fetch deputy inspectors
      const deputyInspectorsData = await ApiService.getAllDistrictDeputyInspectors();
      const districtDeputyInspectors = deputyInspectorsData.filter(deputy => deputy.district_id === parseInt(id));
      setDeputyInspectors(districtDeputyInspectors);

      // Fetch towns for this district
      const townsData = await ApiService.getTowns();
      const districtTowns = townsData.filter(town => town.district_id === parseInt(id));
      setTowns(districtTowns);

    } catch (error) {
      console.error('Error fetching district details:', error);
      setError('İlçe detayları yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
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

  if (!district) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-600">İlçe bulunamadı</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{district.name} Detayları</h1>
          <p className="text-gray-600">İlçe yönetim bilgileri</p>
        </div>
        <Link
          to="/districts"
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Geri Dön
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* İlçe Başkanı ve Müfettiş */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">İlçe Yönetimi</h3>
          
          {officials.length === 0 ? (
            <p className="text-gray-500">Henüz yönetim atanmamış</p>
          ) : (
            <div className="space-y-4">
              {officials.map((official) => (
                <div key={official.id} className="space-y-3">
                  {official.chairman_name && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900">İlçe Başkanı</h4>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-600"><strong>Ad:</strong> {official.chairman_name}</p>
                        <p className="text-sm text-gray-600"><strong>Telefon:</strong> {official.chairman_phone}</p>
                      </div>
                    </div>
                  )}
                  
                  {official.inspector_name && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900">İlçe Müfettişi</h4>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-600"><strong>Ad:</strong> {official.inspector_name}</p>
                        <p className="text-sm text-gray-600"><strong>Telefon:</strong> {official.inspector_phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Müfettiş Yardımcıları */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">İlçe Müfettiş Yardımcıları</h3>
          
          {deputyInspectors.length === 0 ? (
            <p className="text-gray-500">Henüz müfettiş yardımcısı atanmamış</p>
          ) : (
            <div className="space-y-3">
              {deputyInspectors.map((deputy) => (
                <div key={deputy.id} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900">Müfettiş Yardımcısı</h4>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-600"><strong>Ad:</strong> {deputy.member_name || deputy.name}</p>
                    <p className="text-sm text-gray-600"><strong>Telefon:</strong> {deputy.member_phone || deputy.phone}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* İstatistikler */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">İlçe Bilgileri</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">{officials.length}</div>
            <div className="text-sm text-gray-500">Yönetim Sayısı</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">{deputyInspectors.length}</div>
            <div className="text-sm text-gray-500">Müfettiş Yardımcısı</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">{towns.length}</div>
            <div className="text-sm text-gray-500">Belde Sayısı</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {new Date(district.created_at).toLocaleDateString('tr-TR')}
            </div>
            <div className="text-sm text-gray-500">Oluşturulma Tarihi</div>
          </div>
        </div>
      </div>

      {/* Beldeler */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Beldeler ({towns.length})</h3>
          <Link
            to="/settings"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
          >
            Belde Ekle
          </Link>
        </div>
        
        {towns.length === 0 ? (
          <div className="text-center py-8">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h4 className="mt-2 text-sm font-medium text-gray-900">Belde bulunamadı</h4>
            <p className="mt-1 text-sm text-gray-500">Bu ilçeye ait henüz belde eklenmemiş.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {towns.map((town) => (
              <div key={town.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{town.name}</h4>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Belde
                  </span>
                </div>
                <div className="text-sm text-gray-500 mb-3">
                  Oluşturulma: {new Date(town.created_at).toLocaleDateString('tr-TR')}
                </div>
                <div className="flex space-x-2">
                  <Link
                    to={`/towns/${town.id}/members`}
                    className="flex-1 bg-indigo-600 text-white text-center px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                  >
                    Yönetim
                  </Link>
                  <Link
                    to={`/towns/${town.id}/details`}
                    className="flex-1 bg-gray-100 text-gray-700 text-center px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    Detaylar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Aksiyon Butonları */}
      <div className="flex justify-center space-x-4">
        <Link
          to={`/districts/${district.id}/members`}
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Yönetim Kurulu
        </Link>
        <Link
          to="/settings"
          className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Düzenle
        </Link>
      </div>
    </div>
  );
};

export default DistrictDetailsPage;
