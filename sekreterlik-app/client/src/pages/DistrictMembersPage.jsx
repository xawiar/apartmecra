import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ApiService from '../utils/ApiService';

const DistrictMembersPage = () => {
  const { id } = useParams();
  const [district, setDistrict] = useState(null);
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState({
    tc: '',
    name: '',
    region: '',
    position: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });

  useEffect(() => {
    if (id) {
      fetchDistrict();
    }
  }, [id]);

  const fetchDistrict = async () => {
    try {
      const data = await ApiService.getDistricts();
      const districtData = data.find(d => d.id === parseInt(id));
      setDistrict(districtData);
    } catch (error) {
      console.error('Error fetching district:', error);
      setError('İlçe bilgileri yüklenirken hata oluştu');
    }
  };

  const fetchMembers = async () => {
    try {
      setLoading(true);
      if (!district?.id) {
        console.error('District ID is missing:', district);
        setError('İlçe bilgileri yüklenemedi');
        return;
      }
      
      console.log('Fetching members for district ID:', district.id);
      const data = await ApiService.getDistrictManagementMembers(district.id);
      console.log('District management members:', data);
      setMembers(data);
    } catch (error) {
      console.error('Error fetching members:', error);
      setError('Üyeler yüklenirken hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch members when district changes
  useEffect(() => {
    if (district) {
      fetchMembers();
    }
  }, [district]);

  // Filter members based on search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = members.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.tc.includes(searchTerm) ||
        member.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.region.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMembers(filtered);
    } else {
      setFilteredMembers(members);
    }
  }, [searchTerm, members]);

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
      const memberData = {
        ...formData,
        district_id: district.id
      };
      
      if (editingMember) {
        // Update existing member
        await ApiService.updateDistrictManagementMember(editingMember.id, memberData);
        setEditingMember(null);
      } else {
        // Create new member
        await ApiService.createDistrictManagementMember(memberData);
      }
      
      // Success - close form and refresh members
      setShowAddForm(false);
      setFormData({
        tc: '',
        name: '',
        region: '',
        position: '',
        phone: '',
        email: '',
        address: '',
        notes: ''
      });
      fetchMembers();
    } catch (error) {
      console.error('Error saving member:', error);
      alert(`Hata: ${error.message || 'Üye kaydedilirken bir hata oluştu'}`);
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
      email: member.email || '',
      address: member.address || '',
      notes: member.notes || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (memberId) => {
    if (window.confirm('Bu üyeyi silmek istediğinizden emin misiniz?')) {
      try {
        await ApiService.deleteDistrictManagementMember(memberId);
        fetchMembers();
      } catch (error) {
        console.error('Error deleting member:', error);
        alert(`Hata: ${error.message || 'Üye silinirken bir hata oluştu'}`);
      }
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingMember(null);
    setFormData({
      tc: '',
      name: '',
      region: '',
      position: '',
      phone: '',
      email: '',
      address: '',
      notes: ''
    });
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
          <h1 className="text-2xl font-bold text-gray-900">{district.name} Yönetim Kurulu</h1>
          <p className="text-gray-600">İlçe yönetim kurulu üyeleri</p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/districts"
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Geri Dön
          </Link>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Üye Ekle
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingMember ? 'Üye Düzenle' : 'Yeni Üye Ekle'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">TC Kimlik No *</label>
                <input
                  type="text"
                  name="tc"
                  value={formData.tc}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bölge *</label>
                <input
                  type="text"
                  name="region"
                  value={formData.region}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Görev *</label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon *</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                {editingMember ? 'Güncelle' : 'Kaydet'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Arama Alanı */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Üye ara (ad, TC, görev, bölge)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Temizle
            </button>
          )}
        </div>
      </div>

      {filteredMembers.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {searchTerm ? 'Arama sonucu bulunamadı' : 'Üye bulunamadı'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Arama kriterlerinize uygun üye bulunamadı.' : 'Bu ilçeye ait henüz üye eklenmemiş.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Yönetim Kurulu Üyeleri ({filteredMembers.length}{searchTerm ? ` / ${members.length}` : ''})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Üye</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bölge</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Görev</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İletişim</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {member.photo ? (
                            <img className="h-10 w-10 rounded-full" src={member.photo} alt={member.name} loading="lazy" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-indigo-600">
                                {member.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{member.name}</div>
                          <div className="text-sm text-gray-500">TC: {member.tc}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.region}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.position}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{member.phone}</div>
                      {member.email && <div>{member.email}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DistrictMembersPage;
