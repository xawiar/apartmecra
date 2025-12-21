import React, { useState, useEffect } from 'react';
import { getSiteData, getSites, getCompanies, getPanelImages, getAgreements, getTransactions, createSiteUpdateRequest } from '../services/api';
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [showEditSiteModal, setShowEditSiteModal] = useState(false);
  const [siteFormData, setSiteFormData] = useState({
    name: '',
    manager: '',
    phone: '',
    blocks: '',
    elevatorsPerBlock: '',
    apartmentCount: '',
    bankAccountName: '',
    iban: '',
    notes: ''
  });

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
        
        // Set initial site form data
        if (data.site) {
          setSiteFormData({
            name: data.site.name || '',
            manager: data.site.manager || '',
            phone: data.site.phone || '',
            blocks: data.site.blocks || '',
            elevatorsPerBlock: data.site.elevatorsPerBlock || '',
            apartmentCount: data.site.apartmentCount || '',
            bankAccountName: data.site.bankAccountName || '',
            iban: data.site.iban || '',
            notes: data.site.notes || ''
          });
        }
        
        // Debug: Log panel images with full details
        console.log('SiteDashboard - Loaded panel images:', allPanelImages);
        console.log('SiteDashboard - Site ID:', siteId);
        if (allPanelImages && allPanelImages.length > 0) {
          allPanelImages.forEach((img, index) => {
            console.log(`SiteDashboard - Panel image ${index + 1} FULL DETAILS:`, {
              id: img.id,
              agreementId: img.agreementId,
              agreementIdType: typeof img.agreementId,
              agreementIdString: String(img.agreementId),
              siteId: img.siteId,
              siteIdType: typeof img.siteId,
              blockId: img.blockId,
              blockIdType: typeof img.blockId,
              panelId: img.panelId,
              panelIdType: typeof img.panelId,
              panelIdString: String(img.panelId),
              url: img.url,
              fullObject: img
            });
          });
        }
        
        // Also log agreements to see what we're searching for
        console.log('SiteDashboard - ALL agreements:', data.agreements.length);
        console.log('SiteDashboard - ALL agreements details:', data.agreements.map(a => ({
          id: a.id,
          idType: typeof a.id,
          idString: String(a.id),
          status: a.status,
          paymentReceived: a.paymentReceived,
          creditPaymentReceived: a.creditPaymentReceived,
          siteIds: a.siteIds,
          siteIdsType: Array.isArray(a.siteIds) ? 'array' : typeof a.siteIds,
          siteIdsIncludesADA52: Array.isArray(a.siteIds) ? a.siteIds.includes(siteId) : false
        })));
        
        const activeAgreements = data.agreements.filter(a => 
          a.status === 'active' && 
          (a.paymentReceived || a.creditPaymentReceived) && 
          Array.isArray(a.siteIds) && a.siteIds.includes(siteId)
        );
        
        console.log('SiteDashboard - Active agreements for site:', activeAgreements.length);
        console.log('SiteDashboard - Active agreements details:', activeAgreements.map(a => ({
          id: a.id,
          idType: typeof a.id,
          idString: String(a.id),
          companyId: a.companyId,
          siteIds: a.siteIds,
          sitePanelSelections: a.sitePanelSelections ? Object.keys(a.sitePanelSelections) : null
        })));
        
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

  // Get panel image from personnel uploads - EXACT SAME LOGIC AS CompanyDashboard
  const getPanelImage = (agreementId, siteId, blockId, panelId, panelImagesArray) => {
    const images = panelImagesArray || panelImages;
    if (!images || images.length === 0) {
      console.log('getPanelImage: No images available');
      return null;
    }
    
    const searchAgreementId = agreementId?.toString();
    const searchSiteId = siteId;
    const searchBlockId = blockId;
    const searchPanelId = panelId?.toString();
    
    console.log('getPanelImage: Searching for', {
      agreementId: searchAgreementId,
      siteId: searchSiteId,
      blockId: searchBlockId,
      panelId: searchPanelId
    });
    
    const found = images.find(img => {
      const imgAgreementId = img.agreementId?.toString();
      const imgSiteId = img.siteId;
      const imgBlockId = img.blockId;
      const imgPanelId = img.panelId?.toString();
      
      const match = imgAgreementId === searchAgreementId && 
                    imgSiteId === searchSiteId && 
                    imgBlockId === searchBlockId && 
                    imgPanelId === searchPanelId;
      
      if (match) {
        console.log('getPanelImage: FOUND MATCH', img);
      }
      
      return match;
    });
    
    if (!found) {
      console.log('getPanelImage: NO MATCH FOUND. Available images:', images.map(img => ({
        agreementId: img.agreementId?.toString(),
        siteId: img.siteId,
        blockId: img.blockId,
        panelId: img.panelId?.toString()
      })));
    }
    
    return found || null;
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
  
  // Handle edit site
  const handleEditSite = () => {
    if (siteData.site) {
      setSiteFormData({
        name: siteData.site.name || '',
        manager: siteData.site.manager || '',
        phone: siteData.site.phone || '',
        blocks: siteData.site.blocks || '',
        elevatorsPerBlock: siteData.site.elevatorsPerBlock || '',
        apartmentCount: siteData.site.apartmentCount || '',
        bankAccountName: siteData.site.bankAccountName || '',
        iban: siteData.site.iban || '',
        notes: siteData.site.notes || ''
      });
      setShowEditSiteModal(true);
    }
  };
  
  // Handle site form change
  const handleSiteFormChange = (e) => {
    const { name, value } = e.target;
    setSiteFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle site form submit - Create update request instead of direct update
  const handleSiteFormSubmit = async (e) => {
    e.preventDefault();
    if (!siteData.site) return;
    
    try {
      // Create update request instead of direct update
      // Helper function to remove undefined values (Firestore doesn't accept undefined)
      const cleanData = (data) => {
        const cleaned = {};
        Object.keys(data).forEach(key => {
          if (data[key] !== undefined) {
            cleaned[key] = data[key] ?? null; // Convert undefined to null
          }
        });
        return cleaned;
      };
      
      const requestData = {
        siteId: siteData.site.id,
        siteName: siteData.site.name,
        requestedBy: user?.email || user?.username || 'Site User',
        requestedByRole: 'site_user',
        currentData: cleanData({
          name: siteData.site.name || '',
          manager: siteData.site.manager || '',
          phone: siteData.site.phone || '',
          blocks: siteData.site.blocks || 0,
          elevatorsPerBlock: siteData.site.elevatorsPerBlock || 0,
          apartmentCount: siteData.site.apartmentCount || 0,
          bankAccountName: siteData.site.bankAccountName || '',
          iban: siteData.site.iban || '',
          notes: siteData.site.notes || ''
        }),
        requestedData: cleanData(siteFormData),
        changes: {} // Will be calculated
      };
      
      // Calculate changes
      const changes = {};
      Object.keys(siteFormData).forEach(key => {
        if (siteFormData[key] !== requestData.currentData[key]) {
          changes[key] = {
            old: requestData.currentData[key],
            new: siteFormData[key]
          };
        }
      });
      
      requestData.changes = changes;
      
      if (Object.keys(changes).length === 0) {
        await window.showAlert('Bilgi', 'Değişiklik yapılmadı.', 'info');
        setShowEditSiteModal(false);
        return;
      }
      
      const request = await createSiteUpdateRequest(requestData);
      if (request) {
        setShowEditSiteModal(false);
        await window.showAlert(
          'Başarılı', 
          'Site bilgileri güncelleme talebi oluşturuldu. Admin onayından sonra değişiklikler uygulanacaktır.', 
          'success'
        );
      }
    } catch (error) {
      console.error('Error creating site update request:', error);
      await window.showAlert('Hata', 'Güncelleme talebi oluşturulurken bir hata oluştu.', 'error');
    }
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
    
    console.log('getPanelUsageInfo: Searching for panel:', {
      blockIndex,
      panelInBlock,
      blockLabel,
      blockId,
      panelId,
      activeAgreementsCount: activeAgreements.length
    });
    
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
                console.log('getPanelUsageInfo: FOUND in new format:', {
                  agreementId: agreement.id,
                  blockId,
                  panelId,
                  rangeKey
                });
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
              console.log('getPanelUsageInfo: FOUND in old format:', {
                agreementId: agreement.id,
                blockId,
                panelId
              });
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
    
    console.log('getPanelUsageInfo: NOT FOUND for panel:', { blockIndex, panelInBlock, blockId, panelId });
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
      {/* Site Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h3 fw-bold">{siteData.site?.name || 'Site Panosu'}</h2>
          <p className="text-muted mb-0">Site ID: {siteData.site?.id || siteId}</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button 
            className="btn btn-outline-primary"
            onClick={handleEditSite}
            title="Site Bilgilerini Düzenle"
          >
            <i className="bi bi-pencil me-1"></i>
            Bilgilerimi Düzenle
          </button>
          {/* Dropdown Menu */}
          <div className="dropdown">
            <button
              className="btn btn-outline-primary dropdown-toggle"
              type="button"
              id="siteMenuDropdown"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <i className="bi bi-list me-2"></i>
              Menü
            </button>
            <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="siteMenuDropdown">
              <li>
                <a className="dropdown-item active" href="#">
                  <i className="bi bi-speedometer2 me-2"></i>
                  Site Panosu
                </a>
              </li>
            </ul>
          </div>
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

      {/* Site Panels - Show panels for this site only */}
      {siteData.agreements.filter(a => 
        a.status === 'active' && 
        (a.paymentReceived || a.creditPaymentReceived) && 
        Array.isArray(a.siteIds) && a.siteIds.includes(siteId)
      ).length > 0 && (
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
                {siteData.agreements
                  .filter(a => 
                    a.status === 'active' && 
                    (a.paymentReceived || a.creditPaymentReceived) && 
                    Array.isArray(a.siteIds) && a.siteIds.includes(siteId)
                  )
                  .map((agreement) => {
                    const site = siteData.site;
                    if (!site) return null;
                    
                    // Calculate panels based on site type
                    let blockCount, panelsPerBlock, blockLabels;
                    
                    if (site.siteType === 'business_center') {
                      blockCount = 1;
                      panelsPerBlock = parseInt(site.panels) || 0;
                      blockLabels = ['A'];
                    } else {
                      blockCount = parseInt(site.blocks) || 0;
                      const elevatorsPerBlock = parseInt(site.elevatorsPerBlock) || 0;
                      panelsPerBlock = elevatorsPerBlock * 2;
                      blockLabels = generateBlockLabels(blockCount);
                    }
                    
                    // Collect blocks and panels from all date ranges
                    let usedBlocks = [];
                    let panelSelections = {};
                    
                    if (agreement.dateRanges && Array.isArray(agreement.dateRanges) && agreement.dateRanges.length > 0) {
                      agreement.dateRanges.forEach((range, rangeIndex) => {
                        const rangeKey = `range-${rangeIndex}`;
                        const rangeBlocks = agreement.siteBlockSelections?.[rangeKey]?.[siteId] || [];
                        usedBlocks = [...new Set([...usedBlocks, ...rangeBlocks])];
                        
                        const sitePanelData = agreement.sitePanelSelections?.[siteId] || {};
                        Object.keys(sitePanelData).forEach(blockKey => {
                          if (!panelSelections[blockKey]) {
                            panelSelections[blockKey] = [];
                          }
                          const rangePanels = sitePanelData[blockKey]?.[rangeKey] || [];
                          panelSelections[blockKey] = [...new Set([...panelSelections[blockKey], ...rangePanels])];
                        });
                      });
                    } else {
                      usedBlocks = agreement.siteBlockSelections?.[siteId] || [];
                      panelSelections = agreement.sitePanelSelections?.[siteId] || {};
                    }
                    
                    if (usedBlocks.length === 0) return null;
                    
                    return (
                      <div key={agreement.id} className="mb-4">
                        <div className="card border-primary">
                          <div className="card-header bg-primary-subtle">
                            <div className="d-flex justify-content-between align-items-center">
                              <h6 className="mb-0">
                                <i className="bi bi-building me-2"></i>
                                {getCompanyName(agreement.companyId)} - Anlaşma #{agreement.id}
                              </h6>
                              <span className="badge bg-info-subtle text-info-emphasis">
                                {agreement.sitePanelCounts?.[siteId] || 0} panel
                              </span>
                            </div>
                          </div>
                          <div className="card-body">
                            <div className="row g-3">
                              {usedBlocks.map((blockId) => {
                                const blockLabel = blockId.split('-')[2];
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
                                                title={isPanelUsed ? `Panel ${fullPanelNumber} - ${getCompanyName(agreement.companyId)}${panelImage ? ' (Fotoğraf var)' : ''}` : `Panel ${panelId} - Boş`}
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
                          </div>
                        </div>
                      </div>
                    );
                  })}
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

      {/* Edit Site Modal */}
      {showEditSiteModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <i className="bi bi-pencil me-2"></i>
                  Site Bilgilerini Düzenle
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowEditSiteModal(false)}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSiteFormSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label htmlFor="siteName" className="form-label">Site Adı *</label>
                      <input
                        type="text"
                        className="form-control"
                        id="siteName"
                        name="name"
                        value={siteFormData.name}
                        onChange={handleSiteFormChange}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="siteManager" className="form-label">Yönetici</label>
                      <input
                        type="text"
                        className="form-control"
                        id="siteManager"
                        name="manager"
                        value={siteFormData.manager}
                        onChange={handleSiteFormChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="sitePhone" className="form-label">Telefon *</label>
                      <input
                        type="text"
                        className="form-control"
                        id="sitePhone"
                        name="phone"
                        value={siteFormData.phone}
                        onChange={handleSiteFormChange}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="siteBlocks" className="form-label">Blok Sayısı</label>
                      <input
                        type="number"
                        className="form-control"
                        id="siteBlocks"
                        name="blocks"
                        value={siteFormData.blocks}
                        onChange={handleSiteFormChange}
                        min="0"
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="siteElevatorsPerBlock" className="form-label">Blok Başına Asansör Sayısı</label>
                      <input
                        type="number"
                        className="form-control"
                        id="siteElevatorsPerBlock"
                        name="elevatorsPerBlock"
                        value={siteFormData.elevatorsPerBlock}
                        onChange={handleSiteFormChange}
                        min="0"
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="siteApartmentCount" className="form-label">Daire Sayısı</label>
                      <input
                        type="number"
                        className="form-control"
                        id="siteApartmentCount"
                        name="apartmentCount"
                        value={siteFormData.apartmentCount}
                        onChange={handleSiteFormChange}
                        min="0"
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="siteBankAccountName" className="form-label">Banka Hesap Adı</label>
                      <input
                        type="text"
                        className="form-control"
                        id="siteBankAccountName"
                        name="bankAccountName"
                        value={siteFormData.bankAccountName}
                        onChange={handleSiteFormChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="siteIban" className="form-label">IBAN Numarası</label>
                      <input
                        type="text"
                        className="form-control"
                        id="siteIban"
                        name="iban"
                        value={siteFormData.iban}
                        onChange={handleSiteFormChange}
                        placeholder="TR00 0000 0000 0000 0000 0000 00"
                      />
                    </div>
                    <div className="col-md-12">
                      <label htmlFor="siteNotes" className="form-label">Notlar</label>
                      <textarea
                        className="form-control"
                        id="siteNotes"
                        name="notes"
                        value={siteFormData.notes}
                        onChange={handleSiteFormChange}
                        rows="3"
                      />
                    </div>
                  </div>
                  <div className="d-flex justify-content-end gap-2 mt-3">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowEditSiteModal(false)}>
                      İptal
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Kaydet
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SiteDashboard;