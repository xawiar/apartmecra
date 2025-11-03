import React from 'react';

const EditMemberButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="text-blue-600 hover:text-blue-900 transition-colors p-1 rounded-full hover:bg-blue-50"
      title="Düzenle"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    </button>
  );
};

export default EditMemberButton;