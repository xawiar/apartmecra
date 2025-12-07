import React, { useState, useEffect, useMemo } from 'react';
import { getSites, getAgreements, createAgreement, updateAgreement, deleteAgreement } from '../services/api';
import { getUser } from '../utils/auth';
import { useNavigate } from 'react-router-dom';

const CompanyOrders = () => {
  const [sites, setSites] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState([]);
  const [selectedBusinessCenters, setSelectedBusinessCenters] = useState(false);
  const [dateRanges, setDateRanges] = useState([{ startDate: '', endDate: '' }]);
  const [orders, setOrders] = useState([]);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const user = getUser();
  const companyId = user?.companyId || user?.id;

  // Group sites by neighborhood
  const sitesByNeighborhood = useMemo(() => {
    const regularSites = sites.filter(s => s.siteType !== 'business_center' && s.status !== 'archived');
    const grouped = {};
    
    regularSites.forEach(site => {
      const neighborhood = site.neighborhood || 'Diğer';
      if (!grouped[neighborhood]) {
        grouped[neighborhood] = [];
      }
      grouped[neighborhood].push(site);
    });
    
    return grouped;
  }, [sites]);

  // Get business centers
  const businessCenters = useMemo(() => {
    return sites.filter(s => s.siteType === 'business_center' && s.status !== 'archived');
  }, [sites]);

  // Calculate total panels for selected neighborhoods
  const selectedSites = useMemo(() => {
    const sitesList = [];
    
    // Add sites from selected neighborhoods
    selectedNeighborhoods.forEach(neighborhood => {
      if (sitesByNeighborhood[neighborhood]) {
        sitesList.push(...sitesByNeighborhood[neighborhood]);
      }
    });
    
    // Add business centers if selected
    if (selectedBusinessCenters) {
      sitesList.push(...businessCenters);
    }
    
    return sitesList;
  }, [selectedNeighborhoods, selectedBusinessCenters, sitesByNeighborhood, businessCenters]);

  // Calculate total panels
  const totalPanels = useMemo(() => {
    return selectedSites.reduce((sum, site) => {
      if (site.siteType === 'business_center') {
        return sum + (parseInt(site.panels) || 0);
      } else {
        const blocks = parseInt(site.blocks) || 0;
        const elevatorsPerBlock = parseInt(site.elevatorsPerBlock) || 0;
        return sum + (blocks * elevatorsPerBlock * 2);
      }
    }, 0);
  }, [selectedSites]);

  // Calculate total weeks from date ranges
  const totalWeeks = useMemo(() => {
    return dateRanges.reduce((total, range) => {
      if (range.startDate && range.endDate) {
        const start = new Date(range.startDate);
        const end = new Date(range.endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const weeks = Math.ceil(diffDays / 7);
        return total + weeks;
      }
      return total;
    }, 0);
  }, [dateRanges]);

  // Calculate estimated budget (300 TL + KDV per panel per week)
  const estimatedBudget = useMemo(() => {
    const basePrice = 300;
    const kdvRate = 0.20; // 20% KDV
    const priceWithKdv = basePrice * (1 + kdvRate);
    return totalPanels * totalWeeks * priceWithKdv;
  }, [totalPanels, totalWeeks]);

  // Check if date ranges overlap with existing agreements
  const checkDateConflicts = (dateRanges) => {
    const conflicts = [];
    
    dateRanges.forEach((range, index) => {
      if (range.startDate && range.endDate) {
        const start = new Date(range.startDate);
        const end = new Date(range.endDate);
        
        // Only check active agreements
        agreements.filter(a => a.status === 'active').forEach(agreement => {
          // Check if agreement has dateRanges or single startDate/endDate
          if (agreement.dateRanges && agreement.dateRanges.length > 0) {
            agreement.dateRanges.forEach(agreementRange => {
              const agreementStart = new Date(agreementRange.startDate);
              const agreementEnd = new Date(agreementRange.endDate);
              
              if ((start <= agreementEnd && end >= agreementStart)) {
                conflicts.push({
                  rangeIndex: index,
                  agreementId: agreement.id,
                  conflictRange: agreementRange
                });
              }
            });
          } else if (agreement.startDate && agreement.endDate) {
            const agreementStart = new Date(agreement.startDate);
            const agreementEnd = new Date(agreement.endDate);
            
            if ((start <= agreementEnd && end >= agreementStart)) {
              conflicts.push({
                rangeIndex: index,
                agreementId: agreement.id,
                conflictRange: { startDate: agreement.startDate, endDate: agreement.endDate }
              });
            }
          }
        });
      }
    });
    
    return conflicts;
  };

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [allSites, allAgreements] = await Promise.all([
          getSites(),
          getAgreements()
        ]);
        
        // Filter agreements for this company
        const companyAgreements = allAgreements.filter(agreement => 
          String(agreement.companyId) === String(companyId)
        );
        
        // Remove duplicate sites (by id or _docId)
        const uniqueSites = allSites.filter((site, index, self) => 
          index === self.findIndex(s => 
            (s.id === site.id && s._docId === site._docId) ||
            (s.id && site.id && String(s.id) === String(site.id)) ||
            (s._docId && site._docId && s._docId === site._docId)
          )
        );
        
        setSites(uniqueSites);
        setAgreements(companyAgreements);
        
        // Load orders (all company agreements, can filter by isOrder flag if needed)
        setOrders(companyAgreements);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (companyId) {
      loadData();
    }
  }, [companyId]);

  // Handle neighborhood selection
  const handleNeighborhoodToggle = (neighborhood) => {
    setSelectedNeighborhoods(prev => {
      if (prev.includes(neighborhood)) {
        return prev.filter(n => n !== neighborhood);
      } else {
        return [...prev, neighborhood];
      }
    });
  };

  // Handle business centers toggle
  const handleBusinessCentersToggle = () => {
    setSelectedBusinessCenters(prev => !prev);
  };

  // Add date range
  const handleAddDateRange = () => {
    setDateRanges([...dateRanges, { startDate: '', endDate: '' }]);
  };

  // Remove date range
  const handleRemoveDateRange = (index) => {
    if (dateRanges.length > 1) {
      setDateRanges(dateRanges.filter((_, i) => i !== index));
    }
  };

  // Update date range
  const handleDateRangeChange = (index, field, value) => {
    const updated = [...dateRanges];
    updated[index][field] = value;
    setDateRanges(updated);
  };

  // Create order
  const handleCreateOrder = async () => {
    if (selectedSites.length === 0) {
      if (window.showAlert) {
        window.showAlert('Uyarı', 'Lütfen en az bir mahalle veya iş merkezi seçin.', 'warning');
      }
      return;
    }

    // Check for date conflicts
    const conflicts = checkDateConflicts(dateRanges);
    if (conflicts.length > 0) {
      if (window.showAlert) {
        window.showAlert('Hata', 'Seçilen tarih aralıklarında mevcut anlaşmalar bulunmaktadır. Lütfen farklı tarihler seçin.', 'error');
      }
      return;
    }

    // Validate date ranges
    const invalidRanges = dateRanges.filter(r => !r.startDate || !r.endDate);
    if (invalidRanges.length > 0) {
      if (window.showAlert) {
        window.showAlert('Uyarı', 'Lütfen tüm tarih aralıklarını doldurun.', 'warning');
      }
      return;
    }

    try {
      // Prepare agreement data
      const siteIds = selectedSites.map(s => s.id);
      
      // Calculate panel counts for each site
      const sitePanelCounts = {};
      selectedSites.forEach(site => {
        if (site.siteType === 'business_center') {
          sitePanelCounts[site.id] = parseInt(site.panels) || 0;
        } else {
          const blocks = parseInt(site.blocks) || 0;
          const elevatorsPerBlock = parseInt(site.elevatorsPerBlock) || 0;
          sitePanelCounts[site.id] = blocks * elevatorsPerBlock * 2;
        }
      });

      // For now, select all blocks and panels (simplified)
      const siteBlockSelections = {};
      const sitePanelSelections = {};
      
      selectedSites.forEach(site => {
        if (site.siteType === 'business_center') {
          siteBlockSelections[site.id] = [`${site.id}-block-A`];
          const panelCount = parseInt(site.panels) || 0;
          sitePanelSelections[site.id] = {
            [`${site.id}-block-A`]: Array.from({ length: panelCount }, (_, i) => `panel-${i + 1}`)
          };
        } else {
          const blocks = parseInt(site.blocks) || 0;
          const elevatorsPerBlock = parseInt(site.elevatorsPerBlock) || 0;
          const blockLabels = Array.from({ length: blocks }, (_, i) => String.fromCharCode(65 + i));
          siteBlockSelections[site.id] = blockLabels.map(label => `${site.id}-block-${label}`);
          sitePanelSelections[site.id] = {};
          blockLabels.forEach(label => {
            const panelCount = elevatorsPerBlock * 2;
            sitePanelSelections[site.id][`${site.id}-block-${label}`] = Array.from({ length: panelCount }, (_, i) => `panel-${i + 1}`);
          });
        }
      });

      const agreementData = {
        companyId: companyId,
        siteIds: siteIds,
        dateRanges: dateRanges,
        startDate: dateRanges[0].startDate, // For backward compatibility
        endDate: dateRanges[dateRanges.length - 1].endDate, // For backward compatibility
        sitePanelCounts: sitePanelCounts,
        siteBlockSelections: siteBlockSelections,
        sitePanelSelections: sitePanelSelections,
        totalWeeks: totalWeeks,
        totalPanels: totalPanels,
        weeklyRatePerPanel: 300,
        totalAmount: estimatedBudget,
        status: 'pending', // Order status
        isOrder: true // Flag to identify orders
      };

      const result = await createAgreement(agreementData);
      
      if (result) {
        setOrders([...orders, result]);
        // Reset form
        setSelectedNeighborhoods([]);
        setSelectedBusinessCenters(false);
        setDateRanges([{ startDate: '', endDate: '' }]);
        
        if (window.showAlert) {
          window.showAlert('Başarılı', 'Sipariş başarıyla oluşturuldu!', 'success');
        }
      }
    } catch (error) {
      console.error('Error creating order:', error);
      if (window.showAlert) {
        window.showAlert('Hata', 'Sipariş oluşturulurken bir hata oluştu.', 'error');
      }
    }
  };

  // Show order details
  const handleShowOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  // Delete order
  const handleDeleteOrder = async (order) => {
    if (window.showConfirm) {
      const confirmed = await window.showConfirm(
        'Siparişi Sil',
        'Bu siparişi silmek istediğinize emin misiniz?',
        'warning'
      );
      if (!confirmed) return;
    }

    try {
      await deleteAgreement(order.id);
      setOrders(orders.filter(o => o.id !== order.id));
      
      if (window.showAlert) {
        window.showAlert('Başarılı', 'Sipariş başarıyla silindi!', 'success');
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      if (window.showAlert) {
        window.showAlert('Hata', 'Sipariş silinirken bir hata oluştu.', 'error');
      }
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
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

  if (!user) {
    navigate('/');
    return null;
  }

  const dateConflicts = checkDateConflicts(dateRanges);

  return (
    <div className="container-fluid">
      <div className="row">
        {/* Left Sidebar - Menu */}
        <div className={`col-md-3 ${sidebarOpen ? '' : 'd-none'}`}>
          <div className="card custom-card shadow-sm sticky-top" style={{ top: '20px', maxHeight: 'calc(100vh - 40px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="card-header bg-primary-subtle d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-menu-button-wide me-2"></i>
                Menü
              </h5>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setSidebarOpen(false)}
                title="Menüyü Kapat"
              >
                <i className="bi bi-chevron-left"></i>
              </button>
            </div>
            <div className="card-body p-0" style={{ overflowY: 'auto', flex: 1 }}>
              <div className="list-group list-group-flush">
                <button
                  type="button"
                  className={`list-group-item list-group-item-action ${window.location.pathname === '/company-dashboard' ? 'active' : ''}`}
                  onClick={() => navigate('/company-dashboard')}
                >
                  <i className="bi bi-speedometer2 me-2"></i>
                  Firma Panosu
                </button>
                <button
                  type="button"
                  className={`list-group-item list-group-item-action ${window.location.pathname === '/company-orders' ? 'active' : ''}`}
                  onClick={() => navigate('/company-orders')}
                >
                  <i className="bi bi-cart-plus me-2"></i>
                  Sipariş Oluştur
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className={sidebarOpen ? 'col-md-9' : 'col-md-12'}>
          {/* Sidebar Toggle Button (when closed) */}
          {!sidebarOpen && (
            <button
              className="btn btn-outline-primary mb-3"
              onClick={() => setSidebarOpen(true)}
            >
              <i className="bi bi-list me-2"></i>
              Menüyü Aç
            </button>
          )}

          <div className="row">
            {/* Left Sidebar - Neighborhoods and Business Centers */}
            <div className="col-md-5">
          <div className="card custom-card shadow-sm sticky-top" style={{ top: '20px', maxHeight: 'calc(100vh - 40px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="card-header bg-primary-subtle">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-building me-2"></i>
                Mahalleler ve İş Merkezleri
              </h5>
            </div>
            <div className="card-body p-0" style={{ overflowY: 'auto', flex: 1 }}>
              {/* Regular Sites by Neighborhood */}
              <div className="p-3">
                <h6 className="fw-bold mb-3">Mahalleler</h6>
                {Object.keys(sitesByNeighborhood).length > 0 ? (
                  <div className="list-group list-group-flush">
                    {Object.keys(sitesByNeighborhood).sort().map(neighborhood => {
                      const neighborhoodSites = sitesByNeighborhood[neighborhood];
                      const totalPanelsInNeighborhood = neighborhoodSites.reduce((sum, site) => {
                        const blocks = parseInt(site.blocks) || 0;
                        const elevatorsPerBlock = parseInt(site.elevatorsPerBlock) || 0;
                        return sum + (blocks * elevatorsPerBlock * 2);
                      }, 0);
                      const isSelected = selectedNeighborhoods.includes(neighborhood);
                      
                      return (
                        <div key={neighborhood} className="list-group-item">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleNeighborhoodToggle(neighborhood)}
                              id={`neighborhood-${neighborhood}`}
                            />
                            <label className="form-check-label w-100" htmlFor={`neighborhood-${neighborhood}`}>
                              <div className="d-flex justify-content-between align-items-center">
                                <span className="fw-bold">{neighborhood}</span>
                                <span className="badge bg-primary">{neighborhoodSites.length} Site</span>
                              </div>
                              <small className="text-muted d-block">
                                Toplam Panel: {totalPanelsInNeighborhood}
                              </small>
                              <div className="mt-2">
                                {neighborhoodSites.map(site => (
                                  <div key={site.id} className="small text-muted ms-3">
                                    • {site.name} ({site.siteType === 'business_center' ? parseInt(site.panels) || 0 : (parseInt(site.blocks) || 0) * (parseInt(site.elevatorsPerBlock) || 0) * 2} panel)
                                  </div>
                                ))}
                              </div>
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted">Henüz site bulunmamaktadır</p>
                )}
              </div>

              {/* Business Centers */}
              {businessCenters.length > 0 && (
                <div className="p-3 border-top">
                  <h6 className="fw-bold mb-3">İş Merkezleri</h6>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={selectedBusinessCenters}
                      onChange={handleBusinessCentersToggle}
                      id="business-centers"
                    />
                    <label className="form-check-label w-100" htmlFor="business-centers">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="fw-bold">Tüm İş Merkezleri</span>
                        <span className="badge bg-info">{businessCenters.length} İş Merkezi</span>
                      </div>
                      <small className="text-muted d-block">
                        Toplam Panel: {businessCenters.reduce((sum, site) => sum + (parseInt(site.panels) || 0), 0)}
                      </small>
                      <div className="mt-2">
                        {businessCenters.map(site => (
                          <div key={site.id} className="small text-muted ms-3">
                            • {site.name} ({parseInt(site.panels) || 0} panel)
                          </div>
                        ))}
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
            </div>

            {/* Main Content */}
            <div className="col-md-7">
          {/* Order Creation Form */}
          <div className="card custom-card shadow-sm mb-4">
            <div className="card-header bg-success-subtle">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-cart-plus me-2"></i>
                Yeni Sipariş Oluştur
              </h5>
            </div>
            <div className="card-body">
              {/* Selected Summary */}
              {selectedSites.length > 0 && (
                <div className="alert alert-info">
                  <strong>Seçilen:</strong> {selectedSites.length} site, {totalPanels} panel
                </div>
              )}

              {/* Date Ranges */}
              <div className="mb-3">
                <label className="form-label fw-bold">Tarih Aralıkları</label>
                {dateRanges.map((range, index) => (
                  <div key={index} className="row g-2 mb-2">
                    <div className="col-md-5">
                      <input
                        type="date"
                        className="form-control"
                        value={range.startDate}
                        onChange={(e) => handleDateRangeChange(index, 'startDate', e.target.value)}
                        placeholder="Başlangıç Tarihi"
                      />
                    </div>
                    <div className="col-md-5">
                      <input
                        type="date"
                        className="form-control"
                        value={range.endDate}
                        onChange={(e) => handleDateRangeChange(index, 'endDate', e.target.value)}
                        placeholder="Bitiş Tarihi"
                      />
                    </div>
                    <div className="col-md-2">
                      {dateRanges.length > 1 && (
                        <button
                          className="btn btn-outline-danger w-100"
                          onClick={() => handleRemoveDateRange(index)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={handleAddDateRange}
                >
                  <i className="bi bi-plus-circle me-1"></i>
                  Tarih Aralığı Ekle
                </button>
              </div>

              {/* Date Conflict Warning */}
              {dateConflicts.length > 0 && (
                <div className="alert alert-warning">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  <strong>Uyarı:</strong> Seçilen tarih aralıklarında mevcut anlaşmalar bulunmaktadır. Lütfen farklı tarihler seçin.
                </div>
              )}

              {/* Estimated Budget */}
              {totalPanels > 0 && totalWeeks > 0 && (
                <div className="card bg-light mb-3">
                  <div className="card-body">
                    <h6 className="fw-bold">Tahmini Bütçe</h6>
                    <div className="row">
                      <div className="col-md-6">
                        <small className="text-muted">Panel Sayısı:</small>
                        <div className="fw-bold">{totalPanels} panel</div>
                      </div>
                      <div className="col-md-6">
                        <small className="text-muted">Toplam Hafta:</small>
                        <div className="fw-bold">{totalWeeks} hafta</div>
                      </div>
                      <div className="col-md-12 mt-2">
                        <small className="text-muted">Birim Fiyat (KDV Dahil):</small>
                        <div className="fw-bold">360 TL / panel / hafta</div>
                      </div>
                      <div className="col-md-12 mt-2 border-top pt-2">
                        <small className="text-muted">Toplam Tahmini Tutar:</small>
                        <div className="fw-bold fs-4 text-success">{formatCurrency(estimatedBudget)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Create Order Button */}
              <button
                className="btn btn-primary w-100"
                onClick={handleCreateOrder}
                disabled={selectedSites.length === 0 || dateConflicts.length > 0}
              >
                <i className="bi bi-check-circle me-2"></i>
                Sipariş Oluştur
              </button>
            </div>
          </div>

          {/* Orders List */}
          <div className="card custom-card shadow-sm">
            <div className="card-header bg-primary-subtle">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-list-ul me-2"></i>
                Siparişlerim ({orders.length})
              </h5>
            </div>
            <div className="card-body">
              {orders.length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-cart-x text-muted fs-1"></i>
                  <p className="text-muted mt-2">Henüz sipariş bulunmamaktadır</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table custom-table">
                    <thead>
                      <tr>
                        <th>Tarih Aralığı</th>
                        <th>Site Sayısı</th>
                        <th>Panel Sayısı</th>
                        <th>Toplam Hafta</th>
                        <th>Tutar</th>
                        <th>Durum</th>
                        <th>İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order => (
                        <tr key={order.id}>
                          <td>
                            {order.dateRanges && order.dateRanges.length > 0 ? (
                              order.dateRanges.map((range, idx) => (
                                <div key={idx}>
                                  {formatDate(range.startDate)} - {formatDate(range.endDate)}
                                </div>
                              ))
                            ) : (
                              <div>
                                {formatDate(order.startDate)} - {formatDate(order.endDate)}
                              </div>
                            )}
                          </td>
                          <td>{order.siteIds?.length || 0}</td>
                          <td>{order.totalPanels || Object.values(order.sitePanelCounts || {}).reduce((sum, count) => sum + parseInt(count || 0), 0)}</td>
                          <td>{order.totalWeeks || 0}</td>
                          <td className="fw-bold">{formatCurrency(order.totalAmount || 0)}</td>
                          <td>
                            <span className={`badge ${
                              order.status === 'active' ? 'bg-success' : 
                              order.status === 'pending' ? 'bg-warning' : 'bg-secondary'
                            }`}>
                              {order.status === 'active' ? 'Aktif' : 
                               order.status === 'pending' ? 'Beklemede' : 'Pasif'}
                            </span>
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-outline-primary"
                                onClick={() => handleShowOrder(order)}
                                title="Detayları Göster"
                              >
                                <i className="bi bi-eye"></i>
                              </button>
                              <button
                                className="btn btn-outline-danger"
                                onClick={() => handleDeleteOrder(order)}
                                title="Sil"
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-file-earmark-text me-2"></i>
                  Sipariş Detayları
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowOrderModal(false);
                    setSelectedOrder(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <strong>Sipariş ID:</strong> {selectedOrder.id}
                  </div>
                  <div className="col-md-6">
                    <strong>Durum:</strong>{' '}
                    <span className={`badge ${
                      selectedOrder.status === 'active' ? 'bg-success' : 
                      selectedOrder.status === 'pending' ? 'bg-warning' : 'bg-secondary'
                    }`}>
                      {selectedOrder.status === 'active' ? 'Aktif' : 
                       selectedOrder.status === 'pending' ? 'Beklemede' : 'Pasif'}
                    </span>
                  </div>
                  <div className="col-md-12">
                    <strong>Tarih Aralıkları:</strong>
                    <div className="mt-2">
                      {selectedOrder.dateRanges && selectedOrder.dateRanges.length > 0 ? (
                        selectedOrder.dateRanges.map((range, idx) => (
                          <div key={idx} className="badge bg-info me-2">
                            {formatDate(range.startDate)} - {formatDate(range.endDate)}
                          </div>
                        ))
                      ) : (
                        <div className="badge bg-info">
                          {formatDate(selectedOrder.startDate)} - {formatDate(selectedOrder.endDate)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <strong>Toplam Panel:</strong> {selectedOrder.totalPanels || Object.values(selectedOrder.sitePanelCounts || {}).reduce((sum, count) => sum + parseInt(count || 0), 0)}
                  </div>
                  <div className="col-md-6">
                    <strong>Toplam Hafta:</strong> {selectedOrder.totalWeeks || 0}
                  </div>
                  <div className="col-md-6">
                    <strong>Birim Fiyat:</strong> {formatCurrency(selectedOrder.weeklyRatePerPanel || 300)} / panel / hafta
                  </div>
                  <div className="col-md-6">
                    <strong>Toplam Tutar:</strong> <span className="fw-bold text-success">{formatCurrency(selectedOrder.totalAmount || 0)}</span>
                  </div>
                  <div className="col-md-12">
                    <strong>Siteler:</strong>
                    <div className="mt-2">
                      {selectedOrder.siteIds?.map(siteId => {
                        const site = sites.find(s => String(s.id) === String(siteId));
                        const panelCount = selectedOrder.sitePanelCounts?.[siteId] || 0;
                        return (
                          <div key={siteId} className="badge bg-secondary me-2 mb-2">
                            {site?.name || siteId} ({panelCount} panel)
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowOrderModal(false);
                    setSelectedOrder(null);
                  }}
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

export default CompanyOrders;

