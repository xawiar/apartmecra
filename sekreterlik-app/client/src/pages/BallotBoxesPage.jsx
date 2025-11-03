import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ApiService from '../utils/ApiService';

const BallotBoxesPage = () => {
  const [ballotBoxes, setBallotBoxes] = useState([]);
  const [observers, setObservers] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [towns, setTowns] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [villages, setVillages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBallotBox, setEditingBallotBox] = useState(null);
  const [formData, setFormData] = useState({
    ballot_number: '',
    institution_name: '',
    district_id: '',
    town_id: '',
    neighborhood_id: '',
    village_id: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    district_id: '',
    neighborhood_id: '',
    village_id: '',
    has_observer: ''
  });

  useEffect(() => {
    fetchBallotBoxes();
  }, []);

  const fetchBallotBoxes = async () => {
    try {
      setLoading(true);
      const [ballotBoxesData, observersData, districtsData, townsData, neighborhoodsData, villagesData] = await Promise.all([
        ApiService.getBallotBoxes(),
        ApiService.getBallotBoxObservers(),
        ApiService.getDistricts(),
        ApiService.getTowns(),
        ApiService.getNeighborhoods(),
        ApiService.getVillages()
      ]);
      setBallotBoxes(ballotBoxesData || []);
      setObservers(observersData || []);
      setDistricts(districtsData || []);
      setTowns(townsData || []);
      setNeighborhoods(neighborhoodsData || []);
      setVillages(villagesData || []);
    } catch (error) {
      console.error('Error fetching ballot boxes:', error);
      setError('Sandıklar yüklenirken hata oluştu');
      setBallotBoxes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Cascade filtering helpers
  const filteredTowns = () => {
    if (!formData.district_id) return towns;
    return towns.filter(t => String(t.district_id) === String(formData.district_id));
  };
  const filteredNeighborhoods = () => {
    let base = neighborhoods;
    if (formData.district_id) base = base.filter(n => String(n.district_id) === String(formData.district_id));
    if (formData.town_id && 'town_id' in (base[0] || {})) base = base.filter(n => String(n.town_id) === String(formData.town_id));
    return base;
  };
  const filteredVillages = () => {
    let base = villages;
    if (formData.district_id) base = base.filter(v => String(v.district_id) === String(formData.district_id));
    if (formData.town_id && 'town_id' in (base[0] || {})) base = base.filter(v => String(v.town_id) === String(formData.town_id));
    return base;
  };

  // When higher level changes, clear lower ones
  useEffect(() => {
    setFormData(prev => ({ ...prev, town_id: '', neighborhood_id: '', village_id: '' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.district_id]);
  useEffect(() => {
    setFormData(prev => ({ ...prev, neighborhood_id: '', village_id: '' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.town_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.ballot_number || !formData.institution_name) {
      setError('Sandık numarası ve kurum adı zorunludur');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const payload = {
        ballot_number: formData.ballot_number,
        institution_name: formData.institution_name,
        district_id: formData.district_id || null,
        town_id: formData.town_id || null,
        neighborhood_id: formData.neighborhood_id || null,
        village_id: formData.village_id || null,
      };
      if (editingBallotBox) {
        await ApiService.updateBallotBox(editingBallotBox.id, payload);
      } else {
        await ApiService.createBallotBox(payload);
      }

      setFormData({
        ballot_number: '',
        institution_name: '',
        district_id: '',
        town_id: '',
        neighborhood_id: '',
        village_id: ''
      });
      setShowAddForm(false);
      setEditingBallotBox(null);
      await fetchBallotBoxes();
    } catch (error) {
      console.error('Error saving ballot box:', error);
      setError('Sandık kaydedilirken hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (ballotBox) => {
    setEditingBallotBox(ballotBox);
    setFormData({
      ballot_number: ballotBox.ballot_number,
      institution_name: ballotBox.institution_name,
      district_id: ballotBox.district_id ? String(ballotBox.district_id) : '',
      town_id: ballotBox.town_id ? String(ballotBox.town_id) : '',
      neighborhood_id: ballotBox.neighborhood_id ? String(ballotBox.neighborhood_id) : '',
      village_id: ballotBox.village_id ? String(ballotBox.village_id) : ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (ballotBoxId) => {
    if (window.confirm('Bu sandığı silmek istediğinizden emin misiniz?')) {
      try {
        setLoading(true);
        await ApiService.deleteBallotBox(ballotBoxId);
        await fetchBallotBoxes();
      } catch (error) {
        console.error('Error deleting ballot box:', error);
        setError('Sandık silinirken hata oluştu');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCancel = () => {
    setFormData({
      ballot_number: '',
      institution_name: '',
      district_id: '',
      town_id: '',
      neighborhood_id: '',
      village_id: ''
    });
    setShowAddForm(false);
    setEditingBallotBox(null);
    setError('');
  };

  const getBallotBoxObservers = (ballotBoxId) => {
    return observers.filter(observer => observer.ballot_box_id === ballotBoxId);
  };

  const getBallotBoxStatus = (ballotBoxId) => {
    const ballotBoxObservers = getBallotBoxObservers(ballotBoxId);
    const chiefObserver = ballotBoxObservers.find(observer => observer.is_chief_observer);
    const regularObservers = ballotBoxObservers.filter(observer => !observer.is_chief_observer);
    
    const hasDistrict = ballotBoxObservers.some(observer => observer.observer_district_id);
    const hasNeighborhoodOrVillage = ballotBoxObservers.some(observer => 
      observer.observer_neighborhood_id || observer.observer_village_id
    );
    
    return {
      hasChiefObserver: !!chiefObserver,
      hasObservers: regularObservers.length > 0,
      hasDistrict: hasDistrict,
      hasNeighborhoodOrVillage: hasNeighborhoodOrVillage,
      chiefObserverName: chiefObserver ? chiefObserver.name : null,
      observersCount: regularObservers.length
    };
  };

  // Filter ballot boxes based on search term and filters
  const getFilteredBallotBoxes = () => {
    return ballotBoxes.filter(ballotBox => {
      const matchesSearch = searchTerm === '' || 
        ballotBox.ballot_number.toString().includes(searchTerm) ||
        ballotBox.institution_name.toLowerCase().includes(searchTerm.toLowerCase());

      // Get observers for this ballot box
      const ballotBoxObservers = observers.filter(observer => observer.ballot_box_id === ballotBox.id);
      const hasObservers = ballotBoxObservers.length > 0;

      const matchesDistrict = filters.district_id === '' || 
        ballotBoxObservers.some(observer => observer.observer_district_id === parseInt(filters.district_id));
      const matchesNeighborhood = filters.neighborhood_id === '' || 
        ballotBoxObservers.some(observer => observer.observer_neighborhood_id === parseInt(filters.neighborhood_id));
      const matchesVillage = filters.village_id === '' || 
        ballotBoxObservers.some(observer => observer.observer_village_id === parseInt(filters.village_id));
      const matchesObserverStatus = filters.has_observer === '' || 
        (filters.has_observer === 'true' && hasObservers) ||
        (filters.has_observer === 'false' && !hasObservers);

      return matchesSearch && matchesDistrict && matchesNeighborhood && matchesVillage && matchesObserverStatus;
    });
  };

  const filteredBallotBoxes = getFilteredBallotBoxes();

  // Calculate statistics
  const getStatistics = () => {
    const totalBallotBoxes = filteredBallotBoxes.length;
    
    // Count ballot boxes with chief observers
    const ballotBoxesWithChiefObserver = filteredBallotBoxes.filter(ballotBox => {
      const ballotBoxObservers = observers.filter(observer => observer.ballot_box_id === ballotBox.id);
      return ballotBoxObservers.some(observer => observer.is_chief_observer);
    }).length;
    
    // Count ballot boxes with district assigned
    const ballotBoxesWithDistrict = filteredBallotBoxes.filter(ballotBox => {
      const ballotBoxObservers = observers.filter(observer => observer.ballot_box_id === ballotBox.id);
      return ballotBoxObservers.some(observer => observer.observer_district_id);
    }).length;
    
    // Count ballot boxes with neighborhood/village assigned
    const ballotBoxesWithLocation = filteredBallotBoxes.filter(ballotBox => {
      const ballotBoxObservers = observers.filter(observer => observer.ballot_box_id === ballotBox.id);
      return ballotBoxObservers.some(observer => observer.observer_neighborhood_id || observer.observer_village_id);
    }).length;
    
    // Count completed ballot boxes (has district, location, and chief observer)
    const completedBallotBoxes = filteredBallotBoxes.filter(ballotBox => {
      const ballotBoxObservers = observers.filter(observer => observer.ballot_box_id === ballotBox.id);
      const hasChiefObserver = ballotBoxObservers.some(observer => observer.is_chief_observer);
      const hasDistrict = ballotBoxObservers.some(observer => observer.observer_district_id);
      const hasLocation = ballotBoxObservers.some(observer => observer.observer_neighborhood_id || observer.observer_village_id);
      
      return hasChiefObserver && hasDistrict && hasLocation;
    }).length;
    
    return {
      totalBallotBoxes,
      ballotBoxesWithChiefObserver,
      ballotBoxesWithDistrict,
      ballotBoxesWithLocation,
      completedBallotBoxes
    };
  };

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value,
      // Reset dependent filters when parent changes
      ...(filterType === 'district_id' && {
        neighborhood_id: '',
        village_id: ''
      })
    }));
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
              <h1 className="text-3xl font-bold text-gray-900">Sandıklar</h1>
              <p className="mt-2 text-gray-600">Sandık ekleme ve yönetimi</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Yeni Sandık Ekle
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
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
                <p className="text-sm font-medium text-gray-500">Başmüşahit Atanmış</p>
                <p className="text-2xl font-semibold text-gray-900">{statistics.ballotBoxesWithChiefObserver}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">İlçe Atanmış</p>
                <p className="text-2xl font-semibold text-gray-900">{statistics.ballotBoxesWithDistrict}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Mahalle/Köy Atanmış</p>
                <p className="text-2xl font-semibold text-gray-900">{statistics.ballotBoxesWithLocation}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Tamamlanmış Sandık</p>
                <p className="text-2xl font-semibold text-gray-900">{statistics.completedBallotBoxes}</p>
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
                Sandık Listesi
              </h2>
            </div>

            <div className="mb-4">
              <input
                type="text"
                placeholder="Sandık ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Filters */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Filtreler</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Müşahit Durumu</label>
                  <select
                    value={filters.has_observer}
                    onChange={(e) => handleFilterChange('has_observer', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Tümü</option>
                    <option value="true">Müşahit Atanmış</option>
                    <option value="false">Müşahit Atanmamış</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setFilters({
                    district_id: '',
                    neighborhood_id: '',
                    village_id: '',
                    has_observer: ''
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
                  {editingBallotBox ? 'Sandık Düzenle' : 'Yeni Sandık Ekle'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Sandık Numarası *
                      </label>
                      <input
                        type="text"
                        name="ballot_number"
                        value={formData.ballot_number}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Kurum Adı *
                      </label>
                      <input
                        type="text"
                        name="institution_name"
                        value={formData.institution_name}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>
                  {/* Optional location fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">İlçe (opsiyonel)</label>
                      <select
                        name="district_id"
                        value={formData.district_id}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">İlçe seçin</option>
                        {districts.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Belde (opsiyonel)</label>
                      <select
                        name="town_id"
                        value={formData.town_id}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">Belde seçin</option>
                        {filteredTowns().map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Mahalle (opsiyonel)</label>
                      <select
                        name="neighborhood_id"
                        value={formData.neighborhood_id}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">Mahalle seçin</option>
                        {filteredNeighborhoods().map(n => (
                          <option key={n.id} value={n.id}>{n.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Köy (opsiyonel)</label>
                      <select
                        name="village_id"
                        value={formData.village_id}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">Köy seçin</option>
                        {filteredVillages().map(v => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
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
                      {loading ? 'Kaydediliyor...' : (editingBallotBox ? 'Güncelle' : 'Kaydet')}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {loading && !showAddForm ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Sandıklar yükleniyor...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sandık No
                      </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kurum Adı
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Durum
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          İşlemler
                        </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredBallotBoxes.map((ballotBox) => {
                      const status = getBallotBoxStatus(ballotBox.id);
                      return (
                        <tr key={ballotBox.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {ballotBox.ballot_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {ballotBox.institution_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center">
                                <div className={`w-3 h-3 rounded-full mr-2 ${status.hasDistrict ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span className="text-xs text-gray-600">İlçe</span>
                              </div>
                              <div className="flex items-center">
                                <div className={`w-3 h-3 rounded-full mr-2 ${status.hasNeighborhoodOrVillage ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span className="text-xs text-gray-600">Mahalle/Köy</span>
                              </div>
                              <div className="flex items-center">
                                <div className={`w-3 h-3 rounded-full mr-2 ${status.hasChiefObserver ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span className="text-xs text-gray-600">Başmüşahit</span>
                              </div>
                              <div className="flex items-center">
                                <div className={`w-3 h-3 rounded-full mr-2 ${status.hasObservers ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span className="text-xs text-gray-600">Müşahit</span>
                              </div>
                            </div>
                            {status.chiefObserverName && (
                              <div className="mt-1 text-xs text-gray-500">
                                Başmüşahit: {status.chiefObserverName}
                              </div>
                            )}
                            {status.observersCount > 0 && (
                              <div className="mt-1 text-xs text-gray-500">
                                Müşahit: {status.observersCount} kişi
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link
                              to={`/election-preparation/ballot-boxes/${ballotBox.id}/details`}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                            >
                              Detay
                            </Link>
                            <button
                              onClick={() => handleEdit(ballotBox)}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                            >
                              Düzenle
                            </button>
                            <button
                              onClick={() => handleDelete(ballotBox.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Sil
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {filteredBallotBoxes.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      {searchTerm ? 'Arama kriterlerine uygun sandık bulunamadı' : 'Henüz sandık eklenmemiş'}
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

export default BallotBoxesPage;
