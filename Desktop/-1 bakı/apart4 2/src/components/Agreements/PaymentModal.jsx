import React, { useState, useEffect } from 'react';
import { isObserver } from '../../utils/auth';

const PaymentModal = ({ 
  show, 
  agreement, 
  onClose, 
  onPaymentSubmit,
  getCompanyName,
  formatCurrency,
  formatDate
}) => {
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' or 'check'
  const [isPartialPayment, setIsPartialPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [checkData, setCheckData] = useState({
    checkNumber: '',
    bankName: '',
    dueDate: '',
    amount: ''
  });

  useEffect(() => {
    if (agreement) {
      const remainingAmount = (agreement.totalAmount || 0) - (agreement.paidAmount || 0);
      setPaymentAmount(remainingAmount > 0 ? remainingAmount.toString() : '');
      setIsPartialPayment(false);
    }
  }, [agreement]);

  if (!show || !agreement) return null;

  const totalAmount = agreement.totalAmount || 0;
  const paidAmount = agreement.paidAmount || 0;
  const remainingAmount = totalAmount - paidAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (paymentMethod === 'check') {
      if (!checkData.checkNumber || !checkData.bankName || !checkData.dueDate || !checkData.amount) {
        await window.showAlert('Hata', 'Lütfen tüm çek bilgilerini doldurunuz.', 'error');
        return;
      }
    }

    const amount = paymentMethod === 'check' 
      ? parseFloat(checkData.amount) 
      : parseFloat(paymentAmount);

    if (isNaN(amount) || amount <= 0) {
      await window.showAlert('Hata', 'Lütfen geçerli bir tutar giriniz.', 'error');
      return;
    }

    if (amount > remainingAmount) {
      await window.showAlert('Hata', 'Ödeme tutarı kalan tutardan fazla olamaz.', 'error');
      return;
    }

    await onPaymentSubmit({
      paymentMethod,
      amount,
      isPartial: isPartialPayment,
      checkData: paymentMethod === 'check' ? checkData : null
    });
  };

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">
              <i className="bi bi-cash-coin me-2"></i>
              Ödeme Al - {getCompanyName(agreement.companyId)}
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
            ></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* Agreement Summary */}
              <div className="card mb-3">
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-4">
                      <small className="text-muted">Toplam Tutar</small>
                      <div className="fw-bold fs-5">{formatCurrency(totalAmount)}</div>
                    </div>
                    <div className="col-md-4">
                      <small className="text-muted">Ödenen Tutar</small>
                      <div className="fw-bold fs-5 text-success">{formatCurrency(paidAmount)}</div>
                    </div>
                    <div className="col-md-4">
                      <small className="text-muted">Kalan Tutar</small>
                      <div className="fw-bold fs-5 text-danger">{formatCurrency(remainingAmount)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="mb-3">
                <label className="form-label fw-bold">Ödeme Yöntemi</label>
                <div className="btn-group w-100" role="group">
                  <input
                    type="radio"
                    className="btn-check"
                    name="paymentMethod"
                    id="paymentMethodCash"
                    value="cash"
                    checked={paymentMethod === 'cash'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <label className="btn btn-outline-primary" htmlFor="paymentMethodCash">
                    <i className="bi bi-cash me-2"></i>
                    Nakit
                  </label>

                  <input
                    type="radio"
                    className="btn-check"
                    name="paymentMethod"
                    id="paymentMethodCheck"
                    value="check"
                    checked={paymentMethod === 'check'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <label className="btn btn-outline-primary" htmlFor="paymentMethodCheck">
                    <i className="bi bi-receipt me-2"></i>
                    Çek
                  </label>
                </div>
              </div>

              {/* Partial Payment Toggle */}
              {remainingAmount > 0 && (
                <div className="mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="partialPayment"
                      checked={isPartialPayment}
                      onChange={(e) => {
                        setIsPartialPayment(e.target.checked);
                        if (!e.target.checked) {
                          setPaymentAmount(remainingAmount.toString());
                        }
                      }}
                    />
                    <label className="form-check-label" htmlFor="partialPayment">
                      Kısmi Ödeme
                    </label>
                  </div>
                </div>
              )}

              {/* Cash Payment Amount */}
              {paymentMethod === 'cash' && (
                <div className="mb-3">
                  <label htmlFor="paymentAmount" className="form-label">
                    Ödeme Tutarı {isPartialPayment && <span className="text-danger">*</span>}
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    id="paymentAmount"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    min="0"
                    max={remainingAmount}
                    step="0.01"
                    required
                    disabled={!isPartialPayment && remainingAmount > 0}
                  />
                  <small className="text-muted">
                    Maksimum: {formatCurrency(remainingAmount)}
                  </small>
                </div>
              )}

              {/* Check Information */}
              {paymentMethod === 'check' && (
                <div className="card border-primary">
                  <div className="card-header bg-primary-subtle">
                    <h6 className="mb-0">
                      <i className="bi bi-receipt me-2"></i>
                      Çek Bilgileri
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label htmlFor="checkNumber" className="form-label">
                          Çek Numarası <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="checkNumber"
                          value={checkData.checkNumber}
                          onChange={(e) => setCheckData({ ...checkData, checkNumber: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="bankName" className="form-label">
                          Banka Adı <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="bankName"
                          value={checkData.bankName}
                          onChange={(e) => setCheckData({ ...checkData, bankName: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="checkDueDate" className="form-label">
                          Vade Tarihi <span className="text-danger">*</span>
                        </label>
                        <input
                          type="date"
                          className="form-control"
                          id="checkDueDate"
                          value={checkData.dueDate}
                          onChange={(e) => setCheckData({ ...checkData, dueDate: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="checkAmount" className="form-label">
                          Çek Tutarı <span className="text-danger">*</span>
                        </label>
                        <input
                          type="number"
                          className="form-control"
                          id="checkAmount"
                          value={checkData.amount}
                          onChange={(e) => setCheckData({ ...checkData, amount: e.target.value })}
                          min="0"
                          max={remainingAmount}
                          step="0.01"
                          required
                        />
                        <small className="text-muted">
                          Maksimum: {formatCurrency(remainingAmount)}
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Summary */}
              <div className="alert alert-info">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-bold">Ödenecek Tutar:</span>
                  <span className="fs-5 fw-bold">
                    {formatCurrency(
                      paymentMethod === 'check' 
                        ? (parseFloat(checkData.amount) || 0)
                        : (parseFloat(paymentAmount) || 0)
                    )}
                  </span>
                </div>
                {isPartialPayment && (
                  <div className="mt-2">
                    <small className="text-muted">
                      Ödeme sonrası kalan tutar: {formatCurrency(
                        remainingAmount - (
                          paymentMethod === 'check' 
                            ? (parseFloat(checkData.amount) || 0)
                            : (parseFloat(paymentAmount) || 0)
                        )
                      )}
                    </small>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                İptal
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isObserver()}
              >
                <i className="bi bi-check-circle me-2"></i>
                Ödemeyi Kaydet
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;

