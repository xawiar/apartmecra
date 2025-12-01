import React, { useState, useEffect } from 'react';
import { getSites, getCompanies, getAgreements, getTransactions, getPartners } from '../services/api';

const ObserverDashboard = () => {
  const [sites, setSites] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalSites: 0,
    totalCompanies: 0,
    activeAgreements: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    netBalance: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sitesData, companiesData, agreementsData, transactionsData, partnersData] = await Promise.all([
          getSites(),
          getCompanies(),
          getAgreements(),
          getTransactions(),
          getPartners()
        ]);
        
        setSites(sitesData);
        setCompanies(companiesData);
        setAgreements(agreementsData);
        setTransactions(transactionsData);
        setPartners(partnersData);
        
        // Calculate statistics
        const totalRevenue = transactionsData
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const totalExpenses = Math.abs(transactionsData
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0));
        
        const activeAgreements = agreementsData.filter(a => a.status === 'active').length;
        
        setStats({
          totalSites: sitesData.length,
          totalCompanies: companiesData.filter(c => c.status === 'active').length,
          activeAgreements,
          totalRevenue,
          totalExpenses,
          netBalance: totalRevenue - totalExpenses
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get company name by ID
  const getCompanyName = (companyId) => {
    const company = companies.find(c => String(c.id) === String(companyId));
    return company ? company.name : 'Unknown';
  };

  // Get site name by ID
  const getSiteName = (siteId) => {
    const site = sites.find(s => String(s.id) === String(siteId));
    return site ? site.name : 'Unknown';
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
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
          <p className="mt-3 text-muted">Veriler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h3 fw-bold">Gözlemci Panosu</h2>
          <p className="text-muted mb-0">
            <i className="bi bi-eye me-1"></i>
            Tüm sistem verilerini görüntüleme yetkisi - Düzenleme yetkisi yok
          </p>
        </div>
        <div className="text-end">
          <small className="text-muted">Son Güncelleme: {new Date().toLocaleDateString('tr-TR')}</small>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-2">
          <div className="card custom-card bg-primary text-white">
            <div className="card-body text-center">
              <i className="bi bi-building fs-1 mb-2"></i>
              <h5 className="card-title">Siteler</h5>
              <h2 className="card-text">{stats.totalSites}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card custom-card bg-success text-white">
            <div className="card-body text-center">
              <i className="bi bi-building-add fs-1 mb-2"></i>
              <h5 className="card-title">Firmalar</h5>
              <h2 className="card-text">{stats.totalCompanies}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card custom-card bg-info text-white">
            <div className="card-body text-center">
              <i className="bi bi-handshake fs-1 mb-2"></i>
              <h5 className="card-title">Aktif Anlaşma</h5>
              <h2 className="card-text">{stats.activeAgreements}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card custom-card bg-warning text-white">
            <div className="card-body text-center">
              <i className="bi bi-arrow-down-circle fs-1 mb-2"></i>
              <h5 className="card-title">Toplam Gelir</h5>
              <h3 className="card-text">{formatCurrency(stats.totalRevenue)}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card custom-card bg-danger text-white">
            <div className="card-body text-center">
              <i className="bi bi-arrow-up-circle fs-1 mb-2"></i>
              <h5 className="card-title">Toplam Gider</h5>
              <h3 className="card-text">{formatCurrency(stats.totalExpenses)}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card custom-card bg-secondary text-white">
            <div className="card-body text-center">
              <i className="bi bi-wallet2 fs-1 mb-2"></i>
              <h5 className="card-title">Net Bakiye</h5>
              <h3 className={`card-text ${stats.netBalance >= 0 ? 'text-white' : 'text-warning'}`}>
                {formatCurrency(stats.netBalance)}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <i className="bi bi-graph-up me-1"></i>
            Genel Bakış
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'sites' ? 'active' : ''}`}
            onClick={() => setActiveTab('sites')}
          >
            <i className="bi bi-building me-1"></i>
            Siteler
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'companies' ? 'active' : ''}`}
            onClick={() => setActiveTab('companies')}
          >
            <i className="bi bi-building-add me-1"></i>
            Firmalar
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'agreements' ? 'active' : ''}`}
            onClick={() => setActiveTab('agreements')}
          >
            <i className="bi bi-handshake me-1"></i>
            Anlaşmalar
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('transactions')}
          >
            <i className="bi bi-currency-dollar me-1"></i>
            İşlemler
          </button>
        </li>
      </ul>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="row g-4">
          {/* Recent Agreements */}
          <div className="col-md-6">
            <div className="card custom-card shadow-sm">
              <div className="card-header bg-info-subtle">
                <h5 className="mb-0 fw-bold">
                  <i className="bi bi-handshake me-2"></i>
                  Son Anlaşmalar
                </h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table custom-table">
                    <thead>
                      <tr>
                        <th>Firma</th>
                        <th>Site</th>
                        <th>Tutar</th>
                        <th>Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agreements.slice(0, 5).map((agreement) => (
                        <tr key={agreement.id}>
                          <td className="fw-medium">{getCompanyName(agreement.companyId)}</td>
                          <td>{agreement.siteIds ? agreement.siteIds.map(id => getSiteName(id)).join(', ') : '-'}</td>
                          <td>{formatCurrency(agreement.totalAmount || 0)}</td>
                          <td>
                            <span className={`badge ${agreement.status === 'active' ? 'bg-success-subtle text-success-emphasis' : 'bg-danger-subtle text-danger-emphasis'}`}>
                              {agreement.status === 'active' ? 'Aktif' : 'Pasif'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="col-md-6">
            <div className="card custom-card shadow-sm">
              <div className="card-header bg-warning-subtle">
                <h5 className="mb-0 fw-bold">
                  <i className="bi bi-currency-dollar me-2"></i>
                  Son İşlemler
                </h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table custom-table">
                    <thead>
                      <tr>
                        <th>Tarih</th>
                        <th>Tür</th>
                        <th>Tutar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .slice(0, 5)
                        .map((transaction) => (
                        <tr key={transaction.id}>
                          <td>{formatDate(transaction.date)}</td>
                          <td>
                            <span className={`badge ${transaction.type === 'income' ? 'bg-success-subtle text-success-emphasis' : 'bg-danger-subtle text-danger-emphasis'}`}>
                              {transaction.type === 'income' ? 'Gelir' : 'Gider'}
                            </span>
                          </td>
                          <td>
                            <span className={transaction.type === 'income' ? 'text-success' : 'text-danger'}>
                              {transaction.type === 'income' ? '+' : ''}{formatCurrency(transaction.amount)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sites' && (
        <div className="card custom-card shadow-sm">
          <div className="card-header bg-primary-subtle">
            <h5 className="mb-0 fw-bold">
              <i className="bi bi-building me-2"></i>
              Tüm Siteler
            </h5>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table custom-table">
                <thead>
                  <tr>
                    <th>Site Adı</th>
                    <th>Mahalle</th>
                    <th>Yönetici</th>
                    <th>Telefon</th>
                    <th>Blok Sayısı</th>
                    <th>Asansör/Blok</th>
                    <th>Panel Sayısı</th>
                    <th>Anlaşma Payı</th>
                  </tr>
                </thead>
                <tbody>
                  {sites.map((site) => (
                    <tr key={site.id}>
                      <td className="fw-medium">{site.name}</td>
                      <td>{site.neighborhood}</td>
                      <td>{site.manager}</td>
                      <td>{site.phone}</td>
                      <td>{site.blocks}</td>
                      <td>{site.elevatorsPerBlock}</td>
                      <td>{site.panels}</td>
                      <td>%{site.agreementPercentage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'companies' && (
        <div className="card custom-card shadow-sm">
          <div className="card-header bg-success-subtle">
            <h5 className="mb-0 fw-bold">
              <i className="bi bi-building-add me-2"></i>
              Tüm Firmalar
            </h5>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table custom-table">
                <thead>
                  <tr>
                    <th>Firma Adı</th>
                    <th>İletişim Kişisi</th>
                    <th>Telefon</th>
                    <th>E-posta</th>
                    <th>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((company) => (
                    <tr key={company.id}>
                      <td className="fw-medium">{company.name}</td>
                      <td>{company.contact}</td>
                      <td>{company.phone}</td>
                      <td>{company.email}</td>
                      <td>
                        <span className={`badge ${company.status === 'active' ? 'bg-success-subtle text-success-emphasis' : 'bg-danger-subtle text-danger-emphasis'}`}>
                          {company.status === 'active' ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'agreements' && (
        <div className="card custom-card shadow-sm">
          <div className="card-header bg-info-subtle">
            <h5 className="mb-0 fw-bold">
              <i className="bi bi-handshake me-2"></i>
              Tüm Anlaşmalar
            </h5>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table custom-table">
                <thead>
                  <tr>
                    <th>Firma</th>
                    <th>Siteler</th>
                    <th>Başlangıç</th>
                    <th>Bitiş</th>
                    <th>Panel Sayısı</th>
                    <th>Haftalık Ücret</th>
                    <th>Toplam Tutar</th>
                    <th>Durum</th>
                    <th>Ödeme</th>
                  </tr>
                </thead>
                <tbody>
                  {agreements.map((agreement) => (
                    <tr key={agreement.id}>
                      <td className="fw-medium">{getCompanyName(agreement.companyId)}</td>
                      <td>{agreement.siteIds ? agreement.siteIds.map(id => getSiteName(id)).join(', ') : '-'}</td>
                      <td>{formatDate(agreement.startDate)}</td>
                      <td>{formatDate(agreement.endDate)}</td>
                      <td>{agreement.totalPanels || 0}</td>
                      <td>{formatCurrency(agreement.weeklyRatePerPanel || 0)}</td>
                      <td>{formatCurrency(agreement.totalAmount || 0)}</td>
                      <td>
                        <span className={`badge ${agreement.status === 'active' ? 'bg-success-subtle text-success-emphasis' : 'bg-danger-subtle text-danger-emphasis'}`}>
                          {agreement.status === 'active' ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${agreement.isPaid ? 'bg-success-subtle text-success-emphasis' : 'bg-warning-subtle text-warning-emphasis'}`}>
                          {agreement.isPaid ? 'Ödendi' : 'Bekliyor'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="card custom-card shadow-sm">
          <div className="card-header bg-warning-subtle">
            <h5 className="mb-0 fw-bold">
              <i className="bi bi-currency-dollar me-2"></i>
              Tüm İşlemler
            </h5>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table custom-table">
                <thead>
                  <tr>
                    <th>Tarih</th>
                    <th>Tür</th>
                    <th>Kaynak</th>
                    <th>Açıklama</th>
                    <th>Tutar</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((transaction) => (
                    <tr key={transaction.id}>
                      <td>{formatDate(transaction.date)}</td>
                      <td>
                        <span className={`badge ${transaction.type === 'income' ? 'bg-success-subtle text-success-emphasis' : 'bg-danger-subtle text-danger-emphasis'}`}>
                          {transaction.type === 'income' ? 'Gelir' : 'Gider'}
                        </span>
                      </td>
                      <td className="fw-medium">{transaction.source}</td>
                      <td>{transaction.description}</td>
                      <td>
                        <span className={transaction.type === 'income' ? 'text-success' : 'text-danger'}>
                          {transaction.type === 'income' ? '+' : ''}{formatCurrency(transaction.amount)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ObserverDashboard;