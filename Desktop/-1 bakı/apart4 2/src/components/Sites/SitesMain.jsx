import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { getSites, createSite, updateSite, getTransactions, getAgreements, getCompanies } from '../../services/api';
import SiteHandlers from './SiteHandlers';
import SiteUIHandlers from './SiteUIHandlers';
import SiteHelpers from './SiteHelpers';
import SitesDataHandlers from './SitesDataHandlers';
import SitesTable from './SitesTable';
import SitesForms from './SitesForms';
import SitesModals from './SitesModals';
import SitesExcelHandlers from './SitesExcelHandlers';

const SitesMain = () => {
  const [sites, setSites] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentSite, setCurrentSite] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    manager: '',
    phone: '',
    blocks: '',
    elevatorsPerBlock: '',
    agreementPercentage: '',
    notes: '',
    neighborhood: '',
    siteType: 'site',
    manualPanels: '',
    apartmentCount: '', // Daire sayısı (site için)
    averagePeople: '', // Ortalama insan sayısı (site için - otomatik hesaplanacak)
    businessCount: '', // İşyeri sayısı (iş merkezi için)
    peopleCount: '' // İş merkezine giren kişi sayısı (iş merkezi için)
  });
  const [showPaymentSelection, setShowPaymentSelection] = useState(false);
  const [selectedSiteForPayment, setSelectedSiteForPayment] = useState(null);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [excelFile, setExcelFile] = useState(null);
  const [showExcelInfo, setShowExcelInfo] = useState(false);
  const [showActiveAgreements, setShowActiveAgreements] = useState(false);
  const [currentSiteForAgreements, setCurrentSiteForAgreements] = useState(null);
  const [showAllPendingPayments, setShowAllPendingPayments] = useState(false);
  const [allPendingPayments, setAllPendingPayments] = useState([]);
  const [processedPayments, setProcessedPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSites, setFilteredSites] = useState([]);
  
  // Ref for PDF generation
  const modalContentRef = useRef(null);
  const fileInputRef = useRef(null);

  // Memoize helper object to prevent infinite loops
  const helpers = useMemo(() => SiteHelpers({
    companies, sites, agreements,
    transactions
  }), [companies, sites, agreements, transactions]);

  // Use ref to prevent multiple fetches
  const hasFetchedRef = useRef(false);

  // Function to refresh all data - memoized to prevent infinite loops
  const refreshData = useCallback(async (forceRefresh = false) => {
    // Prevent multiple simultaneous fetches (but allow forced refresh)
    if (hasFetchedRef.current && !forceRefresh) {
      return;
    }
    
    try {
      setLoading(true);
      if (!forceRefresh) {
        hasFetchedRef.current = true;
      }
      
      const [sitesData, transactionsData, agreementsData, companiesData] = await Promise.all([
        getSites(),
        getTransactions(),
        getAgreements(),
        getCompanies()
      ]);
      
      // Create temporary helpers for calculations
      const tempHelpers = SiteHelpers({
        companies: companiesData,
        sites: sitesData,
        agreements: agreementsData,
        transactions: transactionsData
      });
      
      // Initialize sites with payment properties
      const initializedSites = sitesData.map(site => {
        // Calculate pending payments based on active agreements
        const calculatedPendingPayments = tempHelpers.calculatePendingPayments(site, agreementsData, companiesData, transactionsData);
        
        return {
          ...site,
          pendingPayments: calculatedPendingPayments,
          hasPendingPayment: calculatedPendingPayments.length > 0
        };
      });
      
      setSites(initializedSites);
      setTransactions(transactionsData);
      setAgreements(agreementsData);
      setCompanies(companiesData);
    } catch (error) {
      console.error('Error refreshing data:', error);
      hasFetchedRef.current = false; // Reset on error to allow retry
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array - only create once

  // Function to collect all pending payments from all sites - memoized
  const collectAllPendingPayments = useCallback(() => {
    const allPayments = [];
    sites.forEach(site => {
      if (site.hasPendingPayment && site.pendingPayments && site.pendingPayments.length > 0) {
        // Use getPendingPaymentsDetailed to get correct panel count and weekly rate
        const detailedPayments = helpers.getPendingPaymentsDetailed(site, agreements, companies);
        detailedPayments.forEach(payment => {
          allPayments.push({
            ...payment,
            siteId: site.id,
            siteName: site.name,
            panelCount: payment.panelCount,
            weeklyAmount: payment.weeklyRatePerPanel // Use weeklyRatePerPanel for haftalık tutar
          });
        });
      }
    });
    return allPayments;
  }, [sites, agreements, companies, helpers]);

  // Function to show all pending payments - memoized
  const handleShowAllPendingPayments = useCallback(() => {
    const allPayments = collectAllPendingPayments();
    setAllPendingPayments(allPayments);
    setShowAllPendingPayments(true);
  }, [collectAllPendingPayments]);

  // Memoize handler objects to prevent infinite loops
  // Use refs to avoid recreating handlers on every render
  // BUT: Update handlers when formData changes to avoid closure issues
  const handlersRef = useRef(null);
  const formDataRef = useRef(formData);
  formDataRef.current = formData; // Keep ref in sync with current formData
  
  if (!handlersRef.current || handlersRef.current.formDataVersion !== formDataRef.current) {
    handlersRef.current = {
      ...SiteHandlers({
        sites, setSites,
        transactions, setTransactions,
        agreements, setAgreements,
        companies, setCompanies,
        formData: formDataRef.current, // Use ref to get current value
        setFormData,
        selectedSiteForPayment, setSelectedSiteForPayment,
        pendingPayments, setPendingPayments,
        showPaymentSelection, setShowPaymentSelection,
        currentSiteForAgreements, setCurrentSiteForAgreements,
        currentSite, setCurrentSite,
        setShowAddForm,
        calculateTotalElevators: helpers.calculateTotalElevators,
        calculatePanels: helpers.calculatePanels,
        formatCurrency: helpers.formatCurrency,
        refreshData, // Pass the refreshData function to handlers
        processedPayments, setProcessedPayments,
        helpers
      }),
      formDataVersion: formDataRef.current
    };
  }
  const handlers = handlersRef.current;

  // Memoize data handler objects - use ref to avoid recreating
  const dataHandlersRef = useRef(null);
  if (!dataHandlersRef.current) {
    dataHandlersRef.current = SitesDataHandlers({
      sites, setSites,
      transactions, setTransactions,
      agreements, setAgreements,
      companies, setCompanies,
      refreshData
    });
  }
  const dataHandlers = dataHandlersRef.current;

  // Memoize UI handler objects - use ref to avoid recreating
  const uiHandlersRef = useRef(null);
  if (!uiHandlersRef.current) {
    uiHandlersRef.current = SiteUIHandlers({
      setShowModal,
      setCurrentSite,
      setShowAddForm,
      setFormData,
      setShowPaymentSelection,
      setSelectedSiteForPayment,
      setPendingPayments,
      setShowActiveAgreements,
      setCurrentSiteForAgreements,
      setShowExcelInfo,
      fileInputRef
    });
  }
  const uiHandlers = uiHandlersRef.current;

  // Excel handlers - Create with current sites to ensure fresh data
  const excelHandlers = useMemo(() => SitesExcelHandlers({
    sites, setSites,
    refreshData
  }), [sites, setSites, refreshData]);

  useEffect(() => {
    // Only fetch once on mount
    if (!hasFetchedRef.current) {
      refreshData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once

  // Filter sites based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredSites(sites);
    } else {
      const filtered = sites.filter(site => 
        site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        site.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        site.manager.toLowerCase().includes(searchTerm.toLowerCase()) ||
        site.neighborhood.toLowerCase().includes(searchTerm.toLowerCase()) ||
        site.phone.includes(searchTerm)
      );
      setFilteredSites(filtered);
    }
  }, [sites, searchTerm]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <div className="loading-spinner mx-auto"></div>
          <p className="mt-3 text-muted">Siteler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <style>
        {`
          .cursor-pointer {
            cursor: pointer;
          }
          .cursor-pointer:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            transition: all 0.2s ease-in-out;
          }
        `}
      </style>
      {/* Header with title and buttons */}
      <div className="sites-header mb-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
          <div>
            <h2 className="h3 fw-bold mb-1">Siteler</h2>
            <p className="mb-0">Site yönetimi ve ödeme işlemleri</p>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <button 
              className="btn btn-sites-primary btn-icon d-flex align-items-center"
              onClick={uiHandlers.handleAddSite}
            >
              <i className="bi bi-plus-lg me-2"></i>
              <span>Site Ekle</span>
            </button>
            <div className="position-relative">
              <button 
                className="btn btn-sites-outline btn-icon d-flex align-items-center"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                title="Excel ile Yükle"
              >
                <i className="bi bi-upload"></i>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx, .xls"
                onChange={(e) => handlers.handleExcelImport(e, setExcelFile)}
                style={{ display: 'none' }}
              />
            </div>
            <button 
              className="btn btn-sites-outline btn-icon d-flex align-items-center"
              onClick={() => excelHandlers.exportSitesToExcel(sites)}
              title="Excel Çıktısı Al"
            >
              <i className="bi bi-download"></i>
            </button>
            <button 
              className="btn btn-sites-outline d-flex align-items-center"
              onClick={() => uiHandlers.setShowExcelInfo(!showExcelInfo)}
              title="Excel Bilgilendirme"
            >
              <i className="bi bi-info-circle"></i>
            </button>
            <button 
              className="btn btn-sites-outline"
              onClick={handlers.handleDeleteAllSites}
              title="Tüm Siteleri Sil"
            >
              <i className="bi bi-trash me-1"></i>
              <span className="d-none d-md-inline">Tümünü Sil</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-3">
              <div className="row align-items-center">
                <div className="col-md-8">
                  <div className="input-group search-bar">
                    <span className="input-group-text bg-light border-0">
                      <i className="bi bi-search text-muted"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control border-0 bg-light"
                      placeholder="Site adı, ID, yönetici, mahalle veya telefon ile ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <button
                        className="btn btn-outline-secondary"
                        onClick={() => setSearchTerm('')}
                        title="Temizle"
                      >
                        <i className="bi bi-x"></i>
                      </button>
                    )}
                  </div>
                </div>
                <div className="col-md-4 text-md-end mt-2 mt-md-0">
                  <span className="text-muted small">
                    {filteredSites.length} / {sites.length} site
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        {(() => {
          const stats = helpers.calculateSummaryStats(sites, transactions);
          return (
            <>
              <div className="col-md-2 col-sm-6">
                <div className="sites-stats-card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="text-muted mb-1">Siteler</h6>
                        <h3 className="mb-0 fw-bold">{stats.regularSites}</h3>
                      </div>
                      <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                        <i className="bi bi-building text-primary fs-4"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-2 col-sm-6">
                <div className="sites-stats-card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="text-muted mb-1">İş Merkezleri</h6>
                        <h3 className="mb-0 fw-bold">{stats.businessCenters}</h3>
                      </div>
                      <div className="bg-secondary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                        <i className="bi bi-briefcase text-secondary fs-4"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-2 col-sm-6">
                <div className="sites-stats-card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="text-muted mb-1">Toplam Asansör</h6>
                        <h3 className="mb-0 fw-bold">{stats.totalElevators}</h3>
                      </div>
                      <div className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                        <i className="bi bi-chevron-double-down text-success fs-4"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-2 col-sm-6">
                <div className="sites-stats-card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="text-muted mb-1">Toplam Panel</h6>
                        <h3 className="mb-0 fw-bold">{stats.totalPanels}</h3>
                      </div>
                      <div className="bg-info bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                        <i className="bi bi-grid text-info fs-4"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-2 col-sm-6">
                <div className="sites-stats-card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="text-muted mb-1">Toplam Daire</h6>
                        <h3 className="mb-0 fw-bold">{stats.totalApartments}</h3>
                      </div>
                      <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                        <i className="bi bi-house text-primary fs-4"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-2 col-sm-6">
                <div className="sites-stats-card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="text-muted mb-1">Site Kişi Sayısı</h6>
                        <h3 className="mb-0 fw-bold">{stats.totalSitePeople}</h3>
                      </div>
                      <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                        <i className="bi bi-house text-primary fs-4"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-2 col-sm-6">
                <div className="sites-stats-card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="text-muted mb-1">İş Merkezi Kişi Sayısı</h6>
                        <h3 className="mb-0 fw-bold">{stats.totalBusinessCenterPeople}</h3>
                      </div>
                      <div className="bg-secondary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                        <i className="bi bi-briefcase text-secondary fs-4"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-2 col-sm-6">
                <div 
                  className="sites-stats-card border-0 shadow-sm h-100 cursor-pointer"
                  onClick={handleShowAllPendingPayments}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="text-muted mb-1">Ödenecek Tutar</h6>
                        <h3 className="mb-0 fw-bold">{helpers.formatCurrency(stats.totalPendingPayments)}</h3>
                      </div>
                      <div className="bg-warning bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                        <i className="bi bi-currency-dollar text-warning fs-4"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          );
        })()}
      </div>

      {/* Info about Excel template - shown only when info icon is clicked */}
      {showExcelInfo && (
        <div className="alert alert-info alert-dismissible fade show mb-4" role="alert">
          <i className="bi bi-info-circle me-2"></i>
          <strong>Excel Şablonu:</strong> Siteleri toplu olarak yüklemek için Excel dosyanızda aşağıdaki sütunları kullanın:
          <ul className="mb-1 mt-2">
            <li><strong>A1:</strong> Site Adı</li>
            <li><strong>B1:</strong> Mahalle</li>
            <li><strong>C1:</strong> Yönetici Adı</li>
            <li><strong>D1:</strong> Yönetici İletişim</li>
            <li><strong>E1:</strong> Site Türü (Site/İş Merkezi)</li>
            <li><strong>F1:</strong> Blok Sayısı</li>
            <li><strong>G1:</strong> 1 Blok için Asansör Sayısı</li>
            <li><strong>H1:</strong> Anlaşma Yüzdesi</li>
            <li><strong>I1:</strong> Daire Sayısı (Site için)</li>
            <li><strong>J1:</strong> Ortalama İnsan Sayısı (Site için - otomatik)</li>
            <li><strong>K1:</strong> İşyeri Sayısı (İş Merkezi için)</li>
            <li><strong>L1:</strong> İş Merkezine Giren Kişi Sayısı (İş Merkezi için)</li>
            <li><strong>M1:</strong> Not</li>
          </ul>
          <small>
            <a href="/site-template-new.csv" target="_blank" rel="noopener noreferrer" className="alert-link">
              Örnek şablonu indirmek için tıklayın
            </a>
          </small>
          <button type="button" className="btn-close" aria-label="Close" onClick={() => uiHandlers.setShowExcelInfo(false)}></button>
        </div>
      )}

      {/* Sites Table */}
      <SitesTable 
        sites={filteredSites}
        helpers={helpers}
        uiHandlers={uiHandlers}
        handlers={{...handlers, ...dataHandlers}}
      />

      {/* Add/Edit Site Form Modal */}
      <SitesForms 
        showAddForm={showAddForm}
        currentSite={currentSite}
        formData={formData}
        uiHandlers={uiHandlers}
        handlers={handlers}
        helpers={helpers}
      />

      {/* All Modals */}
      <SitesModals 
        showModal={showModal}
        currentSite={currentSite}
        uiHandlers={uiHandlers}
        helpers={helpers}
        handlers={handlers}
        agreements={agreements}
        companies={companies}
        transactions={transactions}
        showPaymentSelection={showPaymentSelection}
        selectedSiteForPayment={selectedSiteForPayment}
        showActiveAgreements={showActiveAgreements}
        currentSiteForAgreements={currentSiteForAgreements}
        showAllPendingPayments={showAllPendingPayments}
        allPendingPayments={allPendingPayments}
        setShowAllPendingPayments={setShowAllPendingPayments}
        setAllPendingPayments={setAllPendingPayments}
        processedPayments={processedPayments}
        setProcessedPayments={setProcessedPayments}
      />
    </div>
  );
}

export default SitesMain;