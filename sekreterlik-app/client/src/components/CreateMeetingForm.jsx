import React, { useState, useEffect } from 'react';
import ApiService from '../utils/ApiService';
import { formatMemberName } from '../utils/nameFormatter';

const CreateMeetingForm = ({ regions, onClose, onMeetingCreated }) => {
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [meetingName, setMeetingName] = useState('');
  const [meetingNotes, setMeetingNotes] = useState('');
  const [members, setMembers] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [excuse, setExcuse] = useState({});
  const [excuseReasons, setExcuseReasons] = useState({}); // Added state for excuse reasons
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedRegions.length > 0) {
      fetchMembersByRegions();
    } else {
      setMembers([]);
      setAttendance({});
    }
  }, [selectedRegions]);

  const fetchMembersByRegions = async () => {
    try {
      setLoading(true);
      // In a real implementation, you would filter members by regions on the server
      const allMembers = await ApiService.getMembers();
      const filteredMembers = allMembers.filter(member => 
        selectedRegions.includes(member.region)
      );
      
      // Sort members alphabetically by name (A to Z)
      const sortedMembers = [...filteredMembers].sort((a, b) => {
        return a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' });
      });
      
      setMembers(sortedMembers);
      
      // Initialize attendance state
      const initialAttendance = {};
      sortedMembers.forEach(member => {
        initialAttendance[member.id] = true; // Default to attended
      });
      setAttendance(initialAttendance);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegionChange = (regionName) => {
    setSelectedRegions(prev => {
      if (prev.includes(regionName)) {
        return prev.filter(r => r !== regionName);
      } else {
        return [...prev, regionName];
      }
    });
  };

  const handleAttendanceChange = (memberId, attended) => {
    setAttendance(prev => ({
      ...prev,
      [memberId]: attended
    }));
    
    // Reset excuse status when attendance is changed
    setExcuse(prev => ({
      ...prev,
      [memberId]: false
    }));
  };

  const handleExcuseChange = (memberId, excused) => {
    setExcuse(prev => ({
      ...prev,
      [memberId]: excused
    }));
    
    // Reset attendance status when excuse is changed
    setAttendance(prev => ({
      ...prev,
      [memberId]: false
    }));
  };

  // Added function to handle excuse reason changes
  const handleExcuseReasonChange = (memberId, reason) => {
    setExcuseReasons(prev => ({
      ...prev,
      [memberId]: reason
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!meetingName.trim()) {
      alert('Toplantı adı zorunludur');
      return;
    }
    
    if (selectedRegions.length === 0) {
      alert('En az bir bölge seçmelisiniz');
      return;
    }
    
    try {
      // Create meeting
      const meetingData = {
        name: meetingName,
        regions: selectedRegions,
        notes: meetingNotes,
        date: new Date().toISOString().split('T')[0], // Today's date
        attendees: members.map(member => {
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
      
      console.log('Creating meeting with data:', meetingData);
      const response = await ApiService.createMeeting(meetingData);
      console.log('Meeting created successfully:', response);
      
      // Show success message
      alert('Toplantı başarıyla oluşturuldu');
      
      // Call callbacks
      if (onMeetingCreated) {
        onMeetingCreated();
      }
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error creating meeting:', error);
      alert('Toplantı oluşturulurken bir hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Toplantı Adı
            </label>
            <input
              type="text"
              value={meetingName}
              onChange={(e) => setMeetingName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition duration-200"
              placeholder="Toplantı adını girin"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bölgeler
            </label>
            <div className="grid grid-cols-2 gap-2">
              {regions.map((region, idx) => (
              <label key={`${region.id ?? region.name}-${idx}`} className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 transition duration-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedRegions.includes(region.name)}
                    onChange={() => handleRegionChange(region.name)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{region.name}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Toplantı Notları
            </label>
            <textarea
              value={meetingNotes}
              onChange={(e) => setMeetingNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition duration-200"
              placeholder="Toplantı notlarını girin"
            />
          </div>
          
          {selectedRegions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Katılımcı Yoklaması
              </label>
              {loading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                </div>
              ) : members.length > 0 ? (
                <div className="border rounded-lg overflow-hidden shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200">
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
                    <tbody className="bg-white divide-y divide-gray-200">
                      {members.map(member => (
                        <tr key={member.id} className="hover:bg-gray-50 transition duration-150">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatMemberName(member.name)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex space-x-4">
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name={`attendance-${member.id}`}
                                  checked={attendance[member.id] === true}
                                  onChange={() => handleAttendanceChange(member.id, true)}
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="ml-1">Katıldı</span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name={`attendance-${member.id}`}
                                  checked={attendance[member.id] === false && !excuse[member.id]}
                                  onChange={() => handleAttendanceChange(member.id, false)}
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="ml-1">Katılmadı</span>
                              </label>
                              {/* Updated excuse option with direct selection and reason field */}
                              <div className="flex flex-col">
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    name={`attendance-${member.id}`}
                                    checked={excuse[member.id] === true}
                                    onChange={() => handleExcuseChange(member.id, true)}
                                    className="h-4 w-4 text-yellow-600 focus:ring-yellow-500"
                                  />
                                  <span className="ml-1">Mazeretli</span>
                                </label>
                                {excuse[member.id] === true && (
                                  <input
                                    type="text"
                                    placeholder="Mazeret sebebi"
                                    value={excuseReasons[member.id] || ''}
                                    onChange={(e) => handleExcuseReasonChange(member.id, e.target.value)}
                                    className="mt-1 w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500"
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
              ) : (
                <p className="text-sm text-gray-500 py-2">Seçilen bölgelerde üye bulunamadı.</p>
              )}
            </div>
          )}
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
            Toplantıyı Kaydet
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateMeetingForm;