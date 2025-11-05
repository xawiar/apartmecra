import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ApiService from '../utils/ApiService';

const ObserversPage = () => {
  const [observers, setObservers] = useState([]);
  const [ballotBoxes, setBallotBoxes] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [towns, setTowns] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [villages, setVillages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingObserver, setEditingObserver] = useState(null);
  const [formData, setFormData] = useState({
    tc: '',
    name: '',
    phone: '',
    ballot_box_id: '',
    district_id: '',
    town_id: '',
    neighborhood_id: '',
    village_id: '',
    is_chief_observer: false
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    district_id: '',
    town_id: '',
    neighborhood_id: '',
    village_id: '',
    is_chief_observer: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [observersData, ballotBoxesData, districtsData, townsData, neighborhoodsData, villagesData] = await Promise.all([
        ApiService.getBallotBoxObservers(),
        ApiService.getBallotBoxes(),
        ApiService.getDistricts(),
        ApiService.getTowns(),
        ApiService.getNeighborhoods(),
        ApiService.getVillages()
      ]);
      setObservers(observersData || []);
      setBallotBoxes(ballotBoxesData || []);
      setDistricts(districtsData || []);
      setTowns(townsData || []);
      setNeighborhoods(neighborhoodsData || []);
      setVillages(villagesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Veriler yüklenirken hata oluştu');
      setObservers([]);
      setBallotBoxes([]);
      setDistricts([]);
      setTowns([]);
      setNeighborhoods([]);
      setVillages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };
      
      // If a ballot box selected, auto-fill its location fields into form
      if (name === 'ballot_box_id') {
        const selected = ballotBoxes.find(bb => String(bb.id) === String(value));
        if (selected) {
          // Sandığın kaydedilirken seçilen mahalle/köy ve belde bilgilerini otomatik doldur
          if (selected.district_id) {
            newData.district_id = String(selected.district_id);
          }
          if (selected.town_id) {
            newData.town_id = String(selected.town_id);
          }
          if (selected.neighborhood_id) {
            newData.neighborhood_id = String(selected.neighborhood_id);
            // Mahalle seçildiyse köy alanını temizle
            newData.village_id = '';
          }
          if (selected.village_id) {
            newData.village_id = String(selected.village_id);
            // Köy seçildiyse mahalle alanını temizle
            newData.neighborhood_id = '';
          }
        } else {
          // Sandık seçimi temizlendiyse, sadece ballot_box_id'yi temizle, diğer alanları koru
          // (kullanıcı manuel değişiklik yapmış olabilir)
        }
      }

      // Reset dependent fields when parent changes (sadece manuel değişikliklerde)
      // Sandık seçimi değiştiğinde reset yapma, sandığın bilgilerini kullan
      if (name === 'district_id') {
        // Eğer district_id değiştiyse ve bu sandık seçimi nedeniyle değilse, alt alanları temizle
        newData.town_id = '';
        newData.neighborhood_id = '';
        newData.village_id = '';
      } else if (name === 'town_id') {
        // Eğer town_id değiştiyse ve bu sandık seçimi nedeniyle değilse, alt alanları temizle
        newData.neighborhood_id = '';
        newData.village_id = '';
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.tc || !formData.name || !formData.phone) {
      setError('TC, isim ve telefon zorunludur');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const observerData = {
        ...formData,
        tc: String(formData.tc || '').trim(),
        name: String(formData.name || '').trim(),
        phone: String(formData.phone || '').trim(),
        // Firebase'de ID'ler string olarak saklanıyor, bu yüzden string'e çeviriyoruz
        ballot_box_id: formData.ballot_box_id ? String(formData.ballot_box_id) : null,
        district_id: formData.district_id ? String(formData.district_id) : null,
        town_id: formData.town_id ? String(formData.town_id) : null,
        neighborhood_id: formData.neighborhood_id ? String(formData.neighborhood_id) : null,
        village_id: formData.village_id ? String(formData.village_id) : null,
        is_chief_observer: formData.is_chief_observer || false
      };

      if (editingObserver) {
        await ApiService.updateBallotBoxObserver(editingObserver.id, observerData);
      } else {
        await ApiService.createBallotBoxObserver(observerData);
      }

      setFormData({
        tc: '',
        name: '',
        phone: '',
        ballot_box_id: '',
        district_id: '',
        town_id: '',
        neighborhood_id: '',
        village_id: '',
        is_chief_observer: false
      });
      setShowAddForm(false);
      setEditingObserver(null);
      await fetchData();
    } catch (error) {
      console.error('Error saving observer:', error);
      setError('Müşahit kaydedilirken hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (observer) => {
    setEditingObserver(observer);
    setFormData({
      tc: observer.tc,
      name: observer.name,
      phone: observer.phone,
      ballot_box_id: observer.ballot_box_id ? observer.ballot_box_id.toString() : '',
      district_id: observer.district_id ? observer.district_id.toString() : '',
      town_id: observer.town_id ? observer.town_id.toString() : '',
      neighborhood_id: observer.neighborhood_id ? observer.neighborhood_id.toString() : '',
      village_id: observer.village_id ? observer.village_id.toString() : '',
      is_chief_observer: observer.is_chief_observer
    });
    setShowAddForm(true);
  };

  const handleDelete = async (observerId) => {
    if (window.confirm('Bu müşahidi silmek istediğinizden emin misiniz?')) {
      try {
        setLoading(true);
        await ApiService.deleteBallotBoxObserver(observerId);
        await fetchData();
      } catch (error) {
        console.error('Error deleting observer:', error);
        setError('Müşahit silinirken hata oluştu');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCancel = () => {
    setFormData({
      tc: '',
      name: '',
      phone: '',
      ballot_box_id: '',
      district_id: '',
      town_id: '',
      neighborhood_id: '',
      village_id: '',
      is_chief_observer: false
    });
    setShowAddForm(false);
    setEditingObserver(null);
    setError('');
  };

  const getBallotBoxName = (ballotBoxId) => {
    // ID'leri string'e çevirerek karşılaştır (tip uyumsuzluğu sorununu çözer)
    if (!ballotBoxId) return 'Sandık seçilmemiş';
    const ballotBox = ballotBoxes.find(bb => String(bb.id) === String(ballotBoxId));
    return ballotBox ? `${ballotBox.ballot_number} - ${ballotBox.institution_name}` : 'Sandık seçilmemiş';
  };

  const getDistrictName = (districtId) => {
    // ID'leri string'e çevirerek karşılaştır (tip uyumsuzluğu sorununu çözer)
    if (!districtId) return '';
    const district = districts.find(d => String(d.id) === String(districtId));
    return district ? district.name : '';
  };

  const getTownName = (townId) => {
    // ID'leri string'e çevirerek karşılaştır (tip uyumsuzluğu sorununu çözer)
    if (!townId) return '';
    const town = towns.find(t => String(t.id) === String(townId));
    return town ? town.name : '';
  };

  const getNeighborhoodName = (neighborhoodId) => {
    // ID'leri string'e çevirerek karşılaştır (tip uyumsuzluğu sorununu çözer)
    if (!neighborhoodId) return '';
    const neighborhood = neighborhoods.find(n => String(n.id) === String(neighborhoodId));
    return neighborhood ? neighborhood.name : '';
  };

  const getVillageName = (villageId) => {
    // ID'leri string'e çevirerek karşılaştır (tip uyumsuzluğu sorununu çözer)
    if (!villageId) return '';
    const village = villages.find(v => String(v.id) === String(villageId));
    return village ? village.name : '';
  };

  const getLocationInfo = (observer) => {
    const parts = [];
    // Hem direkt alanlar hem de observer_ prefix'li alanları kontrol et
    const districtId = observer.district_id || observer.observer_district_id;
    const townId = observer.town_id || observer.observer_town_id;
    const neighborhoodId = observer.neighborhood_id || observer.observer_neighborhood_id;
    const villageId = observer.village_id || observer.observer_village_id;
    
    if (districtId) parts.push(getDistrictName(districtId));
    if (townId) parts.push(getTownName(townId));
    if (neighborhoodId) parts.push(getNeighborhoodName(neighborhoodId));
    if (villageId) parts.push(getVillageName(villageId));
    return parts.length > 0 ? parts.join(' - ') : 'Konum seçilmemiş';
  };

  // Filter observers based on search term and filters
  const getFilteredObservers = () => {
    return observers.filter(observer => {
      const matchesSearch = searchTerm === '' || 
        observer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        observer.tc.includes(searchTerm) ||
        observer.phone.includes(searchTerm) ||
        getBallotBoxName(observer.ballot_box_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getLocationInfo(observer).toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDistrict = filters.district_id === '' || observer.observer_district_id === parseInt(filters.district_id);
      const matchesTown = filters.town_id === '' || observer.observer_town_id === parseInt(filters.town_id);
      const matchesNeighborhood = filters.neighborhood_id === '' || observer.observer_neighborhood_id === parseInt(filters.neighborhood_id);
      const matchesVillage = filters.village_id === '' || observer.observer_village_id === parseInt(filters.village_id);
      const matchesChiefObserver = filters.is_chief_observer === '' || 
        (filters.is_chief_observer === 'true' && observer.is_chief_observer) ||
        (filters.is_chief_observer === 'false' && !observer.is_chief_observer);

      return matchesSearch && matchesDistrict && matchesTown && matchesNeighborhood && matchesVillage && matchesChiefObserver;
    });
  };

  const filteredObservers = getFilteredObservers();
  const chiefObservers = filteredObservers.filter(observer => observer.is_chief_observer);
  const regularObservers = filteredObservers.filter(observer => !observer.is_chief_observer);

  // Calculate statistics
  const getStatistics = () => {
    const totalObservers = filteredObservers.length;
    const chiefObserversCount = chiefObservers.length;
    const regularObserversCount = regularObservers.length;
    
    // Get unique ballot boxes with observers
    const ballotBoxesWithObservers = new Set(filteredObservers.map(obs => obs.ballot_box_id).filter(id => id));
    const totalBallotBoxes = ballotBoxes.length;
    const ballotBoxesWithoutObservers = totalBallotBoxes - ballotBoxesWithObservers.size;
    
    return {
      totalObservers,
      chiefObserversCount,
      regularObserversCount,
      totalBallotBoxes,
      ballotBoxesWithObservers: ballotBoxesWithObservers.size,
      ballotBoxesWithoutObservers
    };
  };

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value,
      // Reset dependent filters when parent changes
      ...(filterType === 'district_id' && {
        town_id: '',
        neighborhood_id: '',
        village_id: ''
      }),
      ...(filterType === 'town_id' && {
        neighborhood_id: '',
        village_id: ''
      })
    }));
  };

  // Get filtered towns based on selected district
  const getFilteredTowns = () => {
    if (!filters.district_id) return towns;
    return towns.filter(town => town.district_id === parseInt(filters.district_id));
  };

  // Get filtered neighborhoods based on selected district
  const getFilteredNeighborhoods = () => {
    if (!filters.district_id) return neighborhoods;
    return neighborhoods.filter(neighborhood => neighborhood.district_id === parseInt(filters.district_id));
  };

  // Get filtered villages based on selected district
  const getFilteredVillages = () => {
    if (!filters.district_id) return villages;
    return villages.filter(village => village.district_id === parseInt(filters.district_id));
  };

  const statistics = getStatistics();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Müşahitler</h1>
              <p className="mt-2 text-gray-600">Başmüşahit ve müşahit yönetimi</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Yeni Müşahit Ekle
              </button>
              <Link
                to="/election-preparation"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                ← Geri Dön
              </Link>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Toplam Müşahit</p>
                <p className="text-2xl font-semibold text-gray-900">{statistics.totalObservers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Başmüşahit</p>
                <p className="text-2xl font-semibold text-gray-900">{statistics.chiefObserversCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Müşahit</p>
                <p className="text-2xl font-semibold text-gray-900">{statistics.regularObserversCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Toplam Sandık</p>
                <p className="text-2xl font-semibold text-gray-900">{statistics.totalBallotBoxes}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Müşahit Atanmış Sandık</p>
                <p className="text-2xl font-semibold text-gray-900">{statistics.ballotBoxesWithObservers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Müşahit Atanmamış Sandık</p>
                <p className="text-2xl font-semibold text-gray-900">{statistics.ballotBoxesWithoutObservers}</p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Hata</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900">
                Müşahit Listesi
              </h2>
            </div>

            <div className="mb-4">
              <input
                type="text"
                placeholder="Müşahit ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Filters */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Filtreler</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">İlçe</label>
                  <select
                    value={filters.district_id}
                    onChange={(e) => handleFilterChange('district_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Tüm İlçeler</option>
                    {districts.map(district => (
                      <option key={district.id} value={district.id}>{district.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Belde</label>
                  <select
                    value={filters.town_id}
                    onChange={(e) => handleFilterChange('town_id', e.target.value)}
                    disabled={!filters.district_id}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                  >
                    <option value="">Tüm Beldeler</option>
                    {getFilteredTowns().map(town => (
                      <option key={town.id} value={town.id}>{town.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mahalle</label>
                  <select
                    value={filters.neighborhood_id}
                    onChange={(e) => handleFilterChange('neighborhood_id', e.target.value)}
                    disabled={!filters.district_id}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                  >
                    <option value="">Tüm Mahalleler</option>
                    {getFilteredNeighborhoods().map(neighborhood => (
                      <option key={neighborhood.id} value={neighborhood.id}>{neighborhood.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Köy</label>
                  <select
                    value={filters.village_id}
                    onChange={(e) => handleFilterChange('village_id', e.target.value)}
                    disabled={!filters.district_id}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                  >
                    <option value="">Tüm Köyler</option>
                    {getFilteredVillages().map(village => (
                      <option key={village.id} value={village.id}>{village.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tür</label>
                  <select
                    value={filters.is_chief_observer}
                    onChange={(e) => handleFilterChange('is_chief_observer', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Tümü</option>
                    <option value="true">Başmüşahit</option>
                    <option value="false">Müşahit</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setFilters({
                    district_id: '',
                    town_id: '',
                    neighborhood_id: '',
                    village_id: '',
                    is_chief_observer: ''
                  })}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Filtreleri Temizle
                </button>
              </div>
            </div>

            {showAddForm && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingObserver ? 'Müşahit Düzenle' : 'Yeni Müşahit Ekle'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        TC Kimlik No *
                      </label>
                      <input
                        type="text"
                        name="tc"
                        value={formData.tc}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Ad Soyad *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Telefon *
                      </label>
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Sandık
                      </label>
                      <select
                        name="ballot_box_id"
                        value={formData.ballot_box_id}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">Sandık seçin (opsiyonel)</option>
                        {ballotBoxes.map(ballotBox => (
                          <option key={ballotBox.id} value={ballotBox.id}>
                            {ballotBox.ballot_number} - {ballotBox.institution_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        İlçe
                      </label>
                      <select
                        name="district_id"
                        value={formData.district_id}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">İlçe seçin (opsiyonel)</option>
                        {districts.map(district => (
                          <option key={district.id} value={district.id}>
                            {district.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Belde
                      </label>
                      <select
                        name="town_id"
                        value={formData.town_id}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        disabled={!formData.district_id}
                      >
                        <option value="">Belde seçin (opsiyonel)</option>
                        {towns.filter(town => String(town.district_id) === String(formData.district_id)).map(town => (
                          <option key={town.id} value={town.id}>
                            {town.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Mahalle
                      </label>
                      <select
                        name="neighborhood_id"
                        value={formData.neighborhood_id}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        disabled={!formData.district_id}
                      >
                        <option value="">Mahalle seçin (opsiyonel)</option>
                        {neighborhoods
                          .filter(neighborhood => {
                            // İlçe kontrolü
                            if (String(neighborhood.district_id) !== String(formData.district_id)) return false;
                            // Eğer belde seçilmişse, belde kontrolü de yap
                            if (formData.town_id) {
                              return String(neighborhood.town_id || '') === String(formData.town_id);
                            }
                            return true;
                          })
                          .map(neighborhood => (
                            <option key={neighborhood.id} value={neighborhood.id}>
                              {neighborhood.name}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Köy
                      </label>
                      <select
                        name="village_id"
                        value={formData.village_id}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        disabled={!formData.district_id}
                      >
                        <option value="">Köy seçin (opsiyonel)</option>
                        {villages
                          .filter(village => {
                            // İlçe kontrolü
                            if (String(village.district_id) !== String(formData.district_id)) return false;
                            // Eğer belde seçilmişse, belde kontrolü de yap
                            if (formData.town_id) {
                              return String(village.town_id || '') === String(formData.town_id);
                            }
                            return true;
                          })
                          .map(village => (
                            <option key={village.id} value={village.id}>
                              {village.name}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="is_chief_observer"
                        checked={formData.is_chief_observer}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-900">
                        Başmüşahit
                      </label>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {loading ? 'Kaydediliyor...' : (editingObserver ? 'Güncelle' : 'Kaydet')}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {loading && !showAddForm ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Müşahitler yükleniyor...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {chiefObservers.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Başmüşahitler</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              TC
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Ad Soyad
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Telefon
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Sandık
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Konum
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              İşlemler
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {chiefObservers.map((observer) => (
                            <tr key={observer.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {observer.tc}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {observer.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {observer.phone}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {getBallotBoxName(observer.ballot_box_id)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {getLocationInfo(observer)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => handleEdit(observer)}
                                  className="text-indigo-600 hover:text-indigo-900 mr-3"
                                >
                                  Düzenle
                                </button>
                                <button
                                  onClick={() => handleDelete(observer.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Sil
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {regularObservers.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Müşahitler</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              TC
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Ad Soyad
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Telefon
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Sandık
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Konum
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              İşlemler
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {regularObservers.map((observer) => (
                            <tr key={observer.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {observer.tc}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {observer.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {observer.phone}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {getBallotBoxName(observer.ballot_box_id)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {getLocationInfo(observer)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => handleEdit(observer)}
                                  className="text-indigo-600 hover:text-indigo-900 mr-3"
                                >
                                  Düzenle
                                </button>
                                <button
                                  onClick={() => handleDelete(observer.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Sil
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {filteredObservers.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      {searchTerm ? 'Arama kriterlerine uygun müşahit bulunamadı' : 'Henüz müşahit eklenmemiş'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ObserversPage;
