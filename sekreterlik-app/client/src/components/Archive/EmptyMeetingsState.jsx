import React from 'react';

const EmptyMeetingsState = () => {
  return (
    <tr>
      <td colSpan="4" className="px-6 py-12 text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="bg-gray-100 rounded-full p-4 inline-block">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mt-4">Arşivlenmiş toplantı bulunamadı</h3>
          <p className="text-gray-500 mt-1">Henüz arşivlenmiş toplantı eklenmemiş</p>
        </div>
      </td>
    </tr>
  );
};

export default EmptyMeetingsState;