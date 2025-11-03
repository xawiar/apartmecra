import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ApiService from '../utils/ApiService';

const TownDetailsPage = () => {
  const { id } = useParams();
  const [town, setTown] = useState(null);
  const [district, setDistrict] = useState(null);
  const [officials, setOfficials] = useState([]);
  const [deputyInspectors, setDeputyInspectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchTownDetails();
    }
  }, [id]);

  const fetchTownDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch town
      const towns = await ApiService.getTowns();
      const townData = towns.find(t => t.id === parseInt(id));
      setTown(townData);

      if (townData) {
        // Fetch district
        const districts = await ApiService.getDistricts();
        const districtData = districts.find(d => d.id === townData.district_id);
        setDistrict(districtData);

        // Fetch officials
        const officialsData = await ApiService.getTownOfficials();
        const townOfficials = officialsData.filter(official => official.town_id === parseInt(id));
        setOfficials(townOfficials);

        // Fetch deputy inspectors
        const deputyInspectorsData = await ApiService.getAllTownDeputyInspectors();
        const townDeputyInspectors = deputyInspectorsData.filter(deputy => deputy.town_id === parseInt(id));
        setDeputyInspectors(townDeputyInspectors);
      }

    } catch (error) {
      console.error('Error fetching town details:', error);
      setError('Belde detayları yüklenirken hata oluştu');
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

  if (!town) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-600">Belde bulunamadı</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{town.name} Detayları</h1>
          <p className="text-gray-600">
            {district?.name} ilçesine bağlı belde yönetim bilgileri
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            to={`/districts/${district?.id}/details`}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            İlçe Detayları
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Belde Başkanı ve Müfettiş */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Belde Yönetimi</h3>
          
          {officials.length === 0 ? (
            <p className="text-gray-500">Henüz yönetim atanmamış</p>
          ) : (
            <div className="space-y-4">
              {officials.map((official) => (
                <div key={official.id} className="space-y-3">
                  {official.chairman_name && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900">Belde Başkanı</h4>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-600"><strong>Ad:</strong> {official.chairman_name}</p>
                        <p className="text-sm text-gray-600"><strong>Telefon:</strong> {official.chairman_phone}</p>
                      </div>
                    </div>
                  )}
                  
                  {official.inspector_name && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900">Belde Müfettişi</h4>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Belde Müfettiş Yardımcıları</h3>
          
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Belde Bilgileri</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">{officials.length}</div>
            <div className="text-sm text-gray-500">Yönetim Sayısı</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">{deputyInspectors.length}</div>
            <div className="text-sm text-gray-500">Müfettiş Yardımcısı</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {new Date(town.created_at).toLocaleDateString('tr-TR')}
            </div>
            <div className="text-sm text-gray-500">Oluşturulma Tarihi</div>
          </div>
        </div>
      </div>

      {/* Aksiyon Butonları */}
      <div className="flex justify-center space-x-4">
        <Link
          to={`/towns/${town.id}/members`}
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

export default TownDetailsPage;
