import { useState } from 'react';

const useCustomAlert = () => {
  const [alertState, setAlertState] = useState({
    show: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null,
    showCancel: false,
    confirmText: 'Tamam',
    cancelText: 'İptal'
  });

  const showAlert = (title, message, type = 'info') => {
    return new Promise((resolve) => {
      setAlertState({
        show: true,
        title,
        message,
        type,
        onConfirm: () => {
          setAlertState(prev => ({ ...prev, show: false }));
          resolve(true);
        },
        showCancel: false
      });
    });
  };

  const showConfirm = (title, message, type = 'warning', confirmText = 'Tamam', cancelText = 'İptal') => {
    return new Promise((resolve) => {
      setAlertState({
        show: true,
        title,
        message,
        type,
        onConfirm: () => {
          setAlertState(prev => ({ ...prev, show: false }));
          resolve(true);
        },
        showCancel: true,
        confirmText,
        cancelText,
        onCancel: () => {
          setAlertState(prev => ({ ...prev, show: false }));
          resolve(false);
        }
      });
    });
  };

  const hideAlert = () => {
    setAlertState(prev => ({ ...prev, show: false }));
  };

  return {
    alertState,
    showAlert,
    showConfirm,
    hideAlert
  };
};

export default useCustomAlert;