import React, { useState, useEffect } from 'react';

const MeetingForm = ({ meeting, regions, onClose, onMeetingSaved }) => {
  const [formData, setFormData] = useState({
    name: '',
    regions: [],
    notes: '',
    date: ''
  });

  useEffect(() => {
    if (meeting) {
      setFormData({
        name: meeting.name || '',
        regions: meeting.regions || [],
        notes: meeting.notes || '',
        date: meeting.date || ''
      });
    }
  }, [meeting]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegionChange = (regionName) => {
    setFormData(prev => {
      if (prev.regions.includes(regionName)) {
        return {
          ...prev,
          regions: prev.regions.filter(r => r !== regionName)
        };
      } else {
        return {
          ...prev,
          regions: [...prev.regions, regionName]
        };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.date || formData.regions.length === 0) {
      alert('Toplantı adı, tarih ve en az bir bölge zorunludur');
      return;
    }
    
    try {
      // In a real implementation, you would call the API service here
      // For now, we'll just simulate the save operation
      console.log('Saving meeting:', formData);
      
      onMeetingSaved();
      onClose();
    } catch (error) {
      console.error('Error saving meeting:', error);
      alert('Toplantı kaydedilirken bir hata oluştu');
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Toplantı Adı
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="Toplantı adı"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bölgeler
            </label>
            <div className="grid grid-cols-2 gap-2">
              {regions.map(region => (
                <label key={region.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.regions.includes(region.name)}
                    onChange={() => handleRegionChange(region.name)}
                    className="mr-2"
                  />
                  <span className="text-sm">{region.name}</span>
                </label>
              ))}
            </div>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notlar
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="Toplantı notları"
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            İptal
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700"
          >
            {meeting ? 'Toplantıyı Güncelle' : 'Toplantıyı Kaydet'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MeetingForm;