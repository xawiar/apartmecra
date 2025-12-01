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
      weeklyRatePerPanel: '',
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
    setFormData({
      companyId: agreement.companyId || '',
      startDate: agreement.startDate || '',
      endDate: agreement.endDate || '',
      weeklyRatePerPanel: agreement.weeklyRatePerPanel || '',
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
      
      // İş merkezi için otomatik blok seçimi
      const site = sites.find(s => s.id === siteId);
      if (site && site.siteType === 'business_center') {
        const blockKey = `${siteId}-block-A`;
        setSiteBlockSelections(prev => ({ ...prev, [siteId]: [blockKey] }));
        setSitePanelSelections(prev => ({
          ...prev,
          [siteId]: {
            [blockKey]: []
          }
        }));
      }
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
    const availablePanels = [];
    
    // Collect all available panels with their numbers
    for (let i = 1; i <= totalPanels; i++) {
      const panelKey = `panel-${i}`;
      const isAvailable = helpers && helpers.isPanelAvailable 
        ? helpers.isPanelAvailable(siteId, blockKey, panelKey, formData.startDate, formData.endDate)
        : true;
      
      if (isAvailable && !currentSelections.includes(panelKey)) {
        availablePanels.push({ panelKey, panelNumber: i });
      }
    }

    if (availablePanels.length === 0) {
      if (showAlertModal) {
        showAlertModal('Bilgi', 'Seçilebilecek müsait panel bulunmamaktadır.', 'info');
      }
      return;
    }

    // Separate odd and even panels
    const oddPanels = availablePanels.filter(p => p.panelNumber % 2 === 1);
    const evenPanels = availablePanels.filter(p => p.panelNumber % 2 === 0);

    // Calculate how many panels to select (half of total, rounded up)
    const targetCount = Math.ceil(totalPanels / 2);
    const alreadySelected = currentSelections.length;
    const needToSelect = Math.max(0, targetCount - alreadySelected);

    if (needToSelect === 0) {
      if (showAlertModal) {
        showAlertModal('Bilgi', 'Zaten yeterli sayıda panel seçilmiş.', 'info');
      }
      return;
    }

    let panelsToSelect = [];

    // First, try to select odd panels
    if (oddPanels.length > 0) {
      const oddToSelect = Math.min(needToSelect, oddPanels.length);
      panelsToSelect = oddPanels.slice(0, oddToSelect).map(p => p.panelKey);
    }

    // If we need more panels and odd panels are not enough, add even panels
    if (panelsToSelect.length < needToSelect && evenPanels.length > 0) {
      const remaining = needToSelect - panelsToSelect.length;
      const evenToSelect = Math.min(remaining, evenPanels.length);
      panelsToSelect = [...panelsToSelect, ...evenPanels.slice(0, evenToSelect).map(p => p.panelKey)];
    }

    // If odd panels are all full, use even panels
    if (panelsToSelect.length === 0 && evenPanels.length > 0) {
      const evenToSelect = Math.min(needToSelect, evenPanels.length);
      panelsToSelect = evenPanels.slice(0, evenToSelect).map(p => p.panelKey);
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
          ? (parseInt(site.panels) || 0) 
          : (parseInt(site.elevatorsPerBlock) || 0) * 2;

        if (totalPanels === 0) return;

        const currentSelections = (sitePanelSelections[siteId] && sitePanelSelections[siteId][blockKey]) || [];
        const availablePanels = [];
        
        // Collect all available panels with their numbers
        for (let i = 1; i <= totalPanels; i++) {
          const panelKey = `panel-${i}`;
          const isAvailable = helpers && helpers.isPanelAvailable 
            ? helpers.isPanelAvailable(siteId, blockKey, panelKey, formData.startDate, formData.endDate)
            : true;
          
          if (isAvailable && !currentSelections.includes(panelKey)) {
            availablePanels.push({ panelKey, panelNumber: i });
          }
        }

        if (availablePanels.length === 0) {
          totalProcessed++;
          return;
        }

        // Separate odd and even panels
        const oddPanels = availablePanels.filter(p => p.panelNumber % 2 === 1);
        const evenPanels = availablePanels.filter(p => p.panelNumber % 2 === 0);

        // Calculate how many panels to select (half of total, rounded up)
        const targetCount = Math.ceil(totalPanels / 2);
        const alreadySelected = currentSelections.length;
        const needToSelect = Math.max(0, targetCount - alreadySelected);

        if (needToSelect === 0) {
          totalProcessed++;
          return;
        }

        let panelsToSelect = [];

        // First, try to select odd panels
        if (oddPanels.length > 0) {
          const oddToSelect = Math.min(needToSelect, oddPanels.length);
          panelsToSelect = oddPanels.slice(0, oddToSelect).map(p => p.panelKey);
        }

        // If we need more panels and odd panels are not enough, add even panels
        if (panelsToSelect.length < needToSelect && evenPanels.length > 0) {
          const remaining = needToSelect - panelsToSelect.length;
          const evenToSelect = Math.min(remaining, evenPanels.length);
          panelsToSelect = [...panelsToSelect, ...evenPanels.slice(0, evenToSelect).map(p => p.panelKey)];
        }

        // If odd panels are all full, use even panels
        if (panelsToSelect.length === 0 && evenPanels.length > 0) {
          const evenToSelect = Math.min(needToSelect, evenPanels.length);
          panelsToSelect = evenPanels.slice(0, evenToSelect).map(p => p.panelKey);
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

  return {
    handleAddAgreement,
    handleEditAgreement,
    handleCloseModal,
    handleCloseAddForm,
    handleFormChange,
    handleSiteSelection,
    handleBlockSelection,
    handlePanelSelection,
    handleWeekSelection,
    handleSelectHalf,
    handleSelectHalfForAll,
    handleSelectAllBlocks
  };
};

export default AgreementUIHandlers;