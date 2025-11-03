import React from 'react';
import ExcelExport from '../ExcelExport';

const MeetingsHeader = ({ onCreateMeeting, onCreateFromMinutes, onExportExcel, meetings }) => {
  return (
    <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Toplantılar</h1>
        <p className="text-gray-600 mt-1">Tüm toplantıları yönetin ve izleyin</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <ExcelExport
          data={onExportExcel()}
          filename="Toplantilar"
          buttonText="Excel Çıktı"
        />
        <button
          onClick={onCreateFromMinutes}
          className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Tutanaktan Oluştur
        </button>
        <button
          onClick={onCreateMeeting}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Toplantı Oluştur
        </button>
      </div>
    </div>
  );
};

export default MeetingsHeader;