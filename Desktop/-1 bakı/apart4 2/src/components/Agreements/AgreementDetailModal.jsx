import React, { useState, useEffect } from 'react';
import { getTransactions } from '../../services/api';

const AgreementDetailModal = ({ showModal, currentAgreement, uiHandlers, helpers, handleUploadPhoto }) => {
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  
  useEffect(() => {
    if (showPaymentHistory && currentAgreement) {
      const fetchPaymentHistory = async () => {
        try {
          const allTransactions = await getTransactions();
          const agreementPayments = allTransactions.filter(t => 
            t.agreementId && String(t.agreementId) === String(currentAgreement.id) && t.type === 'income'
          ).sort((a, b) => new Date(b.date) - new Date(a.date));
          setPaymentHistory(agreementPayments);
        } catch (error) {
          console.error('Error fetching payment history:', error);
          setPaymentHistory([]);
        }
      };
      fetchPaymentHistory();
    }
  }, [showPaymentHistory, currentAgreement]);
  if (!showModal || !currentAgreement) return null;

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR');
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active':
        return 'bg-success';
      case 'completed':
        return 'bg-info';
      case 'terminated':
        return 'bg-warning';
      case 'archived':
        return 'bg-secondary';
      default:
        return 'bg-secondary';
    }
  };

  // Get status text
  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Aktif';
      case 'completed':
        return 'Tamamlandı';
      case 'terminated':
        return 'Erken Sonlandırıldı';
      case 'archived':
        return 'Arşivlendi';
      default:
        return 'Bilinmiyor';
    }
  };

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content agreement-modal-content">
          <div className="modal-header bg-primary text-white rounded-top">
            <h5 className="modal-title d-flex align-items-center">
              <i className="bi bi-file-earmark-text me-2"></i>
              <span className="fw-bold">Anlaşma Detayları</span>
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={uiHandlers.handleCloseModal}
            ></button>
          </div>
          <div className="modal-body p-0">
            <div className="row g-0">
              {/* Left Column - Agreement Details */}
              <div className="col-md-6 border-end">
                <div className="p-4">
                  <div className="card border-0 shadow-sm mb-4">
                    <div className="card-header bg-light border-0 rounded-top">
                      <h6 className="mb-0 d-flex align-items-center text-primary">
                        <i className="bi bi-info-circle me-2"></i>
                        <span className="fw-semibold">Temel Bilgiler</span>
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="row mb-3">
                        <div className="col-5">
                          <small className="text-muted">Firma</small>
                          <div className="fw-medium">{helpers.getCompanyName(currentAgreement.companyId)}</div>
                        </div>
                        <div className="col-4">
                          <small className="text-muted">Durum</small>
                          <div>
                            <span className={`badge ${getStatusBadgeClass(currentAgreement.status)} rounded-pill`}>
                              {getStatusText(currentAgreement.status)}
                            </span>
                          </div>
                        </div>
                        <div className="col-3 text-end">
                          <small className="text-muted">ID</small>
                          <div className="fw-medium">#{currentAgreement.id}</div>
                        </div>
                      </div>
                      
                      <div className="row mb-3">
                        <div className="col-6">
                          <small className="text-muted">Başlangıç Tarihi</small>
                          <div className="fw-medium">{formatDate(currentAgreement.startDate)}</div>
                        </div>
                        <div className="col-6">
                          <small className="text-muted">Bitiş Tarihi</small>
                          <div className="fw-medium">{formatDate(currentAgreement.endDate)}</div>
                        </div>
                      </div>
                      
                      <div className="row mb-3">
                        <div className="col-6">
                          <small className="text-muted">Toplam Hafta</small>
                          <div className="fw-medium">{currentAgreement.totalWeeks}</div>
                        </div>
                        <div className="col-6">
                          <small className="text-muted">Haftalık Ücret</small>
                          <div className="fw-medium">{helpers.formatCurrency(currentAgreement.weeklyRatePerPanel)}</div>
                        </div>
                      </div>
                      
                      <div className="row mb-3">
                        <div className="col-6">
                          <small className="text-muted">Toplam Tutar</small>
                          <div className="fw-medium text-primary">{helpers.formatCurrency(currentAgreement.totalAmount || 0)}</div>
                        </div>
                        <div className="col-6">
                          <small className="text-muted">Ödeme Durumu</small>
                          <div className="fw-medium">
                            {(() => {
                              const paymentStatus = currentAgreement.paymentStatus || 
                                (currentAgreement.paymentReceived ? 'paid' : 
                                 (currentAgreement.paidAmount > 0 ? 'partial' : 'unpaid'));
                              if (paymentStatus === 'paid') {
                                return (
                                  <span className="text-success">
                                    <i className="bi bi-check-circle-fill me-1"></i>
                                    Ödendi
                                  </span>
                                );
                              } else if (paymentStatus === 'partial') {
                                return (
                                  <span className="text-warning">
                                    <i className="bi bi-clock-history me-1"></i>
                                    Kısmi Ödendi
                                  </span>
                                );
                              } else {
                                return (
                                  <span className="text-danger">
                                    <i className="bi bi-x-circle-fill me-1"></i>
                                    Ödenmedi
                                  </span>
                                );
                              }
                            })()}
                          </div>
                        </div>
                      </div>
                      
                      {currentAgreement.notes && (
                        <div className="mb-0">
                          <small className="text-muted">Notlar</small>
                          <div className="fw-medium">{currentAgreement.notes}</div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Payment Information */}
                  <div className="card border-0 shadow-sm">
                    <div className="card-header bg-light border-0 rounded-top">
                      <h6 className="mb-0 d-flex align-items-center text-primary">
                        <i className="bi bi-wallet2 me-2"></i>
                        <span className="fw-semibold">Ödeme Bilgileri</span>
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="row mb-3">
                        <div className="col-6">
                          <small className="text-muted">Ödeme Türü</small>
                          <div className="fw-medium">
                            {currentAgreement.creditPaymentReceived ? 'Kredi ile Ödeme' : 'Nakit Ödeme'}
                          </div>
                        </div>
                        <div className="col-6">
                          <small className="text-muted">Ödeme Tarihi</small>
                          <div className="fw-medium">
                            {currentAgreement.paymentReceived || currentAgreement.creditPaymentReceived 
                              ? formatDate(currentAgreement.paymentDate || currentAgreement.creditPaymentDate)
                              : 'Ödeme Alınmadı'}
                          </div>
                        </div>
                      </div>
                      
                      {currentAgreement.creditPaymentReceived && (
                        <div className="alert alert-info mb-0">
                          <i className="bi bi-info-circle me-2"></i>
                          Bu anlaşma kredi ile oluşturuldu. Ödeme firma kredisi üzerinden yapıldı.
                        </div>
                      )}
                      
                      {/* Payment Status for Partial Payments */}
                      {currentAgreement.paidAmount !== undefined && (
                        <div className="row mt-3">
                          <div className="col-6">
                            <small className="text-muted">Ödenen Tutar</small>
                            <div className="fw-medium text-success">
                              {helpers.formatCurrency(currentAgreement.paidAmount || 0)}
                            </div>
                          </div>
                          <div className="col-6">
                            <small className="text-muted">Kalan Tutar</small>
                            <div className="fw-medium text-danger">
                              {helpers.formatCurrency(currentAgreement.remainingAmount || 0)}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Payment History Button */}
                      <div className="mt-3">
                        <button
                          className="btn btn-sm btn-outline-primary w-100"
                          onClick={() => setShowPaymentHistory(true)}
                        >
                          <i className="bi bi-clock-history me-2"></i>
                          Ödeme Geçmişi
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right Column - Site Details */}
              <div className="col-md-6">
                <div className="p-4">
                  {/* Sites and Panels */}
                  <div className="card border-0 shadow-sm mb-4">
                    <div className="card-header bg-light border-0 rounded-top">
                      <h6 className="mb-0 d-flex align-items-center text-primary">
                        <i className="bi bi-building me-2"></i>
                        <span className="fw-semibold">Siteler ve Paneller</span>
                      </h6>
                    </div>
                    <div className="card-body">
                      {currentAgreement.siteIds && currentAgreement.siteIds.map((siteId, index) => {
                        const siteName = helpers.getSiteName(siteId);
                        const panelCount = currentAgreement.sitePanelCounts?.[siteId] || 0;
                        
                        return (
                          <div key={siteId} className={`mb-3 ${index < currentAgreement.siteIds.length - 1 ? 'pb-3 border-bottom' : ''}`}>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <div className="fw-medium">{siteName}</div>
                              <span className="badge bg-primary rounded-pill">{panelCount} panel</span>
                            </div>
                            
                            {/* Block and Panel Selections */}
                            {currentAgreement.siteBlockSelections?.[siteId] && (
                              <div className="small text-muted">
                                <div className="mb-1">
                                  <i className="bi bi-grid me-1"></i>
                                  Bloklar: {currentAgreement.siteBlockSelections[siteId].join(', ')}
                                </div>
                                {currentAgreement.sitePanelSelections?.[siteId] && (
                                  <div>
                                    <i className="bi bi-layout-wtf me-1"></i>
                                    Paneller: {Object.values(currentAgreement.sitePanelSelections[siteId]).flat().join(', ')}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Photo Section */}
                  <div className="card border-0 shadow-sm">
                    <div className="card-header bg-light border-0 rounded-top">
                      <h6 className="mb-0 d-flex align-items-center text-primary">
                        <i className="bi bi-image me-2"></i>
                        <span className="fw-semibold">Fotoğraf</span>
                      </h6>
                    </div>
                    <div className="card-body text-center">
                      {currentAgreement.photoUrl ? (
                        <>
                          <img 
                            src={currentAgreement.photoUrl} 
                            alt="Anlaşma Fotoğrafı" 
                            className="img-fluid rounded mb-3"
                            style={{ maxHeight: '200px' }}
                          />
                          <div className="small text-muted mb-3">
                            Yüklendi: {formatDate(currentAgreement.photoUploadedAt)}
                          </div>
                        </>
                      ) : (
                        <div className="py-4">
                          <i className="bi bi-image text-muted fs-1 mb-3 d-block"></i>
                          <p className="text-muted mb-0">Fotoğraf yüklenmemiş</p>
                        </div>
                      )}
                      <button 
                        className="btn btn-agreement-outline btn-sm"
                        onClick={() => handleUploadPhoto(currentAgreement)}
                      >
                        <i className="bi bi-cloud-upload me-1"></i>
                        {currentAgreement.photoUrl ? 'Fotoğrafı Değiştir' : 'Fotoğraf Yükle'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer bg-light">
            <button 
              type="button" 
              className="btn btn-agreement-outline"
              onClick={uiHandlers.handleCloseModal}
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
      
      {/* Payment History Modal */}
      {showPaymentHistory && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <i className="bi bi-clock-history me-2"></i>
                  Ödeme Geçmişi - {helpers.getCompanyName(currentAgreement.companyId)}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowPaymentHistory(false)}
                ></button>
              </div>
              <div className="modal-body">
                {paymentHistory.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="bi bi-inbox text-muted fs-1"></i>
                    <p className="text-muted mt-2">Henüz ödeme kaydı bulunmamaktadır.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Tarih</th>
                          <th>Ödeme Yöntemi</th>
                          <th>Tutar</th>
                          <th>Açıklama</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentHistory.map((payment) => (
                          <tr key={payment.id || payment._docId}>
                            <td>{formatDate(payment.date)}</td>
                            <td>
                              <span className="badge bg-info">
                                {payment.paymentMethod === 'check' ? 'Çek' : 'Nakit'}
                              </span>
                            </td>
                            <td className="fw-bold text-success">
                              {helpers.formatCurrency(payment.amount || 0)}
                            </td>
                            <td>{payment.description || payment.source || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="table-primary">
                          <td colSpan="2" className="fw-bold">Toplam:</td>
                          <td className="fw-bold">
                            {helpers.formatCurrency(
                              paymentHistory.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
                            )}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPaymentHistory(false)}
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgreementDetailModal;