import React from 'react';

const MembersHeader = ({ onAddMember }) => {
  return (
    <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Üyeler</h1>
        <p className="text-gray-600 mt-1">Yönetim kurulu üyelerini yönetin</p>
      </div>
      <button
        onClick={onAddMember}
        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Üye Ekle
      </button>
    </div>
  );
};

export default MembersHeader;