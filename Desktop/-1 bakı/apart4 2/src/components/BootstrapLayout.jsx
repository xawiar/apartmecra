import React, { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { logout, getUser } from '../utils/auth';
import CustomModal from './CustomModal';
import useCustomAlert from '../hooks/useCustomAlert';

const BootstrapLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { alertState, showAlert, showConfirm, hideAlert } = useCustomAlert();
  // Get user from localStorage (will be updated when user logs in)
  const user = getUser();
  const isSiteUser = user && user.role === 'site_user';
  const isObserver = user && user.role === 'observer';
  const isCompany = user && user.role === 'company';
  const isPersonnel = user && user.role === 'personnel';
  const isAdmin = user && (user.role === 'administrator' || user.role === 'admin');

  // Make alert functions available globally
  window.showAlert = showAlert;
  window.showConfirm = showConfirm;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getPageTitle = () => {
    if (isSiteUser) {
      return 'Site Panosu';
    }
    if (isObserver) {
      return 'Gözlemci Panosu';
    }
    if (isCompany) {
      return `${user?.name || user?.id || 'Firma'} - Firma Panosu`;
    }
    if (isPersonnel) {
      return 'Personel Panosu';
    }
    
    const pathTitles = {
      '/dashboard': 'Ana Sayfa',
      '/sites': 'Siteler',
      '/companies': 'Firmalar',
      '/agreements': 'Anlaşmalar',
      '/cashier': 'Kasa',
      '/partner-shares': 'Ortak Payları',
      '/current-status': 'Güncel Durum',
      '/settings': 'Ayarlar',
      '/settings/archive': 'Arşiv',
      '/meetings': 'Görüşmeler'
    };
    
    return pathTitles[location.pathname] || 'Apart Mecra';
  };

  const navItems = isCompany 
    ? [
        { name: 'Firma Panosu', path: '/company-dashboard', icon: 'bi-building' }
      ]
    : isPersonnel
    ? [
        { name: 'Personel Panosu', path: '/dashboard', icon: 'bi-person-badge' }
      ]
    : [
        { name: 'Ana Sayfa', path: '/dashboard', icon: 'bi-house-door' },
        ...(isSiteUser ? [] : [
          { name: 'Siteler', path: '/sites', icon: 'bi-building' },
          { name: 'Firmalar', path: '/companies', icon: 'bi-building-add' },
          { name: 'Anlaşmalar', path: '/agreements', icon: 'bi-handshake' },
          { name: 'Kasa', path: '/cashier', icon: 'bi-wallet2' },
          { name: 'Ortak Payları', path: '/partner-shares', icon: 'bi-people' },
          { name: 'Güncel Durum', path: '/current-status', icon: 'bi-graph-up-arrow' },
          ...(isObserver ? [] : [
            { name: 'Görüşmeler', path: '/meetings', icon: 'bi-chat-dots' },
            { name: 'Ayarlar', path: '/settings', icon: 'bi-gear' }
          ])
        ])
      ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Header */}
      <header className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm fixed-top">
        <div className="container-fluid">
          <div className="d-flex align-items-center">
            <div className="bg-gradient rounded me-2" style={{width: '40px', height: '40px', background: 'linear-gradient(135deg, #0A66C2, #2ECC71)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <span className="text-white fw-bold">
                {isCompany ? 'F' : isPersonnel ? 'P' : 'A'}
              </span>
            </div>
            <span className="navbar-brand mb-0 h1 d-none d-md-block">
              {isCompany ? 'Firma Paneli' : isPersonnel ? 'Personel Paneli' : 'Apart Mecra Yönetim Paneli'}
            </span>
          </div>
          
          <div className="d-flex align-items-center">
            <h2 className="mb-0 fs-4 fw-semibold text-dark">{getPageTitle()}</h2>
          </div>
          
          <div className="d-flex align-items-center">
            <div className="dropdown">
              <button className="btn btn-sm rounded-circle bg-primary text-white dropdown-toggle" 
                      type="button" 
                      id="userDropdown" 
                      data-bs-toggle="dropdown" 
                      aria-expanded="false">
                {isCompany ? 'F' : isPersonnel ? 'P' : 'A'}
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                <li><a className="dropdown-item" href="#"><i className="bi bi-person me-2"></i>Profil</a></li>
                <li><hr className="dropdown-divider" /></li>
                <li><button className="dropdown-item text-danger" onClick={handleLogout}><i className="bi bi-box-arrow-right me-2"></i>Çıkış Yap</button></li>
              </ul>
            </div>
            
            <button 
              className="btn btn-primary d-lg-none ms-2" 
              type="button" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <i className="bi bi-list"></i>
            </button>
          </div>
        </div>
      </header>

      <div className="container-fluid flex-grow-1 mt-5 pt-3">
        <div className="row h-100">
          {/* Desktop Sidebar */}
          <nav className="col-lg-2 d-none d-lg-block bg-white border-end vh-100 position-fixed">
            <div className="pt-3">
              <ul className="nav flex-column">
                {navItems.map((item) => (
                  <li key={item.path} className="nav-item">
                    <a
                      href={item.path}
                      className={`nav-link ${isActive(item.path) ? 'text-white bg-primary' : 'text-dark'}`}
                      style={isActive(item.path) ? {borderRadius: '0.5rem'} : {}}
                    >
                      <i className={`bi ${item.icon} me-2`}></i>
                      <span>{item.name}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="position-absolute bottom-0 w-100 p-3 border-top">
              <button
                onClick={handleLogout}
                className="btn btn-danger w-100 d-flex align-items-center justify-content-center"
              >
                <i className="bi bi-box-arrow-right me-2"></i>
                <span>Çıkış Yap</span>
              </button>
            </div>
          </nav>

          {/* Mobile/Tablet Sidebar Overlay */}
          {sidebarOpen && (
            <>
              <div 
                className="offcanvas-backdrop show d-lg-none" 
                onClick={() => setSidebarOpen(false)}
              ></div>
              <div className="offcanvas offcanvas-end d-lg-none show" style={{visibility: 'visible'}}>
                <div className="offcanvas-header">
                  <h5 className="offcanvas-title">
                    {isCompany ? 'Firma Paneli' : isPersonnel ? 'Personel Paneli' : 'Apart Mecra Yönetim Paneli'}
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setSidebarOpen(false)}
                  ></button>
                </div>
                <div className="offcanvas-body">
                  <ul className="nav flex-column">
                    {navItems.map((item) => (
                      <li key={item.path} className="nav-item">
                        <a
                          href={item.path}
                          className={`nav-link ${isActive(item.path) ? 'text-white bg-primary' : 'text-dark'}`}
                          style={isActive(item.path) ? {borderRadius: '0.5rem'} : {}}
                          onClick={() => setSidebarOpen(false)}
                        >
                          <i className={`bi ${item.icon} me-2`}></i>
                          <span>{item.name}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="mt-4">
                    <button
                      onClick={() => {
                        handleLogout();
                        setSidebarOpen(false);
                      }}
                      className="btn btn-danger w-100 d-flex align-items-center justify-content-center"
                    >
                      <i className="bi bi-box-arrow-right me-2"></i>
                      <span>Çıkış Yap</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Main Content */}
          <main className="col-lg-10 ms-lg-auto px-3 py-3">
            {children}
          </main>
        </div>
      </div>

      {/* Custom Modal */}
      <CustomModal
        show={alertState.show}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onConfirm={alertState.onConfirm}
        onClose={hideAlert}
        showCancel={alertState.showCancel}
        confirmText={alertState.confirmText}
        cancelText={alertState.cancelText}
      />
    </div>
  );
};

export default BootstrapLayout;