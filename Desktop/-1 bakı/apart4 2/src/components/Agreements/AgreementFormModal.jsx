import React from 'react';
import AgreementSummary from './AgreementSummary';

// Helper function to generate panel name
const generatePanelName = (siteId, blockLabel, panelNumber) => {
  return `${siteId}${blockLabel}${panelNumber}`;
};

const AgreementFormModal = ({ 
  showAddForm, 
  currentAgreement, 
  uiHandlers, 
  handlers, 
  helpers,
  formData, 
  setFormData,
  sites, 
  selectedSites, 
  sitePanelCounts,
  siteBlockSelections,
  sitePanelSelections,
  companies,
  agreements,
  setShowAddForm,
  setAgreements,
  setSelectedSites,
  setSitePanelCounts,
  setSelectedWeeks,
  setSiteBlockSelections,
  setSitePanelSelections
}) => {
  if (!showAddForm) return null;

  const dateRanges = formData.dateRanges || [{ startDate: '', endDate: '' }];

  // Group sites by neighborhood
  const regularSites = (sites || []).filter(site => site.siteType !== 'business_center');
  const businessCenters = (sites || []).filter(site => site.siteType === 'business_center');
  const sitesByNeighborhood = (regularSites || []).reduce((acc, site) => {
    const neighborhood = site.neighborhood || 'Diğer';
    if (!acc[neighborhood]) {
      acc[neighborhood] = [];
    }
    acc[neighborhood].push(site);
    return acc;
  }, {});
  const sortedNeighborhoods = Object.keys(sitesByNeighborhood || {}).sort();

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content agreement-modal-content">
          <div className="modal-header bg-primary text-white rounded-top">
            <h5 className="modal-title d-flex align-items-center">
              <i className="bi bi-file-earmark-text me-2"></i>
              <span className="fw-bold">{currentAgreement ? 'Anlaşma Düzenle' : 'Yeni Anlaşma'}</span>
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={uiHandlers.handleCloseAddForm}
            ></button>
          </div>
          <div className="modal-body p-0" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
            <form onSubmit={(e) => handlers.handleFormSubmit(
              e, 
              currentAgreement, 
              agreements, 
              setAgreements, 
              setShowAddForm, 
              setFormData, 
              setSelectedSites, 
              setSitePanelCounts, 
              setSelectedWeeks, 
              setSiteBlockSelections, 
              setSitePanelSelections,
              formData,
              selectedSites,
              sitePanelSelections,
              sitePanelCounts,
              helpers
            )}>
              <div className="p-4">
                {/* Step 1: Company Selection */}
                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-header bg-light border-0 rounded-top">
                    <h6 className="mb-0 d-flex align-items-center text-primary">
                      <span className="badge bg-primary me-2">1</span>
                      <i className="bi bi-building me-2"></i>
                      <span className="fw-semibold">Firma Seçimi</span>
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="mb-0">
                      <label htmlFor="companyId" className="form-label fw-medium mb-2">Firma <span className="text-danger">*</span></label>
                      <select
                        id="companyId"
                        name="companyId"
                        value={formData.companyId}
                        onChange={uiHandlers.handleFormChange}
                        className="form-select agreement-form-control py-2"
                        required
                      >
                        <option value="">Firma seçin</option>
                        {(companies || []).map(company => (
                          <option key={company.id} value={company.id}>
                            {company.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Step 2: Date Ranges */}
                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-header bg-light border-0 rounded-top">
                    <div className="d-flex justify-content-between align-items-center">
                      <h6 className="mb-0 d-flex align-items-center text-primary">
                        <span className="badge bg-primary me-2">2</span>
                        <i className="bi bi-calendar-range me-2"></i>
                        <span className="fw-semibold">Tarih Aralıkları</span>
                      </h6>
                      <button
                        type="button"
                        className="btn btn-sm btn-success"
                        onClick={uiHandlers.handleAddDateRange}
                        title="Yeni tarih aralığı ekle"
                      >
                        <i className="bi bi-plus-circle me-1"></i>
                        Tarih Aralığı Ekle
                      </button>
                    </div>
                  </div>
                  <div className="card-body">
                    <small className="text-muted d-block mb-3">
                      Birden fazla tarih aralığı ekleyebilirsiniz. Her tarih aralığı için ayrı site/blok/panel seçimi yapılacaktır.
                    </small>
                    
                    {dateRanges.map((range, index) => (
                      <div key={index} className="card border mb-3">
                        <div className="card-body p-3">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="badge bg-primary">Aralık {index + 1}</span>
                            {dateRanges.length > 1 && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => uiHandlers.handleRemoveDateRange(index)}
                                title="Bu tarih aralığını kaldır"
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            )}
                          </div>
                          <div className="row g-2">
                            <div className="col-md-6">
                              <label className="form-label small mb-1">Başlangıç Tarihi</label>
                              <input
                                type="date"
                                value={range.startDate || ''}
                                onChange={(e) => uiHandlers.handleDateRangeChange(index, 'startDate', e.target.value)}
                                className="form-control form-control-sm"
                                required
                              />
                            </div>
                            <div className="col-md-6">
                              <label className="form-label small mb-1">Bitiş Tarihi</label>
                              <input
                                type="date"
                                value={range.endDate || ''}
                                onChange={(e) => uiHandlers.handleDateRangeChange(index, 'endDate', e.target.value)}
                                className="form-control form-control-sm"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step 3: Site/Block/Panel Selection for Each Date Range */}
                {dateRanges.map((range, rangeIndex) => {
                  const rangeKey = `range-${rangeIndex}`;
                  const hasValidDates = range.startDate && range.endDate;
                  
                  return (
                    <div key={rangeIndex} className="card border-0 shadow-sm mb-4">
                      <div className="card-header bg-light border-0 rounded-top">
                        <h6 className="mb-0 d-flex align-items-center text-primary">
                          <span className="badge bg-primary me-2">3.{rangeIndex + 1}</span>
                          <i className="bi bi-grid me-2"></i>
                          <span className="fw-semibold">
                            Site/Blok/Panel Seçimi - Aralık {rangeIndex + 1}
                          </span>
                          {hasValidDates && (
                            <small className="text-muted ms-2">
                              ({new Date(range.startDate).toLocaleDateString('tr-TR')} - {new Date(range.endDate).toLocaleDateString('tr-TR')})
                            </small>
                          )}
                        </h6>
                      </div>
                      <div className="card-body">
                        {!hasValidDates ? (
                          <div className="alert alert-warning mb-0">
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            Lütfen önce bu tarih aralığı için başlangıç ve bitiş tarihlerini girin.
                          </div>
                        ) : (
                          <>
                            {/* Site Selection for this Date Range */}
                            <div className="mb-4">
                              <div className="d-flex justify-content-between align-items-center mb-3">
                                <label className="form-label fw-medium mb-0">Site Seçimi</label>
                                <div className="d-flex gap-2">
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-success"
                                    onClick={() => uiHandlers.handleSelectAllSitesForRange(rangeIndex, sites, sitePanelSelections)}
                                    title="Tüm siteleri seç"
                                  >
                                    <i className="bi bi-check-all me-1"></i>
                                    Tümünü Seç
                                  </button>
                                </div>
                              </div>

                              {/* Regular Sites Grouped by Neighborhood */}
                              {sortedNeighborhoods.map(neighborhood => {
                                const neighborhoodSites = sitesByNeighborhood[neighborhood] || [];
                                const selectedSitesInRange = uiHandlers.getSelectedSitesForRange(rangeIndex, sitePanelSelections) || [];
                                const allNeighborhoodSelected = neighborhoodSites.length > 0 && 
                                  neighborhoodSites.every(site => selectedSitesInRange.includes(site.id));
                                
                                return (
                                  <div key={neighborhood} className="mb-4">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                      <h6 className="text-primary mb-0 d-flex align-items-center">
                                        <i className="bi bi-geo-alt-fill me-2"></i>
                                        <span className="fw-bold">{neighborhood}</span>
                                        <span className="badge bg-primary ms-2">{neighborhoodSites.length}</span>
                                      </h6>
                                      <button
                                        type="button"
                                        className={`btn btn-sm ${allNeighborhoodSelected ? 'btn-outline-danger' : 'btn-outline-primary'}`}
                                        onClick={() => uiHandlers.handleSelectNeighborhoodForRange(rangeIndex, neighborhood, neighborhoodSites, sitePanelSelections)}
                                        title={allNeighborhoodSelected ? 'Mahalledeki tüm siteleri kaldır' : 'Mahalledeki tüm siteleri seç'}
                                      >
                                        <i className={`bi ${allNeighborhoodSelected ? 'bi-x-square' : 'bi-check-square'} me-1`}></i>
                                        {allNeighborhoodSelected ? 'Tümünü Kaldır' : 'Tümünü Seç'}
                                      </button>
                                    </div>
                                    <div className="row g-3">
                                      {neighborhoodSites.map(site => {
                                        const isSelected = selectedSitesInRange.includes(site.id);
                                        return (
                                          <div key={site.id} className="col-md-6 col-sm-12">
                                            <div className={`form-check-card h-100 ${isSelected ? 'border-primary' : ''}`}>
                                              <input
                                                type="checkbox"
                                                id={`site-${site.id}-range-${rangeIndex}`}
                                                checked={isSelected}
                                                onChange={() => uiHandlers.handleSiteSelectionForRange(rangeIndex, site.id, sitePanelSelections)}
                                                className="form-check-input"
                                              />
                                              <label htmlFor={`site-${site.id}-range-${rangeIndex}`} className="form-check-label h-100 d-flex align-items-center p-3">
                                                <div className="me-3">
                                                  <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                    <i className="bi bi-building text-primary"></i>
                                                  </div>
                                                </div>
                                                <div className="flex-grow-1">
                                                  <span className="fw-medium">{site.name}</span>
                                                  <div className="small text-muted mt-1">
                                                    <i className="bi bi-grid me-1"></i>
                                                    {site.blocks} Blok, {site.panels} Panel
                                                  </div>
                                                </div>
                                              </label>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}

                              {/* Business Centers */}
                              {businessCenters.length > 0 && (
                                <div className="mt-4 pt-4 border-top">
                                  <h6 className="text-warning mb-3 d-flex align-items-center">
                                    <i className="bi bi-briefcase-fill me-2"></i>
                                    <span className="fw-bold">İş Merkezleri</span>
                                    <span className="badge bg-warning text-dark ms-2">{businessCenters.length}</span>
                                  </h6>
                                  <div className="row g-3">
                                    {businessCenters.map(site => {
                                      const selectedSitesInRange = uiHandlers.getSelectedSitesForRange(rangeIndex, sitePanelSelections) || [];
                                      const isSelected = selectedSitesInRange.includes(site.id);
                                      return (
                                        <div key={site.id} className="col-md-6 col-sm-12">
                                          <div className={`form-check-card h-100 border-warning ${isSelected ? 'border-primary' : ''}`}>
                                            <input
                                              type="checkbox"
                                              id={`site-${site.id}-range-${rangeIndex}`}
                                              checked={isSelected}
                                              onChange={() => uiHandlers.handleSiteSelectionForRange(rangeIndex, site.id, sitePanelSelections)}
                                              className="form-check-input"
                                            />
                                            <label htmlFor={`site-${site.id}-range-${rangeIndex}`} className="form-check-label h-100 d-flex align-items-center p-3">
                                              <div className="me-3">
                                                <div className="bg-warning bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                  <i className="bi bi-briefcase text-warning"></i>
                                                </div>
                                              </div>
                                              <div className="flex-grow-1">
                                                <span className="fw-medium">{site.name}</span>
                                                <div className="small text-muted mt-1">
                                                  <i className="bi bi-grid me-1"></i>
                                                  {parseInt(site.manualPanels) || parseInt(site.panels) || 0} Panel
                                                </div>
                                              </div>
                                            </label>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Block and Panel Selection for Selected Sites in this Range */}
                            {(() => {
                              const selectedSitesInRange = uiHandlers.getSelectedSitesForRange(rangeIndex, sitePanelSelections) || [];
                              if (selectedSitesInRange.length === 0) {
                                return (
                                  <div className="alert alert-info mb-0">
                                    <i className="bi bi-info-circle me-2"></i>
                                    Bu tarih aralığı için site seçin.
                                  </div>
                                );
                              }

                              return selectedSitesInRange.map(siteId => {
                                const site = (sites || []).find(s => s.id === siteId);
                                if (!site) return null;
                                
                                const blockLabels = site.siteType === 'business_center' 
                                  ? ['A'] 
                                  : (helpers.generateBlockLabels(site.blocks) || []);
                                const selectedBlocks = uiHandlers.getSelectedBlocksForRange(rangeIndex, siteId, siteBlockSelections) || [];

                                return (
                                  <div key={siteId} className="mb-4 pb-3 border-bottom">
                                    <h6 className="mb-3 fw-bold text-primary">
                                      <i className="bi bi-geo-alt me-2"></i>
                                      {site.name}
                                    </h6>
                                    
                                    {/* Block Selection */}
                                    <div className="mb-4">
                                      <label className="form-label fw-medium mb-2">
                                        {site.siteType === 'business_center' ? 'İş Merkezi' : 'Bloklar'}
                                      </label>
                                      <div className="row g-2 mb-3">
                                        {site.siteType === 'business_center' ? (
                                          (() => {
                                            const blockKey = `${siteId}-block-A`;
                                            const isSelected = selectedBlocks.includes(blockKey);
                                            return (
                                              <div className="col-md-3 col-sm-4 col-6">
                                                <div className={`card h-100 border-2 ${isSelected ? 'border-primary bg-primary bg-opacity-10' : 'border-light'}`}>
                                                  <div className="card-body p-2">
                                                    <div className="form-check text-center">
                                                      <input
                                                        type="checkbox"
                                                        id={`${siteId}-block-A-range-${rangeIndex}`}
                                                        checked={isSelected}
                                                        onChange={() => uiHandlers.handleBlockSelectionForRange(rangeIndex, siteId, blockKey, siteBlockSelections, sitePanelSelections)}
                                                        className="form-check-input"
                                                      />
                                                      <label htmlFor={`${siteId}-block-A-range-${rangeIndex}`} className="form-check-label fw-bold">
                                                        İş Merkezi
                                                      </label>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })()
                                        ) : (
                                          (blockLabels || []).map((label) => {
                                            const blockKey = `${siteId}-block-${label}`;
                                            const isSelected = selectedBlocks.includes(blockKey);
                                            
                                            return (
                                              <div key={blockKey} className="col-md-3 col-sm-4 col-6">
                                                <div className={`card h-100 border-2 ${isSelected ? 'border-primary bg-primary bg-opacity-10' : 'border-light'}`}>
                                                  <div className="card-body p-2">
                                                    <div className="form-check text-center">
                                                      <input
                                                        type="checkbox"
                                                        id={`${blockKey}-range-${rangeIndex}`}
                                                        checked={isSelected}
                                                        onChange={() => uiHandlers.handleBlockSelectionForRange(rangeIndex, siteId, blockKey, siteBlockSelections, sitePanelSelections)}
                                                        className="form-check-input"
                                                      />
                                                      <label htmlFor={`${blockKey}-range-${rangeIndex}`} className="form-check-label fw-bold">
                                                        Blok {label}
                                                      </label>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })
                                        )}
                                      </div>
                                      
                                      {/* Panel Selection for Selected Blocks */}
                                      {(() => {
                                        if (site.siteType === 'business_center') {
                                          const blockKey = `${siteId}-block-A`;
                                          const isBlockSelected = selectedBlocks.includes(blockKey);
                                          if (!isBlockSelected) return null;
                                          return [blockKey];
                                        }
                                        return selectedBlocks.filter(blockKey => blockKey && blockKey.startsWith(`${siteId}-block-`));
                                      })().map(blockKey => {
                                        const blockLabel = blockKey.split('-')[2];
                                        const selectedPanels = (sitePanelSelections[siteId] && 
                                          sitePanelSelections[siteId][blockKey] && 
                                          sitePanelSelections[siteId][blockKey][rangeKey]) || [];
                                        
                                        return (
                                          <div key={`${siteId}-${blockKey}-panels-${rangeIndex}`} className="mt-3">
                                            <div className="d-flex justify-content-between align-items-center mb-3 p-2 bg-light rounded">
                                              <h6 className="mb-0 fw-semibold text-primary">
                                                <i className="bi bi-grid-3x3-gap me-2"></i>
                                                {site.siteType === 'business_center' ? 'İş Merkezi Panelleri' : `Blok ${blockLabel} Panelleri`}
                                              </h6>
                                              <button
                                                type="button"
                                                className="btn btn-primary btn-sm fw-bold"
                                                onClick={() => {
                                                  const totalPanels = site.siteType === 'business_center' 
                                                    ? (parseInt(site.manualPanels) || parseInt(site.panels) || 0) 
                                                    : (parseInt(site.elevatorsPerBlock) || 0) * 2;
                                                  uiHandlers.handleSelectHalfForDateRange(siteId, blockKey, rangeIndex, sitePanelSelections, totalPanels, [range]);
                                                }}
                                                title="Panellerin yarısını otomatik seç (tek sayılar önce, sonra çift sayılar)"
                                                style={{ minWidth: '120px' }}
                                              >
                                                <i className="bi bi-check2-square me-1"></i>
                                                Yarısını Seç
                                              </button>
                                            </div>
                                            <div className="row g-2">
                                              {Array.from({ length: site.siteType === 'business_center' ? (parseInt(site.manualPanels) || parseInt(site.panels) || 0) : (parseInt(site.elevatorsPerBlock) || 0) * 2 }, (_, i) => {
                                                const panelId = i + 1;
                                                const panelKey = `panel-${panelId}`;
                                                const isPanelSelected = selectedPanels.includes(panelKey);
                                                const panelName = generatePanelName(siteId, blockLabel, panelId);
                                                const isAvailable = helpers.isPanelAvailable(siteId, blockKey, panelKey, range.startDate, range.endDate, [range]);
                                                const usageInfo = !isAvailable ? helpers.getPanelUsageInfo(siteId, blockKey, panelKey, range.startDate, range.endDate) : null;
                                                
                                                return (
                                                  <div key={panelKey} className="col-4 col-sm-3 col-md-2">
                                                    <div 
                                                      className={`card panel-card h-100 border-2 ${!isAvailable ? 'border-warning bg-warning bg-opacity-10' : isPanelSelected ? 'border-primary bg-primary bg-opacity-10' : 'border-light'}`} 
                                                      style={{ cursor: isAvailable ? 'pointer' : 'not-allowed', transition: 'all 0.2s', position: 'relative' }}
                                                      onClick={() => { if (isAvailable) uiHandlers.handlePanelSelectionForDateRange(siteId, blockKey, panelKey, rangeIndex, sitePanelSelections); }}
                                                    >
                                                      <div className="card-body p-2 d-flex flex-column align-items-center">
                                                        <div className="form-check mb-1">
                                                          <input
                                                            type="checkbox"
                                                            id={`${siteId}-${blockKey}-${panelKey}-${rangeIndex}`}
                                                            checked={isPanelSelected}
                                                            onChange={() => { if (isAvailable) uiHandlers.handlePanelSelectionForDateRange(siteId, blockKey, panelKey, rangeIndex, sitePanelSelections); }}
                                                            className="form-check-input"
                                                            onClick={(e) => e.stopPropagation()}
                                                            disabled={!isAvailable}
                                                          />
                                                        </div>
                                                        <div className="text-center">
                                                          <div className="fw-bold text-truncate" style={{ fontSize: '10px', maxWidth: '80px' }}>{panelName}</div>
                                                          <div className="small text-muted mt-1" style={{ fontSize: '9px' }}>Panel {panelId}</div>
                                                          {!isAvailable && usageInfo && (
                                                            <div className="small text-muted mt-1" style={{ fontSize: '8px' }}>
                                                              <i className="bi bi-lock-fill me-1"></i>
                                                              {usageInfo.companyName}
                                                            </div>
                                                          )}
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Step 4: Financial Data */}
                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-header bg-light border-0 rounded-top">
                    <h6 className="mb-0 d-flex align-items-center text-primary">
                      <span className="badge bg-primary me-2">4</span>
                      <i className="bi bi-cash-stack me-2"></i>
                      <span className="fw-semibold">Mali Veriler</span>
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="mb-4">
                      <label htmlFor="weeklyRatePerPanel" className="form-label fw-medium mb-2">
                        Haftalık Panel Ücreti <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0">₺</span>
                        <input
                          type="number"
                          id="weeklyRatePerPanel"
                          name="weeklyRatePerPanel"
                          value={formData.weeklyRatePerPanel}
                          onChange={uiHandlers.handleFormChange}
                          className="form-control agreement-form-control border-start-0 py-2"
                          required
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                        />
                      </div>
                      <small className="text-muted">
                        1 panelin 1 haftalık ücreti. Alternatif olarak aşağıya toplam tutarı yazabilirsiniz.
                      </small>
                    </div>

                    <div className="mb-4">
                      <label htmlFor="totalAmount" className="form-label fw-medium mb-2">
                        Toplam Anlaşma Bedeli (İsteğe Bağlı)
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0">₺</span>
                        <input
                          type="number"
                          id="totalAmount"
                          name="totalAmount"
                          value={formData.totalAmount || ''}
                          onChange={uiHandlers.handleFormChange}
                          className="form-control agreement-form-control border-start-0 py-2"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                        />
                      </div>
                      <small className="text-muted">
                        Müşteriyle anlaşılan toplam tutarı buraya yazarsanız, seçilen panel sayısı ve hafta süresine göre
                        haftalık panel ücreti otomatik hesaplanır.
                      </small>
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="notes" className="form-label fw-medium mb-2">Notlar</label>
                      <textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={uiHandlers.handleFormChange}
                        className="form-control agreement-form-control py-2"
                        rows="3"
                        placeholder="Ek notlar..."
                      />
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <AgreementSummary 
                  formData={formData}
                  sitePanelCounts={sitePanelCounts}
                  helpers={helpers}
                />
              </div>
              
              <div className="modal-footer bg-light rounded-bottom p-4">
                <div className="d-flex justify-content-end w-100">
                  <button
                    type="button"
                    className="btn btn-agreement-outline px-4 py-2 me-3"
                    onClick={uiHandlers.handleCloseAddForm}
                  >
                    <i className="bi bi-x-lg me-1"></i>
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="btn btn-agreement-primary px-4 py-2"
                    disabled={
                      !formData.companyId || 
                      !formData.weeklyRatePerPanel || 
                      !formData.dateRanges || 
                      formData.dateRanges.length === 0 ||
                      formData.dateRanges.some(range => !range.startDate || !range.endDate)
                    }
                  >
                    <i className="bi bi-save me-1"></i>
                    {currentAgreement ? 'Güncelle' : 'Kaydet'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgreementFormModal;
