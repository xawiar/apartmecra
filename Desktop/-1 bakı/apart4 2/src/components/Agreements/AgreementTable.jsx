import React from 'react';
import { isObserver } from '../../utils/auth';

const AgreementTable = ({ agreements, handlers, uiHandlers, helpers, handleUploadPhoto, activeTab }) => {
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
    <div className="table-responsive-agreement">
      <table className="table table-hover mb-0 agreement-table">
        <thead className="agreement-table-header">
          <tr>
            <th className="border-0 py-3 px-4">Firma</th>
            <th className="border-0 py-3 px-4">Tarih Aralığı</th>
            <th className="border-0 py-3 px-4 d-none d-md-table-cell">Panel Sayısı</th>
            <th className="border-0 py-3 px-4">Toplam Tutar</th>
            <th className="border-0 py-3 px-4 d-none d-lg-table-cell">Durum</th>
            <th className="border-0 py-3 px-4 text-end">İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {(agreements || []).map(agreement => (
            <tr key={agreement.id} className="align-middle">
              <td className="py-3 px-4">
                <div className="d-flex align-items-center company-info">
                  <div className="company-icon me-3">
                    <i className="bi bi-building text-primary"></i>
                  </div>
                  <div>
                    <div className="company-name">{helpers.getCompanyName(agreement.companyId)}</div>
                    <div className="company-id text-muted small">#{agreement.id}</div>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="fw-medium">{formatDate(agreement.startDate)} - {formatDate(agreement.endDate)}</div>
                <div className="small text-muted d-md-none">{agreement.totalWeeks} hafta</div>
                <div className="small text-muted d-md-none">
                  {Object.values(agreement.sitePanelCounts || {}).reduce((sum, count) => sum + count, 0)} panel
                </div>
              </td>
              <td className="py-3 px-4 d-none d-md-table-cell">
                <div className="fw-medium">
                  {Object.values(agreement.sitePanelCounts || {}).reduce((sum, count) => sum + count, 0)} panel
                </div>
                <div className="small text-muted">
                  {agreement.siteIds?.length || 0} site
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="amount">{helpers.formatCurrency(agreement.totalAmount)}</div>
                {(agreement.paidAmount || agreement.paidAmount === 0) && (
                  <>
                    <div className="small text-success mt-1">
                      Ödenen: {helpers.formatCurrency(agreement.paidAmount || 0)}
                    </div>
                    {(agreement.remainingAmount || agreement.remainingAmount === 0) && (
                      <div className="small text-warning">
                        Kalan: {helpers.formatCurrency(agreement.remainingAmount || 0)}
                      </div>
                    )}
                  </>
                )}
                <div className="small text-muted d-lg-none mt-1">
                  {helpers.formatCurrency(agreement.weeklyRatePerPanel)}/hafta
                </div>
                <div className="small text-muted d-none d-lg-table-cell mt-1">
                  {helpers.formatCurrency(agreement.weeklyRatePerPanel)}/hafta
                </div>
              </td>
              <td className="py-3 px-4 d-none d-lg-table-cell">
                <span className={`badge ${getStatusBadgeClass(agreement.status)} rounded-pill`}>
                  {getStatusText(agreement.status)}
                </span>
              </td>
              <td className="py-3 px-4 text-end">
                <div className="d-inline-flex gap-1 flex-wrap justify-content-end">
                  <button
                    className="btn btn-sm btn-outline-primary"
                    title="Görüntüle"
                    onClick={() => handlers.handleShowAgreement(agreement)}
                  >
                    <i className="bi bi-eye"></i>
                  </button>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    title="Anlaşma Özeti (PDF)"
                    onClick={() => {
                      if (helpers.generateAgreementPDF) {
                        const success = helpers.generateAgreementPDF(agreement);
                        if (success && window.showAlert) {
                          window.showAlert('Başarılı', 'Anlaşma özeti PDF olarak indirildi.', 'success');
                        }
                      }
                    }}
                  >
                    <i className="bi bi-file-earmark-text"></i>
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    title="Sözleşme PDF"
                    onClick={() => {
                      if (helpers.generateContractPDF) {
                        const success = helpers.generateContractPDF(agreement);
                        if (success && window.sendAnalyticsEvent) {
                          window.sendAnalyticsEvent('contract_pdf_generated', { agreementId: agreement.id });
                        }
                        if (success && window.showAlert) {
                          window.showAlert('Başarılı', 'Sözleşme PDF\'i başarıyla oluşturuldu ve indirildi.', 'success');
                        }
                      }
                    }}
                  >
                    <i className="bi bi-file-earmark-pdf"></i>
                  </button>
                  
                  {(activeTab === 'active' || activeTab === 'orders') ? (
                    // Active agreements or orders - show all management buttons
                    <>
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        title="Düzenle"
                        onClick={() => uiHandlers.handleEditAgreement(agreement)}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-outline-success"
                        title="Nakit Ödeme Al"
                        onClick={() => handlers.handlePaymentAgreement(agreement)}
                        disabled={agreement.paymentReceived || agreement.creditPaymentReceived || agreement.status === 'terminated'}
                      >
                        <i className="bi bi-cash"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        title="Kredi ile Ödeme"
                        onClick={() => handlers.handleCreditPayment(agreement)}
                        disabled={agreement.paymentReceived || agreement.creditPaymentReceived || agreement.status === 'terminated'}
                      >
                        <i className="bi bi-credit-card"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-outline-warning"
                        title="Erken Sonlandır"
                        onClick={() => handlers.handleTerminateAgreement(agreement)}
                        disabled={agreement.status !== 'active'}
                      >
                        <i className="bi bi-x-circle"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        title="Arşivle"
                        onClick={() => handlers.handleArchiveAgreement(agreement.id)}
                        disabled={isObserver()}
                      >
                        <i className="bi bi-archive"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        title="Kalıcı Sil"
                        onClick={() => handlers.handleDeleteAgreement(agreement.id)}
                        disabled={isObserver()}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </>
                  ) : (
                    // Expired agreements - show payment buttons and archive button
                    <>
                      <button
                        className="btn btn-sm btn-outline-success"
                        title="Nakit Ödeme Al"
                        onClick={() => handlers.handlePaymentAgreement(agreement)}
                        disabled={agreement.paymentReceived || agreement.creditPaymentReceived || agreement.status === 'terminated' || agreement.status === 'archived'}
                      >
                        <i className="bi bi-cash"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        title="Kredi ile Ödeme"
                        onClick={() => handlers.handleCreditPayment(agreement)}
                        disabled={agreement.paymentReceived || agreement.creditPaymentReceived || agreement.status === 'terminated' || agreement.status === 'archived'}
                      >
                        <i className="bi bi-credit-card"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        title="Arşivle"
                        onClick={() => handlers.handleArchiveAgreement(agreement.id)}
                        disabled={isObserver()}
                      >
                        <i className="bi bi-archive"></i>
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {agreements.length === 0 && (
        <div className="text-center py-5">
          <div className="mb-3">
            <div className="bg-light bg-opacity-50 rounded-circle d-flex align-items-center justify-content-center mx-auto" style={{ width: '60px', height: '60px' }}>
              <i className={`bi ${activeTab === 'active' ? 'bi-check-circle' : activeTab === 'orders' ? 'bi-cart' : 'bi-clock-history'} text-muted fs-1`}></i>
            </div>
          </div>
          <h6 className="text-muted mb-0">
            {activeTab === 'active' ? 'Henüz aktif anlaşma bulunmamaktadır' : 
             activeTab === 'orders' ? 'Henüz sipariş bulunmamaktadır' :
             'Henüz süresi bitmiş veya sonlandırılmış anlaşma bulunmamaktadır'}
          </h6>
          {activeTab === 'active' && (
            <p className="text-muted small mt-2">Yeni anlaşma oluşturmak için "Yeni Anlaşma" butonuna tıklayın</p>
          )}
          {activeTab === 'orders' && (
            <p className="text-muted small mt-2">Firmalar sipariş oluşturduğunda burada görünecektir</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AgreementTable;