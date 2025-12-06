import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getAgreements, getSites, getCompanies, getTransactions, getPanelImages } from '../services/api';
import { getUser } from '../utils/auth';
import { useNavigate } from 'react-router-dom';

// Import helper functions
const AgreementHelpers = ({
  companies = [],
  sites = [],
  agreements = [],
  sitePanelSelections = {},
  selectedWeeks = [],
  formData = {}
}) => {
  // Get company name by ID
  const getCompanyName = (companyId) => {
    // Handle both string and number IDs by converting to string for comparison
    const company = companies.find(c => String(c.id) === String(companyId));
    return company ? company.name : 'Bilinmeyen Firma';
  };

  // Get site name by ID
  const getSiteName = (siteId) => {
    // Handle both string and number IDs by converting to string for comparison
    const site = sites.find(s => String(s.id) === String(siteId));
    return site ? site.name : '';
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  // Check if two date ranges overlap
  const dateRangesOverlap = (start1, end1, start2, end2) => {
    return start1 <= end2 && start2 <= end1;
  };

  // Generate block labels (A, B, C, etc.)
  const generateBlockLabels = (blockCount) => {
    const labels = [];
    for (let i = 0; i < blockCount; i++) {
      labels.push(String.fromCharCode(65 + i)); // A, B, C, etc.
    }
    return labels;
  };

  // Get information about which agreement is using a specific panel
  const getPanelUsageInfo = (siteId, blockId, panelId, startDate, endDate) => {
    if (!startDate || !endDate) return null;
    
    const siteAgreements = agreements.filter(agreement => 
      agreement.siteIds && agreement.siteIds.includes(siteId) &&
      agreement.status === 'active'
    );
    
    const newStart = new Date(startDate);
    const newEnd = new Date(endDate);
    
    for (const agreement of siteAgreements) {
      const existingStart = new Date(agreement.startDate);
      const existingEnd = new Date(agreement.endDate);
      
      if (dateRangesOverlap(newStart, newEnd, existingStart, existingEnd)) {
        if (agreement.siteBlockSelections && agreement.siteBlockSelections[siteId]) {
          const usedBlocks = agreement.siteBlockSelections[siteId];
          if (usedBlocks.includes(blockId)) {
            if (agreement.sitePanelSelections && 
                agreement.sitePanelSelections[siteId] && 
                agreement.sitePanelSelections[siteId][blockId] &&
                agreement.sitePanelSelections[siteId][blockId].includes(panelId)) {
              return {
                agreementId: agreement.id,
                companyName: getCompanyName(agreement.companyId),
                startDate: agreement.startDate,
                endDate: agreement.endDate
              };
            }
          }
        }
      }
    }
    
    return null;
  };

  return {
    getCompanyName,
    getSiteName,
    formatCurrency,
    dateRangesOverlap,
    generateBlockLabels,
    getPanelUsageInfo
  };
};

const CompanyDashboard = () => {
  const [agreements, setAgreements] = useState([]);
  const [sites, setSites] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAgreements: 0,
    activeAgreements: 0,
    totalSites: 0,
    totalPanels: 0,
    totalRevenue: 0,
    paidAmount: 0,
    unpaidAmount: 0,
    paidAgreements: 0,
    unpaidAgreements: 0
  });
  const [transactions, setTransactions] = useState([]); // Add transactions state
  const [panelImages, setPanelImages] = useState([]);
  const [showAgreementHistory, setShowAgreementHistory] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [filteredAgreements, setFilteredAgreements] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  
  // Memoize user and companyId to prevent unnecessary re-renders
  const user = useMemo(() => getUser(), []);
  const companyId = useMemo(() => {
    const currentUser = getUser();
    return currentUser?.companyId || currentUser?.id;
  }, []);
  
  // Use ref to track if data has been fetched
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    // Prevent multiple fetches
    if (hasFetchedRef.current) {
      return;
    }
    
    let isMounted = true;
    let retryTimeout = null;
    let retryCount = 0;
    const maxRetries = 1; // Reduced to 1 retry to prevent infinite loops
    
    const fetchData = async (isRetry = false) => {
      if (!companyId) {
        if (isMounted) {
          navigate('/');
        }
        return;
      }

      try {
        const [allAgreements, allSites, allCompanies, allTransactions, panelImagesResult] = await Promise.all([
          getAgreements(),
          getSites(),
          getCompanies(),
          getTransactions(),
          getPanelImages({ companyId: companyId }).catch(err => {
            console.warn('Error fetching panel images (non-critical):', err);
            return [];
          })
        ]);
        
        const allPanelImages = Array.isArray(panelImagesResult) ? panelImagesResult : (panelImagesResult?.data || []);
        
        if (!isMounted) return;
        
        // Filter agreements for this company
        const companyAgreements = allAgreements.filter(agreement => 
          String(agreement.companyId) === String(companyId)
        );
        
        // Get company information
        const companyInfo = allCompanies.find(c => String(c.id) === String(companyId)) || null;
        
        setAgreements(companyAgreements);
        setSites(allSites);
        setCompany(companyInfo);
        setTransactions(allTransactions);
        setPanelImages(allPanelImages);
        setFilteredAgreements(companyAgreements);
        
        // Calculate statistics
        const activeAgreements = companyAgreements.filter(a => a.status === 'active').length;
        const totalSites = new Set(
          companyAgreements.flatMap(a => a.siteIds || [])
        ).size;
        
        const totalPanels = companyAgreements.reduce((sum, agreement) => {
          return sum + Object.values(agreement.sitePanelCounts || {}).reduce((siteSum, count) => siteSum + parseInt(count || 0), 0);
        }, 0);
        
        const totalRevenue = companyAgreements.reduce((sum, agreement) => sum + (agreement.totalAmount || 0), 0);
        
        // Calculate paid and unpaid amounts
        const paidAgreements = companyAgreements.filter(a => a.paymentReceived || a.creditPaymentReceived);
        const unpaidAgreements = companyAgreements.filter(a => !a.paymentReceived && !a.creditPaymentReceived);
        
        const paidAmount = paidAgreements.reduce((sum, agreement) => sum + (agreement.totalAmount || 0), 0);
        const unpaidAmount = unpaidAgreements.reduce((sum, agreement) => sum + (agreement.totalAmount || 0), 0);
        
        setStats({
          totalAgreements: companyAgreements.length,
          activeAgreements,
          totalSites,
          totalPanels,
          totalRevenue,
          paidAmount,
          unpaidAmount,
          paidAgreements: paidAgreements.length,
          unpaidAgreements: unpaidAgreements.length
        });
        
        retryCount = 0; // Reset retry count on success
        hasFetchedRef.current = true; // Mark as fetched
        if (isMounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching company data:', error);
        
        if (!isRetry) {
          retryCount = 1; // First error
        } else {
          retryCount++; // Increment on retry
        }
        
        // Only retry once if it's a network error
        if (retryCount <= maxRetries && isMounted && error.message?.includes('fetch')) {
          // Clear any existing timeout
          if (retryTimeout) {
            clearTimeout(retryTimeout);
          }
          
          // Retry after 3 seconds (increased delay)
          retryTimeout = setTimeout(() => {
            if (isMounted) {
              fetchData(true);
            }
          }, 3000);
        } else {
          // Max retries reached or not a network error
          if (isMounted) {
            setLoading(false);
            if (retryCount > maxRetries) {
              console.error('Max retries reached. Please check if JSON Server is running on port 3001.');
            }
          }
        }
      }
    };

    fetchData();
    
    return () => {
      isMounted = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
    // Only run once on mount - companyId is memoized
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once

  // Initialize helper functions
  const helpers = AgreementHelpers({
    companies: company ? [company] : [],
    sites,
    agreements
  });

  // Get site name by ID
  const getSiteName = (siteId) => {
    const site = sites.find(s => String(s.id) === String(siteId));
    return site ? site.name : 'Bilinmeyen Site';
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  // Get panel count for a specific site in an agreement
  const getPanelCountForSite = (agreement, siteId) => {
    return agreement.sitePanelCounts?.[siteId] || 0;
  };

  // Get active sites for an agreement
  const getActiveSites = (agreement) => {
    return (agreement.siteIds || []).map(siteId => ({
      id: siteId,
      name: getSiteName(siteId),
      panels: getPanelCountForSite(agreement, siteId)
    }));
  };

  // Get site details by ID
  const getSiteById = (siteId) => {
    return sites.find(s => String(s.id) === String(siteId)) || null;
  };

  // Get payment transactions for the current company
  const getCompanyPayments = () => {
    if (!company || !transactions.length) return [];
    return transactions.filter(transaction => 
      transaction.type === 'income' && 
      transaction.source.includes('Anlaşma Ödemesi') &&
      transaction.source.includes(company.name)
    );
  };

  // Get company agreements and payments for display
  const companyAgreements = agreements;
  const companyPayments = getCompanyPayments();

  // Filter agreements by date
  const filterAgreementsByDate = (date) => {
    if (!date) {
      setFilteredAgreements(agreements);
      return;
    }
    
    const filtered = agreements.filter(agreement => {
      const agreementDate = new Date(agreement.startDate);
      const selectedDateObj = new Date(date);
      return agreementDate.toDateString() === selectedDateObj.toDateString();
    });
    setFilteredAgreements(filtered);
  };

  // Handle date filter change
  const handleDateFilterChange = (date) => {
    setSelectedDate(date);
    filterAgreementsByDate(date);
  };







  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <div className="loading-spinner mx-auto"></div>
          <p className="mt-3 text-muted">Firma bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/');
    return null;
  }

  return (
    <div className="container-fluid">
      <div className="row">
        {/* Left Sidebar - Menu */}
        <div className={`col-md-3 ${sidebarOpen ? '' : 'd-none'}`}>
          <div className="card custom-card shadow-sm sticky-top" style={{ top: '20px', maxHeight: 'calc(100vh - 40px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="card-header bg-primary-subtle d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-menu-button-wide me-2"></i>
                Menü
              </h5>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setSidebarOpen(false)}
                title="Menüyü Kapat"
              >
                <i className="bi bi-chevron-left"></i>
              </button>
            </div>
            <div className="card-body p-0" style={{ overflowY: 'auto', flex: 1 }}>
              <div className="list-group list-group-flush">
                <button
                  type="button"
                  className={`list-group-item list-group-item-action ${window.location.pathname === '/company-dashboard' ? 'active' : ''}`}
                  onClick={() => navigate('/company-dashboard')}
                >
                  <i className="bi bi-speedometer2 me-2"></i>
                  Firma Panosu
                </button>
                <button
                  type="button"
                  className={`list-group-item list-group-item-action ${window.location.pathname === '/company-orders' ? 'active' : ''}`}
                  onClick={() => navigate('/company-orders')}
                >
                  <i className="bi bi-cart-plus me-2"></i>
                  Sipariş Oluştur
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className={sidebarOpen ? 'col-md-9' : 'col-md-12'}>
          {/* Sidebar Toggle Button (when closed) */}
          {!sidebarOpen && (
            <button
              className="btn btn-outline-primary mb-3"
              onClick={() => setSidebarOpen(true)}
            >
              <i className="bi bi-list me-2"></i>
              Menüyü Aç
            </button>
          )}

          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h3 fw-bold">{company?.name || user?.name || company?.id || companyId || 'Firma'} - Firma Panosu</h2>
          <p className="text-muted mb-0">Firma ID: {companyId}</p>
        </div>
        <div className="text-end">
          <button 
            className="btn btn-outline-danger"
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              navigate('/');
            }}
          >
            <i className="bi bi-box-arrow-right me-1"></i>
            Çıkış Yap
          </button>
        </div>
      </div>

      {/* Credit Information Section */}
      {company && (
        <div className="row g-4 mb-4">
          <div className="col-md-12">
            <div className="card custom-card shadow-sm">
              <div className="card-header bg-info-subtle">
                <h5 className="mb-0 fw-bold">
                  <i className="bi bi-credit-card me-2"></i>
                  Kredi Bilgileri
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-lg-3 col-md-6">
                    <div className="card h-100 border-info">
                      <div className="card-body text-center">
                        <i className="bi bi-wallet fs-1 text-info mb-2"></i>
                        <h6 className="card-title">Mevcut Kredi</h6>
                        <h3 className="card-text text-info">{company.credit || 0} Panel</h3>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-lg-3 col-md-6">
                    <div className="card h-100 border-success">
                      <div className="card-body text-center">
                        <i className="bi bi-currency-dollar fs-1 text-success mb-2"></i>
                        <h6 className="card-title">Toplam Kredi Satın Alımı</h6>
                        <h3 className="card-text text-success">
                          {company.creditHistory ? company.creditHistory.length : 0}
                        </h3>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-lg-3 col-md-6">
                    <div className="card h-100 border-warning">
                      <div className="card-body text-center">
                        <i className="bi bi-tag fs-1 text-warning mb-2"></i>
                        <h6 className="card-title">Toplam Kredi Paneli</h6>
                        <h3 className="card-text text-warning">
                          {company.creditHistory ? company.creditHistory.reduce((sum, credit) => sum + (credit.panelCount || 0), 0) : 0} Panel
                        </h3>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-lg-3 col-md-6">
                    <div className="card h-100 border-primary">
                      <div className="card-body text-center">
                        <i className="bi bi-cash fs-1 text-primary mb-2"></i>
                        <h6 className="card-title">Toplam Kredi Tutarı</h6>
                        <h4 className="card-text text-primary">
                          {formatCurrency(company.creditHistory ? company.creditHistory.reduce((sum, credit) => sum + (credit.totalAmount || 0), 0) : 0)}
                        </h4>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Credit History Table */}
                {company.creditHistory && company.creditHistory.length > 0 && (
                  <div className="mt-4">
                    <h6 className="fw-bold mb-3">
                      <i className="bi bi-clock-history me-2"></i>
                      Kredi Geçmişi
                    </h6>
                    <div className="table-responsive">
                      <table className="table custom-table">
                        <thead>
                          <tr>
                            <th>Tarih</th>
                            <th>Panel Sayısı</th>
                            <th>Panel Ücreti</th>
                            <th>Toplam Tutar</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...company.creditHistory].reverse().map((credit, index) => (
                            <tr key={index}>
                              <td>{formatDate(credit.purchaseDate)}</td>
                              <td>{credit.panelCount} Panel</td>
                              <td>{formatCurrency(credit.panelPrice)}</td>
                              <td className="fw-bold">{formatCurrency(credit.totalAmount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="row g-3 mb-4">
        <div className="col-lg-2 col-md-4">
          <div className="card custom-card bg-primary text-white">
            <div className="card-body text-center">
              <i className="bi bi-file-earmark-text fs-1 mb-2"></i>
              <h6 className="card-title">Toplam Anlaşma</h6>
              <h3 className="card-text">{stats.totalAgreements}</h3>
            </div>
          </div>
        </div>
        <div className="col-lg-2 col-md-4">
          <div className="card custom-card bg-success text-white">
            <div className="card-body text-center">
              <i className="bi bi-check-circle fs-1 mb-2"></i>
              <h6 className="card-title">Aktif Anlaşma</h6>
              <h3 className="card-text">{stats.activeAgreements}</h3>
            </div>
          </div>
        </div>
        <div className="col-lg-2 col-md-4">
          <div className="card custom-card bg-info text-white">
            <div className="card-body text-center">
              <i className="bi bi-building fs-1 mb-2"></i>
              <h6 className="card-title">Toplam Site</h6>
              <h3 className="card-text">{stats.totalSites}</h3>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="card custom-card bg-warning text-white">
            <div className="card-body text-center">
              <i className="bi bi-tv fs-1 mb-2"></i>
              <h6 className="card-title">Toplam Panel</h6>
              <h3 className="card-text">{stats.totalPanels}</h3>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="card custom-card bg-success text-white">
            <div className="card-body text-center">
              <i className="bi bi-currency-dollar fs-1 mb-2"></i>
              <h6 className="card-title">Toplam Tutar</h6>
              <h4 className="card-text">{formatCurrency(stats.totalRevenue)}</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Status Cards */}
      <div className="row g-3 mb-4">
        <div className="col-lg-3 col-md-6">
          <div className="card custom-card bg-success text-white">
            <div className="card-body text-center">
              <i className="bi bi-check-circle fs-1 mb-2"></i>
              <h6 className="card-title">Ödenmiş Anlaşma</h6>
              <h3 className="card-text">{stats.paidAgreements}</h3>
              <p className="card-text small">{formatCurrency(stats.paidAmount)}</p>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="card custom-card bg-warning text-white">
            <div className="card-body text-center">
              <i className="bi bi-clock fs-1 mb-2"></i>
              <h6 className="card-title">Ödenmemiş Anlaşma</h6>
              <h3 className="card-text">{stats.unpaidAgreements}</h3>
              <p className="card-text small">{formatCurrency(stats.unpaidAmount)}</p>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="card custom-card bg-info text-white">
            <div className="card-body text-center">
              <i className="bi bi-percent fs-1 mb-2"></i>
              <h6 className="card-title">Ödeme Oranı</h6>
              <h3 className="card-text">
                {stats.totalAgreements > 0 
                  ? Math.round((stats.paidAgreements / stats.totalAgreements) * 100) 
                  : 0}%
              </h3>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="card custom-card bg-primary text-white">
            <div className="card-body text-center">
              <i className="bi bi-arrow-up-circle fs-1 mb-2"></i>
              <h6 className="card-title">Bekleyen Ödeme</h6>
              <h3 className="card-text">{formatCurrency(stats.unpaidAmount)}</h3>
            </div>
          </div>
        </div>
      </div>

       {/* Agreement History Section */}
       <div className="row g-4 mb-4">
         <div className="col-md-12">
           <div className="card custom-card shadow-sm">
             <div 
               className="card-header bg-primary-subtle cursor-pointer"
               onClick={() => setShowAgreementHistory(!showAgreementHistory)}
               style={{ cursor: 'pointer' }}
             >
               <div className="d-flex justify-content-between align-items-center">
                   <h5 className="mb-0 fw-bold">
                     <i className="bi bi-file-earmark-text me-2"></i>
                     Anlaşma Geçmişi
                   </h5>
                   <i className={`bi bi-chevron-${showAgreementHistory ? 'up' : 'down'}`}></i>
               </div>
             </div>
             {showAgreementHistory && (
               <div className="card-body">
                 {/* Date Filter */}
                 <div className="row mb-3">
                   <div className="col-md-4">
                     <label className="form-label">Tarihe Göre Filtrele:</label>
                     <input
                       type="date"
                       className="form-control"
                       value={selectedDate}
                       onChange={(e) => handleDateFilterChange(e.target.value)}
                     />
                   </div>
                   <div className="col-md-2 d-flex align-items-end">
                     <button
                       className="btn btn-outline-secondary"
                       onClick={() => {
                         setSelectedDate('');
                         setFilteredAgreements(agreements);
                       }}
                     >
                       Temizle
                     </button>
                   </div>
                 </div>

                 {/* Agreements Table */}
                 {filteredAgreements.length === 0 ? (
                   <div className="text-center py-4">
                     <i className="bi bi-file-earmark text-muted fs-1"></i>
                     <p className="text-muted mt-2">
                       {selectedDate ? 'Seçilen tarihte anlaşma bulunamadı.' : 'Henüz anlaşma bulunmamaktadır.'}
                     </p>
                   </div>
                 ) : (
                   <div className="table-responsive">
                     <table className="table custom-table">
                       <thead>
                         <tr>
                           <th>Başlangıç Tarihi</th>
                           <th>Bitiş Tarihi</th>
                           <th>Süre (Hafta)</th>
                           <th>Toplam Panel</th>
                           <th>Birim Fiyat (₺)</th>
                           <th>Toplam Tutar</th>
                           <th>Ödenen Tutar</th>
                           <th>Durum</th>
                         </tr>
                       </thead>
                       <tbody>
                         {filteredAgreements.map((agreement) => {
                           // Calculate total panels for this agreement
                           const totalPanels = Object.values(agreement.sitePanelCounts || {}).reduce(
                             (sum, count) => sum + parseInt(count || 0), 0
                           );
                           
                           // Find payment for this agreement
                           const payment = companyPayments.find(p => 
                             p.description && p.description.includes(agreement.id)
                           );
                           
                           return (
                             <tr key={agreement.id}>
                               <td>{formatDate(agreement.startDate)}</td>
                               <td>{formatDate(agreement.endDate)}</td>
                               <td>{agreement.totalWeeks}</td>
                               <td>{totalPanels}</td>
                               <td>{formatCurrency(agreement.weeklyRatePerPanel)}</td>
                               <td className="fw-bold">{formatCurrency(agreement.totalAmount)}</td>
                               <td>
                                 {payment ? (
                                   <span className="text-success fw-bold">{formatCurrency(payment.amount)}</span>
                                 ) : (
                                   <span className="text-muted">Ödeme yapılmadı</span>
                                 )}
                               </td>
                               <td>
                                 <span className={`badge ${
                                   agreement.status === 'active' 
                                     ? 'bg-success-subtle text-success-emphasis' 
                                     : 'bg-danger-subtle text-danger-emphasis'
                                 }`}>
                                   {agreement.status === 'active' ? 'Aktif' : 'Pasif'}
                                 </span>
                               </td>
                             </tr>
                           );
                         })}
                       </tbody>
                     </table>
                   </div>
                 )}
               </div>
             )}
           </div>
         </div>
       </div>

       {/* Active Agreement Panels */}
       {companyAgreements.filter(a => a.status === 'active').length > 0 && (
         <div className="row g-4 mb-4">
           <div className="col-md-12">
             <div className="card custom-card shadow-sm">
               <div className="card-header bg-success-subtle">
                 <h5 className="mb-0 fw-bold">
                   <i className="bi bi-tv me-2"></i>
                   Aktif Anlaşma Panelleri
                 </h5>
               </div>
               <div className="card-body">
                 <div className="row g-4">
                   {companyAgreements.filter(a => a.status === 'active').map((agreement) => (
                     <div key={agreement.id} className="col-lg-12">
                       <div className="card border-success h-100">
                         <div className="card-header bg-success-subtle">
                           <div className="d-flex justify-content-between align-items-center">
                             <div>
                               <h6 className="mb-0 fw-bold">
                                 <i className="bi bi-file-earmark-text me-2"></i>
                                 Anlaşma ID: {agreement.id}
                               </h6>
                               <small className="text-muted">
                                 {formatDate(agreement.startDate)} - {formatDate(agreement.endDate)}
                               </small>
                             </div>
                             <div className="fw-bold text-success">
                               {formatCurrency(agreement.totalAmount)}
                             </div>
                           </div>
                         </div>
                         <div className="card-body">
                           {/* Sites, Blocks, and Panels */}
                           <div className="row g-3">
                             {(agreement.siteIds || []).map((siteId) => {
                               const site = getSiteById(siteId);
                               if (!site) return null;
                               
                               const blockCount = site.siteType === 'business_center' ? 1 : (parseInt(site.blocks) || 0);
                               const elevatorsPerBlock = parseInt(site.elevatorsPerBlock) || 0;
                               // İş merkezleri için panel sayısını doğrudan al, normal siteler için hesapla
                               const panelsPerBlock = site.siteType === 'business_center' 
                                 ? parseInt(site.panels) || 0 
                                 : elevatorsPerBlock * 2;
                               const blockLabels = site.siteType === 'business_center' 
                                 ? ['A'] 
                                 : helpers.generateBlockLabels(blockCount);
                               const usedBlocks = agreement.siteBlockSelections?.[siteId] || [];
                               const panelSelections = agreement.sitePanelSelections?.[siteId] || {};
                               
                               return (
                                 <div key={siteId} className="col-md-12">
                                   <div className="card border-primary">
                                     <div className="card-header bg-primary-subtle">
                                       <div className="d-flex justify-content-between align-items-center">
                                         <h6 className="mb-0">
                                           <i className="bi bi-building me-2"></i>
                                           {site.name}
                                         </h6>
                                         <span className="badge bg-info-subtle text-info-emphasis">
                                           {Object.values(agreement.sitePanelCounts || {}).reduce((sum, count) => sum + parseInt(count || 0), 0)} panel
                                         </span>
                                       </div>
                                     </div>
                                     <div className="card-body">
                                       {usedBlocks.length === 0 ? (
                                         <div className="text-center py-3 text-muted">
                                           <i className="bi bi-exclamation-triangle"></i>
                                           <p className="mb-0 mt-2">Bu anlaşma için blok bilgisi bulunamadı.</p>
                                         </div>
                                       ) : (
                                         <div className="row g-3">
                                           {usedBlocks.map((blockId) => {
                                             const blockLabel = blockId.split('-')[2]; // Extract block label (A, B, C, etc.)
                                             const usedPanels = panelSelections[blockId] || [];
                                             
                                             return (
                                               <div key={blockId} className="col-md-6 col-lg-4">
                                                 <div className="card border-info">
                                                   <div className="card-header bg-info-subtle">
                                                     <h6 className="mb-0 fw-bold">
                                                       <i className="bi bi-grid-3x3-gap me-1"></i>
                                                       {blockLabel} Blok
                                                     </h6>
                                                   </div>
                                                   <div className="card-body">
                                                     <div className="small text-muted mb-2">
                                                       Kullanılan Paneller: {usedPanels.length} / {panelsPerBlock}
                                                     </div>
                                                     <div className="d-flex flex-wrap gap-1">
                                                       {Array.from({ length: panelsPerBlock }, (_, panelIndex) => {
                                                         const panelId = panelIndex + 1;
                                                         const panelKey = `panel-${panelId}`;
                                                         const isPanelUsed = usedPanels.includes(panelKey);
                                                         const fullPanelNumber = `${siteId}${blockLabel}${panelId}`;
                                                         const panelImage = getPanelImage(agreement.id.toString(), siteId, blockId, panelId.toString(), panelImages);
                                                         
                                                         return (
                                                           <div
                                                             key={panelKey}
                                                             className={`d-flex align-items-center justify-content-center ${
                                                               isPanelUsed ? 'bg-primary text-white' : 'bg-light text-muted'
                                                             } border rounded position-relative`}
                                                             style={{
                                                               width: panelImage ? '90px' : '60px',
                                                               height: panelImage ? '120px' : '80px',
                                                               fontSize: '8px',
                                                               fontWeight: 'bold',
                                                               flexDirection: 'column',
                                                               cursor: 'default',
                                                               backgroundImage: panelImage ? `url(${panelImage.url})` : 'none',
                                                               backgroundSize: 'cover',
                                                               backgroundPosition: 'center',
                                                               backgroundRepeat: 'no-repeat',
                                                               minHeight: panelImage ? '120px' : '80px'
                                                             }}
                                                             title={isPanelUsed ? `Panel ${fullPanelNumber} - ${company?.name || 'Firma'}${panelImage ? ' (Fotoğraf var)' : ''}` : `Panel ${panelId} - Boş`}
                                                           >
                                                             {!panelImage && (
                                                               <>
                                                                 <div className="fw-bold">{panelId}</div>
                                                                 {isPanelUsed && (
                                                                   <div className="text-truncate" style={{ fontSize: '7px', lineHeight: '1', maxWidth: '50px' }}>
                                                                     {fullPanelNumber}
                                                                   </div>
                                                                 )}
                                                               </>
                                                             )}
                                                             {isPanelUsed && (
                                                               <div className="position-absolute top-0 end-0" style={{ fontSize: '8px' }}>
                                                                 {panelImage ? (
                                                                   <i className="bi bi-camera-fill text-success"></i>
                                                                 ) : (
                                                                   <i className="bi bi-lock-fill"></i>
                                                                 )}
                                                               </div>
                                                             )}
                                                             {panelImage && (
                                                               <div className="position-absolute bottom-0 start-0 end-0 bg-dark bg-opacity-75 text-white text-center" style={{ fontSize: '6px', padding: '2px' }}>
                                                                 Panel {panelId}
                                                               </div>
                                                             )}
                                                           </div>
                                                         );
                                                       })}
                                                     </div>
                                                   </div>
                                                 </div>
                                               </div>
                                             );
                                           })}
                                         </div>
                                       )}
                                     </div>
                                   </div>
                                 </div>
                               );
                             })}
                           </div>
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
             </div>
           </div>
         </div>
       )}

        </div>
      </div>
    </div>
  );
};

// Get panel image
const getPanelImage = (agreementId, siteId, blockId, panelId, panelImages) => {
  return panelImages.find(img => 
    img.agreementId === agreementId.toString() && 
    img.siteId === siteId && 
    img.blockId === blockId && 
    img.panelId === panelId.toString()
  );
};

export default CompanyDashboard;