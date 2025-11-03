import React from 'react';

const ExcelExportButton = ({ onExport }) => {
  return (
    <button
      onClick={onExport}
      className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      Excel'e Aktar
    </button>
  );
};

export default ExcelExportButton;