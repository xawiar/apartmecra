import React from 'react';

const TableViewButton = ({ isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`p-2 rounded-lg text-sm font-medium transition-all duration-200 ${
        isActive 
          ? 'bg-indigo-50 text-indigo-700' 
          : 'bg-white text-gray-700 hover:bg-gray-50'
      }`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    </button>
  );
};

export default TableViewButton;