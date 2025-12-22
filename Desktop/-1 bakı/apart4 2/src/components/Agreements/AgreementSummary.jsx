import React from 'react';

const AgreementSummary = ({ 
  formData,
  sitePanelCounts,
  helpers,
  sites,
  sitePanelSelections,
  dateRanges
}) => {
  // Calculate total people count from selected sites
  const calculateTotalPeople = () => {
    if (!sites || !sitePanelSelections || !dateRanges) return 0;
    
    let totalPeople = 0;
    const selectedSiteIds = new Set();
    
    // Get all selected sites across all date ranges
    dateRanges.forEach((range, rangeIndex) => {
      const selectedSitesInRange = helpers?.getSelectedSitesForRange?.(rangeIndex, sitePanelSelections) || [];
      selectedSitesInRange.forEach(siteId => {
        if (!selectedSiteIds.has(siteId)) {
          selectedSiteIds.add(siteId);
          const site = sites.find(s => String(s.id) === String(siteId));
          if (site) {
            if (site.siteType === 'site') {
              totalPeople += parseInt(site.averagePeople || 0);
            } else if (site.siteType === 'business_center') {
              totalPeople += parseInt(site.peopleCount || 0);
            }
          }
        }
      });
    });
    
    return totalPeople;
  };
  
  const totalPeople = calculateTotalPeople();
  
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
              <p className="text-primary fw-bold fs-4 mb-0">
                {helpers.calculateTotalWeeksFromRanges 
                  ? helpers.calculateTotalWeeksFromRanges(formData.dateRanges || [])
                  : helpers.calculateTotalWeeks(formData.startDate, formData.endDate)}
              </p>
            </div>
          </div>
          <div className="col-md-6">
            <div className="border rounded-3 p-3 h-100">
              <p className="mb-1 text-muted small">Toplam Panel</p>
              <p className="text-primary fw-bold fs-4 mb-0">
                {Object.values(sitePanelCounts).reduce((sum, count) => sum + count, 0)}
              </p>
            </div>
          </div>
          <div className="col-md-6">
            <div className="border rounded-3 p-3 h-100">
              <p className="mb-1 text-muted small">Haftalık Ücret</p>
              <p className="text-primary fw-bold fs-4 mb-0">
                {helpers.formatCurrency(formData.weeklyRatePerPanel)}
              </p>
            </div>
          </div>
          <div className="col-md-6">
            <div className="border rounded-3 p-3 h-100 bg-info bg-opacity-10 border-info">
              <p className="mb-1 text-muted small">Tahmini Hedef Kitle</p>
              <p className="text-info fw-bold fs-4 mb-0">
                {totalPeople.toLocaleString('tr-TR')} kişi
              </p>
            </div>
          </div>
          <div className="col-md-12">
            <div className="border rounded-3 p-3 h-100 bg-primary bg-opacity-10 border-primary">
              <p className="mb-1 text-muted small">Toplam Tutar</p>
              {(() => {
                // Eğer kullanıcı toplam tutarı manuel girdiyse onu göster,
                // aksi halde haftalık ücrete ve seçilen panel/hafta sayısına göre hesaplanan toplamı göster
                const manualTotal = parseFloat(formData.totalAmount);
                const total = manualTotal > 0
                  ? manualTotal
                  : helpers.calculateTotalAmount(sitePanelCounts, formData.weeklyRatePerPanel, formData.dateRanges);
                return (
                  <p className="text-primary fw-bold fs-3 mb-0">
                    {helpers.formatCurrency(total || 0)}
                  </p>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgreementSummary;