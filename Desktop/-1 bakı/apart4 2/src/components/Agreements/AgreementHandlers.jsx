import { deleteAgreement } from '../../services/api.js';
import logger from '../../utils/logger';
import { safeFind, safeFilter, safeMap, safeIncludes } from '../../utils/safeAccess';

const AgreementHandlers = ({
  agreements, setAgreements,
  sites, setSites,
  companies, setCompanies,
  formData, setFormData,
  selectedSites, setSelectedSites,
  sitePanelCounts, setSitePanelCounts,
  selectedWeeks, setSelectedWeeks,
  siteBlockSelections, setSiteBlockSelections,
  sitePanelSelections, setSitePanelSelections,
  getCompanyName, getCompany, getCompanyCreditInfo, formatCurrency, dateRangesOverlap, getCurrentDateRange, isPanelAvailable, updateSitePanelCount,
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
}) => {
  // Function to show custom alert modals
  const showAlertModal = (title, message, type = 'info') => {
    // This would typically update state in the parent component
    logger.log('Alert:', title, message, type);
  };

  // Function to close alert modal
  const closeAlertModal = () => {
    // This would typically update state in the parent component
  };

  // Check for expired agreements and mark them as completed
  const checkExpiredAgreements = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
    
    // Create a copy of agreements to avoid modifying the original array during iteration
    const agreementsCopy = [...agreements];
    
    for (const agreement of agreementsCopy) {
      // If agreement is active and end date has passed, mark as completed
      const agreementEndDate = new Date(agreement.endDate);
      agreementEndDate.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
      
      if (agreement.status === 'active' && agreementEndDate < today) {
        try {
          const updatedAgreement = { 
            ...agreement, 
            status: 'completed',
            completionDate: new Date().toISOString().split('T')[0] // Add completion date for naturally expired agreements
          };
          const savedAgreement = await updateAgreement(agreement.id, updatedAgreement);
          
          if (savedAgreement) {
            // Update the agreements state
            setAgreements(safeMap(agreements, a => a.id === agreement.id ? savedAgreement : a));
            
            // Log the action
            logger.log(`Anlaşma tamamlandı: ${getCompanyName(agreement.companyId)} (ID: ${agreement.id})`);
            
            // Check if the company associated with this agreement has any other active agreements
            const companyAgreements = safeFilter(agreements, a => 
              String(a.companyId) === String(agreement.companyId) && 
              a.status === 'active' && 
              a.id !== agreement.id
            );
            
            // If the company has no other active agreements, mark the company as inactive
            if (companyAgreements.length === 0) {
              const company = safeFind(companies, c => String(c.id) === String(agreement.companyId));
              if (company && company.status === 'active') {
                const updatedCompany = { ...company, status: 'inactive' };
                const savedCompany = await updateCompany(company.id, updatedCompany);
                
                if (savedCompany) {
                  // Update the companies state
                  setCompanies(safeMap(companies, c => c.id === company.id ? savedCompany : c));
                  
                  // Log the action
                  logger.log(`Firma otomatik olarak pasif yapıldı: ${company.name} (ID: ${company.id})`);
                }
              }
            }
          }
        } catch (error) {
          logger.error('Error updating agreement status:', error);
        }
      }
    }
  };

  const handleShowAgreement = (agreement) => {
    // Set the current agreement and show the modal
    setCurrentAgreement(agreement);
    setShowModal(true);
  };

  const handleArchiveAgreement = async (agreementId) => {
    // Find the agreement to archive
    const agreement = safeFind(agreements, a => a.id === agreementId);
    if (!agreement) {
      // Check if window.showAlert is available, if not use console.log as fallback
      if (typeof window.showAlert === 'function') {
        await window.showAlert(
          'Hata',
          'Anlaşma bulunamadı.',
          'error'
        );
      } else {
        console.error('Hata: Anlaşma bulunamadı.');
        alert('Hata: Anlaşma bulunamadı.');
      }
      return;
    }

    // Confirm archiving - check if window.showConfirm is available
    let result = true;
    if (typeof window.showConfirm === 'function') {
      result = await window.showConfirm(
        'Anlaşmayı Arşivle',
        `${getCompanyName(agreement.companyId)} firmasına ait ${agreement.id} numaralı anlaşmayı arşivlemek istediğinize emin misiniz?`,
        'warning'
      );
    } else {
      // Fallback to browser confirm if window.showConfirm is not available
      result = window.confirm(`${getCompanyName(agreement.companyId)} firmasına ait ${agreement.id} numaralı anlaşmayı arşivlemek istediğinize emin misiniz?`);
    }
    
    if (result) {
      try {
        // Archive agreement using the proper API function
        const isArchived = await archiveAgreement(agreementId);
        
        if (isArchived) {
          // Remove agreement from state
          setAgreements(safeFilter(agreements, a => a.id !== agreementId));
          
          // Log the action
          try {
            await createLog({
              user: 'Admin',
              action: `Anlaşma arşivlendi: ${getCompanyName(agreement.companyId)} (${agreement.id})`
            });
          } catch (error) {
            logger.error('Error creating log:', error);
          }
          
          // Trigger agreement change event to refresh other pages
          window.dispatchEvent(new CustomEvent('agreementChanged'));
          
          // Show success message - check if window.showAlert is available
          if (typeof window.showAlert === 'function') {
            await window.showAlert(
              'Başarılı',
              'Anlaşma başarıyla arşivlendi.',
              'success'
            );
          } else {
            logger.log('Başarılı: Anlaşma başarıyla arşivlendi.');
            alert('Başarılı: Anlaşma başarıyla arşivlendi.');
          }
        } else {
          throw new Error('Failed to archive agreement');
        }
      } catch (error) {
        logger.error('Error archiving agreement:', error);
        // Show error message - check if window.showAlert is available
        if (typeof window.showAlert === 'function') {
          await window.showAlert(
            'Hata',
            'Anlaşma arşivlenirken bir hata oluştu: ' + (error.message || 'Bilinmeyen hata'),
            'error'
          );
        } else {
          logger.error('Hata: Anlaşma arşivlenirken bir hata oluştu:', error.message || 'Bilinmeyen hata');
          alert('Hata: Anlaşma arşivlenirken bir hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
        }
      }
    }
  };

  const handleDeleteAgreement = async (agreementId) => {
    // Find the agreement to delete
    const agreement = safeFind(agreements, a => a.id === agreementId);
    if (!agreement) {
      if (typeof window.showAlert === 'function') {
        await window.showAlert(
          'Hata',
          'Anlaşma bulunamadı.',
          'error'
        );
      } else {
        console.error('Hata: Anlaşma bulunamadı.');
        alert('Hata: Anlaşma bulunamadı.');
      }
      return;
    }

    // Confirm deletion
    let result = true;
    if (typeof window.showConfirm === 'function') {
      result = await window.showConfirm(
        'Anlaşmayı Sil',
        `${getCompanyName(agreement.companyId)} firmasına ait ${agreement.id} numaralı anlaşmayı silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`,
        'error'
      );
    } else {
      result = window.confirm(`${getCompanyName(agreement.companyId)} firmasına ait ${agreement.id} numaralı anlaşmayı silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`);
    }
    
    if (result) {
      try {
        // Delete agreement using the proper API function
        const isDeleted = await deleteAgreement(agreementId);
        
        if (isDeleted) {
          // Remove agreement from state
          setAgreements(safeFilter(agreements, a => a.id !== agreementId));
          
          // Log the action
          try {
            await createLog({
              user: 'Admin',
              action: `Anlaşma silindi: ${getCompanyName(agreement.companyId)} (${agreement.id})`
            });
          } catch (error) {
            logger.error('Error creating log:', error);
          }
          
          // Trigger agreement change event to refresh other pages
          window.dispatchEvent(new CustomEvent('agreementChanged'));
          
          // Show success message
          if (typeof window.showAlert === 'function') {
            await window.showAlert(
              'Başarılı',
              'Anlaşma başarıyla silindi.',
              'success'
            );
          } else {
            logger.log('Başarılı: Anlaşma başarıyla silindi.');
            alert('Başarılı: Anlaşma başarıyla silindi.');
          }
        } else {
          throw new Error('Failed to delete agreement');
        }
      } catch (error) {
        logger.error('Error deleting agreement:', error);
        if (typeof window.showAlert === 'function') {
          await window.showAlert(
            'Hata',
            'Anlaşma silinirken bir hata oluştu.',
            'error'
          );
        } else {
          logger.error('Hata: Anlaşma silinirken bir hata oluştu.');
          alert('Hata: Anlaşma silinirken bir hata oluştu.');
        }
      }
    }
  };

  const handleRenewAgreement = async (agreement) => {
    // In a real implementation, you would show a confirmation dialog and call the API
    logger.log('Renew agreement:', agreement);
  };

  const handlePaymentAgreement = async (agreement) => {
    // Allow payment for all agreements except terminated and archived
    // This allows payment for expired agreements that still have outstanding debt
    if (agreement.status === 'terminated' || agreement.status === 'archived') {
      await window.showAlert(
        'Hata',
        'Sonlandırılmış veya arşivlenmiş anlaşmalardan ödeme alınamaz.',
        'error'
      );
      return;
    }

    // Check if credit payment has already been received
    if (agreement.creditPaymentReceived) {
      await window.showAlert(
        'Hata',
        'Bu anlaşma için zaten kredi ile ödeme alınmıştır. Nakit ödeme alınamaz.',
        'error'
      );
      return;
    }

    // Open payment modal
    if (setShowPaymentModal && setPaymentAgreement) {
      setPaymentAgreement(agreement);
      setShowPaymentModal(true);
      return;
    }

    // Fallback to old behavior if modal functions not available
    // Confirm payment
    const result = await window.showConfirm(
      'Ödeme Al',
      `${getCompanyName(agreement.companyId)} firmasından ${formatCurrency(agreement.totalAmount)} tutarında ödeme almak istediğinize emin misiniz?`,
      'warning'
    );
    
    if (result) {
      try {
        // Process payment - add income to cashier
        const incomeData = {
          date: new Date().toISOString().split('T')[0],
          type: 'income',
          source: `Anlaşma Ödemesi - ${getCompanyName(agreement.companyId)}`,
          description: `${getCompanyName(agreement.companyId)} anlaşmasından ${formatCurrency(agreement.totalAmount)} tutarında ödeme alındı`,
          amount: agreement.totalAmount
        };
        
        // Create income transaction
        // Ensure createTransaction is properly defined before calling it
        if (typeof createTransaction !== 'function') {
          throw new Error('createTransaction is not defined or is not a function');
        }
        
        const newTransaction = await createTransaction(incomeData);
        
        if (newTransaction) {
          // Calculate and distribute payments to sites
          const sitePayments = [];
          
          // For each site in the agreement
          const siteIdsArray = Array.isArray(agreement.siteIds) ? agreement.siteIds : [];
          for (const siteId of siteIdsArray) {
            const site = safeFind(sites, s => s.id === siteId);
            if (site) {
              // Get panel count for this site in the agreement
              const panelCount = agreement.sitePanelCounts?.[siteId] || 0;
              
              // Calculate payment amount for this site
              // Formula: panelCount * weeklyRatePerPanel * totalWeeks * (agreementPercentage / 100)
              const sitePaymentAmount = panelCount * agreement.weeklyRatePerPanel * agreement.totalWeeks * (parseFloat(site.agreementPercentage) / 100);
              
              if (sitePaymentAmount > 0) {
                sitePayments.push({
                  siteId: site.id,
                  siteName: site.name,
                  amount: sitePaymentAmount,
                  companyName: getCompanyName(agreement.companyId),
                  agreementId: agreement.id
                });
              }
            }
          }
          
          // Update sites with pending payments
          const updatedSites = [...sites];
          for (const payment of sitePayments) {
            const siteIndex = updatedSites.findIndex(s => s.id === payment.siteId);
            if (siteIndex !== -1) {
              const site = updatedSites[siteIndex];
              const newPendingPayment = {
                agreementId: payment.agreementId,
                companyName: payment.companyName,
                amount: payment.amount
              };
              
              // Add pending payment to site
              const updatedPendingPayments = [...(site.pendingPayments || []), newPendingPayment];
              
              updatedSites[siteIndex] = {
                ...site,
                pendingPayments: updatedPendingPayments,
                hasPendingPayment: true
              };
              
              // Update site in backend
              try {
                await updateSite(site.id, updatedSites[siteIndex]);
              } catch (error) {
                logger.error('Error updating site with pending payment:', error);
              }
            }
          }
          
          // Update sites state
          setSites(updatedSites);
          
          // Update agreement status to indicate payment received
          const updatedAgreement = {
            ...agreement,
            paymentReceived: true,
            paymentDate: new Date().toISOString().split('T')[0]
          };
          
          // Update agreement in backend
          try {
            await updateAgreement(agreement.id, updatedAgreement);
            setAgreements(safeMap(agreements, a => a.id === agreement.id ? updatedAgreement : a));
          } catch (error) {
            logger.error('Error updating agreement payment status:', error);
          }
          
          // Log the action
          try {
            await createLog({
              user: 'Admin',
              action: `Anlaşma ödemesi alındı: ${getCompanyName(agreement.companyId)} (${formatCurrency(agreement.totalAmount)})`
            });
          } catch (error) {
            logger.error('Error creating log:', error);
          }
          
          // Show success message
          await window.showAlert(
            'Başarılı',
            `${getCompanyName(agreement.companyId)} firmasından ${formatCurrency(agreement.totalAmount)} tutarında ödeme alındı. Sitelere alacaklar dağıtıldı.`,
            'success'
          );
        } else {
          // Transaction creation failed
          await window.showAlert(
            'Hata',
            'Ödeme işlemi sırasında bir hata oluştu. Lütfen tekrar deneyin.',
            'error'
          );
        }
      } catch (error) {
        console.error('Error processing agreement payment:', error);
        await window.showAlert(
          'Hata',
          'Ödeme işlemi sırasında bir hata oluştu: ' + (error.message || 'Bilinmeyen hata'),
          'error'
        );
      }
    }
  };

  // Handle credit payment for agreement
  const handleCreditPayment = async (agreement) => {
    // Allow payment for all agreements except terminated and archived
    // This allows payment for expired agreements that still have outstanding debt
    if (agreement.status === 'terminated' || agreement.status === 'archived') {
      await window.showAlert(
        'Hata',
        'Sonlandırılmış veya arşivlenmiş anlaşmalardan ödeme alınamaz.',
        'error'
      );
      return;
    }

    // Check if this is already a credit-based agreement (created with credit payment)
    const isAlreadyCreditBased = agreement.creditPaymentReceived;
    
    // Find the company for this agreement
    const company = safeFind(companies, c => c.id === agreement.companyId);
    if (!company) {
      await window.showAlert(
        'Hata',
        'Firma bilgisi bulunamadı.',
        'error'
      );
      return;
    }

    // For already credit-based agreements, we don't deduct credit again
    if (!isAlreadyCreditBased) {
      // Check if company has enough credit
      const totalPanels = Object.values(agreement.sitePanelCounts || {}).reduce((sum, count) => sum + count, 0);
      if (company.credit < totalPanels) {
        await window.showAlert(
          'Hata',
          'Firmanın yeterli kredisi bulunmamaktadır.',
          'error'
        );
        return;
      }
    }

    // Get the latest credit history entry to determine panel price
    const latestCredit = company.creditHistory && company.creditHistory.length > 0 
      ? company.creditHistory[company.creditHistory.length - 1] 
      : null;
    
    if (!latestCredit) {
      await window.showAlert(
        'Hata',
        'Firmanın kredi geçmişi bulunamadı.',
        'error'
      );
      return;
    }

    // Calculate expected amount based on panel count and credit panel price
    const totalPanels = Object.values(agreement.sitePanelCounts || {}).reduce((sum, count) => sum + count, 0);
    const expectedAmount = totalPanels * latestCredit.panelPrice * agreement.totalWeeks;
    
    // Confirm credit payment
    const result = await window.showConfirm(
      'Kredi ile Ödeme',
      `${getCompanyName(agreement.companyId)} firmasından ${formatCurrency(expectedAmount)} tutarında kredi ile ödeme almak istediğinize emin misiniz? ${isAlreadyCreditBased ? 'Bu anlaşma zaten kredi ile oluşturuldu.' : `Firmanın mevcut kredisi: ${company.credit} panel`}`,
      'warning'
    );
    
    if (result) {
      try {
        // For agreements that were NOT created with credit, we need to deduct credit
        if (!isAlreadyCreditBased) {
          // Process credit payment
          // 1. Deduct credit from company
          const updatedCompany = {
            ...company,
            credit: company.credit - totalPanels
          };
          
          // Update company in backend
          try {
            await updateCompany(company.id, updatedCompany);
            setCompanies(safeMap(companies, c => c.id === company.id ? updatedCompany : c));
          } catch (error) {
            logger.error('Error updating company credit:', error);
            throw new Error('Firma kredisi güncellenirken hata oluştu');
          }
        }
        
        // 2. For credit payments, we don't create a transaction that adds to the cashier
        // Instead, we only log the credit payment for record keeping
        logger.log(`Kredi ile ödeme alındı: ${getCompanyName(agreement.companyId)} (${formatCurrency(expectedAmount)})${isAlreadyCreditBased ? ' (önceden ödenmiş)' : ''}`);
        
        // 3. Calculate and distribute payments to sites
        const sitePayments = [];
        
        // For each site in the agreement
        for (const siteId of agreement.siteIds) {
          const site = sites.find(s => s.id === siteId);
          if (site) {
            // Get panel count for this site in the agreement
            const panelCount = agreement.sitePanelCounts?.[siteId] || 0;
            
            // Calculate payment amount for this site
            const sitePaymentAmount = panelCount * latestCredit.panelPrice * agreement.totalWeeks * (parseFloat(site.agreementPercentage) / 100);
            
            if (sitePaymentAmount > 0) {
              sitePayments.push({
                siteId: site.id,
                siteName: site.name,
                amount: sitePaymentAmount,
                companyName: getCompanyName(agreement.companyId),
                agreementId: agreement.id
              });
            }
          }
        }
        
        // Update sites with pending payments
        const updatedSites = [...sites];
        for (const payment of sitePayments) {
          const siteIndex = updatedSites.findIndex(s => s.id === payment.siteId);
          if (siteIndex !== -1) {
            const site = updatedSites[siteIndex];
            const newPendingPayment = {
              agreementId: payment.agreementId,
              companyName: payment.companyName,
              amount: payment.amount
            };
            
            // Add pending payment to site
            const updatedPendingPayments = [...(site.pendingPayments || []), newPendingPayment];
            
            updatedSites[siteIndex] = {
              ...site,
              pendingPayments: updatedPendingPayments,
              hasPendingPayment: true
            };
            
            // Update site in backend
            try {
              await updateSite(site.id, updatedSites[siteIndex]);
            } catch (error) {
              console.error('Error updating site with pending payment:', error);
            }
          }
        }
        
        // Update sites state
        setSites(updatedSites);
        
        // 4. Update agreement status to indicate credit payment received
        const updatedAgreement = {
          ...agreement,
          creditPaymentReceived: true,
          creditPaymentDate: new Date().toISOString().split('T')[0]
        };
        
        // Update agreement in backend
        try {
          await updateAgreement(agreement.id, updatedAgreement);
          setAgreements(safeMap(agreements, a => a.id === agreement.id ? updatedAgreement : a));
        } catch (error) {
          logger.error('Error updating agreement credit payment status:', error);
        }
        
        // 5. Log the action
        try {
          await createLog({
            user: 'Admin',
            action: `Kredi ile anlaşma ödemesi alındı: ${getCompanyName(agreement.companyId)} (${formatCurrency(expectedAmount)})${isAlreadyCreditBased ? ' (önceden ödenmiş)' : ''}`
          });
        } catch (error) {
          console.error('Error creating log:', error);
        }
        
        // Show success message
        await window.showAlert(
          'Başarılı',
          `${getCompanyName(agreement.companyId)} firmasından ${formatCurrency(expectedAmount)} tutarında kredi ile ödeme alındı. Sitelere alacaklar dağıtıldı.${isAlreadyCreditBased ? ' Kredi zaten önceden kullanılmıştı.' : ` Firmanın kalan kredisi: ${company.credit - totalPanels} panel`}`,
          'success'
        );
      } catch (error) {
        console.error('Error processing credit payment:', error);
        await window.showAlert(
          'Hata',
          'Kredi ödeme işlemi sırasında bir hata oluştu: ' + (error.message || 'Bilinmeyen hata'),
          'error'
        );
      }
    }
  };

  // Add the terminate agreement early function
  const handleTerminateAgreement = async (agreement) => {
    // Check if agreement is already terminated
    if (agreement.status === 'terminated') {
      await window.showAlert(
        'Hata',
        'Bu anlaşma zaten erken sonlandırılmış.',
        'error'
      );
      return;
    }

    // Confirm termination
    const result = await window.showConfirm(
      'Anlaşmayı Erken Sonlandır',
      `${getCompanyName(agreement.companyId)} firmasına ait ${agreement.id} numaralı anlaşmayı erken sonlandırmak istediğinize emin misiniz? Anlaşma iptal edildiği için ödeme alınmayacaktır.`,
      'warning'
    );
    
    if (result) {
      try {
        // Update agreement status to terminated
        const updatedAgreement = {
          ...agreement,
          status: 'terminated',
          terminationDate: new Date().toISOString().split('T')[0]
        };
        
        // Update agreement in backend
        const savedAgreement = await updateAgreement(agreement.id, updatedAgreement);
        
        if (savedAgreement) {
          // Update agreement in state
          setAgreements(safeMap(agreements, a => a.id === agreement.id ? savedAgreement : a));
          
          // Log the action
          try {
            await createLog({
              user: 'Admin',
              action: `Anlaşma erken sonlandırıldı: ${getCompanyName(agreement.companyId)} (${agreement.id})`
            });
          } catch (error) {
            logger.error('Error creating log:', error);
          }
          
          // Show success message
          await window.showAlert(
            'Başarılı',
            'Anlaşma başarıyla erken sonlandırıldı. Ödeme alınmayacaktır.',
            'success'
          );
        } else {
          throw new Error('Failed to terminate agreement');
        }
      } catch (error) {
        console.error('Error terminating agreement:', error);
        await window.showAlert(
          'Hata',
          'Anlaşma sonlandırılırken bir hata oluştu: ' + (error.message || 'Bilinmeyen hata'),
          'error'
        );
      }
    }
  };

  // Handle form submission for creating/updating agreement - Updated for new block selection system
  const handleFormSubmit = async (e, currentAgreement, agreements, setAgreements, setShowAddForm, setFormData, setSelectedSites, setSitePanelCounts, setSelectedWeeks, setSiteBlockSelections, setSitePanelSelections, formData, selectedSites, sitePanelSelections, sitePanelCounts, helpers) => {
    console.log('Form submission started');
    e.preventDefault();
    
    // Validation
    console.log('Form data:', formData);
    console.log('Selected sites:', selectedSites);
    console.log('Site panel selections:', sitePanelSelections);
    console.log('Site panel counts:', sitePanelCounts);
    
    // Validate date ranges
    const dateRanges = formData.dateRanges || [];
    if (dateRanges.length === 0 || dateRanges.some(range => !range.startDate || !range.endDate)) {
      console.log('Please fill in at least one valid date range');
      return;
    }
    
    if (!formData.companyId) {
      console.log('Please select a company');
      return;
    }
    
    // Check if any site has panel selections - Updated for new system
    // Supports both old format (array) and new format (object with date ranges)
    let hasPanelSelections = false;
    console.log('Checking panel selections for sites');
    
    // Check if we have selections for any date range
    for (let rangeIndex = 0; rangeIndex < dateRanges.length; rangeIndex++) {
      const rangeKey = `range-${rangeIndex}`;
      const selectedSitesInRange = (sitePanelSelections[rangeKey] && sitePanelSelections[rangeKey].sites) || [];
      
      for (const siteId of selectedSitesInRange) {
      const siteSelections = sitePanelSelections[siteId];
      console.log('Site selections for site', siteId, ':', siteSelections);
      if (siteSelections) {
        for (const blockKey in siteSelections) {
          console.log('Block', blockKey, 'has panels:', siteSelections[blockKey]);
            const blockSelections = siteSelections[blockKey];
            if (Array.isArray(blockSelections)) {
              // Old format: array of panel keys
              if (blockSelections.length > 0) {
            hasPanelSelections = true;
            break;
          }
            } else if (typeof blockSelections === 'object') {
              // New format: object with date range keys
              if (blockSelections[rangeKey] && Array.isArray(blockSelections[rangeKey]) && blockSelections[rangeKey].length > 0) {
                hasPanelSelections = true;
                break;
        }
            }
            if (hasPanelSelections) break;
          }
        }
        if (hasPanelSelections) break;
      }
      if (hasPanelSelections) break;
    }
    
    if (!hasPanelSelections) {
      console.log('Please select at least one panel');
      return;
    } else {
      console.log('Panel selections found, proceeding with form submission');
    }
    
    try {
      // Calculate agreement details
      logger.log('Calculating agreement details');
      // Birden fazla tarih aralığı için toplam hafta hesapla
      const totalWeeks = helpers.calculateTotalWeeksFromRanges(dateRanges);
      const totalPanels = Object.values(sitePanelCounts || {}).reduce(
        (sum, count) => sum + (parseInt(count) || 0),
        0
      );
      
      // Geriye uyumluluk için ilk tarih aralığını startDate/endDate olarak da kaydet
      const firstRange = dateRanges[0];
      const startDate = firstRange.startDate;
      const endDate = dateRanges[dateRanges.length - 1].endDate; // Son aralığın bitiş tarihi

      let weeklyRate = parseFloat(formData.weeklyRatePerPanel) || 0;
      let totalAmount = 0;

      if (weeklyRate > 0 && totalPanels > 0 && totalWeeks > 0) {
        // Klasik yol: haftalık panel ücretinden toplam tutarı hesapla
        totalAmount = totalWeeks * totalPanels * weeklyRate;
      } else if (formData.totalAmount) {
        // Alternatif yol: toplam tutardan haftalık panel ücretini hesapla
        const manualTotal = parseFloat(formData.totalAmount) || 0;
        if (manualTotal > 0 && totalPanels > 0 && totalWeeks > 0) {
          weeklyRate = manualTotal / (totalPanels * totalWeeks);
          totalAmount = manualTotal;
        }
      }

      if (!weeklyRate || !totalAmount) {
        logger.log('Weekly rate or total amount is invalid');
        return;
      }
      
      // Collect all selected sites from all date ranges
      const allSelectedSites = new Set();
      dateRanges.forEach((range, rangeIndex) => {
        const rangeKey = `range-${rangeIndex}`;
        const sitesInRange = (sitePanelSelections[rangeKey] && sitePanelSelections[rangeKey].sites) || [];
        sitesInRange.forEach(siteId => allSelectedSites.add(siteId));
      });
      
      const agreementData = {
        ...formData,
        startDate: startDate, // Geriye uyumluluk için
        endDate: endDate, // Geriye uyumluluk için
        dateRanges: dateRanges, // Birden fazla tarih aralığı
        siteIds: Array.from(allSelectedSites), // All sites from all ranges
        sitePanelCounts: sitePanelCounts,
        siteBlockSelections: siteBlockSelections,
        sitePanelSelections: sitePanelSelections,
        totalWeeks: totalWeeks,
        totalAmount: totalAmount,
        weeklyRatePerPanel: weeklyRate,
        status: 'active'
      };
      
      // If editing an order, remove isOrder flag
      if (currentAgreement?.isOrder) {
        agreementData.isOrder = false;
      }
      // Don't add isOrder field if it's undefined (new agreement, not an order)
      
      logger.log('Agreement data to be sent:', agreementData);
      
      let newAgreement = null;
      
      if (currentAgreement) {
        // Update existing agreement
        const updatedAgreement = await updateAgreement(currentAgreement.id, agreementData);
        if (updatedAgreement) {
          setAgreements(safeMap(agreements, a => a.id === currentAgreement.id ? updatedAgreement : a));
          setShowAddForm(false);
          newAgreement = updatedAgreement;
          
          // Log the action
          await createLog({
            user: 'Admin',
            action: `Anlaşma güncellendi: ${helpers.getCompanyName(formData.companyId)}`
          });
          
          console.log('Agreement updated successfully');
        }
      } else {
        // Create new agreement
        console.log('Creating new agreement with data:', agreementData);
        const createdAgreement = await createAgreement(agreementData);
        console.log('Created agreement response:', createdAgreement);
        if (createdAgreement) {
          // Use functional update to prevent duplicate additions
          setAgreements(prevAgreements => {
            // Check if agreement already exists (prevent duplicates)
            const exists = prevAgreements.some(a => 
              a.id === createdAgreement.id || 
              a._docId === createdAgreement.id || 
              a.id === createdAgreement._docId ||
              (a.id === createdAgreement.id && a._docId === createdAgreement._docId)
            );
            if (exists) {
              console.warn('Agreement already exists in state, skipping duplicate:', createdAgreement.id);
              return prevAgreements;
            }
            return [...prevAgreements, createdAgreement];
          });
          setShowAddForm(false);
          newAgreement = createdAgreement;
          
          // Reset form
          setFormData({
            companyId: '',
            startDate: '',
            endDate: '',
            dateRanges: [{ startDate: '', endDate: '' }],
            weeklyRatePerPanel: '',
            totalAmount: '',
            notes: ''
          });
          setSelectedSites([]);
          setSitePanelCounts({});
          setSelectedWeeks([]);
          setSiteBlockSelections({});
          setSitePanelSelections({});
          
          // Log the action
          await createLog({
            user: 'Admin',
            action: `Yeni anlaşma eklendi: ${helpers.getCompanyName(formData.companyId)}`
          });
          
          console.log('Agreement created successfully');
          
          // Reload agreements from server to ensure we have the latest data
          // Note: setAgreements is actually setAgreementsUnique from AgreementsMain
          if (getAgreements) {
            try {
              const reloadedAgreements = await getAgreements();
              // setAgreementsUnique will handle duplicate removal automatically
              setAgreements(reloadedAgreements);
              console.log('Agreements reloaded from server:', reloadedAgreements.length);
            } catch (reloadError) {
              console.error('Error reloading agreements:', reloadError);
            }
          }
          
          // Show success message
          if (typeof window.showAlert === 'function') {
            await window.showAlert('Başarılı', 'Anlaşma başarıyla oluşturuldu!', 'success');
          }
        } else {
          // Show error message if creation failed
          console.error('Failed to create agreement - createAgreement returned null or undefined');
          if (typeof window.showAlert === 'function') {
            await window.showAlert('Hata', 'Anlaşma oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.', 'error');
          }
        }
      }
      
      // Note: Company user is automatically created by Cloud Function when company is created
      // No need to create manually here to avoid duplicates
      if (newAgreement) {
        try {
          // Find the company
          const company = helpers.getCompany(newAgreement.companyId);
          if (company) {
            // Check if a user already exists for this company
            const existingUsers = await getUsers();
            const existingCompanyUser = safeFind(existingUsers, user => 
              (user.role === 'company' || user.role === 'company_user') && String(user.companyId) === String(company.id)
            );
            
            // Only update status if user exists but is inactive
            if (existingCompanyUser && existingCompanyUser.status !== 'active') {
              // If user exists but is inactive, activate them
              const updatedUser = {
                ...existingCompanyUser,
                status: 'active'
              };
              
              const savedUser = await updateUser(existingCompanyUser.id, updatedUser);
              if (savedUser) {
                logger.log(`Firma kullanıcısı otomatik olarak aktif yapıldı: ${company.name}`);
                
                // Log the action
                await createLog({
                  user: 'System',
                  action: `Firma kullanıcısı otomatik olarak aktif yapıldı: ${company.name}`
                });
              }
            }
            
            // If the company was previously inactive but now has an active agreement, activate the company
            if (company.status !== 'active') {
              const updatedCompany = {
                ...company,
                status: 'active'
              };
              
              const savedCompany = await updateCompany(company.id, updatedCompany);
              if (savedCompany && savedCompany.success !== false) {
                // Update companies state with duplicate prevention
                setCompanies(prevCompanies => {
                  // Remove old company entry
                  const filtered = safeFilter(prevCompanies, c => 
                    String(c.id) !== String(company.id) && 
                    String(c._docId) !== String(company.id) &&
                    (c._docId ? String(c._docId) !== String(company._docId) : true)
                  );
                  
                  // Check if savedCompany already exists
                  const companyData = savedCompany.data || savedCompany;
                  const exists = filtered.some(c => 
                    String(c.id) === String(companyData.id) || 
                    (c._docId && companyData._docId && String(c._docId) === String(companyData._docId))
                  );
                  
                  if (!exists) {
                    return [...filtered, companyData];
                  }
                  
                  return filtered;
                });
                
                console.log(`Firma otomatik olarak aktif yapıldı: ${company.name}`);
                
                // Log the action
                await createLog({
                  user: 'System',
                  action: `Firma otomatik olarak aktif yapıldı: ${company.name}`
                });
              }
            }
          }
        } catch (error) {
          console.error('Error creating/updating company user:', error);
        }
      }
    } catch (error) {
      console.error('Error saving agreement:', error);
      // Show error message to user
      if (typeof window.showAlert === 'function') {
        window.showAlert('Hata', 'Anlaşma kaydedilirken bir hata oluştu: ' + (error.message || 'Bilinmeyen hata'), 'error');
      } else {
        alert('Anlaşma kaydedilirken bir hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
      }
    }
  };

  return {
    showAlertModal,
    closeAlertModal,
    checkExpiredAgreements,
    handleShowAgreement,
    handleArchiveAgreement,
    handleDeleteAgreement,
    handleRenewAgreement,
    handlePaymentAgreement,
    handleCreditPayment,
    handleTerminateAgreement,
    handleFormSubmit
  };
};

export default AgreementHandlers;