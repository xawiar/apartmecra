import React, { useState, useEffect } from 'react';
import ApiService from '../utils/ApiService';

const TownOfficialsSettings = () => {
  const [officials, setOfficials] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [towns, setTowns] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTown, setEditingTown] = useState(null);
  const [formData, setFormData] = useState({
    town_id: '',
    chairman_name: '',
    chairman_phone: '',
    chairman_member_id: '',
    inspector_name: '',
    inspector_phone: '',
    inspector_member_id: '',
    deputy_inspector_name: '',
    deputy_inspector_phone: '',
    deputy_inspector_member_id: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [officialsData, districtsData, townsData, membersData] = await Promise.all([
        ApiService.getTownOfficials(),
        ApiService.getDistricts(),
        ApiService.getTowns(),
        ApiService.getMembers()
      ]);
      
      setOfficials(officialsData);
      setDistricts(districtsData);
      setTowns(townsData);
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
      await ApiService.createOrUpdateTownOfficials(formData);
      
      setFormData({
        town_id: '',
        chairman_name: '',
        chairman_phone: '',
        chairman_member_id: '',
        inspector_name: '',
        inspector_phone: '',
        inspector_member_id: '',
        deputy_inspector_name: '',
        deputy_inspector_phone: '',
        deputy_inspector_member_id: ''
      });
      setEditingTown(null);
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError('İşlem sırasında hata oluştu: ' + err.message);
    }
  };

  const handleEdit = (town) => {
    const official = officials.find(o => o.town_id === town.id);
    if (official) {
      setEditingTown(town);
      setFormData({
        town_id: town.id,
        chairman_name: official.chairman_name || '',
        chairman_phone: official.chairman_phone || '',
        chairman_member_id: official.chairman_member_id || '',
        inspector_name: official.inspector_name || '',
        inspector_phone: official.inspector_phone || '',
        inspector_member_id: official.inspector_member_id || '',
        deputy_inspector_name: official.deputy_inspector_name || '',
        deputy_inspector_phone: official.deputy_inspector_phone || '',
        deputy_inspector_member_id: official.deputy_inspector_member_id || ''
      });
    } else {
      setEditingTown(town);
      setFormData({
        town_id: town.id,
        chairman_name: '',
        chairman_phone: '',
        chairman_member_id: '',
        inspector_name: '',
        inspector_phone: '',
        inspector_member_id: '',
        deputy_inspector_name: '',
        deputy_inspector_phone: '',
        deputy_inspector_member_id: ''
      });
    }
    setShowForm(true);
  };

  const handleDelete = async (townId) => {
    if (window.confirm('Bu beldenin yöneticilerini silmek istediğinizden emin misiniz?')) {
      try {
        await ApiService.deleteTownOfficials(townId);
        fetchData();
      } catch (err) {
        setError('Silme işlemi sırasında hata oluştu: ' + err.message);
      }
    }
  };

  const handleCancel = () => {
    setFormData({
      town_id: '',
      chairman_name: '',
      chairman_phone: '',
      chairman_member_id: '',
      inspector_name: '',
      inspector_phone: '',
      inspector_member_id: '',
      deputy_inspector_name: '',
      deputy_inspector_phone: '',
      deputy_inspector_member_id: ''
    });
    setEditingTown(null);
    setShowForm(false);
  };

  const getMemberName = (memberId) => {
    if (!memberId) return 'Üye seçilmedi';
    const member = members.find(m => m.id === memberId);
    return member ? member.name : 'Bilinmiyor';
  };

  const getDistrictName = (townId) => {
    const town = towns.find(t => t.id === townId);
    if (!town) return 'Bilinmiyor';
    const district = districts.find(d => d.id === town.district_id);
    return district ? district.name : 'Bilinmiyor';
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
        <h2 className="text-2xl font-bold text-gray-900">Belde Yöneticileri</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Yönetici Ekle/Düzenle
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
            {editingTown ? `${editingTown.name} Beldesi Yöneticileri` : 'Belde Yöneticileri Ekle/Düzenle'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Belde *
              </label>
              <select
                name="town_id"
                value={formData.town_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
                disabled={editingTown}
              >
                <option value="">Belde Seçin</option>
                {towns.map(town => (
                  <option key={town.id} value={town.id}>
                    {town.name} - {districts.find(d => d.id === town.district_id)?.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Başkan */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-800 border-b pb-2">Belde Başkanı</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ad Soyad
                  </label>
                  <input
                    type="text"
                    name="chairman_name"
                    value={formData.chairman_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefon
                  </label>
                  <input
                    type="text"
                    name="chairman_phone"
                    value={formData.chairman_phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Üye (İsteğe Bağlı)
                  </label>
                  <select
                    name="chairman_member_id"
                    value={formData.chairman_member_id}
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

              {/* Müfettiş */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-800 border-b pb-2">Belde Müfettişi</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ad Soyad
                  </label>
                  <input
                    type="text"
                    name="inspector_name"
                    value={formData.inspector_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefon
                  </label>
                  <input
                    type="text"
                    name="inspector_phone"
                    value={formData.inspector_phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Üye (İsteğe Bağlı)
                  </label>
                  <select
                    name="inspector_member_id"
                    value={formData.inspector_member_id}
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
            </div>

            {/* Müfettiş Yardımcısı */}
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-gray-800 border-b pb-2">Belde Müfettiş Yardımcısı</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ad Soyad
                  </label>
                  <input
                    type="text"
                    name="deputy_inspector_name"
                    value={formData.deputy_inspector_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefon
                  </label>
                  <input
                    type="text"
                    name="deputy_inspector_phone"
                    value={formData.deputy_inspector_phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Üye (İsteğe Bağlı)
                  </label>
                  <select
                    name="deputy_inspector_member_id"
                    value={formData.deputy_inspector_member_id}
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
                Kaydet
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
                  Belde
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İlçe
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Başkan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Müfettiş
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Müfettiş Yardımcısı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {towns.map((town) => {
                const official = officials.find(o => o.town_id === town.id);
                return (
                  <tr key={town.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {town.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getDistrictName(town.id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {official?.chairman_name || '-'}
                      {official?.chairman_phone && (
                        <div className="text-xs text-gray-400">{official.chairman_phone}</div>
                      )}
                      {official?.chairman_member_id && (
                        <div className="text-xs text-blue-600">
                          {getMemberName(official.chairman_member_id)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {official?.inspector_name || '-'}
                      {official?.inspector_phone && (
                        <div className="text-xs text-gray-400">{official.inspector_phone}</div>
                      )}
                      {official?.inspector_member_id && (
                        <div className="text-xs text-blue-600">
                          {getMemberName(official.inspector_member_id)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {official?.deputy_inspector_name || '-'}
                      {official?.deputy_inspector_phone && (
                        <div className="text-xs text-gray-400">{official.deputy_inspector_phone}</div>
                      )}
                      {official?.deputy_inspector_member_id && (
                        <div className="text-xs text-blue-600">
                          {getMemberName(official.deputy_inspector_member_id)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(town)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Düzenle
                      </button>
                      {official && (
                        <button
                          onClick={() => handleDelete(town.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Sil
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TownOfficialsSettings;
