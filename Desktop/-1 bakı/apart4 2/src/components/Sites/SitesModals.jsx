import React, { useRef, useState } from 'react';
import useResponsive from '../../hooks/useResponsive';
import { isObserver } from '../../utils/auth';

const SitesModals = ({ 
  showModal, 
  currentSite, 
  uiHandlers, 
  helpers, 
  handlers,
  agreements,
  companies,
  transactions,
  showPaymentSelection,
  selectedSiteForPayment,
  showActiveAgreements,
  currentSiteForAgreements,
  showAllPendingPayments,
  allPendingPayments,
  setShowAllPendingPayments,
  setAllPendingPayments,
  processedPayments = [],
  setProcessedPayments
}) => {
  const modalContentRef = useRef(null);
  const { isMobile, isTablet } = useResponsive();

  // Site Detail Modal
  const SiteDetailModal = () => {
    const [activeTab, setActiveTab] = useState('info'); // 'info', 'payments', 'advanceHistory'
    
    if (!showModal || !currentSite) return null;
    
    // Get advance history transactions
    const advanceHistory = transactions.filter(t => 
      (t.source?.includes('Site Avans Ödemesi') && t.siteId && String(t.siteId) === String(currentSite.id)) ||
      (t.source?.includes(`Site Avans Ödemesi - ${currentSite.name}`)) ||
      (t.source?.includes('Site Ödemesi') && t.siteId && String(t.siteId) === String(currentSite.id) && t.advanceUsed > 0)
    ).sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Format currency helper (use helpers if available, otherwise use local function)
    const formatCurrency = helpers?.formatCurrency || ((amount) => {
      return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY'
      }).format(amount);
    });

    return (
      <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} onClick={(e) => {
        if (e.target === e.currentTarget) {
          uiHandlers.handleCloseModal();
        }
      }}>
        <div className={`modal-dialog ${isMobile ? 'modal-fullscreen' : isTablet ? 'modal-lg' : 'modal-xl'} modal-dialog-scrollable`} onClick={e => e.stopPropagation()}>
          <div className="modal-content sites-modal-content">
            <div className="modal-header bg-primary text-white rounded-top">
              <h5 className="modal-title d-flex align-items-center">
                <i className="bi bi-building me-2"></i>
                <span className="fw-bold">{currentSite.name} - Detay</span>
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={uiHandlers.handleCloseModal}
              ></button>
            </div>
            <div className="modal-body" ref={modalContentRef}>
              <div className="container-fluid">
                {/* Site Information Section - Responsive Grid */}
                <div className="row mb-4">
                  <div className="col-12">
                    <div className="detail-card">
                      <div className="detail-card-header bg-light">
                        <h6 className="mb-0 fw-bold">
                          <i className="bi bi-info-circle me-2"></i>
                          Site Bilgileri
                        </h6>
                      </div>
                      <div className="detail-card-body">
                        <div className="row">
                          <div className="col-md-6 mb-3">
                            <div className="d-flex align-items-center mb-2">
                              <i className="bi bi-building text-primary me-2"></i>
                              <strong>Site Adı:</strong>
                            </div>
                            <div className="ps-4">{currentSite.name}</div>
                          </div>
                          <div className="col-md-6 mb-3">
                            <div className="d-flex align-items-center mb-2">
                              <i className="bi bi-map text-primary me-2"></i>
                              <strong>Mahalle:</strong>
                            </div>
                            <div className="ps-4">{currentSite.neighborhood || '-'}</div>
                          </div>
                          <div className="col-md-6 mb-3">
                            <div className="d-flex align-items-center mb-2">
                              <i className="bi bi-person text-primary me-2"></i>
                              <strong>Yönetici:</strong>
                            </div>
                            <div className="ps-4">{currentSite.manager}</div>
                          </div>
                          <div className="col-md-6 mb-3">
                            <div className="d-flex align-items-center mb-2">
                              <i className="bi bi-telephone text-primary me-2"></i>
                              <strong>Telefon:</strong>
                            </div>
                            <div className="ps-4">{currentSite.phone}</div>
                          </div>
                          <div className="col-md-6 mb-3">
                            <div className="d-flex align-items-center mb-2">
                              <i className="bi bi-journal-text text-primary me-2"></i>
                              <strong>Notlar:</strong>
                            </div>
                            <div className="ps-4">{currentSite.notes || '-'}</div>
                          </div>
                          <div className="col-md-6 mb-3">
                            <div className="d-flex align-items-center mb-2">
                              <i className="bi bi-bank text-primary me-2"></i>
                              <strong>Banka Hesap Adı:</strong>
                            </div>
                            <div className="ps-4">{currentSite.bankAccountName || '-'}</div>
                          </div>
                          <div className="col-md-6 mb-3">
                            <div className="d-flex align-items-center mb-2">
                              <i className="bi bi-credit-card text-primary me-2"></i>
                              <strong>IBAN Numarası:</strong>
                            </div>
                            <div className="ps-4">{currentSite.iban || '-'}</div>
                          </div>
                          <div className="col-md-6 mb-3">
                            <div className="d-flex align-items-center mb-2">
                              <i className="bi bi-wallet text-primary me-2"></i>
                              <strong>Avans Bakiyesi:</strong>
                            </div>
                            <div className="ps-4">
                              <span className={`fw-bold ${(currentSite.advanceBalance || 0) > 0 ? 'text-success' : 'text-muted'}`}>
                                {new Intl.NumberFormat('tr-TR', {
                                  style: 'currency',
                                  currency: 'TRY'
                                }).format(currentSite.advanceBalance || 0)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Technical Information Section */}
                <div className="row mb-4">
                  <div className="col-12">
                    <div className="detail-card">
                      <div className="detail-card-header bg-light">
                        <h6 className="mb-0 fw-bold">
                          <i className="bi bi-gear me-2"></i>
                          Teknik Bilgiler
                        </h6>
                      </div>
                      <div className="detail-card-body">
                        <div className="row">
                          <div className="col-md-4 mb-3">
                            <div className="d-flex align-items-center mb-2">
                              <i className="bi bi-grid text-primary me-2"></i>
                              <strong>Blok Sayısı:</strong>
                            </div>
                            <div className="ps-4">{currentSite.blocks}</div>
                          </div>
                          <div className="col-md-4 mb-3">
                            <div className="d-flex align-items-center mb-2">
                              <i className="bi bi-chevron-double-down text-primary me-2"></i>
                              <strong>1 Bloktaki Asansör:</strong>
                            </div>
                            <div className="ps-4">{currentSite.elevatorsPerBlock || 0}</div>
                          </div>
                          <div className="col-md-4 mb-3">
                            <div className="d-flex align-items-center mb-2">
                              <i className="bi bi-calculator text-primary me-2"></i>
                              <strong>Toplam Asansör:</strong>
                            </div>
                            <div className="ps-4">
                              {currentSite.elevators}
                              <small className="text-muted d-block">
                                ({currentSite.blocks || 0} × {currentSite.elevatorsPerBlock || 0})
                              </small>
                            </div>
                          </div>
                          <div className="col-md-4 mb-3">
                            <div className="d-flex align-items-center mb-2">
                              <i className="bi bi-grid-3x3-gap text-primary me-2"></i>
                              <strong>Panel Sayısı:</strong>
                            </div>
                            <div className="ps-4">
                              {currentSite.siteType === 'business_center'
                                ? (parseInt(currentSite.manualPanels) || parseInt(currentSite.panels) || 0)
                                : (parseInt(currentSite.panels) || 0)
                              }
                              <small className="text-muted d-block">
                                {currentSite.siteType === 'business_center'
                                  ? 'Manuel girilen panel sayısı'
                                  : `(${currentSite.elevators || 0} × 2)`
                                }
                              </small>
                            </div>
                          </div>
                          <div className="col-md-4 mb-3">
                            <div className="d-flex align-items-center mb-2">
                              <i className="bi bi-box-arrow-up-right text-primary me-2"></i>
                              <strong>Kullanılan Panel:</strong>
                            </div>
                            <div className="ps-4">
                              {helpers.calculatePanelsSold(currentSite.id, agreements)}
                            </div>
                          </div>
                          <div className="col-md-4 mb-3">
                            <div className="d-flex align-items-center mb-2">
                              <i className="bi bi-percent text-primary me-2"></i>
                              <strong>Anlaşma Yüzdesi:</strong>
                            </div>
                            <div className="ps-4">
                              <span className="badge bg-primary-subtle text-primary-emphasis rounded-pill">
                                {currentSite.agreementPercentage}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Information Section - Responsive Design */}
                <div className="row mb-4">
                  <div className="col-12">
                    <div className="detail-card">
                      <div className="detail-card-header bg-light">
                        <h6 className="mb-0 fw-bold">
                          <i className="bi bi-currency-dollar me-2"></i>
                          Ödeme Bilgileri
                        </h6>
                      </div>
                      <div className="detail-card-body">
                        {/* Total Payments Display */}
                        <div className="alert alert-success mb-4">
                          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
                            <div className="d-flex align-items-center">
                              <i className="bi bi-wallet2 me-2"></i>
                              <span className="fw-bold">Toplam Alınan Ödemeler:</span>
                            </div>
                            <span className="fw-bold fs-5">
                              {helpers.formatCurrency(
                                helpers.getSitePaymentHistoryDetailed(currentSite.id, transactions, agreements, companies)
                                  .reduce((sum, payment) => sum + Math.abs(payment.amount), 0)
                              )}
                            </span>
                          </div>
                        </div>
                        
                        {/* Pending Payments from New Agreements */}
                        {currentSite.hasPendingPayment && currentSite.pendingPayments && currentSite.pendingPayments.length > 0 ? (
                          <div className="card border-0 shadow-sm mb-4">
                            <div className="card-header bg-warning-subtle border-0">
                              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
                                <div className="d-flex align-items-center">
                                  <i className="bi bi-clock-history me-2 text-warning"></i>
                                  <span className="fw-bold">Bekleyen Ödemeler</span>
                                </div>
                                <span className="fw-bold text-warning">
                                  {helpers.formatCurrency(currentSite.pendingPayments.reduce((sum, p) => sum + p.amount, 0))}
                                </span>
                              </div>
                            </div>
                            <div className="card-body">
                              <div className="table-responsive">
                                <table className="table table-bordered table-detail">
                                  <thead>
                                    <tr>
                                      <th>Firma</th>
                                      <th>Panel Sayısı</th>
                                      <th>Haftalık Tutar</th>
                                      <th>Toplam Tutar</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {helpers.getPendingPaymentsDetailed(currentSite, agreements, companies).map((payment, index) => (
                                      <tr key={index}>
                                        <td>{payment.companyName}</td>
                                        <td>{payment.panelCount}</td>
                                        <td>{helpers.formatCurrency(payment.weeklyRatePerPanel)}</td>
                                        <td className="fw-bold">{helpers.formatCurrency(payment.amount)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-3">
                            <i className="bi bi-check-circle fs-1 text-success"></i>
                            <p className="mt-2 mb-0 text-muted">Bu site için bekleyen ödeme bulunmamaktadır.</p>
                          </div>
                        )}
                        
                        {/* Payment History */}
                        <div className="mt-4">
                          <h6 className="fw-bold mb-3">
                            <i className="bi bi-clock-history me-2"></i>
                            Ödeme Geçmişi
                          </h6>
                          {helpers.getSitePaymentHistoryDetailed(currentSite.id, transactions, agreements, companies).length > 0 ? (
                            <div className="table-responsive">
                              <table className="table table-bordered table-detail">
                                <thead>
                                  <tr>
                                    <th>Tarih</th>
                                    <th>Açıklama</th>
                                    <th>Tutar</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {helpers.getSitePaymentHistoryDetailed(currentSite.id, transactions, agreements, companies)
                                    .map((payment, index) => (
                                      <tr key={index}>
                                        <td>{new Date(payment.date).toLocaleDateString('tr-TR')}</td>
                                        <td>{payment.description}</td>
                                        <td className="fw-bold text-success">{helpers.formatCurrency(Math.abs(payment.amount))}</td>
                                      </tr>
                                    ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="text-center py-3">
                              <i className="bi bi-receipt fs-1 text-muted"></i>
                              <p className="mt-2 mb-0 text-muted">Bu site için ödeme geçmişi bulunmamaktadır.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                    {/* Panel Visualization */}
                    <div className="row">
                      <div className="col-12">
                        <div className="detail-card">
                          <div className="detail-card-header bg-light">
                            <h6 className="mb-0 fw-bold">
                              <i className="bi bi-grid-3x3-gap me-2"></i>
                              Panel Dağılımı
                            </h6>
                          </div>
                          <div className="detail-card-body">
                        <div className="d-flex flex-wrap gap-1 justify-content-center">
                          {Array.from({ length: currentSite.panels || 0 }, (_, i) => {
                            const panelNumber = i + 1;
                            const panelId = `panel-${panelNumber}`;
                            
                            // Get panel info using the same logic as CurrentStatus page
                            const getPanelInfo = (siteId, panelId) => {
                              const relevantAgreements = agreements.filter(agreement => 
                                agreement.siteIds && agreement.siteIds.includes(siteId) && agreement.status === 'active'
                              );
                              
                              for (const agreement of relevantAgreements) {
                                // Check if this agreement has panel selections for this site
                                if (agreement.sitePanelSelections && agreement.sitePanelSelections[siteId]) {
                                  // Check all blocks for this site
                                  for (const [blockId, selectedPanels] of Object.entries(agreement.sitePanelSelections[siteId])) {
                                    if (selectedPanels && selectedPanels.includes(panelId)) {
                                      return {
                                        isUsed: true,
                                        companyName: companies.find(c => String(c.id) === String(agreement.companyId))?.name || 'Bilinmeyen Firma',
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
                            
                            const panelInfo = getPanelInfo(currentSite.id, panelId);
                            
                            // Format date helper
                            const formatDate = (dateString) => {
                              return new Date(dateString).toLocaleDateString('tr-TR');
                            };
                            
                            return (
                              <div
                                key={panelNumber}
                                className={`position-relative d-flex align-items-center justify-content-center border rounded ${
                                  panelInfo.isUsed 
                                    ? 'bg-primary text-white'
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
                                title={panelInfo.isUsed ? 
                                  `Panel ${panelNumber} - ${panelInfo.companyName}\nTarih: ${formatDate(panelInfo.startDate)} - ${formatDate(panelInfo.endDate)}\nAnlaşma ID: ${panelInfo.agreementId}` : 
                                  `Panel ${panelNumber} - Boş`}
                                onClick={() => {
                                  if (panelInfo.isUsed) {
                                    // Show comprehensive panel info with all requested details (same as CurrentStatus)
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
                                    
                                    // Use the same alert system as CurrentStatus
                                    if (window.showAlert) {
                                      window.showAlert(
                                        'Panel Bilgisi',
                                        content,
                                        'info'
                                      );
                                    } else {
                                      // Fallback to simple alert if showAlert is not available
                                      alert(`Panel ${panelNumber}\nFirma: ${panelInfo.companyName}\nTarih: ${formatDate(panelInfo.startDate)} - ${formatDate(panelInfo.endDate)}\nAnlaşma ID: ${panelInfo.agreementId}`);
                                    }
                                  }
                                }}
                              >
                                <div style={{ fontSize: '12px' }}>{panelNumber}</div>
                                {panelInfo.isUsed && (
                                  <>
                                    <div className="text-truncate" style={{ fontSize: '8px', maxWidth: '50px' }} title={panelInfo.companyName}>
                                      {panelInfo.companyName}
                                    </div>
                                    <div className="text-truncate" style={{ fontSize: '7px', maxWidth: '50px' }} title={`${formatDate(panelInfo.startDate)} - ${formatDate(panelInfo.endDate)}`}>
                                      {formatDate(panelInfo.startDate)} - {formatDate(panelInfo.endDate)}
                                    </div>
                                    <div style={{ fontSize: '6px' }}>ID: {panelInfo.agreementId}</div>
                                    {panelInfo.photoUrl && (
                                      <div className="position-absolute" style={{ top: '2px', right: '2px' }}>
                                        <i className="bi bi-image text-warning" style={{ fontSize: '8px' }}></i>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                  </>
                )}

                {activeTab === 'advanceHistory' && (
                  <div className="row mb-4">
                    <div className="col-12">
                      <div className="detail-card">
                        <div className="detail-card-header bg-light">
                          <h6 className="mb-0 fw-bold">
                            <i className="bi bi-wallet me-2"></i>
                            Avans Geçmişi
                          </h6>
                        </div>
                        <div className="detail-card-body">
                          {advanceHistory.length > 0 ? (
                            <div className="table-responsive">
                              <table className="table table-bordered table-detail">
                                <thead>
                                  <tr>
                                    <th>Tarih</th>
                                    <th>İşlem Tipi</th>
                                    <th>Açıklama</th>
                                    <th className="text-end">Avans Tutarı</th>
                                    <th className="text-end">Kullanılan Avans</th>
                                    <th className="text-end">Kasa Ödemesi</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {advanceHistory.map((transaction, index) => {
                                    const isAdvancePayment = transaction.source?.includes('Site Avans Ödemesi');
                                    const isSitePayment = transaction.source?.includes('Site Ödemesi') && transaction.advanceUsed > 0;
                                    
                                    return (
                                      <tr key={transaction.id || index}>
                                        <td>{new Date(transaction.date).toLocaleDateString('tr-TR')}</td>
                                        <td>
                                          <span className={`badge ${isAdvancePayment ? 'bg-success' : 'bg-info'}`}>
                                            {isAdvancePayment ? 'Avans Ödemesi' : 'Site Ödemesi'}
                                          </span>
                                        </td>
                                        <td>{transaction.description || transaction.source}</td>
                                        <td className="text-end">
                                          {isAdvancePayment ? (
                                            <span className="fw-bold text-success">
                                              {formatCurrency(Math.abs(transaction.amount || transaction.originalAmount || 0))}
                                            </span>
                                          ) : (
                                            <span className="text-muted">-</span>
                                          )}
                                        </td>
                                        <td className="text-end">
                                          {isSitePayment ? (
                                            <span className="fw-bold text-info">
                                              {formatCurrency(transaction.advanceUsed || 0)}
                                            </span>
                                          ) : (
                                            <span className="text-muted">-</span>
                                          )}
                                        </td>
                                        <td className="text-end">
                                          {isSitePayment && transaction.cashPaid > 0 ? (
                                            <span className="fw-bold text-primary">
                                              {formatCurrency(transaction.cashPaid || 0)}
                                            </span>
                                          ) : (
                                            <span className="text-muted">-</span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                                <tfoot>
                                  <tr className="table-light">
                                    <td colSpan="3" className="fw-bold">Toplam</td>
                                    <td className="text-end fw-bold text-success">
                                      {formatCurrency(
                                        advanceHistory
                                          .filter(t => t.source?.includes('Site Avans Ödemesi'))
                                          .reduce((sum, t) => sum + Math.abs(t.amount || t.originalAmount || 0), 0)
                                      )}
                                    </td>
                                    <td className="text-end fw-bold text-info">
                                      {formatCurrency(
                                        advanceHistory
                                          .filter(t => t.advanceUsed > 0)
                                          .reduce((sum, t) => sum + (t.advanceUsed || 0), 0)
                                      )}
                                    </td>
                                    <td className="text-end fw-bold text-primary">
                                      {formatCurrency(
                                        advanceHistory
                                          .filter(t => t.cashPaid > 0)
                                          .reduce((sum, t) => sum + (t.cashPaid || 0), 0)
                                      )}
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          ) : (
                            <div className="text-center py-5">
                              <i className="bi bi-wallet fs-1 text-muted"></i>
                              <p className="mt-3 text-muted">Bu site için avans geçmişi bulunmamaktadır.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer bg-light rounded-bottom">
              <div className="d-flex flex-column flex-md-row gap-2 w-100">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={uiHandlers.handleCloseModal}
                >
                  <i className="bi bi-x-lg me-1"></i> Kapat
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => helpers.generateSitePDF(currentSite, modalContentRef)}
                >
                  <i className="bi bi-file-earmark-pdf me-1"></i> PDF Olarak İndir
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Payment Selection Modal
  const PaymentSelectionModal = () => {
    if (!showPaymentSelection || !selectedSiteForPayment) return null;

    return (
      <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={(e) => {
        if (e.target === e.currentTarget) {
          uiHandlers.handleClosePaymentSelection();
        }
      }}>
        <div className="modal-dialog modal-xl" onClick={e => e.stopPropagation()}>
          <div className="modal-content sites-modal-content">
            <div className="modal-header bg-success text-white">
              <h5 className="modal-title">
                <i className="bi bi-currency-dollar me-2"></i>
                {selectedSiteForPayment.name} - Ödeme Seçimi
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={uiHandlers.handleClosePaymentSelection}
              ></button>
            </div>
            <div className="modal-body">
              <div className="alert alert-info mb-4">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
                  <div className="d-flex align-items-center">
                    <i className="bi bi-info-circle me-2"></i>
                    <span className="fw-bold">Bu site için bekleyen ödemeler:</span>
                  </div>
                  <span className="fw-bold fs-5">
                    {helpers.formatCurrency(selectedSiteForPayment.pendingPayments.reduce((sum, p) => sum + p.amount, 0))}
                  </span>
                </div>
              </div>
              
              <p className="mb-4">Aşağıdaki anlaşmalardan hangisinden ödeme almak istediğinizi seçin:</p>
              
              <div className="table-responsive">
                <table className="table table-bordered table-sm">
                  <thead>
                    <tr>
                      <th style={{ minWidth: '80px' }}>ID</th>
                      <th style={{ minWidth: '120px' }}>Firma</th>
                      <th style={{ minWidth: '80px' }}>Panel</th>
                      <th style={{ minWidth: '100px' }}>Haftalık</th>
                      <th style={{ minWidth: '100px' }}>Ödeme</th>
                      <th style={{ minWidth: '100px' }}>İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {helpers.getPendingPaymentsDetailed(selectedSiteForPayment, agreements, companies).map((payment, index) => {
                      const isProcessed = processedPayments.includes(payment.agreementId);
                      return (
                        <tr key={`${payment.agreementId}-${index}`}>
                          <td className="text-center">#{payment.agreementId}</td>
                          <td className="text-truncate" style={{ maxWidth: '120px' }} title={payment.companyName}>{payment.companyName}</td>
                          <td className="text-center">{payment.panelCount}</td>
                          <td className="fw-bold text-success text-center">{helpers.formatCurrency(payment.weeklyAmount)}</td>
                          <td className="fw-bold text-success text-center">{helpers.formatCurrency(payment.amount)}</td>
                          <td className="text-center">
                            <button
                              className={`btn btn-sm ${isProcessed ? 'btn-secondary' : 'btn-success'}`}
                              onClick={() => !isProcessed && handlers.handleSelectPayment(payment)}
                              disabled={isProcessed}
                              style={{ minWidth: '90px' }}
                            >
                              <i className={`bi ${isProcessed ? 'bi-check-circle' : 'bi-currency-dollar'} me-1`}></i> 
                              {isProcessed ? 'Ödendi' : 'Ödeme Yap'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer bg-light">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={uiHandlers.handleClosePaymentSelection}
              >
                <i className="bi bi-x-lg me-1"></i> Kapat
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Active Agreements Modal
  const ActiveAgreementsModal = () => {
    if (!showActiveAgreements || !currentSiteForAgreements) return null;

    const activeAgreements = helpers.getActiveAgreementsForSite(currentSiteForAgreements.id);
    
    // Function to get panel selections for a site in an agreement
    const getPanelSelectionsForSite = (agreement, siteId) => {
      if (!agreement.sitePanelSelections || !agreement.sitePanelSelections[siteId]) {
        return [];
      }
      
      const panelSelections = [];
      const blockSelections = agreement.siteBlockSelections?.[siteId] || [];
      
      // For each selected block, get the panel selections
      blockSelections.forEach(blockKey => {
        if (agreement.sitePanelSelections[siteId][blockKey]) {
          // Extract block label from blockKey (format: siteId-block-A, siteId-block-B, etc.)
          const blockLabel = blockKey.split('-').pop();
          agreement.sitePanelSelections[siteId][blockKey].forEach(panelKey => {
            // Extract panel number from panelKey (format: panel-1, panel-2, etc.)
            const panelNumber = panelKey.split('-').pop();
            panelSelections.push(`${blockLabel}${panelNumber}`);
          });
        }
      });
      
      return panelSelections.sort();
    };
    
    // Function to get panel usage information
    const getPanelUsageInfo = (panelId) => {
      // Extract block and panel number from our generated panelId
      // panelId format: SITEIDBLOCKPANELNUMBER (e.g., BEY3A1)
      // We need to extract the block (A) and panel number (1) to match with agreement data
      
      // Extract the site ID, block and panel info from the panelId
      const siteId = currentSiteForAgreements.id;
      const blockAndPanelInfo = panelId.substring(siteId.length); // Remove site ID prefix
      const block = blockAndPanelInfo.charAt(0); // First character is block (A, B, etc.)
      const panelNumber = blockAndPanelInfo.substring(1); // Rest is panel number
      
      // Create the panel key that would match the agreement data format
      const panelKey = `panel-${panelNumber}`;
      const blockKey = `${siteId}-block-${block}`;
      
      // Check each active agreement for this panel usage
      for (const agreement of activeAgreements) {
        // Check if this agreement has panel selections for this site
        if (agreement.sitePanelSelections && agreement.sitePanelSelections[siteId]) {
          // Get all panel selections for this site
          const sitePanelSelections = agreement.sitePanelSelections[siteId];
          
          // Check if this block exists in the agreement
          if (sitePanelSelections[blockKey]) {
            // Check if this specific panel is selected
            if (sitePanelSelections[blockKey].includes(panelKey)) {
              const company = companies.find(c => String(c.id) === String(agreement.companyId));
              return {
                isUsed: true,
                companyName: company?.name || 'Bilinmeyen Firma',
                startDate: agreement.startDate,
                endDate: agreement.endDate,
                agreementId: agreement.id
              };
            }
          }
        }
      }
      
      return { isUsed: false };
    };
    
    // Generate all possible panel IDs for the site using correct naming convention
    const generateAllPanelIds = () => {
      const panels = [];
      const siteId = currentSiteForAgreements.id;
      const blockCount = parseInt(currentSiteForAgreements.blocks) || 0;
      const elevatorsPerBlock = parseInt(currentSiteForAgreements.elevatorsPerBlock) || 0;
      const panelsPerElevator = 2; // As per system design
      
      let panelCounter = 1;
      
      // Generate block labels (A, B, C, etc.)
      for (let blockIndex = 0; blockIndex < blockCount; blockIndex++) {
        const blockLabel = String.fromCharCode(65 + blockIndex); // A, B, C, etc.
        
        // Generate panels for this block (not per elevator)
        // For each block, we generate panels sequentially
        for (let panelIndex = 1; panelIndex <= (elevatorsPerBlock * panelsPerElevator); panelIndex++) {
          // Correct naming convention: SiteID + Block + PanelNumber
          const panelId = `${siteId}${blockLabel}${panelIndex}`;
          panels.push(panelId);
          panelCounter++;
        }
      }
      
      return panels;
    };
    
    // Get all panel IDs for this site
    const allPanelIds = generateAllPanelIds();
    
    return (
      <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={(e) => {
        if (e.target === e.currentTarget) {
          uiHandlers.handleCloseActiveAgreements();
        }
      }}>
        <div className="modal-dialog modal-xl" onClick={e => e.stopPropagation()}>
          <div className="modal-content sites-modal-content">
            <div className="modal-header bg-info text-white">
              <h5 className="modal-title">
                <i className="bi bi-clipboard-check me-2"></i>
                {currentSiteForAgreements.name} - Aktif Anlaşmalar
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={uiHandlers.handleCloseActiveAgreements}
              ></button>
            </div>
            <div className="modal-body">
              {activeAgreements.length > 0 ? (
                <>
                  <div className="alert alert-info mb-4">
                    <i className="bi bi-info-circle me-2"></i>
                    Bu site için {activeAgreements.length} aktif anlaşma bulunmaktadır.
                  </div>
                  
                  {/* Panel Visualization Section */}
                  <div className="detail-card mb-4">
                    <div className="detail-card-header bg-light">
                      <h6 className="mb-0 fw-bold">
                        <i className="bi bi-grid-3x3-gap me-2"></i>
                        Panel Dağılımı ve Kullanım Durumu
                      </h6>
                    </div>
                    <div className="detail-card-body">
                      <div className="panel-grid">
                        {allPanelIds.map((panelId, index) => {
                          const panelInfo = getPanelUsageInfo(panelId);
                          const isUsed = panelInfo.isUsed;
                          const companyName = panelInfo.companyName || '';
                          
                          // Extract display name from panel ID (Block + Panel Number)
                          // For panel ID BEY3A1, display name should be A1
                          const displayName = panelId.substring(panelId.length - 2); // Last 2 characters

                          return (
                            <div
                              key={panelId}
                              className={`panel-item ${isUsed ? 'used' : 'available'}`}
                              title={isUsed ? 
                                `${panelId}\n${companyName}\n${panelInfo.startDate ? new Date(panelInfo.startDate).toLocaleDateString('tr-TR') : ''} - ${panelInfo.endDate ? new Date(panelInfo.endDate).toLocaleDateString('tr-TR') : ''}` : 
                                `${panelId} - Boş`}
                            >
                              <div className="panel-number">{displayName}</div>
                              {isUsed && (
                                <div className="panel-company text-truncate" title={companyName}>
                                  {companyName}
                                </div>
                              )}
                              {isUsed && (
                                <div className="panel-lock">
                                  <i className="bi bi-lock-fill"></i>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Legend */}
                      <div className="d-flex flex-wrap gap-3 mt-4">
                        <div className="d-flex align-items-center">
                          <div className="panel-item used me-2" style={{ width: '30px', height: '30px' }}>
                            <i className="bi bi-lock-fill" style={{ fontSize: '10px' }}></i>
                          </div>
                          <span className="small">Kullanımda</span>
                        </div>
                        <div className="d-flex align-items-center">
                          <div className="panel-item available me-2" style={{ width: '30px', height: '30px' }}></div>
                          <span className="small">Boş</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Active Agreements Table */}
                  <div className="detail-card">
                    <div className="detail-card-header bg-light">
                      <h6 className="mb-0 fw-bold">
                        <i className="bi bi-clipboard-check me-2"></i>
                        Aktif Anlaşmalar Detayı
                      </h6>
                    </div>
                    <div className="detail-card-body">
                      <div className="table-responsive">
                        <table className="table table-bordered table-detail">
                          <thead>
                            <tr>
                              <th>Anlaşma ID</th>
                              <th>Firma</th>
                              <th>Başlangıç</th>
                              <th>Bitiş</th>
                              <th>Panel Sayısı</th>
                              <th>Kullanılan Paneller</th>
                              <th>Haftalık Tutar</th>
                              <th>Site Payı</th>
                            </tr>
                          </thead>
                          <tbody>
                            {activeAgreements.map(agreement => {
                              const company = companies.find(c => String(c.id) === String(agreement.companyId));
                              const panelCount = agreement.sitePanelCounts?.[currentSiteForAgreements.id] || 0;
                              const panelSelections = getPanelSelectionsForSite(agreement, currentSiteForAgreements.id);
                              
                              // Weekly rate per panel (this is what should be displayed in "Haftalık Tutar")
                              const weeklyRatePerPanel = parseFloat(agreement.weeklyRatePerPanel) || 0;
                              
                              // Calculate site share: weeklyRatePerPanel * panelCount * sitePercentage / 100
                              const sitePercentage = parseFloat(currentSiteForAgreements.agreementPercentage) || 0;
                              const siteShare = weeklyRatePerPanel * panelCount * sitePercentage / 100;
                              
                              return (
                                <tr key={agreement.id}>
                                  <td>#{agreement.id}</td>
                                  <td>{company?.name || 'Bilinmeyen Firma'}</td>
                                  <td>{new Date(agreement.startDate).toLocaleDateString('tr-TR')}</td>
                                  <td>{new Date(agreement.endDate).toLocaleDateString('tr-TR')}</td>
                                  <td>{panelCount}</td>
                                  <td>
                                    {panelSelections.length > 0 ? (
                                      <div className="d-flex flex-wrap gap-1">
                                        {panelSelections.map((panel, index) => (
                                          <span key={index} className="badge bg-primary-subtle text-primary-emphasis">
                                            {panel}
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-muted">Panel seçilmedi</span>
                                    )}
                                  </td>
                                  <td className="fw-bold text-success">{helpers.formatCurrency(weeklyRatePerPanel)}</td>
                                  <td className="fw-bold text-success">{helpers.formatCurrency(siteShare)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-5">
                  <i className="bi bi-clipboard-x fs-1 text-muted"></i>
                  <p className="mt-3 text-muted">Bu site için aktif anlaşma bulunmamaktadır.</p>
                </div>
              )}
            </div>
            <div className="modal-footer bg-light">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={uiHandlers.handleCloseActiveAgreements}
              >
                <i className="bi bi-x-lg me-1"></i> Kapat
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // All Pending Payments Modal
  const AllPendingPaymentsModal = () => {
    if (!showAllPendingPayments) return null;

    return (
      <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={(e) => {
        if (e.target === e.currentTarget) {
          setShowAllPendingPayments(false);
          setAllPendingPayments([]);
        }
      }}>
        <div className="modal-dialog modal-xl" onClick={e => e.stopPropagation()}>
          <div className="modal-content sites-modal-content">
            <div className="modal-header bg-warning text-white">
              <h5 className="modal-title">
                <i className="bi bi-clock-history me-2"></i>
                Tüm Bekleyen Ödemeler
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={() => {
                  setShowAllPendingPayments(false);
                  setAllPendingPayments([]);
                }}
              ></button>
            </div>
            <div className="modal-body">
              {allPendingPayments.length > 0 ? (
                <>
                  <div className="alert alert-warning mb-4">
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
                      <div className="d-flex align-items-center">
                        <i className="bi bi-info-circle me-2"></i>
                        <span className="fw-bold">Toplam Bekleyen Ödeme:</span>
                      </div>
                      <span className="fw-bold fs-5">
                        {helpers.formatCurrency(allPendingPayments.reduce((sum, p) => sum + p.amount, 0))}
                      </span>
                    </div>
                  </div>
                  
                  <div className="table-responsive">
                    <table className="table table-bordered table-detail">
                      <thead>
                        <tr>
                          <th>Site</th>
                          <th>Firma</th>
                          <th>Panel Sayısı</th>
                          <th>Haftalık Tutar</th>
                          <th>Toplam Tutar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allPendingPayments.map((payment, index) => (
                          <tr key={index}>
                            <td>{payment.siteName}</td>
                            <td>{payment.companyName}</td>
                            <td>{payment.panelCount}</td>
                            <td>{helpers.formatCurrency(payment.weeklyAmount)}</td>
                            <td className="fw-bold text-success">{helpers.formatCurrency(payment.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="text-center py-5">
                  <i className="bi bi-currency-dollar fs-1 text-muted"></i>
                  <p className="mt-3 text-muted">Bekleyen ödeme bulunmamaktadır.</p>
                </div>
              )}
            </div>
            <div className="modal-footer bg-light">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowAllPendingPayments(false);
                  setAllPendingPayments([]);
                }}
              >
                <i className="bi bi-x-lg me-1"></i> Kapat
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <SiteDetailModal />
      <PaymentSelectionModal />
      <ActiveAgreementsModal />
      <AllPendingPaymentsModal />
    </>
  );
};

export default SitesModals;