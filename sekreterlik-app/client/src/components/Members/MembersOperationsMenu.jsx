import React from 'react';
import ExcelImportExport from '../ExcelImportExport';

const MembersOperationsMenu = ({ 
  onViewModeChange, 
  viewMode, 
  onImportExcel, 
  onExportExcel, 
  onAddMember,
  searchTerm,
  onSearchChange,
  selectedRegion,
  regions,
  onRegionChange
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 mb-6 border border-gray-100">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Üye ara..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
          </div>
          <select
            value={selectedRegion}
            onChange={(e) => onRegionChange(e.target.value)}
            className="block w-full pl-3 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          >
            <option value="">Tüm Bölgeler</option>
            {regions.map(region => (
              <option key={region.id} value={region.name}>{region.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onViewModeChange('table')}
              className={`p-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                viewMode === 'table' 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                viewMode === 'grid' 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
          </div>
          <ExcelImportExport 
            onImport={onImportExcel} 
            onExport={onExportExcel} 
          />
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
      </div>
    </div>
  );
};

export default MembersOperationsMenu;