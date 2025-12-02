import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { getAgreements, createAgreement, updateAgreement, deleteAgreement, archiveAgreement } from '../../services/api';
import { getSites, updateSite } from '../../services/api';
import { getCompanies, updateCompany } from '../../services/api';
import { createTransaction } from '../../services/api';
import { createLog, getUsers, createUser, updateUser } from '../../services/api';
import AgreementHandlers from './AgreementHandlers';
import AgreementUIHandlers from './AgreementUIHandlers';
import AgreementHelpers from './AgreementHelpers';
import AgreementTable from './AgreementTable';
import AgreementDetailModal from './AgreementDetailModal';
import AgreementPhotoModal from './AgreementPhotoModal';
import AgreementFormModal from './AgreementFormModal';

const AgreementsMain = () => {
  const [agreements, setAgreements] = useState([]);
  const [sites, setSites] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentAgreement, setCurrentAgreement] = useState(null);
  const [selectedSites, setSelectedSites] = useState([]);
  const [sitePanelCounts, setSitePanelCounts] = useState({});
  const [selectedWeeks, setSelectedWeeks] = useState([]);
  // New state for block and panel selection
  const [siteBlockSelections, setSiteBlockSelections] = useState({}); // {siteId: [selectedBlockIds]}
  const [sitePanelSelections, setSitePanelSelections] = useState({}); // {siteId: {blockId: [selectedPanelIds]}}
  
  // State for photo upload
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoData, setPhotoData] = useState({
    file: null,
    previewUrl: null
  });
  
  // State for active/expired tabs
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'expired'
  
  const [formData, setFormData] = useState({
    companyId: '',
    startDate: '',
    endDate: '',
    weeklyRatePerPanel: '',
    notes: ''
  });
  
  // State for custom alert modals
  const [alertModal, setAlertModal] = useState({
    show: false,
    title: '',
    message: '',
    type: 'info' // info, success, warning, error
  });

  // Validate that required API functions are available
  useEffect(() => {
    if (typeof createTransaction !== 'function') {
      console.error('createTransaction is not a function or is undefined');
    }
    if (typeof updateAgreement !== 'function') {
      console.error('updateAgreement is not a function or is undefined');
    }
    if (typeof updateSite !== 'function') {
      console.error('updateSite is not a function or is undefined');
    }
    if (typeof createLog !== 'function') {
      console.error('createLog is not a function or is undefined');
    }
    if (typeof window.showAlert !== 'function') {
      console.warn('window.showAlert is not available, custom alerts may not work');
    }
    if (typeof window.showConfirm !== 'function') {
      console.warn('window.showConfirm is not available, custom confirms may not work');
    }
  }, []);

  // Memoize helper object to prevent infinite loops
  const helpers = useMemo(() => AgreementHelpers({
    companies, sites, agreements,
    sitePanelSelections, selectedWeeks, formData
  }), [companies, sites, agreements, sitePanelSelections, selectedWeeks, formData]);
  
  // Use ref to prevent multiple fetches
  const hasFetchedRef = useRef(false);

  // Function to delete all agreements
  const handleDeleteAllAgreements = async () => {
    if (agreements.length === 0) {
      await window.showAlert(
        'Bilgi',
        'Silinecek anlaşma bulunmamaktadır.',
        'info'
      );
      return;
    }

    const result = await window.showConfirm(
      'Tüm Anlaşmaları Sil',
      `Tüm ${agreements.length} anlaşmayı arşivlemek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
      'warning'
    );
    
    if (result) {
      try {
        let successCount = 0;
        let errorCount = 0;
        
        // Create an array of promises for archiving all agreements
        const archivePromises = agreements.map(async (agreement) => {
          try {
            const success = await archiveAgreement(agreement.id);
            if (success) {
              successCount++;
              // Log the action
              await createLog({
                user: 'Admin',
                action: `Anlaşma arşivlendi: ${helpers.getCompanyName(agreement.companyId)} (${agreement.id})`
              });
              return { success: true, agreementId: agreement.id };
            } else {
              errorCount++;
              return { success: false, agreementId: agreement.id };
            }
          } catch (error) {
            console.error('Error archiving agreement:', agreement.id, error);
            errorCount++;
            return { success: false, agreementId: agreement.id, error: error.message };
          }
        });
        
        // Wait for all archive operations to complete
        await Promise.all(archivePromises);
        
        // Update state to remove all agreements
        setAgreements([]);
        
        await window.showAlert(
          'İşlem Tamamlandı',
          `${successCount} anlaşma başarıyla arşivlendi. ${errorCount} anlaşma arşivlenirken hata oluştu.`,
          'info'
        );
      } catch (error) {
        console.error('Error deleting all agreements:', error);
        await window.showAlert(
          'Hata',
          'Anlaşmalar arşivlenirken bir hata oluştu: ' + error.message,
          'error'
        );
      }
    }
  };

  const handlers = AgreementHandlers({
    agreements, setAgreements,
    sites, setSites,
    companies, setCompanies,
    formData, setFormData,
    selectedSites, setSelectedSites,
    sitePanelCounts, setSitePanelCounts,
    selectedWeeks, setSelectedWeeks,
    siteBlockSelections, setSiteBlockSelections,
    sitePanelSelections, setSitePanelSelections,
    getCompanyName: helpers.getCompanyName,
    getCompany: helpers.getCompany,
    getCompanyCreditInfo: helpers.getCompanyCreditInfo,
    formatCurrency: helpers.formatCurrency,
    dateRangesOverlap: helpers.dateRangesOverlap,
    getCurrentDateRange: helpers.getCurrentDateRange,
    isPanelAvailable: helpers.isPanelAvailable,
    updateSitePanelCount: helpers.updateSitePanelCount,
    createTransaction, // Add createTransaction function
    createAgreement, // Add createAgreement function
    updateAgreement, // Add updateAgreement function
    updateSite, // Add updateSite function
    updateCompany, // Add updateCompany function
    createUser, // Add createUser function
    updateUser, // Add updateUser function
    getUsers, // Add getUsers function
    createLog, // Add createLog function
    setShowModal, // Add setShowModal function
    setCurrentAgreement, // Add setCurrentAgreement function
    archiveAgreement // Add archiveAgreement function
  });

  const uiHandlers = AgreementUIHandlers({
    setShowModal, setCurrentAgreement,
    setShowAddForm, setFormData,
    setSelectedSites, setSitePanelCounts,
    setSelectedWeeks, setSiteBlockSelections,
    setSitePanelSelections,
    showAlertModal: handlers.showAlertModal,
    updateSitePanelCount: helpers.updateSitePanelCount,
    companies, // Pass companies prop for credit functionality
    sites, // Pass sites prop for site selection functionality
    sitePanelCounts, // Pass sitePanelCounts state
    siteBlockSelections, // Pass siteBlockSelections state
    helpers, // Pass helpers for panel availability check
    formData // Pass formData for date range check
  });

  useEffect(() => {
    // Prevent multiple fetches
    if (hasFetchedRef.current) {
      return;
    }
    
    const fetchData = async () => {
      try {
        hasFetchedRef.current = true;
        setLoading(true);
        
        const [agreementsData, sitesData, companiesData] = await Promise.all([
          getAgreements(),
          getSites(),
          getCompanies()
        ]);
        
        // Initialize sites with payment properties
        const initializedSites = sitesData.map(site => ({
          ...site,
          pendingPayments: site.pendingPayments || [],
          hasPendingPayment: (site.pendingPayments && site.pendingPayments.length > 0) || false
        }));
        
        // Remove duplicates from agreements data (by id or _docId)
        const uniqueAgreements = agreementsData.filter((agreement, index, self) => 
          index === self.findIndex(a => 
            (a.id === agreement.id && a._docId === agreement._docId) ||
            (a.id && agreement.id && a.id === agreement.id) ||
            (a._docId && agreement._docId && a._docId === agreement._docId)
          )
        );
        
        // Remove duplicates from sites data (by id or _docId)
        const uniqueSites = initializedSites.filter((site, index, self) => 
          index === self.findIndex(s => 
            (s.id === site.id && s._docId === site._docId) ||
            (s.id && site.id && s.id === site.id) ||
            (s._docId && site._docId && s._docId === site._docId)
          )
        );
        
        setAgreements(uniqueAgreements);
        setSites(uniqueSites);
        setCompanies(companiesData);
      } catch (error) {
        console.error('Error fetching data:', error);
        hasFetchedRef.current = false; // Reset on error to allow retry
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Check for expired agreements every 5 minutes (reduced frequency to prevent issues)
    const interval = setInterval(() => {
      if (handlers && typeof handlers.checkExpiredAgreements === 'function') {
        handlers.checkExpiredAgreements();
      }
    }, 5 * 60 * 1000); // 5 minutes instead of 1 minute
    
    return () => {
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once

  // Update panel counts whenever panel selections change
  // Use debounce to prevent excessive updates
  useEffect(() => {
    if (selectedSites.length === 0) return;
    
    const timeoutId = setTimeout(() => {
      selectedSites.forEach(siteId => {
        if (helpers && typeof helpers.updateSitePanelCount === 'function') {
          helpers.updateSitePanelCount(siteId, sitePanelSelections, setSitePanelCounts);
        }
      });
    }, 100); // Debounce 100ms
    
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sitePanelSelections, selectedSites]); // Keep dependencies but debounce updates

  // Handle photo upload button click
  const handleUploadPhoto = (agreement) => {
    setCurrentAgreement(agreement);
    setPhotoData({
      file: null,
      previewUrl: agreement.photoUrl || null
    });
    setShowPhotoModal(true);
  };

  // Handle photo file change
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        window.showAlert('Hata', 'Lütfen sadece resim dosyası seçin.', 'error');
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        window.showAlert('Hata', 'Dosya boyutu 5MB\'dan büyük olamaz.', 'error');
        return;
      }
      
      const previewUrl = URL.createObjectURL(file);
      setPhotoData({
        file,
        previewUrl
      });
    }
  };

  // Convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  // Handle photo save
  const handlePhotoSave = async () => {
    if (!currentAgreement || (!photoData.file && !photoData.previewUrl)) {
      window.showAlert('Hata', 'Lütfen bir resim seçin.', 'error');
      return;
    }
    
    try {
      let photoUrl = photoData.previewUrl;
      
      // If we have a file, convert it to base64 for persistent storage
      if (photoData.file) {
        photoUrl = await fileToBase64(photoData.file);
      }
      
      const updatedAgreement = {
        ...currentAgreement,
        photoUrl: photoUrl,
        photoUploadedAt: new Date().toISOString()
      };
      
      // Update agreement in database
      const savedAgreement = await updateAgreement(currentAgreement.id, updatedAgreement);
      
      if (savedAgreement) {
        // Update agreement in state
        setAgreements(agreements.map(a => a.id === currentAgreement.id ? savedAgreement : a));
        
        // Update current agreement if it's the same
        if (currentAgreement.id === (currentAgreement?.id)) {
          setCurrentAgreement(savedAgreement);
        }
        
        // Close modal
        setShowPhotoModal(false);
        
        window.showAlert('Başarılı', 'Fotoğraf başarıyla kaydedildi.', 'success');
      } else {
        throw new Error('Failed to save agreement');
      }
    } catch (error) {
      console.error('Error saving photo:', error);
      window.showAlert('Hata', 'Fotoğraf kaydedilirken bir hata oluştu.', 'error');
    }
  };

  // Filter and sort agreements based on active tab
  const getFilteredAgreements = () => {
    const currentDate = new Date();
    
    let filteredAgreements = agreements.filter(agreement => {
      const endDate = new Date(agreement.endDate);
      
      if (activeTab === 'active') {
        // Active agreements: status is 'active' and end date is in the future
        return agreement.status === 'active' && endDate >= currentDate;
      } else {
        // Expired agreements: status is 'active' but end date is in the past, or status is 'expired' or 'terminated'
        return (agreement.status === 'active' && endDate < currentDate) || 
               agreement.status === 'expired' || 
               agreement.status === 'terminated';
      }
    });
    
    // Sort by creation date (most recent first) - using id as proxy for creation order
    return filteredAgreements.sort((a, b) => {
      // Handle both numeric and string IDs
      const aId = typeof a.id === 'string' ? a.id : a.id;
      const bId = typeof b.id === 'string' ? b.id : b.id;
      
      // For string IDs, sort alphabetically (most recent first)
      if (typeof aId === 'string' && typeof bId === 'string') {
        return bId.localeCompare(aId);
      }
      
      // For numeric IDs, sort numerically
      return bId - aId;
    });
  };

  // Get statistics for current tab
  const getTabStatistics = () => {
    const filteredAgreements = getFilteredAgreements();
    const totalAmount = filteredAgreements.reduce((sum, agreement) => sum + (agreement.totalAmount || 0), 0);
    const averageWeeks = filteredAgreements.length > 0 
      ? Math.round(filteredAgreements.reduce((sum, agreement) => sum + (agreement.totalWeeks || 0), 0) / filteredAgreements.length)
      : 0;
    
    // Calculate payment statistics
    const paidAgreements = filteredAgreements.filter(a => a.paymentReceived || a.creditPaymentReceived);
    const unpaidAgreements = filteredAgreements.filter(a => !a.paymentReceived && !a.creditPaymentReceived);
    const paidAmount = paidAgreements.reduce((sum, agreement) => sum + (agreement.totalAmount || 0), 0);
    const unpaidAmount = unpaidAgreements.reduce((sum, agreement) => sum + (agreement.totalAmount || 0), 0);
    
    return {
      count: filteredAgreements.length,
      totalAmount,
      averageWeeks,
      paidAmount,
      unpaidAmount,
      paidAgreements: paidAgreements.length,
      unpaidAgreements: unpaidAgreements.length
    };
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <div className="loading-spinner mx-auto"></div>
          <p className="mt-3 text-muted">Anlaşmalar yükleniyor...</p>
        </div>
      </div>
    );
  }

  const tabStats = getTabStatistics();

  return (
    <div className="container-fluid">
      {/* Header with title and buttons */}
      <div className="page-header mb-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
          <div>
            <h2 className="h3 fw-bold mb-1">Anlaşmalar</h2>
            <p className="mb-0">Firma anlaşmalarını yönetin ve takip edin</p>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <button 
              onClick={uiHandlers.handleAddAgreement}
              className="btn btn-page-primary btn-icon d-flex align-items-center"
            >
              <i className="bi bi-plus-lg me-2"></i>
              <span>Yeni Anlaşma</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-4">
        <ul className="nav nav-tabs" id="agreementTabs" role="tablist">
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${activeTab === 'active' ? 'active' : ''}`}
              onClick={() => setActiveTab('active')}
              type="button"
              role="tab"
            >
              <i className="bi bi-check-circle me-2"></i>
              Aktif Anlaşmalar
              <span className="badge bg-success ms-2">{tabStats.count}</span>
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${activeTab === 'expired' ? 'active' : ''}`}
              onClick={() => setActiveTab('expired')}
              type="button"
              role="tab"
            >
              <i className="bi bi-clock-history me-2"></i>
              Süresi Bitmiş / Sonlandırılmış Anlaşmalar
              <span className="badge bg-secondary ms-2">{tabStats.count}</span>
            </button>
          </li>
        </ul>
      </div>

      {/* Stats Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3 col-sm-6">
          <div className="page-stats-card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">
                    {activeTab === 'active' ? 'Aktif Anlaşma' : 'Süresi Bitmiş / Sonlandırılmış Anlaşma'}
                  </h6>
                  <h3 className="mb-0 fw-bold">{tabStats.count}</h3>
                </div>
                <div className={`${activeTab === 'active' ? 'bg-success' : 'bg-secondary'} bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center`} style={{ width: '48px', height: '48px' }}>
                  <i className={`bi ${activeTab === 'active' ? 'bi-check-circle text-success' : 'bi-clock-history text-secondary'} fs-4`}></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="page-stats-card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Toplam Gelir</h6>
                  <h3 className="mb-0 fw-bold text-primary">
                    {helpers.formatCurrency(tabStats.totalAmount)}
                  </h3>
                </div>
                <div className="bg-info bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                  <i className="bi bi-currency-dollar text-info fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="page-stats-card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Ortalama Süre</h6>
                  <h3 className="mb-0 fw-bold">
                    {tabStats.averageWeeks} hafta
                  </h3>
                </div>
                <div className="bg-warning bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                  <i className="bi bi-calendar-week text-warning fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="page-stats-card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Toplam Anlaşma</h6>
                  <h3 className="mb-0 fw-bold">{agreements.length}</h3>
                </div>
                <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                  <i className="bi bi-file-earmark-text text-primary fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Status Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3 col-sm-6">
          <div className="page-stats-card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Ödenmiş Anlaşma</h6>
                  <h3 className="mb-0 fw-bold">{tabStats.paidAgreements}</h3>
                  <p className="mb-0 small text-success">{helpers.formatCurrency(tabStats.paidAmount)}</p>
                </div>
                <div className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                  <i className="bi bi-check-circle text-success fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="page-stats-card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Ödenmemiş Anlaşma</h6>
                  <h3 className="mb-0 fw-bold">{tabStats.unpaidAgreements}</h3>
                  <p className="mb-0 small text-warning">{helpers.formatCurrency(tabStats.unpaidAmount)}</p>
                </div>
                <div className="bg-warning bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                  <i className="bi bi-clock text-warning fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="page-stats-card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Ödeme Oranı</h6>
                  <h3 className="mb-0 fw-bold">
                    {tabStats.count > 0 
                      ? Math.round((tabStats.paidAgreements / tabStats.count) * 100) 
                      : 0}%
                  </h3>
                </div>
                <div className="bg-info bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                  <i className="bi bi-percent text-info fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="page-stats-card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Bekleyen Ödeme</h6>
                  <h3 className="mb-0 fw-bold">{helpers.formatCurrency(tabStats.unpaidAmount)}</h3>
                </div>
                <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                  <i className="bi bi-arrow-up-circle text-primary fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete All Agreements Button - Only show for active tab */}
      {activeTab === 'active' && getFilteredAgreements().length > 0 && (
        <div className="d-flex justify-content-end mb-3">
          <button
            onClick={handleDeleteAllAgreements}
            className="btn btn-outline-danger btn-sm d-flex align-items-center"
            title="Tüm Aktif Anlaşmaları Sil"
          >
            <i className="bi bi-trash me-1"></i>
            <span>Tüm Aktif Anlaşmaları Sil</span>
          </button>
        </div>
      )}

      {/* Agreements Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <AgreementTable 
            agreements={getFilteredAgreements()}
            handlers={handlers}
            uiHandlers={uiHandlers}
            helpers={helpers}
            handleUploadPhoto={handleUploadPhoto}
            activeTab={activeTab}
          />
        </div>
      </div>

      {/* Agreement Detail Modal */}
      <AgreementDetailModal 
        showModal={showModal}
        currentAgreement={currentAgreement}
        uiHandlers={uiHandlers}
        helpers={helpers}
        handleUploadPhoto={handleUploadPhoto}
      />

      {/* Photo Upload Modal */}
      <AgreementPhotoModal 
        showPhotoModal={showPhotoModal}
        currentAgreement={currentAgreement}
        setShowPhotoModal={setShowPhotoModal}
        helpers={helpers}
        photoData={photoData}
        setPhotoData={setPhotoData}
        handlePhotoSave={handlePhotoSave}
        handlePhotoChange={handlePhotoChange}
      />

      {/* Add/Edit Agreement Form Modal */}
      <AgreementFormModal 
        showAddForm={showAddForm}
        currentAgreement={currentAgreement}
        uiHandlers={uiHandlers}
        handlers={handlers}
        helpers={helpers}
        formData={formData}
        setFormData={setFormData}
        sites={sites}
        selectedSites={selectedSites}
        sitePanelCounts={sitePanelCounts}
        siteBlockSelections={siteBlockSelections}
        sitePanelSelections={sitePanelSelections}
        companies={companies}
        agreements={agreements}
        setShowAddForm={setShowAddForm}
        setAgreements={setAgreements}
        setSelectedSites={setSelectedSites}
        setSitePanelCounts={setSitePanelCounts}
        setSelectedWeeks={setSelectedWeeks}
        setSiteBlockSelections={setSiteBlockSelections}
        setSitePanelSelections={setSitePanelSelections}
      />
    </div>
  );
};

export default AgreementsMain;