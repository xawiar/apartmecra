import React, { useState, useEffect } from 'react';
import ApiService from '../utils/ApiService';

const MemberForm = ({ member, regions, positions, onClose, onMemberSaved }) => {
  const [formData, setFormData] = useState({
    tc: '',
    name: '',
    phone: '',
    position: '',
    region: ''
  });
  const [error, setError] = useState(''); // Add state for error messages

  useEffect(() => {
    if (member) {
      setFormData({
        tc: member.tc || '',
        name: member.name || '',
        phone: member.phone || '',
        position: member.position || '',
        region: member.region || ''
      });
    }
  }, [member]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.tc || !formData.name || !formData.phone || 
        !formData.position || !formData.region) {
      setError('Tüm alanlar zorunludur');
      return;
    }
    
    try {
      console.log('Sending member data:', formData); // Debug log
      let response;
      if (member) {
        // Update existing member
        console.log('Updating existing member with ID:', member.id); // Debug log
        response = await ApiService.updateMember(member.id, formData);
        console.log('Update response:', response); // Debug log
      } else {
        // Create new member
        console.log('Creating new member'); // Debug log
        response = await ApiService.createMember(formData);
        console.log('Create response:', response); // Debug log
      }
      
      console.log('Member saved successfully'); // Debug log
      // Clear any previous errors
      setError('');
      
      // Always close modal and refresh - use setTimeout to ensure state updates complete
      setTimeout(() => {
        // Make sure onMemberSaved is called (this also closes modal)
        if (onMemberSaved) {
          console.log('Calling onMemberSaved callback'); // Debug log
          onMemberSaved();
        } else if (onClose) {
          // Fallback to onClose if onMemberSaved not provided
          console.log('Calling onClose callback (fallback)'); // Debug log
          onClose();
        }
      }, 100);
    } catch (error) {
      console.error('Error saving member:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Handle specific error cases
      if (error.message && error.message.includes('TC kimlik numarası zaten kayıtlı')) {
        setError('Bu TC kimlik numarası zaten kayıtlı. Lütfen farklı bir TC numarası girin.');
      } else if (error.message) {
        // Display the error message with validation errors if any
        const errorMsg = error.message.replace(/\n\n/g, '\n');
        setError(errorMsg);
      } else {
        setError('Üye kaydedilirken bilinmeyen bir hata oluştu.');
      }
      // Don't close modal on error - user needs to see the error
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800 mb-1">
                {error.includes('\n') ? 'Doğrulama Hatası' : error.split('\n')[0]}
              </h3>
              {error.includes('\n') && (
                <ul className="list-disc list-inside text-sm text-red-700 mt-2 space-y-1">
                  {error.split('\n').slice(1).filter(line => line.trim()).map((line, idx) => (
                    <li key={idx}>{line.trim()}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              TC Kimlik No
            </label>
            <input
              type="text"
              name="tc"
              value={formData.tc}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
              placeholder="TC kimlik numarası"
              maxLength="11"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              İsim Soyisim
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
              placeholder="İsim soyisim"
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
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
              placeholder="Telefon numarası"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Görev
            </label>
            <select
              name="position"
              value={formData.position}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
            >
              <option value="">Görev seçin</option>
              {positions.map(position => (
                <option key={position.id} value={position.name}>
                  {position.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bölge
            </label>
            <select
              name="region"
              value={formData.region}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
            >
              <option value="">Bölge seçin</option>
              {regions.map(region => (
                <option key={region.id} value={region.name}>
                  {region.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
          >
            İptal
          </button>
          <button
            type="submit"
            className="px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
          >
            {member ? 'Güncelle' : 'Kaydet'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MemberForm;