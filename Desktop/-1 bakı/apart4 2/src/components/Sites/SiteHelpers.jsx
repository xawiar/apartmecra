import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const SiteHelpers = ({
  companies, sites, agreements,
  transactions
}) => {
  // Get company name by ID
  const getCompanyName = (companyId) => {
    const company = companies.find(c => String(c.id) === String(companyId));
    return company ? company.name : 'Bilinmeyen Firma';
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  // Calculate total elevators based on blocks * elevatorsPerBlock
  const calculateTotalElevators = (blocks, elevatorsPerBlock) => {
    const blockCount = parseInt(blocks) || 0;
    const elevatorsCount = parseInt(elevatorsPerBlock) || 0;
    return blockCount * elevatorsCount;
  };

  // Calculate panels based on total elevators * 2
  const calculatePanels = (blocks, elevatorsPerBlock) => {
    const totalElevators = calculateTotalElevators(blocks, elevatorsPerBlock);
    return totalElevators * 2;
  };

  // Calculate panels for business center (manual input) or site (automatic)
  const calculatePanelsForType = (siteType, blocks, elevatorsPerBlock, manualPanels) => {
    if (siteType === 'business_center') {
      return parseInt(manualPanels) || 0;
    } else {
      return calculatePanels(blocks, elevatorsPerBlock);
    }
  };

  // Calculate average people for site (apartment count * 3)
  const calculateAveragePeople = (apartmentCount) => {
    const apartments = parseInt(apartmentCount) || 0;
    return apartments * 3;
  };

  // Calculate summary statistics
  const calculateSummaryStats = (sites, transactions) => {
    const totalSites = sites.length;
    const regularSites = sites.filter(site => site.siteType !== 'business_center').length;
    const businessCenters = sites.filter(site => site.siteType === 'business_center').length;
    const totalElevators = sites.reduce((sum, site) => sum + (parseInt(site.elevators) || 0), 0);
    const totalPanels = sites.reduce((sum, site) => sum + (parseInt(site.panels) || 0), 0);
    const totalPendingPayments = sites.reduce((sum, site) => {
      if (site.hasPendingPayment && site.pendingPayments) {
        return sum + site.pendingPayments.reduce((paymentSum, payment) => paymentSum + (parseFloat(payment.amount) || 0), 0);
      }
      return sum;
    }, 0);

    // Calculate total apartment count and total people count
    const totalApartments = sites.reduce((sum, site) => {
      if (site.siteType === 'site') {
        return sum + (parseInt(site.apartmentCount) || 0);
      }
      return sum;
    }, 0);

    // Calculate people count separately for sites and business centers
    const totalSitePeople = sites.reduce((sum, site) => {
      if (site.siteType === 'site') {
        return sum + (parseInt(site.averagePeople) || 0);
      }
      return sum;
    }, 0);

    const totalBusinessCenterPeople = sites.reduce((sum, site) => {
      if (site.siteType === 'business_center') {
        return sum + (parseInt(site.peopleCount) || 0);
      }
      return sum;
    }, 0);

    const totalPeople = totalSitePeople + totalBusinessCenterPeople;

    return {
      totalSites,
      regularSites,
      businessCenters,
      totalElevators,
      totalPanels,
      totalPendingPayments,
      totalApartments,
      totalPeople,
      totalSitePeople,
      totalBusinessCenterPeople
    };
  };

  // Generate block labels (A, B, C, etc.)
  const generateBlockLabels = (blockCount) => {
    const labels = [];
    for (let i = 0; i < blockCount; i++) {
      labels.push(String.fromCharCode(65 + i)); // A, B, C, etc.
    }
    return labels;
  };

  // Handle showing active agreements for a site
  const getActiveAgreementsForSite = (siteId) => {
    return agreements.filter(agreement => 
      agreement.siteIds && 
      agreement.siteIds.includes(siteId) && 
      agreement.status === 'active'
    );
  };

  // Get payment history for a specific site with detailed agreement information
  const getSitePaymentHistoryDetailed = (siteId, transactions, agreements, companies) => {
    // Filter transactions to only include payments made to this site
    return transactions.filter(transaction => 
      transaction.type === 'expense' && 
      transaction.source.includes('Site Ödemesi') &&
      transaction.source.includes(sites.find(s => s.id === siteId)?.name || '')
    ).map(transaction => {
      // Extract agreement ID from transaction description
      const agreementIdMatch = transaction.description.match(/anlaşması.*?(\d+)/i);
      let agreementId = 'Unknown';
      let agreement = null;
      let panelCount = 0;
      let weeklyRatePerPanel = 0;
      let weeklyTotalAmount = 0;
      
      if (agreementIdMatch) {
        // Try to find the agreement by matching with existing agreements
        const potentialAgreements = agreements.filter(a => 
          a.siteIds && a.siteIds.includes(siteId) &&
          transaction.description.includes(getCompanyName(a.companyId, companies))
        );
        
        if (potentialAgreements.length > 0) {
          // Sort by date proximity to transaction date
          agreement = potentialAgreements.sort((a, b) => {
            const aDiff = Math.abs(new Date(a.startDate) - new Date(transaction.date));
            const bDiff = Math.abs(new Date(b.startDate) - new Date(transaction.date));
            return aDiff - bDiff;
          })[0];
          
          agreementId = agreement.id;
          panelCount = parseInt(agreement.sitePanelCounts?.[siteId]) || 0;
          weeklyRatePerPanel = parseFloat(agreement.weeklyRatePerPanel) || 0;
          // Use the weekly rate per panel (haftalık tutar - 1 haftalık 1 panel için anlaşma rakamı)
          weeklyTotalAmount = weeklyRatePerPanel;
        }
      }
      
      return {
        ...transaction,
        agreementId,
        agreement,
        panelCount,
        weeklyRatePerPanel,
        weeklyTotalAmount,
        totalPaid: Math.abs(transaction.amount)
      };
    }).sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date, newest first
  };

  // Calculate pending payments for a site based on active agreements
  const calculatePendingPayments = (site, agreements, companies, transactions) => {
    if (!site || !agreements || !companies || !transactions) return [];
    
    const pendingPayments = [];
    
    // Find all active agreements that include this site
    const siteAgreements = agreements.filter(agreement => 
      agreement.siteIds && 
      Array.isArray(agreement.siteIds) &&
      agreement.siteIds.includes(site.id) && 
      agreement.status === 'active' &&
      !agreement.isDeleted &&
      !agreement.isArchived
    );
    
    console.log(`Calculating pending payments for site ${site.id}:`, {
      siteAgreements: siteAgreements.length,
      transactions: transactions.length
    });
    
    siteAgreements.forEach(agreement => {
      const company = companies.find(c => c.id === agreement.companyId);
      const companyName = company ? company.name : 'Bilinmeyen Firma';
      
      // Get panel count for this site in this agreement
      const panelCount = agreement.sitePanelCounts && agreement.sitePanelCounts[site.id] 
        ? parseInt(agreement.sitePanelCounts[site.id]) 
        : 0;
      
      if (panelCount > 0) {
        // Calculate weekly rate per panel
        const weeklyRatePerPanel = parseFloat(agreement.weeklyRatePerPanel) || 0;
        
        // Calculate total weekly amount for this site
        const weeklyTotalAmount = weeklyRatePerPanel * panelCount;
        
        // Calculate site's share percentage (default 25% if not specified)
        const sitePercentage = parseFloat(site.agreementPercentage) || 25;
        
        // Calculate total payment amount for the entire agreement period
        const startDate = new Date(agreement.startDate);
        const endDate = new Date(agreement.endDate);
        const totalWeeks = Math.ceil((endDate - startDate) / (7 * 24 * 60 * 60 * 1000));
        
        // Calculate site's total payment amount for the entire agreement
        const siteTotalAmount = (weeklyTotalAmount * sitePercentage * totalWeeks) / 100;
        
        // Check if there are any transactions for this agreement and site
        const existingTransactions = transactions.filter(transaction => 
          transaction.agreementId === agreement.id && 
          transaction.siteId === site.id &&
          transaction.type === 'expense'
        );
        
        console.log(`Site ${site.id}, Agreement ${agreement.id}:`, {
          existingTransactions: existingTransactions.length,
          transactions: existingTransactions.map(t => ({ id: t.id, amount: t.amount, siteId: t.siteId, agreementId: t.agreementId }))
        });
        
        // Calculate total paid amount for this agreement and site
        const totalPaid = existingTransactions.reduce((sum, transaction) => 
          sum + Math.abs(transaction.amount), 0
        );
        
        // Calculate pending amount (if any)
        const pendingAmount = Math.max(0, siteTotalAmount - totalPaid);
        
        console.log(`Site ${site.id}, Agreement ${agreement.id}:`, {
          siteTotalAmount,
          totalPaid,
          pendingAmount
        });
        
        if (pendingAmount > 0) {
          pendingPayments.push({
            agreementId: agreement.id,
            companyName: companyName,
            panelCount: panelCount,
            weeklyRatePerPanel: weeklyRatePerPanel,
            weeklyTotalAmount: weeklyTotalAmount,
            sitePercentage: sitePercentage,
            siteTotalAmount: siteTotalAmount,
            totalPaid: totalPaid,
            amount: pendingAmount,
            startDate: agreement.startDate,
            endDate: agreement.endDate
          });
        }
      }
    });
    
    return pendingPayments;
  };

  // Get pending payments with detailed agreement information
  const getPendingPaymentsDetailed = (site, agreements, companies) => {
    if (!site.pendingPayments) return [];
    
    return site.pendingPayments.map(payment => {
      const agreement = agreements.find(a => String(a.id) === String(payment.agreementId));
      let panelCount = 0;
      let weeklyRatePerPanel = 0;
      let weeklyTotalAmount = 0;
      
      if (agreement && agreement.sitePanelCounts) {
        panelCount = parseInt(agreement.sitePanelCounts[site.id]) || 0;
        weeklyRatePerPanel = parseFloat(agreement.weeklyRatePerPanel) || 0;
        // Use the weekly rate per panel (haftalık tutar - 1 haftalık 1 panel için anlaşma rakamı)
        weeklyTotalAmount = weeklyRatePerPanel;
      }
      
      return {
        ...payment,
        agreement,
        panelCount,
        weeklyRatePerPanel,
        weeklyTotalAmount
      };
    });
  };

  // Calculate panels sold for a specific site
  const calculatePanelsSold = (siteId, agreements) => {
    // Find all agreements that include this site
    const siteAgreements = agreements.filter(agreement => 
      agreement.siteIds && agreement.siteIds.includes(siteId)
    );
    
    // Sum up the panel counts for this site across all agreements
    return siteAgreements.reduce((total, agreement) => {
      const panelCount = agreement.sitePanelCounts && agreement.sitePanelCounts[siteId] 
        ? parseInt(agreement.sitePanelCounts[siteId]) 
        : 0;
      return total + panelCount;
    }, 0);
  };

  // Function to generate PDF of site details
  const generateSitePDF = async (currentSite, modalContentRef) => {
    if (!modalContentRef.current || !currentSite) return;
    
    try {
      // Clone the modal content to avoid modifying the original
      const clone = modalContentRef.current.cloneNode(true);
      
      // Hide buttons and interactive elements in the clone
      const buttons = clone.querySelectorAll('button, .btn');
      buttons.forEach(button => button.style.display = 'none');
      
      // Create a new window for PDF generation
      const pdfWindow = window.open('', '_blank');
      pdfWindow.document.write(`
        <html>
          <head>
            <title>${currentSite.name} - Detay</title>
            <style>
              body { font-family: Arial, sans-serif; }
              .container { max-width: 1000px; margin: 0 auto; padding: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .section { margin-bottom: 30px; }
              .section-title { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 15px; }
              .info-row { display: flex; margin-bottom: 10px; }
              .info-label { font-weight: bold; width: 200px; }
              .info-value { flex: 1; }
              table { width: 100%; border-collapse: collapse; margin: 15px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .text-center { text-align: center; }
              .text-success { color: #28a745; }
              .text-muted { color: #6c757d; }
            </style>
          </head>
          <body>
            <div class="container">
              ${clone.innerHTML}
            </div>
          </body>
        </html>
      `);
      pdfWindow.document.close();
      
      // Wait for content to load
      pdfWindow.onload = async () => {
        // Generate canvas from the content
        const canvas = await html2canvas(pdfWindow.document.body, {
          scale: 2,
          useCORS: true
        });
        
        // Create PDF
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;
        
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        // Add new pages if content is longer than one page
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        
        // Save the PDF
        pdf.save(`${currentSite.name}_detay.pdf`);
        
        // Close the temporary window
        pdfWindow.close();
        
        await window.showAlert(
          'Başarılı',
          'PDF dosyası başarıyla oluşturuldu ve indirildi.',
          'success'
        );
      };
    } catch (error) {
      console.error('Error generating PDF:', error);
      await window.showAlert(
        'Hata',
        'PDF oluşturma sırasında bir hata oluştu.',
        'error'
      );
    }
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
      
      if (newStart <= existingEnd && newEnd >= existingStart) { // Date range overlap check
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

  // Check if two date ranges overlap
  const dateRangesOverlap = (start1, end1, start2, end2) => {
    return start1 <= end2 && start2 <= end1;
  };

  return {
    getCompanyName,
    formatCurrency,
    calculateTotalElevators,
    calculatePanels,
    calculatePanelsForType,
    calculateAveragePeople,
    calculateSummaryStats,
    generateBlockLabels,
    getActiveAgreementsForSite,
    getSitePaymentHistoryDetailed,
    calculatePendingPayments,
    getPendingPaymentsDetailed,
    calculatePanelsSold,
    generateSitePDF,
    getPanelUsageInfo,
    dateRangesOverlap
  };
};

export default SiteHelpers;