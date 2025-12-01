import { createTransaction } from '../../services/api';
import { createLog } from '../../services/api';
import { updateSite } from '../../services/api';

const SitesPaymentHandlers = ({
  sites, setSites,
  transactions, setTransactions,
  selectedSiteForPayment,
  setSelectedSiteForPayment,
  setShowPaymentSelection,
  setPendingPayments,
  formatCurrency,
  refreshData,
  processedPayments = [],
  setProcessedPayments,
  helpers,
  agreements,
  companies
}) => {
  const handlePaymentSite = async (site) => {
    // Check if site has pending payments
    if (!site.hasPendingPayment || !site.pendingPayments || site.pendingPayments.length === 0) {
      // Check if window.showAlert is available, if not use a fallback
      if (typeof window.showAlert === 'function') {
        await window.showAlert(
          'Bilgi',
          'Bu site için ödenecek bir tutar bulunmamaktadır.',
          'info'
        );
      } else {
        alert('Bu site için ödenecek bir tutar bulunmamaktadır.');
      }
      return;
    }

    // Always show payment selection modal to display all pending payments
    setSelectedSiteForPayment(site);
    setPendingPayments(site.pendingPayments);
    setShowPaymentSelection(true);
  };

  const processSitePayment = async (site, payment, isBulkPayment = false) => {
    try {
      // Validate inputs
      if (!site || !payment) {
        throw new Error('Invalid site or payment data');
      }
      
      if (!site.id || !payment.agreementId || !payment.amount) {
        throw new Error('Missing required payment data: site ID, agreement ID, or amount');
      }
      
      // Calculate total cash balance
      const totalCashBalance = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
      
      // Check if there's enough cash in the cashier
      if (totalCashBalance < payment.amount) {
        const errorMessage = `Kasada yeterli bakiye bulunmamaktadır. Gerekli tutar: ${formatCurrency ? formatCurrency(payment.amount) : payment.amount + '₺'}, Kasa bakiyesi: ${formatCurrency ? formatCurrency(totalCashBalance) : totalCashBalance + '₺'}`;
        // Check if window.showAlert is available, if not use a fallback
        if (typeof window.showAlert === 'function') {
          await window.showAlert(
            'Yetersiz Bakiye',
            errorMessage,
            'warning'
          );
        } else {
          alert(errorMessage);
        }
        // Close payment selection modal if it was open
        setShowPaymentSelection(false);
        setSelectedSiteForPayment(null);
        setPendingPayments([]);
        return;
      }

      // Create expense transaction for the site payment
      const expenseData = {
        date: new Date().toISOString().split('T')[0],
        type: 'expense',
        source: `Site Ödemesi - ${site.name || 'Unknown Site'}`,
        description: `${site.name || 'Unknown Site'} için ${payment.companyName || 'Unknown Company'} anlaşmasından gelen ödeme (${site.agreementPercentage || 25}% pay) - ${formatCurrency ? formatCurrency(payment.amount) : payment.amount + '₺'}`,
        amount: -Math.abs(payment.amount), // Ensure negative for expenses and positive number
        siteId: site.id, // Add site ID for tracking
        agreementId: payment.agreementId // Add agreement ID for tracking
      };
      
      console.log('Creating transaction with data:', expenseData);
      
      // Process payment from cashier
      const newTransaction = await createTransaction(expenseData);
      
      console.log('Transaction response:', newTransaction);
      
      if (newTransaction) {
        // Update transactions first
        const updatedTransactions = [...transactions, newTransaction];
        setTransactions(updatedTransactions);
        
        // Recalculate pending payments for all sites
        const updatedSites = sites.map(s => {
          // Calculate pending payments based on active agreements
          const calculatedPendingPayments = helpers.calculatePendingPayments(s, agreements, companies, updatedTransactions);
          
          return {
            ...s,
            pendingPayments: calculatedPendingPayments,
            hasPendingPayment: calculatedPendingPayments.length > 0
          };
        });
        
        setSites(updatedSites);
        
        // Update site in the backend
        try {
          const siteToUpdate = updatedSites.find(s => s.id === site.id);
          if (siteToUpdate) {
            console.log('Updating site with data:', siteToUpdate);
            const updateResult = await updateSite(site.id, siteToUpdate);
            console.log('Site update result:', updateResult);
          }
        } catch (error) {
          console.error('Error updating site in backend:', error);
          // Continue with the process even if site update fails
        }
        
        // Log the action
        await createLog({
          user: 'Admin',
          action: `Site ödemesi yapıldı: ${site.name || 'Unknown Site'} (${formatCurrency ? formatCurrency(payment.amount) : payment.amount + '₺'}) - ${payment.companyName || 'Unknown Company'} anlaşması`
        });
        
        // Show success message only if not processing bulk payment
        if (!isBulkPayment) {
          // Check if window.showAlert is available, if not use a fallback
          const successMessage = `${site.name || 'Unknown Site'} için ${formatCurrency ? formatCurrency(payment.amount) : payment.amount + '₺'} tutarında ödeme yapıldı. (${payment.companyName || 'Unknown Company'} anlaşması)`;
          if (typeof window.showAlert === 'function') {
            await window.showAlert(
              'Başarılı',
              successMessage,
              'success'
            );
          } else {
            alert(successMessage);
          }
        }
        
        // Refresh data to ensure UI is updated
        if (refreshData) {
          await refreshData();
        }
      } else {
        throw new Error('Transaction creation failed - no response from server');
      }
    } catch (error) {
      console.error('Error processing site payment:', error);
      // Check if window.showAlert is available, if not use a fallback
      const errorMessage = 'Ödeme işlemi sırasında bir hata oluştu: ' + (error.message || error.toString());
      if (typeof window.showAlert === 'function') {
        await window.showAlert(
          'Hata',
          errorMessage,
          'error'
        );
      } else {
        alert(errorMessage);
      }
      throw error; // Re-throw the error so it can be caught by the bulk payment handler
    } finally {
      // Close payment selection modal if it was open and not processing bulk payment
      if (!isBulkPayment) {
        setShowPaymentSelection(false);
        setSelectedSiteForPayment(null);
        setPendingPayments([]);
      }
    }
  };

  const handleSelectPayment = (payment) => {
    // Process the payment and track it as processed
    if (selectedSiteForPayment) {
      // Add to processed payments list
      setProcessedPayments([...processedPayments, payment.agreementId]);
      processSitePayment(selectedSiteForPayment, payment);
    }
  };

  const handlePayAllPayments = async (site) => {
    if (!site || !site.pendingPayments || site.pendingPayments.length === 0) {
      return;
    }

    try {
      // Process all payments sequentially
      for (const payment of site.pendingPayments) {
        await processSitePayment(site, payment, true); // isBulkPayment = true
      }

      // Show success message for bulk payment
      const totalAmount = site.pendingPayments.reduce((sum, p) => sum + p.amount, 0);
      const successMessage = `${site.name} için toplam ${formatCurrency ? formatCurrency(totalAmount) : totalAmount + '₺'} tutarında ${site.pendingPayments.length} ödeme işlemi tamamlandı.`;
      
      if (typeof window.showAlert === 'function') {
        await window.showAlert(
          'Başarılı',
          successMessage,
          'success'
        );
      } else {
        alert(successMessage);
      }

      // Close the modal and clear processed payments
      setShowPaymentSelection(false);
      setSelectedSiteForPayment(null);
      setPendingPayments([]);
      setProcessedPayments([]);

    } catch (error) {
      console.error('Error processing bulk payments:', error);
      const errorMessage = 'Toplu ödeme işlemi sırasında bir hata oluştu: ' + (error.message || error.toString());
      if (typeof window.showAlert === 'function') {
        await window.showAlert(
          'Hata',
          errorMessage,
          'error'
        );
      } else {
        alert(errorMessage);
      }
    }
  };

  return {
    handlePaymentSite,
    processSitePayment,
    handleSelectPayment,
    handlePayAllPayments
  };
};

export default SitesPaymentHandlers;