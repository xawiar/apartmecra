const AgreementUIHandlers = ({
  setShowModal, setCurrentAgreement,
  setShowAddForm, setFormData,
  setSelectedSites, setSitePanelCounts,
  setSelectedWeeks, setSiteBlockSelections,
  setSitePanelSelections,
  showAlertModal, updateSitePanelCount,
  companies, // Add companies prop for credit functionality
  sites, // Add sites prop for site selection functionality
  sitePanelCounts, // Add sitePanelCounts state
  siteBlockSelections, // Add siteBlockSelections state
  helpers, // Add helpers for panel availability check
  formData // Add formData for date range check
}) => {
  const handleAddAgreement = () => {
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
    setCurrentAgreement(null);
    setShowAddForm(true);
  };

  const handleEditAgreement = (agreement) => {
    // Geriye uyumluluk: Eğer dateRanges yoksa, startDate/endDate'den oluştur
    let dateRanges = agreement.dateRanges || [];
    if (dateRanges.length === 0 && agreement.startDate && agreement.endDate) {
      dateRanges = [{ startDate: agreement.startDate, endDate: agreement.endDate }];
    }
    if (dateRanges.length === 0) {
      dateRanges = [{ startDate: '', endDate: '' }];
    }
    
    setFormData({
      companyId: agreement.companyId || '',
      startDate: agreement.startDate || '',
      endDate: agreement.endDate || '',
      dateRanges: dateRanges,
      weeklyRatePerPanel: agreement.weeklyRatePerPanel || '',
      totalAmount: agreement.totalAmount || '',
      notes: agreement.notes || ''
    });
    // For editing, we would need to populate selectedSites and sitePanelCounts
    // This would require additional data structure in the agreement object
    setSelectedSites(agreement.siteIds || []);
    setSitePanelCounts(agreement.sitePanelCounts || {});
    setSiteBlockSelections(agreement.siteBlockSelections || {});
    setSitePanelSelections(agreement.sitePanelSelections || {});
    setCurrentAgreement(agreement);
    setShowAddForm(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentAgreement(null);
  };

  const handleCloseAddForm = () => {
    setShowAddForm(false);
    setCurrentAgreement(null);
    setSelectedSites([]);
    setSitePanelCounts({});
    setSelectedWeeks([]);
    setSiteBlockSelections({});
    setSitePanelSelections({});
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: value
      };

      // Kullanıcı toplam tutarı girerse, panel sayısı ve hafta sayısına göre
      // haftalık panel ücretini otomatik hesapla
      if (name === 'totalAmount') {
        const totalAmount = parseFloat(value);
        const totalPanels = Object.values(sitePanelCounts || {}).reduce(
          (sum, count) => sum + (parseInt(count) || 0),
          0
        );
        // Birden fazla tarih aralığı için toplam hafta hesapla
        const totalWeeks = helpers.calculateTotalWeeksFromRanges(updated.dateRanges || []);

        if (totalAmount > 0 && totalPanels > 0 && totalWeeks > 0) {
          const weeklyRate = totalAmount / (totalPanels * totalWeeks);
          updated.weeklyRatePerPanel = weeklyRate.toFixed(2);
        }
      }

      return updated;
    });
  };

  const handleSiteSelection = (siteId, selectedSites, sitePanelSelections) => {
    if (selectedSites.includes(siteId)) {
      // Remove site from selection
      const newSelectedSites = selectedSites.filter(id => id !== siteId);
      setSelectedSites(newSelectedSites);
      
      // Remove panel count for this site
      const newSitePanelCounts = { ...sitePanelCounts };
      delete newSitePanelCounts[siteId];
      setSitePanelCounts(newSitePanelCounts);
      
      // Remove block and panel selections for this site
      const newBlockSelections = { ...siteBlockSelections };
      delete newBlockSelections[siteId];
      setSiteBlockSelections(newBlockSelections);
      
      const newPanelSelections = { ...sitePanelSelections };
      delete newPanelSelections[siteId];
      setSitePanelSelections(newPanelSelections);
    } else {
      // Add site to selection
      setSelectedSites([...selectedSites, siteId]);
      
      // Initialize panel count for this site
      setSitePanelCounts(prev => ({
        ...prev,
        [siteId]: 0
      }));
      
      // Initialize block and panel selections for this site
      setSiteBlockSelections(prev => ({ ...prev, [siteId]: [] }));
      setSitePanelSelections(prev => ({ ...prev, [siteId]: {} }));
      
      // İş merkezi için blok seçimi artık manuel (otomatik seçim kaldırıldı)
      // Kullanıcı blok seçmek zorunda, böylece panel seçimi de çalışır
    }
  };

  // Handle block selection for a site - Updated for new system
  const handleBlockSelection = (siteId, blockKey, siteBlockSelections, sitePanelSelections) => {
    const currentSelections = siteBlockSelections[siteId] || [];
    let newSelections;
    
    if (currentSelections.includes(blockKey)) {
      // Remove block
      newSelections = currentSelections.filter(key => key !== blockKey);
      
      // Remove panel selections for this block
      const newPanelSelections = { ...sitePanelSelections };
      if (newPanelSelections[siteId]) {
        delete newPanelSelections[siteId][blockKey];
        setSitePanelSelections(newPanelSelections);
      }
    } else {
      // Add block
      newSelections = [...currentSelections, blockKey];
      
      // Initialize panel selections for this block
      setSitePanelSelections(prev => {
        const updated = {
          ...prev,
          [siteId]: {
            ...prev[siteId],
            [blockKey]: []
          }
        };
        // Update total panel count for the site after state update
        setTimeout(() => updateSitePanelCount(siteId, updated, setSitePanelCounts), 0);
        return updated;
      });
    }
    
    setSiteBlockSelections(prev => ({ ...prev, [siteId]: newSelections }));
    
    // For removal case, update panel count immediately
    if (currentSelections.includes(blockKey)) {
      // Update total panel count for the site (with a slight delay to ensure state is updated)
      setTimeout(() => updateSitePanelCount(siteId, sitePanelSelections, setSitePanelCounts), 0);
    }
  };

  // Handle panel selection within a block - Updated for new system
  const handlePanelSelection = (siteId, blockKey, panelKey, sitePanelSelections) => {
    // Check if panel is available for the selected date range
    // const { startDate, endDate } = getCurrentDateRange();
    // if (!isPanelAvailable(siteId, blockId, panelId, startDate, endDate)) {
    //   // Show alert that panel is not available
    //   showAlertModal(
    //     'Panel Kullanımda',
    //     'Bu panel seçilen tarih aralığında başka bir anlaşmada kullanılmaktadır.',
    //     'warning'
    //   );
    //   return;
    // }
    
    const currentSelections = (sitePanelSelections[siteId] && sitePanelSelections[siteId][blockKey]) || [];
    let newSelections;
    
    if (currentSelections.includes(panelKey)) {
      // Remove panel
      newSelections = currentSelections.filter(key => key !== panelKey);
    } else {
      // Add panel
      newSelections = [...currentSelections, panelKey];
    }
    
    setSitePanelSelections(prev => {
      const updated = {
        ...prev,
        [siteId]: {
          ...prev[siteId],
          [blockKey]: newSelections
        }
      };
      // Update total panel count for the site after state update
      updateSitePanelCount(siteId, updated, setSitePanelCounts);
      return updated;
    });
  };

  // Handle panel selection for a specific date range (for multiple date ranges)
  const handlePanelSelectionForDateRange = (siteId, blockKey, panelKey, rangeIndex, sitePanelSelections) => {
    const rangeKey = `range-${rangeIndex}`;
    const currentSelections = (sitePanelSelections[siteId] && 
      sitePanelSelections[siteId][blockKey] && 
      sitePanelSelections[siteId][blockKey][rangeKey]) || [];
    
    let newSelections;
    if (currentSelections.includes(panelKey)) {
      // Remove panel
      newSelections = currentSelections.filter(key => key !== panelKey);
    } else {
      // Add panel
      newSelections = [...currentSelections, panelKey];
    }
    
    setSitePanelSelections(prev => {
      const updated = {
        ...prev,
        [siteId]: {
          ...prev[siteId],
          [blockKey]: {
            ...prev[siteId]?.[blockKey],
            [rangeKey]: newSelections
          }
        }
      };
      // Update total panel count for the site after state update
      updateSitePanelCount(siteId, updated, setSitePanelCounts);
      return updated;
    });
  };

  // Handle "Select Half" for a specific date range
  const handleSelectHalfForDateRange = (siteId, blockKey, rangeIndex, sitePanelSelections, totalPanels, dateRange) => {
    const site = sites.find(s => s.id === siteId);
    if (!site) return;

    const rangeKey = `range-${rangeIndex}`;
    const currentSelections = (sitePanelSelections[siteId] && 
      sitePanelSelections[siteId][blockKey] && 
      sitePanelSelections[siteId][blockKey][rangeKey]) || [];
    
    // Collect ALL panels (both available and unavailable) to check which ones are used
    const allPanels = [];
    const availablePanels = [];
    const unavailablePanels = [];
    
    for (let i = 1; i <= totalPanels; i++) {
      const panelKey = `panel-${i}`;
      const isAvailable = helpers && helpers.isPanelAvailable 
        ? helpers.isPanelAvailable(siteId, blockKey, panelKey, dateRange[0].startDate, dateRange[0].endDate, dateRange)
        : true;
      
      allPanels.push({ panelKey, panelNumber: i, isAvailable });
      
      if (isAvailable && !currentSelections.includes(panelKey)) {
        availablePanels.push({ panelKey, panelNumber: i });
      } else if (!isAvailable) {
        unavailablePanels.push({ panelKey, panelNumber: i });
      }
    }

    if (availablePanels.length === 0) {
      if (showAlertModal) {
        showAlertModal('Bilgi', 'Seçilebilecek müsait panel bulunmamaktadır.', 'info');
      }
      return;
    }

    // Separate odd and even panels from available panels
    const oddAvailablePanels = availablePanels.filter(p => p.panelNumber % 2 === 1);
    const evenAvailablePanels = availablePanels.filter(p => p.panelNumber % 2 === 0);
    
    // Check if odd panels are being used (unavailable)
    const oddUnavailablePanels = unavailablePanels.filter(p => p.panelNumber % 2 === 1);
    const oddPanelsAreUsed = oddUnavailablePanels.length > 0;

    // Calculate how many panels to select
    const targetCount = totalPanels > 0 ? Math.floor((totalPanels - 1) / 2) : 0;
    const alreadySelected = currentSelections.length;
    const needToSelect = Math.max(0, targetCount - alreadySelected);

    if (needToSelect === 0) {
      if (showAlertModal) {
        showAlertModal('Bilgi', 'Zaten yeterli sayıda panel seçilmiş.', 'info');
      }
      return;
    }

    let panelsToSelect = [];

    // Mantık:
    // 1. Eğer tek paneller kullanılmışsa (unavailable), çift panelleri seç
    // 2. Eğer tek paneller müsaitse, önce tek panelleri seç
    // 3. Eğer yeterli tek panel yoksa, çift panelleri ekle
    
    if (oddPanelsAreUsed && evenAvailablePanels.length > 0) {
      // Tek paneller kullanılmış, çift panelleri seç
      const evenToSelect = Math.min(needToSelect, evenAvailablePanels.length);
      panelsToSelect = evenAvailablePanels.slice(0, evenToSelect).map(p => p.panelKey);
    } else if (oddAvailablePanels.length > 0) {
      // Tek paneller müsait, önce tek panelleri seç
      const oddToSelect = Math.min(needToSelect, oddAvailablePanels.length);
      panelsToSelect = oddAvailablePanels.slice(0, oddToSelect).map(p => p.panelKey);
      
      // Eğer yeterli tek panel yoksa, çift panelleri ekle
      if (panelsToSelect.length < needToSelect && evenAvailablePanels.length > 0) {
        const remaining = needToSelect - panelsToSelect.length;
        const evenToSelect = Math.min(remaining, evenAvailablePanels.length);
        panelsToSelect = [...panelsToSelect, ...evenAvailablePanels.slice(0, evenToSelect).map(p => p.panelKey)];
      }
    } else if (evenAvailablePanels.length > 0) {
      // Sadece çift paneller müsait
      const evenToSelect = Math.min(needToSelect, evenAvailablePanels.length);
      panelsToSelect = evenAvailablePanels.slice(0, evenToSelect).map(p => p.panelKey);
    }

    if (panelsToSelect.length === 0) {
      if (showAlertModal) {
        showAlertModal('Bilgi', 'Seçilebilecek müsait panel bulunmamaktadır.', 'info');
      }
      return;
    }

    // Add selected panels to current selections
    const newSelections = [...currentSelections, ...panelsToSelect];

    setSitePanelSelections(prev => {
      const updated = {
        ...prev,
        [siteId]: {
          ...prev[siteId],
          [blockKey]: {
            ...prev[siteId]?.[blockKey],
            [rangeKey]: newSelections
          }
        }
      };
      // Update total panel count for the site after state update
      updateSitePanelCount(siteId, updated, setSitePanelCounts);
      return updated;
    });
  };

  // Handle week selection
  const handleWeekSelection = (weekId, selectedWeeks, setSelectedWeeks) => {
    let newSelectedWeeks;
    if (selectedWeeks.includes(weekId)) {
      newSelectedWeeks = selectedWeeks.filter(id => id !== weekId);
    } else {
      newSelectedWeeks = [...selectedWeeks, weekId];
    }
    
    setSelectedWeeks(newSelectedWeeks);
  };

  // Handle "Select Half" button - Select half of the panels (odd numbers first, then even if odd are full)
  const handleSelectHalf = (siteId, blockKey, sitePanelSelections, totalPanels) => {
    const site = sites.find(s => s.id === siteId);
    if (!site) return;

    const currentSelections = (sitePanelSelections[siteId] && sitePanelSelections[siteId][blockKey]) || [];
    
    // Collect ALL panels (both available and unavailable) to check which ones are used
    const allPanels = [];
    const availablePanels = [];
    const unavailablePanels = [];
    
    for (let i = 1; i <= totalPanels; i++) {
      const panelKey = `panel-${i}`;
      const isAvailable = helpers && helpers.isPanelAvailable 
        ? helpers.isPanelAvailable(siteId, blockKey, panelKey, formData.startDate, formData.endDate, formData.dateRanges)
        : true;
      
      allPanels.push({ panelKey, panelNumber: i, isAvailable });
      
      if (isAvailable && !currentSelections.includes(panelKey)) {
        availablePanels.push({ panelKey, panelNumber: i });
      } else if (!isAvailable) {
        unavailablePanels.push({ panelKey, panelNumber: i });
      }
    }

    if (availablePanels.length === 0) {
      if (showAlertModal) {
        showAlertModal('Bilgi', 'Seçilebilecek müsait panel bulunmamaktadır.', 'info');
      }
      return;
    }

    // Separate odd and even panels from available panels
    const oddAvailablePanels = availablePanels.filter(p => p.panelNumber % 2 === 1);
    const evenAvailablePanels = availablePanels.filter(p => p.panelNumber % 2 === 0);
    
    // Check if odd panels are being used (unavailable)
    const oddUnavailablePanels = unavailablePanels.filter(p => p.panelNumber % 2 === 1);
    const oddPanelsAreUsed = oddUnavailablePanels.length > 0;

    // Calculate how many panels to select
    // Özel mantık: 3 panel varsa 1, 5 panel varsa 2 seç
    // Formül: Math.floor((totalPanels - 1) / 2)
    // 3 -> Math.floor((3-1)/2) = 1, 5 -> Math.floor((5-1)/2) = 2
    const targetCount = totalPanels > 0 ? Math.floor((totalPanels - 1) / 2) : 0;
    const alreadySelected = currentSelections.length;
    const needToSelect = Math.max(0, targetCount - alreadySelected);

    if (needToSelect === 0) {
      if (showAlertModal) {
        showAlertModal('Bilgi', 'Zaten yeterli sayıda panel seçilmiş.', 'info');
      }
      return;
    }

    let panelsToSelect = [];

    // Mantık:
    // 1. Eğer tek paneller kullanılmışsa (unavailable), çift panelleri seç
    // 2. Eğer tek paneller müsaitse, önce tek panelleri seç
    // 3. Eğer yeterli tek panel yoksa, çift panelleri ekle
    
    if (oddPanelsAreUsed && evenAvailablePanels.length > 0) {
      // Tek paneller kullanılmış, çift panelleri seç
      const evenToSelect = Math.min(needToSelect, evenAvailablePanels.length);
      panelsToSelect = evenAvailablePanels.slice(0, evenToSelect).map(p => p.panelKey);
    } else if (oddAvailablePanels.length > 0) {
      // Tek paneller müsait, önce tek panelleri seç
      const oddToSelect = Math.min(needToSelect, oddAvailablePanels.length);
      panelsToSelect = oddAvailablePanels.slice(0, oddToSelect).map(p => p.panelKey);
      
      // Eğer yeterli tek panel yoksa, çift panelleri ekle
      if (panelsToSelect.length < needToSelect && evenAvailablePanels.length > 0) {
        const remaining = needToSelect - panelsToSelect.length;
        const evenToSelect = Math.min(remaining, evenAvailablePanels.length);
        panelsToSelect = [...panelsToSelect, ...evenAvailablePanels.slice(0, evenToSelect).map(p => p.panelKey)];
      }
    } else if (evenAvailablePanels.length > 0) {
      // Sadece çift paneller müsait
      const evenToSelect = Math.min(needToSelect, evenAvailablePanels.length);
      panelsToSelect = evenAvailablePanels.slice(0, evenToSelect).map(p => p.panelKey);
    }

    if (panelsToSelect.length === 0) {
      if (showAlertModal) {
        showAlertModal('Bilgi', 'Seçilebilecek müsait panel bulunmamaktadır.', 'info');
      }
      return;
    }

    // Add selected panels to current selections
    const newSelections = [...currentSelections, ...panelsToSelect];

    setSitePanelSelections(prev => {
      const updated = {
        ...prev,
        [siteId]: {
          ...prev[siteId],
          [blockKey]: newSelections
        }
      };
      // Update total panel count for the site after state update
      updateSitePanelCount(siteId, updated, setSitePanelCounts);
      return updated;
    });
  };

  // Handle "Select Half for All" button - Select half of panels for all selected sites and blocks
  const handleSelectHalfForAll = (selectedSites, sites, siteBlockSelections, sitePanelSelections) => {
    if (!selectedSites || selectedSites.length === 0) {
      if (showAlertModal) {
        showAlertModal('Bilgi', 'Lütfen önce en az bir site seçin.', 'info');
      }
      return;
    }

    let totalSelected = 0;
    let totalProcessed = 0;

    selectedSites.forEach(siteId => {
      const site = sites.find(s => s.id === siteId);
      if (!site) return;

      // Get selected blocks for this site
      const selectedBlocks = siteBlockSelections[siteId] || [];
      
      // If no blocks selected, use all blocks for business center or skip for regular sites
      const blocksToProcess = site.siteType === 'business_center' 
        ? [`${siteId}-block-A`]
        : selectedBlocks.filter(blockKey => blockKey && blockKey.startsWith(`${siteId}-block-`));

      if (blocksToProcess.length === 0) {
        if (showAlertModal) {
          showAlertModal('Bilgi', `${site.name} için lütfen en az bir blok seçin.`, 'info');
        }
        return;
      }

      blocksToProcess.forEach(blockKey => {
        const blockLabel = blockKey.split('-')[2];
        const totalPanels = site.siteType === 'business_center' 
          ? (parseInt(site.panels) || parseInt(site.manualPanels) || 0) 
          : (parseInt(site.elevatorsPerBlock) || 0) * 2;

        if (totalPanels === 0) return;

        const currentSelections = (sitePanelSelections[siteId] && sitePanelSelections[siteId][blockKey]) || [];
        
        // Collect ALL panels (both available and unavailable) to check which ones are used
        const allPanels = [];
        const availablePanels = [];
        const unavailablePanels = [];
        
        for (let i = 1; i <= totalPanels; i++) {
          const panelKey = `panel-${i}`;
          const isAvailable = helpers && helpers.isPanelAvailable 
            ? helpers.isPanelAvailable(siteId, blockKey, panelKey, formData.startDate, formData.endDate, formData.dateRanges)
            : true;
          
          allPanels.push({ panelKey, panelNumber: i, isAvailable });
          
          if (isAvailable && !currentSelections.includes(panelKey)) {
            availablePanels.push({ panelKey, panelNumber: i });
          } else if (!isAvailable) {
            unavailablePanels.push({ panelKey, panelNumber: i });
          }
        }

        if (availablePanels.length === 0) {
          totalProcessed++;
          return;
        }

        // Separate odd and even panels from available panels
        const oddAvailablePanels = availablePanels.filter(p => p.panelNumber % 2 === 1);
        const evenAvailablePanels = availablePanels.filter(p => p.panelNumber % 2 === 0);
        
        // Check if odd panels are being used (unavailable)
        const oddUnavailablePanels = unavailablePanels.filter(p => p.panelNumber % 2 === 1);
        const oddPanelsAreUsed = oddUnavailablePanels.length > 0;

        // Calculate how many panels to select
        // Özel mantık: 3 panel varsa 1, 5 panel varsa 2 seç
        // Formül: Math.floor((totalPanels - 1) / 2)
        const targetCount = totalPanels > 0 ? Math.floor((totalPanels - 1) / 2) : 0;
        const alreadySelected = currentSelections.length;
        const needToSelect = Math.max(0, targetCount - alreadySelected);

        if (needToSelect === 0) {
          totalProcessed++;
          return;
        }

        let panelsToSelect = [];

        // Mantık:
        // 1. Eğer tek paneller kullanılmışsa (unavailable), çift panelleri seç
        // 2. Eğer tek paneller müsaitse, önce tek panelleri seç
        // 3. Eğer yeterli tek panel yoksa, çift panelleri ekle
        
        if (oddPanelsAreUsed && evenAvailablePanels.length > 0) {
          // Tek paneller kullanılmış, çift panelleri seç
          const evenToSelect = Math.min(needToSelect, evenAvailablePanels.length);
          panelsToSelect = evenAvailablePanels.slice(0, evenToSelect).map(p => p.panelKey);
        } else if (oddAvailablePanels.length > 0) {
          // Tek paneller müsait, önce tek panelleri seç
          const oddToSelect = Math.min(needToSelect, oddAvailablePanels.length);
          panelsToSelect = oddAvailablePanels.slice(0, oddToSelect).map(p => p.panelKey);
          
          // Eğer yeterli tek panel yoksa, çift panelleri ekle
          if (panelsToSelect.length < needToSelect && evenAvailablePanels.length > 0) {
            const remaining = needToSelect - panelsToSelect.length;
            const evenToSelect = Math.min(remaining, evenAvailablePanels.length);
            panelsToSelect = [...panelsToSelect, ...evenAvailablePanels.slice(0, evenToSelect).map(p => p.panelKey)];
          }
        } else if (evenAvailablePanels.length > 0) {
          // Sadece çift paneller müsait
          const evenToSelect = Math.min(needToSelect, evenAvailablePanels.length);
          panelsToSelect = evenAvailablePanels.slice(0, evenToSelect).map(p => p.panelKey);
        }

        if (panelsToSelect.length > 0) {
          // Add selected panels to current selections
          const newSelections = [...currentSelections, ...panelsToSelect];

          setSitePanelSelections(prev => {
            const updated = {
              ...prev,
              [siteId]: {
                ...prev[siteId],
                [blockKey]: newSelections
              }
            };
            // Update total panel count for the site after state update
            updateSitePanelCount(siteId, updated, setSitePanelCounts);
            return updated;
          });

          totalSelected += panelsToSelect.length;
        }

        totalProcessed++;
      });
    });

    if (totalSelected > 0) {
      if (showAlertModal) {
        showAlertModal(
          'Başarılı',
          `${totalSelected} panel otomatik olarak seçildi.`,
          'success'
        );
      }
    } else if (totalProcessed > 0) {
      if (showAlertModal) {
        showAlertModal(
          'Bilgi',
          'Seçilebilecek müsait panel bulunamadı veya zaten yeterli sayıda panel seçilmiş.',
          'info'
        );
      }
    }
  };

  // Handle "Select All Blocks" button - Select all blocks for all selected sites
  const handleSelectAllBlocks = (selectedSites, sites, siteBlockSelections, sitePanelSelections) => {
    if (!selectedSites || selectedSites.length === 0) {
      if (showAlertModal) {
        showAlertModal('Bilgi', 'Lütfen önce en az bir site seçin.', 'info');
      }
      return;
    }

    let totalSelected = 0;
    const newBlockSelections = { ...siteBlockSelections };
    const newPanelSelections = { ...sitePanelSelections };

    selectedSites.forEach(siteId => {
      const site = sites.find(s => s.id === siteId);
      if (!site) return;

      // Get all blocks for this site
      const blockLabels = helpers.generateBlockLabels(site.blocks);
      const currentSelections = siteBlockSelections[siteId] || [];
      
      if (site.siteType === 'business_center') {
        // İş merkezi için tek blok (A)
        const blockKey = `${siteId}-block-A`;
        if (!currentSelections.includes(blockKey)) {
          if (!newBlockSelections[siteId]) {
            newBlockSelections[siteId] = [];
          }
          newBlockSelections[siteId].push(blockKey);
          totalSelected++;
          
          // Initialize panel selections for this block
          if (!newPanelSelections[siteId]) {
            newPanelSelections[siteId] = {};
          }
          newPanelSelections[siteId][blockKey] = [];
        }
      } else {
        // Normal site için tüm blokları seç
        blockLabels.forEach((label) => {
          const blockKey = `${siteId}-block-${label}`;
          if (!currentSelections.includes(blockKey)) {
            if (!newBlockSelections[siteId]) {
              newBlockSelections[siteId] = [];
            }
            newBlockSelections[siteId].push(blockKey);
            totalSelected++;
            
            // Initialize panel selections for this block
            if (!newPanelSelections[siteId]) {
              newPanelSelections[siteId] = {};
            }
            newPanelSelections[siteId][blockKey] = [];
          }
        });
      }
    });

    // Update block selections
    setSiteBlockSelections(newBlockSelections);

    // Update panel selections (all at once)
    setSitePanelSelections(newPanelSelections);

    // Update panel counts for all sites
    selectedSites.forEach(siteId => {
      setTimeout(() => {
        updateSitePanelCount(siteId, newPanelSelections, setSitePanelCounts);
      }, 0);
    });

    if (totalSelected > 0) {
      if (showAlertModal) {
        showAlertModal(
          'Başarılı',
          `${totalSelected} blok otomatik olarak seçildi.`,
          'success'
        );
      }
    } else {
      if (showAlertModal) {
        showAlertModal(
          'Bilgi',
          'Tüm bloklar zaten seçilmiş.',
          'info'
        );
      }
    }
  };

  // Handle adding a new date range
  const handleAddDateRange = () => {
    setFormData(prev => ({
      ...prev,
      dateRanges: [...(prev.dateRanges || []), { startDate: '', endDate: '' }]
    }));
  };

  // Handle removing a date range
  const handleRemoveDateRange = (index) => {
    setFormData(prev => {
      const newRanges = [...(prev.dateRanges || [])];
      if (newRanges.length > 1) {
        newRanges.splice(index, 1);
        return {
          ...prev,
          dateRanges: newRanges
        };
      }
      return prev; // En az bir tarih aralığı olmalı
    });
  };

  // Handle date range field change
  const handleDateRangeChange = (index, field, value) => {
    setFormData(prev => {
      const newRanges = [...(prev.dateRanges || [])];
      if (newRanges[index]) {
        newRanges[index] = {
          ...newRanges[index],
          [field]: value
        };
      }
      return {
        ...prev,
        dateRanges: newRanges
      };
    });
  };

  // Handle site selection for a specific date range
  const handleSiteSelectionForRange = (rangeIndex, siteId, sitePanelSelections) => {
    const rangeKey = `range-${rangeIndex}`;
    const currentSites = (sitePanelSelections && sitePanelSelections[rangeKey] && sitePanelSelections[rangeKey].sites) || [];
    
    let newSites;
    if (currentSites.includes(siteId)) {
      // Remove site
      newSites = currentSites.filter(id => id !== siteId);
    } else {
      // Add site
      newSites = [...currentSites, siteId];
    }
    
    setSitePanelSelections(prev => {
      const updated = {
        ...prev,
        [rangeKey]: {
          ...(prev[rangeKey] || {}),
          sites: newSites
        }
      };
      return updated;
    });
  };

  // Get selected sites for a specific date range
  const getSelectedSitesForRange = (rangeIndex, sitePanelSelections) => {
    if (!sitePanelSelections || typeof sitePanelSelections !== 'object') {
      return [];
    }
    const rangeKey = `range-${rangeIndex}`;
    if (sitePanelSelections[rangeKey] && sitePanelSelections[rangeKey].sites) {
      return Array.isArray(sitePanelSelections[rangeKey].sites) ? sitePanelSelections[rangeKey].sites : [];
    }
    return [];
  };

  // Handle select all sites for a date range
  const handleSelectAllSitesForRange = (rangeIndex, sites, sitePanelSelections) => {
    if (!sites || !Array.isArray(sites)) {
      console.warn('handleSelectAllSitesForRange: sites is not an array', sites);
      return;
    }
    const rangeKey = `range-${rangeIndex}`;
    const currentSites = (sitePanelSelections && sitePanelSelections[rangeKey] && sitePanelSelections[rangeKey].sites) || [];
    const allSiteIds = sites.map(s => s && s.id).filter(id => id != null);
    const allSelected = allSiteIds.length > 0 && allSiteIds.every(id => currentSites.includes(id));
    
    setSitePanelSelections(prev => {
      const updated = {
        ...prev,
        [rangeKey]: {
          ...(prev[rangeKey] || {}),
          sites: allSelected ? [] : allSiteIds
        }
      };
      return updated;
    });
  };

  // Handle select all sites in a neighborhood for a date range
  const handleSelectNeighborhoodForRange = (rangeIndex, neighborhood, neighborhoodSites, sitePanelSelections) => {
    const rangeKey = `range-${rangeIndex}`;
    const currentSites = (sitePanelSelections && sitePanelSelections[rangeKey] && sitePanelSelections[rangeKey].sites) || [];
    const neighborhoodSiteIds = (neighborhoodSites || []).map(s => s && s.id).filter(id => id != null);
    const allNeighborhoodSelected = neighborhoodSiteIds.length > 0 && 
      neighborhoodSiteIds.every(id => currentSites.includes(id));
    
    let newSites;
    if (allNeighborhoodSelected) {
      // Remove all neighborhood sites
      newSites = currentSites.filter(id => !neighborhoodSiteIds.includes(id));
    } else {
      // Add all neighborhood sites
      const toAdd = neighborhoodSiteIds.filter(id => !currentSites.includes(id));
      newSites = [...currentSites, ...toAdd];
    }
    
    setSitePanelSelections(prev => {
      const updated = {
        ...prev,
        [rangeKey]: {
          ...(prev[rangeKey] || {}),
          sites: newSites
        }
      };
      return updated;
    });
  };

  // Handle block selection for a specific date range
  const handleBlockSelectionForRange = (rangeIndex, siteId, blockKey, siteBlockSelections, sitePanelSelections) => {
    const rangeKey = `range-${rangeIndex}`;
    const currentBlocks = (siteBlockSelections && siteBlockSelections[rangeKey] && 
      siteBlockSelections[rangeKey][siteId]) || [];
    
    let newBlocks;
    if (currentBlocks.includes(blockKey)) {
      // Remove block
      newBlocks = currentBlocks.filter(key => key !== blockKey);
      
      // Remove panel selections for this block
      setSitePanelSelections(prev => {
        const updated = { ...prev };
        if (updated[siteId] && updated[siteId][blockKey]) {
          if (updated[siteId][blockKey][rangeKey]) {
            delete updated[siteId][blockKey][rangeKey];
          }
        }
        return updated;
      });
    } else {
      // Add block
      newBlocks = [...currentBlocks, blockKey];
      
      // Initialize panel selections for this block
      setSitePanelSelections(prev => {
        const updated = {
          ...prev,
          [siteId]: {
            ...(prev[siteId] || {}),
            [blockKey]: {
              ...(prev[siteId]?.[blockKey] || {}),
              [rangeKey]: []
            }
          }
        };
        setTimeout(() => updateSitePanelCount(siteId, updated, setSitePanelCounts), 0);
        return updated;
      });
    }
    
    setSiteBlockSelections(prev => {
      const updated = {
        ...prev,
        [rangeKey]: {
          ...(prev[rangeKey] || {}),
          [siteId]: newBlocks
        }
      };
      return updated;
    });
    
    // For removal case, update panel count immediately
    if (currentBlocks.includes(blockKey)) {
      setTimeout(() => updateSitePanelCount(siteId, sitePanelSelections, setSitePanelCounts), 0);
    }
  };

  // Get selected blocks for a specific date range and site
  const getSelectedBlocksForRange = (rangeIndex, siteId, siteBlockSelections) => {
    if (!siteBlockSelections || typeof siteBlockSelections !== 'object') {
      return [];
    }
    const rangeKey = `range-${rangeIndex}`;
    if (siteBlockSelections[rangeKey] && siteBlockSelections[rangeKey][siteId]) {
      return Array.isArray(siteBlockSelections[rangeKey][siteId]) ? siteBlockSelections[rangeKey][siteId] : [];
    }
    return [];
  };

  // Handle select all blocks for a site in a date range
  const handleSelectAllBlocksForRange = (rangeIndex, siteId, site, siteBlockSelections, sitePanelSelections) => {
    const rangeKey = `range-${rangeIndex}`;
    const blockLabels = site.siteType === 'business_center' 
      ? ['A'] 
      : (helpers.generateBlockLabels(site.blocks) || []);
    const currentBlocks = (siteBlockSelections && siteBlockSelections[rangeKey] && siteBlockSelections[rangeKey][siteId]) || [];
    
    const allBlockKeys = blockLabels.map(label => `${siteId}-block-${label}`);
    const allSelected = allBlockKeys.length > 0 && allBlockKeys.every(key => currentBlocks.includes(key));
    
    const newBlocks = allSelected ? [] : allBlockKeys;
    
    setSiteBlockSelections(prev => {
      const updated = {
        ...prev,
        [rangeKey]: {
          ...(prev[rangeKey] || {}),
          [siteId]: newBlocks
        }
      };
      return updated;
    });
    
    // Initialize panel selections for new blocks
    if (!allSelected) {
      setSitePanelSelections(prev => {
        const updated = { ...prev };
        allBlockKeys.forEach(blockKey => {
          if (!updated[siteId]) updated[siteId] = {};
          if (!updated[siteId][blockKey]) updated[siteId][blockKey] = {};
          if (!updated[siteId][blockKey][rangeKey]) {
            updated[siteId][blockKey][rangeKey] = [];
          }
        });
        return updated;
      });
    } else {
      // Remove panel selections for removed blocks
      setSitePanelSelections(prev => {
        const updated = { ...prev };
        if (updated[siteId]) {
          allBlockKeys.forEach(blockKey => {
            if (updated[siteId][blockKey] && updated[siteId][blockKey][rangeKey]) {
              delete updated[siteId][blockKey][rangeKey];
            }
          });
        }
        return updated;
      });
    }
  };

  // Handle select half for all blocks in a site for a date range
  const handleSelectHalfForAllInRange = (rangeIndex, siteId, site, siteBlockSelections, sitePanelSelections, dateRange) => {
    const rangeKey = `range-${rangeIndex}`;
    const selectedBlocks = (siteBlockSelections && siteBlockSelections[rangeKey] && siteBlockSelections[rangeKey][siteId]) || [];
    
    if (selectedBlocks.length === 0) {
      if (showAlertModal) {
        showAlertModal('Bilgi', 'Lütfen önce en az bir blok seçin.', 'info');
      }
      return;
    }
    
    let totalSelected = 0;
    
    selectedBlocks.forEach(blockKey => {
      const blockLabel = blockKey.split('-')[2];
      const totalPanels = site.siteType === 'business_center' 
        ? (parseInt(site.manualPanels) || parseInt(site.panels) || 0) 
        : (parseInt(site.elevatorsPerBlock) || 0) * 2;
      
      if (totalPanels === 0) return;
      
      const currentSelections = (sitePanelSelections[siteId] && 
        sitePanelSelections[siteId][blockKey] && 
        sitePanelSelections[siteId][blockKey][rangeKey]) || [];
      
      // Collect ALL panels (both available and unavailable) to check which ones are used
      const allPanels = [];
      const availablePanels = [];
      const unavailablePanels = [];
      
      for (let i = 1; i <= totalPanels; i++) {
        const panelKey = `panel-${i}`;
        const isAvailable = helpers && helpers.isPanelAvailable 
          ? helpers.isPanelAvailable(siteId, blockKey, panelKey, dateRange[0].startDate, dateRange[0].endDate, dateRange)
          : true;
        
        allPanels.push({ panelKey, panelNumber: i, isAvailable });
        
        if (isAvailable && !currentSelections.includes(panelKey)) {
          availablePanels.push({ panelKey, panelNumber: i });
        } else if (!isAvailable) {
          unavailablePanels.push({ panelKey, panelNumber: i });
        }
      }
      
      if (availablePanels.length === 0) return;
      
      // Separate odd and even panels from available panels
      const oddAvailablePanels = availablePanels.filter(p => p.panelNumber % 2 === 1);
      const evenAvailablePanels = availablePanels.filter(p => p.panelNumber % 2 === 0);
      
      // Check if odd panels are being used (unavailable)
      // Mantık: Eğer tek panellerin çoğu doluysa, çift panelleri seç
      const oddUnavailablePanels = unavailablePanels.filter(p => p.panelNumber % 2 === 1);
      const totalOddPanels = Math.ceil(totalPanels / 2); // Toplam tek panel sayısı (1,3,5...)
      
      const targetCount = totalPanels > 0 ? Math.floor((totalPanels - 1) / 2) : 0;
      const alreadySelected = currentSelections.length;
      const needToSelect = Math.max(0, targetCount - alreadySelected);
      
      if (needToSelect === 0) return;
      
      let panelsToSelect = [];
      
      // Mantık:
      // 1. Önce tek panelleri (1, 3, 5...) seçmeye çalış
      // 2. Eğer tek paneller doluysa (yeterli tek panel yoksa), çift panelleri (2, 4, 6...) seç
      
      // Önce tek panelleri seçmeyi dene
      if (oddAvailablePanels.length >= needToSelect) {
        // Yeterli tek panel var, sadece tek panelleri seç
        panelsToSelect = oddAvailablePanels.slice(0, needToSelect).map(p => p.panelKey);
      } else if (oddAvailablePanels.length > 0) {
        // Bazı tek paneller var ama yeterli değil
        // Eğer tek panellerin çoğu doluysa, çift panelleri seç
        // Aksi halde önce tek panelleri seç, sonra çift panelleri ekle
        if (oddUnavailablePanels.length > 0 && oddUnavailablePanels.length >= Math.ceil(totalOddPanels / 2)) {
          // Tek panellerin çoğu dolu, çift panelleri seç
          const evenToSelect = Math.min(needToSelect, evenAvailablePanels.length);
          panelsToSelect = evenAvailablePanels.slice(0, evenToSelect).map(p => p.panelKey);
        } else {
          // Önce tek panelleri seç, sonra çift panelleri ekle
          panelsToSelect = oddAvailablePanels.map(p => p.panelKey);
          const remaining = needToSelect - panelsToSelect.length;
          if (remaining > 0 && evenAvailablePanels.length > 0) {
            const evenToSelect = Math.min(remaining, evenAvailablePanels.length);
            panelsToSelect = [...panelsToSelect, ...evenAvailablePanels.slice(0, evenToSelect).map(p => p.panelKey)];
          }
        }
      } else if (evenAvailablePanels.length > 0) {
        // Hiç tek panel müsait değil, sadece çift panelleri seç
        const evenToSelect = Math.min(needToSelect, evenAvailablePanels.length);
        panelsToSelect = evenAvailablePanels.slice(0, evenToSelect).map(p => p.panelKey);
      }
      
      if (panelsToSelect.length > 0) {
        const newSelections = [...currentSelections, ...panelsToSelect];
        
        setSitePanelSelections(prev => {
          const updated = {
            ...prev,
            [siteId]: {
              ...(prev[siteId] || {}),
              [blockKey]: {
                ...(prev[siteId]?.[blockKey] || {}),
                [rangeKey]: newSelections
              }
            }
          };
          setTimeout(() => updateSitePanelCount(siteId, updated, setSitePanelCounts), 0);
          return updated;
        });
        
        totalSelected += panelsToSelect.length;
      }
    });
    
    if (totalSelected > 0 && showAlertModal) {
      showAlertModal('Başarılı', `${totalSelected} panel otomatik olarak seçildi.`, 'success');
    }
  };

  return {
    handleAddAgreement,
    handleEditAgreement,
    handleCloseModal,
    handleCloseAddForm,
    handleFormChange,
    handleSiteSelection,
    handleSiteSelectionForRange,
    getSelectedSitesForRange,
    handleSelectAllSitesForRange,
    handleSelectNeighborhoodForRange,
    handleBlockSelection,
    handleBlockSelectionForRange,
    getSelectedBlocksForRange,
    handleSelectAllBlocksForRange,
    handleSelectHalfForAllInRange,
    handlePanelSelection,
    handlePanelSelectionForDateRange,
    handleWeekSelection,
    handleSelectHalf,
    handleSelectHalfForDateRange,
    handleSelectHalfForAll,
    handleSelectAllBlocks,
    handleAddDateRange,
    handleRemoveDateRange,
    handleDateRangeChange
  };
};

export default AgreementUIHandlers;