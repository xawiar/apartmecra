import jsPDF from 'jspdf';

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

  // Get company by ID
  const getCompany = (companyId) => {
    // Handle both string and number IDs by converting to string for comparison
    const company = companies.find(c => String(c.id) === String(companyId));
    return company;
  };

  // Get company credit information
  const getCompanyCreditInfo = (companyId) => {
    const company = getCompany(companyId);
    if (!company) return null;
    
    // Get the latest credit history entry
    if (!company.creditHistory || company.creditHistory.length === 0) {
      return null;
    }
    
    const latestCredit = company.creditHistory[company.creditHistory.length - 1];
    return {
      credit: company.credit,
      panelPrice: latestCredit.panelPrice,
      totalAmount: latestCredit.totalAmount
    };
  };

  // Get site name by ID
  const getSiteName = (siteId) => {
    // Handle both string and number IDs by converting to string for comparison
    const site = sites.find(s => String(s.id) === String(siteId));
    return site ? site.name : '';
  };

  // Format currency with TL symbol
  const formatCurrency = (amount) => {
    const formatted = new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
    return `${formatted} TL`;
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

  // Get the current date range for availability checking
  const getCurrentDateRange = () => {
    const selectedWeekObjects = generateWeekOptions().filter(week => selectedWeeks.includes(week.id));
    if (selectedWeekObjects.length === 0) {
      return { startDate: formData.startDate, endDate: formData.endDate };
    }
    
    return {
      startDate: selectedWeekObjects[0].start,
      endDate: selectedWeekObjects[selectedWeekObjects.length - 1].end
    };
  };

  // Generate week options based on start and end dates
  const generateWeekOptions = () => {
    if (!formData.startDate || !formData.endDate) return [];
    
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const weeks = [];
    
    // Calculate the number of weeks
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const weekCount = Math.ceil(diffDays / 7);
    
    // Generate week options
    for (let i = 0; i < weekCount; i++) {
      const weekStart = new Date(start);
      weekStart.setDate(start.getDate() + (i * 7));
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      // Make sure we don't go beyond the end date
      if (weekEnd > end) {
        weekEnd.setTime(end.getTime());
      }
      
      weeks.push({
        id: i + 1,
        label: `${weekStart.toLocaleDateString('tr-TR')} - ${weekEnd.toLocaleDateString('tr-TR')}`,
        start: weekStart.toISOString().split('T')[0],
        end: weekEnd.toISOString().split('T')[0]
      });
    }
    
    return weeks;
  };

  // Update the total panel count for a site based on selected panels - Updated for new system
  const updateSitePanelCount = (siteId, sitePanelSelections, setSitePanelCounts) => {
    const siteSelections = sitePanelSelections[siteId] || {};
    let totalSelectedPanels = 0;
    
    // Count all selected panels for this site
    Object.values(siteSelections).forEach(blockSelections => {
      totalSelectedPanels += blockSelections.length;
    });
    
    // Update the panel count for this site
    if (setSitePanelCounts) {
      setSitePanelCounts(prev => ({
        ...prev,
        [siteId]: totalSelectedPanels
      }));
    }
    
    return totalSelectedPanels;
  };

  // Calculate total weeks between start and end dates
  const calculateTotalWeeks = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Calculate the number of weeks
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.ceil(diffDays / 7);
  };

  // Calculate total weeks from multiple date ranges
  const calculateTotalWeeksFromRanges = (dateRanges) => {
    if (!dateRanges || dateRanges.length === 0) return 0;
    
    let totalWeeks = 0;
    dateRanges.forEach(range => {
      if (range.startDate && range.endDate) {
        totalWeeks += calculateTotalWeeks(range.startDate, range.endDate);
      }
    });
    
    return totalWeeks;
  };

  // Calculate total amount for the agreement
  const calculateTotalAmount = (sitePanelCounts, weeklyRatePerPanel) => {
    const totalWeeks = calculateTotalWeeks(formData.startDate, formData.endDate);
    const totalPanels = Object.values(sitePanelCounts).reduce((sum, count) => sum + count, 0);
    const weeklyRate = parseFloat(weeklyRatePerPanel) || 0;
    
    return totalWeeks * totalPanels * weeklyRate;
  };

  // Check if a specific panel is available for the selected date range - Updated for new system
  // Supports both single date range (startDate, endDate) and multiple date ranges (dateRanges array)
  const isPanelAvailable = (siteId, blockKey, panelKey, startDate, endDate, dateRanges = null) => {
    // Use dateRanges if provided, otherwise fall back to startDate/endDate
    let rangesToCheck = [];
    if (dateRanges && dateRanges.length > 0) {
      rangesToCheck = dateRanges.filter(r => r.startDate && r.endDate);
    } else if (startDate && endDate) {
      rangesToCheck = [{ startDate, endDate }];
    } else {
      return true; // No date range specified, assume available
    }
    
    if (rangesToCheck.length === 0) return true;
    
    // Find all active agreements that include this site
    const siteAgreements = agreements.filter(agreement => 
      agreement.siteIds && agreement.siteIds.includes(siteId) &&
      (agreement.status === 'active' || agreement.status === 'completed')
    );
    
    // Get date ranges from existing agreement (support both old and new format)
    const getAgreementRanges = (agreement) => {
      if (agreement.dateRanges && agreement.dateRanges.length > 0) {
        return agreement.dateRanges.filter(r => r.startDate && r.endDate);
      } else if (agreement.startDate && agreement.endDate) {
        return [{ startDate: agreement.startDate, endDate: agreement.endDate }];
      }
      return [];
    };
    
    // Check each date range we want to use
    for (const newRange of rangesToCheck) {
      const newStart = new Date(newRange.startDate);
      const newEnd = new Date(newRange.endDate);
      
      // Check each existing agreement for date overlap and panel usage
      for (const agreement of siteAgreements) {
        const existingRanges = getAgreementRanges(agreement);
        
        for (const existingRange of existingRanges) {
          const existingStart = new Date(existingRange.startDate);
          const existingEnd = new Date(existingRange.endDate);
          
          // Check if date ranges overlap
          if (dateRangesOverlap(newStart, newEnd, existingStart, existingEnd)) {
            // Check if this specific panel is used in the overlapping agreement
            if (agreement.siteBlockSelections && agreement.siteBlockSelections[siteId]) {
              const usedBlocks = agreement.siteBlockSelections[siteId];
              if (usedBlocks.includes(blockKey)) {
                // Check if this specific panel is used in this block
                if (agreement.sitePanelSelections && 
                    agreement.sitePanelSelections[siteId] && 
                    agreement.sitePanelSelections[siteId][blockKey] &&
                    agreement.sitePanelSelections[siteId][blockKey].includes(panelKey)) {
                  return false; // Panel is not available
                }
              }
            }
          }
        }
      }
    }
    
    return true; // Panel is available
  };

  // Get information about which agreement is using a specific panel - Updated for new system
  const getPanelUsageInfo = (siteId, blockKey, panelKey, startDate, endDate) => {
    if (!startDate || !endDate) return null;
    
    const siteAgreements = agreements.filter(agreement => 
      agreement.siteIds && agreement.siteIds.includes(siteId) &&
      (agreement.status === 'active' || agreement.status === 'completed')
    );
    
    const newStart = new Date(startDate);
    const newEnd = new Date(endDate);
    
    for (const agreement of siteAgreements) {
      const existingStart = new Date(agreement.startDate);
      const existingEnd = new Date(agreement.endDate);
      
      if (dateRangesOverlap(newStart, newEnd, existingStart, existingEnd)) {
        if (agreement.siteBlockSelections && agreement.siteBlockSelections[siteId]) {
          const usedBlocks = agreement.siteBlockSelections[siteId];
          if (usedBlocks.includes(blockKey)) {
            if (agreement.sitePanelSelections && 
                agreement.sitePanelSelections[siteId] && 
                agreement.sitePanelSelections[siteId][blockKey] &&
                agreement.sitePanelSelections[siteId][blockKey].includes(panelKey)) {
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

  // Format date for display (Turkish character support)
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const formatted = date.toLocaleDateString('tr-TR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    // Türkçe karakterleri koru
    return formatted;
  };

  // Generate detailed "Anlaşma Özeti" PDF (mevcut fonksiyon)
  const generateAgreementPDF = (agreement) => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const lineHeight = 6;
      let yPosition = margin;

      // Color definitions
      const colors = {
        primary: [0, 123, 255],
        primaryLight: [230, 240, 255],
        success: [40, 167, 69],
        successLight: [230, 245, 235],
        warning: [255, 193, 7],
        warningLight: [255, 248, 220],
        danger: [220, 53, 69],
        dangerLight: [248, 215, 218],
        info: [23, 162, 184],
        infoLight: [209, 236, 241],
        dark: [33, 37, 41],
        light: [248, 249, 250],
        border: [222, 226, 230]
      };

      // Helper function to fix Turkish characters
      const fixTurkishChars = (text) => {
        if (!text) return '';
        return String(text)
          .replace(/ı/g, 'i')
          .replace(/İ/g, 'I')
          .replace(/ğ/g, 'g')
          .replace(/Ğ/g, 'G')
          .replace(/ü/g, 'u')
          .replace(/Ü/g, 'U')
          .replace(/ş/g, 's')
          .replace(/Ş/g, 'S')
          .replace(/ö/g, 'o')
          .replace(/Ö/g, 'O')
          .replace(/ç/g, 'c')
          .replace(/Ç/g, 'C');
      };

      // Helper function to add new page if needed
      const checkNewPage = (requiredSpace = 20) => {
        if (yPosition + requiredSpace > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
          return true;
        }
        return false;
      };

      // Helper function to add text with word wrap and Turkish character fix
      const addText = (text, x, y, maxWidth, fontSize = 12, fontStyle = 'normal', align = 'left', color = [0, 0, 0]) => {
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', fontStyle);
        pdf.setTextColor(color[0], color[1], color[2]);
        const fixedText = fixTurkishChars(text);
        const lines = pdf.splitTextToSize(fixedText, maxWidth);
        pdf.text(lines, x, y, { align: align });
        pdf.setTextColor(0, 0, 0);
        return lines.length * (fontSize * 0.4);
      };

      // Helper function to add colored box
      const addColoredBox = (x, y, width, height, bgColor, borderColor = null, borderRadius = 2) => {
        if (bgColor) {
          pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        }
        if (borderColor) {
          pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
          pdf.setLineWidth(0.5);
        }
        if (borderRadius > 0) {
          pdf.roundedRect(x, y, width, height, borderRadius, borderRadius, bgColor ? (borderColor ? 'FD' : 'F') : 'D');
        } else {
          pdf.rect(x, y, width, height, bgColor ? (borderColor ? 'FD' : 'F') : 'D');
        }
      };

      // Helper function to add section header with colored background
      const addSectionHeader = (text, y, bgColor = colors.primary, textColor = [255, 255, 255]) => {
        checkNewPage(12);
        const headerHeight = 10;
        addColoredBox(margin, y - 5, pageWidth - (margin * 2), headerHeight, bgColor, null, 3);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
        const fixedText = fixTurkishChars(text);
        pdf.text(fixedText, pageWidth / 2, y + 2, { align: 'center' });
        pdf.setTextColor(0, 0, 0);
        return y + headerHeight + 2;
      };

      // Header with gradient effect
      pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      pdf.rect(0, 0, pageWidth, 35, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ANLASMA METNI', pageWidth / 2, 22, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Anlasma No: ${agreement.id}`, pageWidth / 2, 30, { align: 'center' });
      
      yPosition = 45;
      pdf.setTextColor(0, 0, 0);

      // Company Information
      const company = getCompany(agreement.companyId);
      const companyName = getCompanyName(agreement.companyId);
      
      yPosition = addSectionHeader('TARAFLAR', yPosition, colors.primary, [255, 255, 255]);
      yPosition += 5;

      // Company info box - resmi tasarım
      addColoredBox(margin, yPosition, pageWidth - (margin * 2), 30, null, colors.primary, 2);
      yPosition += 8;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      addText('1. FIRMA BILGILERI', margin + 5, yPosition, pageWidth - (margin * 2) - 10, 11, 'bold', 'left');
      yPosition += lineHeight + 3;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      addText(`Firma Adi: ${companyName}`, margin + 5, yPosition, pageWidth - (margin * 2) - 10, 10, 'normal', 'left');
      yPosition += lineHeight;

      if (company) {
        if (company.contact) {
          addText(`Iletisim: ${company.contact}`, margin + 5, yPosition, pageWidth - (margin * 2) - 10, 10, 'normal', 'left');
          yPosition += lineHeight;
        }
        if (company.phone) {
          addText(`Telefon: ${company.phone}`, margin + 5, yPosition, pageWidth - (margin * 2) - 10, 10, 'normal', 'left');
          yPosition += lineHeight;
        }
        if (company.email) {
          addText(`E-posta: ${company.email}`, margin + 5, yPosition, pageWidth - (margin * 2) - 10, 10, 'normal', 'left');
          yPosition += lineHeight;
        }
      }

      yPosition += 5;

      // Agreement Details
      yPosition = addSectionHeader('ANLASMA DETAYLARI', yPosition, colors.info, [255, 255, 255]);
      yPosition += 5;

      // Agreement details box - resmi tasarım
      addColoredBox(margin, yPosition, pageWidth - (margin * 2), 35, null, colors.info, 2);
      yPosition += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      addText(`Anlasma No: ${agreement.id}`, margin + 5, yPosition, pageWidth - (margin * 2) - 10, 10, 'normal', 'left');
      yPosition += lineHeight;

      addText(`Baslangic Tarihi: ${formatDate(agreement.startDate)}`, margin + 5, yPosition, pageWidth - (margin * 2) - 10, 10, 'normal', 'left');
      yPosition += lineHeight;

      addText(`Bitis Tarihi: ${formatDate(agreement.endDate)}`, margin + 5, yPosition, pageWidth - (margin * 2) - 10, 10, 'normal', 'left');
      yPosition += lineHeight;

      const totalWeeks = calculateTotalWeeks(agreement.startDate, agreement.endDate);
      addText(`Sure: ${totalWeeks} hafta`, margin + 5, yPosition, pageWidth - (margin * 2) - 10, 10, 'normal', 'left');
      yPosition += lineHeight;

      addText(`Haftalik Panel Ucreti: ${formatCurrency(agreement.weeklyRatePerPanel)}`, margin + 5, yPosition, pageWidth - (margin * 2) - 10, 10, 'normal', 'left');
      yPosition += 5;

      // Sites and Panels (only selected sites)
      yPosition = addSectionHeader('SITELER VE PANELLER', yPosition, colors.success, [255, 255, 255]);
      yPosition += 5;

      if (agreement.siteIds && agreement.siteIds.length > 0) {
        const selectedSites = agreement.siteIds;
        let siteIndex = 1;

        selectedSites.forEach(siteId => {
          const site = sites.find(s => String(s.id) === String(siteId));
          const siteName = site ? site.name : `Site ${siteId}`;
          const panelCount = agreement.sitePanelCounts?.[siteId] || 0;

          if (panelCount > 0) { // Only show sites with selected panels
            checkNewPage(30);
            
            // Site container box
            addColoredBox(margin, yPosition, pageWidth - (margin * 2), 30, null, colors.border, 2);
            yPosition += 5;

            // Site name
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            addText(`${siteIndex}. ${siteName}`, margin + 5, yPosition, pageWidth - (margin * 2) - 10, 12, 'bold', 'left');
            yPosition += lineHeight + 2;

            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            addText(`Panel Sayisi: ${panelCount} panel`, margin + 5, yPosition, pageWidth - (margin * 2) - 10, 10, 'normal', 'left');
            yPosition += lineHeight + 3;

            // Show block and panel information
            if (agreement.siteBlockSelections?.[siteId] && agreement.sitePanelSelections?.[siteId]) {
              const selectedBlocks = agreement.siteBlockSelections[siteId];
              const blockPanelMap = {}; // Map to store which panels belong to which block

              selectedBlocks.forEach(blockKey => {
                const blockLabel = blockKey.split('-')[2];
                const selectedPanels = agreement.sitePanelSelections[siteId][blockKey] || [];
                
                selectedPanels.forEach(panelKey => {
                  const match = panelKey.match(/panel-(\d+)/);
                  const panelNumber = match ? match[1] : panelKey;
                  if (!blockPanelMap[blockLabel]) {
                    blockPanelMap[blockLabel] = [];
                  }
                  blockPanelMap[blockLabel].push(panelNumber);
                });
              });

              // Show block and panel mapping
              pdf.setFontSize(10);
              pdf.setFont('helvetica', 'normal');
              
              Object.keys(blockPanelMap).sort().forEach(blockLabel => {
                const panels = blockPanelMap[blockLabel].sort((a, b) => parseInt(a) - parseInt(b));
                addText(`Blok ${blockLabel}: Panel ${panels.join(', ')}`, margin + 5, yPosition, pageWidth - (margin * 2) - 10, 10, 'normal', 'left');
                yPosition += lineHeight;
              });

              yPosition += 2;
            }

            yPosition += 3;
            siteIndex++;
          }
        });
      } else {
        addText('Secili site bulunmamaktadir.', pageWidth / 2, yPosition, pageWidth - (margin * 2) - 10, 10, 'normal', 'center');
        yPosition += lineHeight;
      }

      yPosition += 5;

      // Financial Summary
      checkNewPage(40);
      yPosition = addSectionHeader('MALI OZET', yPosition, colors.warning, [33, 37, 41]);
      yPosition += 5;

      // Financial summary box - resmi tasarım
      addColoredBox(margin, yPosition, pageWidth - (margin * 2), 35, null, colors.warning, 2);
      yPosition += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      const totalPanels = Object.values(agreement.sitePanelCounts || {}).reduce((sum, count) => sum + count, 0);
      addText(`Toplam Panel Sayisi: ${totalPanels} panel`, margin + 5, yPosition, pageWidth - (margin * 2) - 10, 10, 'normal', 'left');
      yPosition += lineHeight;

      addText(`Toplam Hafta: ${totalWeeks} hafta`, margin + 5, yPosition, pageWidth - (margin * 2) - 10, 10, 'normal', 'left');
      yPosition += lineHeight;

      addText(`Haftalik Ucret: ${formatCurrency(agreement.weeklyRatePerPanel)}`, margin + 5, yPosition, pageWidth - (margin * 2) - 10, 10, 'normal', 'left');
      yPosition += lineHeight + 3;

      // Total amount box - resmi tasarım
      addColoredBox(margin + 5, yPosition, pageWidth - (margin * 2) - 10, 10, colors.primary, colors.primary, 2);
      yPosition += 7;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(255, 255, 255);
      addText(`TOPLAM TUTAR: ${formatCurrency(agreement.totalAmount)}`, pageWidth / 2, yPosition, pageWidth - (margin * 2) - 20, 13, 'bold', 'center', [255, 255, 255]);
      yPosition += 5;


      // Notes (at the end)
      if (agreement.notes && agreement.notes.trim()) {
        checkNewPage(30);
        yPosition = addSectionHeader('NOTLAR', yPosition, colors.dark, [255, 255, 255]);
        yPosition += 5;

        // Notes box - resmi tasarım
        addColoredBox(margin, yPosition, pageWidth - (margin * 2), 25, null, colors.border, 2);
        yPosition += 8;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const notesHeight = addText(agreement.notes, margin + 5, yPosition, pageWidth - (margin * 2) - 10, 10, 'normal', 'left');
        yPosition += notesHeight + 5;
      }

      // Footer
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        // Footer line
        pdf.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
        pdf.setLineWidth(0.5);
        pdf.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
        
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(128, 128, 128);
        const footerText = `Sayfa ${i} / ${totalPages} - Olusturulma Tarihi: ${new Date().toLocaleDateString('tr-TR')}`;
        pdf.text(fixTurkishChars(footerText), pageWidth / 2, pageHeight - 10, { align: 'center' });
      }

      // Save PDF
      const fileName = `anlasma_${agreement.id}_${fixTurkishChars(companyName).replace(/\s+/g, '_')}.pdf`;
      pdf.save(fileName);

      return true;
    } catch (error) {
      console.error('Error generating agreement PDF:', error);
      return false;
    }
  };

  // Generate legal contract PDF using the provided contract template
  const generateContractPDF = (agreement) => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let y = margin;

      // Helper function to handle empty values (don't show placeholder text)
      const getValue = (value, defaultValue = '') => {
        return value || defaultValue;
      };

      const addText = (text, x, yPos, maxWidth, fontSize = 11, fontStyle = 'normal') => {
        if (!text) return yPos;
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', fontStyle);
        // Türkçe karakter desteği için text'i olduğu gibi kullan
        const lines = pdf.splitTextToSize(String(text), maxWidth);
        pdf.text(lines, x, yPos);
        return yPos + lines.length * (fontSize * 0.45);
      };

      const checkNewPage = (needed = 20) => {
        if (y + needed > pageHeight - margin) {
          pdf.addPage();
          y = margin;
        }
      };

      // Agreement & company data
      const company = getCompany(agreement.companyId);
      const companyName = getCompanyName(agreement.companyId);
      const totalPanels = Object.values(agreement.sitePanelCounts || {}).reduce(
        (sum, count) => sum + (parseInt(count) || 0),
        0
      );
      const totalWeeks = calculateTotalWeeks(agreement.startDate, agreement.endDate);

      // Header
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ASANSÖR İÇİ REKLAM PANELİ YAYIN SÖZLEŞMESİ', pageWidth / 2, y, { align: 'center' });
      y += 10;

      // Madde 1 – Taraflar
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      y = addText('Madde 1 – Taraflar', margin, y, pageWidth - 2 * margin, 12, 'bold');
      y += 2;

      pdf.setFont('helvetica', 'normal');
      y = addText('İşbu sözleşme;', margin, y, pageWidth - 2 * margin);
      y += 2;

      // Hizmet Sağlayıcı
      y = addText('Reklam Hizmeti Veren:', margin, y, pageWidth - 2 * margin, 11, 'bold');
      y = addText('Firma Unvanı: DAT DİJİTAL', margin + 4, y, pageWidth - 2 * margin);
      y = addText('Adres: ÇARŞI MAHALLESİ BOSNA HERSEK BULVARI ELAZIĞ İŞ MERKEZİ NO:11 KAT:5 DAİRE:20 MERKEZ/ELAZIĞ', margin + 4, y, pageWidth - 2 * margin);
      y = addText('Vergi Dairesi / No:', margin + 4, y, pageWidth - 2 * margin);
      y = addText('Telefon: 0540 365 23 23', margin + 4, y, pageWidth - 2 * margin);
      y += 2;

      // Reklam Veren (company)
      y = addText('Reklam Veren:', margin, y, pageWidth - 2 * margin, 11, 'bold');
      y = addText(`Firma Unvanı: ${getValue(companyName)}`, margin + 4, y, pageWidth - 2 * margin);
      y = addText(`Adres: ${getValue(company?.address)}`, margin + 4, y, pageWidth - 2 * margin);
      y = addText(`Vergi Dairesi / No: ${getValue(company?.taxInfo)}`, margin + 4, y, pageWidth - 2 * margin);
      y = addText(`Telefon: ${getValue(company?.phone)}`, margin + 4, y, pageWidth - 2 * margin);
      y += 4;

      y = addText('Arasında aşağıdaki şartlarla akdedilmiştir.', margin, y, pageWidth - 2 * margin);
      y += 4;

      // Madde 2 – Sözleşmenin Konusu
      checkNewPage(40);
      y = addText('Madde 2 – Sözleşmenin Konusu', margin, y, pageWidth - 2 * margin, 12, 'bold');
      y += 2;
      y = addText(
        'Bu sözleşmenin konusu; HİZMET SAĞLAYICI'ya ait ve/veya kullanım hakkı kendisinde bulunan apartman ve site asansörleri içerisine yerleştirilen reklam panolarında, REKLAM VEREN'e ait reklam görsellerinin belirtilen süre boyunca asılması, muhafaza edilmesi ve yayında tutulmasına ilişkin şartların belirlenmesidir.',
        margin,
        y,
        pageWidth - 2 * margin
      );
      y += 4;

      // Madde 3 – Reklam Alanları ve Panel Sayısı
      checkNewPage(40);
      y = addText('Madde 3 – Reklam Alanları ve Panel Sayısı', margin, y, pageWidth - 2 * margin, 12, 'bold');
      y += 2;
      y = addText(
        'Reklam yayını yapılacak site ve paneller işbu sözleşmenin ayrılmaz parçası olan EK-1 Liste'de belirtilmiştir.',
        margin,
        y,
        pageWidth - 2 * margin
      );
      y += 3;

      y = addText(`Toplam Panel Sayısı: ${totalPanels} adet`, margin, y, pageWidth - 2 * margin);
      y = addText(
        `1 Panel 1 Haftalık Birim Ücreti: ${formatCurrency(agreement.weeklyRatePerPanel)} + KDV`,
        margin,
        y,
        pageWidth - 2 * margin
      );
      y += 2;
      
      // Fiyatlar bölümü - manuel doldurulacak alanlar
      y = addText('Anlaşma Tutarı:', margin, y, pageWidth - 2 * margin, 11, 'bold');
      y = addText(`${formatCurrency(agreement.totalAmount)}`, margin + 4, y, pageWidth - 2 * margin);
      y += 3;
      y = addText('KDV Oranı:', margin, y, pageWidth - 2 * margin, 11, 'bold');
      y = addText('', margin + 4, y, pageWidth - 2 * margin); // Boş bırak
      y += 3;
      y = addText('KDV Tutarı:', margin, y, pageWidth - 2 * margin, 11, 'bold');
      y = addText('', margin + 4, y, pageWidth - 2 * margin); // Boş bırak
      y += 3;
      y = addText('Toplam Tutar:', margin, y, pageWidth - 2 * margin, 11, 'bold');
      y = addText('', margin + 4, y, pageWidth - 2 * margin); // Boş bırak
      y += 4;

      // Madde 4 – Sözleşme Süresi
      checkNewPage(40);
      y = addText('Madde 4 – Sözleşme Süresi', margin, y, pageWidth - 2 * margin, 12, 'bold');
      y += 2;
      
      // Get date ranges (support both old and new format)
      let dateRanges = agreement.dateRanges || [];
      if (dateRanges.length === 0 && agreement.startDate && agreement.endDate) {
        dateRanges = [{ startDate: agreement.startDate, endDate: agreement.endDate }];
      }
      
      if (dateRanges.length > 0) {
        y = addText(
          'Sözleşme aşağıda belirtilen tarih aralıklarında geçerlidir:',
          margin,
          y,
          pageWidth - 2 * margin
        );
        y += 3;
        
        dateRanges.forEach((range, index) => {
          if (range.startDate && range.endDate) {
            const startStr = formatDate(range.startDate);
            const endStr = formatDate(range.endDate);
            y = addText(
              `* ${startStr} – ${endStr}`,
              margin + 4,
              y,
              pageWidth - 2 * margin - 4
            );
            y += 2;
          }
        });
        
        y += 2;
        y = addText(
          'Belirtilen süreler dışında reklam yayını yapılmaz. Süre bitiminde sözleşme kendiliğinden sona erer.',
          margin,
          y,
          pageWidth - 2 * margin
        );
      } else {
        // Fallback to old format if no date ranges
        const startStr = formatDate(agreement.startDate);
        const endStr = formatDate(agreement.endDate);
        y = addText(
          `Sözleşme ${startStr} – ${endStr} tarihleri arasında geçerlidir. Belirtilen süreler dışında reklam yayını yapılmaz. Süre bitiminde sözleşme kendiliğinden sona erer.`,
          margin,
          y,
          pageWidth - 2 * margin
        );
      }
      y += 4;

      // Devam eden maddeler - sabit metin
      const maddeTexts = [
        {
          title: 'Madde 5 – Ödeme Şartları',
          body:
            'REKLAM VEREN, toplam sözleşme bedelini reklam yayınının başlayacağı haftadan önceki CUMA günü saat 17:00'ye kadar HİZMET SAĞLAYICI'nın bildireceği banka hesabına veya nakit / çek / kredi kartı ile eksiksiz ödemekle yükümlüdür. Ödeme yapılmadığı sürece reklam asımı yapılmaz, yayın süresi başlamaz ve gecikmeden HİZMET SAĞLAYICI sorumlu tutulamaz. Ödeme günü geçirilirse HİZMET SAĞLAYICI'nın sözleşmeyi tek taraflı ve tazminatsız fesih hakkı doğar.'
        },
        {
          title: 'Madde 6 – Reklam Asımı ve Muhafaza',
          body:
            'HİZMET SAĞLAYICI; reklam asımını Pazar günü gerçekleştirmeyi, reklam görsellerini sözleşme süresi boyunca panolarda muhafaza etmeyi ve kasıt veya ağır ihmal dışında doğabilecek zararlar haricinde yayını sürdürmeyi taahhüt eder. Apartman yönetimi, üçüncü şahıslar, vandalizm, doğal afet, yangın, su baskını, sabotaj ve benzeri mücbir sebeplerden kaynaklanan sökülme, zarar ve kayıplardan HİZMET SAĞLAYICI sorumlu değildir.'
        },
        {
          title: 'Madde 7 – Reklam İçeriği Sorumluluğu',
          body:
            'Reklam içeriğinin mevzuata, genel ahlaka ve ilgili reklam yönetmeliklerine uygunluğundan tamamen REKLAM VEREN sorumludur. Doğabilecek her türlü idari para cezası, dava, tazminat ve yaptırımdan REKLAM VEREN sorumludur; HİZMET SAĞLAYICI'ya rücu edilemez.'
        },
        {
          title: 'Madde 8 – Görsel Teslimi',
          body:
            'Reklam baskıları en geç Perşembe günü saat 17:00'ye kadar HİZMET SAĞLAYICI'ya teslim edilmek zorundadır. Geç teslimden doğacak gecikmeler yayın süresinden düşülmez, ücret iadesi yapılmaz.'
        },
        {
          title: 'Madde 9 – Fesih',
          body:
            'Taraflar, sözleşme süresi içinde tek taraflı, gerekçesiz ve ücret iadesi talep ederek fesih haklarına sahip değildir. Mücbir sebep halleri bu hükmün istisnasıdır.'
        },
        {
          title: 'Madde 10 – Gizlilik',
          body:
            'Taraflar, bu sözleşme kapsamında öğrendikleri ticari sırları ve mali bilgileri üçüncü kişilerle paylaşamaz.'
        },
        {
          title: 'Madde 11 – Devir Yasağı',
          body:
            'REKLAM VEREN, bu sözleşmeden doğan hak ve yükümlülüklerini HİZMET SAĞLAYICI'nın yazılı izni olmadan üçüncü kişilere devredemez.'
        },
        {
          title: 'Madde 12 – Tebligat',
          body:
            'Tarafların işbu sözleşmede belirtilen adresleri yasal tebligat adresleridir. Adres değişiklikleri yazılı bildirilmedikçe eski adrese yapılan tebligatlar geçerli sayılır.'
        },
        {
          title: 'Madde 13 – Yetkili Mahkeme',
          body:
            'İşbu sözleşmeden doğacak uyuşmazlıklarda ELAZIĞ MERKEZ Mahkemeleri ve İcra Daireleri yetkilidir.'
        }
      ];

      maddeTexts.forEach((m) => {
        checkNewPage(40);
        y = addText(m.title, margin, y, pageWidth - 2 * margin, 12, 'bold');
        y += 2;
        y = addText(m.body, margin, y, pageWidth - 2 * margin);
        y += 4;
      });

      // Madde 14 – Yürürlük
      checkNewPage(30);
      const todayStr = new Date().toLocaleDateString('tr-TR');
      y = addText('Madde 14 – Yürürlük', margin, y, pageWidth - 2 * margin, 12, 'bold');
      y += 2;
      y = addText(
        `14 (ondört) maddeden ibaret işbu sözleşme ${todayStr} tarihinde 2 (iki) nüsha olarak imzalanmış olup yürürlüğe girmiştir.`,
        margin,
        y,
        pageWidth - 2 * margin
      );
      y += 10;

      // İmza bölümü
      checkNewPage(40);
      const centerX = pageWidth / 2;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text('HİZMET SAĞLAYICI', margin + 10, y);
      pdf.text('REKLAM VEREN', centerX + 10, y);
      y += 8;
      pdf.setFont('helvetica', 'normal');
      pdf.text('DAT DİJİTAL', margin + 10, y);
      pdf.text(getValue(companyName), centerX + 10, y);
      y += 20;

      // EK-1: Site ve paneller listesi
      pdf.addPage();
      y = margin;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.text('EK-1: REKLAM ALANLARI VE PANEL LİSTESİ', pageWidth / 2, y, { align: 'center' });
      y += 8;

      if (agreement.siteIds && agreement.siteIds.length > 0) {
        const selectedSites = agreement.siteIds;
        let siteIndex = 1;

        selectedSites.forEach(siteId => {
          const site = sites.find(s => String(s.id) === String(siteId));
          const siteName = site ? site.name : `Site ${siteId}`;
          const panelCount = agreement.sitePanelCounts?.[siteId] || 0;

          if (panelCount > 0) {
            checkNewPage(30);
            y = addText(`${siteIndex}. ${siteName}`, margin, y, pageWidth - 2 * margin, 12, 'bold');
            y += 2;

            y = addText(`Toplam Panel: ${panelCount}`, margin + 4, y, pageWidth - 2 * margin);

            if (agreement.siteBlockSelections?.[siteId] && agreement.sitePanelSelections?.[siteId]) {
              const selectedBlocks = agreement.siteBlockSelections[siteId];
              const blockPanelMap = {};

              selectedBlocks.forEach(blockKey => {
                const blockLabel = blockKey.split('-')[2];
                const selectedPanels = agreement.sitePanelSelections[siteId][blockKey] || [];

                selectedPanels.forEach(panelKey => {
                  const match = panelKey.match(/panel-(\d+)/);
                  const panelNumber = match ? match[1] : panelKey;
                  if (!blockPanelMap[blockLabel]) {
                    blockPanelMap[blockLabel] = [];
                  }
                  blockPanelMap[blockLabel].push(panelNumber);
                });
              });

              Object.keys(blockPanelMap).sort().forEach(blockLabel => {
                const panels = blockPanelMap[blockLabel].sort((a, b) => parseInt(a) - parseInt(b));
                y = addText(`Blok ${blockLabel}: Panel ${panels.join(', ')}`, margin + 4, y, pageWidth - 2 * margin);
              });
            }

            y += 4;
            siteIndex++;
          }
        });
      } else {
        y = addText('Secili site bulunmamaktadir.', margin, y, pageWidth - 2 * margin);
      }

      // Save PDF
      const fileName = `sozlesme_${agreement.id}_${fixTurkishChars(companyName || '').replace(/\s+/g, '_')}.pdf`;
      pdf.save(fileName);

      return true;
    } catch (error) {
      console.error('Error generating contract PDF:', error);
      return false;
    }
  };

  return {
    getCompanyName,
    getSiteName,
    getCompany,
    getCompanyCreditInfo,
    formatCurrency,
    dateRangesOverlap,
    generateBlockLabels,
    getCurrentDateRange,
    generateWeekOptions,
    updateSitePanelCount,
    calculateTotalWeeks,
    calculateTotalWeeksFromRanges,
    calculateTotalAmount,
    isPanelAvailable,
    getPanelUsageInfo,
    generateAgreementPDF,
    generateContractPDF
  };
};

export default AgreementHelpers;