import React, { useState, useEffect } from 'react';
import ApiService from '../utils/ApiService';

const AdminSettings = () => {
  const [adminInfo, setAdminInfo] = useState({
    username: '',
    created_at: '',
    updated_at: ''
  });
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    currentPassword: ''
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [loading, setLoading] = useState(false);
  const [loadingInfo, setLoadingInfo] = useState(true);

  // Load admin info on component mount
  useEffect(() => {
    fetchAdminInfo();
  }, []);

  const fetchAdminInfo = async () => {
    try {
      setLoadingInfo(true);
      const response = await ApiService.getAdminInfo();
      if (response.success) {
        setAdminInfo(response.admin);
        setFormData(prev => ({
          ...prev,
          username: response.admin.username
        }));
      } else {
        setMessage('Admin bilgileri alınamadı');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error fetching admin info:', error);
      setMessage('Admin bilgileri alınırken hata oluştu');
      setMessageType('error');
    } finally {
      setLoadingInfo(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateAdminInfo = async (e) => {
    e.preventDefault();
    setMessage('');
    
    // Validation
    if (!formData.username.trim()) {
      setMessage('Kullanıcı adı zorunludur');
      setMessageType('error');
      return;
    }
    
    if (!formData.currentPassword.trim()) {
      setMessage('Mevcut şifre zorunludur');
      setMessageType('error');
      return;
    }
    
    if (!formData.password.trim()) {
      setMessage('Yeni şifre zorunludur');
      setMessageType('error');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setMessage('Yeni şifreler eşleşmiyor');
      setMessageType('error');
      return;
    }
    
    if (formData.password.length < 3) {
      setMessage('Şifre en az 3 karakter olmalıdır');
      setMessageType('error');
      return;
    }

    try {
      setLoading(true);
      const response = await ApiService.updateAdminCredentials(
        formData.username,
        formData.password,
        formData.currentPassword
      );
      
      if (response.success) {
        setMessage('Admin bilgileri başarıyla güncellendi');
        setMessageType('success');
        
        // Clear password fields
        setFormData(prev => ({
          ...prev,
          password: '',
          confirmPassword: '',
          currentPassword: ''
        }));
        
        // Refresh admin info
        await fetchAdminInfo();
      } else {
        setMessage(response.message || 'Güncelleme sırasında hata oluştu');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error updating admin info:', error);
      setMessage('Admin bilgileri güncellenirken hata oluştu');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  if (loadingInfo) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-2 text-gray-600">Admin bilgileri yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Admin Info */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Mevcut Admin Bilgileri</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Kullanıcı Adı</label>
            <p className="text-sm text-gray-900 font-medium">{adminInfo.username}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Oluşturulma Tarihi</label>
            <p className="text-sm text-gray-900">
              {adminInfo.created_at ? new Date(adminInfo.created_at).toLocaleDateString('tr-TR') : '-'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Son Güncelleme</label>
            <p className="text-sm text-gray-900">
              {adminInfo.updated_at ? new Date(adminInfo.updated_at).toLocaleDateString('tr-TR') : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Update Form */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Admin Bilgilerini Güncelle</h3>
        
        {message && (
          <div className={`mb-4 p-3 rounded-lg shadow-sm ${
            messageType === 'success' 
              ? 'bg-green-100 text-green-700 border border-green-200' 
              : 'bg-red-100 text-red-700 border border-red-200'
          }`}>
            {message}
          </div>
        )}
        
        <form onSubmit={handleUpdateAdminInfo} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kullanıcı Adı
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition duration-200"
              placeholder="Yeni kullanıcı adı"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mevcut Şifre
            </label>
            <input
              type="password"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition duration-200"
              placeholder="Mevcut şifrenizi girin"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Yeni Şifre
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition duration-200"
              placeholder="Yeni şifre (en az 3 karakter)"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Yeni Şifre (Tekrar)
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition duration-200"
              placeholder="Yeni şifreyi tekrar girin"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 disabled:from-gray-400 disabled:to-gray-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Güncelleniyor...
              </div>
            ) : (
              'Güncelle'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminSettings;