import React from 'react';

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
          {agreements.map(agreement => (
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
                <div className="small text-muted d-lg-none">
                  {helpers.formatCurrency(agreement.weeklyRatePerPanel)}/hafta
                </div>
                <div className="small text-muted d-none d-lg-table-cell">
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
                    className="btn btn-sm btn-outline-danger"
                    title="PDF İndir"
                    onClick={() => {
                      if (helpers.generateAgreementPDF) {
                        const success = helpers.generateAgreementPDF(agreement);
                        if (success && window.showAlert) {
                          window.showAlert('Başarılı', 'PDF dosyası başarıyla oluşturuldu ve indirildi.', 'success');
                        }
                      }
                    }}
                  >
                    <i className="bi bi-file-earmark-pdf"></i>
                  </button>
                  
                  {activeTab === 'active' ? (
                    // Active agreements - show all management buttons
                    <>
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        title="Düzenle"
                        onClick={() => uiHandlers.handleEditAgreement(agreement)}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-outline-info"
                        title="Fotoğraf Yükle"
                        onClick={() => handleUploadPhoto(agreement)}
                      >
                        <i className="bi bi-image"></i>
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
                      >
                        <i className="bi bi-archive"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        title="Kalıcı Sil"
                        onClick={() => handlers.handleDeleteAgreement(agreement.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </>
                  ) : (
                    // Expired agreements - show only view and archive buttons
                    <>
                      <button
                        className="btn btn-sm btn-outline-info"
                        title="Fotoğraf Görüntüle"
                        onClick={() => handleUploadPhoto(agreement)}
                        disabled={!agreement.photoUrl}
                      >
                        <i className="bi bi-image"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        title="Arşivle"
                        onClick={() => handlers.handleArchiveAgreement(agreement.id)}
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
              <i className={`bi ${activeTab === 'active' ? 'bi-check-circle' : 'bi-clock-history'} text-muted fs-1`}></i>
            </div>
          </div>
          <h6 className="text-muted mb-0">
            {activeTab === 'active' ? 'Henüz aktif anlaşma bulunmamaktadır' : 'Henüz süresi bitmiş veya sonlandırılmış anlaşma bulunmamaktadır'}
          </h6>
          {activeTab === 'active' && (
            <p className="text-muted small mt-2">Yeni anlaşma oluşturmak için "Yeni Anlaşma" butonuna tıklayın</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AgreementTable;