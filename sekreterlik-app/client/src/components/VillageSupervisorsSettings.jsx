import React, { useState, useEffect } from 'react';
import ApiService from '../utils/ApiService';

const VillageSupervisorsSettings = () => {
  const [supervisors, setSupervisors] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [villages, setVillages] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSupervisor, setEditingSupervisor] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    tc: '',
    phone: '',
    village_id: '',
    member_id: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [supervisorsData, districtsData, villagesData, membersData] = await Promise.all([
        ApiService.getVillageSupervisors(),
        ApiService.getDistricts(),
        ApiService.getVillages(),
        ApiService.getMembers()
      ]);
      
      setSupervisors(supervisorsData);
      setDistricts(districtsData);
      setVillages(villagesData);
      setMembers(membersData);
    } catch (err) {
      setError('Veriler yüklenirken hata oluştu: ' + err.message);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSupervisor) {
        await ApiService.updateVillageSupervisor(editingSupervisor.id, formData);
      } else {
        await ApiService.createVillageSupervisor(formData);
      }
      
      setFormData({
        name: '',
        tc: '',
        phone: '',
        village_id: '',
        member_id: ''
      });
      setEditingSupervisor(null);
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError('İşlem sırasında hata oluştu: ' + err.message);
    }
  };

  const handleEdit = (supervisor) => {
    setEditingSupervisor(supervisor);
    setFormData({
      name: supervisor.name,
      tc: supervisor.tc,
      phone: supervisor.phone || '',
      village_id: supervisor.village_id,
      member_id: supervisor.member_id || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bu sorumluyu silmek istediğinizden emin misiniz?')) {
      try {
        await ApiService.deleteVillageSupervisor(id);
        fetchData();
      } catch (err) {
        setError('Silme işlemi sırasında hata oluştu: ' + err.message);
      }
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      tc: '',
      phone: '',
      village_id: '',
      member_id: ''
    });
    setEditingSupervisor(null);
    setShowForm(false);
  };

  const getVillageName = (villageId) => {
    const village = villages.find(v => v.id === villageId);
    return village ? village.name : 'Bilinmiyor';
  };

  const getDistrictName = (villageId) => {
    const village = villages.find(v => v.id === villageId);
    if (!village) return 'Bilinmiyor';
    const district = districts.find(d => d.id === village.district_id);
    return district ? district.name : 'Bilinmiyor';
  };

  const getMemberName = (memberId) => {
    if (!memberId) return 'Üye seçilmedi';
    const member = members.find(m => m.id === memberId);
    return member ? member.name : 'Bilinmiyor';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Köy Sorumluları</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Yeni Sorumlu Ekle
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">
            {editingSupervisor ? 'Sorumlu Düzenle' : 'Yeni Sorumlu Ekle'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ad Soyad *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  TC Kimlik No *
                </label>
                <input
                  type="text"
                  name="tc"
                  value={formData.tc}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Köy *
                </label>
                <select
                  name="village_id"
                  value={formData.village_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Köy Seçin</option>
                  {villages.map(village => (
                    <option key={village.id} value={village.id}>
                      {village.name} - {districts.find(d => d.id === village.district_id)?.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Üye (İsteğe Bağlı)
                </label>
                <select
                  name="member_id"
                  value={formData.member_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Üye Seçin</option>
                  {members.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                {editingSupervisor ? 'Güncelle' : 'Ekle'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ad Soyad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  TC Kimlik No
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
                  Üye
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {supervisors.map((supervisor) => (
                <tr key={supervisor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {supervisor.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {supervisor.tc}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {supervisor.phone || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getVillageName(supervisor.village_id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getDistrictName(supervisor.village_id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getMemberName(supervisor.member_id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(supervisor)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => handleDelete(supervisor.id)}
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
        {supervisors.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Henüz köy sorumlusu eklenmemiş.
          </div>
        )}
      </div>
    </div>
  );
};

export default VillageSupervisorsSettings;
