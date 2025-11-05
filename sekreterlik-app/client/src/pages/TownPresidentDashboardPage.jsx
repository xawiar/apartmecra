import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../utils/ApiService';

const TownPresidentDashboardPage = () => {
  const { user, logout } = useAuth();
  const [town, setTown] = useState(null);
  const [managementMembers, setManagementMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState('dashboard');

  const [formData, setFormData] = useState({
    tc: '',
    name: '',
    region: '',
    position: '',
    phone: '',
    address: '',
    email: ''
  });

  const fetchTownData = useCallback(async () => {
    try {
      setLoading(true);
      // Firebase ve backend farklı format döndürüyor, her ikisini de destekle
      const USE_FIREBASE = import.meta.env.VITE_USE_FIREBASE === 'true';
      let response;
      
      if (USE_FIREBASE) {
        // Firebase'de getTownById direkt town objesi döndürür veya null
        const townData = await ApiService.getTownById(user.townId);
        if (townData && townData.success) {
          response = townData;
        } else if (townData && !townData.success) {
          // Firebase'de town bulunamadı, towns listesinden bul
          const towns = await ApiService.getTowns();
          const town = towns.find(t => String(t.id) === String(user.townId));
          if (town) {
            // Districts bilgisini de ekle
            const districts = await ApiService.getDistricts();
            const district = districts.find(d => String(d.id) === String(town.district_id));
            response = {
              success: true,
              town: {
                ...town,
                districtName: district?.name || ''
              }
            };
          } else {
            setError('Belde bilgileri alınamadı');
            return;
          }
        } else {
          // townData direkt town objesi olabilir
          response = {
            success: true,
            town: townData
          };
        }
      } else {
        // Backend formatı
        response = await ApiService.getTownById(user.townId);
      }
      
      if (response && response.success) {
        setTown(response.town);
      } else if (response && !response.success) {
        setError('Belde bilgileri alınamadı');
      }
    } catch (error) {
      console.error('Error fetching town data:', error);
      setError('Belde bilgileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [user.townId]);

  useEffect(() => {
    fetchTownData();
  }, [fetchTownData]);

  useEffect(() => {
    if (town && user?.townId) {
      fetchManagementMembers();
    }
  }, [town, user?.townId]);

  const fetchManagementMembers = async () => {
    try {
      const response = await ApiService.getTownManagementMembers(user.townId);
      // Backend returns array directly, not { success, members }
      if (Array.isArray(response)) {
        setManagementMembers(response);
      } else if (response.success && response.members) {
        // Fallback for different response format
        setManagementMembers(response.members);
      } else {
        setManagementMembers([]);
      }
    } catch (error) {
      console.error('Error fetching management members:', error);
      setManagementMembers([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMember) {
        await ApiService.updateTownManagementMember(editingMember.id, formData);
      } else {
        await ApiService.createTownManagementMember({
          ...formData,
          town_id: user.townId  // Backend expects town_id, not townId
        });
      }
      setShowAddMemberForm(false);
      setEditingMember(null);
      setFormData({
        tc: '',
        name: '',
        region: '',
        position: '',
        phone: '',
        address: '',
        email: ''
      });
      // Wait a bit then refresh the list to ensure backend has processed the request
      setTimeout(() => {
        fetchManagementMembers();
      }, 100);
      alert('Üye başarıyla kaydedildi');
    } catch (error) {
      console.error('Error saving member:', error);
      alert('Üye kaydedilirken hata oluştu: ' + error.message);
    }
  };

  const handleEdit = (member) => {
    setEditingMember(member);
    setFormData({
      tc: member.tc,
      name: member.name,
      region: member.region,
      position: member.position,
      phone: member.phone,
      address: member.address,
      email: member.email
    });
    setShowAddMemberForm(true);
  };

  const handleDelete = async (memberId) => {
    if (!window.confirm('Bu üyeyi silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await ApiService.deleteTownManagementMember(memberId);
      fetchManagementMembers();
    } catch (error) {
      console.error('Error deleting member:', error);
      alert('Üye silinirken hata oluştu');
    }
  };

  const filteredMembers = managementMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.tc.includes(searchTerm) ||
    member.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent mx-auto"></div>
          <p className="mt-6 text-lg text-gray-600 font-medium">Belde bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Hata</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchTownData}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  // Mesajlaşma kaldırıldı

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6 lg:py-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {user.chairmanName}
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600">
                    {town?.name} Belde Başkanı
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Çıkış Yap
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Town Info Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-600">
              <h2 className="text-xl font-bold text-white">Belde Bilgileri</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Belde Adı</h3>
                  <p className="text-gray-600">{town?.name}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Bağlı Olduğu İlçe</h3>
                  <p className="text-gray-600">{town?.districtName}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Management Members Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <h2 className="text-xl font-bold text-white">Yönetim Kurulu Üyeleri</h2>
                <button
                  onClick={() => setShowAddMemberForm(true)}
                  className="px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Yeni Üye Ekle
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Search */}
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Üye ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Members Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TC</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ad Soyad</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Görev</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefon</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.tc}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{member.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.position}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.phone}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleEdit(member)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Düzenle
                          </button>
                          <button
                            onClick={() => handleDelete(member.id)}
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
          </div>
        </div>
      </div>

      {/* Add/Edit Member Modal */}
      {showAddMemberForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {editingMember ? 'Üye Düzenle' : 'Yeni Üye Ekle'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">TC Kimlik No *</label>
                  <input
                    type="text"
                    name="tc"
                    value={formData.tc}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bölge *</label>
                  <input
                    type="text"
                    name="region"
                    value={formData.region}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Görev *</label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddMemberForm(false);
                    setEditingMember(null);
                    setFormData({
                      tc: '',
                      name: '',
                      region: '',
                      position: '',
                      phone: '',
                      address: '',
                      email: ''
                    });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {editingMember ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TownPresidentDashboardPage;