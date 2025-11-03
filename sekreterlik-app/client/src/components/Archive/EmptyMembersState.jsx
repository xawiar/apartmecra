import React from 'react';

const EmptyMembersState = () => {
  return (
    <tr>
      <td colSpan="5" className="px-6 py-12 text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="bg-gray-100 rounded-full p-4 inline-block">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mt-4">Arşivlenmiş üye bulunamadı</h3>
          <p className="text-gray-500 mt-1">Henüz arşivlenmiş üye eklenmemiş</p>
        </div>
      </td>
    </tr>
  );
};

export default EmptyMembersState;