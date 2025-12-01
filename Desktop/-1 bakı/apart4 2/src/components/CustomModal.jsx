import React from 'react';

const CustomModal = ({ 
  show, 
  title, 
  message, 
  type = 'info', 
  onClose, 
  onConfirm,
  confirmText = 'Tamam',
  cancelText = 'İptal',
  showCancel = false
}) => {
  if (!show) return null;

  const getTypeClass = () => {
    switch (type) {
      case 'success':
        return 'alert-success';
      case 'warning':
        return 'alert-warning';
      case 'error':
        return 'alert-danger';
      case 'info':
      default:
        return 'alert-info';
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'success':
        return 'bi-check-circle-fill';
      case 'warning':
        return 'bi-exclamation-triangle-fill';
      case 'error':
        return 'bi-x-circle-fill';
      case 'info':
      default:
        return 'bi-info-circle-fill';
    }
  };

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} onClick={onClose}>
      <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title d-flex align-items-center">
              <i className={`bi ${getTypeIcon()} me-2`}></i>
              {title}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className={`alert ${getTypeClass()} mb-0`}>
              {typeof message === 'string' ? (
                <div dangerouslySetInnerHTML={{ __html: message }} />
              ) : (
                message
              )}
            </div>
          </div>
          <div className="modal-footer">
            {showCancel && (
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                {cancelText}
              </button>
            )}
            <button 
              type="button" 
              className={`btn ${type === 'warning' || type === 'error' ? 'btn-danger' : 'btn-primary'}`}
              onClick={onConfirm || onClose}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomModal;