import React from 'react';

const AgreementSummary = ({ 
  formData,
  sitePanelCounts,
  helpers
}) => {
  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-light border-0 rounded-top">
        <h6 className="mb-0 d-flex align-items-center text-primary">
          <i className="bi bi-calculator me-2"></i>
          <span className="fw-semibold">Özet</span>
        </h6>
      </div>
      <div className="card-body">
        <div className="row g-3">
          <div className="col-md-6">
            <div className="border rounded-3 p-3 h-100">
              <p className="mb-1 text-muted small">Toplam Hafta</p>
              <p className="text-primary fw-bold fs-4 mb-0">{helpers.calculateTotalWeeks(formData.startDate, formData.endDate)}</p>
            </div>
          </div>
          <div className="col-md-6">
            <div className="border rounded-3 p-3 h-100">
              <p className="mb-1 text-muted small">Toplam Panel</p>
              <p className="text-primary fw-bold fs-4 mb-0">{Object.values(sitePanelCounts).reduce((sum, count) => sum + count, 0)}</p>
            </div>
          </div>
          <div className="col-md-6">
            <div className="border rounded-3 p-3 h-100">
              <p className="mb-1 text-muted small">Haftalık Ücret</p>
              <p className="text-primary fw-bold fs-4 mb-0">{helpers.formatCurrency(formData.weeklyRatePerPanel)}</p>
            </div>
          </div>
          <div className="col-md-6">
            <div className="border rounded-3 p-3 h-100 bg-primary bg-opacity-10 border-primary">
              <p className="mb-1 text-muted small">Toplam Tutar</p>
              <p className="text-primary fw-bold fs-3 mb-0">{helpers.formatCurrency(helpers.calculateTotalAmount(sitePanelCounts, formData.weeklyRatePerPanel))}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgreementSummary;