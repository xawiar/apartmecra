import React, { useState } from 'react';
import ApiService from '../utils/ApiService';

const EventForm = ({ event, onClose, onEventSaved, members }) => {
  const [eventName, setEventName] = useState(event?.name || '');
  const [eventDate, setEventDate] = useState(event?.date || '');
  const [eventLocation, setEventLocation] = useState(event?.location || '');
  const [eventDescription, setEventDescription] = useState(event?.description || '');
  const [attendance, setAttendance] = useState({});
  const [excuse, setExcuse] = useState({});
  const [excuseReasons, setExcuseReasons] = useState({});

  // Sort members A-Z by name
  const sortedMembers = members ? [...members].sort((a, b) => {
    return a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' });
  }) : [];

  // Initialize attendance data from existing event
  React.useEffect(() => {
    if (event && event.attendees) {
      const initialAttendance = {};
      const initialExcuse = {};
      const initialExcuseReasons = {};

      event.attendees.forEach(attendee => {
        initialAttendance[attendee.memberId] = attendee.attended;
        initialExcuse[attendee.memberId] = attendee.excuse?.hasExcuse || false;
        initialExcuseReasons[attendee.memberId] = attendee.excuse?.reason || '';
      });

      setAttendance(initialAttendance);
      setExcuse(initialExcuse);
      setExcuseReasons(initialExcuseReasons);
    }
  }, [event]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!eventName.trim()) {
      alert('Etkinlik adı zorunludur');
      return;
    }
    
    if (!eventDate) {
      alert('Etkinlik tarihi zorunludur');
      return;
    }
    
    if (!eventLocation.trim()) {
      alert('Etkinlik yeri zorunludur');
      return;
    }
    
    try {
      // Prepare event data
      const eventData = {
        name: eventName,
        date: eventDate,
        location: eventLocation,
        description: eventDescription,
        attendees: sortedMembers.map(member => {
          const memberId = member.id;
          const attended = attendance[memberId] === true;
          const hasExcuse = excuse[memberId] === true;
          const excuseReason = excuseReasons[memberId] || '';
          
          return {
            memberId: parseInt(memberId),
            attended: attended && !hasExcuse, // If has excuse, not attended
            excuse: hasExcuse ? { 
              hasExcuse: true, 
              reason: excuseReason 
            } : { 
              hasExcuse: false, 
              reason: '' 
            }
          };
        })
      };
      
      console.log('Updating event with data:', eventData);
      const response = await ApiService.updateEvent(event.id, eventData);
      console.log('Event updated successfully:', response);
      
      // Show success message
      alert('Etkinlik başarıyla güncellendi');
      
      // Call callbacks
      if (onEventSaved) {
        onEventSaved();
      }
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Etkinlik güncellenirken bir hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
    }
  };

  const handleAttendanceChange = (memberId, attended) => {
    setAttendance(prev => ({
      ...prev,
      [memberId]: attended
    }));
    
    // If not attended, clear excuse
    if (!attended) {
      setExcuse(prev => ({
        ...prev,
        [memberId]: false
      }));
      setExcuseReasons(prev => ({
        ...prev,
        [memberId]: ''
      }));
    }
  };

  const handleExcuseChange = (memberId, hasExcuse) => {
    setExcuse(prev => ({
      ...prev,
      [memberId]: hasExcuse
    }));
    
    // If has excuse, mark as not attended
    if (hasExcuse) {
      setAttendance(prev => ({
        ...prev,
        [memberId]: false
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Event Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Etkinlik Adı *
          </label>
          <input
            type="text"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Örn: Cuma Gezisi"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Etkinlik Tarihi *
          </label>
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Etkinlik Yeri *
        </label>
        <input
          type="text"
          value={eventLocation}
          onChange={(e) => setEventLocation(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Örn: İstanbul Müzesi"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Açıklama
        </label>
        <textarea
          value={eventDescription}
          onChange={(e) => setEventDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Etkinlik hakkında detaylı bilgi..."
        />
      </div>

      {/* Attendance Section */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Katılım Durumu</h3>
        <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
          <div className="space-y-3">
            {sortedMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{member.name}</div>
                  <div className="text-sm text-gray-500">{member.position} - {member.region}</div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {/* Attendance Checkbox */}
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={attendance[member.id] === true}
                      onChange={(e) => handleAttendanceChange(member.id, e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Katıldı</span>
                  </label>
                  
                  {/* Excuse Checkbox */}
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={excuse[member.id] === true}
                      onChange={(e) => handleExcuseChange(member.id, e.target.checked)}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Mazeretli</span>
                  </label>
                  
                  {/* Excuse Reason */}
                  {excuse[member.id] && (
                    <input
                      type="text"
                      value={excuseReasons[member.id] || ''}
                      onChange={(e) => setExcuseReasons(prev => ({
                        ...prev,
                        [member.id]: e.target.value
                      }))}
                      placeholder="Mazeret sebebi"
                      className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
        >
          İptal
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors duration-200"
        >
          Etkinlik Güncelle
        </button>
      </div>
    </form>
  );
};

export default EventForm;
