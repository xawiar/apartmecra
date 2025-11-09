import React, { useState, useEffect } from 'react';
import ApiService from '../utils/ApiService';
import Modal from '../components/Modal';
import CreateMeetingForm from '../components/CreateMeetingForm';
import PlanMeetingForm from '../components/PlanMeetingForm';
import CreateMeetingFromMinutes from '../components/CreateMeetingFromMinutes';
import MeetingDetails from '../components/MeetingDetails';
import MeetingForm from '../components/MeetingForm';
import AttendanceUpdate from '../components/AttendanceUpdate';
import { 
  MeetingsHeader, 
  MeetingsSummaryStatistics, 
  MeetingsFilters, 
  MeetingsTable 
} from '../components/Meetings';
import { LoadingSpinner } from '../components/UI';

const MeetingsPage = () => {
  const [meetings, setMeetings] = useState([]);
  const [members, setMembers] = useState([]);
  // Removed showArchived state
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isCreateFromMinutesModalOpen, setIsCreateFromMinutesModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [regions, setRegions] = useState([]);
  const [formMode, setFormMode] = useState('create'); // 'create' or 'edit'
  const [searchTerm, setSearchTerm] = useState(''); // For meeting search
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' }); // Default sort by date, newest first

  useEffect(() => {
    fetchMeetings();
    fetchMembers();
    fetchRegions();
  }, []); // Removed showArchived from dependency array

  useEffect(() => {
    // Apply sorting
    if (sortConfig.key && meetings.length > 0) {
      const sorted = [...meetings].sort((a, b) => {
        let aValue, bValue;
        
        if (sortConfig.key === 'attendancePercentage') {
          // Calculate attendance percentage for sorting
          const aStats = calculateAttendanceStats(a);
          const bStats = calculateAttendanceStats(b);
          aValue = aStats.attendancePercentage;
          bValue = bStats.attendancePercentage;
        } else if (sortConfig.key === 'date') {
          // Convert date format for proper sorting (DD.MM.YYYY to YYYY-MM-DD)
          aValue = new Date(a.date.split('.').reverse().join('-'));
          bValue = new Date(b.date.split('.').reverse().join('-'));
        } else {
          aValue = a[sortConfig.key];
          bValue = b[sortConfig.key];
        }
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
      
      setMeetings(sorted);
    }
  }, [sortConfig]);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      // Always fetch non-archived meetings
      const data = await ApiService.getMeetings(false);
      setMeetings(data);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const data = await ApiService.getMembers();
      setMembers(data);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchRegions = async () => {
    try {
      const data = await ApiService.getRegions();
      setRegions(data);
    } catch (error) {
      console.error('Error fetching regions:', error);
    }
  };

  const handleCreateMeeting = () => {
    setIsCreateModalOpen(true);
  };

  const handlePlanMeeting = () => {
    setIsPlanModalOpen(true);
  };

  const handleEditMeeting = (id) => {
    const meeting = meetings.find(m => m.id === id);
    if (meeting) {
      setFormMode('edit');
      setSelectedMeeting(meeting);
      setIsEditModalOpen(true);
    }
  };

  const handleArchiveMeeting = async (id) => {
    if (window.confirm('Bu toplantıyı arşivlemek istediğinize emin misiniz?')) {
      try {
        await ApiService.archiveMeeting(id);
        fetchMeetings(); // Refresh the list
        alert('Toplantı başarıyla arşivlendi');
      } catch (error) {
        console.error('Error archiving meeting:', error);
        alert('Toplantı arşivlenirken hata oluştu: ' + error.message);
      }
    }
  };

  const handleShowMeeting = async (id) => {
    try {
      const meeting = await ApiService.getMeetingById(id);
      setSelectedMeeting(meeting);
      setIsDetailsModalOpen(true);
    } catch (error) {
      console.error('Error fetching meeting details:', error);
    }
  };

  const handleUpdateAttendance = async (id) => {
    try {
      const meeting = await ApiService.getMeetingById(id);
      // Planlanan toplantılar için yoklama alma özelliği devre dışı
      if (meeting.isPlanned) {
        alert('Planlanan toplantılar için yoklama alınamaz. Toplantı gerçekleştikten sonra "Toplantı Oluştur" ile oluşturup yoklama alabilirsiniz.');
        return;
      }
      setSelectedMeeting(meeting);
      setIsAttendanceModalOpen(true);
    } catch (error) {
      console.error('Error fetching meeting details:', error);
    }
  };

  // Function to handle excuse updates (opens the attendance modal)
  const handleUpdateExcuse = async (id) => {
    try {
      const meeting = await ApiService.getMeetingById(id);
      setSelectedMeeting(meeting);
      setIsAttendanceModalOpen(true);
    } catch (error) {
      console.error('Error fetching meeting details:', error);
    }
  };

  const closeCreateMeetingModal = () => {
    setIsCreateModalOpen(false);
  };

  const closePlanModal = () => {
    setIsPlanModalOpen(false);
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedMeeting(null);
  };

  const closeAttendanceModal = () => {
    setIsAttendanceModalOpen(false);
    setSelectedMeeting(null);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedMeeting(null);
  };

  const handleMeetingCreated = () => {
    fetchMeetings(); // Refresh the meetings list
  };

  const handleMeetingPlanned = () => {
    fetchMeetings(); // Refresh the meetings list
  };

  const handleCreateFromMinutes = () => {
    setIsCreateFromMinutesModalOpen(true);
  };

  const closeCreateFromMinutesModal = () => {
    setIsCreateFromMinutesModalOpen(false);
  };

  // Excel export handler
  const handleExportExcel = () => {
    // Prepare data for Excel export
    const exportData = meetings.map(meeting => {
      const attendanceStats = calculateAttendanceStats(meeting);
      return {
        'Toplantı Adı': meeting.name,
        'Tarih': meeting.date,
        'Bölgeler': meeting.regions ? meeting.regions.join(', ') : '',
        'Toplam Katılımcı': attendanceStats.totalAttendees,
        'Katılan': attendanceStats.attendedCount,
        'Katılmayan': attendanceStats.notAttendedCount,
        'Katılım Oranı (%)': attendanceStats.attendancePercentage,
        'Notlar': meeting.notes || '',
        'Arşivlendi': meeting.archived ? 'Evet' : 'Hayır',
        'Oluşturulma Tarihi': new Date(meeting.created_at).toLocaleDateString('tr-TR')
      };
    });
    
    return exportData;
  };

  const handleMeetingSaved = () => {
    fetchMeetings(); // Refresh the meetings list
    closeEditModal();
  };

  const handleAttendanceUpdated = () => {
    fetchMeetings(); // Refresh the meetings list
    closeAttendanceModal();
  };

  // Function to calculate attendance statistics
  const calculateAttendanceStats = (meeting) => {
    const totalExpected = meeting.attendees.length;
    const attendedCount = meeting.attendees.filter(a => a.attended).length;
    const excusedCount = meeting.attendees.filter(a => a.excuse && a.excuse.hasExcuse).length;
    const attendancePercentage = totalExpected > 0 
      ? Math.round((attendedCount / totalExpected) * 100) 
      : 0;
    
    return {
      totalExpected,
      attendedCount,
      excusedCount,
      // Non-attended count includes both those who didn't attend and those with excuses
      nonAttendedCount: totalExpected - attendedCount,
      attendancePercentage
    };
  };

  // Function to handle sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Function to get attendance color based on percentage
  const getAttendanceColor = (percentage) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Calculate summary statistics
  const calculateSummaryStats = () => {
    // Total meetings
    const totalMeetings = meetings.length;
    
    // Calculate average attendance rate
    let totalAttendanceRate = 0;
    let validMeetings = 0;
    
    meetings.forEach(meeting => {
      if (meeting.attendees && meeting.attendees.length > 0) {
        const stats = calculateAttendanceStats(meeting);
        totalAttendanceRate += stats.attendancePercentage;
        validMeetings++;
      }
    });
    
    const avgAttendanceRate = validMeetings > 0 ? Math.round(totalAttendanceRate / validMeetings) : 0;
    
    return {
      totalMeetings,
      avgAttendanceRate
    };
  };

  const summaryStats = calculateSummaryStats();

  if (loading) {
    return (
      <div className="py-6">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="py-6">
      {/* Header Section */}
        <MeetingsHeader 
          onCreateMeeting={handleCreateMeeting}
          onPlanMeeting={handlePlanMeeting}
          onCreateFromMinutes={handleCreateFromMinutes}
          onExportExcel={handleExportExcel}
          meetings={meetings}
        />

      {/* Summary Statistics Cards - Responsive Grid Layout */}
      <MeetingsSummaryStatistics 
        totalMeetings={summaryStats.totalMeetings}
        plannedMeetings={meetings.filter(m => !m.archived).length}
        avgAttendanceRate={summaryStats.avgAttendanceRate}
      />

      {/* Filters Section - Removed showArchived prop */}
      <MeetingsFilters 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      {/* Meetings Table - Responsive Design */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        <MeetingsTable 
          meetings={meetings}
          searchTerm={searchTerm}
          sortConfig={sortConfig}
          handleSort={handleSort}
          handleShowMeeting={handleShowMeeting}
          handleEditMeeting={handleEditMeeting}
          handleArchiveMeeting={handleArchiveMeeting}
          handleUpdateAttendance={handleUpdateAttendance}
          handleUpdateExcuse={handleUpdateExcuse}
          calculateAttendanceStats={calculateAttendanceStats}
          getAttendanceColor={getAttendanceColor}
        />
      </div>

      {/* Plan Meeting Modal */}
      <Modal
        isOpen={isPlanModalOpen}
        onClose={closePlanModal}
        title="Toplantı Planla"
        size="xl"
      >
        <PlanMeetingForm 
          regions={regions} 
          onClose={closePlanModal} 
          onMeetingPlanned={handleMeetingPlanned} 
        />
      </Modal>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={closeCreateMeetingModal}
        title="Yeni Toplantı Oluştur"
      >
        <CreateMeetingForm 
          regions={regions} 
          onClose={closeCreateMeetingModal} 
          onMeetingCreated={handleMeetingCreated} 
        />
      </Modal>

      <Modal
        isOpen={isDetailsModalOpen}
        onClose={closeDetailsModal}
        title={selectedMeeting ? selectedMeeting.name : "Toplantı Detayları"}
      >
        {selectedMeeting && (
          <MeetingDetails meeting={selectedMeeting} />
        )}
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        title="Toplantıyı Düzenle"
      >
        <MeetingForm 
          meeting={selectedMeeting}
          regions={regions}
          members={members}
          onClose={closeEditModal}
          onMeetingSaved={handleMeetingSaved}
        />
      </Modal>

      {/* Attendance Update Modal */}
      <Modal isOpen={isAttendanceModalOpen} onClose={closeAttendanceModal} title="Yoklama Güncelle">
        {selectedMeeting && (
          <AttendanceUpdate 
            meeting={selectedMeeting} 
            members={members}
            onClose={closeAttendanceModal} 
            onAttendanceUpdated={handleAttendanceUpdated} 
          />
        )}
      </Modal>

      {/* Create Meeting from Minutes Modal */}
      <Modal 
        isOpen={isCreateFromMinutesModalOpen} 
        onClose={closeCreateFromMinutesModal} 
        title="Tutanaktan Toplantı Oluştur"
        size="xl"
      >
        <CreateMeetingFromMinutes 
          onClose={closeCreateFromMinutesModal}
          onMeetingCreated={handleMeetingCreated}
        />
      </Modal>
    </div>
  );
};

export default MeetingsPage;