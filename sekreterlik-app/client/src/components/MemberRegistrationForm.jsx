import React, { useState, useEffect } from 'react';
import ApiService from '../utils/ApiService';

const MemberRegistrationForm = ({ member, initialData, onClose, onRegistrationSaved }) => {
  const [formData, setFormData] = useState({
    count: '',
    date: new Date().toISOString().split('T')[0] // Default to today's date
  });
  const [error, setError] = useState(''); // Add state for error messages

  useEffect(() => {
    // If initialData is provided, populate the form with it
    if (initialData) {
      setFormData({
        count: initialData.count,
        date: initialData.date
      });
    }
  }, [initialData]);

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

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.count || formData.count <= 0) {
      newErrors.count = 'Üye sayısı 0\'dan büyük olmalıdır';
    }
    
    if (!formData.date) {
      newErrors.date = 'Tarih alanı zorunludur';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setError(Object.values(errors)[0]); // Show the first error
      return;
    }
    
    if (!member) {
      setError('Üye bilgisi eksik');
      return;
    }
    
    try {
      // Prepare the data to send to the server
      const registrationData = {
        memberId: member.id,
        count: parseInt(formData.count),
        date: formData.date
      };
      
      console.log('Sending registration data:', registrationData);
      
      let response;
      // If we're editing an existing registration, update it; otherwise create new
      if (initialData && initialData.id) {
        // Update existing registration
        console.log('Updating existing registration with ID:', initialData.id, '(type:', typeof initialData.id, ')');
        response = await ApiService.updateMemberRegistration(initialData.id, registrationData);
      } else {
        // Create new registration
        console.log('Creating new registration');
        response = await ApiService.createMemberRegistration(registrationData);
      }
      
      console.log('Registration saved successfully', response);
      
      // Clear any previous errors
      setError('');
      
      // Call the parent callback to notify that registration was saved
      if (onRegistrationSaved) {
        onRegistrationSaved();
      }
    } catch (error) {
      console.error('Error saving member registration:', error);
      // Try to get more detailed error information
      let errorMessage = 'Üye kaydı kaydedilirken bir hata oluştu';
      if (error.message) {
        errorMessage += ': ' + error.message;
      }
      setError(errorMessage);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                {error}
              </h3>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Üye Sayısı
          </label>
          <input
            type="number"
            name="count"
            value={formData.count}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition duration-200"
            min="1"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tarih
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition duration-200"
          />
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-200"
          >
            İptal
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-700 border border-transparent rounded-lg text-sm font-medium text-white hover:from-indigo-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-md transition duration-200"
          >
            {initialData ? 'Güncelle' : 'Kaydet'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MemberRegistrationForm;