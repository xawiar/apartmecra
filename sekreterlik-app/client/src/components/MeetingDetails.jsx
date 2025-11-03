import React, { useState, useEffect } from 'react';
import ApiService from '../utils/ApiService';
import { stringify } from 'csv-stringify/browser/esm/sync'; // Import csv-stringify
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const MeetingDetails = ({ meeting }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, [meeting]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      // In a real implementation, you would fetch members by their IDs from the meeting
      const allMembers = await ApiService.getMembers();
      setMembers(allMembers);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMemberName = (memberId) => {
    const member = members.find(m => m.id === memberId);
    return member ? member.name : 'Bilinmeyen Üye';
  };

  const getAttendanceRate = () => {
    if (!meeting.attendees || meeting.attendees.length === 0) return 0;
    const attendedCount = meeting.attendees.filter(a => a.attended).length;
    return Math.round((attendedCount / meeting.attendees.length) * 100);
  };

  const getExcusedCount = () => {
    if (!meeting.attendees || meeting.attendees.length === 0) return 0;
    return meeting.attendees.filter(a => a.excuse && a.excuse.hasExcuse).length;
  };

  const getNonAttendedCount = () => {
    if (!meeting.attendees || meeting.attendees.length === 0) return 0;
    // Non-attended includes both those who didn't attend and those with excuses
    return meeting.attendees.filter(a => !a.attended).length;
  };
  
  // Function to export meeting details as CSV
  const exportToCSV = async () => {
    // Create CSV content
    let csvContent = '';
    
    // Meeting info
    csvContent += 'Toplantı Bilgileri\n';
    csvContent += 'Alan,Değer\n';
    csvContent += `Toplantı Adı,${meeting.name}\n`;
    csvContent += `Tarih,${meeting.date}\n`;
    csvContent += `Bölgeler,"${meeting.regions ? meeting.regions.join(', ') : 'Belirtilmemiş'}"\n`;
    csvContent += `Toplam Katılımcı,${meeting.attendees ? meeting.attendees.length : 0} kişi\n`;
    csvContent += `Katılan,${meeting.attendees ? meeting.attendees.filter(a => a.attended).length : 0} kişi\n`;
    csvContent += `Katılmayan,${meeting.attendees ? meeting.attendees.filter(a => !a.attended).length : 0} kişi\n`;
    csvContent += `Mazeretli,${getExcusedCount()} kişi\n`;
    csvContent += `Katılım Oranı,${getAttendanceRate()}%\n`;
    csvContent += `Toplantı Notları,"${meeting.notes || 'Not eklenmemiş'}"\n`;
    csvContent += `Oluşturulma Tarihi,${new Date(meeting.created_at).toLocaleDateString('tr-TR')}\n`;
    csvContent += '\n';
    
    // Participants - detailed information
    csvContent += 'Katılımcı Detayları\n';
    csvContent += 'Üye Adı,TC Kimlik,Görev,Bölge,İlçe,Telefon,E-posta,Katılım Durumu,Mazeret Durumu,Mazeret Sebebi\n';
    
    if (meeting.attendees && meeting.attendees.length > 0) {
      meeting.attendees.forEach(attendance => {
        const member = members.find(m => m.id === attendance.memberId);
        const memberName = member ? member.name : 'Bilinmeyen Üye';
        const memberTc = member ? member.tc : '-';
        const memberPosition = member ? member.position : '-';
        const memberRegion = member ? member.region : '-';
        const memberDistrict = member ? member.district : '-';
        const memberPhone = member ? member.phone : '-';
        const memberEmail = member ? member.email : '-';
        
        let attendanceStatus = 'Katılmadı';
        if (attendance.attended) {
          attendanceStatus = 'Katıldı';
        }
        
        let excuseStatus = 'Yok';
        let excuseReason = '';
        if (attendance.excuse && attendance.excuse.hasExcuse) {
          excuseStatus = 'Var';
          excuseReason = attendance.excuse.reason || 'Belirtilmemiş';
        }
        
        // Escape commas and quotes in fields
        const escapeField = (field) => {
          if (typeof field === 'string' && (field.includes(',') || field.includes('"'))) {
            return `"${field.replace(/"/g, '""')}"`;
          }
          return field || '';
        };
        
        csvContent += `${escapeField(memberName)},${escapeField(memberTc)},${escapeField(memberPosition)},${escapeField(memberRegion)},${escapeField(memberDistrict)},${escapeField(memberPhone)},${escapeField(memberEmail)},${escapeField(attendanceStatus)},${escapeField(excuseStatus)},${escapeField(excuseReason)}\n`;
      });
    } else {
      csvContent += 'Bu toplantıya katılımcı eklenmemiş\n';
    }
    
    // Create blob and download
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${meeting.name.replace(/\s+/g, '_')}_detaylar.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Function to export meeting details as PDF
  const exportToPDF = async () => {
    try {
      const element = document.getElementById('meeting-details-container');
      if (!element) {
        alert('PDF oluşturulamadı: Sayfa içeriği bulunamadı');
        return;
      }

      // Create canvas from HTML element
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Calculate dimensions
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save PDF
      pdf.save(`${meeting.name.replace(/\s+/g, '_')}_detaylar.pdf`);
      
      alert('PDF başarıyla oluşturuldu ve indirildi!');
    } catch (error) {
      console.error('PDF export error:', error);
      alert('PDF oluşturulurken bir hata oluştu: ' + error.message);
    }
  };

  return (
    <div id="meeting-details-container" className="space-y-6">
      {/* Export buttons */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={exportToCSV}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          CSV İndir
        </button>
        <button
          onClick={exportToPDF}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          PDF İndir
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Toplantı Bilgileri</h3>
          <dl className="space-y-3">
            <div className="flex">
              <dt className="w-32 text-sm font-medium text-gray-500">Toplantı Adı</dt>
              <dd className="text-sm text-gray-900 font-medium">{meeting.name}</dd>
            </div>
            <div className="flex">
              <dt className="w-32 text-sm font-medium text-gray-500">Tarih</dt>
              <dd className="text-sm text-gray-900 font-medium">{meeting.date}</dd>
            </div>
            <div className="flex">
              <dt className="w-32 text-sm font-medium text-gray-500">Bölgeler</dt>
              <dd className="text-sm text-gray-900 font-medium">
                <div className="flex flex-wrap gap-1">
                  {meeting.regions.map((region, index) => (
                    <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {region}
                    </span>
                  ))}
                </div>
              </dd>
            </div>
            <div className="flex">
              <dt className="w-32 text-sm font-medium text-gray-500">Katılım Oranı</dt>
              <dd className="text-sm text-gray-900 font-medium">
                <div className="flex items-center">
                  <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                    <div 
                      className={`h-2 rounded-full ${getAttendanceRate() > 70 ? 'bg-green-500' : getAttendanceRate() > 40 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                      style={{ width: `${getAttendanceRate()}%` }}
                    ></div>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    %{getAttendanceRate()}
                  </span>
                </div>
              </dd>
            </div>
            <div className="flex">
              <dt className="w-32 text-sm font-medium text-gray-500">Mazeretli</dt>
              <dd className="text-sm text-gray-900 font-medium">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  {getExcusedCount()} kişi
                </span>
              </dd>
            </div>
            <div className="flex">
              <dt className="w-32 text-sm font-medium text-gray-500">Katılmadı</dt>
              <dd className="text-sm text-gray-900 font-medium">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {getNonAttendedCount()} kişi
                </span>
              </dd>
            </div>
          </dl>
        </div>
        
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Toplantı Notları</h3>
          <div className="p-3 bg-white rounded-lg border border-gray-200">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {meeting.notes || 'Not eklenmemiş.'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900">Katılımcılar</h3>
        </div>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Üye
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Görev
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Bölge
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Katılım Durumu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Mazeret
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {meeting.attendees && meeting.attendees
                  .sort((a, b) => {
                    const memberA = members.find(m => m.id === a.memberId);
                    const memberB = members.find(m => m.id === b.memberId);
                    const nameA = memberA ? memberA.name : 'Bilinmeyen Üye';
                    const nameB = memberB ? memberB.name : 'Bilinmeyen Üye';
                    return nameA.localeCompare(nameB, 'tr', { sensitivity: 'base' });
                  })
                  .map((attendance) => {
                  const member = members.find(m => m.id === attendance.memberId);
                  return (
                    <tr key={attendance.memberId} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-indigo-800 text-xs font-medium">
                              {member ? member.name.charAt(0) : '?'}
                            </span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {member ? member.name : 'Bilinmeyen Üye'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {member ? member.position : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {member ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            {member.region}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          attendance.attended 
                            ? 'bg-green-100 text-green-800' 
                            : (attendance.excuse && attendance.excuse.hasExcuse)
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {attendance.attended 
                            ? 'Katıldı' 
                            : (attendance.excuse && attendance.excuse.hasExcuse)
                              ? 'Mazeretli'
                              : 'Katılmadı'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {attendance.excuse && attendance.excuse.hasExcuse ? (
                          <div className="max-w-xs">
                            <span className="text-xs text-gray-600">{attendance.excuse.reason}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Yok</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingDetails;