import React, { useState } from 'react';
import ApiService from '../utils/ApiService';

const CreateMeetingFromMinutes = ({ onClose, onMeetingCreated }) => {
  const [minutesText, setMinutesText] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [regions, setRegions] = useState([]);
  const [selectedRegions, setSelectedRegions] = useState([]);

  React.useEffect(() => {
    fetchMembersAndRegions();
  }, []);

  const fetchMembersAndRegions = async () => {
    try {
      const [membersData, regionsData] = await Promise.all([
        ApiService.getMembers(),
        ApiService.getRegions()
      ]);
      setMembers(membersData);
      setRegions(regionsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const parseMinutes = (text) => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    // Find meeting name and date
    let meetingName = '';
    let meetingDate = '';
    let attendees = [];
    
    // Parse the specific format from your example
    // Look for the table header and data row
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if this line contains the table header
      if (line.includes('Toplantı Adı') && line.includes('Tarih')) {
        // The next line should contain the actual data
        if (i + 1 < lines.length) {
          const dataLine = lines[i + 1];
          const parts = dataLine.split('\t');
          if (parts.length >= 2) {
            meetingName = parts[0].trim();
            // Extract only date part, remove time
            let datePart = parts[1].trim();
            const dateOnly = datePart.match(/(\d{2}\.\d{2}\.\d{4})/);
            if (dateOnly) {
              meetingDate = dateOnly[1];
            } else {
              meetingDate = datePart;
            }
            break;
          }
        }
      }
      
      // Alternative: look for lines that contain meeting name and date directly
      if (line.includes('İl divan') && line.includes('31.08.2025')) {
        const parts = line.split('\t');
        if (parts.length >= 2) {
          meetingName = parts[0].trim();
          // Extract only date part, remove time
          let datePart = parts[1].trim();
          const dateOnly = datePart.match(/(\d{2}\.\d{2}\.\d{4})/);
          if (dateOnly) {
            meetingDate = dateOnly[1];
          } else {
            meetingDate = datePart;
          }
          break;
        }
      }
    }
    
    // If still not found, try regex patterns
    if (!meetingName) {
      const nameMatch = text.match(/İl divan/i);
      if (nameMatch) {
        meetingName = 'İl divan';
      }
    }
    
    if (!meetingDate) {
      // Look for date format without time
      const dateMatch = text.match(/(\d{2}\.\d{2}\.\d{4})/);
      if (dateMatch) {
        meetingDate = dateMatch[1];
      }
    }
    
    // Find attendees section
    let inAttendeesSection = false;
    for (const line of lines) {
      if (line.toLowerCase().includes('katılımcılar') || line.toLowerCase().includes('durumları')) {
        inAttendeesSection = true;
        continue;
      }
      
      if (inAttendeesSection && line.includes(' - ')) {
        const parts = line.split(' - ');
        if (parts.length === 2) {
          const name = parts[0].trim();
          const status = parts[1].trim().toLowerCase();
          
          attendees.push({
            name: name,
            attended: status === 'katıldı',
            hasExcuse: status === 'katılmadı',
            excuseReason: status === 'katılmadı' ? 'Katılmadı' : ''
          });
        }
      }
    }
    
    return {
      meetingName,
      meetingDate,
      attendees
    };
  };

  const findMemberByName = (name) => {
    // Try exact match first
    let member = members.find(m => m.name.toLowerCase() === name.toLowerCase());
    
    if (!member) {
      // Try partial match
      member = members.find(m => {
        const memberName = m.name.toLowerCase();
        const searchName = name.toLowerCase();
        
        // Check if all words in search name exist in member name
        const searchWords = searchName.split(' ');
        const memberWords = memberName.split(' ');
        
        return searchWords.every(word => 
          memberWords.some(memberWord => 
            memberWord.includes(word) || word.includes(memberWord)
          )
        );
      });
    }
    
    return member;
  };

  const handleParse = () => {
    if (!minutesText.trim()) {
      alert('Lütfen tutanak metnini girin');
      return;
    }
    
    const parsed = parseMinutes(minutesText);
    
    // Match attendees with existing members
    const matchedAttendees = parsed.attendees.map(attendee => {
      const member = findMemberByName(attendee.name);
      return {
        ...attendee,
        member: member,
        memberId: member ? member.id : null,
        found: !!member
      };
    });
    
    setParsedData({
      ...parsed,
      attendees: matchedAttendees
    });
  };

  const handleCreateMeeting = async () => {
    if (!parsedData) return;
    
    if (selectedRegions.length === 0) {
      alert('Lütfen en az bir bölge seçin');
      return;
    }
    
    setLoading(true);
    try {
      // Prepare meeting data
      const meetingData = {
        name: parsedData.meetingName || 'Tutanaktan Oluşturulan Toplantı',
        date: parsedData.meetingDate || new Date().toISOString().split('T')[0],
        regions: selectedRegions, // Use selected regions
        notes: `Tutanaktan otomatik oluşturuldu:\n\n${minutesText}`,
        attendees: parsedData.attendees
          .filter(attendee => attendee.memberId)
          .map(attendee => ({
            memberId: attendee.memberId,
            attended: attendee.attended,
            excuse: {
              hasExcuse: attendee.hasExcuse,
              reason: attendee.excuseReason
            }
          }))
      };
      
      const response = await ApiService.createMeeting(meetingData);
      console.log('Meeting created from minutes:', response);
      
      alert('Toplantı başarıyla oluşturuldu!');
      
      if (onMeetingCreated) {
        onMeetingCreated();
      }
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error creating meeting:', error);
      alert('Toplantı oluşturulurken hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getUnmatchedCount = () => {
    return parsedData ? parsedData.attendees.filter(a => !a.found).length : 0;
  };

  const getMatchedCount = () => {
    return parsedData ? parsedData.attendees.filter(a => a.found).length : 0;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Toplantı Tutanaklarından Toplantı Oluştur
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Toplantı tutanaklarınızı aşağıdaki alana yapıştırın. Sistem otomatik olarak katılım bilgilerini çıkaracak.
        </p>
      </div>

      {/* Bölge Seçimi */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Bu Toplantıya Katılması Gereken Bölgeler
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {regions.map((region) => (
            <label key={region.id} className="flex items-center">
              <input
                type="checkbox"
                checked={selectedRegions.includes(region.name)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedRegions([...selectedRegions, region.name]);
                  } else {
                    setSelectedRegions(selectedRegions.filter(r => r !== region.name));
                  }
                }}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">{region.name}</span>
            </label>
          ))}
        </div>
        {selectedRegions.length === 0 && (
          <p className="text-sm text-amber-600 mt-1">
            ⚠️ En az bir bölge seçmelisiniz
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tutanak Metni
        </label>
        <textarea
          value={minutesText}
          onChange={(e) => setMinutesText(e.target.value)}
          placeholder="Toplantı tutanaklarınızı buraya yapıştırın..."
          className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div className="flex space-x-3">
        <button
          onClick={handleParse}
          disabled={!minutesText.trim()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Parse Et
        </button>
        
        {parsedData && (
          <button
            onClick={handleCreateMeeting}
            disabled={loading || getMatchedCount() === 0 || selectedRegions.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Oluşturuluyor...' : 'Toplantı Oluştur'}
          </button>
        )}
      </div>

      {parsedData && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Parse Sonuçları</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Toplantı Adı</label>
              <p className="text-sm text-gray-900">{parsedData.meetingName || 'Belirtilmemiş'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tarih</label>
              <p className="text-sm text-gray-900">{parsedData.meetingDate || 'Belirtilmemiş'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Seçilen Bölgeler</label>
              <p className="text-sm text-gray-900">
                {selectedRegions.length > 0 ? selectedRegions.join(', ') : 'Bölge seçilmedi'}
              </p>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex space-x-4 text-sm">
              <span className="text-green-600">✓ Eşleşen: {getMatchedCount()}</span>
              <span className="text-red-600">✗ Eşleşmeyen: {getUnmatchedCount()}</span>
              <span className="text-gray-600">Toplam: {parsedData.attendees.length}</span>
            </div>
          </div>

          {getUnmatchedCount() > 0 && (
            <div className="mb-4">
              <h5 className="font-medium text-red-600 mb-2">Eşleşmeyen Üyeler:</h5>
              <div className="max-h-32 overflow-y-auto">
                {parsedData.attendees
                  .filter(a => !a.found)
                  .map((attendee, index) => (
                    <div key={index} className="text-sm text-red-600">
                      • {attendee.name}
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="max-h-48 overflow-y-auto">
            <h5 className="font-medium text-gray-900 mb-2">Katılımcılar:</h5>
            {parsedData.attendees.map((attendee, index) => (
              <div key={index} className={`text-sm flex items-center justify-between py-1 ${
                attendee.found ? 'text-gray-900' : 'text-red-600'
              }`}>
                <span>
                  {attendee.found ? '✓' : '✗'} {attendee.name}
                  {attendee.member && ` (${attendee.member.name})`}
                </span>
                <span className={`px-2 py-1 rounded text-xs ${
                  attendee.attended 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {attendee.attended ? 'Katıldı' : 'Katılmadı'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateMeetingFromMinutes;
