import React, { useState, useEffect } from 'react';
import ApiService from '../utils/ApiService';
import { LoadingSpinner } from '../components/UI';
import { formatMemberName } from '../utils/nameFormatter';
import Modal from '../components/Modal';
import MemberDetails from '../components/MemberDetails';
import { calculateMeetingStats, calculateMemberRegistrations } from '../components/Members/membersUtils';

const ManagementChartPage = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [meetings, setMeetings] = useState([]);
  const [events, setEvents] = useState([]);
  const [memberRegistrations, setMemberRegistrations] = useState([]);

  useEffect(() => {
    fetchMembers();
    fetchMeetings();
    fetchEvents();
    fetchMemberRegistrations();
  }, []);


  const fetchMembers = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getMembers();
      setMembers(data);
    } catch (err) {
      setError('Üyeler yüklenirken bir hata oluştu');
      console.error('Error fetching members:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMeetings = async () => {
    try {
      const data = await ApiService.getMeetings();
      setMeetings(data);
    } catch (err) {
      console.error('Error fetching meetings:', err);
    }
  };

  const fetchEvents = async () => {
    try {
      const data = await ApiService.getEvents();
      setEvents(data);
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  };

  const fetchMemberRegistrations = async () => {
    try {
      const data = await ApiService.getMemberRegistrations();
      setMemberRegistrations(data);
    } catch (err) {
      console.error('Error fetching member registrations:', err);
    }
  };

  const handleMemberClick = (member) => {
    setSelectedMember(member);
    setIsDetailModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsDetailModalOpen(false);
    setSelectedMember(null);
  };

  // Define priority order for divan members
  const getDivanMemberPriority = (position) => {
    const priorityOrder = {
      'İl Sekreteri': 1,
      'Teşkilat Başkanı': 2,
      'Siyasi İşler Başkanı': 3,
      'Mali İşler Başkanı': 4,
      'Tanıtım Medya Başkanı': 5
    };
    
    return priorityOrder[position] || 999; // Other positions get lowest priority
  };

  // Categorize members based on region information
  const categorizeMembers = () => {
    const ilceBaskani = [];
    const divanUyeleri = [];
    const digerUyeler = [];

    members.forEach(member => {
      // İlçe Başkanı - fixed position
      if (member.position === 'İlçe Başkanı') {
        ilceBaskani.push(member);
      }
      // Divan üyeleri - members whose region contains "divan"
      else if (member.region && member.region.toLowerCase().includes('divan')) {
        divanUyeleri.push(member);
      }
      // Diğer üyeler - members whose region contains "yönetim kurulu" or others
      else {
        digerUyeler.push(member);
      }
    });

    // Sort divan members by priority
    divanUyeleri.sort((a, b) => {
      const priorityA = getDivanMemberPriority(a.position);
      const priorityB = getDivanMemberPriority(b.position);
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // If same priority, sort alphabetically by name
      return a.name.localeCompare(b.name, 'tr-TR');
    });


    return { ilceBaskani, divanUyeleri, digerUyeler };
  };

  const { ilceBaskani, divanUyeleri, digerUyeler } = categorizeMembers();

  if (loading) {
    return (
      <div className="py-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">

      {/* İlçe Başkanı - Özel Bölüm */}
      {ilceBaskani.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-8 mb-6 text-white">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold mb-2">İlçe Başkanı</h2>
            <p className="text-indigo-100">Kurumun en üst yöneticisi</p>
          </div>
          
          <div className="flex justify-center">
            {ilceBaskani.map(member => (
              <div 
                key={member.id} 
                onClick={() => handleMemberClick(member)}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20 hover:bg-white/20 hover:shadow-lg transition-all duration-300 cursor-pointer max-w-sm w-full sm:w-auto"
              >
                <div className="text-center">
                  {member.photo ? (
                    <img
                      src={`http://localhost:5000${member.photo}`}
                      alt={formatMemberName(member.name)}
                      className="w-20 h-20 rounded-full object-cover border-2 border-white/30 mx-auto mb-4"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className={`bg-white/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 ${member.photo ? 'hidden' : ''}`}>
                    <span className="text-2xl font-bold text-white">
                      {member.name.charAt(0)}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{formatMemberName(member.name)}</h3>
                  <p className="text-indigo-100 text-sm mb-1">{member.position}</p>
                  <p className="text-indigo-200 text-xs">Bölge: {member.region || 'Belirtilmemiş'}</p>
                  <p className="text-indigo-200 text-xs">TC: {member.tc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100">
        <div className="space-y-8">

          {/* Divan üyeleri - members whose region contains "divan" */}
          {divanUyeleri.length > 0 && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Divan Üyeleri</h2>
                <p className="text-blue-100 text-sm mt-1">{divanUyeleri.length} kişi</p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  {divanUyeleri.map(member => (
                    <div 
                      key={member.id} 
                      onClick={() => handleMemberClick(member)}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all duration-200 cursor-pointer"
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          {member.photo ? (
                            <img
                              src={`http://localhost:5000${member.photo}`}
                              alt={formatMemberName(member.name)}
                              className="w-12 h-12 rounded-full object-cover border border-blue-200"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className={`bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center ${member.photo ? 'hidden' : ''}`}>
                            <span className="text-blue-800 font-bold">
                              {member.name.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <h3 className="font-medium text-gray-900">{formatMemberName(member.name)}</h3>
                          <p className="text-sm text-gray-500 mt-1">{member.position}</p>
                          <p className="text-xs text-gray-400 mt-1">Bölge: {member.region || 'Belirtilmemiş'}</p>
                          <p className="text-xs text-gray-400 mt-1">TC: {member.tc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Diğer üyeler - members whose region contains "yönetim kurulu" or others */}
          {digerUyeler.length > 0 && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Diğer Üyeler</h2>
                <p className="text-green-100 text-sm mt-1">{digerUyeler.length} kişi</p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  {digerUyeler.map(member => (
                    <div 
                      key={member.id} 
                      onClick={() => handleMemberClick(member)}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-green-300 hover:shadow-sm transition-all duration-200 cursor-pointer"
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          {member.photo ? (
                            <img
                              src={`http://localhost:5000${member.photo}`}
                              alt={formatMemberName(member.name)}
                              className="w-12 h-12 rounded-full object-cover border border-green-200"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className={`bg-green-100 rounded-full w-12 h-12 flex items-center justify-center ${member.photo ? 'hidden' : ''}`}>
                            <span className="text-green-800 font-bold">
                              {member.name.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <h3 className="font-medium text-gray-900">{formatMemberName(member.name)}</h3>
                          <p className="text-sm text-gray-500 mt-1">{member.position}</p>
                          <p className="text-xs text-gray-400 mt-1">Bölge: {member.region || 'Belirtilmemiş'}</p>
                          <p className="text-xs text-gray-400 mt-1">TC: {member.tc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sayfa Başlığı - Alt Kısım */}
      <div className="mt-12 text-center">
        <h1 className="text-3xl font-bold text-gray-900">YÖNETİM ŞEMASI</h1>
        <p className="mt-2 text-gray-600">Kurum yönetimi ve üyelerin hiyerarşik düzeni</p>
      </div>

      {/* Member Details Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={handleCloseModal}
        title={selectedMember ? `${formatMemberName(selectedMember.name)} - Detaylar` : ''}
        size="xl"
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
    </div>
  );
};

export default ManagementChartPage;