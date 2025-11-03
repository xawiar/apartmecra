import React from 'react';

const EmptyDocumentsState = ({ onUploadDocument }) => {
  return (
    <tr>
      <td colSpan="4" className="px-6 py-12 text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="bg-gray-100 rounded-full p-4 inline-block">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mt-4">Belge bulunamadı</h3>
          <p className="text-gray-500 mt-1">Henüz belge eklenmemiş</p>
          <button
            onClick={onUploadDocument}
            className="mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center shadow-md hover:shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Belge Ekle
          </button>
        </div>
      </td>
    </tr>
  );
};

export default EmptyDocumentsState;