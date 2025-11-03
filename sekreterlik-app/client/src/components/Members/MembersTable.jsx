import React from 'react';
import ShowMemberButton from './ShowMemberButton';
import EditMemberButton from './EditMemberButton';
import ArchiveMemberButton from './ArchiveMemberButton';
import EmptyMembersState from './EmptyMembersState';
import MemberAvatar from './MemberAvatar';
import AttendanceProgressBar from './AttendanceProgressBar';
import MemberActions from './MemberActions';
import RegionBadge from './RegionBadge';
import SortableHeader from './SortableHeader';
import MemberInfo from './MemberInfo';
import { calculateMemberRegistrations } from './membersUtils';

const MembersTable = ({ 
  members, 
  meetings, 
  memberRegistrations,
  calculateMeetingStats, 
  getAttendanceColor, 
  onShowMember, 
  onEditMember, 
  onArchiveMember,
  onAddRegistration,
  onShowRegistrations,
  onSort,
  sortConfig,
  getSortIndicator,
  searchTerm,
  selectedRegion
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
      <div className="overflow-x-auto table-responsive">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50 hidden md:table-header-group sticky top-0 z-10">
            <tr>
              <SortableHeader 
                onSort={onSort} 
                sortKey="name" 
                sortConfig={sortConfig} 
                getSortIndicator={getSortIndicator}
                className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                Üye
              </SortableHeader>
              <SortableHeader 
                onSort={onSort} 
                sortKey="region" 
                sortConfig={sortConfig} 
                getSortIndicator={getSortIndicator}
                className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                Bölge
              </SortableHeader>
              <SortableHeader 
                onSort={onSort} 
                sortKey="position" 
                sortConfig={sortConfig} 
                getSortIndicator={getSortIndicator}
                className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                Görev
              </SortableHeader>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Telefon
              </th>
              <SortableHeader 
                onSort={onSort} 
                sortKey="totalMeetings" 
                sortConfig={sortConfig} 
                getSortIndicator={getSortIndicator}
                className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                Toplantı
              </SortableHeader>
              <SortableHeader 
                onSort={onSort} 
                sortKey="attendedMeetings" 
                sortConfig={sortConfig} 
                getSortIndicator={getSortIndicator}
                className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                Katıldığı
              </SortableHeader>
              <SortableHeader 
                onSort={onSort} 
                sortKey="excusedMeetings" 
                sortConfig={sortConfig} 
                getSortIndicator={getSortIndicator}
                className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                Mazeretli
              </SortableHeader>
              <SortableHeader 
                onSort={onSort} 
                sortKey="attendancePercentage" 
                sortConfig={sortConfig} 
                getSortIndicator={getSortIndicator}
                className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                Katılım %
              </SortableHeader>
              <SortableHeader 
                onSort={onSort} 
                sortKey="registrations" 
                sortConfig={sortConfig} 
                getSortIndicator={getSortIndicator}
                className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                Kaydettiği
              </SortableHeader>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100 hidden md:table-row-group">
            {members
              .map((member) => {
                const stats = calculateMeetingStats(member, meetings);
                const registrations = calculateMemberRegistrations(member.id, memberRegistrations);
                return (
                  <tr key={member.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-3 py-3">
                      <div className="flex items-center">
                        {member.photo ? (
                          <img
                            src={`http://localhost:5000${member.photo}`}
                            alt={member.name}
                            loading="lazy"
                            className="flex-shrink-0 h-8 w-8 rounded-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center ${member.photo ? 'hidden' : ''}`}>
                          <span className="text-indigo-800 text-xs font-medium">
                            {member.name.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-2">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                            {member.name}
                          </div>
                          <div className="text-xs text-gray-500 truncate max-w-[120px]">
                            {member.tc}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {member.region}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500 truncate max-w-[100px]">
                      {member.position}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                      {member.phone}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                      {stats.totalMeetings}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                      {stats.attendedMeetings}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                      {stats.excusedMeetings}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5 mr-2">
                          <div 
                            className={`h-1.5 rounded-full ${stats.attendancePercentage > 70 ? 'bg-green-500' : stats.attendancePercentage > 40 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                            style={{ width: `${stats.attendancePercentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">{stats.attendancePercentage}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm">
                      <button
                        className="text-indigo-600 hover:text-indigo-800 underline"
                        onClick={() => onShowRegistrations && onShowRegistrations(member.id)}
                        title="Kayıt geçmişini görüntüle"
                      >
                        {registrations}
                      </button>
                    </td>
                    <td className="px-3 py-3 text-sm font-medium">
                      <div className="flex space-x-1">
                        <ShowMemberButton onClick={() => onShowMember(member.id)} />
                        <EditMemberButton onClick={() => onEditMember(member.id)} />
                        <ArchiveMemberButton onClick={() => onArchiveMember(member.id)} />
                        {onAddRegistration && (
                          <button
                            onClick={() => onAddRegistration(member.id)}
                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs rounded-md text-white bg-green-600 hover:bg-green-700"
                            title="Üye Kaydı Ekle"
                          >
                            Kayıt Ekle
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            {members.length === 0 && (
              <EmptyMembersState />
            )}
          </tbody>
        </table>
      </div>
      
      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-4 p-4">
        {members.map((member) => {
          const stats = calculateMeetingStats(member, meetings);
          const registrations = calculateMemberRegistrations(member.id, memberRegistrations);
          return (
            <div key={member.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  {member.photo ? (
                    <img
                      src={`http://localhost:5000${member.photo}`}
                      alt={member.name}
                      loading="lazy"
                      className="flex-shrink-0 h-10 w-10 rounded-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className={`flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center ${member.photo ? 'hidden' : ''}`}>
                    <span className="text-indigo-800 text-sm font-medium">
                      {member.name.charAt(0)}
                    </span>
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">
                      {member.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {member.tc}
                    </div>
                  </div>
                </div>
                <MemberActions
                  onShowMember={() => onShowMember(member)}
                  onEditMember={() => onEditMember(member)}
                  onArchiveMember={() => onArchiveMember(member)}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Bölge:</span>
                  <RegionBadge region={member.region} />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Görev:</span>
                  <span className="text-gray-900">{member.position || 'Belirtilmemiş'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Telefon:</span>
                  <span className="text-gray-900">{member.phone || 'Belirtilmemiş'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Katılım:</span>
                  <AttendanceProgressBar 
                    attended={stats.attendedMeetings} 
                    total={stats.totalMeetings} 
                    percentage={stats.attendancePercentage}
                  />
                </div>
              </div>
            </div>
          );
        })}
        {members.length === 0 && (
          <EmptyMembersState variant="card" />
        )}
      </div>
    </div>
  );
};

export default MembersTable;