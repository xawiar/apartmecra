import React, { useState, useEffect } from 'react';
import ApiService from '../utils/ApiService';
import { stringify } from 'csv-stringify/browser/esm/sync';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const EventDetails = ({ event, members }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, [event]);

  const getMemberName = (memberId) => {
    const member = members.find(m => m.id === memberId);
    return member ? member.name : 'Bilinmeyen Üye';
  };

  const getAttendanceRate = () => {
    if (!event.attendees || event.attendees.length === 0) return 0;
    const attendedCount = event.attendees.filter(a => a.attended).length;
    return Math.round((attendedCount / event.attendees.length) * 100);
  };

  const getExcusedCount = () => {
    if (!event.attendees || event.attendees.length === 0) return 0;
    return event.attendees.filter(a => a.excuse && a.excuse.hasExcuse).length;
  };

  const getNonAttendedCount = () => {
    if (!event.attendees || event.attendees.length === 0) return 0;
    return event.attendees.filter(a => !a.attended).length;
  };
  
  // Function to export event details as CSV
  const exportToCSV = async () => {
    // Create CSV content
    let csvContent = '';
    
    // Event info
    csvContent += 'Etkinlik Bilgileri\n';
    csvContent += 'Alan,Değer\n';
    csvContent += `Etkinlik Adı,${event.name}\n`;
    csvContent += `Tarih,${event.date}\n`;
    csvContent += `Yer,${event.location}\n`;
    csvContent += `Toplam Katılımcı,${event.attendees ? event.attendees.length : 0} kişi\n`;
    csvContent += `Katılan,${event.attendees ? event.attendees.filter(a => a.attended).length : 0} kişi\n`;
    csvContent += `Katılmayan,${event.attendees ? event.attendees.filter(a => !a.attended).length : 0} kişi\n`;
    csvContent += `Mazeretli,${getExcusedCount()} kişi\n`;
    csvContent += `Katılım Oranı,${getAttendanceRate()}%\n`;
    csvContent += `Açıklama,"${event.description || 'Açıklama eklenmemiş'}"\n`;
    csvContent += `Oluşturulma Tarihi,${new Date(event.created_at).toLocaleDateString('tr-TR')}\n`;
    csvContent += '\n';
    
    // Participants - detailed information
    csvContent += 'Katılımcı Detayları\n';
    csvContent += 'Üye Adı,TC Kimlik,Görev,Bölge,İlçe,Telefon,E-posta,Katılım Durumu,Mazeret Durumu,Mazeret Sebebi\n';
    
    if (event.attendees && event.attendees.length > 0) {
      event.attendees.forEach(attendance => {
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
      csvContent += 'Bu etkinliğe katılımcı eklenmemiş\n';
    }
    
    // Create blob and download
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${event.name.replace(/\s+/g, '_')}_detaylar.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Function to export event details as PDF
  const exportToPDF = async () => {
    try {
      const element = document.getElementById('event-details-container');
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
      pdf.save(`${event.name.replace(/\s+/g, '_')}_detaylar.pdf`);
      
      alert('PDF başarıyla oluşturuldu ve indirildi!');
    } catch (error) {
      console.error('PDF export error:', error);
      alert('PDF oluşturulurken bir hata oluştu: ' + error.message);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Yükleniyor...</div>;
  }

  return (
    <div id="event-details-container" className="space-y-6">
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
          <h3 className="text-lg font-bold text-gray-900 mb-4">Etkinlik Bilgileri</h3>
          <dl className="space-y-3">
            <div className="flex">
              <dt className="w-32 text-sm font-medium text-gray-500">Etkinlik Adı</dt>
              <dd className="text-sm text-gray-900 font-medium">{event.name}</dd>
            </div>
            <div className="flex">
              <dt className="w-32 text-sm font-medium text-gray-500">Tarih</dt>
              <dd className="text-sm text-gray-900 font-medium">{event.date}</dd>
            </div>
            <div className="flex">
              <dt className="w-32 text-sm font-medium text-gray-500">Yer</dt>
              <dd className="text-sm text-gray-900 font-medium">{event.location}</dd>
            </div>
            <div className="flex">
              <dt className="w-32 text-sm font-medium text-gray-500">Açıklama</dt>
              <dd className="text-sm text-gray-900 font-medium">{event.description || 'Açıklama eklenmemiş'}</dd>
            </div>
          </dl>
        </div>
        
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">İstatistikler</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-500">Toplam Katılımcı</div>
              <div className="text-2xl font-bold text-gray-900">{event.attendees ? event.attendees.length : 0}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-500">Katılan</div>
              <div className="text-2xl font-bold text-gray-900">{event.attendees ? event.attendees.filter(a => a.attended).length : 0}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-500">Katılmayan</div>
              <div className="text-2xl font-bold text-gray-900">{getNonAttendedCount()}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-500">Katılım Oranı</div>
              <div className="text-2xl font-bold text-gray-900">{getAttendanceRate()}%</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900">Katılımcı Listesi</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Katılan Kişiler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {event.attendees && event.attendees.length > 0 ? (
                event.attendees
                  .filter(attendance => attendance.attended) // Sadece katılan kişileri filtrele
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
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-green-800 text-xs font-medium">
                              {member ? member.name.charAt(0) : '?'}
                            </span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {member ? member.name : 'Bilinmeyen Üye'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {member ? member.position : '-'} - {member ? member.region : '-'}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="px-6 py-8 text-center text-sm text-gray-500">
                    Bu etkinliğe katılımcı eklenmemiş
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
