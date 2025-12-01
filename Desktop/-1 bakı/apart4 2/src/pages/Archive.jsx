import React, { useState, useEffect } from 'react';
import { getArchivedSites, getArchivedCompanies, getArchivedAgreements, restoreSite, restoreCompany, restoreAgreement, deleteArchivedSite, deleteArchivedCompany, deleteArchivedAgreement } from '../services/api';

const Archive = () => {
  const [activeTab, setActiveTab] = useState('sites');
  const [sites, setSites] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArchivedData = async () => {
      try {
        const [sitesData, companiesData, agreementsData] = await Promise.all([
          getArchivedSites(),
          getArchivedCompanies(),
          getArchivedAgreements()
        ]);
        
        setSites(sitesData);
        setCompanies(companiesData);
        setAgreements(agreementsData);
      } catch (error) {
        console.error('Error fetching archived data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArchivedData();
  }, []);

  const handleRestoreSite = async (siteId) => {
    try {
      const success = await restoreSite(siteId);
      if (success) {
        setSites(sites.filter(site => site.id !== siteId));
      } else {
        console.error('Failed to restore site');
      }
    } catch (error) {
      console.error('Error restoring site:', error);
    }
  };

  const handleRestoreCompany = async (companyId) => {
    try {
      const success = await restoreCompany(companyId);
      if (success) {
        setCompanies(companies.filter(company => company.id !== companyId));
      } else {
        console.error('Failed to restore company');
      }
    } catch (error) {
      console.error('Error restoring company:', error);
    }
  };

  const handleRestoreAgreement = async (agreementId) => {
    try {
      const success = await restoreAgreement(agreementId);
      if (success) {
        setAgreements(agreements.filter(agreement => agreement.id !== agreementId));
      } else {
        console.error('Failed to restore agreement');
      }
    } catch (error) {
      console.error('Error restoring agreement:', error);
    }
  };

  const handleDeleteSite = async (siteId) => {
    const result = await window.showConfirm(
      'Kalıcı Silme',
      'Bu öğeyi kalıcı olarak silmek istediğinize emin misiniz?',
      'error'
    );
    
    if (result) {
      try {
        const success = await deleteArchivedSite(siteId);
        if (success) {
          setSites(sites.filter(site => site.id !== siteId));
        } else {
          await window.showAlert(
            'Hata',
            'Öğe silinirken bir hata oluştu.',
            'error'
          );
        }
      } catch (error) {
        console.error('Error deleting site:', error);
        await window.showAlert(
          'Hata',
          'Öğe silinirken bir hata oluştu.',
          'error'
        );
      }
    }
  };

  const handleDeleteCompany = async (companyId) => {
    const result = await window.showConfirm(
      'Kalıcı Silme',
      'Bu öğeyi kalıcı olarak silmek istediğinize emin misiniz?',
      'error'
    );
    
    if (result) {
      try {
        const success = await deleteArchivedCompany(companyId);
        if (success) {
          setCompanies(companies.filter(company => company.id !== companyId));
        } else {
          await window.showAlert(
            'Hata',
            'Öğe silinirken bir hata oluştu.',
            'error'
          );
        }
      } catch (error) {
        console.error('Error deleting company:', error);
        await window.showAlert(
          'Hata',
          'Öğe silinirken bir hata oluştu.',
          'error'
        );
      }
    }
  };

  const handleDeleteAgreement = async (agreementId) => {
    const result = await window.showConfirm(
      'Kalıcı Silme',
      'Bu öğeyi kalıcı olarak silmek istediğinize emin misiniz?',
      'error'
    );
    
    if (result) {
      try {
        const success = await deleteArchivedAgreement(agreementId);
        if (success) {
          setAgreements(agreements.filter(agreement => agreement.id !== agreementId));
        } else {
          await window.showAlert(
            'Hata',
            'Öğe silinirken bir hata oluştu.',
            'error'
          );
        }
      } catch (error) {
        console.error('Error deleting agreement:', error);
        await window.showAlert(
          'Hata',
          'Öğe silinirken bir hata oluştu.',
          'error'
        );
      }
    }
  };

  // Add new functions for bulk delete operations
  const handleDeleteAllSites = async () => {
    const result = await window.showConfirm(
      'Tüm Siteleri Kalıcı Sil',
      `Tüm ${sites.length} siteyi kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`,
      'error'
    );
    
    if (result) {
      try {
        let successCount = 0;
        let errorCount = 0;
        
        for (const site of sites) {
          try {
            const success = await deleteArchivedSite(site.id);
            if (success) {
              successCount++;
            } else {
              errorCount++;
            }
          } catch (error) {
            console.error('Error deleting site:', error);
            errorCount++;
          }
        }
        
        // Update state to remove all sites
        setSites([]);
        
        await window.showAlert(
          'İşlem Tamamlandı',
          `${successCount} site başarıyla silindi. ${errorCount} site silinirken hata oluştu.`,
          'info'
        );
      } catch (error) {
        console.error('Error deleting all sites:', error);
        await window.showAlert(
          'Hata',
          'Siteler silinirken bir hata oluştu.',
          'error'
        );
      }
    }
  };

  const handleDeleteAllCompanies = async () => {
    const result = await window.showConfirm(
      'Tüm Firmaları Kalıcı Sil',
      `Tüm ${companies.length} firmayı kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`,
      'error'
    );
    
    if (result) {
      try {
        let successCount = 0;
        let errorCount = 0;
        
        for (const company of companies) {
          try {
            const success = await deleteArchivedCompany(company.id);
            if (success) {
              successCount++;
            } else {
              errorCount++;
            }
          } catch (error) {
            console.error('Error deleting company:', error);
            errorCount++;
          }
        }
        
        // Update state to remove all companies
        setCompanies([]);
        
        await window.showAlert(
          'İşlem Tamamlandı',
          `${successCount} firma başarıyla silindi. ${errorCount} firma silinirken hata oluştu.`,
          'info'
        );
      } catch (error) {
        console.error('Error deleting all companies:', error);
        await window.showAlert(
          'Hata',
          'Firmalar silinirken bir hata oluştu.',
          'error'
        );
      }
    }
  };

  const handleDeleteAllAgreements = async () => {
    const result = await window.showConfirm(
      'Tüm Anlaşmaları Kalıcı Sil',
      `Tüm ${agreements.length} anlaşmayı kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`,
      'error'
    );
    
    if (result) {
      try {
        let successCount = 0;
        let errorCount = 0;
        
        for (const agreement of agreements) {
          try {
            const success = await deleteArchivedAgreement(agreement.id);
            if (success) {
              successCount++;
            } else {
              errorCount++;
            }
          } catch (error) {
            console.error('Error deleting agreement:', error);
            errorCount++;
          }
        }
        
        // Update state to remove all agreements
        setAgreements([]);
        
        await window.showAlert(
          'İşlem Tamamlandı',
          `${successCount} anlaşma başarıyla silindi. ${errorCount} anlaşma silinirken hata oluştu.`,
          'info'
        );
      } catch (error) {
        console.error('Error deleting all agreements:', error);
        await window.showAlert(
          'Hata',
          'Anlaşmalar silinirken bir hata oluştu.',
          'error'
        );
      }
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <div className="loading-spinner mx-auto"></div>
          <p className="mt-3 text-muted">Arşiv yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="mb-4">
        <h2 className="h3 fw-bold">Arşiv</h2>
      </div>

      {/* Tab Navigation */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'sites' ? 'active' : ''}`}
            onClick={() => setActiveTab('sites')}
          >
            Siteler
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'companies' ? 'active' : ''}`}
            onClick={() => setActiveTab('companies')}
          >
            Firmalar
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'agreements' ? 'active' : ''}`}
            onClick={() => setActiveTab('agreements')}
          >
            Anlaşmalar
          </button>
        </li>
      </ul>

      {/* Sites Tab */}
      {activeTab === 'sites' && (
        <div className="card custom-card shadow-sm">
          <div className="card-header bg-primary-subtle d-flex justify-content-between align-items-center">
            <h5 className="mb-0 fw-bold">
              <i className="bi bi-building me-2"></i>
              Siteler
            </h5>
            {sites.length > 0 && (
              <button
                onClick={handleDeleteAllSites}
                className="btn btn-sm btn-danger"
                title="Tüm Siteleri Sil"
              >
                <i className="bi bi-trash me-1"></i>
                Tümünü Sil
              </button>
            )}
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table custom-table">
                <thead>
                  <tr>
                    <th>Ad</th>
                    <th>Mahalle</th>
                    <th>Tür</th>
                    <th>Not</th>
                    <th>Arşiv Tarihi</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {sites.map((site) => (
                    <tr key={site.id}>
                      <td className="fw-medium">{site.name}</td>
                      <td>{site.neighborhood || '-'}</td>
                      <td>Site</td>
                      <td>{site.notes || '-'}</td>
                      <td>{formatDate(site.archivedAt)}</td>
                      <td>
                        <div className="d-flex gap-2">
                          <button
                            onClick={() => handleRestoreSite(site.id)}
                            className="btn btn-sm btn-outline-success"
                            title="Geri Al"
                          >
                            <i className="bi bi-arrow-counterclockwise"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteSite(site.id)}
                            className="btn btn-sm btn-outline-danger"
                            title="Sil"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {sites.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center py-5">
                        <div className="empty-state">
                          <i className="bi bi-archive"></i>
                          <p className="mb-0">Arşivde site bulunmamaktadır.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Companies Tab */}
      {activeTab === 'companies' && (
        <div className="card custom-card shadow-sm">
          <div className="card-header bg-success-subtle d-flex justify-content-between align-items-center">
            <h5 className="mb-0 fw-bold">
              <i className="bi bi-building-add me-2"></i>
              Firmalar
            </h5>
            {companies.length > 0 && (
              <button
                onClick={handleDeleteAllCompanies}
                className="btn btn-sm btn-danger"
                title="Tüm Firmaları Sil"
              >
                <i className="bi bi-trash me-1"></i>
                Tümünü Sil
              </button>
            )}
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table custom-table">
                <thead>
                  <tr>
                    <th>Ad</th>
                    <th>Tür</th>
                    <th>Not</th>
                    <th>Arşiv Tarihi</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((company) => (
                    <tr key={company.id}>
                      <td className="fw-medium">{company.name}</td>
                      <td>Firma</td>
                      <td>{company.notes || '-'}</td>
                      <td>{formatDate(company.archivedAt)}</td>
                      <td>
                        <div className="d-flex gap-2">
                          <button
                            onClick={() => handleRestoreCompany(company.id)}
                            className="btn btn-sm btn-outline-success"
                            title="Geri Al"
                          >
                            <i className="bi bi-arrow-counterclockwise"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteCompany(company.id)}
                            className="btn btn-sm btn-outline-danger"
                            title="Sil"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {companies.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-5">
                        <div className="empty-state">
                          <i className="bi bi-archive"></i>
                          <p className="mb-0">Arşivde firma bulunmamaktadır.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Agreements Tab */}
      {activeTab === 'agreements' && (
        <div className="card custom-card shadow-sm">
          <div className="card-header bg-info-subtle d-flex justify-content-between align-items-center">
            <h5 className="mb-0 fw-bold">
              <i className="bi bi-handshake me-2"></i>
              Anlaşmalar
            </h5>
            {agreements.length > 0 && (
              <button
                onClick={handleDeleteAllAgreements}
                className="btn btn-sm btn-danger"
                title="Tüm Anlaşmaları Sil"
              >
                <i className="bi bi-trash me-1"></i>
                Tümünü Sil
              </button>
            )}
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table custom-table">
                <thead>
                  <tr>
                    <th>Ad</th>
                    <th>Tür</th>
                    <th>Not</th>
                    <th>Arşiv Tarihi</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {agreements.map((agreement) => (
                    <tr key={agreement.id}>
                      <td className="fw-medium">{agreement.company}</td>
                      <td>Anlaşma</td>
                      <td>{agreement.notes || '-'}</td>
                      <td>{formatDate(agreement.archivedAt)}</td>
                      <td>
                        <div className="d-flex gap-2">
                          <button
                            onClick={() => handleRestoreAgreement(agreement.id)}
                            className="btn btn-sm btn-outline-success"
                            title="Geri Al"
                          >
                            <i className="bi bi-arrow-counterclockwise"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteAgreement(agreement.id)}
                            className="btn btn-sm btn-outline-danger"
                            title="Sil"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {agreements.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-5">
                        <div className="empty-state">
                          <i className="bi bi-archive"></i>
                          <p className="mb-0">Arşivde anlaşma bulunmamaktadır.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Archive;