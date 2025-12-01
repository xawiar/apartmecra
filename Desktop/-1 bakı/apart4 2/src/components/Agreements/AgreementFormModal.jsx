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
          <div className="modal-body p-0">
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
              <div className="row g-0">
                {/* Left Column - Agreement Details */}
                <div className="col-lg-6 border-end">
                  <div className="p-4">
                    <div className="card border-0 shadow-sm mb-4">
                      <div className="card-header bg-light border-0 rounded-top">
                        <h6 className="mb-0 d-flex align-items-center text-primary">
                          <i className="bi bi-info-circle me-2"></i>
                          <span className="fw-semibold">Anlaşma Bilgileri</span>
                        </h6>
                      </div>
                      <div className="card-body">
                        <div className="mb-4">
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
                            {companies.map(company => (
                              <option key={company.id} value={company.id}>
                                {company.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="row">
                          <div className="col-md-6 mb-4">
                            <label htmlFor="startDate" className="form-label fw-medium mb-2">Başlangıç Tarihi <span className="text-danger">*</span></label>
                            <input
                              type="date"
                              id="startDate"
                              name="startDate"
                              value={formData.startDate}
                              onChange={uiHandlers.handleFormChange}
                              className="form-control agreement-form-control py-2"
                              required
                            />
                          </div>
                          
                          <div className="col-md-6 mb-4">
                            <label htmlFor="endDate" className="form-label fw-medium mb-2">Bitiş Tarihi <span className="text-danger">*</span></label>
                            <input
                              type="date"
                              id="endDate"
                              name="endDate"
                              value={formData.endDate}
                              onChange={uiHandlers.handleFormChange}
                              className="form-control agreement-form-control py-2"
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <label htmlFor="weeklyRatePerPanel" className="form-label fw-medium mb-2">Haftalık Panel Ücreti <span className="text-danger">*</span></label>
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
                    
                    {/* Site Selection */}
                    <div className="card border-0 shadow-sm">
                      <div className="card-header bg-light border-0 rounded-top">
                        <h6 className="mb-0 d-flex align-items-center text-primary">
                          <i className="bi bi-building me-2"></i>
                          <span className="fw-semibold">Site Seçimi</span>
                        </h6>
                      </div>
                      <div className="card-body">
                        <div className="mb-3">
                          <label className="form-label fw-medium mb-2">Siteler</label>
                          
                          {/* Group sites by neighborhood and separate business centers */}
                          {(() => {
                            // Separate sites and business centers
                            const regularSites = sites.filter(site => site.siteType !== 'business_center');
                            const businessCenters = sites.filter(site => site.siteType === 'business_center');
                            
                            // Group regular sites by neighborhood
                            const sitesByNeighborhood = regularSites.reduce((acc, site) => {
                              const neighborhood = site.neighborhood || 'Diğer';
                              if (!acc[neighborhood]) {
                                acc[neighborhood] = [];
                              }
                              acc[neighborhood].push(site);
                              return acc;
                            }, {});
                            
                            // Sort neighborhoods alphabetically
                            const sortedNeighborhoods = Object.keys(sitesByNeighborhood).sort();
                            
                            return (
                              <>
                                {/* Regular Sites Grouped by Neighborhood */}
                                {sortedNeighborhoods.map(neighborhood => (
                                  <div key={neighborhood} className="mb-4">
                                    <h6 className="text-primary mb-3 d-flex align-items-center">
                                      <i className="bi bi-geo-alt-fill me-2"></i>
                                      <span className="fw-bold">{neighborhood}</span>
                                      <span className="badge bg-primary ms-2">{sitesByNeighborhood[neighborhood].length}</span>
                                    </h6>
                                    <div className="row g-3">
                                      {sitesByNeighborhood[neighborhood].map(site => (
                                        <div key={site.id} className="col-md-6 col-sm-12">
                                          <div className="form-check-card h-100">
                                            <input
                                              type="checkbox"
                                              id={`site-${site.id}`}
                                              checked={selectedSites.includes(site.id)}
                                              onChange={() => uiHandlers.handleSiteSelection(site.id, selectedSites, sitePanelSelections)}
                                              className="form-check-input"
                                            />
                                            <label htmlFor={`site-${site.id}`} className="form-check-label h-100 d-flex align-items-center p-3">
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
                                      ))}
                                    </div>
                                  </div>
                                ))}
                                
                                {/* Business Centers - Separate Section at Bottom */}
                                {businessCenters.length > 0 && (
                                  <div className="mt-4 pt-4 border-top">
                                    <h6 className="text-warning mb-3 d-flex align-items-center">
                                      <i className="bi bi-briefcase-fill me-2"></i>
                                      <span className="fw-bold">İş Merkezleri</span>
                                      <span className="badge bg-warning text-dark ms-2">{businessCenters.length}</span>
                                    </h6>
                                    <div className="row g-3">
                                      {businessCenters.map(site => (
                                        <div key={site.id} className="col-md-6 col-sm-12">
                                          <div className="form-check-card h-100 border-warning">
                                            <input
                                              type="checkbox"
                                              id={`site-${site.id}`}
                                              checked={selectedSites.includes(site.id)}
                                              onChange={() => uiHandlers.handleSiteSelection(site.id, selectedSites, sitePanelSelections)}
                                              className="form-check-input"
                                            />
                                            <label htmlFor={`site-${site.id}`} className="form-check-label h-100 d-flex align-items-center p-3">
                                              <div className="me-3">
                                                <div className="bg-warning bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                  <i className="bi bi-briefcase text-warning"></i>
                                                </div>
                                              </div>
                                              <div className="flex-grow-1">
                                                <span className="fw-medium">{site.name}</span>
                                                <div className="small text-muted mt-1">
                                                  <i className="bi bi-grid me-1"></i>
                                                  {site.blocks} Blok, {site.panels} Panel
                                                  {site.neighborhood && (
                                                    <span className="ms-2">
                                                      <i className="bi bi-geo-alt me-1"></i>
                                                      {site.neighborhood}
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                            </label>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Right Column - Site Details */}
                <div className="col-lg-6">
                  <div className="p-4">
                    {/* Site Panel Selection - Redesigned for better UX */}
                    <div className="card border-0 shadow-sm mb-4">
                      <div className="card-header bg-light border-0 rounded-top">
                        <div className="d-flex justify-content-between align-items-center">
                          <h6 className="mb-0 d-flex align-items-center text-primary">
                            <i className="bi bi-grid me-2"></i>
                            <span className="fw-semibold">Panel Seçimi</span>
                          </h6>
                          {selectedSites.length > 0 && (
                            <div className="d-flex gap-2">
                              <button
                                type="button"
                                className="btn btn-success btn-sm fw-bold"
                                onClick={() => {
                                  uiHandlers.handleSelectAllBlocks(selectedSites, sites, siteBlockSelections, sitePanelSelections);
                                }}
                                title="Tüm seçili sitelerin tüm bloklarını otomatik seç"
                              >
                                <i className="bi bi-check-square me-1"></i>
                                Tüm Blokları Seç
                              </button>
                              <button
                                type="button"
                                className="btn btn-primary btn-sm fw-bold"
                                onClick={() => {
                                  uiHandlers.handleSelectHalfForAll(selectedSites, sites, siteBlockSelections, sitePanelSelections);
                                }}
                                title="Tüm seçili sitelerin tüm bloklarının panellerinin yarısını otomatik seç (tek sayılar önce, sonra çift sayılar)"
                              >
                                <i className="bi bi-check2-all me-1"></i>
                                Tümünün Yarısını Seç
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="card-body">
                        {selectedSites.length > 0 ? (
                          selectedSites.map(siteId => {
                            const site = sites.find(s => s.id === siteId);
                            const blockLabels = helpers.generateBlockLabels(site.blocks);
                            const selectedBlocks = siteBlockSelections[siteId] || [];
                            
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
                                      // İş merkezi için tek blok göster
                                      <div className="col-md-3 col-sm-4 col-6">
                                        <div className="card h-100 border-2 border-primary bg-primary bg-opacity-10">
                                          <div className="card-body p-2">
                                            <div className="form-check text-center">
                                              <input
                                                type="checkbox"
                                                id={`${siteId}-block-A`}
                                                checked={true}
                                                readOnly
                                                className="form-check-input"
                                              />
                                              <label htmlFor={`${siteId}-block-A`} className="form-check-label fw-bold">
                                                İş Merkezi
                                              </label>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      // Normal site için blok seçimi
                                      blockLabels.map((label, index) => {
                                        const blockKey = `${siteId}-block-${label}`; // Unique key for each block
                                        const isSelected = selectedBlocks.includes(blockKey);
                                        
                                        return (
                                          <div key={blockKey} className="col-md-3 col-sm-4 col-6">
                                            <div className={`card h-100 border-2 ${isSelected ? 'border-primary bg-primary bg-opacity-10' : 'border-light'}`}>
                                              <div className="card-body p-2">
                                                <div className="form-check text-center">
                                                  <input
                                                    type="checkbox"
                                                    id={blockKey}
                                                    checked={isSelected}
                                                    onChange={() => uiHandlers.handleBlockSelection(siteId, blockKey, siteBlockSelections, sitePanelSelections)}
                                                    className="form-check-input"
                                                  />
                                                  <label htmlFor={blockKey} className="form-check-label fw-bold">
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
                                  {(site.siteType === 'business_center' ? [`${siteId}-block-A`] : selectedBlocks
                                    .filter(blockKey => blockKey && blockKey.startsWith(`${siteId}-block-`)))
                                    .map(blockKey => {
                                      const blockLabel = blockKey.split('-')[2]; // Extract block label (A, B, C, etc.)
                                      const selectedPanels = (sitePanelSelections[siteId] && sitePanelSelections[siteId][blockKey]) || [];
                                      
                                      return (
                                        <div key={`${siteId}-${blockKey}-panels`} className="mt-3">
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
                                                  ? (parseInt(site.panels) || 0) 
                                                  : (parseInt(site.elevatorsPerBlock) || 0) * 2;
                                                uiHandlers.handleSelectHalf(siteId, blockKey, sitePanelSelections, totalPanels);
                                              }}
                                              title="Panellerin yarısını otomatik seç (tek sayılar önce, sonra çift sayılar)"
                                              style={{ minWidth: '120px' }}
                                            >
                                              <i className="bi bi-check2-square me-1"></i>
                                              Yarısını Seç
                                            </button>
                                          </div>
                                          <div className="row g-2">
                                            {Array.from({ length: site.siteType === 'business_center' ? (parseInt(site.panels) || 0) : (parseInt(site.elevatorsPerBlock) || 0) * 2 }, (_, i) => {
                                              const panelId = i + 1;
                                              const panelKey = `panel-${panelId}`;
                                              const isPanelSelected = selectedPanels.includes(panelKey);
                                              const panelName = generatePanelName(siteId, blockLabel, panelId);
                                              const isAvailable = helpers.isPanelAvailable(siteId, blockKey, panelKey, formData.startDate, formData.endDate);
                                              const usageInfo = !isAvailable ? helpers.getPanelUsageInfo(siteId, blockKey, panelKey, formData.startDate, formData.endDate) : null;
                                              
                                              return (
                                                <div key={panelKey} className="col-4 col-sm-3 col-md-2">
                                                  <div 
                                                    className={`card panel-card h-100 border-2 ${!isAvailable ? 'border-warning bg-warning bg-opacity-10' : isPanelSelected ? 'border-primary bg-primary bg-opacity-10' : 'border-light'}`} 
                                                    style={{ cursor: isAvailable ? 'pointer' : 'not-allowed', transition: 'all 0.2s', position: 'relative' }}
                                                    onClick={() => { if (isAvailable) uiHandlers.handlePanelSelection(siteId, blockKey, panelKey, sitePanelSelections); }}
                                                  >
                                                    <div className="card-body p-2 d-flex flex-column align-items-center">
                                                      <div className="form-check mb-1">
                                                        <input
                                                          type="checkbox"
                                                          id={`${siteId}-${blockKey}-${panelKey}`}
                                                          checked={isPanelSelected}
                                                          onChange={() => { if (isAvailable) uiHandlers.handlePanelSelection(siteId, blockKey, panelKey, sitePanelSelections); }}
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
                                
                                <div className="alert alert-info d-flex justify-content-between align-items-center mb-0 py-3 px-4 rounded-3">
                                  <div className="d-flex align-items-center">
                                    <i className="bi bi-grid-fill me-2"></i>
                                    <strong>Seçilen Panel Sayısı:</strong>
                                  </div>
                                  <span className="badge bg-primary rounded-pill fs-6 py-2 px-3">{sitePanelCounts[siteId] || 0}</span>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-5">
                            <div className="mb-3">
                              <div className="bg-light bg-opacity-50 rounded-circle d-flex align-items-center justify-content-center mx-auto" style={{ width: '60px', height: '60px' }}>
                                <i className="bi bi-building text-muted fs-1"></i>
                              </div>
                            </div>
                            <h6 className="text-muted mb-0">Lütfen önce bir site seçin</h6>
                            <p className="text-muted small mt-2">Anlaşma oluşturmak için en az bir site seçmelisiniz</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Summary */}
                    <AgreementSummary 
                      formData={formData}
                      sitePanelCounts={sitePanelCounts}
                      helpers={helpers}
                    />
                  </div>
                </div>
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
                    disabled={!formData.companyId || !formData.startDate || !formData.endDate || !formData.weeklyRatePerPanel || selectedSites.length === 0}
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