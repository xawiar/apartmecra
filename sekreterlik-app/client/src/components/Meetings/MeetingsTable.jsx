import React from 'react';
import RegionBadge from '../Members/RegionBadge';

const MeetingsTable = ({ 
  meetings, 
  searchTerm, 
  sortConfig, 
  handleSort, 
  handleShowMeeting, 
  handleEditMeeting, 
  handleArchiveMeeting,
  handleUpdateAttendance,
  calculateAttendanceStats,
  getAttendanceColor
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-100">
        <thead className="bg-gray-50">
          <tr>
            <th 
              className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
              onClick={() => handleSort('name')}
            >
              <div className="flex items-center">
                Toplantı Adı
                {sortConfig.key === 'name' && (
                  <span className="ml-1 text-indigo-600">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                )}
              </div>
            </th>
            <th 
              className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200 hidden md:table-cell"
              onClick={() => handleSort('date')}
            >
              <div className="flex items-center">
                Tarih
                {sortConfig.key === 'date' && (
                  <span className="ml-1 text-indigo-600">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                )}
              </div>
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
              Bölge
            </th>
            <th 
              className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell cursor-pointer hover:bg-gray-100 transition-colors duration-200"
              onClick={() => handleSort('totalExpected')}
            >
              <div className="flex items-center">
                Katılması Gereken
                {sortConfig.key === 'totalExpected' && (
                  <span className="ml-1 text-indigo-600">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                )}
              </div>
            </th>
            <th 
              className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell cursor-pointer hover:bg-gray-100 transition-colors duration-200"
              onClick={() => handleSort('attendedCount')}
            >
              <div className="flex items-center">
                Katılan
                {sortConfig.key === 'attendedCount' && (
                  <span className="ml-1 text-indigo-600">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                )}
              </div>
            </th>
            <th 
              className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
              onClick={() => handleSort('attendancePercentage')}
            >
              <div className="flex items-center">
                Katılım %
                {sortConfig.key === 'attendancePercentage' && (
                  <span className="ml-1 text-indigo-600">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                )}
              </div>
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              İşlemler
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {meetings
            .filter(meeting => 
              meeting.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              meeting.date.includes(searchTerm)
            )
            .map((meeting) => {
              const stats = calculateAttendanceStats(meeting);
              return (
                <tr key={meeting.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{meeting.name}</div>
                    <div className="text-sm text-gray-500 md:hidden mt-1">{meeting.date}</div>
                    <div className="flex flex-wrap gap-1 mt-2 md:hidden">
                      {meeting.regions.slice(0, 2).map((region, index) => (
                        <RegionBadge key={index} region={region} />
                      ))}
                      {meeting.regions.length > 2 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          +{meeting.regions.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 hidden md:table-cell">
                    {meeting.date}
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {meeting.regions.slice(0, 2).map((region, index) => (
                        <RegionBadge key={index} region={region} />
                      ))}
                      {meeting.regions.length > 2 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          +{meeting.regions.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 hidden lg:table-cell">
                    {stats.totalExpected}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 hidden lg:table-cell">
                    {stats.attendedCount}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                        <div 
                          className={`h-2 rounded-full ${getAttendanceColor(stats.attendancePercentage)}`} 
                          style={{ width: `${stats.attendancePercentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-700">{stats.attendancePercentage}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleShowMeeting(meeting.id)}
                        className="text-indigo-600 hover:text-indigo-900 transition-colors p-1 rounded-full hover:bg-indigo-50"
                        title="Göster"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleUpdateAttendance(meeting.id)}
                        className="text-green-600 hover:text-green-900 transition-colors p-1 rounded-full hover:bg-green-50"
                        title="Yoklama Güncelle"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleEditMeeting(meeting.id)}
                        className="text-blue-600 hover:text-blue-900 transition-colors p-1 rounded-full hover:bg-blue-50"
                        title="Düzenle"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleArchiveMeeting(meeting.id)}
                        className="text-amber-600 hover:text-amber-900 transition-colors p-1 rounded-full hover:bg-amber-50"
                        title="Arşivle"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          {meetings.filter(meeting => 
            meeting.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            meeting.date.includes(searchTerm)
          ).length === 0 && (
            <tr>
              <td colSpan="7" className="px-6 py-12 text-center">
                <div className="flex flex-col items-center justify-center">
                  <div className="bg-gray-100 rounded-full p-4 inline-block">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mt-4">Kayıt bulunamadı</h3>
                  <p className="text-gray-500 mt-1">Henüz toplantı eklenmemiş veya filtreleme sonucu bulunamadı</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default MeetingsTable;