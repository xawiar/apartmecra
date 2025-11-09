import React, { useState, useEffect } from 'react';
import ApiService from '../utils/ApiService';
import { formatMemberName } from '../utils/nameFormatter';

const MeetingForm = ({ meeting, regions, onClose, onMeetingSaved, members }) => {
  const [formData, setFormData] = useState({
    name: '',
    regions: [],
    notes: '',
    date: ''
  });
  const [attendance, setAttendance] = useState({});
  const [excuse, setExcuse] = useState({});
  const [excuseReasons, setExcuseReasons] = useState({});
  const [filteredMembers, setFilteredMembers] = useState([]);

  useEffect(() => {
    if (meeting) {
      setFormData({
        name: meeting.name || '',
        regions: meeting.regions || [],
        notes: meeting.notes || '',
        date: meeting.date || ''
      });

      // Initialize attendance data from existing meeting
      if (meeting.attendees) {
        const initialAttendance = {};
        const initialExcuse = {};
        const initialExcuseReasons = {};

        meeting.attendees.forEach(attendee => {
          const memberId = String(attendee.memberId);
          initialAttendance[memberId] = attendee.attended;
          initialExcuse[memberId] = attendee.excuse?.hasExcuse || false;
          initialExcuseReasons[memberId] = attendee.excuse?.reason || '';
        });

        setAttendance(initialAttendance);
        setExcuse(initialExcuse);
        setExcuseReasons(initialExcuseReasons);
      }
    }
  }, [meeting]);

  // Filter members by selected regions
  useEffect(() => {
    if (members && formData.regions.length > 0) {
      const filtered = members.filter(member => 
        formData.regions.includes(member.region)
      );
      const sorted = [...filtered].sort((a, b) => {
        return a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' });
      });
      setFilteredMembers(sorted);

      // Initialize attendance for new members
      const initialAttendance = { ...attendance };
      sorted.forEach(member => {
        const memberId = String(member.id);
        if (initialAttendance[memberId] === undefined) {
          initialAttendance[memberId] = true; // Default to attended
        }
      });
      setAttendance(initialAttendance);
    } else {
      setFilteredMembers([]);
    }
  }, [formData.regions, members]);

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

  const handleAttendanceChange = (memberId, attended) => {
    const stringId = String(memberId);
    setAttendance(prev => ({
      ...prev,
      [stringId]: attended
    }));
    
    // Reset excuse when attendance changes
    if (!attended) {
      setExcuse(prev => ({
        ...prev,
        [stringId]: false
      }));
      setExcuseReasons(prev => ({
        ...prev,
        [stringId]: ''
      }));
    }
  };

  const handleExcuseChange = (memberId, hasExcuse) => {
    const stringId = String(memberId);
    setExcuse(prev => ({
      ...prev,
      [stringId]: hasExcuse
    }));
    
    // If has excuse, mark as not attended
    if (hasExcuse) {
      setAttendance(prev => ({
        ...prev,
        [stringId]: false
      }));
    }
  };

  const handleExcuseReasonChange = (memberId, reason) => {
    const stringId = String(memberId);
    setExcuseReasons(prev => ({
      ...prev,
      [stringId]: reason
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.date || formData.regions.length === 0) {
      alert('Toplantı adı, tarih ve en az bir bölge zorunludur');
      return;
    }
    
    try {
      // Prepare meeting data
      const meetingData = {
        name: formData.name,
        regions: formData.regions,
        notes: formData.notes || '', // Empty string if no notes
        date: formData.date,
        attendees: filteredMembers.map(member => {
          const memberId = String(member.id);
          const attended = attendance[memberId] === true;
          const hasExcuse = excuse[memberId] === true;
          const excuseReason = excuseReasons[memberId] || '';
          
          return {
            memberId: memberId,
            attended: attended && !hasExcuse,
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
      
      console.log('Updating meeting with data:', meetingData);
      await ApiService.updateMeeting(meeting.id, meetingData);
      console.log('Meeting updated successfully');
      
      alert('Toplantı başarıyla güncellendi');
      
      if (onMeetingSaved) {
        onMeetingSaved();
      }
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error saving meeting:', error);
      alert('Toplantı kaydedilirken bir hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tarih ve Saat <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notlar
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Toplantı notları"
            />
          </div>

          {/* Attendance Section - Only show if not planned */}
          {!meeting?.isPlanned && filteredMembers.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Katılımcı Yoklaması
              </label>
              <div className="border rounded-lg overflow-hidden shadow-sm max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gradient-to-r from-indigo-500 to-purple-600">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Üye
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Katılım
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredMembers.map(member => (
                      <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          {formatMemberName(member.name)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex space-x-4">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name={`attendance-${member.id}`}
                                checked={attendance[String(member.id)] === true}
                                onChange={() => handleAttendanceChange(member.id, true)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="ml-1">Katıldı</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name={`attendance-${member.id}`}
                                checked={attendance[String(member.id)] === false && !excuse[String(member.id)]}
                                onChange={() => handleAttendanceChange(member.id, false)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="ml-1">Katılmadı</span>
                            </label>
                            <div className="flex flex-col">
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name={`attendance-${member.id}`}
                                  checked={excuse[String(member.id)] === true}
                                  onChange={() => handleExcuseChange(member.id, true)}
                                  className="h-4 w-4 text-yellow-600 focus:ring-yellow-500"
                                />
                                <span className="ml-1">Mazeretli</span>
                              </label>
                              {excuse[String(member.id)] === true && (
                                <input
                                  type="text"
                                  placeholder="Mazeret sebebi"
                                  value={excuseReasons[String(member.id)] || ''}
                                  onChange={(e) => handleExcuseReasonChange(member.id, e.target.value)}
                                  className="mt-1 w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                />
                              )}
                            </div>
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