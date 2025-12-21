import React, { useState, useEffect } from 'react';
import { getChecks, updateCheck, getAgreements, updateAgreement, createTransaction } from '../../services/api';
import { isObserver } from '../../utils/auth';

const CheckManagementModal = ({ 
  show, 
  onClose,
  getCompanyName,
  formatCurrency,
  formatDate
}) => {
  const [checks, setChecks] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCheck, setEditingCheck] = useState(null);
  const [checkStatus, setCheckStatus] = useState('pending');

  useEffect(() => {
    if (show) {
      fetchData();
    }
  }, [show]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [checksData, agreementsData] = await Promise.all([
        getChecks(),
        getAgreements()
      ]);
      setChecks(checksData || []);
      setAgreements(agreementsData || []);
    } catch (error) {
      console.error('Error fetching checks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (check, newStatus) => {
    try {
      const updatedCheck = {
        ...check,
        status: newStatus,
        updatedAt: new Date().toISOString()
      };

      const savedCheck = await updateCheck(check.id || check._docId, updatedCheck);
      
      if (savedCheck) {
        setChecks(checks.map(c => (c.id || c._docId) === (check.id || check._docId) ? savedCheck : c));

        // If check is cleared, automatically complete agreement payment
        if (newStatus === 'cleared' && check.agreementId) {
          const agreement = agreements.find(a => String(a.id) === String(check.agreementId));
          if (agreement) {
            // Check if this check was already cleared (prevent double counting)
            const wasPreviouslyCleared = check.status === 'cleared';
            
            if (!wasPreviouslyCleared) {
              const currentPaidAmount = agreement.paidAmount || 0;
              const checkAmount = check.amount || 0;
              const newPaidAmount = currentPaidAmount + checkAmount;
              const totalAmount = agreement.totalAmount || 0;
              const remainingAmount = totalAmount - newPaidAmount;
              const paymentStatus = remainingAmount <= 0.01 ? 'paid' : (newPaidAmount > 0 ? 'partial' : 'unpaid');

              const updatedAgreement = {
                ...agreement,
                paidAmount: newPaidAmount,
                remainingAmount: remainingAmount,
                paymentStatus: paymentStatus,
                paymentReceived: remainingAmount <= 0.01,
                // Only set paymentDate if full payment is received, otherwise keep existing or set to null
                ...(remainingAmount <= 0.01 ? { paymentDate: new Date().toISOString().split('T')[0] } : (agreement.paymentDate ? { paymentDate: agreement.paymentDate } : {}))
              };

              await updateAgreement(agreement.id, updatedAgreement);

              // Create cash transaction when check is cleared
              const transactionData = {
                date: new Date().toISOString().split('T')[0],
                type: 'income',
                source: `Çek Tahsil - ${getCompanyName(agreement.companyId)}`,
                description: `${getCompanyName(agreement.companyId)} anlaşması için çek #${check.checkNumber} tahsil edildi - ${formatCurrency(checkAmount)}`,
                amount: checkAmount,
                agreementId: agreement.id,
                paymentMethod: 'check',
                checkId: check.id || check._docId
              };

              await createTransaction(transactionData);

              await window.showAlert(
                'Başarılı',
                'Çek durumu güncellendi. Çek tahsil edildi ve anlaşma ödemesi otomatik olarak tamamlandı.',
                'success'
              );
            } else {
              await window.showAlert(
                'Bilgi',
                'Çek durumu güncellendi. Bu çek daha önce tahsil edilmişti.',
                'info'
              );
            }
          }
        } else {
          await window.showAlert(
            'Başarılı',
            'Çek durumu güncellendi.',
            'success'
          );
        }
      }
    } catch (error) {
      console.error('Error updating check status:', error);
      await window.showAlert(
        'Hata',
        'Çek durumu güncellenirken bir hata oluştu.',
        'error'
      );
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-warning',
      cleared: 'bg-success',
      returned: 'bg-danger',
      protested: 'bg-danger'
    };
    return badges[status] || 'bg-secondary';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'Bekliyor',
      cleared: 'Tahsil Edildi',
      returned: 'İade Edildi',
      protested: 'Protesto'
    };
    return texts[status] || status;
  };

  if (!show) return null;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">
              <i className="bi bi-receipt me-2"></i>
              Çek Yönetimi
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Yükleniyor...</span>
                </div>
              </div>
            ) : checks.length === 0 ? (
              <div className="text-center py-4">
                <i className="bi bi-inbox text-muted fs-1"></i>
                <p className="text-muted mt-2">Henüz çek kaydı bulunmamaktadır.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Çek Numarası</th>
                      <th>Banka</th>
                      <th>Vade Tarihi</th>
                      <th>Tutar</th>
                      <th>Firma</th>
                      <th>Anlaşma ID</th>
                      <th>Durum</th>
                      <th>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checks.map((check) => {
                      const agreement = agreements.find(a => String(a.id) === String(check.agreementId));
                      return (
                        <tr key={check.id || check._docId}>
                          <td className="fw-medium">{check.checkNumber}</td>
                          <td>{check.bankName}</td>
                          <td>{formatDate(check.dueDate)}</td>
                          <td className="fw-bold">{formatCurrency(check.amount || 0)}</td>
                          <td>{agreement ? getCompanyName(agreement.companyId) : '-'}</td>
                          <td>#{check.agreementId}</td>
                          <td>
                            <span className={`badge ${getStatusBadge(check.status)}`}>
                              {getStatusText(check.status)}
                            </span>
                          </td>
                          <td>
                            {check.status !== 'cleared' && (
                              <div className="dropdown">
                                <button
                                  className="btn btn-sm btn-outline-primary dropdown-toggle"
                                  type="button"
                                  id={`checkStatusDropdown-${check.id || check._docId}`}
                                  data-bs-toggle="dropdown"
                                  aria-expanded="false"
                                  disabled={isObserver()}
                                >
                                  Durum Değiştir
                                </button>
                                <ul className="dropdown-menu" aria-labelledby={`checkStatusDropdown-${check.id || check._docId}`}>
                                  <li>
                                    <a
                                      className="dropdown-item"
                                      href="#"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        handleStatusChange(check, 'cleared');
                                      }}
                                    >
                                      <i className="bi bi-check-circle me-2 text-success"></i>
                                      Tahsil Edildi
                                    </a>
                                  </li>
                                  <li>
                                    <a
                                      className="dropdown-item"
                                      href="#"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        handleStatusChange(check, 'returned');
                                      }}
                                    >
                                      <i className="bi bi-x-circle me-2 text-danger"></i>
                                      İade Edildi
                                    </a>
                                  </li>
                                  <li>
                                    <a
                                      className="dropdown-item"
                                      href="#"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        handleStatusChange(check, 'protested');
                                      }}
                                    >
                                      <i className="bi bi-exclamation-triangle me-2 text-danger"></i>
                                      Protesto
                                    </a>
                                  </li>
                                </ul>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckManagementModal;

