import React from 'react';
import { isObserver } from '../../utils/auth';
import SiteHelpers from './SiteHelpers';

const SitesTable = ({ 
  sites, 
  helpers, 
  uiHandlers, 
  handlers 
}) => {
  // Separate business centers and regular sites
  const businessCenters = (sites || []).filter(site => site.siteType === 'business_center');
  const regularSites = (sites || []).filter(site => site.siteType !== 'business_center');

  // Mahalle bazlı gruplama için yardımcı fonksiyon
  const getNeighborhoodKey = (site) => {
    return (site.neighborhood || 'Diğer').toString().trim() || 'Diğer';
  };

  // Render table rows
  const renderTableRows = (siteList) => {
    return siteList.map((site, index) => (
                <tr key={site.id} className="align-middle">
                  <td className="py-2 px-2">
                    <div className="d-flex align-items-center site-info">
                      <div className="site-icon me-2">
                        <div className="d-flex align-items-center justify-content-center bg-primary rounded-circle text-white fw-bold small" 
                             style={{width: '30px', height: '30px', fontSize: '12px'}}>
                          {site.name.charAt(0)}
                        </div>
                      </div>
                      <div>
                        <div className="site-name fw-medium small">{site.name}</div>
                        <div className="site-id text-muted" style={{fontSize: '10px'}}>#{site.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2 px-2 d-none d-md-table-cell small">
                    {site.neighborhood}
                  </td>
                  <td className="py-2 px-2 d-none d-lg-table-cell small">
                    {site.manager}
                  </td>
                  <td className="py-2 px-2 d-none d-xl-table-cell small">
                    {site.phone}
                  </td>
                  {site.siteType !== 'business_center' && (
                    <>
                      <td className="py-2 px-2 text-center small">
                        {site.blocks}
                      </td>
                      <td className="py-2 px-2 text-center small">
                        {site.elevators}
                      </td>
                    </>
                  )}
                  <td className="py-2 px-2 text-center small">
                    {site.siteType === 'business_center' 
                      ? (parseInt(site.manualPanels) || parseInt(site.panels) || 0)
                      : (parseInt(site.panels) || 0)
                    }
                  </td>
                  <td className="py-2 px-2 text-center small">
                    {site.siteType === 'business_center' ? (
                      <span className="text-info">
                        <i className="bi bi-briefcase me-1"></i>
                        {site.businessCount || 0} işyeri
                      </span>
                    ) : (
                      <span className="text-primary">
                        <i className="bi bi-house me-1"></i>
                        {site.apartmentCount || 0} daire
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-center small">
                    {site.siteType === 'business_center' ? (
                      <span className="text-info">
                        <i className="bi bi-people me-1"></i>
                        {site.peopleCount || 0} kişi
                      </span>
                    ) : (
                      <span className="text-primary">
                        <i className="bi bi-people me-1"></i>
                        {site.averagePeople || 0} kişi
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-center">
                    <span className="badge bg-primary-subtle text-primary-emphasis rounded-pill small">
                      {site.agreementPercentage}%
                    </span>
                  </td>
                  <td className="py-2 px-2 text-end">
                    <div className="d-flex gap-1 justify-content-end">
                      <button
                        onClick={() => uiHandlers.handleShowSite(site)}
                        className="btn btn-xs btn-outline-primary"
                        title="Göster"
                        style={{padding: '2px 6px', fontSize: '10px'}}
                      >
                        <i className="bi bi-eye" style={{fontSize: '10px'}}></i>
                      </button>
                      <button
                        onClick={() => uiHandlers.handleEditSite(site)}
                        className="btn btn-xs btn-outline-secondary"
                        title="Düzenle"
                        disabled={isObserver()}
                        style={{padding: '2px 6px', fontSize: '10px'}}
                      >
                        <i className="bi bi-pencil" style={{fontSize: '10px'}}></i>
                      </button>
                      <button
                        onClick={() => uiHandlers.handleShowActiveAgreements(site)}
                        className={`btn btn-xs ${
                          helpers.getActiveAgreementsForSite(site.id).length > 0 
                            ? 'btn-outline-info' 
                            : 'btn-outline-secondary disabled'
                        }`}
                        title={helpers.getActiveAgreementsForSite(site.id).length > 0 ? "Aktif Anlaşmalar" : "Aktif anlaşma yok"}
                        disabled={helpers.getActiveAgreementsForSite(site.id).length === 0}
                        style={{padding: '2px 6px', fontSize: '10px'}}
                      >
                        <i className="bi bi-clipboard-check" style={{fontSize: '10px'}}></i>
                      </button>
                      <button
                        onClick={() => handlers.handleArchiveSite(site.id)}
                        className="btn btn-xs btn-outline-warning me-1"
                        title="Arşiv"
                        disabled={isObserver()}
                        style={{padding: '2px 6px', fontSize: '10px'}}
                      >
                        <i className="bi bi-archive" style={{fontSize: '10px'}}></i>
                      </button>
                      <button
                        onClick={() => handlers.handleDeleteSite(site.id)}
                        className="btn btn-xs btn-outline-danger"
                        title="Kalıcı Sil"
                        disabled={isObserver()}
                        style={{padding: '2px 6px', fontSize: '10px'}}
                      >
                        <i className="bi bi-trash" style={{fontSize: '10px'}}></i>
                      </button>
                    </div>
                  </td>
                </tr>
    ));
  };

  return (
    <div className="row g-4">
      {/* İş Merkezleri - Üstte */}
      <div className="col-12">
        <div className="sites-table-container border-0 shadow-sm">
          <div className="card-header bg-info bg-opacity-10 border-0">
            <h6 className="mb-0 fw-bold text-info">
              <i className="bi bi-briefcase me-2"></i>
              İş Merkezleri ({businessCenters.length})
            </h6>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0 sites-table">
                <thead className="sites-table-header">
                  <tr>
                    <th className="border-0 py-2 px-2 small">İş Merkezi</th>
                    <th className="border-0 py-2 px-2 d-none d-md-table-cell small">Mahalle</th>
                    <th className="border-0 py-2 px-2 d-none d-lg-table-cell small">Yönetici</th>
                    <th className="border-0 py-2 px-2 d-none d-xl-table-cell small">Telefon</th>
                    <th className="border-0 py-2 px-2 text-center small">Panel</th>
                    <th className="border-0 py-2 px-2 text-center small">İşyeri</th>
                    <th className="border-0 py-2 px-2 text-center small">İnsan Sayısı</th>
                    <th className="border-0 py-2 px-2 text-center small">Anlaşma %</th>
                    <th className="border-0 py-2 px-2 text-end small">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {renderTableRows(businessCenters)}
                  {businessCenters.length === 0 && (
                    <tr>
                      <td colSpan="9" className="text-center py-5">
                        <div className="empty-state">
                          <i className="bi bi-briefcase"></i>
                          <p className="mb-3 text-muted">Henüz iş merkezi bulunmamaktadır.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Siteler - Altta (Mahalle bazlı gruplama ile) */}
      <div className="col-12">
        <div className="sites-table-container border-0 shadow-sm">
          <div className="card-header bg-primary bg-opacity-10 border-0">
            <h6 className="mb-0 fw-bold text-primary">
              <i className="bi bi-building me-2"></i>
              Siteler ({regularSites.length})
            </h6>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0 sites-table">
                <thead className="sites-table-header">
                  <tr>
                    <th className="border-0 py-2 px-2 small">Site</th>
                    <th className="border-0 py-2 px-2 d-none d-md-table-cell small">Mahalle</th>
                    <th className="border-0 py-2 px-2 d-none d-lg-table-cell small">Yönetici</th>
                    <th className="border-0 py-2 px-2 d-none d-xl-table-cell small">Telefon</th>
                    <th className="border-0 py-2 px-2 text-center small">Blok</th>
                    <th className="border-0 py-2 px-2 text-center small">Asansör</th>
                    <th className="border-0 py-2 px-2 text-center small">Panel</th>
                    <th className="border-0 py-2 px-2 text-center small">Daire</th>
                    <th className="border-0 py-2 px-2 text-center small">İnsan Sayısı</th>
                    <th className="border-0 py-2 px-2 text-center small">Anlaşma %</th>
                    <th className="border-0 py-2 px-2 text-end small">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {regularSites.length > 0 && (
                    <>
                      {Array.from(
                        new Set(regularSites.map(site => getNeighborhoodKey(site)))
                      )
                        .sort()
                        .map(neighborhood => {
                          const groupSites = regularSites.filter(
                            site => getNeighborhoodKey(site) === neighborhood
                          );
                          return (
                            <React.Fragment key={neighborhood}>
                              {/* Mahalle başlık satırı */}
                              <tr className="table-light">
                                <td colSpan="11" className="fw-bold text-primary small">
                                  <i className="bi bi-geo-alt-fill me-1"></i>
                                  {neighborhood} ({groupSites.length})
                                </td>
                              </tr>
                              {/* Bu mahalledeki siteler */}
                              {renderTableRows(groupSites)}
                            </React.Fragment>
                          );
                        })}
                    </>
                  )}
                  {regularSites.length === 0 && (
                    <tr>
                      <td colSpan="11" className="text-center py-5">
                        <div className="empty-state">
                          <i className="bi bi-building"></i>
                          <p className="mb-3 text-muted">Henüz site bulunmamaktadır.</p>
                          <button 
                            onClick={uiHandlers.handleAddSite}
                            className="btn btn-sites-primary"
                          >
                            Site Ekle
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SitesTable;