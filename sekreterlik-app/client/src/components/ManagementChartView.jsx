import React from 'react';
import { formatMemberName } from '../utils/nameFormatter';

const ManagementChartView = ({ members }) => {
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

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 bg-gray-50">
        <h3 className="text-base sm:text-lg font-bold text-gray-900">Yönetim Şeması</h3>
      </div>
      
      <div className="p-4 sm:p-6">
        <div className="space-y-6 sm:space-y-8">
          {/* İlçe Başkanı - Özel Bölüm */}
          {ilceBaskani.length > 0 && (
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-4 sm:p-6 text-white">
              <div className="text-center mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2">İlçe Başkanı</h2>
                <p className="text-indigo-100 text-xs sm:text-sm">Kurumun en üst yöneticisi</p>
              </div>
              
              <div className="flex justify-center">
                {ilceBaskani.map(member => (
                  <div 
                    key={member.id} 
                    className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4 lg:p-6 border border-white/20 max-w-sm w-full"
                  >
                    <div className="text-center">
                      {member.photo ? (
                        <img
                          src={`http://localhost:5000${member.photo}`}
                          alt={formatMemberName(member.name)}
                          className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full object-cover border-2 border-white/30 mx-auto mb-2 sm:mb-4"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className={`bg-white/20 rounded-full w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 flex items-center justify-center mx-auto mb-2 sm:mb-4 ${member.photo ? 'hidden' : ''}`}>
                        <span className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                          {member.name.charAt(0)}
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base lg:text-xl font-bold text-white mb-1 sm:mb-2">{formatMemberName(member.name)}</h3>
                      <p className="text-indigo-100 text-xs sm:text-sm mb-1">{member.position}</p>
                      <p className="text-indigo-200 text-xs">Bölge: {member.region || 'Belirtilmemiş'}</p>
                      <p className="text-indigo-200 text-xs">Tel: {member.phone || 'Belirtilmemiş'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Divan üyeleri */}
          {divanUyeleri.length > 0 && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-4 sm:px-6 py-3 sm:py-4">
                <h2 className="text-base sm:text-lg lg:text-xl font-bold text-white">Divan Üyeleri</h2>
                <p className="text-blue-100 text-xs sm:text-sm mt-1">{divanUyeleri.length} kişi</p>
              </div>
              
              <div className="p-3 sm:p-4 lg:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  {divanUyeleri.map(member => (
                    <div 
                      key={member.id} 
                      className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200"
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          {member.photo ? (
                            <img
                              src={`http://localhost:5000${member.photo}`}
                              alt={formatMemberName(member.name)}
                              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border border-blue-200"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className={`bg-blue-100 rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center ${member.photo ? 'hidden' : ''}`}>
                            <span className="text-blue-800 font-bold text-xs sm:text-sm">
                              {member.name.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3 sm:ml-4">
                          <h3 className="text-xs sm:text-sm font-medium text-gray-900">{formatMemberName(member.name)}</h3>
                          <p className="text-xs text-gray-500 mt-1">{member.position}</p>
                          <p className="text-xs text-gray-400 mt-1">Bölge: {member.region || 'Belirtilmemiş'}</p>
                          <p className="text-xs text-gray-400 mt-1">Tel: {member.phone || 'Belirtilmemiş'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Diğer üyeler */}
          {digerUyeler.length > 0 && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-teal-600 px-4 sm:px-6 py-3 sm:py-4">
                <h2 className="text-base sm:text-lg lg:text-xl font-bold text-white">Diğer Üyeler</h2>
                <p className="text-green-100 text-xs sm:text-sm mt-1">{digerUyeler.length} kişi</p>
              </div>
              
              <div className="p-3 sm:p-4 lg:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  {digerUyeler.map(member => (
                    <div 
                      key={member.id} 
                      className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200"
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          {member.photo ? (
                            <img
                              src={`http://localhost:5000${member.photo}`}
                              alt={formatMemberName(member.name)}
                              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border border-green-200"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className={`bg-green-100 rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center ${member.photo ? 'hidden' : ''}`}>
                            <span className="text-green-800 font-bold text-xs sm:text-sm">
                              {member.name.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3 sm:ml-4">
                          <h3 className="text-xs sm:text-sm font-medium text-gray-900">{formatMemberName(member.name)}</h3>
                          <p className="text-xs text-gray-500 mt-1">{member.position}</p>
                          <p className="text-xs text-gray-400 mt-1">Bölge: {member.region || 'Belirtilmemiş'}</p>
                          <p className="text-xs text-gray-400 mt-1">Tel: {member.phone || 'Belirtilmemiş'}</p>
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
    </div>
  );
};

export default ManagementChartView;
