import React from 'react';
import { useLocation } from 'react-router-dom';
import { getUser } from '../utils/auth';

const Header = () => {
  const location = useLocation();
  const user = getUser();

  const getPageTitle = () => {
    const pathTitles = {
      '/dashboard': 'Ana Sayfa',
      '/sites': 'Siteler',
      '/companies': 'Firmalar',
      '/agreements': 'Anlaşmalar',
      '/cashier': 'Kasa',
      '/partner-shares': 'Ortak Payları',
      '/archive': 'Arşiv',
      '/settings': 'Ayarlar'
    };
    
    return pathTitles[location.pathname] || 'Apart Mecra';
  };

  return (
    <header className="header">
      <div className="flex items-center">
        <div className="bg-gradient-to-r from-[#0A66C2] to-[#2ECC71] text-white w-10 h-10 rounded-lg flex items-center justify-center mr-3">
          <span className="font-bold">A</span>
        </div>
        <h1 className="text-lg font-bold text-[#2C3E50] hidden md:block">Apart Mecra Yönetim Paneli</h1>
      </div>
      
      <div className="flex items-center">
        <h2 className="text-xl font-semibold text-[#2C3E50]">{getPageTitle()}</h2>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="relative">
          <button className="flex items-center text-sm rounded-full focus:outline-none">
            <div className="bg-[#0A66C2] text-white w-8 h-8 rounded-full flex items-center justify-center">
              <span className="font-medium">A</span>
            </div>
          </button>
        </div>
        
        {/* Logout button for desktop */}
        <button className="hidden md:flex items-center text-sm rounded-md bg-[#EF4444] text-white px-3 py-1 hover:bg-[#DC2626] transition-colors">
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Çıkış
        </button>
      </div>
    </header>
  );
};

export default Header;