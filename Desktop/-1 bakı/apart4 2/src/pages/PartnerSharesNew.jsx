import React, { useState, useEffect } from 'react';
import { getPartners, createPartner, updatePartner, deletePartner } from '../services/api';
import { getTransactions, createTransaction, updatePartner } from '../services/api';

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
  const [distributionAmount, setDistributionAmount] = useState('');
  const [distributionNotes, setDistributionNotes] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [partnersData, transactionsData] = await Promise.all([
          getPartners(),
          getTransactions()
        ]);
        setPartners(partnersData);
        setTransactions(transactionsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
    setShowPaymentHistory(false);
    setSelectedPartner(null);
    setEditingPartner(null);
    setPaymentSuccess(null);
    setDistributionAmount('');
    setDistributionNotes('');
  };

  const handleClosePaymentHistory = () => {
    setShowPaymentHistory(false);
    setSelectedPartner(null);
  };

  const handleDistributePayments = () => {
    setShowDistributionForm(true);
  };

  // Function to show payment history for a partner
  const handleShowPaymentHistory = (partner) => {
    setSelectedPartner(partner);
    setShowPaymentHistory(true);
  };

  const handleMakePayment = (partner) => {
    // Simulate payment processing
    setPaymentSuccess(partner.id);
    // In a real app, this would connect to a payment API
    setTimeout(() => {
      setPaymentSuccess(null);
    }, 3000);
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

  // Calculate total amount owed
  const totalAmountOwed = partners.reduce((sum, partner) => sum + partner.amountOwed, 0);

  // Calculate total cash balance
  const totalCashBalance = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  // Handle distribution of payments
  const handleDistribute = async () => {
    console.log('Starting payment distribution...');
    
    if (!distributionAmount) {
      await window.showAlert(
        'Eksik Bilgi',
        'Lütfen dağıtım miktarını girin.',
        'warning'
      );
      return;
    }

    const amount = parseFloat(distributionAmount);
    if (isNaN(amount) || amount <= 0) {
      await window.showAlert(
        'Geçersiz Miktar',
        'Geçerli bir miktar girin.',
        'warning'
      );
      return;
    }

    console.log('Distribution amount:', amount);
    console.log('Partners before distribution:', partners);

    try {
      // Calculate each partner's share based on their percentage
      const updatedPartners = partners.map(partner => {
        const sharePercentage = parseFloat(partner.sharePercentage) || 0;
        const shareAmount = (amount * sharePercentage) / 100;
        
        console.log(`Partner ${partner.name}: ${sharePercentage}% = ${shareAmount}`);
        
        return {
          ...partner,
          amountOwed: partner.amountOwed + shareAmount,
          lastPaymentDate: new Date().toISOString().split('T')[0]
        };
      });

      console.log('Updated partners:', updatedPartners);

      // Update partners in database
      let partnerUpdateCount = 0;
      for (const partner of updatedPartners) {
        try {
          console.log('Updating partner in database:', partner.name, partner);
          const result = await updatePartner(partner.id, partner);
          console.log('Partner updated successfully:', result);
          partnerUpdateCount++;
        } catch (partnerError) {
          console.error('Error updating partner:', partner.name, partnerError);
          throw partnerError;
        }
      }

      // Update partners in state
      setPartners(updatedPartners);

      // Create expense transactions for each partner
      let transactionCount = 0;
      for (const partner of updatedPartners) {
        const sharePercentage = parseFloat(partner.sharePercentage) || 0;
        const shareAmount = (amount * sharePercentage) / 100;
        
        if (shareAmount > 0) {
          const expenseData = {
            date: new Date().toISOString().split('T')[0],
            type: 'expense',
            source: `Ortak Ödemesi - ${partner.name}`,
            description: `${partner.name} için ${sharePercentage}% pay (${distributionNotes || 'Otomatik dağıtım'})`,
            amount: -shareAmount // Negative for expenses
          };
          
          console.log('Creating transaction for partner:', partner.name, expenseData);
          
          try {
            const result = await createTransaction(expenseData);
            console.log('Transaction created successfully:', result);
            transactionCount++;
          } catch (transactionError) {
            console.error('Error creating transaction for partner:', partner.name, transactionError);
            throw transactionError;
          }
        }
      }

      console.log(`Successfully updated ${partnerUpdateCount} partners and created ${transactionCount} transactions`);

      // Show success message
      setPaymentSuccess('distribution');
      setTimeout(() => {
        setPaymentSuccess(null);
      }, 3000);
      
      await window.showAlert(
        'Dağıtım Başarılı',
        `Ödemeler başarıyla dağıtıldı. ${partnerUpdateCount} ortak güncellendi, ${transactionCount} işlem oluşturuldu.`,
        'success'
      );

      // Close the form and reset state
      handleCloseForms();
    } catch (error) {
      console.error('Error distributing payments:', error);
      await window.showAlert(
        'Hata',
        `Ödeme dağıtımı sırasında bir hata oluştu: ${error.message}`,
        'error'
      );
    }
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="h3 fw-bold">Ortak Payları</h2>
        <button 
          onClick={handleDistributePayments}
          className="btn btn-primary-gradient btn-icon"
        >
          <i className="bi bi-currency-dollar me-1"></i>
          Ödeme Yap
        </button>
      </div>

      <div className="row">
        {/* Pie Chart Card */}
        <div className="col-lg-6 mb-4">
          <div className="card custom-card shadow-sm">
            <div className="card-body">
              <h5 className="card-title mb-4">Pay Dağılımı</h5>
              <div className="d-flex align-items-center justify-content-center" style={{height: '300px'}}>
                {partners.length > 0 ? (
                  <div className="position-relative" style={{width: '200px', height: '200px'}}>
                    {/* Pie chart visualization */}
                    <div className="position-absolute top-0 start-0 w-100 h-100 rounded-circle border border-4 border-primary"></div>
                    <div className="position-absolute top-0 start-0 w-100 h-100 rounded-circle border border-4 border-success" style={{clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%)'}}></div>
                    <div className="position-absolute top-0 start-0 w-100 h-100 rounded-circle border border-4 border-warning" style={{clipPath: 'polygon(50% 50%, 100% 0%, 100% 100%, 50% 100%)'}}></div>
                    <div className="position-absolute top-0 start-0 w-100 h-100 rounded-circle border border-4 border-danger" style={{clipPath: 'polygon(50% 50%, 50% 100%, 0% 100%, 0% 0%)'}}></div>
                    <div className="position-absolute top-50 start-50 translate-middle d-flex align-items-center justify-content-center bg-white rounded-circle" style={{width: '80px', height: '80px'}}>
                      <i className="bi bi-pie-chart fs-3 text-primary"></i>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted">
                    <i className="bi bi-pie-chart fs-1 mb-3"></i>
                    <p className="mb-0">Veri yok</p>
                  </div>
                )}
              </div>
              <div className="mt-4">
                {partners.map((partner, index) => (
                  <div key={partner.id} className="d-flex align-items-center justify-content-between py-2 border-bottom">
                    <div className="d-flex align-items-center">
                      <div className={`me-2 rounded-circle ${
                        index % 4 === 0 ? 'bg-primary' : 
                        index % 4 === 1 ? 'bg-success' : 
                        index % 4 === 2 ? 'bg-warning' : 'bg-danger'
                      }`} style={{width: '12px', height: '12px'}}></div>
                      <span>{partner.name}</span>
                    </div>
                    <span className="fw-medium">{partner.sharePercentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Partners Table */}
        <div className="col-lg-6 mb-4">
          <div className="card custom-card shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="card-title mb-0">Ortaklar</h5>
                <button 
                  onClick={handleAddPartner}
                  className="btn btn-primary btn-sm btn-icon"
                >
                  <i className="bi bi-plus-lg"></i>
                  Ortak Ekle
                </button>
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
                              onClick={() => handleShowPaymentHistory(partner)}
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
                      onClick={handleCloseForms}
                      className="btn btn-secondary"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary-gradient"
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
                <div className="alert alert-info">
                  <i className="bi bi-info-circle me-2"></i>
                  Kasa Bakiyesi: <strong>{formatCurrency(totalCashBalance)}</strong>
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Dağıtım Miktarı (₺)</label>
                  <input
                    type="number"
                    className="form-control form-control-custom"
                    value={distributionAmount}
                    onChange={(e) => setDistributionAmount(e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="Dağıtılacak miktarı girin"
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Notlar</label>
                  <textarea
                    className="form-control form-control-custom"
                    value={distributionNotes}
                    onChange={(e) => setDistributionNotes(e.target.value)}
                    rows="3"
                    placeholder="Ödeme ile ilgili notlar..."
                  ></textarea>
                </div>
                
                {partners.length > 0 && (
                  <div className="mb-3">
                    <h6>Dağıtım Özeti:</h6>
                    <ul className="list-group">
                      {partners.map(partner => {
                        const sharePercentage = parseFloat(partner.sharePercentage) || 0;
                        const shareAmount = distributionAmount ? (parseFloat(distributionAmount) * sharePercentage) / 100 : 0;
                        return (
                          <li key={partner.id} className="list-group-item d-flex justify-content-between align-items-center">
                            <span>{partner.name} ({sharePercentage}%)</span>
                            <span className="fw-bold">{formatCurrency(shareAmount)}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
                
                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    onClick={handleCloseForms}
                    className="btn btn-secondary"
                  >
                    İptal
                  </button>
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={handleDistribute}
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
            {paymentSuccess === 'distribution' 
              ? 'Ödemeler başarıyla dağıtıldı ve kasa sıfırlandı.' 
              : 'Ortak ödemesi başarıyla gerçekleştirildi.'}
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