import React, { useState, useEffect } from 'react';
import ApiService from '../utils/ApiService';

const MosquesSettings = () => {
  const [mosques, setMosques] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [towns, setTowns] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [villages, setVillages] = useState([]);
  const [visitCounts, setVisitCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMosque, setEditingMosque] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    district_id: '', 
    town_id: '', 
    neighborhood_id: '', 
    village_id: '',
    location_type: 'neighborhood' // 'neighborhood' or 'village'
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mosquesData, districtsData, townsData, neighborhoodsData, villagesData] = await Promise.all([
        ApiService.getMosques(),
        ApiService.getDistricts(),
        ApiService.getTowns(),
        ApiService.getNeighborhoods(),
        ApiService.getVillages()
      ]);
      setMosques(mosquesData);
      setDistricts(districtsData);
      setTowns(townsData);
      setNeighborhoods(neighborhoodsData);
      setVillages(villagesData);
      
      // Ziyaret sayılarını yükle
      await fetchVisitCounts();
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage('Veriler yüklenirken hata oluştu');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const fetchVisitCounts = async () => {
    try {
      const data = await ApiService.getAllVisitCounts('mosque');
      const counts = {};
      data.forEach(visit => {
        counts[visit.mosque_id] = visit.visit_count;
      });
      setVisitCounts(counts);
    } catch (error) {
      console.error('Error fetching visit counts:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDistrictChange = (e) => {
    const districtId = e.target.value;
    setFormData(prev => ({
      ...prev,
      district_id: districtId,
      town_id: '',
      neighborhood_id: '',
      village_id: ''
    }));
  };

  const handleTownChange = (e) => {
    const townId = e.target.value;
    setFormData(prev => ({
      ...prev,
      town_id: townId,
      neighborhood_id: '',
      village_id: ''
    }));
  };

  const handleLocationTypeChange = (e) => {
    const locationType = e.target.value;
    setFormData(prev => ({
      ...prev,
      location_type: locationType,
      neighborhood_id: '',
      village_id: ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setMessage('Cami adı gereklidir');
      setMessageType('error');
      return;
    }

    if (!formData.district_id) {
      setMessage('İlçe seçimi gereklidir');
      setMessageType('error');
      return;
    }

    if (formData.location_type === 'neighborhood' && !formData.neighborhood_id) {
      setMessage('Mahalle seçimi gereklidir');
      setMessageType('error');
      return;
    }

    if (formData.location_type === 'village' && !formData.village_id) {
      setMessage('Köy seçimi gereklidir');
      setMessageType('error');
      return;
    }

    try {
      const submitData = {
        name: formData.name,
        district_id: formData.district_id,
        town_id: formData.town_id || null,
        neighborhood_id: formData.location_type === 'neighborhood' ? formData.neighborhood_id : null,
        village_id: formData.location_type === 'village' ? formData.village_id : null
      };

      if (editingMosque) {
        await ApiService.updateMosque(editingMosque.id, submitData);
        setMessage('Cami başarıyla güncellendi');
      } else {
        await ApiService.createMosque(submitData);
        setMessage('Cami başarıyla eklendi');
      }
      
      setMessageType('success');
      setFormData({ 
        name: '', 
        district_id: '', 
        town_id: '', 
        neighborhood_id: '', 
        village_id: '',
        location_type: 'neighborhood'
      });
      setEditingMosque(null);
      setShowForm(false);
      fetchData();
    } catch (error) {
      console.error('Error saving mosque:', error);
      setMessage(error.message || 'Cami kaydedilirken hata oluştu');
      setMessageType('error');
    }
  };

  const handleEdit = (mosque) => {
    setEditingMosque(mosque);
    setFormData({ 
      name: mosque.name, 
      district_id: mosque.district_id, 
      town_id: mosque.town_id || '', 
      neighborhood_id: mosque.neighborhood_id || '', 
      village_id: mosque.village_id || '',
      location_type: mosque.neighborhood_id ? 'neighborhood' : 'village'
    });
    setShowForm(true);
  };

  const handleDelete = async (mosque) => {
    if (!window.confirm(`"${mosque.name}" camisini silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      await ApiService.deleteMosque(mosque.id);
      setMessage('Cami başarıyla silindi');
      setMessageType('success');
      fetchData();
    } catch (error) {
      console.error('Error deleting mosque:', error);
      setMessage(error.message || 'Cami silinirken hata oluştu');
      setMessageType('error');
    }
  };

  const handleCancel = () => {
    setFormData({ 
      name: '', 
      district_id: '', 
      town_id: '', 
      neighborhood_id: '', 
      village_id: '',
      location_type: 'neighborhood'
    });
    setEditingMosque(null);
    setShowForm(false);
    setMessage('');
  };

  // Filter data based on selections
  const filteredTowns = towns.filter(town => 
    formData.district_id ? String(town.district_id) === String(formData.district_id) : true
  );

  const filteredNeighborhoods = neighborhoods.filter(neighborhood => {
    // İlçe filtresi
    if (formData.district_id && String(neighborhood.district_id) !== String(formData.district_id)) {
      return false;
    }
    // Belde filtresi (isteğe bağlı)
    if (formData.town_id && String(neighborhood.town_id) !== String(formData.town_id)) {
      return false;
    }
    return true;
  });

  const filteredVillages = villages.filter(village => {
    // İlçe filtresi
    if (formData.district_id && String(village.district_id) !== String(formData.district_id)) {
      return false;
    }
    // Belde filtresi (isteğe bağlı)
    if (formData.town_id && String(village.town_id) !== String(formData.town_id)) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Cami Yönetimi</h2>
          <p className="text-sm text-gray-600">Cami ekleyin, düzenleyin veya silin</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors duration-200"
        >
          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Yeni Cami Ekle
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          messageType === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingMosque ? 'Cami Düzenle' : 'Yeni Cami Ekle'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="district_id" className="block text-sm font-medium text-gray-700 mb-2">
                İlçe Seçimi *
              </label>
              <select
                id="district_id"
                name="district_id"
                value={formData.district_id}
                onChange={handleDistrictChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              >
                <option value="">İlçe seçin</option>
                {districts.map((district) => (
                  <option key={district.id} value={district.id}>
                    {district.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="town_id" className="block text-sm font-medium text-gray-700 mb-2">
                Belde Seçimi (İsteğe Bağlı)
              </label>
              <select
                id="town_id"
                name="town_id"
                value={formData.town_id}
                onChange={handleTownChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={!formData.district_id}
              >
                <option value="">Belde seçin (isteğe bağlı)</option>
                {filteredTowns.map((town) => (
                  <option key={town.id} value={town.id}>
                    {town.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Konum Türü *
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="location_type"
                    value="neighborhood"
                    checked={formData.location_type === 'neighborhood'}
                    onChange={handleLocationTypeChange}
                    className="mr-2"
                  />
                  Mahalle
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="location_type"
                    value="village"
                    checked={formData.location_type === 'village'}
                    onChange={handleLocationTypeChange}
                    className="mr-2"
                  />
                  Köy
                </label>
              </div>
            </div>

            {formData.location_type === 'neighborhood' && (
              <div>
                <label htmlFor="neighborhood_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Mahalle Seçimi *
                </label>
                <select
                  id="neighborhood_id"
                  name="neighborhood_id"
                  value={formData.neighborhood_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={!formData.district_id}
                  required
                >
                  <option value="">Mahalle seçin</option>
                  {filteredNeighborhoods.map((neighborhood) => (
                    <option key={neighborhood.id} value={neighborhood.id}>
                      {neighborhood.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formData.location_type === 'village' && (
              <div>
                <label htmlFor="village_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Köy Seçimi *
                </label>
                <select
                  id="village_id"
                  name="village_id"
                  value={formData.village_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={!formData.district_id}
                  required
                >
                  <option value="">Köy seçin</option>
                  {filteredVillages.map((village) => (
                    <option key={village.id} value={village.id}>
                      {village.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Cami Adı *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Cami adını girin"
                required
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors duration-200"
              >
                {editingMosque ? 'Güncelle' : 'Ekle'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-400 transition-colors duration-200"
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Mosques List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Mevcut Camiler</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {mosques.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p className="mt-2">Henüz cami eklenmemiş</p>
            </div>
          ) : (
            mosques.map((mosque) => (
              <div key={mosque.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-1">
                    <h4 className="text-sm font-medium text-gray-900">{mosque.name}</h4>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {visitCounts[mosque.id] || 0} ziyaret
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    İlçe: {mosque.district_name}
                    {mosque.town_name && ` • Belde: ${mosque.town_name}`}
                    {mosque.neighborhood_name && ` • Mahalle: ${mosque.neighborhood_name}`}
                    {mosque.village_name && ` • Köy: ${mosque.village_name}`}
                    <br />
                    Eklenme: {new Date(mosque.created_at).toLocaleDateString('tr-TR')}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(mosque)}
                    className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-lg transition-colors duration-200"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(mosque)}
                    className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors duration-200"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MosquesSettings;
