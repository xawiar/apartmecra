import React from 'react';
import { isObserver } from '../utils/auth';

const withObserverRestrictions = (WrappedComponent) => {
  return function ObserverRestrictedComponent(props) {
    const isUserObserver = isObserver();
    
    // Add custom CSS to hide action buttons for observers
    const observerStyles = isUserObserver ? `
      <style>
        .btn-primary-gradient,
        .btn-primary:not(.btn-outline-primary),
        .btn-success,
        .btn-danger,
        .btn-warning,
        .btn[type="submit"],
        .btn-icon:not(.btn-info):not(.btn-secondary),
        button[onclick],
        .btn[data-bs-toggle="modal"]:not(.btn-info):not(.btn-secondary),
        .btn-close,
        .dropdown-toggle {
          display: none !important;
        }
        
        .observer-warning {
          background: linear-gradient(135deg, #ffc107, #fd7e14);
          color: white;
          padding: 10px 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .observer-warning i {
          margin-right: 8px;
        }
        
        /* Allow specific read-only buttons */
        .btn-info,
        .btn-secondary,
        .btn-outline-secondary {
          display: inline-block !important;
        }
        
        /* Hide edit/delete action buttons */
        .btn-sm.btn-outline-secondary,
        .btn-sm.btn-outline-warning,
        .btn-sm.btn-outline-danger {
          display: none !important;
        }
        
        /* Disable panel interactions for observers */
        [style*="cursor: pointer"] {
          cursor: default !important;
          pointer-events: none !important;
        }
        
        /* Hide form inputs and make them read-only */
        input:not([type="search"]):not([type="date"]):not([type="text"][readonly]),
        select:not([readonly]),
        textarea:not([readonly]) {
          pointer-events: none;
          background-color: #f8f9fa !important;
          opacity: 0.7;
        }
        
        /* Keep search and filter inputs functional */
        input[type="search"],
        input[type="date"][name*="filter"],
        input[type="date"][name*="dateFrom"],
        input[type="date"][name*="dateTo"],
        select[name*="filter"],
        select[name*="type"] {
          pointer-events: auto !important;
          background-color: white !important;
          opacity: 1 !important;
        }
      </style>
    ` : '';

    return (
      <>
        {isUserObserver && (
          <>
            <div dangerouslySetInnerHTML={{ __html: observerStyles }} />
            <div className="alert observer-warning d-flex align-items-center" role="alert">
              <i className="bi bi-eye-fill"></i>
              <div>
                <strong>Gözlemci Modu:</strong> Bu sayfayı sadece görüntüleme yetkisi ile kullanıyorsunuz. 
                Herhangi bir değişiklik yapma yetkiniz bulunmamaktadır.
              </div>
            </div>
          </>
        )}
        <WrappedComponent {...props} />
      </>
    );
  };
};

export default withObserverRestrictions;