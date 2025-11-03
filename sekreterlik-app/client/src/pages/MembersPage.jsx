import React, { useState, useEffect } from 'react';
import ApiService from '../utils/ApiService';
import Modal from '../components/Modal';
import MemberDetails from '../components/MemberDetails';
import MemberForm from '../components/MemberForm';
import MemberRegistrationForm from '../components/MemberRegistrationForm';
import MembersHeader from '../components/Members/MembersHeader';
import SummaryStatistics from '../components/Members/SummaryStatistics';
import MembersOperationsMenu from '../components/Members/MembersOperationsMenu';
import MembersTable from '../components/Members/MembersTable';
import { calculateMeetingStats, getAttendanceColor, calculateSummaryStats, calculateMemberRegistrations } from '../components/Members/membersUtils';
import LoadingState from '../components/Members/LoadingState';

const MembersPage = () => {
  const [members, setMembers] = useState([]);
  
  const [allMembers, setAllMembers] = useState([]); // Store all members for filtering
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [isRegistrationHistoryOpen, setIsRegistrationHistoryOpen] = useState(false);
  const [editingRegistration, setEditingRegistration] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [events, setEvents] = useState([]);
  const [memberRegistrations, setMemberRegistrations] = useState([]);
  const [regions, setRegions] = useState([]);
  const [positions, setPositions] = useState([]);
  const [formMode, setFormMode] = useState('create'); // 'create' or 'edit'
  const [searchTerm, setSearchTerm] = useState(''); // For member search
  const [selectedRegion, setSelectedRegion] = useState(''); // For region filtering
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' }); // For sorting - default to name A-Z
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [filteredMembers, setFilteredMembers] = useState([]); // For filtered and sorted members

  useEffect(() => {
    fetchMembers();
    fetchMeetings();
    fetchEvents();
    fetchMemberRegistrations();
    fetchRegionsAndPositions();
  }, []);

  // Listen for region and position updates
  useEffect(() => {
    const handleRegionUpdate = () => {
      console.log('Region updated, refreshing members...');
      fetchMembers();
    };

    const handlePositionUpdate = () => {
      console.log('Position updated, refreshing members...');
      fetchMembers();
    };

    window.addEventListener('regionUpdated', handleRegionUpdate);
    window.addEventListener('positionUpdated', handlePositionUpdate);

    return () => {
      window.removeEventListener('regionUpdated', handleRegionUpdate);
      window.removeEventListener('positionUpdated', handlePositionUpdate);
    };
  }, []);

  useEffect(() => {
    // Apply filtering first
    let result = allMembers.filter(member => 
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedRegion === '' || member.region === selectedRegion)
    );
    
    // Then apply sorting (always sort by name A-Z by default)
    const sortKey = sortConfig.key || 'name'; // Fallback to 'name' if no key is set
    const sortDirection = sortConfig.direction || 'asc'; // Fallback to 'asc' if no direction is set
    
    result = [...result].sort((a, b) => {
      let aValue, bValue;
      
      if (sortKey === 'attendancePercentage') {
        // Calculate attendance percentage for sorting
        const aStats = calculateMeetingStats(a, meetings);
        const bStats = calculateMeetingStats(b, meetings);
        aValue = aStats.attendancePercentage;
        bValue = bStats.attendancePercentage;
      } else if (sortKey === 'totalMeetings') {
        // Calculate total meetings for sorting
        const aStats = calculateMeetingStats(a, meetings);
        const bStats = calculateMeetingStats(b, meetings);
        aValue = aStats.totalMeetings;
        bValue = bStats.totalMeetings;
      } else if (sortKey === 'attendedMeetings') {
        // Calculate attended meetings for sorting
        const aStats = calculateMeetingStats(a, meetings);
        const bStats = calculateMeetingStats(b, meetings);
        aValue = aStats.attendedMeetings;
        bValue = bStats.attendedMeetings;
      } else if (sortKey === 'excusedMeetings') {
        // Calculate excused meetings for sorting
        const aStats = calculateMeetingStats(a, meetings);
        const bStats = calculateMeetingStats(b, meetings);
        aValue = aStats.excusedMeetings;
        bValue = bStats.excusedMeetings;
      } else if (sortKey === 'registrations') {
        // Calculate registrations for sorting
        aValue = calculateMemberRegistrations(a.id, memberRegistrations);
        bValue = calculateMemberRegistrations(b.id, memberRegistrations);
      } else {
        aValue = a[sortKey];
        bValue = b[sortKey];
      }
      
      // Handle null or undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortDirection === 'asc' ? 1 : -1;
      if (bValue == null) return sortDirection === 'asc' ? -1 : 1;
      
      // For string values, use localeCompare for proper sorting (especially for Turkish characters)
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue, 'tr-TR', { 
          sensitivity: 'base',
          numeric: true,
          caseFirst: 'lower'
        });
        return sortDirection === 'asc' ? comparison : -comparison;
      }
      
      // For numeric values
      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
    
    setFilteredMembers(result);
  }, [allMembers, searchTerm, selectedRegion, sortConfig, meetings, memberRegistrations]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const resp = await ApiService.getMembers(false);
      const data = Array.isArray(resp) ? resp : (resp.data || []);
      setMembers(data);
      setAllMembers(data);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMeetings = async () => {
    try {
      const data = await ApiService.getMeetings();
      setMeetings(data);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      const data = await ApiService.getEvents();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchMemberRegistrations = async () => {
    try {
      const data = await ApiService.getMemberRegistrations();
      setMemberRegistrations(data);
    } catch (error) {
      console.error('Error fetching member registrations:', error);
    }
  };

  const fetchRegionsAndPositions = async () => {
    try {
      const [regionsData, positionsData] = await Promise.all([
        ApiService.getRegions(),
        ApiService.getPositions()
      ]);
      setRegions(regionsData);
      setPositions(positionsData);
    } catch (error) {
      console.error('Error fetching regions and positions:', error);
    }
  };

  // Function to calculate summary statistics
  const summaryStats = calculateSummaryStats(allMembers || [], meetings || []);

  const handleAddMember = () => {
    setFormMode('create');
    setSelectedMember(null);
    setIsFormModalOpen(true);
  };

  const handleEditMember = (id) => {
    const member = allMembers.find(m => m.id === id);
    if (member) {
      setFormMode('edit');
      setSelectedMember(member);
      setIsFormModalOpen(true);
    }
  };

  const handleArchiveMember = async (id) => {
    if (!window.confirm('Bu üyeyi arşivlemek istediğinize emin misiniz?')) {
      return;
    }
    
    try {
      await ApiService.archiveMember(id);
      fetchMembers(); // Refresh the list
      alert('Üye başarıyla arşivlendi');
    } catch (error) {
      console.error('Error archiving member:', error);
      alert('Üye arşivlenirken hata oluştu: ' + error.message);
    }
  };

  const handleAddMemberRegistration = (id) => {
    const member = allMembers.find(m => m.id === id);
    if (member) {
      setSelectedMember(member);
      setIsRegistrationModalOpen(true);
    }
  };

  const handleShowRegistrations = (id) => {
    const member = allMembers.find(m => m.id === id);
    if (member) {
      setSelectedMember(member);
      setIsRegistrationHistoryOpen(true);
    }
  };

  const handleEditRegistration = (reg) => {
    setEditingRegistration(reg);
  };

  const handleDeleteRegistration = async (id) => {
    if (!id) return;
    if (!window.confirm('Bu kayıt silinsin mi?')) return;
    try {
      await ApiService.deleteMemberRegistration(id);
      await fetchMemberRegistrations();
    } catch (e) {
      alert('Silinirken hata: ' + e.message);
    }
  };

  const handleShowMember = async (id) => {
    try {
      const member = await ApiService.getMemberById(id);
      setSelectedMember(member);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error('Error fetching member details:', error);
    }
  };

  const handleImportExcel = async (file) => {
    try {
      // Send the file to the server
      const result = await ApiService.importMembersFromExcel(file);
      fetchMembers(); // Refresh the list
      console.log('Members imported from Excel:', result);
      alert(`${result.count} üye başarıyla içe aktarıldı.`);
      if (result.errors && result.errors.length > 0) {
        alert('Hatalar oluştu:\n' + result.errors.join('\n'));
      }
    } catch (error) {
      console.error('Error importing members from Excel:', error);
      alert('Excel içe aktarımı sırasında bir hata oluştu: ' + error.message);
    }
  };

  const handleExportExcel = async () => {
    try {
      // Create a CSV string from the current members data
      let csvContent = "TC,İsim Soyisim,Telefon,Görev,Bölge,İlçe,Toplantı Sayısı,Katıldığı, Katılım %\n";
      
      filteredMembers.forEach(member => {
        const stats = calculateMeetingStats(member, meetings);
        csvContent += `${member.tc},${member.name},${member.phone},${member.position},${member.region},${member.district},${stats.totalMeetings},${stats.attendedMeetings},${stats.attendancePercentage}%\n`;
      });
      
      // Create a Blob with the CSV content
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Create a download link
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'uyeler.csv');
      link.style.visibility = 'hidden';
      
      // Append to the document, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('Members exported to Excel');
    } catch (error) {
      console.error('Error exporting members to Excel:', error);
      alert('Excel dışa aktarımı sırasında bir hata oluştu');
    }
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedMember(null);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setSelectedMember(null);
  };

  const handleMemberSaved = () => {
    fetchMembers(); // Refresh the members list
    closeFormModal();
  };

  // Function to handle sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Function to get sort indicator
  const getSortIndicator = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'asc' ? '↑' : '↓';
    }
    return null;
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="py-6">
      <MembersHeader onAddMember={handleAddMember} />
      <SummaryStatistics summaryStats={summaryStats} />
      <MembersOperationsMenu 
        onViewModeChange={setViewMode}
        viewMode={viewMode}
        onImportExcel={handleImportExcel}
        onExportExcel={handleExportExcel}
        onAddMember={handleAddMember}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedRegion={selectedRegion}
        regions={regions}
        onRegionChange={setSelectedRegion}
      />
      <MembersTable 
        members={filteredMembers}
        meetings={meetings}
        memberRegistrations={memberRegistrations}
        calculateMeetingStats={calculateMeetingStats}
        getAttendanceColor={getAttendanceColor}
        onShowMember={handleShowMember}
        onEditMember={handleEditMember}
        onArchiveMember={handleArchiveMember}
        onAddRegistration={handleAddMemberRegistration}
        onShowRegistrations={handleShowRegistrations}
        onSort={handleSort}
        sortConfig={sortConfig}
        getSortIndicator={getSortIndicator}
        searchTerm={searchTerm}
        selectedRegion={selectedRegion}
      />

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-500">Kayıt: {filteredMembers.length}</div>
        <div />
      </div>
      
      <Modal
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        title={selectedMember ? selectedMember.name : "Üye Detayları"}
      >
        {selectedMember && (
          <MemberDetails 
            member={selectedMember} 
            meetings={meetings} 
            events={events}
            memberRegistrations={memberRegistrations}
            calculateMeetingStats={calculateMeetingStats}
          />
        )}
      </Modal>

      <Modal
        isOpen={isFormModalOpen}
        onClose={closeFormModal}
        title={formMode === 'edit' ? "Üyeyi Düzenle" : "Yeni Üye Ekle"}
      >
        <MemberForm
          member={selectedMember}
          regions={regions}
          positions={positions}
          onClose={closeFormModal}
          onMemberSaved={handleMemberSaved}
        />
      </Modal>

      <Modal
        isOpen={isRegistrationModalOpen}
        onClose={() => { setIsRegistrationModalOpen(false); setSelectedMember(null); }}
        title={selectedMember ? `${selectedMember.name} - Üye Kaydı Ekle` : 'Üye Kaydı Ekle'}
      >
        {selectedMember && (
          <MemberRegistrationForm
            member={selectedMember}
            onClose={() => { setIsRegistrationModalOpen(false); setSelectedMember(null); }}
            onRegistrationSaved={async () => {
              await fetchMemberRegistrations();
              setIsRegistrationModalOpen(false);
              setSelectedMember(null);
            }}
          />
        )}
      </Modal>

      <Modal
        isOpen={isRegistrationHistoryOpen}
        onClose={() => { setIsRegistrationHistoryOpen(false); setSelectedMember(null); setEditingRegistration(null); }}
        title={selectedMember ? `${selectedMember.name} - Kayıt Geçmişi` : 'Kayıt Geçmişi'}
      >
        {selectedMember && (
          <div className="space-y-4">
            {editingRegistration ? (
              <MemberRegistrationForm
                member={selectedMember}
                initialData={editingRegistration}
                onClose={() => setEditingRegistration(null)}
                onRegistrationSaved={async () => {
                  await fetchMemberRegistrations();
                  setEditingRegistration(null);
                }}
              />
            ) : null}

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tarih</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Adet</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {memberRegistrations
                    .filter(r => r.memberId === selectedMember.id)
                    .sort((a,b) => (a.date < b.date ? 1 : -1))
                    .map(reg => (
                      <tr key={reg.id || `${reg.memberId}-${reg.date}`}>
                        <td className="px-4 py-2 text-sm text-gray-700">{reg.date}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{reg.count}</td>
                        <td className="px-4 py-2 text-sm font-medium space-x-2">
                          <button
                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                            onClick={() => handleEditRegistration(reg)}
                          >
                            Düzenle
                          </button>
                          {reg.id && (
                            <button
                              className="inline-flex items-center px-2 py-1 border border-transparent text-xs rounded-md text-white bg-red-600 hover:bg-red-700"
                              onClick={() => handleDeleteRegistration(reg.id)}
                            >
                              Sil
                            </button>
                          )}
                        </td>
                      </tr>
                  ))}
                  {memberRegistrations.filter(r => r.memberId === selectedMember.id).length === 0 && (
                    <tr>
                      <td colSpan="3" className="px-4 py-6 text-center text-sm text-gray-500">Kayıt bulunamadı.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MembersPage;