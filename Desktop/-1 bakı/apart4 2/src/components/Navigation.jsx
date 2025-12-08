import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUser, logout } from '../utils/auth';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Siteler', path: '/sites' },
    { name: 'Firmalar', path: '/companies' },
    { name: 'Anlaşmalar', path: '/agreements' },
    { name: 'Kasa', path: '/cashier' },
    { name: 'Ortak Payları', path: '/partner-shares' },
    { name: 'Arşiv', path: '/archive' },
    { name: 'Ayarlar', path: '/settings' },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="navbar">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-[#0A66C2]">Kurumsal Yönetim Sistemi</h1>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {navItems.map((item) => (
              <a
                key={item.path}
                href={item.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                  isActive(item.path)
                    ? 'text-[#0A66C2] bg-blue-50'
                    : 'text-gray-600 hover:text-[#0A66C2] hover:bg-gray-50'
                }`}
              >
                {item.name}
              </a>
            ))}
            <button
              onClick={handleLogout}
              className="btn-danger"
            >
              Çıkış Yap
            </button>
          </div>
          
          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-500 hover:text-[#0A66C2]"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <a
                key={item.path}
                href={item.path}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-all duration-300 ${
                  isActive(item.path)
                    ? 'text-[#0A66C2] bg-blue-50'
                    : 'text-gray-600 hover:text-[#0A66C2] hover:bg-gray-50'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </a>
            ))}
            <button
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-[#E74C3C] hover:bg-gray-50"
            >
              Çıkış Yap
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;