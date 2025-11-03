import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ApiService from '../utils/ApiService';

const BallotBoxDetailsPage = () => {
  const { id } = useParams();
  const [ballotBox, setBallotBox] = useState(null);
  const [observers, setObservers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ballotBoxData, observersData] = await Promise.all([
        ApiService.getBallotBoxById(id),
        ApiService.getBallotBoxObservers()
      ]);
      
      setBallotBox(ballotBoxData);
      
      // Filter observers for this ballot box
      const filteredObservers = observersData.filter(observer => 
        observer.ballot_box_id === parseInt(id)
      );
      setObservers(filteredObservers || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getLocationInfo = (observer) => {
    const district = observer.observer_district_id ? observer.district_name : 'İlçe seçilmemiş';
    const location = observer.observer_neighborhood_id ? observer.neighborhood_name : 
                    observer.observer_village_id ? observer.village_name : 'Mahalle/Köy seçilmemiş';
    return { district, location };
  };

  const chiefObserver = observers.find(observer => observer.is_chief_observer);
  const regularObservers = observers.filter(observer => !observer.is_chief_observer);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Sandık bilgileri yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Hata</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!ballotBox) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-500">Sandık bulunamadı</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sandık Detayları</h1>
              <p className="mt-2 text-gray-600">Sandık No: {ballotBox.ballot_number}</p>
            </div>
            <Link
              to="/election-preparation/ballot-boxes"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              ← Geri Dön
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sandık Bilgileri */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Sandık Bilgileri</h3>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Sandık Numarası</dt>
                  <dd className="mt-1 text-sm text-gray-900">{ballotBox.ballot_number}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Kurum Adı</dt>
                  <dd className="mt-1 text-sm text-gray-900">{ballotBox.institution_name}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Müşahit Bilgileri */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Müşahit Bilgileri</h3>
              
              {chiefObserver ? (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Başmüşahit</h4>
                  <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <p className="text-sm font-medium text-gray-900">{chiefObserver.name}</p>
                    <p className="text-sm text-gray-600">TC: {chiefObserver.tc}</p>
                    <p className="text-sm text-gray-600">Telefon: {chiefObserver.phone}</p>
                    <div className="mt-2 grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs font-medium text-gray-500">İlçe:</span>
                        <p className="text-sm text-gray-900">{getLocationInfo(chiefObserver).district}</p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500">Mahalle/Köy:</span>
                        <p className="text-sm text-gray-900">{getLocationInfo(chiefObserver).location}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Başmüşahit</h4>
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-600">Başmüşahit atanmamış</p>
                  </div>
                </div>
              )}

              {regularObservers.length > 0 ? (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Müşahitler ({regularObservers.length})</h4>
                  <div className="space-y-2">
                    {regularObservers.map((observer) => (
                      <div key={observer.id} className="bg-blue-50 border border-blue-200 rounded-md p-3">
                        <p className="text-sm font-medium text-gray-900">{observer.name}</p>
                        <p className="text-sm text-gray-600">TC: {observer.tc}</p>
                        <p className="text-sm text-gray-600">Telefon: {observer.phone}</p>
                        <div className="mt-2 grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-xs font-medium text-gray-500">İlçe:</span>
                            <p className="text-sm text-gray-900">{getLocationInfo(observer).district}</p>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-gray-500">Mahalle/Köy:</span>
                            <p className="text-sm text-gray-900">{getLocationInfo(observer).location}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Müşahitler</h4>
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-600">Müşahit atanmamış</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BallotBoxDetailsPage;
