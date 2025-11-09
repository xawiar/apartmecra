import React, { useState, useEffect } from 'react';
import ApiService from '../utils/ApiService';

const STKSettings = () => {
  const [stks, setStks] = useState([]);
  const [visitCounts, setVisitCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSTK, setEditingSTK] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  useEffect(() => {
    fetchSTKs();
    fetchVisitCounts();
  }, []);

  const fetchSTKs = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getSTKs();
      setStks(data);
    } catch (error) {
      console.error('Error fetching STKs:', error);
      setMessage('STK\'lar yüklenirken hata oluştu');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const fetchVisitCounts = async () => {
    try {
      const data = await ApiService.getAllVisitCounts('stk');
      const counts = {};
      data.forEach(visit => {
        counts[visit.stk_id] = visit.visit_count;
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setMessage('STK adı gereklidir');
      setMessageType('error');
      return;
    }

    try {
      if (editingSTK) {
        await ApiService.updateSTK(editingSTK.id, formData);
        setMessage('STK başarıyla güncellendi');
      } else {
        await ApiService.createSTK(formData);
        setMessage('STK başarıyla eklendi');
      }
      
      setMessageType('success');
      setFormData({ name: '', description: '' });
      setEditingSTK(null);
      setShowForm(false);
      fetchSTKs();
    } catch (error) {
      console.error('Error saving STK:', error);
      setMessage(error.message || 'STK kaydedilirken hata oluştu');
      setMessageType('error');
    }
  };

  const handleEdit = (stk) => {
    setEditingSTK(stk);
    setFormData({ name: stk.name, description: stk.description || '' });
    setShowForm(true);
  };

  const handleDelete = async (stk) => {
    if (!window.confirm(`"${stk.name}" STK'sını silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      await ApiService.deleteSTK(stk.id);
      setMessage('STK başarıyla silindi');
      setMessageType('success');
      fetchSTKs();
    } catch (error) {
      console.error('Error deleting STK:', error);
      setMessage(error.message || 'STK silinirken hata oluştu');
      setMessageType('error');
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', description: '' });
    setEditingSTK(null);
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
          <h2 className="text-xl font-semibold text-gray-900">STK Yönetimi</h2>
          <p className="text-sm text-gray-600">STK ekleyin, düzenleyin veya silin</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors duration-200"
        >
          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Yeni STK Ekle
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
            {editingSTK ? 'STK Düzenle' : 'Yeni STK Ekle'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                STK Adı *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="STK adını girin"
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Açıklama
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="STK açıklamasını girin (isteğe bağlı)"
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors duration-200"
              >
                {editingSTK ? 'Güncelle' : 'Ekle'}
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

      {/* STKs List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Mevcut STK'lar</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {stks.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p className="mt-2">Henüz STK eklenmemiş</p>
            </div>
          ) : (
            stks.map((stk) => (
              <div key={stk.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-1">
                    <h4 className="text-sm font-medium text-gray-900">{stk.name}</h4>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {visitCounts[stk.id] || 0} ziyaret
                    </span>
                  </div>
                  {stk.description && (
                    <p className="text-sm text-gray-500 mt-1">{stk.description}</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(stk)}
                    className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-lg transition-colors duration-200"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(stk)}
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

export default STKSettings;
