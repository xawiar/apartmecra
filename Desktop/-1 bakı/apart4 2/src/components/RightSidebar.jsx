import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../utils/auth';

const RightSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { name: 'Ana Sayfa', path: '/dashboard', icon: '🏠' },
    { name: 'Siteler', path: '/sites', icon: '🏢' },
    { name: 'Firmalar', path: '/companies', icon: '🏭' },
    { name: 'Anlaşmalar', path: '/agreements', icon: '🤝' },
    { name: 'Arşiv', path: '/archive', icon: '🗄️' },
    { name: 'Kasa', path: '/cashier', icon: '💰' },
    { name: 'Ortak Payları', path: '/partner-shares', icon: '👥' },
    { name: 'Ayarlar', path: '/settings', icon: '⚙️' },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button 
        className="mobile-menu-button md:hidden"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Desktop and Tablet Right Sidebar */}
      <div className="hidden md:block right-sidebar">
        <div className="p-4 border-b border-[#E2E8F0]">
          <h2 className="text-lg font-bold text-[#0A66C2] sidebar-logo-text">Apart Mecra Yönetim Paneli</h2>
        </div>
        <nav className="mt-2">
          <ul>
            {navItems.map((item) => (
              <li key={item.path}>
                <a
                  href={item.path}
                  className={`sidebar-menu-item ${isActive(item.path) ? 'active' : ''}`}
                >
                  <span className="sidebar-menu-icon">{item.icon}</span>
                  <span className="sidebar-menu-text">{item.name}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t border-[#E2E8F0]">
          <button
            onClick={handleLogout}
            className="w-full bg-[#EF4444] hover:bg-[#DC2626] text-white py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
          >
            <svg className="h-4 w-4 mr-2 sidebar-logout-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="sidebar-logout-text">Çıkış Yap</span>
          </button>
        </div>
      </div>

      {/* Mobile Sidebar (slides from right) */}
      <div className={`mobile-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-sidebar-content">
          <div className="p-4 border-b border-[#E2E8F0] flex justify-between items-center">
            <h2 className="text-lg font-bold text-[#0A66C2]">Apart Mecra Yönetim Paneli</h2>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-gray-500 hover:text-[#0A66C2]"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="mt-4">
            <ul>
              {navItems.map((item) => (
                <li key={item.path}>
                  <a
                    href={item.path}
                    className={`sidebar-menu-item ${isActive(item.path) ? 'active' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className="sidebar-menu-icon">{item.icon}</span>
                    <span>{item.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="absolute bottom-0 w-full p-4 border-t border-[#E2E8F0]">
            <button
              onClick={() => {
                handleLogout();
                setIsMobileMenuOpen(false);
              }}
              className="w-full bg-[#EF4444] hover:bg-[#DC2626] text-white py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Çıkış Yap
            </button>
          </div>
        </div>
      </div>
      
      {/* Overlay for mobile sidebar */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}
    </>
  );
};

export default RightSidebar;