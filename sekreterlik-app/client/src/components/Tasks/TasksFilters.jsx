import React from 'react';

const TasksFilters = ({ 
  searchTerm, 
  setSearchTerm, 
  selectedYear, 
  setSelectedYear, 
  selectedMonth, 
  setSelectedMonth, 
  uniqueYears, 
  months, 
  resetFilters, 
  periodLabel, 
  selectedPeriodRegistrations,
  memberRegistrations,
  members
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
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
          </div>
          <div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="block w-full py-2.5 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            >
              <option value="">Tüm Yıllar</option>
              {uniqueYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          <div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="block w-full py-2.5 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            >
              <option value="">Tüm Aylar</option>
              {months.map(month => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={resetFilters}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Filtreleri Temizle
          </button>
        </div>
      </div>
      
      {/* Existing period registration count */}
      <div className="bg-gray-50 p-4 rounded-lg mt-4">
        <h3 className="font-medium text-gray-900 mb-1">
          {periodLabel} Kayıtlı Üye Sayısı
        </h3>
        <p className="text-2xl font-bold text-indigo-600">
          {selectedPeriodRegistrations}
        </p>
      </div>
    </div>
  );
};

export default TasksFilters;