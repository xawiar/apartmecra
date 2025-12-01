import React, { useState, useEffect } from 'react';
import { getAgreements, getSites, getCompanies, getPanelImages, uploadPanelImage, cleanupExpiredImages } from '../services/api';
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
    const company = companies.find(c => String(c.id) === String(companyId));
    return company ? company.name : 'Bilinmeyen Firma';
  };

  // Get site name by ID
  const getSiteName = (siteId) => {
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

  return {
    getCompanyName,
    getSiteName,
    formatCurrency,
    dateRangesOverlap,
    generateBlockLabels
  };
};

const PersonnelDashboard = () => {
  const [agreements, setAgreements] = useState([]);
  const [sites, setSites] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filteredAgreements, setFilteredAgreements] = useState([]);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPanel, setSelectedPanel] = useState(null);
  const [panelImages, setPanelImages] = useState([]);
  const navigate = useNavigate();
  
  const user = getUser();

  // Load data function
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cleanup expired images first
      try {
        await cleanupExpiredImages();
      } catch (cleanupError) {
        console.warn('Failed to cleanup expired images:', cleanupError);
      }
      
      const [allAgreements, allSites, allCompanies] = await Promise.all([
        getAgreements(),
        getSites(),
        getCompanies()
      ]);
      
      setAgreements(allAgreements);
      setSites(allSites);
      setCompanies(allCompanies);
      
      // Initialize filtered agreements with active and future agreements
      const activeAndFutureAgreements = allAgreements.filter(agreement => {
        // Check if agreement is not deleted or archived
        if (agreement.isDeleted || agreement.isArchived || agreement.status === 'archived') {
          return false;
        }
        
        // Check if agreement is not expired
        const now = new Date();
        const endDate = new Date(agreement.endDate);
        return endDate >= now;
      });
      setFilteredAgreements(activeAndFutureAgreements);
      
      // Load panel images
      await loadPanelImages();
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Listen for agreement changes to refresh data
    const handleAgreementChange = () => {
      loadData();
    };
    
    window.addEventListener('agreementChanged', handleAgreementChange);
    
    return () => {
      window.removeEventListener('agreementChanged', handleAgreementChange);
    };
  }, []);

  // Update filtered agreements when date filters change
  useEffect(() => {
    handleDateFilterChange();
  }, [startDate, endDate, agreements]);

  // Initialize helper functions
  const helpers = AgreementHelpers({
    companies,
    sites,
    agreements
  });

  // Get site by ID
  const getSiteById = (siteId) => {
    return sites.find(s => String(s.id) === String(siteId));
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  // Get active and future agreements
  const getActiveAndFutureAgreements = () => {
    const now = new Date();
    return agreements.filter(agreement => {
      // Check if agreement is not deleted or archived
      if (agreement.isDeleted || agreement.isArchived || agreement.status === 'archived') {
        return false;
      }
      
      // Check if agreement is not expired
      const endDate = new Date(agreement.endDate);
      return endDate >= now; // Active or future agreements
    });
  };

  // Filter agreements by date range
  const filterAgreementsByDate = (agreements, startDate, endDate) => {
    if (!startDate && !endDate) {
      return agreements;
    }

    return agreements.filter(agreement => {
      const agreementStart = new Date(agreement.startDate);
      const agreementEnd = new Date(agreement.endDate);
      
      if (startDate && endDate) {
        // Check if agreement overlaps with the selected date range
        const filterStart = new Date(startDate);
        const filterEnd = new Date(endDate);
        return agreementStart <= filterEnd && agreementEnd >= filterStart;
      } else if (startDate) {
        // Only start date provided - show agreements that start on or after this date
        const filterStart = new Date(startDate);
        return agreementStart >= filterStart;
      } else if (endDate) {
        // Only end date provided - show agreements that end on or before this date
        const filterEnd = new Date(endDate);
        return agreementEnd <= filterEnd;
      }
      
      return true;
    });
  };

  // Handle date filter changes
  const handleDateFilterChange = () => {
    const activeAndFutureAgreements = getActiveAndFutureAgreements();
    const filtered = filterAgreementsByDate(activeAndFutureAgreements, startDate, endDate);
    setFilteredAgreements(filtered);
  };

  // Clear date filters
  const clearDateFilters = () => {
    setStartDate('');
    setEndDate('');
    const activeAndFutureAgreements = getActiveAndFutureAgreements();
    setFilteredAgreements(activeAndFutureAgreements);
  };

  // Load panel images
  const loadPanelImages = async () => {
    try {
      const images = await getPanelImages();
      setPanelImages(images);
    } catch (error) {
      console.error('Error loading panel images:', error);
    }
  };

  // Handle panel click
  const handlePanelClick = (agreement, siteId, blockId, panelId) => {
    const existingImage = getPanelImage(agreement.id.toString(), siteId, blockId, panelId.toString());
    setSelectedPanel({
      agreement,
      siteId,
      blockId,
      panelId,
      fullPanelNumber: generatePanelName(siteId, blockId.split('-')[2], panelId),
      existingImage
    });
    setShowPhotoModal(true);
  };

  // Handle photo upload
  const handlePhotoUpload = async (file) => {
    if (!selectedPanel) return;

    try {
      // If there's an existing image, delete it first
      if (selectedPanel.existingImage) {
        try {
          const deleteResponse = await fetch(`http://localhost:3001/panelImages/${selectedPanel.existingImage.id}`, {
            method: 'DELETE'
          });
          if (!deleteResponse.ok) {
            console.warn('Failed to delete existing image, continuing with upload');
          }
        } catch (deleteError) {
          console.warn('Error deleting existing image:', deleteError);
        }
      }

      const formData = new FormData();
      formData.append('image', file);
      formData.append('agreementId', selectedPanel.agreement.id);
      formData.append('siteId', selectedPanel.siteId);
      formData.append('blockId', selectedPanel.blockId);
      formData.append('panelId', selectedPanel.panelId);
      formData.append('companyId', selectedPanel.agreement.companyId);

      await uploadPanelImage(formData);
      
      // Reload panel images
      await loadPanelImages();
      
      // Close modal
      setShowPhotoModal(false);
      setSelectedPanel(null);
      
      // Show success message
      if (window.showAlert) {
        window.showAlert('Başarılı', 'Panel fotoğrafı başarıyla yüklendi!', 'success');
      }
    } catch (error) {
      console.error('Error uploading panel image:', error);
      if (window.showAlert) {
        window.showAlert('Hata', 'Fotoğraf yüklenirken bir hata oluştu.', 'error');
      }
    }
  };

  // Handle photo delete
  const handlePhotoDelete = async () => {
    if (!selectedPanel || !selectedPanel.existingImage) return;

    try {
      const response = await fetch(`http://localhost:3001/panelImages/${selectedPanel.existingImage.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadPanelImages(); // Reload panel images after delete

        setShowPhotoModal(false);
        setSelectedPanel(null);

        if (window.showAlert) {
          window.showAlert('Başarılı', 'Panel fotoğrafı başarıyla silindi!', 'success');
        }
      } else {
        throw new Error('Failed to delete image');
      }
    } catch (error) {
      console.error('Error deleting panel image:', error);
      if (window.showAlert) {
        window.showAlert('Hata', 'Fotoğraf silinirken bir hata oluştu.', 'error');
      }
    }
  };

  // Get panel image
  const getPanelImage = (agreementId, siteId, blockId, panelId) => {
    return panelImages.find(img => 
      img.agreementId === agreementId.toString() && 
      img.siteId === siteId && 
      img.blockId === blockId && 
      img.panelId === panelId.toString()
    );
  };

  // Helper function to generate panel name
  const generatePanelName = (siteId, blockLabel, panelNumber) => {
    return `${siteId}${blockLabel}${panelNumber}`;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <div className="loading-spinner mx-auto"></div>
          <p className="mt-3 text-muted">Veriler yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/');
    return null;
  }

  const activeAndFutureAgreements = getActiveAndFutureAgreements();

  return (
    <div className="container-fluid">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h3 fw-bold">Personel Panosu</h2>
          <p className="text-muted mb-0">Tüm aktif ve gelecek anlaşma panelleri</p>
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

      {/* Statistics Cards */}
      <div className="row g-4 mb-4">
        <div className="col-lg-2 col-md-4 col-sm-6">
          <div className="card custom-card shadow-sm border-0">
            <div className="card-body text-center">
              <div className="d-flex align-items-center justify-content-center mb-3">
                <div className="bg-primary bg-opacity-10 rounded-circle p-3">
                  <i className="bi bi-file-earmark-text text-primary fs-4"></i>
                </div>
              </div>
              <h3 className="fw-bold text-primary mb-1">{filteredAgreements.length}</h3>
              <p className="text-muted mb-0">Filtrelenmiş Anlaşma</p>
            </div>
          </div>
        </div>
        
        <div className="col-lg-2 col-md-4 col-sm-6">
          <div className="card custom-card shadow-sm border-0">
            <div className="card-body text-center">
              <div className="d-flex align-items-center justify-content-center mb-3">
                <div className="bg-success bg-opacity-10 rounded-circle p-3">
                  <i className="bi bi-check-circle text-success fs-4"></i>
                </div>
              </div>
              <h3 className="fw-bold text-success mb-1">
                {agreements.filter(a => a.status === 'active').length}
              </h3>
              <p className="text-muted mb-0">Aktif Anlaşma</p>
            </div>
          </div>
        </div>
        
        <div className="col-lg-2 col-md-4 col-sm-6">
          <div className="card custom-card shadow-sm border-0">
            <div className="card-body text-center">
              <div className="d-flex align-items-center justify-content-center mb-3">
                <div className="bg-info bg-opacity-10 rounded-circle p-3">
                  <i className="bi bi-building text-info fs-4"></i>
                </div>
              </div>
              <h3 className="fw-bold text-info mb-1">
                {sites.filter(site => site.siteType !== 'business_center').length}
              </h3>
              <p className="text-muted mb-0">Siteler</p>
            </div>
          </div>
        </div>
        
        <div className="col-lg-2 col-md-4 col-sm-6">
          <div className="card custom-card shadow-sm border-0">
            <div className="card-body text-center">
              <div className="d-flex align-items-center justify-content-center mb-3">
                <div className="bg-secondary bg-opacity-10 rounded-circle p-3">
                  <i className="bi bi-briefcase text-secondary fs-4"></i>
                </div>
              </div>
              <h3 className="fw-bold text-secondary mb-1">
                {sites.filter(site => site.siteType === 'business_center').length}
              </h3>
              <p className="text-muted mb-0">İş Merkezleri</p>
            </div>
          </div>
        </div>
        
        <div className="col-lg-2 col-md-4 col-sm-6">
          <div className="card custom-card shadow-sm border-0">
            <div className="card-body text-center">
              <div className="d-flex align-items-center justify-content-center mb-3">
                <div className="bg-warning bg-opacity-10 rounded-circle p-3">
                  <i className="bi bi-grid-3x3-gap text-warning fs-4"></i>
                </div>
              </div>
              <h3 className="fw-bold text-warning mb-1">
                {filteredAgreements.reduce((total, agreement) => {
                  return total + Object.values(agreement.sitePanelCounts || {}).reduce((sum, count) => sum + parseInt(count || 0), 0);
                }, 0)}
              </h3>
              <p className="text-muted mb-0">Filtrelenmiş Panel</p>
            </div>
          </div>
        </div>
      </div>

      {/* Date Filter Section */}
      <div className="row g-4 mb-4">
        <div className="col-md-12">
          <div className="card custom-card shadow-sm">
            <div className="card-header bg-info-subtle">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-calendar-range me-2"></i>
                Tarih Filtresi
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label fw-medium">Başlangıç Tarihi:</label>
                  <input
                    type="date"
                    className="form-control"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-medium">Bitiş Tarihi:</label>
                  <input
                    type="date"
                    className="form-control"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="col-md-4 d-flex align-items-end">
                  <button
                    className="btn btn-outline-secondary me-2"
                    onClick={clearDateFilters}
                  >
                    <i className="bi bi-x-circle me-1"></i>
                    Temizle
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleDateFilterChange}
                  >
                    <i className="bi bi-funnel me-1"></i>
                    Filtrele
                  </button>
                </div>
              </div>
              {(startDate || endDate) && (
                <div className="mt-3">
                  <small className="text-muted">
                    <i className="bi bi-info-circle me-1"></i>
                    Filtre: {startDate ? `Başlangıç: ${formatDate(startDate)}` : ''} 
                    {startDate && endDate ? ' - ' : ''} 
                    {endDate ? `Bitiş: ${formatDate(endDate)}` : ''}
                  </small>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* All Agreement Panels */}
      {filteredAgreements.length > 0 ? (
        <div className="row g-4 mb-4">
          <div className="col-md-12">
            <div className="card custom-card shadow-sm">
              <div className="card-header bg-primary-subtle">
                <h5 className="mb-0 fw-bold">
                  <i className="bi bi-tv me-2"></i>
                  Filtrelenmiş Anlaşma Panelleri
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-4">
                  {filteredAgreements.map((agreement) => (
                    <div key={agreement.id} className="col-lg-12">
                      <div className="card border-primary h-100">
                        <div className="card-header bg-primary-subtle">
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="mb-0 fw-bold">
                                <i className="bi bi-file-earmark-text me-2"></i>
                                Anlaşma ID: {agreement.id}
                              </h6>
                              <small className="text-muted">
                                {formatDate(agreement.startDate)} - {formatDate(agreement.endDate)}
                              </small>
                              <div className="mt-1">
                                <span className={`badge ${
                                  agreement.status === 'active' 
                                    ? 'bg-success-subtle text-success-emphasis' 
                                    : 'bg-info-subtle text-info-emphasis'
                                }`}>
                                  {agreement.status === 'active' ? 'Aktif' : 'Gelecek'}
                                </span>
                                <span className="badge bg-secondary-subtle text-secondary-emphasis ms-2">
                                  {helpers.getCompanyName(agreement.companyId)}
                                </span>
                              </div>
                            </div>
                            <div className="fw-bold text-primary">
                              {helpers.formatCurrency(agreement.totalAmount)}
                            </div>
                          </div>
                        </div>
                        <div className="card-body">
                          {/* Sites, Blocks, and Panels */}
                          <div className="row g-3">
                            {(agreement.siteIds || []).map((siteId) => {
                              const site = getSiteById(siteId);
                              if (!site) return null;
                              
                              // Calculate panels based on site type
                              let blockCount, panelsPerBlock, blockLabels;
                              
                              if (site.siteType === 'business_center') {
                                // For business centers, use manual panel count and single block
                                blockCount = 1;
                                panelsPerBlock = parseInt(site.panels) || 0;
                                blockLabels = ['A']; // Single block for business centers
                              } else {
                                // For regular sites, use blocks and elevators
                                blockCount = parseInt(site.blocks) || 0;
                                const elevatorsPerBlock = parseInt(site.elevatorsPerBlock) || 0;
                                panelsPerBlock = elevatorsPerBlock * 2;
                                blockLabels = helpers.generateBlockLabels(blockCount);
                              }
                              const usedBlocks = agreement.siteBlockSelections?.[siteId] || [];
                              const panelSelections = agreement.sitePanelSelections?.[siteId] || {};
                              
                              return (
                                <div key={siteId} className="col-md-12">
                                  <div className="card border-info">
                                    <div className="card-header bg-info-subtle">
                                      <div className="d-flex justify-content-between align-items-center">
                                        <h6 className="mb-0">
                                          <i className="bi bi-building me-2"></i>
                                          {site.name}
                                        </h6>
                                        <span className="badge bg-primary-subtle text-primary-emphasis">
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
                                                <div className="card border-warning">
                                                  <div className="card-header bg-warning-subtle">
                                                    <h6 className="mb-0 fw-bold">
                                                      <i className={`bi ${site.siteType === 'business_center' ? 'bi-briefcase' : 'bi-grid-3x3-gap'} me-1`}></i>
                                                      {site.siteType === 'business_center' ? 'İş Merkezi' : `${blockLabel} Blok`}
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
                                                            const panelImage = getPanelImage(agreement.id.toString(), siteId, blockId, panelId.toString());
                                                            
                                                            return (
                                                              <div
                                                                key={panelKey}
                                                                className={`d-flex align-items-center justify-content-center ${
                                                                  panelImage ? '' : (isPanelUsed ? 'bg-primary text-white' : 'bg-light text-muted')
                                                                } border rounded position-relative`}
                                                                style={{
                                                                  width: panelImage ? '90px' : '60px',
                                                                  height: panelImage ? '120px' : '80px',
                                                                  fontSize: '8px',
                                                                  fontWeight: 'bold',
                                                                  flexDirection: 'column',
                                                                  cursor: isPanelUsed ? 'pointer' : 'default',
                                                                  backgroundImage: panelImage ? `url(${panelImage.url})` : 'none',
                                                                  backgroundSize: 'cover',
                                                                  backgroundPosition: 'center',
                                                                  backgroundRepeat: 'no-repeat',
                                                                  minHeight: panelImage ? '120px' : '80px'
                                                                }}
                                                                title={isPanelUsed ? `Panel ${fullPanelNumber} - ${helpers.getCompanyName(agreement.companyId)}${panelImage ? ' (Fotoğraf var)' : ''}` : `Panel ${panelId} - Boş`}
                                                                onClick={() => {
                                                                  if (isPanelUsed) {
                                                                    handlePanelClick(agreement, siteId, blockId, panelId);
                                                                  }
                                                                }}
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
                                                                      <i className="bi bi-camera text-warning"></i>
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
      ) : (
        <div className="row g-4 mb-4">
          <div className="col-md-12">
            <div className="card custom-card shadow-sm">
              <div className="card-body text-center py-5">
                <i className="bi bi-file-earmark text-muted fs-1"></i>
                <h4 className="text-muted mt-3">
                  {(startDate || endDate) ? 'Seçilen tarih aralığında anlaşma bulunamadı' : 'Henüz anlaşma bulunmamaktadır'}
                </h4>
                <p className="text-muted">
                  {(startDate || endDate) ? 'Farklı tarih aralığı seçmeyi deneyin.' : 'Aktif veya gelecek anlaşma bulunamadı.'}
                </p>
                {(startDate || endDate) && (
                  <button
                    className="btn btn-outline-primary mt-3"
                    onClick={clearDateFilters}
                  >
                    <i className="bi bi-x-circle me-1"></i>
                    Filtreleri Temizle
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo Upload Modal */}
      {showPhotoModal && selectedPanel && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-camera me-2"></i>
                  Panel Fotoğrafı Yükle
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowPhotoModal(false);
                    setSelectedPanel(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="text-center mb-3">
                  <h6 className="fw-bold">Panel: {selectedPanel.fullPanelNumber}</h6>
                  <p className="text-muted mb-0">
                    Firma: {helpers.getCompanyName(selectedPanel.agreement.companyId)}
                  </p>
                </div>

                {selectedPanel.existingImage && (
                  <div className="mb-3">
                    <h6 className="text-center mb-2">Mevcut Fotoğraf:</h6>
                    <div className="text-center">
                      <img 
                        src={selectedPanel.existingImage.url}
                        alt="Mevcut Panel Fotoğrafı"
                        style={{ 
                          maxWidth: '200px', 
                          maxHeight: '200px', 
                          objectFit: 'cover',
                          border: '2px solid #dee2e6',
                          borderRadius: '8px'
                        }}
                      />
                    </div>
                  </div>
                )}
                
                <div className="d-grid gap-2">
                  <button
                    className="btn btn-primary"
                    onClick={async () => {
                      try {
                        // Check if getUserMedia is supported
                        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                          // Request camera permission and open camera
                          const stream = await navigator.mediaDevices.getUserMedia({ 
                            video: { 
                              facingMode: 'environment' // Rear camera
                            } 
                          });
                          
                          // Create a video element to show camera preview
                          const video = document.createElement('video');
                          video.srcObject = stream;
                          video.style.width = '100%';
                          video.style.height = '300px';
                          video.style.objectFit = 'cover';
                          video.autoplay = true;
                          video.muted = true;
                          
                          // Create modal for camera preview
                          const modal = document.createElement('div');
                          modal.style.position = 'fixed';
                          modal.style.top = '0';
                          modal.style.left = '0';
                          modal.style.width = '100%';
                          modal.style.height = '100%';
                          modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
                          modal.style.zIndex = '9999';
                          modal.style.display = 'flex';
                          modal.style.flexDirection = 'column';
                          modal.style.alignItems = 'center';
                          modal.style.justifyContent = 'center';
                          
                          // Create camera container
                          const cameraContainer = document.createElement('div');
                          cameraContainer.style.backgroundColor = 'white';
                          cameraContainer.style.padding = '20px';
                          cameraContainer.style.borderRadius = '10px';
                          cameraContainer.style.maxWidth = '90%';
                          cameraContainer.style.maxHeight = '90%';
                          
                          // Create buttons container
                          const buttonsContainer = document.createElement('div');
                          buttonsContainer.style.marginTop = '20px';
                          buttonsContainer.style.display = 'flex';
                          buttonsContainer.style.gap = '10px';
                          buttonsContainer.style.justifyContent = 'center';
                          
                          // Create capture button
                          const captureBtn = document.createElement('button');
                          captureBtn.textContent = 'Fotoğraf Çek';
                          captureBtn.style.padding = '10px 20px';
                          captureBtn.style.backgroundColor = '#007bff';
                          captureBtn.style.color = 'white';
                          captureBtn.style.border = 'none';
                          captureBtn.style.borderRadius = '5px';
                          captureBtn.style.cursor = 'pointer';
                          
                          // Create cancel button
                          const cancelBtn = document.createElement('button');
                          cancelBtn.textContent = 'İptal';
                          cancelBtn.style.padding = '10px 20px';
                          cancelBtn.style.backgroundColor = '#6c757d';
                          cancelBtn.style.color = 'white';
                          cancelBtn.style.border = 'none';
                          cancelBtn.style.borderRadius = '5px';
                          cancelBtn.style.cursor = 'pointer';
                          
                          // Create canvas for capturing
                          const canvas = document.createElement('canvas');
                          const context = canvas.getContext('2d');
                          
                          // Capture photo function
                          captureBtn.onclick = () => {
                            canvas.width = video.videoWidth;
                            canvas.height = video.videoHeight;
                            context.drawImage(video, 0, 0);
                            
                            canvas.toBlob((blob) => {
                              if (blob) {
                                const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
                                handlePhotoUpload(file);
                              }
                            }, 'image/jpeg', 0.8);
                            
                            // Stop camera and close modal
                            stream.getTracks().forEach(track => track.stop());
                            document.body.removeChild(modal);
                          };
                          
                          // Cancel function
                          cancelBtn.onclick = () => {
                            stream.getTracks().forEach(track => track.stop());
                            document.body.removeChild(modal);
                          };
                          
                          // Assemble modal
                          buttonsContainer.appendChild(captureBtn);
                          buttonsContainer.appendChild(cancelBtn);
                          cameraContainer.appendChild(video);
                          cameraContainer.appendChild(buttonsContainer);
                          modal.appendChild(cameraContainer);
                          document.body.appendChild(modal);
                          
                        } else {
                          // Fallback to file input
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.capture = 'environment';
                          input.onchange = (e) => {
                            if (e.target.files && e.target.files[0]) {
                              handlePhotoUpload(e.target.files[0]);
                            }
                          };
                          input.click();
                        }
                      } catch (error) {
                        console.error('Camera error:', error);
                        // Fallback to file input
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.capture = 'environment';
                        input.onchange = (e) => {
                          if (e.target.files && e.target.files[0]) {
                            handlePhotoUpload(e.target.files[0]);
                          }
                        };
                        input.click();
                      }
                    }}
                  >
                    <i className="bi bi-camera me-2"></i>
                    Kamera ile Çek
                  </button>
                  
                  <button
                    className="btn btn-outline-primary"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e) => {
                        if (e.target.files && e.target.files[0]) {
                          handlePhotoUpload(e.target.files[0]);
                        }
                      };
                      input.click();
                    }}
                  >
                    <i className="bi bi-image me-2"></i>
                    Galeriden Seç
                  </button>

                  {selectedPanel.existingImage && (
                    <button
                      className="btn btn-danger"
                      onClick={handlePhotoDelete}
                    >
                      <i className="bi bi-trash me-2"></i>
                      Fotoğrafı Sil
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PersonnelDashboard;
