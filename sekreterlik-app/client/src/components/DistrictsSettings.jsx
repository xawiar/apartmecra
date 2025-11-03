import React, { useState, useEffect } from 'react';
import ApiService from '../utils/ApiService';

const DistrictsSettings = () => {
  const [districts, setDistricts] = useState([]);
  const [districtOfficials, setDistrictOfficials] = useState([]);
  const [deputyInspectors, setDeputyInspectors] = useState({});
  const [members, setMembers] = useState([]);
  const [visitCounts, setVisitCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDistrict, setEditingDistrict] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '',
    chairman_name: '',
    chairman_phone: '',
    chairman_member_id: '',
    inspector_name: '',
    inspector_phone: '',
    inspector_member_id: '',
    deputy_inspectors: [{ name: '', phone: '', member_id: '' }]
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  useEffect(() => {
    fetchDistricts();
    fetchMembers();
    fetchDistrictOfficials();
    fetchVisitCounts();
  }, []);

  const fetchDistricts = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getDistricts();
      setDistricts(data);
      // Fetch deputy inspectors after districts are loaded
      await fetchDeputyInspectors(data);
    } catch (error) {
      console.error('Error fetching districts:', error);
      setMessage('İlçeler yüklenirken hata oluştu');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const data = await ApiService.getMembers();
      setMembers(data);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchVisitCounts = async () => {
    try {
      const data = await ApiService.getAllVisitCounts('district');
      const counts = {};
      data.forEach(visit => {
        counts[visit.district_id] = visit.visit_count;
      });
      setVisitCounts(counts);
    } catch (error) {
      console.error('Error fetching visit counts:', error);
    }
  };

  const fetchDistrictOfficials = async () => {
    try {
      const data = await ApiService.getDistrictOfficials();
      setDistrictOfficials(data);
    } catch (error) {
      console.error('Error fetching district officials:', error);
    }
  };

  const fetchDeputyInspectors = async (districts) => {
    const deputyData = {};
    for (const district of districts) {
      try {
        const deputies = await ApiService.getDistrictDeputyInspectors(district.id);
        deputyData[district.id] = deputies;
      } catch (error) {
        console.error(`Error fetching deputy inspectors for district ${district.id}:`, error);
        deputyData[district.id] = [];
      }
    }
    setDeputyInspectors(deputyData);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMemberSelect = (field, memberId) => {
    const member = members.find(m => m.id === parseInt(memberId));
    if (member) {
      setFormData(prev => ({
        ...prev,
        [field]: memberId,
        [`${field.replace('_member_id', '_name')}`]: member.name,
        [`${field.replace('_member_id', '_phone')}`]: member.phone || ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: memberId,
        [`${field.replace('_member_id', '_name')}`]: '',
        [`${field.replace('_member_id', '_phone')}`]: ''
      }));
    }
  };

  const handleDeputyInspectorChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      deputy_inspectors: prev.deputy_inspectors.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleDeputyInspectorMemberSelect = (index, memberId) => {
    const member = members.find(m => m.id === parseInt(memberId));
    if (member) {
      setFormData(prev => ({
        ...prev,
        deputy_inspectors: prev.deputy_inspectors.map((item, i) => 
          i === index ? { 
            ...item, 
            member_id: memberId,
            name: member.name,
            phone: member.phone || ''
          } : item
        )
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        deputy_inspectors: prev.deputy_inspectors.map((item, i) => 
          i === index ? { 
            ...item, 
            member_id: memberId,
            name: '',
            phone: ''
          } : item
        )
      }));
    }
  };

  const addDeputyInspector = () => {
    setFormData(prev => ({
      ...prev,
      deputy_inspectors: [...prev.deputy_inspectors, { name: '', phone: '', member_id: '' }]
    }));
  };

  const removeDeputyInspector = (index) => {
    setFormData(prev => ({
      ...prev,
      deputy_inspectors: prev.deputy_inspectors.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setMessage('İlçe adı gereklidir');
      setMessageType('error');
      return;
    }

    try {
      // İlçe oluştur veya güncelle
      let district;
      if (editingDistrict) {
        district = await ApiService.updateDistrict(editingDistrict.id, { name: formData.name });
        // Optimistic update: update in UI immediately
        setDistricts(districts.map(d => d.id === district.id ? district : d));
        setMessage('İlçe başarıyla güncellendi');
      } else {
        district = await ApiService.createDistrict({ name: formData.name });
        // Optimistic update: add to UI immediately
        setDistricts([...districts, district]);
        setMessage('İlçe başarıyla eklendi');
      }

      // Yönetici bilgilerini kaydet
      const officialsData = {
        district_id: district.id,
        chairman_name: formData.chairman_name,
        chairman_phone: formData.chairman_phone,
        chairman_member_id: formData.chairman_member_id || null,
        inspector_name: formData.inspector_name,
        inspector_phone: formData.inspector_phone,
        inspector_member_id: formData.inspector_member_id || null,
        deputy_inspectors: formData.deputy_inspectors.filter(deputy => 
          deputy.name.trim() || deputy.phone.trim() || deputy.member_id
        )
      };

      await ApiService.createOrUpdateDistrictOfficials(officialsData);
      
      setMessageType('success');
      setFormData({ 
        name: '',
        chairman_name: '',
        chairman_phone: '',
        chairman_member_id: '',
        inspector_name: '',
        inspector_phone: '',
        inspector_member_id: '',
        deputy_inspectors: [{ name: '', phone: '', member_id: '' }]
      });
      setEditingDistrict(null);
      setShowForm(false);
      
      // Fetch fresh data to ensure consistency
      await fetchDistricts();
      await fetchDistrictOfficials();
    } catch (error) {
      console.error('Error saving district:', error);
      setMessage(error.message || 'İlçe kaydedilirken hata oluştu');
      setMessageType('error');
      // Refresh list on error
      await fetchDistricts();
    }
  };

  const handleEdit = async (district) => {
    setEditingDistrict(district);
    setFormData({ 
      name: district.name,
      chairman_name: '',
      chairman_phone: '',
      chairman_member_id: '',
      inspector_name: '',
      inspector_phone: '',
      inspector_member_id: '',
      deputy_inspectors: [{ name: '', phone: '', member_id: '' }]
    });
    
    // Mevcut yönetici bilgilerini yükle
    try {
      const officials = await ApiService.getDistrictOfficialsByDistrict(district.id);
      if (officials.length > 0) {
        const official = officials[0];
        setFormData(prev => ({
          ...prev,
          chairman_name: official.chairman_name || '',
          chairman_phone: official.chairman_phone || '',
          chairman_member_id: official.chairman_member_id || '',
          inspector_name: official.inspector_name || '',
          inspector_phone: official.inspector_phone || '',
          inspector_member_id: official.inspector_member_id || '',
          deputy_inspectors: official.deputy_inspectors || [{ name: '', phone: '', member_id: '' }]
        }));
      }
    } catch (error) {
      console.error('Error fetching district officials:', error);
    }
    
    setShowForm(true);
  };

  const handleDelete = async (district) => {
    if (!window.confirm(`"${district.name}" ilçesini silmek istediğinizden emin misiniz?`)) {
      return;
    }
    
    try {
      // Don't do optimistic update for deletion - wait for server confirmation
      // because deletion might fail due to dependencies
      const result = await ApiService.deleteDistrict(district.id);
      
      // Success - remove from UI
      setDistricts(districts.filter(d => d.id !== district.id));
      setMessage(result.message || 'İlçe başarıyla silindi');
      setMessageType('success');
      
      // Fetch fresh data to ensure consistency
      await fetchDistricts();
    } catch (error) {
      console.error('Error deleting district:', error);
      // Show error message to user
      setMessage(error.message || 'İlçe silinirken hata oluştu');
      setMessageType('error');
      // Fetch fresh data to ensure UI is in sync
      await fetchDistricts();
    }
  };

  const handleCancel = () => {
    setFormData({ 
      name: '',
      chairman_name: '',
      chairman_phone: '',
      chairman_member_id: '',
      inspector_name: '',
      inspector_phone: '',
      inspector_member_id: '',
      deputy_inspectors: [{ name: '', phone: '', member_id: '' }]
    });
    setEditingDistrict(null);
    setShowForm(false);
    setMessage('');
  };

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
          <h2 className="text-xl font-semibold text-gray-900">İlçe Yönetimi</h2>
          <p className="text-sm text-gray-600">İlçe ekleyin, düzenleyin veya silin</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors duration-200"
        >
          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Yeni İlçe Ekle
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
            {editingDistrict ? 'İlçe Düzenle' : 'Yeni İlçe Ekle'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* İlçe Bilgileri */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="text-md font-medium text-gray-900 mb-4">İlçe Bilgileri</h4>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  İlçe Adı
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="İlçe adını girin"
                  required
                />
              </div>
            </div>

            {/* İlçe Başkanı */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="text-md font-medium text-gray-900 mb-4">İlçe Başkanı</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="chairman_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Ad Soyad
                  </label>
                  <input
                    type="text"
                    id="chairman_name"
                    name="chairman_name"
                    value={formData.chairman_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Ad soyad girin"
                  />
                </div>
                <div>
                  <label htmlFor="chairman_phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon
                  </label>
                  <input
                    type="text"
                    id="chairman_phone"
                    name="chairman_phone"
                    value={formData.chairman_phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Telefon numarası"
                  />
                </div>
                <div>
                  <label htmlFor="chairman_member_id" className="block text-sm font-medium text-gray-700 mb-2">
                    Üye Seç (Opsiyonel)
                  </label>
                  <select
                    id="chairman_member_id"
                    name="chairman_member_id"
                    value={formData.chairman_member_id}
                    onChange={(e) => handleMemberSelect('chairman_member_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Üye seçin</option>
                    {members.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* İlçe Müfettişi */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="text-md font-medium text-gray-900 mb-4">İlçe Müfettişi</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="inspector_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Ad Soyad
                  </label>
                  <input
                    type="text"
                    id="inspector_name"
                    name="inspector_name"
                    value={formData.inspector_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Ad soyad girin"
                  />
                </div>
                <div>
                  <label htmlFor="inspector_phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon
                  </label>
                  <input
                    type="text"
                    id="inspector_phone"
                    name="inspector_phone"
                    value={formData.inspector_phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Telefon numarası"
                  />
                </div>
                <div>
                  <label htmlFor="inspector_member_id" className="block text-sm font-medium text-gray-700 mb-2">
                    Üye Seç (Opsiyonel)
                  </label>
                  <select
                    id="inspector_member_id"
                    name="inspector_member_id"
                    value={formData.inspector_member_id}
                    onChange={(e) => handleMemberSelect('inspector_member_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Üye seçin</option>
                    {members.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* İlçe Müfettiş Yardımcıları */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-md font-medium text-gray-900">İlçe Müfettiş Yardımcıları</h4>
                <button
                  type="button"
                  onClick={addDeputyInspector}
                  className="inline-flex items-center px-3 py-1 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors duration-200"
                >
                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Yardımcı Ekle
                </button>
              </div>
              
              {formData.deputy_inspectors.map((deputy, index) => (
                <div key={index} className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="text-sm font-medium text-gray-700">Yardımcı {index + 1}</h5>
                    {formData.deputy_inspectors.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDeputyInspector(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ad Soyad
                      </label>
                      <input
                        type="text"
                        value={deputy.name}
                        onChange={(e) => handleDeputyInspectorChange(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Ad soyad girin"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Telefon
                      </label>
                      <input
                        type="text"
                        value={deputy.phone}
                        onChange={(e) => handleDeputyInspectorChange(index, 'phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Telefon numarası"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Üye Seç (Opsiyonel)
                      </label>
                      <select
                        value={deputy.member_id}
                        onChange={(e) => handleDeputyInspectorMemberSelect(index, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">Üye seçin</option>
                        {members.map(member => (
                          <option key={member.id} value={member.id}>
                            {member.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors duration-200"
              >
                {editingDistrict ? 'Güncelle' : 'Ekle'}
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

      {/* Districts List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Mevcut İlçeler</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {districts.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p className="mt-2">Henüz ilçe eklenmemiş</p>
            </div>
          ) : (
            districts.map((district) => {
              const officials = districtOfficials.filter(official => official.district_id === district.id);
              const chairman = officials.find(official => official.chairman_name);
              const inspector = officials.find(official => official.inspector_name);
              
              return (
                <div key={district.id} className="px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h4 className="text-lg font-semibold text-gray-900">{district.name}</h4>
                        <span className="text-sm text-gray-500">
                          Eklenme: {new Date(district.created_at).toLocaleDateString('tr-TR')}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {visitCounts[district.id] || 0} ziyaret
                        </span>
                      </div>
                      
                      {/* Yönetici Bilgileri */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        {/* İlçe Başkanı */}
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <h5 className="text-sm font-medium text-blue-900 mb-2">İlçe Başkanı</h5>
                          {chairman ? (
                            <div className="space-y-1">
                              <p className="text-sm text-blue-800 font-medium">{chairman.chairman_name}</p>
                              {chairman.chairman_phone && (
                                <p className="text-xs text-blue-600">{chairman.chairman_phone}</p>
                              )}
                              {chairman.chairman_member_name && (
                                <p className="text-xs text-blue-500">Üye: {chairman.chairman_member_name}</p>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-blue-500">Atanmamış</p>
                          )}
                        </div>

                        {/* İlçe Müfettişi */}
                        <div className="bg-green-50 p-3 rounded-lg">
                          <h5 className="text-sm font-medium text-green-900 mb-2">İlçe Müfettişi</h5>
                          {inspector ? (
                            <div className="space-y-1">
                              <p className="text-sm text-green-800 font-medium">{inspector.inspector_name}</p>
                              {inspector.inspector_phone && (
                                <p className="text-xs text-green-600">{inspector.inspector_phone}</p>
                              )}
                              {inspector.inspector_member_name && (
                                <p className="text-xs text-green-500">Üye: {inspector.inspector_member_name}</p>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-green-500">Atanmamış</p>
                          )}
                        </div>

                        {/* Müfettiş Yardımcıları */}
                        <div className="bg-orange-50 p-3 rounded-lg">
                          <h5 className="text-sm font-medium text-orange-900 mb-2">Müfettiş Yardımcıları</h5>
                          {deputyInspectors[district.id] && deputyInspectors[district.id].length > 0 ? (
                            <div className="space-y-1">
                              {deputyInspectors[district.id].map((deputy, index) => (
                                <div key={index} className="text-xs">
                                  <p className="text-orange-800 font-medium">{deputy.name}</p>
                                  {deputy.phone && <p className="text-orange-600">{deputy.phone}</p>}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-orange-500">Atanmamış</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleEdit(district)}
                        className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-lg transition-colors duration-200"
                        title="Düzenle"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(district)}
                        className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        title="Sil"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default DistrictsSettings;
