import React, { useState, useEffect, useRef } from 'react';
import ApiService from '../utils/ApiService';
import Modal from '../components/Modal';
import MemberDetails from '../components/MemberDetails';
import MeetingDetails from '../components/MeetingDetails';
import { 
  ArchiveHeader, 
  SummaryStatistics, 
  ArchiveTabs, 
  DocumentsTable, 
  ArchivedMembersTable, 
  ArchivedMeetingsTable,
  ArchivedEventsTable
} from '../components/Archive';
import MemberDocumentsTable from '../components/Archive/MemberDocumentsTable';
import DocumentUploadForm from '../components/Archive/DocumentUploadForm';
import { LoadingSpinner } from '../components/UI';

const ArchivePage = () => {
  const [documents, setDocuments] = useState([]);
  const [memberDocuments, setMemberDocuments] = useState([]);
  const [archivedMembers, setArchivedMembers] = useState([]);
  const [archivedMeetings, setArchivedMeetings] = useState([]);
  const [archivedEvents, setArchivedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemType, setItemType] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [meetings, setMeetings] = useState([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({ name: '', description: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('documents'); // 'documents', 'members', 'meetings', 'events'
  const [documentType, setDocumentType] = useState('admin'); // 'admin' or 'member'
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchArchivedData();
    fetchMeetings();
    fetchDocuments();
    fetchMemberDocuments();
  }, []);

  const fetchArchivedData = async () => {
    try {
      setLoading(true);
      const membersData = await ApiService.getMembers(true); // Get archived members
      const meetingsData = await ApiService.getMeetings(true); // Get archived meetings
      const eventsData = await ApiService.getEvents(true); // Get archived events
      
      setArchivedMembers(membersData.filter(member => member.archived));
      setArchivedMeetings(meetingsData.filter(meeting => meeting.archived));
      setArchivedEvents(eventsData.filter(ev => ev.archived));
    } catch (error) {
      console.error('Error fetching archived data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMeetings = async () => {
    try {
      const meetingsData = await ApiService.getMeetings();
      setMeetings(meetingsData);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    }
  };

  const fetchDocuments = async () => {
    try {
      const documentsData = await ApiService.getDocuments();
      setDocuments(documentsData);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const fetchMemberDocuments = async () => {
    try {
      // Tüm üyeleri al
      const members = await ApiService.getMembers();
      
      // Her üye için personal documents'ları al
      const allMemberDocuments = [];
      for (const member of members) {
        try {
          const memberDocs = await ApiService.getPersonalDocuments(member.id);
          // Her belgeye üye bilgisi ekle
          const docsWithMemberInfo = memberDocs.map(doc => ({
            ...doc,
            member_name: member.name,
            member_id: member.id,
            is_member_document: true
          }));
          allMemberDocuments.push(...docsWithMemberInfo);
        } catch (error) {
          console.error(`Error fetching documents for member ${member.id}:`, error);
        }
      }
      
      setMemberDocuments(allMemberDocuments);
    } catch (error) {
      console.error('Error fetching member documents:', error);
    }
  };

  const handleShowMember = async (id) => {
    try {
      const member = await ApiService.getMemberById(id);
      setSelectedItem(member);
      setItemType('member');
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching member details:', error);
    }
  };

  const handleShowMeeting = async (id) => {
    try {
      const meeting = await ApiService.getMeetingById(id);
      setSelectedItem(meeting);
      setItemType('meeting');
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching meeting details:', error);
    }
  };

  const closeDetailModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
    setItemType(null);
  };

  const openUploadModal = () => {
    setIsUploadModalOpen(true);
  };

  const closeUploadModal = () => {
    setIsUploadModalOpen(false);
    setUploadForm({ name: '', description: '' });
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Auto-fill name field if empty
      if (!uploadForm.name) {
        setUploadForm({ ...uploadForm, name: file.name });
      }
    }
  };

  const handleUploadFormChange = (e) => {
    const { name, value } = e.target;
    setUploadForm({ ...uploadForm, [name]: value });
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      alert('Lütfen bir dosya seçin');
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('name', uploadForm.name);
      formData.append('description', uploadForm.description);
      
      await ApiService.uploadDocument(formData);
      
      // Refresh documents list
      await fetchDocuments();
      
      // Close modal and reset form
      closeUploadModal();
      
      alert('Belge başarıyla yüklendi');
    } catch (error) {
      console.error('Error uploading document:', error);
      // More detailed error handling
      let errorMessage = 'Belge yüklenirken hata oluştu';
      if (error.message) {
        errorMessage = error.message;
      }
      alert(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadDocument = async (id, filename, isMemberDocument = false) => {
    try {
      let blob;
      if (isMemberDocument) {
        blob = await ApiService.downloadPersonalDocument(id);
      } else {
        blob = await ApiService.downloadDocument(id);
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Belge indirilirken hata oluştu: ' + error.message);
    }
  };

  const handleDeleteDocument = async (id, isMemberDocument = false) => {
    if (window.confirm('Bu belgeyi silmek istediğinize emin misiniz?')) {
      try {
        if (isMemberDocument) {
          await ApiService.deletePersonalDocument(id);
          // Refresh member documents list
          await fetchMemberDocuments();
        } else {
          await ApiService.deleteDocument(id);
          // Refresh documents list
          await fetchDocuments();
        }
        alert('Belge başarıyla silindi');
      } catch (error) {
        console.error('Error deleting document:', error);
        alert('Belge silinirken hata oluştu: ' + error.message);
      }
    }
  };

  const handleDeleteArchivedMember = async (id) => {
    if (window.confirm('Bu arşivlenmiş üyeyi kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
      try {
        await ApiService.deleteArchivedMember(id);
        // Refresh archived members list
        await fetchArchivedData();
        alert('Arşivlenmiş üye başarıyla silindi');
      } catch (error) {
        console.error('Error deleting archived member:', error);
        alert('Arşivlenmiş üye silinirken hata oluştu: ' + error.message);
      }
    }
  };

  const handleRestoreMember = async (id) => {
    if (window.confirm('Bu üyeyi geri yüklemek istediğinize emin misiniz?')) {
      try {
        await ApiService.restoreMember(id);
        // Refresh archived members list
        await fetchArchivedData();
        alert('Üye başarıyla geri yüklendi');
      } catch (error) {
        console.error('Error restoring member:', error);
        alert('Üye geri yüklenirken hata oluştu: ' + error.message);
      }
    }
  };

  const handleDeleteArchivedMeeting = async (id) => {
    if (window.confirm('Bu arşivlenmiş toplantıyı kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
      try {
        await ApiService.deleteArchivedMeeting(id);
        // Refresh archived meetings list
        await fetchArchivedData();
        // Also refresh regular meetings list to update statistics
        await fetchMeetings();
        alert('Arşivlenmiş toplantı başarıyla silindi');
      } catch (error) {
        console.error('Error deleting archived meeting:', error);
        alert('Arşivlenmiş toplantı silinirken hata oluştu: ' + error.message);
      }
    }
  };

  const handleDeleteArchivedEvent = async (id) => {
    if (window.confirm('Bu arşivlenmiş etkinliği kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
      try {
        await ApiService.deleteEvent(id);
        // Refresh archived events list
        await fetchArchivedData();
        // Note: EventsPage will automatically refresh when navigated to due to cache-busting
        alert('Arşivlenmiş etkinlik başarıyla silindi');
      } catch (error) {
        console.error('Error deleting archived event:', error);
        alert('Arşivlenmiş etkinlik silinirken hata oluştu: ' + error.message);
      }
    }
  };

  // Clear archived members
  const handleClearArchivedMembers = async () => {
    if (window.confirm('Arşivlenmiş tüm üyeleri silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
      try {
        await ApiService.clearArchivedMembers();
        // Refresh archived members list
        await fetchArchivedData();
        alert('Arşivlenmiş üyeler başarıyla temizlendi');
      } catch (error) {
        console.error('Error clearing archived members:', error);
        alert('Arşivlenmiş üyeler temizlenirken hata oluştu: ' + error.message);
      }
    }
  };

  // Clear archived meetings
  const handleClearArchivedMeetings = async () => {
    if (window.confirm('Arşivlenmiş tüm toplantıları silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
      try {
        await ApiService.clearArchivedMeetings();
        // Refresh archived meetings list
        await fetchArchivedData();
        alert('Arşivlenmiş toplantılar başarıyla temizlendi');
      } catch (error) {
        console.error('Error clearing archived meetings:', error);
        alert('Arşivlenmiş toplantılar temizlenirken hata oluştu: ' + error.message);
      }
    }
  };

  // Clear documents
  const handleClearDocuments = async () => {
    if (window.confirm('Tüm belgeleri silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
      try {
        await ApiService.clearDocuments();
        // Refresh documents list
        await fetchDocuments();
        alert('Tüm belgeler başarıyla temizlendi');
      } catch (error) {
        console.error('Error clearing documents:', error);
        alert('Belgeler temizlenirken hata oluştu: ' + error.message);
      }
    }
  };

  // Clear archived events
  const handleClearArchivedEvents = async () => {
    if (window.confirm('Arşivlenmiş tüm etkinlikleri silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
      try {
        await ApiService.clearArchivedEvents();
        await fetchArchivedData();
        alert('Arşivlenmiş etkinlikler başarıyla temizlendi');
      } catch (error) {
        console.error('Error clearing archived events:', error);
        alert('Arşivlenmiş etkinlikler temizlenirken hata oluştu: ' + error.message);
      }
    }
  };

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
      <ArchiveHeader onUploadDocument={openUploadModal} />

      {/* Summary Statistics Cards */}
      <SummaryStatistics 
        documents={documents} 
        archivedMembers={archivedMembers} 
        archivedMeetings={archivedMeetings} 
      />

      {/* Navigation Tabs */}
      <ArchiveTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Actions per tab */}
      <div className="flex justify-end mb-2">
        {activeTab === 'documents' && (
          <button onClick={handleClearDocuments} className="px-3 py-1.5 text-sm rounded-md bg-red-50 text-red-700 hover:bg-red-100">Tümünü Sil</button>
        )}
        {activeTab === 'members' && (
          <button onClick={handleClearArchivedMembers} className="px-3 py-1.5 text-sm rounded-md bg-red-50 text-red-700 hover:bg-red-100">Tümünü Sil</button>
        )}
        {activeTab === 'meetings' && (
          <button onClick={handleClearArchivedMeetings} className="px-3 py-1.5 text-sm rounded-md bg-red-50 text-red-700 hover:bg-red-100">Tümünü Sil</button>
        )}
        {activeTab === 'events' && (
          <button onClick={handleClearArchivedEvents} className="px-3 py-1.5 text-sm rounded-md bg-red-50 text-red-700 hover:bg-red-100">Tümünü Sil</button>
        )}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div>
            <DocumentsTable 
              documents={documents} 
              onDownloadDocument={handleDownloadDocument} 
              onDeleteDocument={handleDeleteDocument} 
            />
          </div>
        )}

        {/* Archived Members Tab */}
        {activeTab === 'members' && (
          <div>
            <ArchivedMembersTable 
              archivedMembers={archivedMembers} 
              onShowMember={handleShowMember} 
              onDeleteMember={handleDeleteArchivedMember}
              onRestoreMember={handleRestoreMember}
            />
          </div>
        )}

        {/* Archived Meetings Tab */}
        {activeTab === 'meetings' && (
          <div>
            <ArchivedMeetingsTable 
              archivedMeetings={archivedMeetings} 
              onShowMeeting={handleShowMeeting} 
              onDeleteMeeting={handleDeleteArchivedMeeting}
            />
          </div>
        )}

        {/* Archived Events Tab */}
        {activeTab === 'events' && (
          <div>
            <ArchivedEventsTable 
              archivedEvents={archivedEvents}
              onDeleteEvent={handleDeleteArchivedEvent}
            />
          </div>
        )}
      </div>

      {/* Document Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={closeUploadModal}
        title="Belge Yükle"
      >
        <DocumentUploadForm 
          uploadForm={uploadForm}
          handleUploadFormChange={handleUploadFormChange}
          handleFileChange={handleFileChange}
          handleUploadDocument={handleUploadDocument}
          closeUploadModal={closeUploadModal}
          uploading={uploading}
          fileInputRef={fileInputRef}
        />
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={closeDetailModal}
        title={itemType === 'member' ? `${selectedItem?.name} Detayları` : selectedItem?.name}
      >
        {itemType === 'member' && selectedItem && (
          <MemberDetails member={selectedItem} meetings={meetings} />
        )}
        {itemType === 'meeting' && selectedItem && (
          <MeetingDetails meeting={selectedItem} />
        )}
      </Modal>
    </div>
  );
};

export default ArchivePage;