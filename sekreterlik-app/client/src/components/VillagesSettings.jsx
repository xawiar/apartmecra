import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import ApiService from '../utils/ApiService';

const VillagesSettings = () => {
  const [villages, setVillages] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [towns, setTowns] = useState([]);
  const [members, setMembers] = useState([]);
  const [villageRepresentatives, setVillageRepresentatives] = useState([]);
  const [villageSupervisors, setVillageSupervisors] = useState([]);
  const [visitCounts, setVisitCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVillage, setEditingVillage] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    district_id: '', 
    town_id: '',
    representative_name: '',
    representative_tc: '',
    representative_phone: '',
    representative_member_id: '',
    supervisor_name: '',
    supervisor_tc: '',
    supervisor_phone: '',
    supervisor_member_id: ''
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [showExcelForm, setShowExcelForm] = useState(false);
  const [excelData, setExcelData] = useState([]);
  const [excelErrors, setExcelErrors] = useState([]);
  const [isProcessingExcel, setIsProcessingExcel] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [villagesData, districtsData, townsData, membersData] = await Promise.all([
        ApiService.getVillages(),
        ApiService.getDistricts(),
        ApiService.getTowns(),
        ApiService.getMembers()
      ]);
      setVillages(villagesData);
      setDistricts(districtsData);
      setTowns(townsData);
      setMembers(membersData);
      
      // Temsilci ve sorumlu verilerini yükle
      await fetchVillageRepresentatives();
      await fetchVillageSupervisors();
      
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
      const data = await ApiService.getAllVisitCounts('village');
      const counts = {};
      data.forEach(visit => {
        counts[visit.village_id] = visit.visit_count;
      });
      setVisitCounts(counts);
    } catch (error) {
      console.error('Error fetching visit counts:', error);
    }
  };

  const fetchVillageRepresentatives = async () => {
    try {
      const representativesData = await ApiService.getVillageRepresentatives();
      console.log('Fetched village representatives:', representativesData);
      setVillageRepresentatives(representativesData);
    } catch (error) {
      console.error('Error fetching village representatives:', error);
    }
  };

  const fetchVillageSupervisors = async () => {
    try {
      const supervisorsData = await ApiService.getVillageSupervisors();
      console.log('Fetched village supervisors:', supervisorsData);
      setVillageSupervisors(supervisorsData);
    } catch (error) {
      console.error('Error fetching village supervisors:', error);
    }
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

  const handleDistrictChange = (e) => {
    const districtId = e.target.value;
    setFormData(prev => ({
      ...prev,
      district_id: districtId,
      town_id: '' // Reset town selection when district changes
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setMessage('Köy adı gereklidir');
      setMessageType('error');
      return;
    }

    if (!formData.district_id) {
      setMessage('İlçe seçimi gereklidir');
      setMessageType('error');
      return;
    }

    try {
      // Köy oluştur
      let village;
      const submitData = {
        name: formData.name,
        district_id: formData.district_id,
        town_id: formData.town_id || null
      };

      if (editingVillage) {
        village = await ApiService.updateVillage(editingVillage.id, submitData);
        setMessage('Köy başarıyla güncellendi');
      } else {
        village = await ApiService.createVillage(submitData);
        setMessage('Köy başarıyla eklendi');
      }

      // Önce mevcut temsilci ve sorumlu verilerini sil
      const existingRepresentatives = villageRepresentatives.filter(rep => rep.village_id === village.id);
      const existingSupervisors = villageSupervisors.filter(sup => sup.village_id === village.id);
      
      for (const rep of existingRepresentatives) {
        await ApiService.deleteVillageRepresentative(rep.id);
      }
      
      for (const sup of existingSupervisors) {
        await ApiService.deleteVillageSupervisor(sup.id);
      }

      // Temsilci bilgilerini kaydet
      if (formData.representative_name || formData.representative_tc || formData.representative_phone) {
        const representativeData = {
          name: formData.representative_name,
          tc: formData.representative_tc,
          phone: formData.representative_phone,
          village_id: village.id,
          member_id: formData.representative_member_id || null
        };
        await ApiService.createVillageRepresentative(representativeData);
      }

      // Sorumlu bilgilerini kaydet
      if (formData.supervisor_name || formData.supervisor_tc || formData.supervisor_phone) {
        const supervisorData = {
          name: formData.supervisor_name,
          tc: formData.supervisor_tc,
          phone: formData.supervisor_phone,
          village_id: village.id,
          member_id: formData.supervisor_member_id || null
        };
        await ApiService.createVillageSupervisor(supervisorData);
      }
      
      setMessageType('success');
      setFormData({ 
        name: '', 
        district_id: '', 
        town_id: '',
        representative_name: '',
        representative_tc: '',
        representative_phone: '',
        representative_member_id: '',
        supervisor_name: '',
        supervisor_tc: '',
        supervisor_phone: '',
        supervisor_member_id: ''
      });
      setEditingVillage(null);
      setShowForm(false);
      fetchData();
      // Temsilci ve sorumlu verilerini yenile
      await fetchVillageRepresentatives();
      await fetchVillageSupervisors();
    } catch (error) {
      console.error('Error saving village:', error);
      setMessage(error.message || 'Köy kaydedilirken hata oluştu');
      setMessageType('error');
    }
  };

  const handleEdit = async (village) => {
    setEditingVillage(village);
    setFormData({ 
      name: village.name, 
      district_id: village.district_id, 
      town_id: village.town_id || '',
      representative_name: '',
      representative_tc: '',
      representative_phone: '',
      representative_member_id: '',
      supervisor_name: '',
      supervisor_tc: '',
      supervisor_phone: '',
      supervisor_member_id: ''
    });
    
    // Mevcut temsilci ve sorumlu bilgilerini yükle
    try {
      const [representatives, supervisors] = await Promise.all([
        ApiService.getVillageRepresentativesByVillage(village.id),
        ApiService.getVillageSupervisorsByVillage(village.id)
      ]);
      
      if (representatives.length > 0) {
        const rep = representatives[0];
        setFormData(prev => ({
          ...prev,
          representative_name: rep.name || '',
          representative_tc: rep.tc || '',
          representative_phone: rep.phone || '',
          representative_member_id: rep.member_id || ''
        }));
      }
      
      if (supervisors.length > 0) {
        const sup = supervisors[0];
        setFormData(prev => ({
          ...prev,
          supervisor_name: sup.name || '',
          supervisor_tc: sup.tc || '',
          supervisor_phone: sup.phone || '',
          supervisor_member_id: sup.member_id || ''
        }));
      }
    } catch (error) {
      console.error('Error fetching village representatives/supervisors:', error);
    }
    
    setShowForm(true);
  };

  const handleDelete = async (village) => {
    if (!window.confirm(`"${village.name}" köyünü silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      await ApiService.deleteVillage(village.id);
      setMessage('Köy başarıyla silindi');
      setMessageType('success');
      fetchData();
    } catch (error) {
      console.error('Error deleting village:', error);
      setMessage(error.message || 'Köy silinirken hata oluştu');
      setMessageType('error');
    }
  };

  const handleCancel = () => {
    setFormData({ 
      name: '', 
      district_id: '', 
      town_id: '',
      representative_name: '',
      representative_tc: '',
      representative_phone: '',
      representative_member_id: '',
      supervisor_name: '',
      supervisor_tc: '',
      supervisor_phone: '',
      supervisor_member_id: ''
    });
    setEditingVillage(null);
    setShowForm(false);
    setMessage('');
  };

  const handleExcelFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // İlk satırı başlık olarak atla
        const dataRows = jsonData.slice(1);
        const processedData = [];
        const errors = [];

        dataRows.forEach((row, index) => {
          const rowNumber = index + 2; // Excel satır numarası (başlık dahil)
          
          if (row.length === 0 || row.every(cell => !cell)) return; // Boş satırları atla

          const villageData = {
            rowNumber,
            districtName: row[0] ? String(row[0]).trim() : '',
            villageName: row[1] ? String(row[1]).trim() : '',
            representativeName: row[2] ? String(row[2]).trim() : '',
            representativePhone: row[3] ? String(row[3]).trim() : '',
            representativeTc: row[4] ? String(row[4]).trim() : ''
          };

          // Validasyon
          if (!villageData.districtName) {
            errors.push(`Satır ${rowNumber}: İlçe adı zorunludur`);
          }
          if (!villageData.villageName) {
            errors.push(`Satır ${rowNumber}: Köy adı zorunludur`);
          }

          // İlçe adını kontrol et
          const district = districts.find(d => 
            d.name.toLowerCase() === villageData.districtName.toLowerCase()
          );
          if (villageData.districtName && !district) {
            errors.push(`Satır ${rowNumber}: "${villageData.districtName}" ilçesi bulunamadı`);
          } else {
            villageData.districtId = district ? district.id : null;
          }

          processedData.push(villageData);
        });

        setExcelData(processedData);
        setExcelErrors(errors);
        setShowExcelForm(true);
      } catch (error) {
        setMessage('Excel dosyası okunurken hata oluştu: ' + error.message);
        setMessageType('error');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const processExcelData = async () => {
    if (excelErrors.length > 0) {
      setMessage('Lütfen hataları düzeltin');
      setMessageType('error');
      return;
    }

    setIsProcessingExcel(true);
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    try {
      for (const villageData of excelData) {
        try {
          // Köy oluştur
          const village = await ApiService.createVillage({
            name: villageData.villageName,
            district_id: villageData.districtId,
            town_id: null
          });

          // Temsilci bilgilerini kaydet (varsa)
          if (villageData.representativeName || villageData.representativePhone || villageData.representativeTc) {
            await ApiService.createVillageRepresentative({
              name: villageData.representativeName,
              phone: villageData.representativePhone,
              tc: villageData.representativeTc,
              village_id: village.id,
              member_id: null
            });
          }

          successCount++;
        } catch (error) {
          errorCount++;
          errors.push(`Satır ${villageData.rowNumber}: ${error.message}`);
        }
      }

      setMessage(`${successCount} köy başarıyla eklendi${errorCount > 0 ? `, ${errorCount} hata oluştu` : ''}`);
      setMessageType(errorCount > 0 ? 'error' : 'success');
      
      if (errors.length > 0) {
        console.error('Excel işleme hataları:', errors);
      }

      // Verileri yenile
      await fetchData();
      setShowExcelForm(false);
      setExcelData([]);
      setExcelErrors([]);
    } catch (error) {
      setMessage('Excel işlenirken hata oluştu: ' + error.message);
      setMessageType('error');
    } finally {
      setIsProcessingExcel(false);
    }
  };

  const downloadExcelTemplate = () => {
    const templateData = [
      ['İlçe Adı', 'Köy Adı', 'Köy Temsilcisi Adı', 'Köy Temsilcisi Telefon', 'Köy Temsilcisi TC'],
      ['MERKEZ', 'Örnek Köy', 'Ahmet Yılmaz', '05551234567', '12345678901']
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Köy Listesi');
    
    XLSX.writeFile(wb, 'koy_ekleme_sablonu.xlsx');
  };

  // Filter towns by selected district
  const filteredTowns = towns.filter(town => 
    formData.district_id ? town.district_id === parseInt(formData.district_id) : true
  );

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
          <h2 className="text-xl font-semibold text-gray-900">Köy Yönetimi</h2>
          <p className="text-sm text-gray-600">Köy ekleyin, düzenleyin veya silin</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={downloadExcelTemplate}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors duration-200"
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Excel Şablonu İndir
          </button>
          <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 cursor-pointer">
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Excel ile Toplu Ekle
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleExcelFile}
              className="hidden"
            />
          </label>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors duration-200"
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Yeni Köy Ekle
          </button>
        </div>
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
            {editingVillage ? 'Köy Düzenle' : 'Yeni Köy Ekle'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Köy Bilgileri */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="text-md font-medium text-gray-900 mb-4">Köy Bilgileri</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    onChange={handleInputChange}
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
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Köy Adı *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Köy adını girin"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Köy Temsilcisi */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="text-md font-medium text-gray-900 mb-4">Köy Temsilcisi</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="representative_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Ad Soyad
                  </label>
                  <input
                    type="text"
                    id="representative_name"
                    name="representative_name"
                    value={formData.representative_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Ad soyad girin"
                  />
                </div>
                <div>
                  <label htmlFor="representative_tc" className="block text-sm font-medium text-gray-700 mb-2">
                    TC Kimlik No
                  </label>
                  <input
                    type="text"
                    id="representative_tc"
                    name="representative_tc"
                    value={formData.representative_tc}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="TC kimlik no"
                  />
                </div>
                <div>
                  <label htmlFor="representative_phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon
                  </label>
                  <input
                    type="text"
                    id="representative_phone"
                    name="representative_phone"
                    value={formData.representative_phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Telefon numarası"
                  />
                </div>
                <div>
                  <label htmlFor="representative_member_id" className="block text-sm font-medium text-gray-700 mb-2">
                    Üye Seç (Opsiyonel)
                  </label>
                  <select
                    id="representative_member_id"
                    name="representative_member_id"
                    value={formData.representative_member_id}
                    onChange={(e) => handleMemberSelect('representative_member_id', e.target.value)}
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

            {/* Köy Sorumlusu */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="text-md font-medium text-gray-900 mb-4">Köy Sorumlusu</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="supervisor_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Ad Soyad
                  </label>
                  <input
                    type="text"
                    id="supervisor_name"
                    name="supervisor_name"
                    value={formData.supervisor_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Ad soyad girin"
                  />
                </div>
                <div>
                  <label htmlFor="supervisor_tc" className="block text-sm font-medium text-gray-700 mb-2">
                    TC Kimlik No
                  </label>
                  <input
                    type="text"
                    id="supervisor_tc"
                    name="supervisor_tc"
                    value={formData.supervisor_tc}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="TC kimlik no"
                  />
                </div>
                <div>
                  <label htmlFor="supervisor_phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon
                  </label>
                  <input
                    type="text"
                    id="supervisor_phone"
                    name="supervisor_phone"
                    value={formData.supervisor_phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Telefon numarası"
                  />
                </div>
                <div>
                  <label htmlFor="supervisor_member_id" className="block text-sm font-medium text-gray-700 mb-2">
                    Üye Seç (Opsiyonel)
                  </label>
                  <select
                    id="supervisor_member_id"
                    name="supervisor_member_id"
                    value={formData.supervisor_member_id}
                    onChange={(e) => handleMemberSelect('supervisor_member_id', e.target.value)}
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
            <div className="flex space-x-3">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors duration-200"
              >
                {editingVillage ? 'Güncelle' : 'Ekle'}
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

      {/* Excel Preview Form */}
      {showExcelForm && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Excel Verilerini Önizle</h3>
          
          {excelErrors.length > 0 && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="text-sm font-medium text-red-800 mb-2">Hatalar:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {excelErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h4 className="text-sm font-medium text-gray-900">
                {excelData.length} köy bulundu
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Satır
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İlçe Adı
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Köy Adı
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Temsilci Adı
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Telefon
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      TC
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {excelData.map((village, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {village.rowNumber}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {village.districtName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {village.villageName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {village.representativeName || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {village.representativePhone || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {village.representativeTc || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 flex space-x-3">
            <button
              onClick={processExcelData}
              disabled={isProcessingExcel || excelErrors.length > 0}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isProcessingExcel ? 'İşleniyor...' : 'Köyleri Ekle'}
            </button>
            <button
              onClick={() => {
                setShowExcelForm(false);
                setExcelData([]);
                setExcelErrors([]);
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-400 transition-colors duration-200"
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {/* Villages List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Mevcut Köyler</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {villages.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p className="mt-2">Henüz köy eklenmemiş</p>
            </div>
          ) : (
            villages.map((village) => {
              const representatives = villageRepresentatives.filter(rep => rep.village_id === village.id);
              const supervisors = villageSupervisors.filter(sup => sup.village_id === village.id);
              console.log(`Village ${village.name} (ID: ${village.id}):`, {
                representatives,
                supervisors,
                allRepresentatives: villageRepresentatives,
                allSupervisors: villageSupervisors
              });
              
              return (
                <div key={village.id} className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-sm font-medium text-gray-900">{village.name}</h4>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {visitCounts[village.id] || 0} ziyaret
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        İlçe: {village.district_name}
                        {village.town_name && ` • Belde: ${village.town_name}`}
                        <br />
                        Eklenme: {new Date(village.created_at).toLocaleDateString('tr-TR')}
                      </p>
                      
                      {/* Temsilci Bilgileri */}
                      {representatives.length > 0 && (
                        <div className="mt-3">
                          <div className="flex flex-wrap gap-2">
                            {representatives.map((rep, index) => (
                              <div key={index} className="bg-blue-50 text-blue-800 px-2 py-1 rounded-md text-xs">
                                <span className="font-medium">Temsilci:</span> {rep.name} {rep.phone && `(${rep.phone})`}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Sorumlu Bilgileri */}
                      {supervisors.length > 0 && (
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-2">
                            {supervisors.map((sup, index) => (
                              <div key={index} className="bg-green-50 text-green-800 px-2 py-1 rounded-md text-xs">
                                <span className="font-medium">Sorumlu:</span> {sup.name} {sup.phone && `(${sup.phone})`}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Atanmamış durumlar */}
                      {representatives.length === 0 && supervisors.length === 0 && (
                        <div className="mt-2">
                          <span className="text-xs text-gray-400">Temsilci ve sorumlu atanmamış</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleEdit(village)}
                        className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-lg transition-colors duration-200"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(village)}
                        className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors duration-200"
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

export default VillagesSettings;
