import React, { useState, useEffect } from 'react';
import { getPartners, createPartner, updatePartner, deletePartner } from '../services/api';
import { getTransactions } from '../services/api';
import { createLog } from '../services/api';

const PartnerShares = () => {
  const [partners, setPartners] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDistributionForm, setShowDistributionForm] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [editingPartner, setEditingPartner] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    sharePercentage: ''
    // Removed amountOwed and lastPaymentDate fields
  });
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  
  // State for custom alert modals
  const [alertModal, setAlertModal] = useState({
    show: false,
    title: '',
    message: '',
    type: 'info' // info, success, warning, error
  });

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const partnersData = await getPartners();
        setPartners(partnersData);
      } catch (error) {
        console.error('Error fetching partners:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPartners();
  }, []);

  // Function to show payment history for a partner
  const handleShowPaymentHistory = async (partner) => {
    setSelectedPartner(partner);
    setShowPaymentHistory(true);
    
    // Fetch transactions if not already loaded
    if (transactions.length === 0) {
      try {
        const transactionsData = await getTransactions();
        setTransactions(transactionsData);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      }
    }
  };

  const handleClosePaymentHistory = () => {
    setShowPaymentHistory(false);
    setSelectedPartner(null);
  };

  const handleAddPartner = () => {
    setFormData({
      name: '',
      sharePercentage: ''
      // Removed amountOwed and lastPaymentDate fields
    });
    setEditingPartner(null);
    setShowAddForm(true);
  };

  const handleEditPartner = (partner) => {
    setFormData({
      name: partner.name || '',
      sharePercentage: partner.sharePercentage || ''
      // Removed amountOwed and lastPaymentDate fields
    });
    setEditingPartner(partner);
    setShowAddForm(true);
  };

  const handleDeletePartner = async (partnerId) => {
    const result = await window.showConfirm(
      'Ortak Silme',
      'Bu ortağı silmek istediğinize emin misiniz?',
      'warning'
    );
    
    if (result) {
      try {
        const success = await deletePartner(partnerId);
        if (success) {
          setPartners(partners.filter(partner => partner.id !== partnerId));
          // Log the action
          await createLog({
            user: 'Admin',
            action: `Ortak silindi: ${partners.find(p => p.id === partnerId)?.name || 'Bilinmeyen Ortak'}`
          });
        } else {
          await window.showAlert(
            'Hata',
            'Ortak silinirken bir hata oluştu.',
            'error'
          );
        }
      } catch (error) {
        console.error('Error deleting partner:', error);
        await window.showAlert(
          'Hata',
          'Ortak silinirken bir hata oluştu.',
          'error'
        );
      }
    }
  };

  const handleCloseForms = () => {
    setShowAddForm(false);
    setShowDistributionForm(false);
    setEditingPartner(null);
    setPaymentSuccess(null);
  };

  const handleDistributePayments = () => {
    setShowDistributionForm(true);
  };

  // Updated function to handle payment distribution
  const handleMakePayment = async () => {
    // Close the payment window immediately
    setShowDistributionForm(false);
    
    // Calculate total cash balance
    const totalCashBalance = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    
    // Check if there's money in the cashier
    if (totalCashBalance <= 0) {
      await window.showAlert(
        'Ödeme Yapılamıyor',
        'Kasada para bulunmamaktadır. Ödeme dağıtılamaz.',
        'warning'
      );
      return;
    }
    
    // In a real app, this would connect to a payment API
    // For now, we'll just show a success message
    setPaymentSuccess(true);
    setTimeout(() => {
      setPaymentSuccess(null);
    }, 3000);
    
    // Log the action
    await createLog({
      user: 'Admin',
      action: 'Ortak ödemesi dağıtıldı'
    });
    
    await window.showAlert(
      'Başarılı',
      'Ortak ödemeleri başarıyla dağıtıldı.',
      'success'
    );
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (!formData.name || !formData.sharePercentage) {
      await window.showAlert(
        'Eksik Bilgi',
        'Lütfen zorunlu alanları doldurunuz.',
        'warning'
      );
      return;
    }
    
    try {
      if (editingPartner) {
        // Update existing partner
        const updatedPartner = await updatePartner(editingPartner.id, formData);
        if (updatedPartner) {
          setPartners(partners.map(partner => partner.id === editingPartner.id ? updatedPartner : partner));
          setShowAddForm(false);
          setEditingPartner(null);
          // Log the action
          await createLog({
            user: 'Admin',
            action: `Ortak güncellendi: ${formData.name}`
          });
          
          await window.showAlert(
            'Başarılı',
            'Ortak başarıyla güncellendi.',
            'success'
          );
        }
      } else {
        // Create new partner
        const newPartner = await createPartner(formData);
        if (newPartner) {
          setPartners([...partners, newPartner]);
          setShowAddForm(false);
          // Log the action
          await createLog({
            user: 'Admin',
            action: `Yeni ortak eklendi: ${formData.name}`
          });
          
          await window.showAlert(
            'Başarılı',
            'Yeni ortak başarıyla eklendi.',
            'success'
          );
        }
      }
    } catch (error) {
      console.error('Error saving partner:', error);
      await window.showAlert(
        'Hata',
        'Ortak kaydedilirken bir hata oluştu.',
        'error'
      );
    }
  };

  // Get payments for a specific partner
  const getPartnerPayments = () => {
    if (!selectedPartner) return [];
    
    return transactions.filter(transaction => 
      transaction.type === 'expense' && 
      transaction.source === `Ortak Ödemesi - ${selectedPartner.name}`
    );
  };

  // Calculate total payments for a partner
  const getTotalPartnerPayments = () => {
    return getPartnerPayments().reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
  };

  // Calculate total cash balance (net amount in cashier)
  const getTotalCashBalance = () => {
    return transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  };

  // Function to show custom alert modals
  const showAlertModal = (title, message, type = 'info') => {
    setAlertModal({
      show: true,
      title,
      message,
      type
    });
  };

  // Function to close alert modal
  const closeAlertModal = () => {
    setAlertModal({
      show: false,
      title: '',
      message: '',
      type: 'info'
    });
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
          <p className="mt-3 text-muted">Ortaklar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="page-header mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <h2 className="h3 fw-bold mb-0">Ortak Payları</h2>
          <button 
            onClick={handleAddPartner}
            className="btn btn-page-primary btn-icon d-flex align-items-center"
          >
            <i className="bi bi-plus-lg me-1"></i>
            Ortak Ekle
          </button>
        </div>
      </div>

      <div className="row">
        {/* Partners Table - Now full width */}
        <div className="col-12 mb-4">
          <div className="card custom-card shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="card-title mb-0">Ortaklar</h5>
              </div>
              
              {/* Kasadaki Güncel Tutar (Current Cash in Cashier) Section */}
              <div className="alert alert-primary mb-4">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-bold">Kasadaki Güncel Tutar:</span>
                  <span className="fw-bold fs-5">{formatCurrency(getTotalCashBalance())}</span>
                </div>
                <small className="text-muted">
                  Dağıtılabilecek tutar: {formatCurrency(getTotalCashBalance())}
                </small>
              </div>
              
              <div className="table-responsive">
                <table className="table custom-table">
                  <thead>
                    <tr>
                      <th>Ortak Adı</th>
                      <th>Pay (%)</th>
                      <th>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partners.map((partner) => (
                      <tr key={partner.id}>
                        <td className="fw-medium">{partner.name}</td>
                        <td>{partner.sharePercentage}%</td>
                        <td>
                          <div className="d-flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedPartner(partner);
                                setShowPaymentHistory(true);
                              }}
                              className="btn btn-sm btn-outline-info"
                              title="Göster"
                            >
                              <i className="bi bi-eye"></i>
                            </button>
                            <button
                              onClick={() => handleEditPartner(partner)}
                              className="btn btn-sm btn-outline-secondary"
                              title="Düzenle"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              onClick={() => handleDeletePartner(partner.id)}
                              className="btn btn-sm btn-outline-danger"
                              title="Sil"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {partners.length === 0 && (
                      <tr>
                        <td colSpan="3" className="text-center py-5">
                          <div className="empty-state">
                            <i className="bi bi-people"></i>
                            <p className="mb-3">Henüz ortak bulunmamaktadır.</p>
                            <button 
                              onClick={handleAddPartner}
                              className="btn btn-primary-gradient"
                            >
                              Ortak Ekle
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

      {/* Add/Edit Partner Form Modal */}
      {showAddForm && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingPartner ? 'Ortak Düzenle' : 'Yeni Ortak Ekle'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseForms}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleFormSubmit}>
                  <div className="mb-3">
                    <label htmlFor="name" className="form-label">Ortak Adı *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleFormChange}
                      className="form-control form-control-custom"
                      placeholder="Ortak adını girin"
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="sharePercentage" className="form-label">Pay (%) *</label>
                    <input
                      type="number"
                      id="sharePercentage"
                      name="sharePercentage"
                      value={formData.sharePercentage}
                      onChange={handleFormChange}
                      className="form-control form-control-custom"
                      min="0"
                      max="100"
                      placeholder="0-100 arası"
                    />
                  </div>
                  
                  {/* Removed Alacak (₺) and Son Ödeme Tarihi fields */}
                  
                  <div className="d-flex justify-content-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        handleCloseForms();
                      }}
                      className="btn btn-secondary"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary-gradient"
                      onClick={() => {
                        // Close form immediately after submission
                        setTimeout(() => {
                          handleCloseForms();
                        }, 100);
                      }}
                    >
                      {editingPartner ? 'Güncelle' : 'Ekle'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Distribution Form Modal */}
      {showDistributionForm && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Ödeme Dağıtımı</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseForms}
                ></button>
              </div>
              <div className="modal-body">
                {/* Dağıtılabilecek Tutar (Distributable Amount) */}
                <div className="alert alert-info mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-bold">Dağıtılabilecek Tutar:</span>
                    <span className="fw-bold fs-5">{formatCurrency(getTotalCashBalance())}</span>
                  </div>
                  <small className="text-muted">
                    Kasadaki net tutar: {formatCurrency(getTotalCashBalance())}
                  </small>
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Dağıtım Miktarı (₺)</label>
                  <input
                    type="number"
                    className="form-control form-control-custom"
                    min="0"
                    step="0.01"
                    placeholder="Dağıtılacak miktarı girin"
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Notlar</label>
                  <textarea
                    className="form-control form-control-custom"
                    rows="3"
                    placeholder="Ödeme ile ilgili notlar..."
                  ></textarea>
                </div>
                
                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleCloseForms();
                    }}
                    className="btn btn-secondary"
                  >
                    İptal
                  </button>
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={() => {
                      handleMakePayment();
                      handleCloseForms();
                    }}
                  >
                    <i className="bi bi-currency-dollar me-1"></i>
                    Ödemeyi Dağıt
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Success Toast */}
      {paymentSuccess && (
        <div className="toast show position-fixed bottom-0 end-0 m-3" style={{zIndex: 1050}}>
          <div className="toast-header bg-success text-white">
            <i className="bi bi-check-circle me-2"></i>
            <strong className="me-auto">Ödeme Başarılı</strong>
            <button type="button" className="btn-close btn-close-white" onClick={() => setPaymentSuccess(null)}></button>
          </div>
          <div className="toast-body">
            Ortak ödemesi başarıyla gerçekleştirildi.
          </div>
        </div>
      )}

      {/* Custom Alert Modal */}
      {alertModal.show && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1051 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className={`modal-header ${alertModal.type === 'success' ? 'bg-success' : alertModal.type === 'warning' ? 'bg-warning' : alertModal.type === 'error' ? 'bg-danger' : 'bg-info'} text-white`}>
                <h5 className="modal-title">{alertModal.title}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={closeAlertModal}></button>
              </div>
              <div className="modal-body">
                <p>{alertModal.message}</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-primary" onClick={closeAlertModal}>
                  Tamam
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {showPaymentHistory && selectedPartner && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{selectedPartner.name} - Ödeme Geçmişi</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleClosePaymentHistory}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-info">
                  <div className="d-flex justify-content-between align-items-center">
                    <span>Toplam Ödenen Tutar:</span>
                    <span className="fw-bold fs-5">{formatCurrency(getTotalPartnerPayments())}</span>
                  </div>
                </div>
                
                {getPartnerPayments().length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Tarih</th>
                          <th>Tutar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getPartnerPayments().map((transaction, index) => (
                          <tr key={index}>
                            <td>{transaction.date}</td>
                            <td className="text-success">{formatCurrency(Math.abs(transaction.amount))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-5 text-muted">
                    <i className="bi bi-clock-history fs-1"></i>
                    <p className="mt-3 mb-0">Bu ortak için ödeme geçmişi bulunmamaktadır.</p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleClosePaymentHistory}
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

export default PartnerShares;