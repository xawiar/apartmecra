import React, { useState, useEffect } from 'react';
import ApiService from '../utils/ApiService';

const AttendanceUpdate = ({ meeting, event, members, onClose, onAttendanceUpdated }) => {
  const [attendance, setAttendance] = useState({});

  // Function to get member name by ID
  const getMemberName = (memberId) => {
    const member = members?.find(m => m.id === memberId);
    return member ? member.name : `Üye ${memberId}`;
  };

  useEffect(() => {
    const data = meeting || event;
    if (data && data.attendees) {
      const initialAttendance = {};
      data.attendees.forEach(att => {
        initialAttendance[att.memberId] = {
          attended: att.attended,
          hasExcuse: att.excuse ? att.excuse.hasExcuse : false,
          excuseReason: att.excuse ? att.excuse.reason : ''
        };
      });
      setAttendance(initialAttendance);
    }
  }, [meeting, event]);

  const handleAttendanceChange = (memberId, status) => {
    // status can be 'attended', 'notAttended', or 'excused'
    setAttendance(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        attended: status === 'attended',
        hasExcuse: status === 'excused',
        excuseReason: status === 'excused' ? prev[memberId].excuseReason : ''
      }
    }));
  };

  const handleExcuseReasonChange = (memberId, reason) => {
    setAttendance(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        excuseReason: reason
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const data = meeting || event;
      const isEvent = !!event;
      
      // Prepare updated attendees data
      const updatedAttendees = data.attendees.map(att => {
        const memberId = att.memberId;
        const attData = attendance[memberId];
        
        if (attData) {
          return {
            memberId: memberId,
            attended: attData.attended && !attData.hasExcuse,
            excuse: attData.hasExcuse ? {
              hasExcuse: true,
              reason: attData.excuseReason
            } : {
              hasExcuse: false,
              reason: ''
            }
          };
        }
        return att;
      });
      
      // Update the meeting or event
      if (isEvent) {
        await ApiService.updateEvent(event.id, {
          ...event,
          attendees: updatedAttendees
        });
      } else {
        await ApiService.updateMeeting(meeting.id, {
          ...meeting,
          attendees: updatedAttendees
        });
      }
      
      onAttendanceUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating attendance:', error);
      alert('Yoklama güncellenirken bir hata oluştu');
    }
  };

  const getAttendanceStatus = (memberId) => {
    const att = attendance[memberId];
    if (!att) return 'notAttended';
    if (att.hasExcuse) return 'excused';
    return att.attended ? 'attended' : 'notAttended';
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit}>
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Yoklama Güncelle</h3>
          <div className="border rounded-md max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Üye
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Katılım
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(meeting || event)?.attendees
                  ?.sort((a, b) => {
                    const nameA = getMemberName(a.memberId);
                    const nameB = getMemberName(b.memberId);
                    return nameA.localeCompare(nameB, 'tr', { sensitivity: 'base' });
                  })
                  ?.map(attendanceRecord => (
                  <tr key={attendanceRecord.memberId}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      {getMemberName(attendanceRecord.memberId)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      <div className="space-y-2">
                        <div className="flex space-x-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`attendance-${attendanceRecord.memberId}`}
                              checked={getAttendanceStatus(attendanceRecord.memberId) === 'attended'}
                              onChange={() => handleAttendanceChange(attendanceRecord.memberId, 'attended')}
                              className="mr-1"
                            />
                            <span>Katıldı</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`attendance-${attendanceRecord.memberId}`}
                              checked={getAttendanceStatus(attendanceRecord.memberId) === 'notAttended'}
                              onChange={() => handleAttendanceChange(attendanceRecord.memberId, 'notAttended')}
                              className="mr-1"
                            />
                            <span>Katılmadı</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`attendance-${attendanceRecord.memberId}`}
                              checked={getAttendanceStatus(attendanceRecord.memberId) === 'excused'}
                              onChange={() => handleAttendanceChange(attendanceRecord.memberId, 'excused')}
                              className="mr-1"
                            />
                            <span>Mazeretli</span>
                          </label>
                        </div>
                        {getAttendanceStatus(attendanceRecord.memberId) === 'excused' && (
                          <div className="mt-2">
                            <input
                              type="text"
                              value={attendance[attendanceRecord.memberId]?.excuseReason || ''}
                              onChange={(e) => handleExcuseReasonChange(attendanceRecord.memberId, e.target.value)}
                              placeholder="Mazeret sebebi"
                              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                            />
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            Yoklamayı Güncelle
          </button>
        </div>
      </form>
    </div>
  );
};

export default AttendanceUpdate;