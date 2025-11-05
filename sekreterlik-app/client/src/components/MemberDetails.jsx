import React, { useState, useEffect } from 'react';
import { formatMemberName } from '../utils/nameFormatter';
import { stringify } from 'csv-stringify/browser/esm/sync';
import ApiService from '../utils/ApiService';
import { useAuth } from '../contexts/AuthContext';
import PersonalDocuments from './PersonalDocuments';
import ManagementChartView from './ManagementChartView';

const MemberDetails = ({ member, meetings, events, memberRegistrations, calculateMeetingStats, members = [] }) => {
  const { user } = useAuth();
  const formattedName = formatMemberName(member.name);
  const [photo, setPhoto] = useState(member.photo || null);
  const [isUploading, setIsUploading] = useState(false);
  const [notes, setNotes] = useState(member.notes || '');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [memberPositions, setMemberPositions] = useState([]);
  const [loadingPositions, setLoadingPositions] = useState(false);
  const [isManagementChartExpanded, setIsManagementChartExpanded] = useState(false);
  const [isMeetingsExpanded, setIsMeetingsExpanded] = useState(false);
  const [isRegistrationsExpanded, setIsRegistrationsExpanded] = useState(false);
  
  // Check if user is admin
  const isAdmin = user && user.role === 'admin';
  
  // Calculate meeting statistics for this member
  const stats = calculateMeetingStats ? calculateMeetingStats(member, meetings) : {
    totalMeetings: 0,
    attendedMeetings: 0,
    attendancePercentage: 0
  };
  
  // Calculate member registrations
  const calculateMemberRegistrations = (memberId) => {
    if (!memberRegistrations) return 0;
    const memberRegs = memberRegistrations.filter(reg => reg.memberId === memberId);
    return memberRegs.reduce((sum, reg) => sum + reg.count, 0);
  };
  
  const registrations = calculateMemberRegistrations(member.id);
  const memberRegistrationRows = (memberRegistrations || []).filter(r => r.memberId === member.id)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  // Fetch member positions
  const fetchMemberPositions = async () => {
    if (!member?.id) return;
    
    setLoadingPositions(true);
    try {
      const positions = [];
      
      // Check district positions
      const districtOfficials = await ApiService.getDistrictOfficials();
      const districtPositions = districtOfficials.filter(official => 
        String(official.chairman_member_id) === String(member.id) || 
        String(official.inspector_member_id) === String(member.id)
      );
      
      districtPositions.forEach(official => {
        if (String(official.chairman_member_id) === String(member.id)) {
          positions.push({
            type: 'İlçe Başkanı',
            location: official.district_name,
            locationType: 'İlçe'
          });
        }
        if (String(official.inspector_member_id) === String(member.id)) {
          positions.push({
            type: 'İlçe Müfettişi',
            location: official.district_name,
            locationType: 'İlçe'
          });
        }
      });
      
      // Check district deputy inspectors
      const districtDeputyInspectors = await ApiService.getAllDistrictDeputyInspectors();
      const districtDeputyPositions = districtDeputyInspectors.filter(deputy => 
        String(deputy.member_id) === String(member.id)
      );
      
      districtDeputyPositions.forEach(deputy => {
        positions.push({
          type: 'İlçe Müfettiş Yardımcısı',
          location: deputy.district_name,
          locationType: 'İlçe'
        });
      });
      
      // Check town positions
      const townOfficials = await ApiService.getTownOfficials();
      const townPositions = townOfficials.filter(official => 
        String(official.chairman_member_id) === String(member.id) || 
        String(official.inspector_member_id) === String(member.id)
      );
      
      townPositions.forEach(official => {
        if (String(official.chairman_member_id) === String(member.id)) {
          positions.push({
            type: 'Belde Başkanı',
            location: official.town_name,
            locationType: 'Belde'
          });
        }
        if (String(official.inspector_member_id) === String(member.id)) {
          positions.push({
            type: 'Belde Müfettişi',
            location: official.town_name,
            locationType: 'Belde'
          });
        }
      });
      
      // Check town deputy inspectors
      const townDeputyInspectors = await ApiService.getAllTownDeputyInspectors();
      const townDeputyPositions = townDeputyInspectors.filter(deputy => 
        String(deputy.member_id) === String(member.id)
      );
      
      townDeputyPositions.forEach(deputy => {
        positions.push({
          type: 'Belde Müfettiş Yardımcısı',
          location: deputy.town_name,
          locationType: 'Belde'
        });
      });
      
      // Check neighborhood representatives
      const neighborhoodRepresentatives = await ApiService.getNeighborhoodRepresentatives();
      const neighborhoodRepPositions = neighborhoodRepresentatives.filter(rep => 
        String(rep.member_id) === String(member.id)
      );
      
      neighborhoodRepPositions.forEach(rep => {
        positions.push({
          type: 'Mahalle Temsilcisi',
          location: rep.neighborhood_name,
          locationType: 'Mahalle'
        });
      });
      
      // Check neighborhood supervisors
      const neighborhoodSupervisors = await ApiService.getNeighborhoodSupervisors();
      const neighborhoodSupPositions = neighborhoodSupervisors.filter(sup => 
        String(sup.member_id) === String(member.id)
      );
      
      neighborhoodSupPositions.forEach(sup => {
        positions.push({
          type: 'Mahalle Sorumlusu',
          location: sup.neighborhood_name,
          locationType: 'Mahalle'
        });
      });
      
      // Check village representatives
      const villageRepresentatives = await ApiService.getVillageRepresentatives();
      const villageRepPositions = villageRepresentatives.filter(rep => 
        String(rep.member_id) === String(member.id)
      );
      
      villageRepPositions.forEach(rep => {
        positions.push({
          type: 'Köy Temsilcisi',
          location: rep.village_name,
          locationType: 'Köy'
        });
      });
      
      // Check village supervisors
      const villageSupervisors = await ApiService.getVillageSupervisors();
      const villageSupPositions = villageSupervisors.filter(sup => 
        String(sup.member_id) === String(member.id)
      );
      
      villageSupPositions.forEach(sup => {
        positions.push({
          type: 'Köy Sorumlusu',
          location: sup.village_name,
          locationType: 'Köy'
        });
      });
      
      // Check group leaders (grup başkanı)
      try {
        const groups = await ApiService.getGroups();
        const neighborhoods = await ApiService.getNeighborhoods();
        const villages = await ApiService.getVillages();
        
        groups.forEach(group => {
          // ID'leri string'e çevirerek karşılaştır
          if (group.group_leader_id && String(group.group_leader_id) === String(member.id)) {
            // Bu gruptaki mahalleleri ve köyleri bul
            const groupNeighborhoods = neighborhoods.filter(n => 
              n.group_no && String(n.group_no) === String(group.group_no)
            );
            const groupVillages = villages.filter(v => 
              v.group_no && String(v.group_no) === String(group.group_no)
            );
            
            const locationNames = [
              ...groupNeighborhoods.map(n => n.name),
              ...groupVillages.map(v => v.name)
            ].join(', ');
            
            positions.push({
              type: 'Grup Başkanı',
              location: `Grup ${group.group_no} (${locationNames || 'Mahalle/Köy bulunamadı'})`,
              locationType: 'Grup'
            });
          }
        });
      } catch (error) {
        console.error('Error fetching group leader information:', error);
        // Grup bilgileri alınamazsa sessizce devam et
      }
      
      setMemberPositions(positions);
    } catch (error) {
      console.error('Error fetching member positions:', error);
    } finally {
      setLoadingPositions(false);
    }
  };

  // Calculate event statistics for this member
  const calculateEventStats = (memberId) => {
    if (!events || !Array.isArray(events)) {
      return {
        totalEvents: 0,
        attendedEvents: 0,
        eventAttendancePercentage: 0
      };
    }

    const memberEvents = events.filter(event => 
      event.attendees && 
      Array.isArray(event.attendees) && 
      event.attendees.some(att => att.memberId === memberId)
    );

    const attendedEvents = memberEvents.filter(event => {
      const attendance = event.attendees.find(att => att.memberId === memberId);
      return attendance && attendance.attended;
    });

    const eventAttendancePercentage = memberEvents.length > 0 
      ? Math.round((attendedEvents.length / memberEvents.length) * 100) 
      : 0;

    return {
      totalEvents: memberEvents.length,
      attendedEvents: attendedEvents.length,
      eventAttendancePercentage
    };
  };

  const eventStats = calculateEventStats(member.id);

  // Calculate excuse count for meetings
  const calculateExcuseCount = (memberId) => {
    if (!meetings || !Array.isArray(meetings)) {
      return 0;
    }

    const memberMeetings = meetings.filter(meeting => 
      meeting.attendees && 
      Array.isArray(meeting.attendees) && 
      meeting.attendees.some(att => att.memberId === memberId)
    );

    let excuseCount = 0;
    memberMeetings.forEach(meeting => {
      if (meeting.attendees && Array.isArray(meeting.attendees)) {
        const attendee = meeting.attendees.find(a => a.memberId === memberId);
        if (attendee && attendee.excuse && attendee.excuse.hasExcuse) {
          excuseCount++;
        }
      }
    });

    return excuseCount;
  };

  const excuseCount = calculateExcuseCount(member.id);

  // Load member positions on component mount
  useEffect(() => {
    fetchMemberPositions();
  }, [member?.id]);

  // Handle notes save
  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      const updatedMember = { ...member, notes: notes };
      await ApiService.updateMember(member.id, updatedMember);
      setIsEditingNotes(false);
      alert('Notlar başarıyla kaydedildi');
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Notlar kaydedilirken hata oluştu: ' + error.message);
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Handle photo upload
  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Lütfen sadece resim dosyası seçin');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Dosya boyutu 5MB\'dan küçük olmalıdır');
      return;
    }

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('memberId', member.id);

      // Upload photo
      const response = await fetch('/api/members/upload-photo', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setPhoto(result.photoUrl);
        alert('Fotoğraf başarıyla yüklendi');
      } else {
        throw new Error('Fotoğraf yüklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Photo upload error:', error);
      alert('Fotoğraf yüklenirken hata oluştu: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };
  
  // Function to export member details as CSV with beautiful design
  const exportToCSV = async () => {
    // Create CSV content with beautiful formatting
    let csvContent = '';
    
    // Header with decorative elements
    csvContent += '═══════════════════════════════════════════════════════════════════════════════\n';
    csvContent += '                           ÜYE DETAY RAPORU\n';
    csvContent += '═══════════════════════════════════════════════════════════════════════════════\n';
    csvContent += `Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}\n`;
    csvContent += `Rapor Saati: ${new Date().toLocaleTimeString('tr-TR')}\n`;
    csvContent += '═══════════════════════════════════════════════════════════════════════════════\n\n';
    
    // Personal info section with beautiful formatting
    csvContent += '┌─────────────────────────────────────────────────────────────────────────────┐\n';
    csvContent += '│                            KİŞİSEL BİLGİLER                                │\n';
    csvContent += '├─────────────────────────────────────────────────────────────────────────────┤\n';
    csvContent += `│ TC Kimlik No        │ ${(member.tc || 'Belirtilmemiş').padEnd(40)} │\n`;
    csvContent += `│ İsim Soyisim        │ ${formattedName.padEnd(40)} │\n`;
    csvContent += `│ Telefon             │ ${(member.phone || 'Belirtilmemiş').padEnd(40)} │\n`;
    csvContent += `│ E-posta             │ ${(member.email || 'Belirtilmemiş').padEnd(40)} │\n`;
    csvContent += `│ Adres               │ ${(member.address || 'Belirtilmemiş').padEnd(40)} │\n`;
    csvContent += `│ Görev               │ ${(member.position || 'Belirtilmemiş').padEnd(40)} │\n`;
    csvContent += `│ Bölge               │ ${(member.region || 'Belirtilmemiş').padEnd(40)} │\n`;
    csvContent += `│ İlçe                │ ${(member.district || 'Belirtilmemiş').padEnd(40)} │\n`;
    csvContent += '└─────────────────────────────────────────────────────────────────────────────┘\n\n';
    
    // Statistics section
    csvContent += '┌─────────────────────────────────────────────────────────────────────────────┐\n';
    csvContent += '│                            İSTATİSTİKLER                                   │\n';
    csvContent += '├─────────────────────────────────────────────────────────────────────────────┤\n';
    csvContent += `│ Toplantı Sayısı     │ ${stats.totalMeetings.toString().padEnd(40)} │\n`;
    csvContent += `│ Katıldığı Toplantı  │ ${stats.attendedMeetings.toString().padEnd(40)} │\n`;
    csvContent += `│ Toplantı Katılım %  │ %${stats.attendancePercentage.toString().padEnd(39)} │\n`;
    csvContent += `│ Etkinlik Sayısı     │ ${eventStats.totalEvents.toString().padEnd(40)} │\n`;
    csvContent += `│ Katıldığı Etkinlik  │ ${eventStats.attendedEvents.toString().padEnd(40)} │\n`;
    csvContent += `│ Etkinlik Katılım %  │ %${eventStats.eventAttendancePercentage.toString().padEnd(39)} │\n`;
    csvContent += `│ Kaydettiği Üye      │ ${registrations.toString().padEnd(40)} │\n`;
    csvContent += '└─────────────────────────────────────────────────────────────────────────────┘\n\n';
    
    // Personal notes section - Only for admin
    if (isAdmin && member.notes) {
      csvContent += '┌─────────────────────────────────────────────────────────────────────────────┐\n';
      csvContent += '│                         KİŞİYE ÖZEL NOTLAR                                │\n';
      csvContent += '├─────────────────────────────────────────────────────────────────────────────┤\n';
      const notesLines = member.notes.split('\n');
      notesLines.forEach(line => {
        csvContent += `│ ${line.padEnd(75)} │\n`;
      });
      csvContent += '└─────────────────────────────────────────────────────────────────────────────┘\n\n';
    }
    
    // Meeting history section
    csvContent += '┌─────────────────────────────────────────────────────────────────────────────┐\n';
    csvContent += '│                    TOPLANTI KATILIM GEÇMİŞİ                                │\n';
    csvContent += '│                    (Sadece Katılması Gereken Toplantılar)                   │\n';
    csvContent += '├─────────────────────────────────────────────────────────────────────────────┤\n';
    
    const memberMeetings = meetings.filter(meeting => 
      meeting.attendees && 
      Array.isArray(meeting.attendees) && 
      meeting.attendees.some(a => a.memberId === member.id)
    ).sort((a, b) => {
      // Sort by date descending (newest first)
      const dateA = new Date(a.date.split('.').reverse().join('-'));
      const dateB = new Date(b.date.split('.').reverse().join('-'));
      return dateB - dateA;
    });
    
    if (memberMeetings && memberMeetings.length > 0) {
      csvContent += '│ Toplantı Adı                    │ Tarih       │ Durum    │ Mazeret │\n';
      csvContent += '├─────────────────────────────────┼─────────────┼──────────┼─────────┤\n';
      
      memberMeetings.forEach(meeting => {
        const attendance = meeting.attendees.find(a => a.memberId === member.id);
        
        let attendanceStatus = 'Bilinmiyor';
        let excuseStatus = 'Yok';
        
        if (attendance) {
          attendanceStatus = attendance.attended ? 'Katıldı' : 'Katılmadı';
          if (attendance.excuse && attendance.excuse.hasExcuse) {
            excuseStatus = 'Var';
          }
        }
        
        const meetingName = meeting.name.length > 30 ? meeting.name.substring(0, 27) + '...' : meeting.name;
        
        csvContent += `│ ${meetingName.padEnd(31)} │ ${meeting.date.padEnd(11)} │ ${attendanceStatus.padEnd(8)} │ ${excuseStatus.padEnd(7)} │\n`;
      });
    } else {
      csvContent += '│ Bu üyenin bölgesine ait toplantı bulunmuyor                                │\n';
    }
    
    csvContent += '└─────────────────────────────────────────────────────────────────────────────┘\n\n';
    
    // Event history section
    csvContent += '┌─────────────────────────────────────────────────────────────────────────────┐\n';
    csvContent += '│                      ETKİNLİK KATILIM GEÇMİŞİ                              │\n';
    csvContent += '├─────────────────────────────────────────────────────────────────────────────┤\n';
    
    const memberEvents = events ? events.filter(event => 
      event.attendees && 
      Array.isArray(event.attendees) && 
      event.attendees.some(att => att.memberId === member.id)
    ) : [];
    
    if (memberEvents && memberEvents.length > 0) {
      csvContent += '│ Etkinlik Adı                │ Tarih       │ Yer              │ Durum    │\n';
      csvContent += '├─────────────────────────────┼─────────────┼──────────────────┼──────────┤\n';
      
      memberEvents.forEach(event => {
        const attendance = event.attendees.find(a => a.memberId === member.id);
        
        let attendanceStatus = 'Bilinmiyor';
        
        if (attendance) {
          attendanceStatus = attendance.attended ? 'Katıldı' : 'Katılmadı';
        }
        
        const eventName = event.name.length > 25 ? event.name.substring(0, 22) + '...' : event.name;
        const eventLocation = event.location.length > 16 ? event.location.substring(0, 13) + '...' : event.location;
        
        csvContent += `│ ${eventName.padEnd(27)} │ ${event.date.padEnd(11)} │ ${eventLocation.padEnd(16)} │ ${attendanceStatus.padEnd(8)} │\n`;
      });
    } else {
      csvContent += '│ Bu üyenin katıldığı etkinlik bulunmuyor                                    │\n';
    }
    
    csvContent += '└─────────────────────────────────────────────────────────────────────────────┘\n\n';
    
    // Footer
    csvContent += '═══════════════════════════════════════════════════════════════════════════════\n';
    csvContent += '                    Parti Sekreterliği Sistemi v2.0\n';
    csvContent += '                          © 2025 DAT Dijital\n';
    csvContent += '═══════════════════════════════════════════════════════════════════════════════\n';
    
    // Create blob and download
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${member.name.replace(/\s+/g, '_')}_detaylar.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div id="member-details-container" className="max-w-6xl mx-auto space-y-6">
      {/* Export button - changed to CSV */}
      <div className="flex justify-end">
        <button
          onClick={exportToCSV}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          CSV Olarak İndir
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Kişisel Bilgiler</h3>
          
          {/* Photo Section */}
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="flex-shrink-0">
                {photo ? (
                  <img
                    src={`http://localhost:5000${photo}`}
                    alt={formattedName}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-gray-200"
                    onError={(e) => {
                      console.error('Image load error:', e);
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-indigo-100 flex items-center justify-center border-2 border-gray-200">
                    <span className="text-lg sm:text-2xl font-bold text-indigo-800">
                      {member.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <label className="block">
                  <span className="sr-only">Fotoğraf seç</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={isUploading}
                    className="block w-full text-xs sm:text-sm text-gray-500 file:mr-2 sm:file:mr-4 file:py-1 sm:file:py-2 file:px-2 sm:file:px-4 file:rounded-full file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50"
                  />
                </label>
                {isUploading && (
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">Fotoğraf yükleniyor...</p>
                )}
              </div>
            </div>
          </div>

          <dl className="space-y-2 sm:space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <dt className="w-full sm:w-32 text-xs sm:text-sm font-medium text-gray-500 mb-1 sm:mb-0">TC Kimlik No</dt>
              <dd className="text-xs sm:text-sm text-gray-900 font-medium">{member.tc}</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center">
              <dt className="w-full sm:w-32 text-xs sm:text-sm font-medium text-gray-500 mb-1 sm:mb-0">İsim Soyisim</dt>
              <dd className="text-xs sm:text-sm text-gray-900 font-medium">{formattedName}</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center">
              <dt className="w-full sm:w-32 text-xs sm:text-sm font-medium text-gray-500 mb-1 sm:mb-0">Telefon</dt>
              <dd className="text-xs sm:text-sm text-gray-900 font-medium">{member.phone}</dd>
            </div>
          </dl>
        </div>
        
        <div className="bg-gray-50 rounded-xl p-4 sm:p-5 border border-gray-100">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Parti Bilgileri</h3>
          <dl className="space-y-2 sm:space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <dt className="w-full sm:w-32 text-xs sm:text-sm font-medium text-gray-500 mb-1 sm:mb-0">Görev</dt>
              <dd className="text-xs sm:text-sm text-gray-900 font-medium">
                <span className="inline-flex items-center px-2 py-1 sm:px-2.5 sm:py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {member.position}
                </span>
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center">
              <dt className="w-full sm:w-32 text-xs sm:text-sm font-medium text-gray-500 mb-1 sm:mb-0">Bölge</dt>
              <dd className="text-xs sm:text-sm text-gray-900 font-medium">
                <span className="inline-flex items-center px-2 py-1 sm:px-2.5 sm:py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {member.region}
                </span>
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center">
              <dt className="w-full sm:w-32 text-xs sm:text-sm font-medium text-gray-500 mb-1 sm:mb-0">İlçe</dt>
              <dd className="text-xs sm:text-sm text-gray-900 font-medium">{member.district}</dd>
            </div>
          </dl>
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-xl p-4 sm:p-5 border border-gray-100">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">İstatistikler</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
            <div className="text-xs sm:text-sm text-gray-500">Toplantı Sayısı</div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{stats.totalMeetings}</div>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
            <div className="text-xs sm:text-sm text-gray-500">Katıldığı Toplantı</div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{stats.attendedMeetings}</div>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
            <div className="text-xs sm:text-sm text-gray-500">Toplantı Katılım %</div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{stats.attendancePercentage}%</div>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
            <div className="text-xs sm:text-sm text-gray-500">Mazeret Sayısı</div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{excuseCount}</div>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
            <div className="text-xs sm:text-sm text-gray-500">Kaydettiği Üye</div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{registrations}</div>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
            <div className="text-xs sm:text-sm text-gray-500">Etkinlik Sayısı</div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{eventStats.totalEvents}</div>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
            <div className="text-xs sm:text-sm text-gray-500">Katıldığı Etkinlik</div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{eventStats.attendedEvents}</div>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
            <div className="text-xs sm:text-sm text-gray-500">Etkinlik Katılım %</div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{eventStats.eventAttendancePercentage}%</div>
          </div>
        </div>
      </div>

      {memberRegistrationRows.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <button
            onClick={() => setIsRegistrationsExpanded(!isRegistrationsExpanded)}
            className="w-full px-4 sm:px-5 py-3 sm:py-4 text-left hover:bg-gray-50 transition-colors duration-200 flex items-center justify-between border-b border-gray-100 bg-gray-50"
          >
            <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center">
              <svg className="w-5 h-5 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.209 0-4 1.79-4 4s1.791 4 4 4 4-1.79 4-4-1.791-4-4-4z" />
              </svg>
              Üye Kayıtları
            </h3>
            <svg 
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isRegistrationsExpanded ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isRegistrationsExpanded && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tarih</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Adet</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {memberRegistrationRows.map((r, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 text-sm text-gray-700">{r.date}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Member Positions Section */}
      {memberPositions.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-4 sm:p-5 border border-gray-100">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Görev Bilgileri</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {memberPositions.map((position, index) => (
              <div key={index} className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm font-medium text-gray-500">{position.locationType}</span>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                    {position.type}
                  </span>
                </div>
                <div className="text-sm sm:text-base font-semibold text-gray-900">
                  {position.location}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kişiye Özel Notlar - Sadece Admin */}
      {isAdmin && (
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900">Kişiye Özel Notlar</h3>
            {!isEditingNotes && (
              <button
                onClick={() => setIsEditingNotes(true)}
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors duration-200 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Düzenle
              </button>
            )}
          </div>
        
        {isEditingNotes ? (
          <div className="space-y-3">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Bu üye hakkında özel notlarınızı buraya yazabilirsiniz..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              rows={4}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setIsEditingNotes(false);
                  setNotes(member.notes || ''); // Reset to original value
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                disabled={isSavingNotes}
              >
                İptal
              </button>
              <button
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors duration-200 flex items-center disabled:opacity-50"
              >
                {isSavingNotes ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Kaydediliyor...
                  </>
                ) : (
                  'Kaydet'
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white p-4 rounded-lg border border-gray-200 min-h-[100px]">
            {notes ? (
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{notes}</p>
            ) : (
              <p className="text-sm text-gray-500 italic">Henüz not eklenmemiş. Düzenle butonuna tıklayarak not ekleyebilirsiniz.</p>
            )}
          </div>
        )}
        </div>
      )}

      {/* Kişisel Belgeler - Admin ve kendi belgelerini gören üyeler */}
      <PersonalDocuments memberId={member.id} />

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <button
          onClick={() => setIsMeetingsExpanded(!isMeetingsExpanded)}
          className="w-full px-4 sm:px-5 py-3 sm:py-4 text-left hover:bg-gray-100 transition-colors duration-200 flex items-center justify-between border-b border-gray-100 bg-gray-50"
        >
          <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Toplantı Katılım Geçmişi
          </h3>
          <svg 
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isMeetingsExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {isMeetingsExpanded && (
          <>
            {/* Desktop Table */}
            <div className="overflow-x-auto table-responsive">
              <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50 hidden md:table-header-group">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Toplantı Adı
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Tarih
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Katılım Durumu
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100 hidden md:table-row-group">
              {meetings
                .filter(meeting => 
                  meeting.attendees && 
                  Array.isArray(meeting.attendees) && 
                  meeting.attendees.some(a => a.memberId === member.id)
                )
                .sort((a, b) => {
                  // Sort by date descending (newest first)
                  const dateA = new Date(a.date.split('.').reverse().join('-'));
                  const dateB = new Date(b.date.split('.').reverse().join('-'));
                  return dateB - dateA;
                })
                .map((meeting) => {
                const attendance = meeting.attendees.find(a => a.memberId === member.id);
                return (
                  <tr key={meeting.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {meeting.name}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {meeting.date}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {attendance ? (
                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          attendance.attended 
                            ? 'bg-green-100 text-green-800' 
                            : attendance.excuse && attendance.excuse.hasExcuse
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {attendance.attended 
                            ? 'Katıldı' 
                            : attendance.excuse && attendance.excuse.hasExcuse
                            ? 'Mazeretli'
                            : 'Katılmadı'
                          }
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          Bilinmiyor
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {meetings.filter(meeting => 
                meeting.regions && 
                Array.isArray(meeting.regions) && 
                meeting.regions.includes(member.region)
              ).length === 0 && (
                <tr>
                  <td colSpan="3" className="px-4 sm:px-6 py-8 text-center text-sm text-gray-500">
                    <div className="flex flex-col items-center">
                      <svg className="w-12 h-12 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p>Bu üyenin bölgesine ait toplantı bulunmuyor</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
              </table>
            </div>

            {/* Mobile Card Layout */}
            <div className="md:hidden space-y-3 p-4">
          {meetings
            .filter(meeting => 
              meeting.attendees && 
              Array.isArray(meeting.attendees) && 
              meeting.attendees.some(a => a.memberId === member.id)
            )
            .sort((a, b) => {
              // Sort by date descending (newest first)
              const dateA = new Date(a.date.split('.').reverse().join('-'));
              const dateB = new Date(b.date.split('.').reverse().join('-'));
              return dateB - dateA;
            })
            .map((meeting) => {
              const attendance = meeting.attendees.find(a => a.memberId === member.id);
              return (
                <div key={meeting.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                      {meeting.name}
                    </h4>
                    {attendance ? (
                      <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${
                        attendance.attended 
                          ? 'bg-green-100 text-green-800' 
                          : attendance.excuse && attendance.excuse.hasExcuse
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {attendance.attended 
                          ? 'Katıldı' 
                          : attendance.excuse && attendance.excuse.hasExcuse
                          ? 'Mazeretli'
                          : 'Katılmadı'
                        }
                      </span>
                    ) : (
                      <span className="px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full bg-gray-100 text-gray-800">
                        Bilinmiyor
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {meeting.date}
                  </p>
                </div>
              );
            })}
          {meetings.filter(meeting => 
            meeting.regions && 
            Array.isArray(meeting.regions) && 
            meeting.regions.includes(member.region)
          ).length === 0 && (
            <div className="flex flex-col items-center justify-center py-8">
              <svg className="w-12 h-12 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-gray-500">Bu üyenin bölgesine ait toplantı bulunmuyor</p>
            </div>
          )}
            </div>
          </>
        )}
      </div>

      {/* Yönetim Şeması - Sadece üyeler için */}
      {user && user.role === 'member' && members.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <button
            onClick={() => setIsManagementChartExpanded(!isManagementChartExpanded)}
            className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors duration-200 flex items-center justify-between"
          >
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Yönetim Kurulu Listesi
            </h3>
            <svg 
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isManagementChartExpanded ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {isManagementChartExpanded && (
            <div className="border-t border-gray-200">
              <ManagementChartView members={members} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MemberDetails;