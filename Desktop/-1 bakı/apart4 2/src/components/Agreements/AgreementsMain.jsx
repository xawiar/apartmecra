import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getAgreements, createAgreement, updateAgreement, deleteAgreement, archiveAgreement } from '../../services/api';
import { getSites, updateSite } from '../../services/api';
import { getCompanies, updateCompany } from '../../services/api';
import { createTransaction } from '../../services/api';
import { createLog, getUsers, createUser, updateUser } from '../../services/api';
import logger from '../../utils/logger';
import { safeFilter, safeMap, safeFind } from '../../utils/safeAccess';
import { isObserver } from '../../utils/auth';
import AgreementHandlers from './AgreementHandlers';
import AgreementUIHandlers from './AgreementUIHandlers';
import AgreementHelpers from './AgreementHelpers';
import AgreementTable from './AgreementTable';
import AgreementDetailModal from './AgreementDetailModal';
import AgreementPhotoModal from './AgreementPhotoModal';
import AgreementFormModal from './AgreementFormModal';
import PaymentModal from './PaymentModal';
import CheckManagementModal from './CheckManagementModal';

const AgreementsMain = () => {
  const [agreements, setAgreements] = useState([]);
  const [sites, setSites] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Helper function to remove duplicates from agreements array
  const removeDuplicateAgreements = (agreementsList) => {
    if (!Array.isArray(agreementsList)) {
      logger.warn('removeDuplicateAgreements: agreementsList is not an array', agreementsList);
      return [];
    }
    
    const seenKeys = new Set();
    const uniqueAgreements = [];
    
    for (const agreement of agreementsList) {
      if (!agreement) continue;
      
      // Create a unique key: prefer _docId, fallback to id
      let uniqueKey = null;
      if (agreement._docId) {
        uniqueKey = `docId:${String(agreement._docId)}`;
      } else if (agreement.id) {
        uniqueKey = `id:${String(agreement.id)}`;
      }
      
      // If no unique key, skip this agreement (but log it)
      if (!uniqueKey) {
        logger.warn('Agreement has no _docId or id:', agreement);
        continue;
      }
      
      // Check if we've seen this key before
      if (seenKeys.has(uniqueKey)) {
        logger.log('Duplicate agreement found:', uniqueKey);
        continue; // Skip duplicate
      }
      
      // Add to seen set and include in unique list
      seenKeys.add(uniqueKey);
      uniqueAgreements.push(agreement);
    }
    
    return uniqueAgreements;
  };
  
  // Wrapper for setAgreements that always removes duplicates
  const setAgreementsUnique = (newAgreements) => {
    const unique = removeDuplicateAgreements(Array.isArray(newAgreements) ? newAgreements : []);
    setAgreements(unique);
  };
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
  
  // State for payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAgreement, setPaymentAgreement] = useState(null);
  
  // State for check management modal
  const [showCheckManagement, setShowCheckManagement] = useState(false);
  
  // State for active/expired/orders tabs
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'expired', or 'orders'
  
  const [formData, setFormData] = useState({
    companyId: '',
    startDate: '', // Geriye uyumluluk için
    endDate: '', // Geriye uyumluluk için
    dateRanges: [{ startDate: '', endDate: '' }], // Birden fazla tarih aralığı
    weeklyRatePerPanel: '',
    totalAmount: '', // Opsiyonel: Toplam anlaşma bedeli
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
      logger.error('createTransaction is not a function or is undefined');
    }
    if (typeof updateAgreement !== 'function') {
      logger.error('updateAgreement is not a function or is undefined');
    }
    if (typeof updateSite !== 'function') {
      logger.error('updateSite is not a function or is undefined');
    }
    if (typeof createLog !== 'function') {
      logger.error('createLog is not a function or is undefined');
    }
    if (typeof window.showAlert !== 'function') {
      logger.warn('window.showAlert is not available, custom alerts may not work');
    }
    if (typeof window.showConfirm !== 'function') {
      logger.warn('window.showConfirm is not available, custom confirms may not work');
    }
  }, []);

  // Helper object (no React hooks inside AgreementHelpers, safe to call directly)
  const helpers = AgreementHelpers({
    companies,
    sites,
    agreements,
    sitePanelSelections,
    selectedWeeks,
    formData
  });
  
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
        const archivePromises = (agreements || []).map(async (agreement) => {
          try {
            // Use _docId if available (Firestore document ID), otherwise use id (custom ID)
            const agreementIdToUse = agreement._docId || agreement.id;
            if (!agreementIdToUse) {
              errorCount++;
              logger.error('Agreement has no ID or _docId:', agreement);
              return { success: false, agreementId: null, error: 'Agreement has no ID' };
            }
            
            const result = await archiveAgreement(agreementIdToUse);
            if (result && result.success) {
              successCount++;
              // Log the action
              await createLog({
                user: 'Admin',
                action: `Anlaşma arşivlendi: ${helpers.getCompanyName(agreement.companyId)} (${agreementIdToUse})`
              });
              return { success: true, agreementId: agreementIdToUse };
            } else {
              errorCount++;
              logger.error('Failed to archive agreement:', agreementIdToUse, result);
              return { success: false, agreementId: agreementIdToUse, error: result?.error || 'Unknown error' };
            }
          } catch (error) {
            logger.error('Error archiving agreement:', agreement.id || agreement._docId, error);
            errorCount++;
            return { success: false, agreementId: agreement._docId || agreement.id, error: error.message };
          }
        });
        
        // Wait for all archive operations to complete
        await Promise.all(archivePromises);
        
        // Reload agreements from server to reflect changes
        const updatedAgreements = await getAgreements();
        const uniqueAgreements = removeDuplicateAgreements(updatedAgreements);
        setAgreementsUnique(uniqueAgreements);
        
        await window.showAlert(
          'İşlem Tamamlandı',
          `${successCount} anlaşma başarıyla arşivlendi. ${errorCount} anlaşma arşivlenirken hata oluştu.`,
          'info'
        );
      } catch (error) {
        logger.error('Error deleting all agreements:', error);
        await window.showAlert(
          'Hata',
          'Anlaşmalar arşivlenirken bir hata oluştu: ' + error.message,
          'error'
        );
      }
    }
  };

  const handlers = AgreementHandlers({
    agreements, setAgreements: setAgreementsUnique,
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
    archiveAgreement, // Add archiveAgreement function
    getAgreements, // Add getAgreements function to reload agreements after creation
    setShowPaymentModal, // Add setShowPaymentModal function
    setPaymentAgreement // Add setPaymentAgreement function
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
        
        logger.log('Starting to fetch data...');
        const [agreementsData, sitesData, companiesData] = await Promise.all([
          getAgreements(),
          getSites(),
          getCompanies()
        ]);
        
        logger.log('Fetched agreements data:', agreementsData);
        logger.log('Agreements count:', agreementsData?.length || 0);
        logger.log('Agreements data type:', Array.isArray(agreementsData) ? 'array' : typeof agreementsData);
        if (agreementsData && agreementsData.length > 0) {
          logger.log('First agreement sample:', agreementsData[0]);
        }
        
        // Initialize sites with payment properties
        const initializedSites = safeMap(sitesData, site => ({
          ...site,
          pendingPayments: site.pendingPayments || [],
          hasPendingPayment: (site.pendingPayments && site.pendingPayments.length > 0) || false
        }));
        
        // Remove duplicates from agreements data using helper function
        const uniqueAgreements = removeDuplicateAgreements(agreementsData || []);
        logger.log('Unique agreements after filtering:', uniqueAgreements.length);
        
        // Remove duplicates from sites data (by id or _docId)
        const uniqueSites = safeFilter(initializedSites, (site, index, self) => 
          index === self.findIndex(s => 
            (s.id === site.id && s._docId === site._docId) ||
            (s.id && site.id && s.id === site.id) ||
            (s._docId && site._docId && s._docId === site._docId)
          )
        );
        
        // Remove duplicates from companies data (by id or _docId)
        const seenCompanyIds = new Set();
        const seenCompanyDocIds = new Set();
        const uniqueCompanies = safeFilter(companiesData, company => {
          if (!company) return false;
          
          // Check by _docId first (most reliable)
          if (company._docId) {
            const docId = String(company._docId);
            if (seenCompanyDocIds.has(docId)) {
              return false; // Duplicate
            }
            seenCompanyDocIds.add(docId);
            return true;
          }
          
          // Fallback to id
          if (company.id) {
            const id = String(company.id);
            if (seenCompanyIds.has(id)) {
              return false; // Duplicate
            }
            seenCompanyIds.add(id);
            return true;
          }
          
          // If no id or _docId, exclude it
          return false;
        });
        
        logger.log('Setting agreements:', uniqueAgreements.length);
        setAgreementsUnique(uniqueAgreements);
        setSites(uniqueSites);
        setCompanies(uniqueCompanies);
        logger.log('Data fetch completed. Agreements state will be updated.');
      } catch (error) {
        logger.error('Error fetching data:', error);
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

  // Handle payment submit from PaymentModal
  const handlePaymentSubmit = async (paymentData) => {
    if (!paymentAgreement) return;

    try {
      const { paymentMethod, amount, isPartial, checkData } = paymentData;
      const agreement = paymentAgreement;
      const currentPaidAmount = agreement.paidAmount || 0;
      const newPaidAmount = currentPaidAmount + amount;
      const totalAmount = agreement.totalAmount || 0;
      const remainingAmount = totalAmount - newPaidAmount;

      // If check payment, create check record
      let checkId = null;
      if (paymentMethod === 'check' && checkData) {
        const checkRecord = {
          agreementId: agreement.id,
          companyId: agreement.companyId,
          checkNumber: checkData.checkNumber,
          bankName: checkData.bankName,
          dueDate: checkData.dueDate,
          amount: parseFloat(checkData.amount),
          status: 'pending', // 'pending', 'cleared', 'returned', 'protested'
          createdAt: new Date().toISOString()
        };
        
        const createdCheck = await createCheck(checkRecord);
        if (createdCheck) {
          checkId = createdCheck.id || createdCheck._docId;
        }
      }

      // Create transaction
      const transactionData = {
        date: new Date().toISOString().split('T')[0],
        type: 'income',
        source: `Anlaşma Ödemesi - ${helpers.getCompanyName(agreement.companyId)}`,
        description: `${helpers.getCompanyName(agreement.companyId)} anlaşmasından ${helpers.formatCurrency(amount)} tutarında ${paymentMethod === 'check' ? 'çek ile' : 'nakit'} ödeme alındı${isPartial ? ' (Kısmi Ödeme)' : ''}`,
        amount: amount,
        agreementId: agreement.id,
        paymentMethod: paymentMethod, // 'cash' or 'check'
        checkId: checkId
      };

      const newTransaction = await createTransaction(transactionData);

      if (newTransaction) {
        // Update agreement with new paid amount
        const paymentStatus = remainingAmount <= 0.01 ? 'paid' : (newPaidAmount > 0 ? 'partial' : 'unpaid');
        
        const updatedAgreement = {
          ...agreement,
          paidAmount: newPaidAmount,
          remainingAmount: remainingAmount,
          paymentStatus: paymentStatus,
          paymentReceived: remainingAmount <= 0.01, // Full payment received
          // Only set paymentDate if full payment is received, otherwise keep existing or set to null
          ...(remainingAmount <= 0.01 ? { paymentDate: new Date().toISOString().split('T')[0] } : (agreement.paymentDate ? { paymentDate: agreement.paymentDate } : {}))
        };

        const savedAgreement = await updateAgreement(agreement.id, updatedAgreement);
        
        if (savedAgreement) {
          // Update agreement in state
          setAgreementsUnique(agreements.map(a => a.id === agreement.id ? savedAgreement : a));
          
          // Close modal
          setShowPaymentModal(false);
          setPaymentAgreement(null);

          await window.showAlert(
            'Başarılı',
            `${helpers.formatCurrency(amount)} tutarında ${paymentMethod === 'check' ? 'çek ile' : 'nakit'} ödeme başarıyla kaydedildi.${isPartial ? ` Kalan tutar: ${helpers.formatCurrency(remainingAmount)}` : ''}`,
            'success'
          );

          // Log the action
          try {
            await createLog({
              user: 'Admin',
              action: `Anlaşma ödemesi alındı: ${helpers.getCompanyName(agreement.companyId)} (${helpers.formatCurrency(amount)}) - ${paymentMethod === 'check' ? 'Çek' : 'Nakit'}${isPartial ? ' - Kısmi Ödeme' : ''}`
            });
          } catch (error) {
            console.error('Error creating log:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      await window.showAlert(
        'Hata',
        'Ödeme işlemi sırasında bir hata oluştu: ' + (error.message || 'Bilinmeyen hata'),
        'error'
      );
    }
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
        setAgreementsUnique(agreements.map(a => a.id === currentAgreement.id ? savedAgreement : a));
        
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
    currentDate.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
    
    if (activeTab === 'orders') {
      // Orders: agreements with isOrder flag or status 'pending'
      return agreements.filter(agreement => 
        agreement && (agreement.isOrder === true || agreement.status === 'pending')
      ).sort((a, b) => {
        const aId = typeof a.id === 'string' ? a.id : a.id;
        const bId = typeof b.id === 'string' ? b.id : b.id;
        if (typeof aId === 'string' && typeof bId === 'string') {
          return bId.localeCompare(aId);
        }
        return bId - aId;
      });
    }
    
    let filteredAgreements = agreements.filter(agreement => {
      if (!agreement) return false;
      
      const status = agreement.status || 'active';
      
      // Exclude archived
      if (status === 'archived') return false;
      
      // Require valid endDate
      if (!agreement.endDate) return false;
      const endDate = new Date(agreement.endDate);
      endDate.setHours(0, 0, 0, 0);
      if (isNaN(endDate.getTime())) return false;
      
      const isExpired = endDate < currentDate;
      const isActiveLike = !isExpired;
      
      if (activeTab === 'active') {
        // Show all non-archived agreements whose end date is today or future (regardless of status)
        return isActiveLike;
      } else {
        // Expired tab: show past endDate or explicitly expired/terminated/completed
        return isExpired || status === 'expired' || status === 'terminated' || status === 'completed';
      }
    });
    
    // Remove duplicates based on id or _docId
    const uniqueAgreements = filteredAgreements.filter((agreement, index, self) => 
      index === self.findIndex(a => 
        (a.id && agreement.id && String(a.id) === String(agreement.id)) ||
        (a._docId && agreement._docId && String(a._docId) === String(agreement._docId)) ||
        (a.id && agreement.id && a.id === agreement.id) ||
        (a._docId && agreement._docId && a._docId === agreement._docId)
      )
    );
    
    // Sort by creation date (most recent first) - using id as proxy for creation order
    return uniqueAgreements.sort((a, b) => {
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
              onClick={() => setShowCheckManagement(true)}
              className="btn btn-outline-primary btn-icon d-flex align-items-center"
              disabled={isObserver()}
            >
              <i className="bi bi-receipt me-2"></i>
              <span>Çek Yönetimi</span>
            </button>
            <button 
              onClick={uiHandlers.handleAddAgreement}
              className="btn btn-page-primary btn-icon d-flex align-items-center"
              disabled={isObserver()}
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
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
              type="button"
              role="tab"
            >
              <i className="bi bi-cart me-2"></i>
              Siparişler
              <span className="badge bg-info ms-2">{agreements.filter(a => a.isOrder === true || a.status === 'pending').length}</span>
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
                  <h3 className="mb-0 fw-bold">{removeDuplicateAgreements(agreements).length}</h3>
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
            disabled={isObserver()}
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

      {/* Payment Modal */}
      <PaymentModal
        show={showPaymentModal}
        agreement={paymentAgreement}
        onClose={() => {
          setShowPaymentModal(false);
          setPaymentAgreement(null);
        }}
        onPaymentSubmit={handlePaymentSubmit}
        getCompanyName={helpers.getCompanyName}
        formatCurrency={helpers.formatCurrency}
        formatDate={helpers.formatDate}
      />

      {/* Check Management Modal */}
      <CheckManagementModal
        show={showCheckManagement}
        onClose={() => setShowCheckManagement(false)}
        getCompanyName={helpers.getCompanyName}
        formatCurrency={helpers.formatCurrency}
        formatDate={helpers.formatDate}
      />
    </div>
  );
};

export default AgreementsMain;