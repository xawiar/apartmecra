import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import logger from '../../utils/logger';

const SiteHelpers = ({
  companies, sites, agreements,
  transactions
}) => {
  // Robust ID comparison helper
  const isIdMatch = (id1, id2) => {
    if (id1 === id2) return true;
    if (!id1 || !id2) return false;

    const s1 = String(id1).trim().toLowerCase();
    const s2 = String(id2).trim().toLowerCase();

    if (s1 === s2) return true;

    // Check with/without common prefixes (ADA-, LIL-, etc.)
    const clean1 = s1.replace(/^[a-z]+-?/, '');
    const clean2 = s2.replace(/^[a-z]+-?/, '');

    if (clean1 === clean2 && clean1 !== '' && !isNaN(Number(clean1))) return true;

    // Check if one contains the other (e.g. "53" in "LIL53")
    if (s1.includes(s2) || s2.includes(s1)) {
      // Only match if the numeric part matches to avoid "1" matching "10"
      const num1 = s1.match(/\d+/)?.[0];
      const num2 = s2.match(/\d+/)?.[0];
      if (num1 && num2 && num1 === num2) return true;
    }

    return false;
  };

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
      agreement.siteIds.some(sid => isIdMatch(sid, siteId)) &&
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
          a.siteIds && a.siteIds.some(sid => isIdMatch(sid, siteId)) &&
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
          const matchingKey = agreement.sitePanelCounts ? Object.keys(agreement.sitePanelCounts).find(key => isIdMatch(key, siteId)) : null;
          panelCount = matchingKey ? (parseInt(agreement.sitePanelCounts[matchingKey]) || 0) : 0;
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

    // Find all agreements that include this site (not just active ones, but also expired ones with pending payments)
    const siteAgreements = agreements.filter(agreement => {
      if (!agreement.siteIds || !Array.isArray(agreement.siteIds)) return false;
      if (agreement.isDeleted || agreement.isArchived) return false;
      // Check if any site ID matches
      return agreement.siteIds.some(agreementSiteId => isIdMatch(agreementSiteId, site.id));
    });

    siteAgreements.forEach(agreement => {
      const company = companies.find(c => c.id === agreement.companyId);
      const companyName = company ? company.name : 'Bilinmeyen Firma';

      // Get panel count for this site in this agreement
      let panelCount = 0;
      if (agreement.sitePanelCounts) {
        const matchingKey = Object.keys(agreement.sitePanelCounts).find(key => isIdMatch(key, site.id));
        if (matchingKey) {
          panelCount = parseInt(agreement.sitePanelCounts[matchingKey]) || 0;
        }
      }

      if (panelCount > 0) {
        // Calculate weekly rate per panel
        const weeklyRatePerPanel = parseFloat(agreement.weeklyRatePerPanel) || 0;
        const weeklyTotalAmount = weeklyRatePerPanel * panelCount;
        const sitePercentage = parseFloat(site.agreementPercentage) || 25;

        let totalWeeks = 0;
        let agreementStartDate = null;
        let agreementEndDate = null;

        if (agreement.dateRanges && Array.isArray(agreement.dateRanges) && agreement.dateRanges.length > 0) {
          agreement.dateRanges.forEach(range => {
            const rangeStart = new Date(range.startDate);
            const rangeEnd = new Date(range.endDate);
            const rangeWeeks = Math.ceil((rangeEnd - rangeStart) / (7 * 24 * 60 * 60 * 1000));
            totalWeeks += rangeWeeks;

            if (!agreementStartDate || rangeStart < agreementStartDate) agreementStartDate = rangeStart;
            if (!agreementEndDate || rangeEnd > agreementEndDate) agreementEndDate = rangeEnd;
          });
        } else {
          agreementStartDate = new Date(agreement.startDate);
          agreementEndDate = new Date(agreement.endDate);
          totalWeeks = Math.ceil((agreementEndDate - agreementStartDate) / (7 * 24 * 60 * 60 * 1000));
        }

        const siteTotalAmount = (weeklyTotalAmount * sitePercentage * totalWeeks) / 100;

        const existingTransactions = transactions.filter(transaction => {
          if (transaction.type !== 'expense') return false;

          const isForSite = (transaction.source && (
            transaction.source.includes('Site Ödemesi') &&
            transaction.source.includes(site.name)
          )) || (transaction.siteId && isIdMatch(transaction.siteId, site.id));

          const isForAgreement = (transaction.source && (
            String(transaction.source).includes(String(agreement.id)) ||
            String(transaction.source).includes(`Anlaşma ${agreement.id}`) ||
            String(transaction.description || '').includes(String(agreement.id))
          )) || (transaction.agreementId && String(transaction.agreementId) === String(agreement.id)) ||
            (transaction.agreementIds && Array.isArray(transaction.agreementIds) && transaction.agreementIds.some(aid => String(aid) === String(agreement.id)));

          const directMatch = transaction.agreementId && transaction.siteId &&
            String(transaction.agreementId) === String(agreement.id) &&
            isIdMatch(transaction.siteId, site.id);

          let isForDateRange = true;
          if (transaction.paymentPeriod) {
            const transactionDateFrom = new Date(transaction.paymentPeriod.dateFrom);
            const transactionDateTo = new Date(transaction.paymentPeriod.dateTo);

            let agreementDateFrom, agreementDateTo;
            if (agreement.dateRanges && Array.isArray(agreement.dateRanges) && agreement.dateRanges.length > 0) {
              agreementDateFrom = new Date(Math.min(...agreement.dateRanges.map(r => new Date(r.startDate))));
              agreementDateTo = new Date(Math.max(...agreement.dateRanges.map(r => new Date(r.endDate))));
            } else {
              agreementDateFrom = new Date(agreement.startDate);
              agreementDateTo = new Date(agreement.endDate);
            }

            isForDateRange = (transactionDateFrom >= agreementDateFrom && transactionDateFrom <= agreementDateTo) ||
              (transactionDateTo >= agreementDateFrom && transactionDateTo <= agreementDateTo) ||
              (transactionDateFrom <= agreementDateFrom && transactionDateTo >= agreementDateTo);
          }

          return ((isForSite && isForAgreement) || directMatch) && isForDateRange;
        });

        const totalPaid = existingTransactions.reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
        const pendingAmount = Math.max(0, siteTotalAmount - totalPaid);

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
            startDate: agreementStartDate ? agreementStartDate.toISOString().split('T')[0] : (agreement.startDate || ''),
            endDate: agreementEndDate ? agreementEndDate.toISOString().split('T')[0] : (agreement.endDate || ''),
            totalWeeks: totalWeeks
          });
        }
      }
    });

    return pendingPayments;
  };

  const getPendingPaymentsDetailed = (site, agreements, companies) => {
    if (!site.pendingPayments) return [];

    return site.pendingPayments.map(payment => {
      const agreement = agreements.find(a => String(a.id) === String(payment.agreementId));
      let panelCount = 0;
      let weeklyRatePerPanel = 0;
      let weeklyTotalAmount = 0;

      if (agreement && agreement.sitePanelCounts) {
        const matchingKey = Object.keys(agreement.sitePanelCounts).find(key => isIdMatch(key, site.id));
        panelCount = matchingKey ? (parseInt(agreement.sitePanelCounts[matchingKey]) || 0) : 0;
        weeklyRatePerPanel = parseFloat(agreement.weeklyRatePerPanel) || 0;
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

  const calculatePanelsSold = (siteId, agreements) => {
    const siteAgreements = agreements.filter(agreement =>
      agreement.siteIds && agreement.siteIds.some(sid => isIdMatch(sid, siteId))
    );

    return siteAgreements.reduce((total, agreement) => {
      let panelCount = 0;
      if (agreement.sitePanelCounts) {
        const matchingKey = Object.keys(agreement.sitePanelCounts).find(key => isIdMatch(key, siteId));
        panelCount = matchingKey ? (parseInt(agreement.sitePanelCounts[matchingKey]) || 0) : 0;
      }
      return total + panelCount;
    }, 0);
  };

  const generateSitePDF = async (currentSite, modalContentRef) => {
    if (!modalContentRef.current || !currentSite) return;
    try {
      const clone = modalContentRef.current.cloneNode(true);
      const buttons = clone.querySelectorAll('button, .btn');
      buttons.forEach(button => button.style.display = 'none');

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
            <div class="container">${clone.innerHTML}</div>
          </body>
        </html>
      `);
      pdfWindow.document.close();

      pdfWindow.onload = async () => {
        const canvas = await html2canvas(pdfWindow.document.body, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        pdf.save(`${currentSite.name}_detay.pdf`);
        pdfWindow.close();
        await window.showAlert('Başarılı', 'PDF dosyası başarıyla oluşturuldu ve indirildi.', 'success');
      };
    } catch (error) {
      logger.error('Error generating PDF:', error);
      await window.showAlert('Hata', 'PDF oluşturma sırasında bir hata oluştu.', 'error');
    }
  };

  const getPanelUsageInfo = (siteId, blockId, panelId, startDate, endDate) => {
    if (!startDate || !endDate) return null;
    const siteAgreements = agreements.filter(agreement =>
      agreement.siteIds && agreement.siteIds.some(sid => isIdMatch(sid, siteId)) &&
      agreement.status === 'active'
    );

    const newStart = new Date(startDate);
    const newEnd = new Date(endDate);

    for (const agreement of siteAgreements) {
      const existingStart = new Date(agreement.startDate);
      const existingEnd = new Date(agreement.endDate);

      if (newStart <= existingEnd && newEnd >= existingStart) {
        const matchingSiteKey = agreement.siteBlockSelections ? Object.keys(agreement.siteBlockSelections).find(key => isIdMatch(key, siteId)) : null;
        if (matchingSiteKey) {
          const usedBlocks = agreement.siteBlockSelections[matchingSiteKey];
          if (usedBlocks.includes(blockId)) {
            if (agreement.sitePanelSelections) {
              const matchingPanelSiteKey = Object.keys(agreement.sitePanelSelections).find(key => isIdMatch(key, siteId));
              if (matchingPanelSiteKey &&
                agreement.sitePanelSelections[matchingPanelSiteKey] &&
                agreement.sitePanelSelections[matchingPanelSiteKey][blockId] &&
                agreement.sitePanelSelections[matchingPanelSiteKey][blockId].includes(panelId)) {
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
    }
    return null;
  };

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