import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as apiLogin, getCompanies } from '../services/api';
import { login } from '../utils/auth';

const Login = () => {
  const [activeTab, setActiveTab] = useState('admin'); // 'admin', 'company', 'site', or 'personnel'
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [siteId, setSiteId] = useState('');
  const [sitePhone, setSitePhone] = useState('');
  const [personnelUsername, setPersonnelUsername] = useState('');
  const [personnelPassword, setPersonnelPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showPersonnelPassword, setShowPersonnelPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState({
    admin: false,
    company: false,
    site: false,
    personnel: false
  });
  const navigate = useNavigate();

  // LocalStorage functions for remember me feature
  const getStorageKey = (type) => `remember_me_${type}`;
  
  const saveCredentials = (type, username, password) => {
    const key = getStorageKey(type);
    const credentials = { username, password, timestamp: Date.now() };
    localStorage.setItem(key, JSON.stringify(credentials));
  };
  
  const loadCredentials = (type) => {
    const key = getStorageKey(type);
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const credentials = JSON.parse(stored);
        // Check if credentials are not older than 30 days
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        if (credentials.timestamp > thirtyDaysAgo) {
          return credentials;
        } else {
          localStorage.removeItem(key);
        }
      } catch (e) {
        localStorage.removeItem(key);
      }
    }
    return null;
  };
  
  const clearCredentials = (type) => {
    const key = getStorageKey(type);
    localStorage.removeItem(key);
  };

  // Load saved credentials on component mount
  useEffect(() => {
    const adminCreds = loadCredentials('admin');
    if (adminCreds) {
      setAdminUsername(adminCreds.username);
      setAdminPassword(adminCreds.password);
      setRememberMe(prev => ({ ...prev, admin: true }));
    }
    
    const companyCreds = loadCredentials('company');
    if (companyCreds) {
      setCompanyId(companyCreds.username);
      setCompanyPhone(companyCreds.password);
      setRememberMe(prev => ({ ...prev, company: true }));
    }
    
    const siteCreds = loadCredentials('site');
    if (siteCreds) {
      setSiteId(siteCreds.username);
      setSitePhone(siteCreds.password);
      setRememberMe(prev => ({ ...prev, site: true }));
    }
    
    const personnelCreds = loadCredentials('personnel');
    if (personnelCreds) {
      setPersonnelUsername(personnelCreds.username);
      setPersonnelPassword(personnelCreds.password);
      setRememberMe(prev => ({ ...prev, personnel: true }));
    }
  }, []);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!adminUsername || !adminPassword) {
      setError('Lütfen tüm alanları doldurunuz.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const result = await login(adminUsername, adminPassword);
      
      if (result.error) {
        setError(result.error);
      } else {
        // Save credentials if remember me is checked
        if (rememberMe.admin) {
          saveCredentials('admin', adminUsername, adminPassword);
        } else {
          clearCredentials('admin');
        }
        // Redirect to dashboard
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Kullanıcı adı veya şifre hatalı. Lütfen bilgilerinizi kontrol ediniz.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyLogin = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!companyId || !companyPhone) {
      setError('Lütfen firma ID ve telefon numarasını giriniz.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // First verify company ID and phone
      const companies = await getCompanies();
      const company = companies.find(c => 
        String(c.id).toLowerCase() === String(companyId).toLowerCase() && 
        String(c.phone).replace(/\D/g, '') === String(companyPhone).replace(/\D/g, '')
      );
      
      if (!company) {
        setError('Firma ID veya telefon numarası hatalı.');
        setLoading(false);
        return;
      }
      
      // Check if company is active
      if (company.status !== 'active') {
        setError('Firma pasif durumda. Giriş yapılamaz.');
        setLoading(false);
        return;
      }
      
      // For company login, we'll use the company ID and phone as credentials
      const result = await login(companyId, companyPhone);
      
      if (result.error) {
        setError(result.error);
      } else {
        // Save credentials if remember me is checked
        if (rememberMe.company) {
          saveCredentials('company', companyId, companyPhone);
        } else {
          clearCredentials('company');
        }
        // Redirect to company dashboard
        navigate('/company-dashboard');
      }
    } catch (err) {
      setError('Giriş sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleSiteLogin = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!siteId || !sitePhone) {
      setError('Lütfen site ID ve telefon numarasını giriniz.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // For site login, we'll use the site ID and phone as credentials
      const result = await login(siteId, sitePhone);
      
      if (result.error) {
        setError(result.error);
      } else {
        // Save credentials if remember me is checked
        if (rememberMe.site) {
          saveCredentials('site', siteId, sitePhone);
        } else {
          clearCredentials('site');
        }
        // Redirect to dashboard
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Site ID veya telefon numarası hatalı.');
    } finally {
      setLoading(false);
    }
  };

  const handlePersonnelLogin = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!personnelUsername || !personnelPassword) {
      setError('Lütfen kullanıcı adı ve şifrenizi giriniz.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const result = await login(personnelUsername, personnelPassword);
      
      if (result.error) {
        setError(result.error);
      } else {
        // Save credentials if remember me is checked
        if (rememberMe.personnel) {
          saveCredentials('personnel', personnelUsername, personnelPassword);
        } else {
          clearCredentials('personnel');
        }
        // Redirect to dashboard
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Kullanıcı adı veya şifre hatalı. Lütfen bilgilerinizi kontrol ediniz.');
    } finally {
      setLoading(false);
    }
  };


  // Clear error when switching tabs
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError('');
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-3" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #e4edf9 100%)' }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 text-center mb-5">
            <div className="d-flex flex-column align-items-center">
              <div className="mb-3">
                <div className="rounded-circle d-flex align-items-center justify-content-center" 
                     style={{ 
                       width: '80px', 
                       height: '80px', 
                       background: 'linear-gradient(135deg, #0A66C2, #2ECC71)',
                       boxShadow: '0 10px 20px rgba(10, 102, 194, 0.2)'
                     }}>
                  <i className="bi bi-building" style={{ fontSize: '2rem', color: 'white' }}></i>
                </div>
              </div>
              <h1 className="h2 fw-bold text-dark">Apart Mecra</h1>
              <p className="text-muted mb-0">Kurumsal Yönetim Sistemi</p>
            </div>
          </div>
          
          <div className="col-12 col-md-8 col-lg-6 col-xl-5">
            <div className="card border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
              <div className="card-body p-4 p-md-5">
                <div className="d-flex justify-content-center mb-4">
                  <div className="d-flex bg-light rounded-pill p-1" style={{ width: '100%', maxWidth: '450px' }}>
                    <button 
                      className={`flex-fill border-0 rounded-pill py-2 px-2 fw-medium ${activeTab === 'admin' ? 'bg-primary text-white' : 'bg-transparent text-muted'}`}
                      onClick={() => handleTabChange('admin')}
                      style={{ transition: 'all 0.3s ease', fontSize: '0.8rem' }}
                    >
                      Yönetici
                    </button>
                    <button 
                      className={`flex-fill border-0 rounded-pill py-2 px-2 fw-medium ${activeTab === 'company' ? 'bg-primary text-white' : 'bg-transparent text-muted'}`}
                      onClick={() => handleTabChange('company')}
                      style={{ transition: 'all 0.3s ease', fontSize: '0.8rem' }}
                    >
                      Firma
                    </button>
                    <button 
                      className={`flex-fill border-0 rounded-pill py-2 px-2 fw-medium ${activeTab === 'site' ? 'bg-primary text-white' : 'bg-transparent text-muted'}`}
                      onClick={() => handleTabChange('site')}
                      style={{ transition: 'all 0.3s ease', fontSize: '0.8rem' }}
                    >
                      Site
                    </button>
                    <button 
                      className={`flex-fill border-0 rounded-pill py-2 px-2 fw-medium ${activeTab === 'personnel' ? 'bg-primary text-white' : 'bg-transparent text-muted'}`}
                      onClick={() => handleTabChange('personnel')}
                      style={{ transition: 'all 0.3s ease', fontSize: '0.8rem' }}
                    >
                      Personel
                    </button>
                  </div>
                </div>
                
                <div className="tab-content">
                  {error && (
                    <div className="alert alert-danger rounded-pill text-center py-2 mb-4" role="alert">
                      <small>{error}</small>
                    </div>
                  )}
                  
                  <div className={`tab-pane fade ${activeTab === 'admin' ? 'show active' : ''}`}>
                    <h2 className="h4 text-center mb-4 fw-bold text-dark">Yönetici Girişi</h2>
                    <form onSubmit={handleAdminLogin}>
                      <div className="mb-3">
                        <div className="input-group position-relative">
                          <span className="input-group-text bg-light border-0 rounded-start-pill" style={{ paddingLeft: '20px' }}>
                            <i className="bi bi-person text-muted"></i>
                          </span>
                          <input
                            type="text"
                            className="form-control border-0 rounded-end-pill ps-3"
                            placeholder="Kullanıcı adınızı girin"
                            value={adminUsername}
                            onChange={(e) => setAdminUsername(e.target.value)}
                            disabled={loading}
                            style={{ backgroundColor: '#f8f9fa' }}
                          />
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <div className="input-group position-relative">
                          <span className="input-group-text bg-light border-0 rounded-start-pill" style={{ paddingLeft: '20px' }}>
                            <i className="bi bi-lock text-muted"></i>
                          </span>
                            <input
                            type={showAdminPassword ? "text" : "password"}
                            className="form-control border-0 rounded-end-pill ps-3 pe-5"
                            placeholder="Şifrenizi girin"
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            disabled={loading}
                            style={{ backgroundColor: '#f8f9fa' }}
                          />
                          <button
                            type="button"
                            className="btn btn-link position-absolute end-0 top-50 translate-middle-y me-3 p-0"
                            onClick={() => setShowAdminPassword(!showAdminPassword)}
                            style={{ 
                              border: 'none', 
                              background: 'none', 
                              color: '#6c757d',
                              zIndex: 10
                            }}
                          >
                            <i className={`bi ${showAdminPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                          </button>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="rememberAdmin"
                            checked={rememberMe.admin}
                            onChange={(e) => setRememberMe(prev => ({ ...prev, admin: e.target.checked }))}
                          />
                          <label className="form-check-label small text-muted" htmlFor="rememberAdmin">
                            Şifremi hatırla
                          </label>
                        </div>
                      </div>
                      
                      <button
                        type="submit"
                        className="w-100 btn btn-primary rounded-pill py-3 fw-bold shadow-sm"
                        disabled={loading}
                        style={{ 
                          background: 'linear-gradient(135deg, #0A66C2, #2ECC71)',
                          border: 'none',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {loading ? (
                          <span>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Giriş yapılıyor...
                          </span>
                        ) : 'Giriş Yap'}
                      </button>
                      
                    </form>
                  </div>
                  
                  <div className={`tab-pane fade ${activeTab === 'company' ? 'show active' : ''}`}>
                    <h2 className="h4 text-center mb-4 fw-bold text-dark">Firma Girişi</h2>
                    <form onSubmit={handleCompanyLogin}>
                      <div className="mb-3">
                        <div className="input-group position-relative">
                          <span className="input-group-text bg-light border-0 rounded-start-pill" style={{ paddingLeft: '20px' }}>
                            <i className="bi bi-building text-muted"></i>
                          </span>
                          <input
                            type="text"
                            className="form-control border-0 rounded-end-pill ps-3"
                            placeholder="Firma ID'nizi girin"
                            value={companyId}
                            onChange={(e) => setCompanyId(e.target.value)}
                            style={{ backgroundColor: '#f8f9fa' }}
                          />
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <div className="input-group position-relative">
                          <span className="input-group-text bg-light border-0 rounded-start-pill" style={{ paddingLeft: '20px' }}>
                            <i className="bi bi-telephone text-muted"></i>
                          </span>
                          <input
                            type="tel"
                            className="form-control border-0 rounded-end-pill ps-3"
                            placeholder="Telefon numaranızı girin"
                            value={companyPhone}
                            onChange={(e) => setCompanyPhone(e.target.value)}
                            style={{ backgroundColor: '#f8f9fa' }}
                          />
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="rememberCompany"
                            checked={rememberMe.company}
                            onChange={(e) => setRememberMe(prev => ({ ...prev, company: e.target.checked }))}
                          />
                          <label className="form-check-label small text-muted" htmlFor="rememberCompany">
                            Şifremi hatırla
                          </label>
                        </div>
                      </div>
                      
                      <button
                        type="submit"
                        className="w-100 btn btn-primary rounded-pill py-3 fw-bold shadow-sm"
                        disabled={loading}
                        style={{ 
                          background: 'linear-gradient(135deg, #0A66C2, #2ECC71)',
                          border: 'none',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {loading ? (
                          <span>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Giriş yapılıyor...
                          </span>
                        ) : 'Firma Girişi Yap'}
                      </button>
                      
                      <div className="mt-4 text-center small text-muted px-3">
                        Firma olarak giriş yapmak için firma ID'niz, telefon numaranız, kullanıcı adınız ve şifrenizi kullanacaksınız.
                      </div>
                    </form>
                  </div>
                  
                  <div className={`tab-pane fade ${activeTab === 'site' ? 'show active' : ''}`}>
                    <h2 className="h4 text-center mb-4 fw-bold text-dark">Site Girişi</h2>
                    <form onSubmit={handleSiteLogin}>
                      <div className="mb-3">
                        <div className="input-group position-relative">
                          <span className="input-group-text bg-light border-0 rounded-start-pill" style={{ paddingLeft: '20px' }}>
                            <i className="bi bi-geo-alt text-muted"></i>
                          </span>
                          <input
                            type="text"
                            className="form-control border-0 rounded-end-pill ps-3"
                            placeholder="Site ID'nizi girin"
                            value={siteId}
                            onChange={(e) => setSiteId(e.target.value)}
                            style={{ backgroundColor: '#f8f9fa' }}
                          />
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <div className="input-group position-relative">
                          <span className="input-group-text bg-light border-0 rounded-start-pill" style={{ paddingLeft: '20px' }}>
                            <i className="bi bi-telephone text-muted"></i>
                          </span>
                          <input
                            type="tel"
                            className="form-control border-0 rounded-end-pill ps-3"
                            placeholder="Telefon numaranızı girin"
                            value={sitePhone}
                            onChange={(e) => setSitePhone(e.target.value)}
                            style={{ backgroundColor: '#f8f9fa' }}
                          />
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="rememberSite"
                            checked={rememberMe.site}
                            onChange={(e) => setRememberMe(prev => ({ ...prev, site: e.target.checked }))}
                          />
                          <label className="form-check-label small text-muted" htmlFor="rememberSite">
                            Şifremi hatırla
                          </label>
                        </div>
                      </div>
                      
                      <button
                        type="submit"
                        className="w-100 btn btn-primary rounded-pill py-3 fw-bold shadow-sm"
                        disabled={loading}
                        style={{ 
                          background: 'linear-gradient(135deg, #0A66C2, #2ECC71)',
                          border: 'none',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {loading ? (
                          <span>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Giriş yapılıyor...
                          </span>
                        ) : 'Site Girişi Yap'}
                      </button>
                      
                      <div className="mt-4 text-center small text-muted px-3">
                        Site olarak giriş yapmak için site ID'niz, telefon numaranız, kullanıcı adınız ve şifrenizi kullanacaksınız.
                      </div>
                    </form>
                  </div>
                  
                  <div className={`tab-pane fade ${activeTab === 'personnel' ? 'show active' : ''}`}>
                    <h2 className="h4 text-center mb-4 fw-bold text-dark">Personel Girişi</h2>
                    <form onSubmit={handlePersonnelLogin}>
                      <div className="mb-3">
                        <div className="input-group position-relative">
                          <span className="input-group-text bg-light border-0 rounded-start-pill" style={{ paddingLeft: '20px' }}>
                            <i className="bi bi-person text-muted"></i>
                          </span>
                          <input
                            type="text"
                            className="form-control border-0 rounded-end-pill ps-3"
                            placeholder="Kullanıcı adınızı girin"
                            value={personnelUsername}
                            onChange={(e) => setPersonnelUsername(e.target.value)}
                            disabled={loading}
                            style={{ backgroundColor: '#f8f9fa' }}
                          />
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <div className="input-group position-relative">
                          <span className="input-group-text bg-light border-0 rounded-start-pill" style={{ paddingLeft: '20px' }}>
                            <i className="bi bi-lock text-muted"></i>
                          </span>
                          <input
                            type={showPersonnelPassword ? "text" : "password"}
                            className="form-control border-0 rounded-end-pill ps-3 pe-5"
                            placeholder="Şifrenizi girin"
                            value={personnelPassword}
                            onChange={(e) => setPersonnelPassword(e.target.value)}
                            disabled={loading}
                            style={{ backgroundColor: '#f8f9fa' }}
                          />
                          <button
                            type="button"
                            className="btn btn-link position-absolute end-0 top-50 translate-middle-y me-3 p-0"
                            onClick={() => setShowPersonnelPassword(!showPersonnelPassword)}
                            style={{ 
                              border: 'none', 
                              background: 'none', 
                              color: '#6c757d',
                              zIndex: 10
                            }}
                          >
                            <i className={`bi ${showPersonnelPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                          </button>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="rememberPersonnel"
                            checked={rememberMe.personnel}
                            onChange={(e) => setRememberMe(prev => ({ ...prev, personnel: e.target.checked }))}
                          />
                          <label className="form-check-label small text-muted" htmlFor="rememberPersonnel">
                            Şifremi hatırla
                          </label>
                        </div>
                      </div>
                      
                      <button
                        type="submit"
                        className="w-100 btn btn-primary rounded-pill py-3 fw-bold shadow-sm"
                        disabled={loading}
                        style={{ 
                          background: 'linear-gradient(135deg, #0A66C2, #2ECC71)',
                          border: 'none',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {loading ? (
                          <span>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Giriş yapılıyor...
                          </span>
                        ) : 'Personel Girişi Yap'}
                      </button>
                      
                    </form>
                  </div>
                  
                </div>
              </div>
            </div>
            
            <div className="text-center mt-4">
              <a href="/" className="text-muted small text-decoration-none">
                <i className="bi bi-arrow-left me-1"></i>
                Giriş sayfasına geri dön
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;