import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardSummary, getRecentTransactions } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState({
    activeSites: 0,
    activeCompanies: 0,
    activeAgreements: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    netCash: 0
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryData, transactionsData] = await Promise.all([
          getDashboardSummary(),
          getRecentTransactions()
        ]);
        
        setSummary(summaryData);
        setTransactions(transactionsData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Format currency
  const formatCurrency = (amount) => {
    if (isNaN(amount) || amount === null || amount === undefined) {
      return '₺0,00';
    }
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  // Handle activity click
  const handleActivityClick = (activityType) => {
    switch(activityType) {
      case 'agreement':
        navigate('/agreements');
        break;
      case 'cashier':
        navigate('/cashier');
        break;
      case 'sites':
        navigate('/sites');
        break;
      case 'companies':
        navigate('/companies');
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-3 text-muted">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Header Section */}
      <div className="page-header mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 className="h3 fw-bold mb-1">Yönetim Paneli</h2>
            <p className="mb-0">Sistem durumu ve son aktiviteler</p>
          </div>
          <div className="d-flex align-items-center">
            <div className="me-3 text-end">
              <p className="mb-0 small" style={{opacity: 0.9}}>Hoş geldiniz</p>
              <p className="mb-0 fw-medium">Yönetici</p>
            </div>
            <div className="rounded-circle bg-white bg-opacity-25 d-flex align-items-center justify-content-center" 
                 style={{ width: '40px', height: '40px' }}>
              <i className="bi bi-person text-white"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row mb-4 g-4">
        <div className="col-md-3">
          <div className="page-stats-card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center" 
                     style={{ width: '48px', height: '48px' }}>
                  <i className="bi bi-geo-alt text-primary fs-4"></i>
                </div>
                <div className="text-end">
                  <p className="mb-0 small text-muted">Toplam Site</p>
                  <h3 className="mb-0 fw-bold text-dark">{summary.activeSites}</h3>
                </div>
              </div>
              <div className="progress" style={{ height: '4px' }}>
                <div className="progress-bar bg-primary" role="progressbar" style={{ width: '75%' }}></div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="page-stats-card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center" 
                     style={{ width: '48px', height: '48px' }}>
                  <i className="bi bi-building text-success fs-4"></i>
                </div>
                <div className="text-end">
                  <p className="mb-0 small text-muted">Aktif Firma</p>
                  <h3 className="mb-0 fw-bold text-dark">{summary.activeCompanies}</h3>
                </div>
              </div>
              <div className="progress" style={{ height: '4px' }}>
                <div className="progress-bar bg-success" role="progressbar" style={{ width: '60%' }}></div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="page-stats-card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="rounded-circle bg-info bg-opacity-10 d-flex align-items-center justify-content-center" 
                     style={{ width: '48px', height: '48px' }}>
                  <i className="bi bi-file-text text-info fs-4"></i>
                </div>
                <div className="text-end">
                  <p className="mb-0 small text-muted">Aktif Anlaşma</p>
                  <h3 className="mb-0 fw-bold text-dark">{summary.activeAgreements}</h3>
                </div>
              </div>
              <div className="progress" style={{ height: '4px' }}>
                <div className="progress-bar bg-info" role="progressbar" style={{ width: '85%' }}></div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="page-stats-card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="rounded-circle bg-warning bg-opacity-10 d-flex align-items-center justify-content-center" 
                     style={{ width: '48px', height: '48px' }}>
                  <i className="bi bi-cash-stack text-warning fs-4"></i>
                </div>
                <div className="text-end">
                  <p className="mb-0 small text-muted">Kasa Bakiyesi</p>
                  <h3 className="mb-0 fw-bold text-dark">{formatCurrency(summary.netCash)}</h3>
                </div>
              </div>
              <div className="progress" style={{ height: '4px' }}>
                <div className="progress-bar bg-warning" role="progressbar" style={{ width: '50%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="row mb-4 g-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
            <div className="card-header bg-white border-0 py-3">
              <h5 className="mb-0 fw-bold text-dark">Hızlı İşlemler</h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                {/* Add Income */}
                <div className="col-md-3 col-6">
                  <div className="card border-0 shadow-sm h-100 quick-action-card" 
                       style={{ borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                       onClick={() => navigate('/cashier')}>
                    <div className="card-body text-center py-4">
                      <div className="rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center mx-auto mb-3" 
                           style={{ width: '50px', height: '50px' }}>
                        <i className="bi bi-plus-circle text-success fs-4"></i>
                      </div>
                      <h6 className="mb-0 fw-medium">Gelir Ekle</h6>
                    </div>
                  </div>
                </div>
                
                {/* Add Expense */}
                <div className="col-md-3 col-6">
                  <div className="card border-0 shadow-sm h-100 quick-action-card" 
                       style={{ borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                       onClick={() => navigate('/cashier')}>
                    <div className="card-body text-center py-4">
                      <div className="rounded-circle bg-danger bg-opacity-10 d-flex align-items-center justify-content-center mx-auto mb-3" 
                           style={{ width: '50px', height: '50px' }}>
                        <i className="bi bi-dash-circle text-danger fs-4"></i>
                      </div>
                      <h6 className="mb-0 fw-medium">Gider Ekle</h6>
                    </div>
                  </div>
                </div>
                
                {/* Add Agreement */}
                <div className="col-md-3 col-6">
                  <div className="card border-0 shadow-sm h-100 quick-action-card" 
                       style={{ borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                       onClick={() => navigate('/agreements')}>
                    <div className="card-body text-center py-4">
                      <div className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center mx-auto mb-3" 
                           style={{ width: '50px', height: '50px' }}>
                        <i className="bi bi-file-earmark-text text-primary fs-4"></i>
                      </div>
                      <h6 className="mb-0 fw-medium">Anlaşma Ekle</h6>
                    </div>
                  </div>
                </div>
                
                {/* Add Site */}
                <div className="col-md-3 col-6">
                  <div className="card border-0 shadow-sm h-100 quick-action-card" 
                       style={{ borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                       onClick={() => navigate('/sites')}>
                    <div className="card-body text-center py-4">
                      <div className="rounded-circle bg-info bg-opacity-10 d-flex align-items-center justify-content-center mx-auto mb-3" 
                           style={{ width: '50px', height: '50px' }}>
                        <i className="bi bi-geo-alt text-info fs-4"></i>
                      </div>
                      <h6 className="mb-0 fw-medium">Site Ekle</h6>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;