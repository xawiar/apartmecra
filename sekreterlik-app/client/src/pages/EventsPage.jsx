import React, { useState, useEffect } from 'react';
import ApiService from '../utils/ApiService';
import Modal from '../components/Modal';
import CreateEventForm from '../components/CreateEventForm';
import EventDetails from '../components/EventDetails';
import EventForm from '../components/EventForm';
import AttendanceUpdate from '../components/AttendanceUpdate';
import { 
  EventsHeader, 
  EventsSummaryStatistics, 
  EventsFilters, 
  EventsTable 
} from '../components/Events';
import { LoadingSpinner } from '../components/UI';

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [members, setMembers] = useState([]);
  const [formMode, setFormMode] = useState('create'); // 'create' or 'edit'
  const [searchTerm, setSearchTerm] = useState(''); // For event search
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' }); // Default sort by date, newest first

  useEffect(() => {
    fetchEvents();
    fetchMembers();
  }, []);

  useEffect(() => {
    // Apply sorting
    if (sortConfig.key) {
      const sorted = [...events].sort((a, b) => {
        let aValue, bValue;
        
        if (sortConfig.key === 'attendedCount') {
          // Calculate attended count for sorting
          const aStats = calculateAttendanceStats(a);
          const bStats = calculateAttendanceStats(b);
          aValue = aStats.attendedCount;
          bValue = bStats.attendedCount;
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
      setEvents(sorted);
    }
  }, [sortConfig]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getEvents();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
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


  // Calculate attendance statistics for an event
  const calculateAttendanceStats = (event) => {
    if (!event.attendees || event.attendees.length === 0) {
      return {
        totalAttendees: 0,
        attendedCount: 0,
        notAttendedCount: 0,
        attendancePercentage: 0
      };
    }

    const attendedCount = event.attendees.filter(a => a.attended).length;
    const notAttendedCount = event.attendees.length - attendedCount;
    const attendancePercentage = Math.round((attendedCount / event.attendees.length) * 100);

    return {
      totalAttendees: event.attendees.length,
      attendedCount,
      notAttendedCount,
      attendancePercentage
    };
  };

  // Calculate summary statistics
  const calculateSummaryStats = () => {
    const totalEvents = events.length;
    const activeEvents = events.filter(e => !e.archived).length;
    
    let totalAttendedCount = 0;
    
    events.forEach(event => {
      const stats = calculateAttendanceStats(event);
      totalAttendedCount += stats.attendedCount;
    });
    
    return {
      totalEvents,
      activeEvents,
      totalAttendedCount
    };
  };

  const summaryStats = calculateSummaryStats();

  // Filter events based on search term
  const filteredEvents = events.filter(event => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      event.name.toLowerCase().includes(searchLower) ||
      event.location.toLowerCase().includes(searchLower) ||
      event.description?.toLowerCase().includes(searchLower) ||
      event.date.toLowerCase().includes(searchLower)
    );
  });

  const handleCreateEvent = () => {
    setFormMode('create');
    setIsCreateModalOpen(true);
  };

  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setFormMode('edit');
    setIsEditModalOpen(true);
  };

  const handleShowEvent = (event) => {
    setSelectedEvent(event);
    setIsDetailsModalOpen(true);
  };

  const handleUpdateAttendance = (event) => {
    setSelectedEvent(event);
    setIsAttendanceModalOpen(true);
  };

  const handleArchiveEvent = async (id) => {
    if (window.confirm('Bu etkinliği arşivlemek istediğinize emin misiniz?')) {
      try {
        await ApiService.archiveEvent(id);
        fetchEvents(); // Refresh the list
        alert('Etkinlik başarıyla arşivlendi');
      } catch (error) {
        console.error('Error archiving event:', error);
        alert('Etkinlik arşivlenirken hata oluştu: ' + error.message);
      }
    }
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedEvent(null);
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedEvent(null);
  };

  const closeAttendanceModal = () => {
    setIsAttendanceModalOpen(false);
    setSelectedEvent(null);
  };

  const handleEventCreated = () => {
    fetchEvents(); // Refresh the events list
  };

  const handleEventSaved = () => {
    fetchEvents(); // Refresh the events list
    closeEditModal();
  };

  const handleAttendanceUpdated = () => {
    fetchEvents(); // Refresh the events list
    closeAttendanceModal();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="py-6">
      {/* Header Section */}
      <EventsHeader 
        onCreateEvent={handleCreateEvent}
      />

      {/* Summary Statistics Cards - Responsive Grid Layout */}
      <EventsSummaryStatistics 
        totalEvents={summaryStats.totalEvents}
        activeEvents={summaryStats.activeEvents}
        totalAttendedCount={summaryStats.totalAttendedCount}
      />

      {/* Filters Section */}
      <EventsFilters 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sortConfig={sortConfig}
        setSortConfig={setSortConfig}
      />

      {/* Events Table */}
      <EventsTable 
        events={filteredEvents}
        onShowEvent={handleShowEvent}
        onEditEvent={handleEditEvent}
        onUpdateAttendance={handleUpdateAttendance}
        onArchiveEvent={handleArchiveEvent}
        calculateAttendanceStats={calculateAttendanceStats}
      />

      {/* Create Event Modal */}
      <Modal 
        isOpen={isCreateModalOpen} 
        onClose={closeCreateModal} 
        title="Yeni Etkinlik Oluştur"
        size="xl"
      >
        <CreateEventForm 
          onClose={closeCreateModal}
          onEventCreated={handleEventCreated}
          members={members}
        />
      </Modal>

      {/* Edit Event Modal */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={closeEditModal} 
        title="Etkinlik Düzenle"
        size="xl"
      >
        {selectedEvent && (
          <EventForm 
            event={selectedEvent}
            onClose={closeEditModal}
            onEventSaved={handleEventSaved}
            members={members}
          />
        )}
      </Modal>

      {/* Event Details Modal */}
      <Modal 
        isOpen={isDetailsModalOpen} 
        onClose={closeDetailsModal} 
        title={selectedEvent ? `${selectedEvent.name} - Detaylar` : ''}
        size="xl"
      >
        {selectedEvent && (
          <EventDetails 
            event={selectedEvent}
            members={members}
          />
        )}
      </Modal>

      {/* Attendance Update Modal */}
      <Modal 
        isOpen={isAttendanceModalOpen} 
        onClose={closeAttendanceModal} 
        title={selectedEvent ? `${selectedEvent.name} - Katılım Güncelle` : ''}
        size="xl"
      >
        {selectedEvent && (
          <AttendanceUpdate 
            event={selectedEvent}
            members={members}
            onClose={closeAttendanceModal}
            onAttendanceUpdated={handleAttendanceUpdated}
          />
        )}
      </Modal>
    </div>
  );
};

export default EventsPage;
