import React, { useState, useEffect } from 'react';
import { getSiteData, getSites, getCompanies, getPanelImages, getAgreements, getTransactions } from '../services/api';
import logger from '../utils/logger';
import { getUser } from '../utils/auth';
import SiteHelpers from '../components/Sites/SiteHelpers';

const SiteDashboard = () => {
  const [siteData, setSiteData] = useState({
    site: null,
    agreements: [],
    transactions: []
  });
  const [companies, setCompanies] = useState([]);
  const [panelImages, setPanelImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPanels: 0,
    usedPanels: 0,
    activeAgreements: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    totalPendingAmount: 0,
    totalPaidAmount: 0
  });
  const [futurePayments, setFuturePayments] = useState([]);
  const [paymentFilter, setPaymentFilter] = useState({
    dateFrom: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    showPaid: true,
    showUnpaid: true
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const user = getUser();
  const siteId = user?.siteId;

  useEffect(() => {
    const fetchData = async () => {
      if (!siteId) {
        setLoading(false);
        return;
      }

      try {
        const [data, companiesData, allPanelImages, allAgreements, allTransactions] = await Promise.all([
          getSiteData(siteId),
          getCompanies(),
          getPanelImages(),
          getAgreements(),
          getTransactions()
        ]);
        
        setSiteData(data);
        setCompanies(companiesData);
        setPanelImages(allPanelImages);
        
        // Calculate statistics
        if (data.site) {
          const totalPanels = parseInt(data.site.panels) || 0;
          
          // Count only panels from active and paid agreements
          const isAgreementPaid = (agreement) => agreement.paymentReceived || agreement.creditPaymentReceived;
          
          // Count used panels by checking all active and paid agreements
          let usedPanels = 0;
          data.agreements
            .filter(a => a.status === 'active' && isAgreementPaid(a) && Array.isArray(a.siteIds) && a.siteIds.includes(siteId))
            .forEach(agreement => {
              // Add the panel count for this site in this agreement
              usedPanels += agreement.sitePanelCounts?.[siteId] || 0;
            });
          
          const activeAgreements = data.agreements.filter(a => a.status === 'active' && Array.isArray(a.siteIds) && a.siteIds.includes(siteId)).length;
          
          // Calculate total revenue from both income and expense transactions
          // Income: payments received from companies for agreements
          // Expense: payments made to sites (these count as revenue for the site)
          const incomeTransactions = data.transactions.filter(t => 
            t.type === 'income' && 
            t.source?.includes('Anlaşma Ödemesi') &&
            // Make sure this transaction is related to an agreement for this site
            data.agreements.some(a => 
              Array.isArray(a.siteIds) && a.siteIds.includes(siteId) && 
              t.source?.includes(a.id)
            )
          );
          
          const expenseTransactions = data.transactions.filter(t => 
            t.type === 'expense' && 
            t.source?.includes('Site Ödemesi') && 
            t.source?.includes(data.site.name)
          );
          
          const totalRevenue = [
            ...incomeTransactions,
            ...expenseTransactions
          ].reduce((sum, t) => sum + Math.abs(t.amount), 0);
          
          
          // Calculate future payments using the same logic as SitesMain
          const helpers = SiteHelpers({
            companies: companiesData,
            sites: [data.site],
            agreements: allAgreements,
            transactions: allTransactions
          });
          const calculatedFuturePayments = helpers.calculatePendingPayments(data.site, allAgreements, companiesData, allTransactions);
          const totalFutureAmount = calculatedFuturePayments.reduce((sum, payment) => {
            const amount = parseFloat(payment.amount) || 0;
            return sum + (isNaN(amount) ? 0 : amount);
          }, 0);

          setFuturePayments(calculatedFuturePayments);
          setStats({
            totalPanels,
            usedPanels,
            activeAgreements,
            totalRevenue: totalRevenue || 0,
            futurePayments: calculatedFuturePayments.length,
            totalFutureAmount: isNaN(totalFutureAmount) ? 0 : totalFutureAmount
          });
        } else {
          // Site not found - show error message
          logger.error('Site not found for siteId:', siteId);
          setStats({
            totalPanels: 0,
            usedPanels: 0,
            activeAgreements: 0,
            totalRevenue: 0,
            futurePayments: 0,
            totalFutureAmount: 0
          });
        }
      } catch (error) {
        logger.error('Error fetching site data:', error);
        setStats({
          totalPanels: 0,
          usedPanels: 0,
          activeAgreements: 0,
          totalRevenue: 0,
          futurePayments: 0,
          totalFutureAmount: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [siteId]);

  // Get company name by ID
  const getCompanyName = (companyId) => {
    const company = companies.find(c => String(c.id) === String(companyId));
    return company ? company.name : 'Unknown';
  };

  // Get panel image from personnel uploads
  const getPanelImage = (agreementId, siteId, blockId, panelId) => {
    return panelImages.find(img =>
      img.agreementId === agreementId.toString() &&
      img.siteId === siteId &&
      img.blockId === blockId &&
      img.panelId === panelId.toString()
    );
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

  // Generate block labels (A, B, C, etc.)
  const generateBlockLabels = (blockCount) => {
    const labels = [];
    for (let i = 0; i < blockCount; i++) {
      labels.push(String.fromCharCode(65 + i)); // A, B, C, etc.
    }
    return labels;
  };

  // Calculate panel distribution across blocks
  const getPanelBlockInfo = () => {
    if (!siteData.site) return [];
    
    const isBusinessCenter = siteData.site.siteType === 'business_center';

    // İş merkezleri için blok/panel hesabı farklı:
    // - Her iş merkezi tek blok gibi düşünülür (A)
    // - Panel sayısı doğrudan site.panels alanından alınır
    const blocks = isBusinessCenter ? 1 : (parseInt(siteData.site.blocks) || 0);
    const elevatorsPerBlock = isBusinessCenter ? 0 : (parseInt(siteData.site.elevatorsPerBlock) || 0);
    const panelsPerElevator = 2; // Siteler için her asansörde 2 panel
    const panelsPerBlock = isBusinessCenter
      ? (parseInt(siteData.site.panels) || 0)
      : elevatorsPerBlock * panelsPerElevator;
    
    const blockInfo = [];
    let panelCounter = 1;
    
    const blockLabels = isBusinessCenter ? ['A'] : generateBlockLabels(blocks);
    
    for (let blockIndex = 0; blockIndex < blocks; blockIndex++) {
      const blockNumber = blockIndex + 1;
      const blockLabel = blockLabels[blockIndex] || 'A';
      const blockPanels = [];
      
      for (let panelInBlock = 0; panelInBlock < panelsPerBlock; panelInBlock++) {
        if (panelCounter <= stats.totalPanels) {
          const panelId = `panel-${panelInBlock + 1}`; // Panel IDs are 1-based
          const isActive = isPanelUsedInActiveAgreements(blockIndex, panelInBlock);
          blockPanels.push({
            panelNumber: panelCounter,
            panelId: panelId,
            isActive,
            blockIndex,
            panelInBlock,
            elevatorNumber: Math.floor(panelInBlock / panelsPerElevator) + 1,
            panelInElevator: (panelInBlock % panelsPerElevator) + 1
          });
          panelCounter++;
        }
      }
      
      if (blockPanels.length > 0) {
        blockInfo.push({
          blockNumber,
          blockLabel,
          panels: blockPanels,
          activePanels: blockPanels.filter(p => p.isActive).length,
          totalPanels: blockPanels.length
        });
      }
    }
    
    return blockInfo;
  };

  // Check if a panel is used in any active agreement
  // An agreement is active if it's status is 'active' and payment has been received
  const isPanelUsedInActiveAgreements = (blockIndex, panelInBlock) => {
    const isAgreementPaid = (agreement) => agreement.paymentReceived || agreement.creditPaymentReceived;
    // Filter for active agreements that are also paid and include this site
    const activeAgreements = siteData.agreements.filter(a => 
      a.status === 'active' && 
      isAgreementPaid(a) && 
      Array.isArray(a.siteIds) && a.siteIds.includes(siteId)
    );
    
    const blockLabel = String.fromCharCode(65 + blockIndex); // A, B, C, etc.
    const blockId = `${siteId}-block-${blockLabel}`; // Format: siteId-block-A, siteId-block-B, etc.
    const panelId = `panel-${panelInBlock + 1}`; // Panel IDs are 1-based
    
    for (const agreement of activeAgreements) {
      // Check if this site has panel selections for this agreement
      if (agreement.sitePanelSelections && agreement.sitePanelSelections[siteId]) {
        const sitePanelData = agreement.sitePanelSelections[siteId];
        
        // Check if this block is selected for this site in this agreement
        if (sitePanelData[blockId]) {
          // Check if new format (with date ranges)
          if (agreement.dateRanges && Array.isArray(agreement.dateRanges) && agreement.dateRanges.length > 0) {
            // New format: check all date ranges
            for (let rangeIndex = 0; rangeIndex < agreement.dateRanges.length; rangeIndex++) {
              const rangeKey = `range-${rangeIndex}`;
              const rangePanels = sitePanelData[blockId]?.[rangeKey] || [];
              if (Array.isArray(rangePanels) && rangePanels.includes(panelId)) {
                return true;
              }
            }
          } else {
            // Old format: direct array check
            if (Array.isArray(sitePanelData[blockId]) && sitePanelData[blockId].includes(panelId)) {
              return true;
            }
          }
        }
      }
    }
    
    return false;
  };

  // Get panel usage information
  // An agreement is active if it's status is 'active' and payment has been received
  const getPanelUsageInfo = (blockIndex, panelInBlock) => {
    const isAgreementPaid = (agreement) => agreement.paymentReceived || agreement.creditPaymentReceived;
    // Filter for active agreements that are also paid and include this site
    const activeAgreements = siteData.agreements.filter(a => 
      a.status === 'active' && 
      isAgreementPaid(a) && 
      Array.isArray(a.siteIds) && a.siteIds.includes(siteId)
    );
    
    const blockLabel = String.fromCharCode(65 + blockIndex); // A, B, C, etc.
    const blockId = `${siteId}-block-${blockLabel}`; // Format: siteId-block-A, siteId-block-B, etc.
    const panelId = `panel-${panelInBlock + 1}`; // Panel IDs are 1-based
    
    for (const agreement of activeAgreements) {
      // Check if this site has panel selections for this agreement
      if (agreement.sitePanelSelections && agreement.sitePanelSelections[siteId]) {
        const sitePanelData = agreement.sitePanelSelections[siteId];
        
        // Check if this block is selected for this site in this agreement
        if (sitePanelData[blockId]) {
          // Check if new format (with date ranges)
          if (agreement.dateRanges && Array.isArray(agreement.dateRanges) && agreement.dateRanges.length > 0) {
            // New format: check all date ranges
            for (let rangeIndex = 0; rangeIndex < agreement.dateRanges.length; rangeIndex++) {
              const rangeKey = `range-${rangeIndex}`;
              const rangePanels = sitePanelData[blockId]?.[rangeKey] || [];
              if (Array.isArray(rangePanels) && rangePanels.includes(panelId)) {
                return {
                  agreementId: agreement.id,
                  companyName: getCompanyName(agreement.companyId),
                  startDate: agreement.startDate,
                  endDate: agreement.endDate,
                  photoUrl: agreement.photoUrl
                };
              }
            }
          } else {
            // Old format: direct array check
            if (Array.isArray(sitePanelData[blockId]) && sitePanelData[blockId].includes(panelId)) {
              return {
                agreementId: agreement.id,
                companyName: getCompanyName(agreement.companyId),
                startDate: agreement.startDate,
                endDate: agreement.endDate,
                photoUrl: agreement.photoUrl
              };
            }
          }
        }
      }
    }
    
    return null;
  };

  // Filter agreements based on payment filter and site
  const getFilteredAgreements = () => {
    let filtered = siteData.agreements.filter(a => Array.isArray(a.siteIds) && a.siteIds.includes(siteId));
    
    // Filter by payment status
    if (!paymentFilter.showPaid || !paymentFilter.showUnpaid) {
      const isAgreementPaid = (agreement) => agreement.paymentReceived || agreement.creditPaymentReceived;
      
      if (!paymentFilter.showPaid) {
        filtered = filtered.filter(a => !isAgreementPaid(a));
      }
      if (!paymentFilter.showUnpaid) {
        filtered = filtered.filter(a => isAgreementPaid(a));
      }
    }
    
    // Filter by date range
    if (paymentFilter.dateFrom) {
      filtered = filtered.filter(a => 
        new Date(a.startDate) >= new Date(paymentFilter.dateFrom)
      );
    }
    if (paymentFilter.dateTo) {
      filtered = filtered.filter(a => 
        new Date(a.endDate) <= new Date(paymentFilter.dateTo)
      );
    }
    
    return filtered;
  };

  // Handle payment filter changes
  const handleFilterChange = (field, value) => {
    setPaymentFilter(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setPaymentFilter({
      dateFrom: '',
      dateTo: '',
      showPaid: true,
      showUnpaid: true
    });
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <div className="loading-spinner mx-auto"></div>
          <p className="mt-3 text-muted">Site bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Show error if site not found
  if (!siteData.site) {
    return (
      <div className="container-fluid">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card border-danger shadow-sm mt-5">
              <div className="card-header bg-danger text-white">
                <h5 className="mb-0">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Site Bulunamadı
                </h5>
              </div>
              <div className="card-body">
                <div className="alert alert-danger">
                  <h6 className="alert-heading">Site bilgileri yüklenemedi</h6>
                  <p className="mb-2">
                    <strong>Site ID:</strong> {siteId || 'Belirtilmemiş'}
                  </p>
                  <p className="mb-0 small">
                    Bu site ID'si ile kayıtlı bir site bulunamadı. Lütfen:
                  </p>
                  <ul className="mb-0 mt-2 small">
                    <li>Site ID'nizin doğru olduğundan emin olun</li>
                    <li>Site'in Firebase'de kayıtlı olduğunu kontrol edin</li>
                    <li>Yönetici ile iletişime geçin</li>
                  </ul>
                </div>
                <div className="d-flex justify-content-end gap-2">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      localStorage.removeItem('token');
                      localStorage.removeItem('user');
                      window.location.href = '/';
                    }}
                  >
                    <i className="bi bi-arrow-left me-1"></i>
                    Ana Sayfaya Dön
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => window.location.reload()}
                  >
                    <i className="bi bi-arrow-clockwise me-1"></i>
                    Sayfayı Yenile
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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
                <div className="list-group-item">
                  <i className="bi bi-speedometer2 me-2"></i>
                  Site Panosu
                </div>
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
      {/* Site Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h3 fw-bold">{siteData.site?.name || 'Site Panosu'}</h2>
          <p className="text-muted mb-0">Site ID: {siteData.site?.id || siteId}</p>
        </div>
        <div className="text-end">
          <button 
            className="btn btn-outline-danger"
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.href = '/';
            }}
          >
            <i className="bi bi-box-arrow-right me-1"></i>
            Çıkış Yap
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row g-3 mb-4">
        <div className="col-lg-2 col-md-4">
          <div className="card custom-card bg-primary text-white">
            <div className="card-body text-center">
              <i className="bi bi-building fs-1 mb-2"></i>
              <h6 className="card-title">Toplam Panel</h6>
              <h3 className="card-text">{stats.totalPanels}</h3>
            </div>
          </div>
        </div>
        <div className="col-lg-2 col-md-4">
          <div className="card custom-card bg-success text-white">
            <div className="card-body text-center">
              <i className="bi bi-tv fs-1 mb-2"></i>
              <h6 className="card-title">Kullanılan Panel</h6>
              <h3 className="card-text">{stats.usedPanels}</h3>
            </div>
          </div>
        </div>
        <div className="col-lg-2 col-md-4">
          <div className="card custom-card bg-info text-white">
            <div className="card-body text-center">
              <i className="bi bi-file-earmark-text fs-1 mb-2"></i>
              <h6 className="card-title">Aktif Anlaşma</h6>
              <h3 className="card-text">{stats.activeAgreements}</h3>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="card custom-card bg-warning text-white">
            <div className="card-body text-center">
              <i className="bi bi-currency-dollar fs-1 mb-2"></i>
              <h6 className="card-title">Toplam Gelir</h6>
              <h4 className="card-text">{formatCurrency(stats.totalRevenue)}</h4>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="card custom-card bg-success text-white">
            <div className="card-body text-center">
              <i className="bi bi-arrow-down-circle fs-1 mb-2"></i>
              <h6 className="card-title">Gelecek Ödeme</h6>
              <h3 className="card-text">{stats.futurePayments}</h3>
              <div className="small">{formatCurrency(stats.totalFutureAmount)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Panel Visualization */}
      <div className="row g-4 mb-4">
        <div className="col-md-12">
          <div className="card custom-card shadow-sm">
            <div className="card-header bg-primary-subtle">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-grid-3x3-gap me-2"></i>
                Site Panelleri
              </h5>
            </div>
            <div className="card-body">
              {siteData.site ? (
                <div>
                  <div className="row g-3">
                    {(getPanelBlockInfo() || []).map((block) => (
                      <div key={block.blockNumber} className="col-lg-4 col-md-6">
                        <div className="card h-100">
                          <div className="card-header bg-primary text-white">
                            <h6 className="mb-0">
                              <i className="bi bi-building me-2"></i>
                              {block.blockLabel} Blok
                            </h6>
                          </div>
                          <div className="card-body">
                            <div className="d-flex justify-content-between mb-2">
                              <small>Kullanılan Paneller: {block.activePanels} / {block.totalPanels}</small>
                              <small>{Math.round((block.activePanels / block.totalPanels) * 100)}% Doluluk</small>
                            </div>
                            <div className="d-flex flex-wrap gap-2">
                              {(block.panels || []).map((panel) => {
                                const panelUsageInfo = panel.isActive ? getPanelUsageInfo(panel.blockIndex, panel.panelInBlock) : null;
                                const blockLabel = String.fromCharCode(65 + panel.blockIndex);
                                const blockId = `${siteId}-block-${blockLabel}`;
                                const panelId = `panel-${panel.panelInBlock + 1}`;
                                const personnelImage = panelUsageInfo ? getPanelImage(panelUsageInfo.agreementId, siteId, blockId, panelId) : null;
                                
                                return (
                                  <div
                                    key={panel.panelNumber}
                                    className={`d-flex align-items-center justify-content-center border rounded position-relative ${
                                      panel.isActive 
                                        ? 'bg-primary text-white border-primary' 
                                        : 'bg-light text-muted border-secondary'
                                    }`}
                                    style={{
                                      width: personnelImage ? '90px' : '60px',
                                      height: personnelImage ? '120px' : '60px',
                                      fontSize: '12px',
                                      fontWeight: 'bold',
                                      cursor: panel.isActive ? 'pointer' : 'default',
                                      backgroundImage: personnelImage ? `url(${personnelImage.url})` : 'none',
                                      backgroundSize: 'cover',
                                      backgroundPosition: 'center',
                                      backgroundRepeat: 'no-repeat',
                                      minHeight: personnelImage ? '120px' : '60px'
                                    }}
                                    title={
                                      panel.isActive && panelUsageInfo
                                        ? `Firma: ${panelUsageInfo.companyName}\nAnlaşma Süresi: ${formatDate(panelUsageInfo.startDate)} - ${formatDate(panelUsageInfo.endDate)}\nAnlaşma ID: ${panelUsageInfo.agreementId}${personnelImage ? '\nPersonel Fotoğrafı: Var' : ''}`
                                        : `Panel ${panel.panelNumber} - Boş`
                                    }
                                    onClick={() => {
                                      if (panel.isActive && panelUsageInfo) {
                                        // Show comprehensive panel info with all requested details
                                        let content = `
                                          <div class="text-start">
                                            <div class="mb-3">
                                              <strong>Reklam Veren Firma:</strong> ${panelUsageInfo.companyName}
                                            </div>
                                            <div class="mb-3">
                                              <strong>Anlaşma Süresi:</strong> ${formatDate(panelUsageInfo.startDate)} - ${formatDate(panelUsageInfo.endDate)}
                                            </div>
                                            <div class="mb-3">
                                              <strong>Anlaşma ID:</strong> ${panelUsageInfo.agreementId}
                                            </div>
                                        `;
                                        
                                        // Show personnel uploaded image if available
                                        if (personnelImage) {
                                          content += `
                                            <div class="text-center mt-3">
                                              <strong>Personel Tarafından Yüklenen Görsel:</strong>
                                              <div class="mt-2">
                                                <img src="${personnelImage.url}" style="max-width: 100%; max-height: 300px;" alt="Personel Görseli" class="border rounded" />
                                              </div>
                                            </div>
                                          `;
                                        }
                                        
                                        // Admin uploaded images are not shown in site panel view
                                        
                                        if (!personnelImage) {
                                          content += `
                                            <div class="text-center mt-3">
                                              <strong>Görseller:</strong>
                                              <div class="mt-2 text-muted">
                                                <i class="bi bi-image fs-1"></i>
                                                <p class="mb-0">Henüz personel tarafından görsel eklenmemiş</p>
                                              </div>
                                            </div>
                                          `;
                                        }
                                        
                                        content += `</div>`;
                                        
                                        window.showAlert(
                                          'Panel Bilgisi',
                                          content,
                                          'info'
                                        );
                                      }
                                    }}
                                  >
                                    {!personnelImage && (
                                      <div className="d-flex flex-column align-items-center justify-content-center h-100">
                                        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{panel.panelNumber}</div>
                                        {panel.isActive && panelUsageInfo?.companyName && (
                                          <div style={{ 
                                            fontSize: '9px', 
                                            lineHeight: '1.2', 
                                            marginTop: '4px',
                                            maxWidth: '55px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            textAlign: 'center',
                                            padding: '2px 4px',
                                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                            borderRadius: '4px',
                                            color: '#000'
                                          }}>
                                            {panelUsageInfo.companyName.length > 8 
                                              ? panelUsageInfo.companyName.substring(0, 8) + '...' 
                                              : panelUsageInfo.companyName}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    {panel.isActive && (
                                      <div className="position-absolute top-0 end-0" style={{ fontSize: '10px', padding: '2px' }}>
                                        {personnelImage ? (
                                          <i className="bi bi-camera-fill text-success bg-white rounded-circle p-1"></i>
                                        ) : (
                                          <i className="bi bi-lock-fill bg-white rounded-circle p-1"></i>
                                        )}
                                      </div>
                                    )}
                                    {personnelImage && (
                                      <div className="position-absolute bottom-0 start-0 end-0 bg-dark bg-opacity-75 text-white text-center" style={{ fontSize: '6px', padding: '2px' }}>
                                        Panel {panel.panelInBlock + 1}
                                      </div>
                                    )}
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
              ) : (
                <div className="text-center py-4">
                  <i className="bi bi-grid-3x3-gap text-muted fs-1"></i>
                  <p className="text-muted mt-2">Site bilgileri yüklenemedi.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Active Agreements with Photos */}
      {siteData.agreements.filter(a => a.status === 'active' && Array.isArray(a.siteIds) && a.siteIds.includes(siteId)).length > 0 && (
        <div className="row g-4 mb-4">
          <div className="col-md-12">
            <div className="card custom-card shadow-sm">
              <div className="card-header bg-success-subtle">
                <h5 className="mb-0 fw-bold">
                  <i className="bi bi-image me-2"></i>
                  Aktif Anlaşma Görselleri
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  {siteData.agreements
                    .filter(a => a.status === 'active' && a.photoUrl && Array.isArray(a.siteIds) && a.siteIds.includes(siteId))
                    .map((agreement) => (
                      <div key={agreement.id} className="col-lg-4 col-md-6">
                        <div className="card h-100">
                          <div className="card-header bg-light">
                            <h6 className="mb-0">
                              {getCompanyName(agreement.companyId)} - {agreement.id}
                            </h6>
                            <small className="text-muted">
                              {formatDate(agreement.startDate)} - {formatDate(agreement.endDate)}
                            </small>
                          </div>
                          <div className="card-body text-center">
                            {agreement.photoUrl ? (
                              <img 
                                src={agreement.photoUrl} 
                                alt="Reklam Görseli" 
                                className="img-fluid rounded"
                                style={{ maxHeight: '200px', objectFit: 'contain' }}
                              />
                            ) : (
                              <div className="text-muted">
                                <i className="bi bi-image fs-1"></i>
                                <p className="mt-2 mb-0">Görsel bulunamadı</p>
                              </div>
                            )}
                          </div>
                          <div className="card-footer text-muted small">
                            <i className="bi bi-tv me-1"></i>
                            {agreement.sitePanelCounts?.[siteId] || 0} panel
                          </div>
                        </div>
                      </div>
                    ))}
                  
                  {siteData.agreements.filter(a => a.status === 'active' && a.photoUrl && Array.isArray(a.siteIds) && a.siteIds.includes(siteId)).length === 0 && (
                    <div className="col-12">
                      <div className="text-center py-4">
                        <i className="bi bi-image text-muted fs-1"></i>
                        <p className="text-muted mt-2">Aktif anlaşmalar için henüz görsel eklenmemiş.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Agreements and Payments */}
      <div className="row g-4">
        <div className="col-md-12">
          <div className="card custom-card shadow-sm">
            <div className="card-header bg-info-subtle">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold">
                  <i className="bi bi-file-earmark-text me-2"></i>
                  Anlaşmalar ve Ödemeler
                </h5>
                <div className="d-flex gap-2">
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={paymentFilter.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    placeholder="Başlangıç Tarihi"
                  />
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={paymentFilter.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    placeholder="Bitiş Tarihi"
                  />
                  <button 
                    className="btn btn-sm btn-outline-secondary"
                    onClick={clearFilters}
                  >
                    <i className="bi bi-x-circle"></i>
                  </button>
                </div>
              </div>
            </div>
            <div className="card-body">
              {getFilteredAgreements().length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-file-earmark text-muted fs-1"></i>
                  <p className="text-muted mt-2">Seçilen kriterlere uygun anlaşma bulunmamaktadır.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table custom-table">
                    <thead>
                      <tr>
                        <th>Firma</th>
                        <th>Başlangıç</th>
                        <th>Bitiş</th>
                        <th>Panel Sayısı</th>
                        <th>Haftalık Ücret</th>
                        <th>Toplam Tutar</th>
                        <th>Durum</th>
                        <th>Ödeme</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(getFilteredAgreements() || []).map((agreement) => {
                        const isPaid = agreement.paymentReceived || agreement.creditPaymentReceived;
                        return (
                          <tr key={agreement.id}>
                            <td className="fw-medium">{getCompanyName(agreement.companyId)}</td>
                            <td>{formatDate(agreement.startDate)}</td>
                            <td>{formatDate(agreement.endDate)}</td>
                            <td>{agreement.sitePanelCounts?.[siteId] || 0}</td>
                            <td>{formatCurrency(agreement.weeklyRatePerPanel || 0)}</td>
                            <td className={isPaid ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                              {formatCurrency(agreement.totalAmount || 0)}
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
                            <td>
                              <span className={`badge ${
                                isPaid
                                  ? 'bg-success-subtle text-success-emphasis' 
                                  : 'bg-warning-subtle text-warning-emphasis'
                              }`}>
                                {isPaid ? 'Ödendi' : 'Bekliyor'}
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
          </div>
        </div>
      </div>

      {/* Payment History Section */}
      <div className="row g-4 mt-2">
        <div className="col-md-12">
          <div className="card custom-card shadow-sm">
            <div className="card-header bg-success-subtle">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-clock-history me-2"></i>
                Geçmiş Ödemeler
              </h5>
            </div>
            <div className="card-body">
              {siteData.transactions
                .filter(t => 
                  (t.type === 'income' && t.source?.includes('Anlaşma Ödemesi') && 
                   siteData.agreements.some(a => Array.isArray(a.siteIds) && a.siteIds.includes(siteId) && t.source?.includes(a.id))) ||
                  (t.type === 'expense' && t.source?.includes('Site Ödemesi') && t.source?.includes(siteData.site?.name))
                )
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-clock-history text-muted fs-1"></i>
                  <p className="text-muted mt-2">Henüz ödeme bulunmamaktadır.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table custom-table">
                    <thead>
                      <tr>
                        <th>Tarih</th>
                        <th>Tür</th>
                        <th>Açıklama</th>
                        <th>Tutar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {siteData.transactions
                        .filter(t => 
                          (t.type === 'income' && t.source?.includes('Anlaşma Ödemesi') && 
                           siteData.agreements.some(a => Array.isArray(a.siteIds) && a.siteIds.includes(siteId) && t.source?.includes(a.id))) ||
                          (t.type === 'expense' && t.source?.includes('Site Ödemesi') && t.source?.includes(siteData.site?.name))
                        )
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .map((transaction) => {
                          // Determine transaction type and description
                          let transactionType = '';
                          let description = '';
                          let amountClass = '';
                          
                          if (transaction.type === 'income' && transaction.source?.includes('Anlaşma Ödemesi')) {
                            transactionType = 'Firma Ödemesi';
                            amountClass = 'text-success fw-bold';
                            // Extract company name and agreement ID
                            const companyMatch = transaction.source?.match(/Anlaşma Ödemesi - ([^(]+)/);
                            const agreementMatch = transaction.source?.match(/Anlaşma Ödemesi - [^(]+ \(([^)]+)\)/);
                            const companyName = companyMatch ? companyMatch[1].trim() : 'Bilinmeyen Firma';
                            const agreementId = agreementMatch ? agreementMatch[1] : 'Bilinmiyor';
                            description = `${companyName} - Anlaşma #${agreementId}`;
                          } else if (transaction.type === 'expense' && transaction.source?.includes('Site Ödemesi')) {
                            transactionType = 'Site Ödemesi';
                            amountClass = 'text-primary fw-bold';
                            // Extract company name from description
                            const companyMatch = transaction.description?.match(/([^ ]+) anlaşmasından gelen ödeme/);
                            const companyName = companyMatch ? companyMatch[1] : 'Bilinmeyen Firma';
                            description = `${companyName} tarafından ödeme`;
                          }
                          
                          return (
                            <tr key={transaction.id}>
                              <td>{formatDate(transaction.date)}</td>
                              <td>
                                <span className={`badge ${
                                  transaction.type === 'income' 
                                    ? 'bg-success-subtle text-success-emphasis' 
                                    : 'bg-primary-subtle text-primary-emphasis'
                                }`}>
                                  {transactionType}
                                </span>
                              </td>
                              <td>{description}</td>
                              <td className={amountClass}>
                                {formatCurrency(Math.abs(transaction.amount))}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Future Payments Section */}
      <div className="row g-4 mt-2">
        <div className="col-md-12">
          <div className="card custom-card shadow-sm">
            <div className="card-header bg-success-subtle d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-arrow-down-circle me-2"></i>
                Gelecek Ödemeler
              </h5>
              <div className="fw-bold text-success">
                Toplam Gelecek: {formatCurrency(stats.totalFutureAmount)}
              </div>
            </div>
            <div className="card-body">
              {futurePayments.length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-check-circle text-success fs-1"></i>
                  <p className="text-muted mt-2">Gelecek ödeme bulunmamaktadır.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table custom-table">
                    <thead>
                      <tr>
                        <th>Anlaşma ID</th>
                        <th>Firma</th>
                        <th>Panel Sayısı</th>
                        <th>Haftalık Tutar</th>
                        <th>Site Yüzdesi</th>
                        <th>Site Ödemesi</th>
                        <th>Başlangıç Tarihi</th>
                        <th>Bitiş Tarihi</th>
                        <th>Ödeme Durumu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {futurePayments.map((payment, index) => (
                        <tr key={index}>
                          <td>#{payment.agreementId}</td>
                          <td className="fw-medium">{payment.companyName}</td>
                          <td>{payment.panelCount} panel</td>
                          <td>{formatCurrency(payment.weeklyRatePerPanel)}</td>
                          <td>{payment.sitePercentage}%</td>
                          <td className="text-success fw-bold">{formatCurrency(payment.amount)}</td>
                          <td>{formatDate(payment.startDate)}</td>
                          <td>{formatDate(payment.endDate)}</td>
                          <td>
                            <span className={`badge ${
                              payment.paymentReceived
                                ? 'bg-success-subtle text-success-emphasis' 
                                : 'bg-primary-subtle text-primary-emphasis'
                            }`}>
                              {payment.paymentReceived ? 'Nakit Ödendi' : 'Kredi ile Ödendi'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
};

export default SiteDashboard;