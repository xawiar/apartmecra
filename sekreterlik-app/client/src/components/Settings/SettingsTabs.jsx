import React from 'react';

const SettingsTabs = ({ activeTab, setActiveTab }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-2 mb-6 border border-gray-100 dark:border-gray-700">
      <nav className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <button
          onClick={() => setActiveTab('admin')}
          className={`${
            activeTab === 'admin'
              ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
          } px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Kullanıcı Bilgileri
        </button>
        
        <button
          onClick={() => setActiveTab('regions')}
          className={`${
            activeTab === 'regions'
              ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
          } px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Bölge Ekle
        </button>
        
        <button
          onClick={() => setActiveTab('positions')}
          className={`${
            activeTab === 'positions'
              ? 'bg-indigo-100 text-indigo-700'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          } px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Görev Ekle
        </button>
        
        <button
          onClick={() => setActiveTab('member-users')}
          className={`${
            activeTab === 'member-users'
              ? 'bg-indigo-100 text-indigo-700'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          } px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
          Üye Kullanıcıları
        </button>
        
        <button
          onClick={() => setActiveTab('districts')}
          className={`${
            activeTab === 'districts'
              ? 'bg-indigo-100 text-indigo-700'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          } px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          İlçe Ekle
        </button>
        
        <button
          onClick={() => setActiveTab('towns')}
          className={`${
            activeTab === 'towns'
              ? 'bg-indigo-100 text-indigo-700'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          } px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Belde Ekle
        </button>
        
        <button
          onClick={() => setActiveTab('neighborhoods')}
          className={`${
            activeTab === 'neighborhoods'
              ? 'bg-indigo-100 text-indigo-700'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          } px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Mahalle Ekle
        </button>
        
        <button
          onClick={() => setActiveTab('villages')}
          className={`${
            activeTab === 'villages'
              ? 'bg-indigo-100 text-indigo-700'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          } px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Köy Ekle
        </button>
        
        <button
          onClick={() => setActiveTab('stks')}
          className={`${
            activeTab === 'stks'
              ? 'bg-indigo-100 text-indigo-700'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          } px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          STK Ekle
        </button>
        
        <button
          onClick={() => setActiveTab('mosques')}
          className={`${
            activeTab === 'mosques'
              ? 'bg-indigo-100 text-indigo-700'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          } px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Cami Ekle
        </button>
        
        <button
          onClick={() => setActiveTab('event-categories')}
          className={`${
            activeTab === 'event-categories'
              ? 'bg-indigo-100 text-indigo-700'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          } px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Etkinlik Kategorileri
        </button>
        
        {/* Yetkilendirme */}
        <button
          onClick={() => setActiveTab('authorization')}
          className={`${
            activeTab === 'authorization'
              ? 'bg-indigo-100 text-indigo-700'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          } px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c1.657 0 3-1.343 3-3S13.657 5 12 5 9 6.343 9 8s1.343 3 3 3zm0 2c-2.761 0-5 2.239-5 5v1h10v-1c0-2.761-2.239-5-5-5z" />
          </svg>
          Yetkilendirme
        </button>
        
      </nav>
    </div>
  );
};

export default SettingsTabs;