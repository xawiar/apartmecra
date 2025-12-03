import React, { useState, useEffect } from 'react';
import { getSites, getAgreements, getCompanies } from '../services/api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const CurrentStatus = () => {
  const [sites, setSites] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filteredMode, setFilteredMode] = useState(false);



  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sitesData, agreementsData, companiesData] = await Promise.all([
          getSites(),
          getAgreements(),
          getCompanies()
        ]);
        
        setSites(sitesData);
        setAgreements(agreementsData);
        setCompanies(companiesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get company name by ID
  const getCompanyName = (companyId) => {
    const company = companies.find(c => String(c.id) === String(companyId));
    return company ? company.name : 'Unknown';
  };

  // Generate block labels (A, B, C, etc.)
  const generateBlockLabels = (blockCount) => {
    const labels = [];
    for (let i = 0; i < blockCount; i++) {
      labels.push(String.fromCharCode(65 + i)); // A, B, C, etc.
    }
    return labels;
  };

  // Check if two date ranges overlap
  const dateRangesOverlap = (start1, end1, start2, end2) => {
    return start1 <= end2 && start2 <= end1;
  };

  // Get agreements for a specific site based on date filter
  const getFilteredAgreementsForSite = (siteId) => {
    let siteAgreements = agreements.filter(agreement => 
      agreement.siteIds && agreement.siteIds.includes(siteId)
    );

    // If date filter is active, filter by date range
    if (filteredMode && startDate && endDate) {
      const filterStart = new Date(startDate);
      const filterEnd = new Date(endDate);
      
      siteAgreements = siteAgreements.filter(agreement => {
        const agreementStart = new Date(agreement.startDate);
        const agreementEnd = new Date(agreement.endDate);
        return dateRangesOverlap(filterStart, filterEnd, agreementStart, agreementEnd);
      });
    } else {
      // If no date filter, only show active agreements
      siteAgreements = siteAgreements.filter(agreement => agreement.status === 'active');
    }

    return siteAgreements;
  };

  // Check if a panel is being used and get agreement info
  const getPanelInfo = (siteId, blockLabel, panelId) => {
    const relevantAgreements = getFilteredAgreementsForSite(siteId);
    
    // Create the block ID in the format used by the site dashboard: siteId-block-A, siteId-block-B, etc.
    const blockId = `${siteId}-block-${blockLabel}`;
    
    for (const agreement of relevantAgreements) {
      // Check if this agreement has block and panel selections for this site
      if (agreement.sitePanelSelections && agreement.sitePanelSelections[siteId]) {
        // Check if this block is selected for this site in this agreement
        if (agreement.sitePanelSelections[siteId][blockId]) {
          // Check if this panel is selected in this block for this site in this agreement
          if (agreement.sitePanelSelections[siteId][blockId].includes(panelId)) {
            return {
              isUsed: true,
              companyName: getCompanyName(agreement.companyId),
              startDate: agreement.startDate,
              endDate: agreement.endDate,
              agreementId: agreement.id,
              status: agreement.status,
              photoUrl: agreement.photoUrl
            };
          }
        }
      }
    }
    
    return { isUsed: false };
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  // Calculate statistics
  const calculateStats = () => {
    const totalSites = sites.length;
    const totalBlocks = sites.reduce((sum, site) => sum + (parseInt(site.blocks) || 0), 0);
    const totalPanels = sites.reduce((sum, site) => sum + (parseInt(site.panels) || 0), 0);
    
    let usedPanels = 0;
    sites.forEach(site => {
      const isBusinessCenter = site.siteType === 'business_center';
      const blockCount = isBusinessCenter ? 1 : (parseInt(site.blocks) || 0);
      const elevatorsPerBlock = isBusinessCenter ? 0 : (parseInt(site.elevatorsPerBlock) || 0);
      const panelsPerBlock = isBusinessCenter
        ? (parseInt(site.panels) || 0)
        : (elevatorsPerBlock * 2);
      const blockLabels = isBusinessCenter ? ['A'] : generateBlockLabels(blockCount);
      
      for (let blockIndex = 0; blockIndex < blockCount; blockIndex++) {
        const blockLabel = blockLabels[blockIndex];
        for (let panelIndex = 0; panelIndex < panelsPerBlock; panelIndex++) {
          const panelId = `panel-${panelIndex + 1}`; // Panel IDs are 1-based
          const panelInfo = getPanelInfo(site.id, blockLabel, panelId);
          if (panelInfo.isUsed) {
            usedPanels++;
          }
        }
      }
    });

    return { totalSites, totalBlocks, totalPanels, usedPanels };
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <div className="loading-spinner mx-auto"></div>
          <p className="mt-3 text-muted">Loading current status...</p>
        </div>
      </div>
    );
  }

  const stats = calculateStats();

  // Handle date filter application
  const handleApplyFilter = () => {
    if (startDate && endDate) {
      setFilteredMode(true);
    } else {
      alert('Lütfen başlangıç ve bitiş tarihlerini seçiniz.');
    }
  };

  // Handle filter reset
  const handleResetFilter = () => {
    setStartDate('');
    setEndDate('');
    setFilteredMode(false);
  };

  // Handle PDF export
  const handleExportPDF = async () => {
    if (!filteredMode || !startDate || !endDate) {
      alert('PDF çıktısı alabilmek için önce tarih aralığı seçiniz.');
      return;
    }

    try {
      // Show loading indicator
      const loadingAlert = document.createElement('div');
      loadingAlert.innerHTML = `
        <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 9999; text-align: center;">
          <div style="margin-bottom: 15px;">PDF oluşturuluyor...</div>
          <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
        </div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      `;
      document.body.appendChild(loadingAlert);

      // Create a comprehensive PDF content
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const usableWidth = pageWidth - (2 * margin);
      let yPosition = margin;

      // Add title and header - more compact
      pdf.setFillColor(0, 123, 255);
      pdf.rect(0, 0, pageWidth, 25, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PANEL DURUMU RAPORU', pageWidth / 2, 15, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${startDate} - ${endDate}`, pageWidth / 2, 22, { align: 'center' });
      
      yPosition = 35;
      pdf.setTextColor(0, 0, 0);

      // Add statistics in a compact table format
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ÖZET İSTATİSTİKLER', margin, yPosition);
      yPosition += 8;

      // Statistics table
      const statsData = [
        ['Toplam Site', stats.totalSites.toString()],
        ['Toplam Blok', stats.totalBlocks.toString()],
        ['Toplam Panel', stats.totalPanels.toString()],
        ['Kullanılan Panel', stats.usedPanels.toString()],
        ['Doluluk Oranı', `%${((stats.usedPanels / stats.totalPanels) * 100).toFixed(1)}`]
      ];

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      // Draw stats in two columns
      const colWidth = usableWidth / 2;
      for (let i = 0; i < statsData.length; i++) {
        const xPos = margin + (i % 2 === 0 ? 0 : colWidth);
        const currentY = yPosition + Math.floor(i / 2) * 6;
        
        pdf.setFont('helvetica', 'bold');
        pdf.text(statsData[i][0] + ':', xPos, currentY);
        pdf.setFont('helvetica', 'normal');
        pdf.text(statsData[i][1], xPos + 40, currentY);
      }
      
      yPosition += Math.ceil(statsData.length / 2) * 6 + 10;

      // Add legend in a compact format
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PANEL DURUMU:', margin, yPosition);
      yPosition += 6;

      // Legend items in a single row
      const legendItems = [
        { color: [0, 123, 255], text: 'Aktif', icon: '📺' },
        ...(filteredMode ? [{ color: [255, 193, 7], text: 'Pasif', icon: '📺' }] : []),
        { color: [248, 249, 250], text: 'Boş', icon: '📺' }
      ];

      let legendX = margin;
      pdf.setFontSize(9);
      
      legendItems.forEach((item, index) => {
        // Draw color box
        pdf.setFillColor(...item.color);
        pdf.rect(legendX, yPosition - 3, 6, 4, 'F');
        pdf.setDrawColor(0, 0, 0);
        pdf.rect(legendX, yPosition - 3, 6, 4);
        
        // Add text
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        pdf.text(`${item.icon} ${item.text}`, legendX + 8, yPosition);
        
        legendX += 35;
      });
      
      yPosition += 12;

      // Process each site in a more compact format
      for (const site of sites) {
        const isBusinessCenter = site.siteType === 'business_center';
        const blockCount = isBusinessCenter ? 1 : (parseInt(site.blocks) || 0);
        const elevatorsPerBlock = isBusinessCenter ? 0 : (parseInt(site.elevatorsPerBlock) || 0);
        const panelsPerBlock = isBusinessCenter
          ? (parseInt(site.panels) || 0)
          : (elevatorsPerBlock * 2);
        const blockLabels = isBusinessCenter ? ['A'] : generateBlockLabels(blockCount);

        // Check if we need a new page
        if (yPosition > pageHeight - 60) {
          pdf.addPage();
          yPosition = margin;
        }

        // Site header - more compact
        pdf.setFillColor(240, 240, 240);
        pdf.rect(margin, yPosition - 2, usableWidth, 8, 'F');
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text(site.name.toUpperCase(), margin + 2, yPosition + 3);
        
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`${blockCount} Blok • ${elevatorsPerBlock} Asansör/Blok • ${site.panels} Panel`, margin + 2, yPosition + 7);
        yPosition += 12;

        if (blockCount === 0) {
          pdf.setFontSize(9);
          pdf.text('Blok bilgisi tanımlanmamış', margin + 5, yPosition);
          yPosition += 8;
          continue;
        }

        // Process blocks in a more organized layout
        const blocksPerRow = Math.min(4, blockCount); // Max 4 blocks per row
        const blockRows = Math.ceil(blockCount / blocksPerRow);
        
        for (let rowIndex = 0; rowIndex < blockRows; rowIndex++) {
          const startBlockIndex = rowIndex * blocksPerRow;
          const endBlockIndex = Math.min(startBlockIndex + blocksPerRow, blockCount);
          
          // Check if we need a new page
          if (yPosition > pageHeight - 40) {
            pdf.addPage();
            yPosition = margin;
          }
          
          for (let blockIndex = startBlockIndex; blockIndex < endBlockIndex; blockIndex++) {
            const blockId = `block-${blockIndex}`;
            const blockLabel = blockLabels[blockIndex];
            const blockX = margin + ((blockIndex - startBlockIndex) * (usableWidth / blocksPerRow));
            const blockWidth = (usableWidth / blocksPerRow) - 5;
            
            // Block header
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'bold');
            pdf.text(`${blockLabel} BLOK`, blockX, yPosition);
            
            // Draw panels in a compact grid
            const panelsPerRowInBlock = Math.min(6, panelsPerBlock); // Max 6 panels per row in block
            const panelRows = Math.ceil(panelsPerBlock / panelsPerRowInBlock);
            const panelSize = Math.min(8, blockWidth / panelsPerRowInBlock - 1);
            
            let panelY = yPosition + 3;
            
            for (let panelRowIndex = 0; panelRowIndex < panelRows; panelRowIndex++) {
              const panelStartIndex = panelRowIndex * panelsPerRowInBlock;
              const panelEndIndex = Math.min(panelStartIndex + panelsPerRowInBlock, panelsPerBlock);
              
              for (let panelIndex = panelStartIndex; panelIndex < panelEndIndex; panelIndex++) {
                const panelId = `panel-${panelIndex}`;
                const panelNumber = panelIndex + 1;
                const panelInfo = getPanelInfo(site.id, blockId, panelId);
                
                const panelX = blockX + ((panelIndex - panelStartIndex) * (panelSize + 1));
                
                // Set panel color
                if (panelInfo.isUsed) {
                  if (filteredMode && panelInfo.status !== 'active') {
                    pdf.setFillColor(255, 193, 7); // Yellow
                  } else {
                    pdf.setFillColor(0, 123, 255); // Blue
                  }
                } else {
                  pdf.setFillColor(248, 249, 250); // Light gray
                }
                
                // Draw panel
                pdf.rect(panelX, panelY, panelSize, panelSize, 'F');
                pdf.setDrawColor(0, 0, 0);
                pdf.rect(panelX, panelY, panelSize, panelSize);
                
                // Add panel number
                pdf.setFontSize(6);
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(panelInfo.isUsed ? 255 : 0, panelInfo.isUsed ? 255 : 0, panelInfo.isUsed ? 255 : 0);
                pdf.text(panelNumber.toString(), panelX + panelSize/2, panelY + panelSize/2 + 1, { align: 'center' });
                
                pdf.setTextColor(0, 0, 0);
              }
              
              panelY += panelSize + 1;
            }
          }
          
          yPosition += (Math.ceil(panelsPerBlock / Math.min(6, panelsPerBlock)) * 9) + 8;
        }
        
        yPosition += 5; // Space between sites
      }

      // Add footer with page numbers
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(128, 128, 128);
        const footerText = `Sayfa ${i}/${totalPages} • Oluşturulma: ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
        pdf.text(footerText, pageWidth / 2, pageHeight - 5, { align: 'center' });
      }

      // Clean up loading indicator
      document.body.removeChild(loadingAlert);

      // Save PDF
      const fileName = `guncel-durum-${startDate}-${endDate}.pdf`;
      pdf.save(fileName);

      // Show success message
      if (window.showAlert) {
        await window.showAlert(
          'Başarılı',
          'PDF raporu başarıyla oluşturuldu ve indirildi.',
          'success'
        );
      } else {
        alert('PDF raporu başarıyla oluşturuldu!');
      }
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      
      // Clean up any remaining elements
      const loadingAlert = document.querySelector('[style*="position: fixed"]');
      if (loadingAlert) {
        loadingAlert.remove();
      }
      
      if (window.showAlert) {
        await window.showAlert(
          'Hata',
          `PDF oluştururken bir hata oluştu: ${error.message}`,
          'error'
        );
      } else {
        alert('PDF oluştururken bir hata oluştu.');
      }
    }
  };



  return (
    <>

      <div className="container-fluid py-4">
      <div className="page-header mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <h2 className="h3 fw-bold mb-0">Güncel Durum</h2>
          <div className="d-flex gap-2">
            {filteredMode && startDate && endDate && (
              <button
                onClick={handleExportPDF}
                className="btn btn-page-primary btn-icon d-flex align-items-center"
              >
                <i className="bi bi-file-earmark-pdf me-1"></i>
                PDF Çıktısı
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Date Filter Section */}
      <div className="card custom-card shadow-sm mb-4">
        <div className="card-header bg-info-subtle">
          <h6 className="mb-0 fw-bold">
            <i className="bi bi-funnel me-2"></i>
            Tarih Filtresi
          </h6>
        </div>
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-3">
              <label htmlFor="startDate" className="form-label fw-bold">Başlangıç Tarihi</label>
              <input
                type="date"
                id="startDate"
                className="form-control"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label htmlFor="endDate" className="form-label fw-bold">Bitiş Tarihi</label>
              <input
                type="date"
                id="endDate"
                className="form-control"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
              />
            </div>
            <div className="col-md-3">
              <button
                onClick={handleApplyFilter}
                className="btn btn-primary me-2"
                disabled={!startDate || !endDate}
              >
                <i className="bi bi-search me-1"></i>
                Filtrele
              </button>
              <button
                onClick={handleResetFilter}
                className="btn btn-outline-secondary me-2"
              >
                <i className="bi bi-arrow-clockwise me-1"></i>
                Sıfırla
              </button>
              {filteredMode && startDate && endDate && (
                <button
                  onClick={handleExportPDF}
                  className="btn btn-danger"
                >
                  <i className="bi bi-file-earmark-pdf me-1"></i>
                  PDF
                </button>
              )}
            </div>
            <div className="col-md-3">
              {filteredMode && (
                <div className="alert alert-info mb-0 py-2">
                  <small>
                    <i className="bi bi-info-circle me-1"></i>
                    <strong>Filtre Aktif:</strong> {startDate} - {endDate}
                  </small>
                </div>
              )}
              {!filteredMode && (
                <div className="alert alert-success mb-0 py-2">
                  <small>
                    <i className="bi bi-check-circle me-1"></i>
                    <strong>Canlı Durum:</strong> Sadece aktif anlaşmalar görüntüleniyor
                  </small>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card custom-card bg-primary text-white">
            <div className="card-body text-center">
              <i className="bi bi-building fs-1 mb-2"></i>
              <h5 className="card-title">Toplam Site</h5>
              <h2 className="card-text">{stats.totalSites}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card custom-card bg-success text-white">
            <div className="card-body text-center">
              <i className="bi bi-grid-3x3-gap fs-1 mb-2"></i>
              <h5 className="card-title">Toplam Blok</h5>
              <h2 className="card-text">{stats.totalBlocks}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card custom-card bg-info text-white">
            <div className="card-body text-center">
              <i className="bi bi-grid fs-1 mb-2"></i>
              <h5 className="card-title">Toplam Panel</h5>
              <h2 className="card-text">{stats.totalPanels}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card custom-card bg-warning text-white">
            <div className="card-body text-center">
              <i className="bi bi-check-circle fs-1 mb-2"></i>
              <h5 className="card-title">Kullanılan Panel</h5>
              <h2 className="card-text">{stats.usedPanels}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Panel Status Legend */}
      <div className="card custom-card shadow-sm mb-4">
        <div className="card-header bg-secondary-subtle">
          <h6 className="mb-0 fw-bold">
            <i className="bi bi-palette me-2"></i>
            Panel Durum Açıklaması
          </h6>
        </div>
        <div className="card-body py-2">
          <div className="row g-3 align-items-center">
            <div className="col-auto">
              <div className="d-flex align-items-center">
                <div className="bg-primary text-white border rounded me-2" style={{width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold'}}>1</div>
                <small>Aktif Anlaşma</small>
              </div>
            </div>
            {filteredMode && (
              <div className="col-auto">
                <div className="d-flex align-items-center">
                  <div className="bg-warning text-dark border rounded me-2" style={{width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold'}}>2</div>
                  <small>Pasif Anlaşma (Tarih Aralığında)</small>
                </div>
              </div>
            )}
            <div className="col-auto">
              <div className="d-flex align-items-center">
                <div className="bg-light text-muted border rounded me-2" style={{width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold'}}>3</div>
                <small>Boş Panel</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sites Grid */}
      <div className="row g-4">
        {sites.map(site => {
          const isBusinessCenter = site.siteType === 'business_center';
          const blockCount = isBusinessCenter ? 1 : (parseInt(site.blocks) || 0);
          const elevatorsPerBlock = isBusinessCenter ? 0 : (parseInt(site.elevatorsPerBlock) || 0);
          const panelsPerBlock = isBusinessCenter
            ? (parseInt(site.panels) || 0)
            : (elevatorsPerBlock * 2);
          const blockLabels = isBusinessCenter ? ['A'] : generateBlockLabels(blockCount);

          return (
            <div key={site.id} className="col-12">
              <div className="card custom-card shadow-sm">
                <div className="card-header bg-primary-subtle">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 fw-bold">
                      <i className="bi bi-building me-2"></i>
                      {site.name}
                      {site.neighborhood && (
                        <small className="text-muted ms-2">({site.neighborhood})</small>
                      )}
                    </h5>
                    <div className="small text-muted">
                      <span className="badge bg-secondary me-2">
                        {blockCount} Blok
                      </span>
                      <span className="badge bg-secondary me-2">
                        {elevatorsPerBlock} Asansör/Blok
                      </span>
                      <span className="badge bg-secondary">
                        {site.panels} Panel
                      </span>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  {blockCount === 0 ? (
                    <div className="text-center py-4 text-muted">
                      <i className="bi bi-exclamation-triangle fs-1"></i>
                      <p className="mt-2 mb-0">Bu site için blok bilgisi tanımlanmamış</p>
                    </div>
                  ) : (
                    <div className="row g-3">
                      {blockLabels.map((blockLabel, blockIndex) => {
                        const blockId = `block-${blockIndex}`;
                        
                        return (
                          <div key={blockId} className="col-md-6 col-lg-4 col-xl-3">
                            <div className="card border-success h-100">
                            <div className="card-header bg-success-subtle text-center">
                                <h6 className="mb-0 fw-bold">
                                  <i className="bi bi-grid-3x3-gap me-1"></i>
                                  {blockLabel} Blok
                                </h6>
                              </div>
                              <div className="card-body p-2">
                                <div className="d-flex flex-wrap gap-1 justify-content-center">
                                  {Array.from({ length: panelsPerBlock }, (_, panelIndex) => {
                                    const panelId = `panel-${panelIndex + 1}`; // Panel IDs are 1-based
                                    const panelNumber = panelIndex + 1;
                                    const panelInfo = getPanelInfo(site.id, blockLabel, panelId);

                                    return (
                                      <div
                                        key={panelId}
                                        className={`panel-${site.id}-${blockId}-${panelId} position-relative d-flex align-items-center justify-content-center border rounded ${
                                          panelInfo.isUsed 
                                            ? (filteredMode && panelInfo.status !== 'active' 
                                                ? 'bg-warning text-dark' 
                                                : 'bg-primary text-white')
                                            : 'bg-light text-muted'
                                        }`}
                                        style={{
                                          width: '60px',
                                          height: '80px',
                                          fontSize: '10px',
                                          fontWeight: 'bold',
                                          flexDirection: 'column',
                                          padding: '2px',
                                          cursor: panelInfo.isUsed ? 'pointer' : 'default'
                                        }}
                                        title={
                                          panelInfo.isUsed 
                                            ? `Panel ${panelNumber} - ${panelInfo.companyName}${filteredMode ? ` (${panelInfo.startDate} - ${panelInfo.endDate})` : ` (Bitiş: ${panelInfo.endDate})`}${panelInfo.status ? ` [${panelInfo.status === 'active' ? 'Aktif' : 'Pasif'}]` : ''}`
                                            : `Panel ${panelNumber} - Boş`
                                        }
                                        data-panel-id={`${site.id}-${blockId}-${panelId}`}
                                        data-site-id={site.id}
                                        data-block-id={blockId}
                                        data-panel={panelId}
                                        onClick={() => {
                                          if (panelInfo.isUsed) {
                                            // Show comprehensive panel info with all requested details
                                            let content = `
                                              <div class="text-start">
                                                <div class="mb-3">
                                                  <strong>Reklam Veren Firma:</strong> ${panelInfo.companyName}
                                                </div>
                                                <div class="mb-3">
                                                  <strong>Anlaşma Süresi:</strong> ${formatDate(panelInfo.startDate)} - ${formatDate(panelInfo.endDate)}
                                                </div>
                                                <div class="mb-3">
                                                  <strong>Anlaşma ID:</strong> ${panelInfo.agreementId}
                                                </div>
                                            `;
                                            
                                            if (panelInfo.photoUrl) {
                                              content += `
                                                <div class="text-center mt-3">
                                                  <strong>Yayındaki Reklam Görseli:</strong>
                                                  <div class="mt-2">
                                                    <img src="${panelInfo.photoUrl}" style="max-width: 100%; max-height: 300px;" alt="Reklam Görseli" class="border rounded" />
                                                  </div>
                                                </div>
                                              `;
                                            } else {
                                              content += `
                                                <div class="text-center mt-3">
                                                  <strong>Yayındaki Reklam Görseli:</strong>
                                                  <div class="mt-2 text-muted">
                                                    <i class="bi bi-image fs-1"></i>
                                                    <p class="mb-0">Görsel eklenmemiş</p>
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
                                        <div style={{ fontSize: '12px' }}>{panelNumber}</div>
                                        {panelInfo.isUsed && (
                                          <>
                                            <div 
                                              style={{ 
                                                fontSize: '8px', 
                                                lineHeight: '1',
                                                textAlign: 'center',
                                                wordBreak: 'break-word',
                                                overflow: 'hidden',
                                                maxHeight: '24px'
                                              }}
                                              className="mt-1"
                                            >
                                              {panelInfo.companyName.length > 12 
                                                ? panelInfo.companyName.substring(0, 12) + '...' 
                                                : panelInfo.companyName}
                                            </div>
                                            <div 
                                              style={{ 
                                                fontSize: '7px', 
                                                lineHeight: '1',
                                                textAlign: 'center'
                                              }}
                                              className="mt-1"
                                            >
                                              {filteredMode ? `${panelInfo.startDate}` : panelInfo.endDate}
                                            </div>
                                            {filteredMode && (
                                              <div 
                                                style={{ 
                                                  fontSize: '6px', 
                                                  lineHeight: '1',
                                                  textAlign: 'center'
                                                }}
                                              >
                                                {panelInfo.endDate}
                                              </div>
                                            )}
                                          </>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                                <div className="text-center mt-2 small text-muted">
                                  {panelsPerBlock} Panel
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
        {sites.length === 0 && (
          <div className="col-12">
            <div className="text-center py-5">
              <div className="empty-state">
                <i className="bi bi-building"></i>
                <p className="mb-3">Henüz site bulunmamaktadır.</p>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </>
  );
};

export default CurrentStatus;