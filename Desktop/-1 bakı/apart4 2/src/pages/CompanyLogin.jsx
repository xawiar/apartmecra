import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCompanies, getAgreements } from '../services/api';

const CompanyLogin = () => {
  const [companyId, setCompanyId] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Check for query parameters when component mounts
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const companyIdParam = queryParams.get('companyId');
    const phoneParam = queryParams.get('phone');
    
    if (companyIdParam && phoneParam) {
      setCompanyId(companyIdParam);
      setPhone(phoneParam);
      setInfoMessage('Lütfen giriş bilgilerinizi kontrol edin ve onaylayın');
    }
  }, [location]);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!companyId || !phone) {
      setError('Lütfen firma ID ve telefon numarasını giriniz.');
      return;
    }
    
    setLoading(true);
    setError('');
    setInfoMessage('');
    
    try {
      // Get all companies and agreements to find matching company and check agreement status
      const [companies, agreements] = await Promise.all([
        getCompanies(),
        getAgreements()
      ]);
      
      const company = companies.find(c => 
        String(c.id).toLowerCase() === String(companyId).toLowerCase() && 
        String(c.phone).replace(/\D/g, '') === String(phone).replace(/\D/g, '')
      );
      
      if (company) {
        // Check if company has any active agreements
        const companyAgreements = agreements.filter(a => 
          String(a.companyId) === String(company.id) && a.status === 'active'
        );
        
        // If company has no active agreements, deny login
        if (companyAgreements.length === 0) {
          setError('Firmanın aktif anlaşması bulunmamaktadır. Giriş yapılamaz.');
          setLoading(false);
          return;
        }
        
        // Check if company is marked as active
        if (company.status !== 'active') {
          setError('Firma pasif durumda. Giriş yapılamaz.');
          setLoading(false);
          return;
        }
        
        // Store company info in localStorage
        const companyUser = {
          id: company.id,
          name: company.name,
          role: 'company',
          phone: company.phone
        };
        
        localStorage.setItem('token', `company-token-${company.id}`);
        localStorage.setItem('user', JSON.stringify(companyUser));
        
        // Redirect to company dashboard
        navigate('/company-dashboard');
      } else {
        setError('Firma ID veya telefon numarası hatalı.');
      }
    } catch (err) {
      setError('Giriş sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-gradient-primary p-4">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 text-center mb-5">
            <div className="logo-wrapper mx-auto mb-4">
              <div className="logo bg-white rounded-circle shadow d-flex align-items-center justify-content-center mx-auto" 
                   style={{width: '80px', height: '80px'}}>
                <span className="text-primary fw-bold fs-2">F</span>
              </div>
            </div>
            <h1 className="display-5 fw-bold text-white">Firma Girişi</h1>
            <p className="lead text-white-50">Firma ID ve telefon numarası ile giriş yapın</p>
          </div>
          
          <div className="col-12 col-md-8 col-lg-6 col-xl-5">
            <div className="card border-0 shadow-lg rounded-4">
              <div className="card-body p-4 p-md-5">
                {infoMessage && (
                  <div className="alert alert-info d-flex align-items-center mb-4" role="alert">
                    <i className="bi bi-info-circle-fill me-2"></i>
                    <div>{infoMessage}</div>
                  </div>
                )}
                
                {error && (
                  <div className="alert alert-danger alert-custom d-flex align-items-center mb-4" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    <div>{error}</div>
                  </div>
                )}
                
                <form onSubmit={handleLogin}>
                  <div className="mb-3">
                    <label htmlFor="companyId" className="form-label fw-bold">
                      Firma ID
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0">
                        <i className="bi bi-building text-primary"></i>
                      </span>
                      <input
                        type="text"
                        id="companyId"
                        className="form-control form-control-lg border-start-0"
                        placeholder="Firma ID'nizi girin"
                        value={companyId}
                        onChange={(e) => setCompanyId(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="phone" className="form-label fw-bold">
                      Telefon Numarası
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0">
                        <i className="bi bi-telephone text-primary"></i>
                      </span>
                      <input
                        type="tel"
                        id="phone"
                        className="form-control form-control-lg border-start-0"
                        placeholder="Telefon numaranızı girin"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    className="w-100 btn btn-primary btn-lg d-flex align-items-center justify-content-center mb-4"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                        Giriş yapılıyor...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-box-arrow-in-right me-2"></i>
                        Giriş Yap
                      </>
                    )}
                  </button>
                  
                  <div className="text-center">
                    <button
                      type="button"
                      className="btn btn-link text-decoration-none"
                      onClick={() => navigate('/')}
                    >
                      <i className="bi bi-arrow-left me-1"></i>
                      Farklı bir kullanıcı tipiyle giriş yap
                    </button>
                  </div>
                </form>
              </div>
            </div>
            
            <div className="text-center mt-4">
              <div className="small text-white-50">
                <p className="mb-1">Firma ID'niz firma eklendiğinde otomatik olarak oluşturulur.</p>
                <p className="mb-0">Giriş yaptıktan sonra aktif anlaşmalarınızı, siteleri, blokları ve panelleri görsel olarak görüntüleyebilirsiniz.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .bg-gradient-primary {
          background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
        }
        
        .logo-wrapper {
          width: 90px;
          height: 90px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .form-control:focus {
          border-color: #86b7fe;
          box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%);
          border: none;
          padding: 0.75rem 1.5rem;
        }
        
        .btn-primary:hover {
          background: linear-gradient(135deg, #0b5ed7 0%, #0a58ca 100%);
        }
      `}</style>
    </div>
  );
};

export default CompanyLogin;