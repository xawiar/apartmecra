import React, { useState, useEffect, useRef } from 'react';
import { getTransactions, createTransaction, updateTransaction, deleteTransaction, getPartners, updatePartner, getAgreements, getSites, getCompanies, updateSite, updateCompany, updateAgreement, createLog, getDebts, createDebt, updateDebt, deleteDebt, getChecks, updateCheck } from '../services/api';
import { isObserver } from '../utils/auth';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const Cashier = () => {
  const [transactions, setTransactions] = useState([]);
  const [partners, setPartners] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const [sites, setSites] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'income', 'expense'
  const [filter, setFilter] = useState({
    dateFrom: '',
    dateTo: '',
    type: 'all'
  });
  const [formData, setFormData] = useState({
    date: '',
    type: 'income',
    source: '',
    description: '',
    amount: '',
    partnerId: '',
    agreementId: '', // For partial payment support
    siteId: '', // For site advance payment
    isSiteAdvance: false // Flag for site advance payment
  });
  const [selectedAgreementForPayment, setSelectedAgreementForPayment] = useState(null);
  // Report state
  const [showReport, setShowReport] = useState(false);
  const [reportFilter, setReportFilter] = useState({
    dateFrom: '',
    dateTo: ''
  });
  
  // Site payment calculation state
  const [showSitePaymentCalc, setShowSitePaymentCalc] = useState(false);
  const [sitePaymentFilter, setSitePaymentFilter] = useState({
    dateFrom: '',
    dateTo: ''
  });
  const [sitePaymentResults, setSitePaymentResults] = useState([]);
  // Debts state
  const [debts, setDebts] = useState([]);
  const [showDebtsView, setShowDebtsView] = useState(false);
  const [showDebtForm, setShowDebtForm] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);
  const [showDebtHistory, setShowDebtHistory] = useState(false);
  const [selectedDebtForHistory, setSelectedDebtForHistory] = useState(null);
  const [debtFormData, setDebtFormData] = useState({
    name: '',
    amount: '',
    dueDate: '',
    description: '',
    type: 'manual', // 'manual' | 'recurring'
    isRecurring: false
  });
  const [selectedDebtForPayment, setSelectedDebtForPayment] = useState(null);
  
  // Custom confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // Ref for report content
  const reportRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [transactionsData, partnersData, agreementsData, sitesData, companiesData, debtsData] = await Promise.all([
          getTransactions(),
          getPartners(),
          getAgreements(),
          getSites(),
          getCompanies(),
          getDebts()
        ]);
        setTransactions(transactionsData);
        setPartners(partnersData);
        setAgreements(agreementsData);
        setSites(sitesData);
        setCompanies(companiesData);
        setDebts(debtsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate total balance
  const totalBalance = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);

  const handleAddIncome = () => {
    setFormData({
      date: '',
      type: 'income',
      source: '',
      description: '',
      amount: '',
      partnerId: '',
      agreementId: ''
    });
    setSelectedAgreementForPayment(null);
    setEditingTransaction(null);
    setShowIncomeForm(true);
  };

  const handleAddExpense = () => {
    setFormData({
      date: '',
      type: 'expense',
      source: '',
      description: '',
      amount: '',
      partnerId: '',
      siteId: '',
      isSiteAdvance: false
    });
    setEditingTransaction(null);
    setShowExpenseForm(true);
  };

  const handleEditTransaction = (transaction) => {
    // Ortak giderlerinde originalAmount varsa onu kullan, yoksa amount'u kullan
    const displayAmount = transaction.originalAmount || Math.abs(transaction.amount) || '';
    
    setFormData({
      date: transaction.date || '',
      type: transaction.type || 'income',
      source: transaction.source || '',
      description: transaction.description || '',
      amount: displayAmount,
      partnerId: transaction.partnerId || ''
    });
    setEditingTransaction(transaction);
    if (transaction.type === 'income') {
      setShowIncomeForm(true);
    } else {
      setShowExpenseForm(true);
    }
  };

  const handleCloseForms = () => {
    setShowIncomeForm(false);
    setShowExpenseForm(false);
    setEditingTransaction(null);
    setSelectedDebtForPayment(null);
    setSelectedAgreementForPayment(null);
    setFormData({
      date: '',
      type: 'income',
      source: '',
      description: '',
      amount: '',
      partnerId: '',
      agreementId: '',
      siteId: '',
      isSiteAdvance: false
    });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter({
      ...filter,
      [name]: value
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Debt form handlers
  const handleDebtFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setDebtFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const resetDebtForm = () => {
    setShowDebtForm(false);
    setEditingDebt(null);
    setDebtFormData({
      name: '',
      amount: '',
      dueDate: '',
      description: '',
      type: 'manual',
      isRecurring: false
    });
  };

  const handleDebtFormSubmit = async (e) => {
    e.preventDefault();

    if (!debtFormData.name || !debtFormData.amount || !debtFormData.dueDate) {
      await window.showAlert?.(
        'Eksik Bilgi',
        'Lütfen borç adı, tutar ve ödenecek tarih alanlarını doldurunuz.',
        'warning'
      );
      return;
    }

    try {
      const baseAmount = Math.abs(parseFloat(debtFormData.amount) || 0);
      const isRecurring = !!debtFormData.isRecurring || debtFormData.type === 'recurring';

      const payload = {
        name: debtFormData.name,
        amount: baseAmount,
        dueDate: debtFormData.dueDate,
        description: debtFormData.description || '',
        type: debtFormData.type || (isRecurring ? 'recurring' : 'manual'),
        isRecurring,
        startDate: isRecurring ? (debtFormData.startDate || debtFormData.dueDate) : null,
        status: 'open'
      };

      if (editingDebt) {
        const updated = await updateDebt(editingDebt.id, payload);
        if (updated) {
          setDebts((prev) => prev.map((d) => (d.id === editingDebt.id ? { ...editingDebt, ...payload } : d)));
          await window.showAlert?.('Başarılı', 'Borç başarıyla güncellendi.', 'success');
        }
      } else {
        const created = await createDebt(payload);
        if (created) {
          setDebts((prev) => [...prev, created]);
          await window.showAlert?.('Başarılı', 'Yeni borç başarıyla eklendi.', 'success');
        }
      }

      resetDebtForm();
    } catch (error) {
      console.error('Error saving debt:', error);
      await window.showAlert?.(
        'Hata',
        'Borç kaydedilirken bir hata oluştu.',
        'error'
      );
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (!formData.date || !formData.source || !formData.amount) {
      await window.showAlert(
        'Eksik Bilgi',
        'Lütfen zorunlu alanları doldurunuz.',
        'warning'
      );
      return;
    }
    
    try {
      let transactionAmount = 0;
      
        if (formData.type === 'income') {
          // Income always increases cashier balance
          transactionAmount = Math.abs(parseFloat(formData.amount));
        } else {
          // Expense: if partner is selected, don't decrease cashier balance
          if (formData.partnerId) {
            transactionAmount = 0; // Partner pays from their own pocket, but record the actual amount
          } else {
            transactionAmount = -Math.abs(parseFloat(formData.amount)); // Normal expense
          }
        }
      
      const transactionData = {
        ...formData,
        amount: formData.partnerId && formData.type === 'expense' ? 0 : transactionAmount,
        originalAmount: formData.partnerId && formData.type === 'expense' ? Math.abs(parseFloat(formData.amount)) : null,
        debtId: selectedDebtForPayment && formData.type === 'expense'
          ? selectedDebtForPayment.id
          : (editingTransaction?.debtId || null),
        agreementId: formData.agreementId && formData.type === 'income'
          ? formData.agreementId
          : (editingTransaction?.agreementId || null),
        siteId: formData.siteId || null,
        isSiteAdvance: formData.isSiteAdvance || false
      };
      
      // If this is a site advance payment, update site's advanceBalance
      if (formData.isSiteAdvance && formData.siteId && formData.type === 'expense' && !editingTransaction) {
        const site = sites.find(s => String(s.id) === String(formData.siteId));
        if (site) {
          const advanceAmount = Math.abs(parseFloat(formData.amount));
          const currentAdvanceBalance = parseFloat(site.advanceBalance || 0);
          const newAdvanceBalance = currentAdvanceBalance + advanceAmount;
          
          // Update site's advanceBalance
          await updateSite(site.id, {
            ...site,
            advanceBalance: newAdvanceBalance
          });
          
          // Update sites state
          setSites(sites.map(s => 
            String(s.id) === String(site.id) 
              ? { ...s, advanceBalance: newAdvanceBalance }
              : s
          ));
          
          // Update transaction source to indicate it's a site advance
          transactionData.source = `Site Avans Ödemesi - ${site.name}`;
          transactionData.description = `${site.name} için avans ödemesi${transactionData.description ? ` - ${transactionData.description}` : ''}`;
          
          // Log the action
          await createLog({
            user: 'Admin',
            action: `Site avans ödemesi yapıldı: ${site.name} (${formatCurrency(advanceAmount)}) - Yeni bakiye: ${formatCurrency(newAdvanceBalance)}`
          });
        }
      }
      
      // If this is a partial payment for an agreement, update the agreement
      if (formData.agreementId && formData.type === 'income' && !editingTransaction) {
        const agreement = agreements.find(a => String(a.id) === String(formData.agreementId));
        if (agreement) {
          const paymentAmount = parseFloat(formData.amount);
          const currentPaidAmount = agreement.paidAmount || 0;
          const newPaidAmount = currentPaidAmount + paymentAmount;
          const totalAmount = agreement.totalAmount || 0;
          const remainingAmount = totalAmount - newPaidAmount;
          const paymentStatus = remainingAmount <= 0.01 ? 'paid' : (newPaidAmount > 0 ? 'partial' : 'unpaid');
          
          const updatedAgreement = {
            ...agreement,
            paidAmount: newPaidAmount,
            remainingAmount: remainingAmount,
            paymentStatus: paymentStatus,
            paymentReceived: remainingAmount <= 0.01,
            paymentDate: remainingAmount <= 0.01 ? formData.date : agreement.paymentDate
          };
          
          try {
            await updateAgreement(agreement.id, updatedAgreement);
            // Update local state
            setAgreements(agreements.map(a => a.id === agreement.id ? updatedAgreement : a));
          } catch (error) {
            console.error('Error updating agreement:', error);
          }
        }
      }
      
      if (editingTransaction) {
        // Update existing transaction
        const updatedTransaction = await updateTransaction(editingTransaction.id, transactionData);
        if (updatedTransaction) {
          setTransactions(transactions.map(transaction => 
            transaction.id === editingTransaction.id ? updatedTransaction : transaction
          ));
          handleCloseForms();
          
          await window.showAlert(
            'Başarılı',
            'İşlem başarıyla güncellendi.',
            'success'
          );
        }
      } else {
        // Create new transaction
        const newTransaction = await createTransaction(transactionData);
        if (newTransaction) {
          setTransactions([...transactions, newTransaction]);
          // Borca bağlı bir ödeme ise, seçimi temizle
          if (selectedDebtForPayment && formData.type === 'expense') {
            setSelectedDebtForPayment(null);
          }
          
          // Update partner balance if partner is selected
          if (formData.partnerId) {
            const selectedPartner = partners.find(p => p.id.toString() === formData.partnerId);
            if (selectedPartner) {
              let balanceChange = 0;
              
              if (formData.type === 'income') {
                // Income: Partner puts money into cashier, becomes creditor
                balanceChange = Math.abs(parseFloat(formData.amount));
              } else {
                // Expense: Partner pays from their own pocket, becomes creditor
                // Cashier balance doesn't change, only partner balance increases
                balanceChange = Math.abs(parseFloat(formData.amount));
              }
              
              const updatedPartners = partners.map(partner => 
                partner.id.toString() === formData.partnerId
                  ? { ...partner, balance: (partner.balance || 0) + balanceChange }
                  : partner
              );
              setPartners(updatedPartners);
            }
          }
          
          handleCloseForms();
          
          await window.showAlert(
            'Başarılı',
            'Yeni işlem başarıyla eklendi.',
            'success'
          );
        }
      }
    } catch (error) {
      console.error('Error saving transaction:', error);
      await window.showAlert(
        'Hata',
        'İşlem kaydedilirken bir hata oluştu.',
        'error'
      );
    }
  };

  // Get filtered and sorted transactions based on active tab and filter criteria
  const getFilteredTransactions = () => {
    let filtered = transactions.filter(transaction => {
      // Tab filter
      if (activeTab !== 'all' && transaction.type !== activeTab) {
        return false;
      }
      
      // Date filters
      if (filter.dateFrom && transaction.date < filter.dateFrom) {
        return false;
      }
      
      if (filter.dateTo && transaction.date > filter.dateTo) {
        return false;
      }
      
      return true;
    });

    // Sort by date (newest first) and then by ID (newest first)
    return filtered.sort((a, b) => {
      // First sort by date (newest first)
      const dateComparison = new Date(b.date) - new Date(a.date);
      if (dateComparison !== 0) {
        return dateComparison;
      }
      // If dates are the same, sort by ID (newest first)
      return b.id - a.id;
    });
  };

  const filteredTransactions = getFilteredTransactions();

  // Get tab statistics
  const getTabStatistics = () => {
    const incomeTransactions = transactions.filter(t => t.type === 'income');
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = expenseTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    return {
      income: {
        count: incomeTransactions.length,
        total: totalIncome
      },
      expense: {
        count: expenseTransactions.length,
        total: totalExpense
      },
      all: {
        count: transactions.length,
        total: totalBalance
      }
    };
  };

  const tabStats = getTabStatistics();

  // Helper: calculate months since start (inclusive)
  const getMonthsSinceStart = (startDateStr) => {
    if (!startDateStr) return 0;
    const start = new Date(startDateStr);
    const now = new Date();
    const years = now.getFullYear() - start.getFullYear();
    const months = now.getMonth() - start.getMonth();
    let total = years * 12 + months + 1; // inclusive of start month
    if (total < 0) total = 0;
    return total;
  };

  // Helper: compute remaining amount for a debt (supports recurring)
  const getDebtRemaining = (debt) => {
    if (!debt) return 0;
    const baseAmount = Math.abs(parseFloat(debt.amount) || 0);
    if (baseAmount === 0) return 0;

    // Find all expense transactions linked to this debt
    const relatedPayments = transactions.filter(
      (t) => t.type === 'expense' && t.debtId && String(t.debtId) === String(debt.id)
    );
    const paidTotal = relatedPayments.reduce(
      (sum, t) => sum + Math.abs(t.originalAmount || t.amount || 0),
      0
    );

    if (debt.isRecurring) {
      const months = getMonthsSinceStart(debt.startDate || debt.dueDate);
      const totalShouldHavePaid = baseAmount * months;
      return Math.max(0, totalShouldHavePaid - paidTotal);
    }

    // Non-recurring: simple remaining
    return Math.max(0, baseAmount - paidTotal);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  // Handle site payment filter change
  const handleSitePaymentFilterChange = (e) => {
    const { name, value } = e.target;
    setSitePaymentFilter({
      ...sitePaymentFilter,
      [name]: value
    });
  };

  // Calculate site payments for selected date range
  const calculateSitePayments = () => {
    if (!sitePaymentFilter.dateFrom || !sitePaymentFilter.dateTo) {
      window.showAlert?.(
        'Eksik Bilgi',
        'Lütfen başlangıç ve bitiş tarihlerini seçiniz.',
        'warning'
      );
      return;
    }

    const startDate = new Date(sitePaymentFilter.dateFrom);
    const endDate = new Date(sitePaymentFilter.dateTo);

    // Find agreements that overlap with the selected date range (including expired ones, excluding archived)
    const relevantAgreements = agreements.filter(agreement => {
      // Exclude only archived agreements
      if (agreement.status === 'archived') return false;
      
      // Check if agreement has dateRanges or use startDate/endDate
      if (agreement.dateRanges && agreement.dateRanges.length > 0) {
        // Check if any date range overlaps with selected range
        return agreement.dateRanges.some(range => {
          const rangeStart = new Date(range.startDate);
          const rangeEnd = new Date(range.endDate);
          return (rangeStart <= endDate && rangeEnd >= startDate);
        });
      } else {
        // Use startDate/endDate
        const agreementStart = new Date(agreement.startDate);
        const agreementEnd = new Date(agreement.endDate);
        return (agreementStart <= endDate && agreementEnd >= startDate);
      }
    });

    // Calculate payments for each site
    const sitePaymentsMap = {};

    relevantAgreements.forEach(agreement => {
      // Determine which weeks of the agreement fall within the selected date range
      let weeksInRange = 0;
      
      if (agreement.dateRanges && agreement.dateRanges.length > 0) {
        // Calculate weeks for each date range that overlaps
        agreement.dateRanges.forEach(range => {
          const rangeStart = new Date(range.startDate);
          const rangeEnd = new Date(range.endDate);
          
          if (rangeStart <= endDate && rangeEnd >= startDate) {
            // Calculate overlap
            const overlapStart = rangeStart > startDate ? rangeStart : startDate;
            const overlapEnd = rangeEnd < endDate ? rangeEnd : endDate;
            const overlapDays = Math.ceil((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24));
            weeksInRange += Math.ceil(overlapDays / 7);
          }
        });
      } else {
        // Use startDate/endDate
        const agreementStart = new Date(agreement.startDate);
        const agreementEnd = new Date(agreement.endDate);
        
        if (agreementStart <= endDate && agreementEnd >= startDate) {
          const overlapStart = agreementStart > startDate ? agreementStart : startDate;
          const overlapEnd = agreementEnd < endDate ? agreementEnd : endDate;
          const overlapDays = Math.ceil((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24));
          weeksInRange = Math.ceil(overlapDays / 7);
        }
      }

      if (weeksInRange === 0) return;

      // Get weekly rate per panel
      const weeklyRatePerPanel = parseFloat(agreement.weeklyRatePerPanel) || 0;

      // Process each site in the agreement
      if (agreement.siteIds && agreement.siteIds.length > 0) {
        agreement.siteIds.forEach(siteId => {
          const site = sites.find(s => String(s.id) === String(siteId));
          if (!site) return;

          // Get panel count for this site in the agreement
          const panelCount = agreement.sitePanelCounts?.[siteId] 
            ? parseInt(agreement.sitePanelCounts[siteId]) 
            : 0;

          if (panelCount === 0) return;

          // Get site agreement percentage
          const agreementPercentage = parseFloat(site.agreementPercentage) || 0;

          // Calculate payment: panelCount * weeklyRatePerPanel * weeksInRange * (agreementPercentage / 100)
          const paymentAmount = panelCount * weeklyRatePerPanel * weeksInRange * (agreementPercentage / 100);

          if (paymentAmount > 0) {
            if (!sitePaymentsMap[siteId]) {
              sitePaymentsMap[siteId] = {
                siteId: site.id,
                siteName: site.name,
                totalAmount: 0,
                payments: []
              };
            }

            // Check if this payment has already been made by checking transactions
            // ÖNEMLİ: Tarih aralığına göre spesifik matching yapıyoruz
            const possibleSiteIds = [String(site.id), String(site._docId), String(site.siteId)].filter(Boolean);
            const existingTransactions = transactions.filter(transaction => {
              if (transaction.type !== 'expense') return false;
              
              // Check if transaction is for this site
              const isForSite = (transaction.source && (
                transaction.source.includes('Site Ödemesi') &&
                transaction.source.includes(site.name)
              )) || (transaction.siteId && possibleSiteIds.some(id => String(transaction.siteId) === String(id)));
              
              // Check if transaction is for this agreement
              const isForAgreement = (transaction.source && (
                transaction.source.includes(agreement.id) ||
                transaction.source.includes(`Anlaşma ${agreement.id}`) ||
                transaction.description?.includes(agreement.id)
              )) || (transaction.agreementId && String(transaction.agreementId) === String(agreement.id)) ||
              (transaction.agreementIds && Array.isArray(transaction.agreementIds) && transaction.agreementIds.includes(agreement.id));
              
              // Check if transaction is for the same date range (paymentPeriod kontrolü)
              let isForDateRange = true;
              if (transaction.paymentPeriod) {
                const transactionDateFrom = new Date(transaction.paymentPeriod.dateFrom);
                const transactionDateTo = new Date(transaction.paymentPeriod.dateTo);
                const selectedDateFrom = new Date(sitePaymentFilter.dateFrom);
                const selectedDateTo = new Date(sitePaymentFilter.dateTo);
                
                // Tarih aralıkları eşleşmeli (tam eşleşme veya örtüşme)
                isForDateRange = (
                  transactionDateFrom.getTime() === selectedDateFrom.getTime() &&
                  transactionDateTo.getTime() === selectedDateTo.getTime()
                ) || (
                  transactionDateFrom <= selectedDateTo && transactionDateTo >= selectedDateFrom
                );
              }
              
              return isForSite && isForAgreement && isForDateRange;
            });
            
            // Calculate total paid amount for this specific payment
            const totalPaid = existingTransactions.reduce((sum, transaction) => 
              sum + Math.abs(transaction.amount || 0), 0
            );
            
            // Only add if there's still pending amount
            const pendingAmount = Math.max(0, paymentAmount - totalPaid);
            
            if (pendingAmount > 0) {
              sitePaymentsMap[siteId].totalAmount += pendingAmount;
              sitePaymentsMap[siteId].payments.push({
                agreementId: agreement.id,
                companyId: agreement.companyId,
                panelCount,
                weeksInRange,
                weeklyRatePerPanel,
                agreementPercentage,
                amount: pendingAmount,
                totalAmount: paymentAmount,
                paidAmount: totalPaid,
                isPaid: totalPaid >= paymentAmount
              });
            }
          }
        });
      }
    });

    // Convert map to array and sort by site name
    const results = Object.values(sitePaymentsMap).sort((a, b) => 
      a.siteName.localeCompare(b.siteName, 'tr')
    );

    setSitePaymentResults(results);
  };

  // Handle site payment from calculated results
  const handlePaySitePayment = async (result) => {
    try {
      // Find the site
      const site = sites.find(s => String(s.id) === String(result.siteId));
      if (!site) {
        await window.showAlert?.(
          'Hata',
          'Site bulunamadı.',
          'error'
        );
        return;
      }

      // Calculate advance balance and amount to pay
      const advanceBalance = parseFloat(site.advanceBalance || 0);
      const calculatedAmount = result.totalAmount;
      const amountToPay = Math.max(0, calculatedAmount - advanceBalance);
      const remainingAdvance = Math.max(0, advanceBalance - calculatedAmount);
      
      // Show confirmation dialog with advance info
      const confirmMessage = advanceBalance > 0
        ? `${result.siteName} için:\n` +
          `Hesaplanan Tutar: ${formatCurrency(calculatedAmount)}\n` +
          `Avans Bakiyesi: ${formatCurrency(advanceBalance)}\n` +
          `Ödenecek Tutar: ${formatCurrency(amountToPay)}\n` +
          (remainingAdvance > 0 ? `Kalan Avans: ${formatCurrency(remainingAdvance)}\n` : '') +
          `\nÖdeme yapmak istediğinize emin misiniz?`
        : `${result.siteName} için ${formatCurrency(calculatedAmount)} tutarında ödeme yapmak istediğinize emin misiniz?`;
      
      const confirmed = await window.showConfirm?.(
        'Ödeme Onayı',
        confirmMessage,
        'warning'
      );

      if (!confirmed) {
        return;
      }

      // Update site's advance balance first
      const updatedSite = { ...site };
      if (advanceBalance > 0) {
        updatedSite.advanceBalance = remainingAdvance;
      }

      // Create expense transaction
      // If advance covers the full amount, create transaction with amount 0 (no cash deduction)
      // Otherwise, create transaction with the remaining amount
      const expenseData = {
        date: new Date().toISOString().split('T')[0],
        type: 'expense',
        source: `Site Ödemesi - ${result.siteName}${advanceBalance > 0 ? ' (Avans Bakiyesinden)' : ''}`,
        description: `${result.siteName} için hesaplanan site ödemesi (${result.payments.length} anlaşma) - Anlaşmalar: ${result.payments.map(p => p.agreementId).join(', ')}${advanceBalance > 0 ? ` - Avans Bakiyesinden: ${formatCurrency(Math.min(advanceBalance, calculatedAmount))}` : ''}`,
        amount: amountToPay > 0 ? -Math.abs(amountToPay) : 0,
        siteId: result.siteId,
        agreementIds: result.payments.map(p => p.agreementId),
        paymentPeriod: {
          dateFrom: sitePaymentFilter.dateFrom,
          dateTo: sitePaymentFilter.dateTo
        },
        advanceUsed: advanceBalance > 0 ? Math.min(advanceBalance, calculatedAmount) : 0,
        cashPaid: amountToPay
      };

      const newTransaction = await createTransaction(expenseData);
      
      if (newTransaction) {
        // Update transactions state
        setTransactions([...transactions, newTransaction]);

        // Remove pending payments that match the calculated payments
        if (updatedSite.pendingPayments && updatedSite.pendingPayments.length > 0) {
          // For each payment in result.payments, try to find and remove matching pending payment
          const remainingPendingPayments = updatedSite.pendingPayments.filter(pendingPayment => {
            // Check if this pending payment matches any of the calculated payments
            return !result.payments.some(calcPayment => 
              String(calcPayment.agreementId) === String(pendingPayment.agreementId) &&
              Math.abs(calcPayment.amount - pendingPayment.amount) < 0.01 // Allow small floating point differences
            );
          });

          updatedSite.pendingPayments = remainingPendingPayments;
          updatedSite.hasPendingPayment = remainingPendingPayments.length > 0;
        } else {
          // If no pending payments exist, create empty array
          updatedSite.pendingPayments = [];
          updatedSite.hasPendingPayment = false;
        }

        // Update site in backend (with updated advanceBalance)
        await updateSite(result.siteId, updatedSite);

        // Update sites state
        setSites(sites.map(s => s.id === result.siteId ? updatedSite : s));

        // Mark as paid instead of removing from results
        setSitePaymentResults(sitePaymentResults.map(r => 
          r.siteId === result.siteId ? { ...r, paid: true, paidAt: new Date().toISOString() } : r
        ));

        // Log the action
        const logMessage = advanceBalance > 0
          ? `Site ödemesi yapıldı: ${result.siteName} (Hesaplanan: ${formatCurrency(calculatedAmount)}, Avans: ${formatCurrency(Math.min(advanceBalance, calculatedAmount))}, Kasa: ${formatCurrency(amountToPay)}, Kalan Avans: ${formatCurrency(remainingAdvance)})`
          : `Site ödemesi yapıldı: ${result.siteName} (${formatCurrency(calculatedAmount)})`;
        
        await createLog({
          user: 'Admin',
          action: logMessage
        });

        const successMessage = advanceBalance > 0
          ? `${result.siteName} için ödeme yapıldı:\n` +
            `Hesaplanan: ${formatCurrency(calculatedAmount)}\n` +
            `Avans Bakiyesinden: ${formatCurrency(Math.min(advanceBalance, calculatedAmount))}\n` +
            (amountToPay > 0 ? `Kasadan: ${formatCurrency(amountToPay)}\n` : '') +
            (remainingAdvance > 0 ? `Kalan Avans: ${formatCurrency(remainingAdvance)}` : '')
          : `${result.siteName} için ${formatCurrency(calculatedAmount)} tutarında ödeme başarıyla yapıldı.`;
        
        await window.showAlert?.(
          'Başarılı',
          successMessage,
          'success'
        );
      } else {
        throw new Error('Transaction creation failed');
      }
    } catch (error) {
      console.error('Error processing site payment:', error);
      await window.showAlert?.(
        'Hata',
        'Ödeme işlemi sırasında bir hata oluştu: ' + (error.message || 'Bilinmeyen hata'),
        'error'
      );
    }
  };

  // Handle report filter change
  const handleReportFilterChange = (e) => {
    const { name, value } = e.target;
    setReportFilter({
      ...reportFilter,
      [name]: value
    });
  };

  // Generate report data
  const generateReportData = () => {
    // Filter transactions based on report date range
    const reportTransactions = transactions.filter(transaction => {
      if (reportFilter.dateFrom && transaction.date < reportFilter.dateFrom) {
        return false;
      }
      
      if (reportFilter.dateTo && transaction.date > reportFilter.dateTo) {
        return false;
      }
      
      return true;
    });

    // Categorize transactions
    const paymentsToPartners = reportTransactions.filter(t => 
      t.type === 'expense' && t.source.includes('Ortak Ödemesi')
    );
    
    const paymentsToSites = reportTransactions.filter(t => 
      t.type === 'expense' && t.source.includes('Site Ödemesi')
    );
    
    const paymentsFromCompanies = reportTransactions.filter(t => 
      t.type === 'income' && t.source.includes('Anlaşma Ödemesi')
    );

    // Calculate totals
    const totalPaymentsToPartners = paymentsToPartners.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const totalPaymentsToSites = paymentsToSites.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const totalPaymentsFromCompanies = paymentsFromCompanies.reduce((sum, t) => sum + t.amount, 0);
    
    // Sort by amount
    const sortedPaymentsToPartners = [...paymentsToPartners].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    const sortedPaymentsToSites = [...paymentsToSites].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    const sortedPaymentsFromCompanies = [...paymentsFromCompanies].sort((a, b) => b.amount - a.amount);

    return {
      paymentsToPartners: sortedPaymentsToPartners,
      paymentsToSites: sortedPaymentsToSites,
      paymentsFromCompanies: sortedPaymentsFromCompanies,
      totals: {
        paymentsToPartners: totalPaymentsToPartners,
        paymentsToSites: totalPaymentsToSites,
        paymentsFromCompanies: totalPaymentsFromCompanies,
        totalExpenses: totalPaymentsToPartners + totalPaymentsToSites,
        totalIncome: totalPaymentsFromCompanies,
        net: totalPaymentsFromCompanies - (totalPaymentsToPartners + totalPaymentsToSites)
      }
    };
  };

  // Function to generate PDF of the report
  const generateReportPDF = async () => {
    if (!reportRef.current) return;
    
    try {
      // Generate canvas from the report content
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true
      });
      
      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Add new pages if content is longer than one page
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Save the PDF
      pdf.save(`kasa_raporu_${reportFilter.dateFrom || 'baslangic'}_${reportFilter.dateTo || 'bitis'}.pdf`);
      
      await window.showAlert(
        'Başarılı',
        'PDF raporu başarıyla oluşturuldu ve indirildi.',
        'success'
      );
    } catch (error) {
      console.error('Error generating PDF:', error);
      await window.showAlert(
        'Hata',
        'PDF oluşturma sırasında bir hata oluştu.',
        'error'
      );
    }
  };

  // Function to reset all cash data
  const handleResetAllCash = () => {
    setShowConfirmModal(true);
  };

  // Handle confirmation
  const handleConfirmReset = async () => {
    try {
      setShowConfirmModal(false);
      
      console.log('Starting cash reset process...');
      console.log('Total transactions to delete:', transactions.length);
      
      // Delete transactions in batches to avoid overwhelming the server
      const batchSize = 5;
      const batches = [];
      
      for (let i = 0; i < transactions.length; i += batchSize) {
        batches.push(transactions.slice(i, i + batchSize));
      }
      
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`Processing batch ${i + 1}/${batches.length} with ${batch.length} transactions`);
        
        try {
          const batchPromises = batch.map(transaction => 
            deleteTransaction(transaction.id).catch(error => {
              console.error(`Error deleting transaction ${transaction.id}:`, error);
              return { error: true, id: transaction.id };
            })
          );
          
          const batchResults = await Promise.all(batchPromises);
          
          batchResults.forEach(result => {
            if (result && result.error) {
              errorCount++;
            } else {
              successCount++;
            }
          });
          
          // Add delay between batches to prevent overwhelming the server
          if (i < batches.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (batchError) {
          console.error(`Error processing batch ${i + 1}:`, batchError);
          errorCount += batch.length;
        }
      }
      
      console.log(`Reset completed: ${successCount} successful, ${errorCount} errors`);
      
      // Reset all partner balances to 0
      try {
        console.log('Resetting all partner balances...');
        const currentPartners = await getPartners();
        
        for (const partner of currentPartners) {
          if (partner.balance && partner.balance !== 0) {
            const updatedPartner = {
              ...partner,
              balance: 0
            };
            await updatePartner(partner.id, updatedPartner);
            console.log(`Partner ${partner.name} balance reset to 0`);
          }
        }
        console.log('All partner balances reset successfully');
      } catch (partnerError) {
        console.error('Error resetting partner balances:', partnerError);
        // Don't fail the entire operation if partner reset fails
      }
      
      // Reset all agreements' financial data
      try {
        console.log('Resetting all agreements financial data...');
        const currentAgreements = await getAgreements();
        let agreementsResetCount = 0;
        
        for (const agreement of currentAgreements) {
          const hasFinancialData = agreement.paymentReceived || 
                                   agreement.creditPaymentReceived || 
                                   agreement.totalAmount;
          
          if (hasFinancialData) {
            const updatedAgreement = {
              ...agreement,
              paymentReceived: false,
              creditPaymentReceived: false,
              totalAmount: 0,
              paidAmount: 0
            };
            await updateAgreement(agreement.id, updatedAgreement);
            agreementsResetCount++;
            console.log(`Agreement ${agreement.id} financial data reset`);
          }
        }
        console.log(`All agreements financial data reset successfully (${agreementsResetCount} agreements)`);
      } catch (agreementError) {
        console.error('Error resetting agreements financial data:', agreementError);
        // Don't fail the entire operation if agreement reset fails
      }
      
      // Reset all sites' pending payments
      try {
        console.log('Resetting all sites pending payments...');
        const currentSites = await getSites();
        let sitesResetCount = 0;
        
        for (const site of currentSites) {
          if (site.pendingPayments && site.pendingPayments.length > 0) {
            const updatedSite = {
              ...site,
              pendingPayments: [],
              hasPendingPayment: false
            };
            await updateSite(site.id, updatedSite);
            sitesResetCount++;
            console.log(`Site ${site.name} pending payments reset`);
          }
        }
        console.log(`All sites pending payments reset successfully (${sitesResetCount} sites)`);
      } catch (siteError) {
        console.error('Error resetting sites pending payments:', siteError);
        // Don't fail the entire operation if site reset fails
      }
      
      // Reset all companies' credit data
      try {
        console.log('Resetting all companies credit data...');
        const currentCompanies = await getCompanies();
        let companiesResetCount = 0;
        
        for (const company of currentCompanies) {
          if (company.credit || (company.creditHistory && company.creditHistory.length > 0)) {
            const updatedCompany = {
              ...company,
              credit: 0,
              creditHistory: []
            };
            await updateCompany(company.id, updatedCompany);
            companiesResetCount++;
            console.log(`Company ${company.name} credit data reset`);
          }
        }
        console.log(`All companies credit data reset successfully (${companiesResetCount} companies)`);
      } catch (companyError) {
        console.error('Error resetting companies credit data:', companyError);
        // Don't fail the entire operation if company reset fails
      }
      
      // Update state to reflect empty transactions
      setTransactions([]);
      
      // Reload all data to reflect changes
      try {
        const [updatedTransactions, updatedPartners, updatedAgreements, updatedSites, updatedCompanies] = await Promise.all([
          getTransactions(),
          getPartners(),
          getAgreements(),
          getSites(),
          getCompanies()
        ]);
        setTransactions(updatedTransactions);
        setPartners(updatedPartners);
        setAgreements(updatedAgreements);
        setSites(updatedSites);
        setCompanies(updatedCompanies);
      } catch (reloadError) {
        console.error('Error reloading data:', reloadError);
      }
      
      // Show success message with details
      if (errorCount === 0) {
        await window.showAlert(
          'Başarılı',
          `Tüm mali veriler başarıyla sıfırlandı. ${successCount} işlem silindi, tüm ortak bakiyeleri, anlaşma mali bilgileri, site ödemeleri ve firma kredi bilgileri sıfırlandı.`,
          'success'
        );
      } else {
        await window.showAlert(
          'Kısmen Başarılı',
          `${successCount} işlem silindi, ${errorCount} işlem silinemedi. Tüm mali veriler sıfırlandı. Sayfayı yenileyin.`,
          'warning'
        );
      }
    } catch (error) {
      console.error('Error resetting cash data:', error);
      await window.showAlert(
        'Hata',
        'Kasa verileri sıfırlanırken bir hata oluştu. Lütfen sayfayı yenileyin ve tekrar deneyin.',
        'error'
      );
    }
  };

  // Handle cancel
  const handleCancelReset = () => {
    setShowConfirmModal(false);
  };

  // Handle cancel transaction (vazgeç)
  const handleCancelTransaction = async (transaction) => {
    try {
      // Confirm cancellation
      const confirmed = await window.showConfirm(
        'Ödeme İptali',
        `Bu ödemeyi iptal etmek istediğinizden emin misiniz? ${transaction.agreementId ? 'Anlaşmanın ödeme durumu sıfırlanacaktır.' : ''}`,
        'warning'
      );
      
      if (!confirmed) return;
      
      console.log('Cancelling transaction:', transaction);
      
      // If this is an income transaction with an agreement, reverse the payment
      if (transaction.type === 'income' && transaction.agreementId) {
        try {
          const agreement = agreements.find(a => String(a.id) === String(transaction.agreementId));
          if (agreement) {
            const paymentAmount = Math.abs(transaction.amount);
            const currentPaidAmount = agreement.paidAmount || 0;
            const newPaidAmount = Math.max(0, currentPaidAmount - paymentAmount);
            const totalAmount = agreement.totalAmount || 0;
            const remainingAmount = totalAmount - newPaidAmount;
            const paymentStatus = remainingAmount <= 0.01 ? 'paid' : (newPaidAmount > 0 ? 'partial' : 'unpaid');
            
            const updatedAgreement = {
              ...agreement,
              paidAmount: newPaidAmount,
              remainingAmount: remainingAmount,
              paymentStatus: paymentStatus,
              paymentReceived: remainingAmount <= 0.01,
              // Only set paymentDate if full payment is received, otherwise remove it
              ...(remainingAmount <= 0.01 ? { paymentDate: agreement.paymentDate } : {})
            };
            
            // Remove paymentDate if no payment remains
            if (newPaidAmount === 0) {
              delete updatedAgreement.paymentDate;
            }
            
            await updateAgreement(agreement.id, updatedAgreement);
            
            // Update local state
            setAgreements(prev => prev.map(a => 
              String(a.id) === String(agreement.id) ? updatedAgreement : a
            ));
            
            console.log(`Agreement ${agreement.id} payment reversed: ${paymentAmount} subtracted`);
          }
        } catch (agreementError) {
          console.error('Error reversing agreement payment:', agreementError);
          // Continue with transaction deletion even if agreement update fails
        }
      }
      
      // If this is a check payment, update check status
      if (transaction.checkId) {
        try {
          const allChecks = await getChecks();
          const check = allChecks.find(c => String(c.id) === String(transaction.checkId) || String(c._docId) === String(transaction.checkId));
          
          if (check && check.status === 'cleared') {
            // Revert check status to pending
            await updateCheck(check.id || check._docId, {
              ...check,
              status: 'pending'
            });
            console.log(`Check ${check.checkNumber} status reverted to pending`);
          }
        } catch (checkError) {
          console.error('Error updating check status:', checkError);
          // Continue with transaction deletion even if check update fails
        }
      }
      
      // Check if this is a partner payment transaction
      const isPartnerPayment = transaction.source?.includes('Ortak Ödemesi') || 
                               transaction.source?.includes('Ortak Alacağı');
      
      let partnerName = null;
      if (isPartnerPayment) {
        // Extract partner name from source
        const match = transaction.source?.match(/Ortak (?:Ödemesi|Alacağı) - (.+)/);
        if (match) {
          partnerName = match[1];
        }
      }
      
      // Delete the transaction
      await deleteTransaction(transaction.id);
      
      // If this was a partner payment, update partner balance
      if (isPartnerPayment && partnerName) {
        try {
          // Get current partners
          const partners = await getPartners();
          const partner = partners.find(p => p.name === partnerName);
          
          if (partner) {
            // Calculate the amount that was paid to partner
            const shareAmount = Math.abs(transaction.amount);
            
            // Update partner balance (subtract the amount that was paid)
            const updatedPartner = {
              ...partner,
              balance: (partner.balance || 0) - shareAmount
            };
            
            // Update partner in database
            await updatePartner(partner.id, updatedPartner);
            console.log(`Partner ${partnerName} balance updated: ${shareAmount} subtracted`);
          }
        } catch (partnerError) {
          console.error('Error updating partner balance:', partnerError);
          // Don't fail the transaction deletion if partner update fails
        }
      }
      
      // Update local state
      setTransactions(prev => prev.filter(t => t.id !== transaction.id));
      
      // Show success message
      await window.showAlert(
        'Başarılı',
        'Ödeme iptal edildi. Anlaşma ödeme durumu güncellendi.',
        'success'
      );
      
      // Log the action
      try {
        await createLog({
          user: 'Admin',
          action: `Ödeme iptal edildi: ${transaction.source} - ${transaction.amount} TL${transaction.agreementId ? ` (Anlaşma: ${transaction.agreementId})` : ''}`
        });
      } catch (logError) {
        console.error('Error creating log:', logError);
      }
      
      console.log('Transaction cancelled successfully');
    } catch (error) {
      console.error('Error cancelling transaction:', error);
      await window.showAlert(
        'Hata',
        'Ödeme iptal edilirken bir hata oluştu: ' + (error.message || 'Bilinmeyen hata'),
        'error'
      );
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-3 text-muted">İşlemler yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Generate report data if showing report
  const reportData = showReport ? generateReportData() : null;

  return (
    <div className="container-fluid px-2 px-md-3 px-lg-4 py-3 py-md-4">
      {/* Header - Responsive */}
      <div className="page-header mb-3 mb-md-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">
          <div>
            <h2 className="h3 h4-md fw-bold mb-1">Kasa</h2>
                <p className="mb-0 small">Gelir, gider ve borç işlemleri</p>
          </div>
          <div className="d-flex gap-2 flex-wrap w-100 w-md-auto">
            <button 
                  onClick={() => {
                    setShowDebtsView(!showDebtsView);
                    setShowSitePaymentCalc(false);
                    setShowReport(false);
                  }}
                  className={`btn btn-sm ${showDebtsView ? 'btn-page-outline' : 'btn-page-primary'} d-flex align-items-center`}
                >
                  <i className="bi bi-journal-text me-1 me-md-2"></i>
                  <span className="d-none d-sm-inline">{showDebtsView ? 'Borçları Kapat' : 'Borçlar'}</span>
                  <span className="d-sm-none">Borçlar</span>
                </button>
            <button 
              onClick={() => {
                    setShowDebtsView(false);
                    setShowReport(false);
                    setShowSitePaymentCalc(!showSitePaymentCalc);
                  }}
              className={`btn btn-sm ${showSitePaymentCalc ? 'btn-page-outline' : 'btn-page-primary'} d-flex align-items-center`}
            >
              <i className="bi bi-calculator me-1 me-md-2"></i>
              <span className="d-none d-md-inline">{showSitePaymentCalc ? 'Site Ödemeleri Kapat' : 'Site Ödemeleri Hesapla'}</span>
              <span className="d-md-none">Site Ödemeleri</span>
            </button>
            <button 
              onClick={() => {
                setShowSitePaymentCalc(false);
                setShowReport(!showReport);
              }}
              className={`btn btn-sm ${showReport ? 'btn-page-outline' : 'btn-page-primary'} d-flex align-items-center`}
            >
              <i className={`bi ${showReport ? 'bi-currency-dollar' : 'bi-file-earmark-bar-graph'} me-1 me-md-2`}></i>
              <span className="d-none d-sm-inline">{showReport ? 'İşlemleri Göster' : 'Rapor'}</span>
              <span className="d-sm-none">Rapor</span>
            </button>
            <button 
              onClick={handleAddIncome}
              className="btn btn-sm btn-page-primary d-flex align-items-center"
              disabled={isObserver()}
            >
              <i className="bi bi-plus-circle me-1 me-md-2"></i>
              <span className="d-none d-sm-inline">Gelir Ekle</span>
              <span className="d-sm-none">Gelir</span>
            </button>
            <button 
              onClick={handleAddExpense}
              className="btn btn-sm btn-page-outline d-flex align-items-center"
              disabled={isObserver()}
            >
              <i className="bi bi-dash-circle me-1 me-md-2"></i>
              <span className="d-none d-sm-inline">Gider Ekle</span>
              <span className="d-sm-none">Gider</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      {!showReport && (
        <div className="mb-4">
          <ul className="nav nav-tabs" id="cashierTabs" role="tablist">
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
                type="button"
                role="tab"
              >
                <i className="bi bi-list-ul me-2"></i>
                Tüm İşlemler
                <span className="badge bg-primary ms-2">{tabStats.all.count}</span>
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'income' ? 'active' : ''}`}
                onClick={() => setActiveTab('income')}
                type="button"
                role="tab"
              >
                <i className="bi bi-arrow-down-circle me-2"></i>
                Gelirler
                <span className="badge bg-success ms-2">{tabStats.income.count}</span>
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'expense' ? 'active' : ''}`}
                onClick={() => setActiveTab('expense')}
                type="button"
                role="tab"
              >
                <i className="bi bi-arrow-up-circle me-2"></i>
                Giderler
                <span className="badge bg-danger ms-2">{tabStats.expense.count}</span>
              </button>
            </li>
          </ul>
        </div>
      )}

      {/* Debts View */}
      {showDebtsView && (
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '16px', overflow: 'hidden' }}>
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="fw-bold text-dark mb-0">Borçlar</h3>
              <button
                className="btn btn-primary rounded-pill px-4 py-2 d-flex align-items-center"
                onClick={() => {
                  setEditingDebt(null);
                  setDebtFormData({
                    name: '',
                    amount: '',
                    dueDate: '',
                    description: '',
                    type: 'manual',
                    isRecurring: false
                  });
                  setShowDebtForm(true);
                }}
                disabled={isObserver()}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Borç Ekle
              </button>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Ad</th>
                    <th>Tür</th>
                    <th>Ödenecek Tarih</th>
                    <th className="text-end">Tutar</th>
                    <th className="text-end">Kalan</th>
                    <th className="text-center">Tekrarlayan</th>
                    <th className="text-end">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {debts.length > 0 ? (
                    debts.map((debt) => {
                      const remaining = getDebtRemaining(debt);
                      const isPaid = remaining <= 0.01;
                      const isRecurring = !!debt.isRecurring;
                      const typeLabel = debt.type === 'site' ? 'Site Ödemesi' : (isRecurring ? 'Tekrarlayan Borç' : 'Borç');

                      return (
                        <tr key={debt.id} className={isPaid ? 'table-success' : ''}>
                          <td className="fw-medium">
                            {debt.name}
                            {debt.description && (
                              <div className="text-muted small">{debt.description}</div>
                            )}
                          </td>
                          <td>
                            <span className="badge bg-secondary-subtle text-secondary-emphasis">
                              {typeLabel}
                            </span>
                          </td>
                          <td className="small">{debt.dueDate}</td>
                          <td className="text-end fw-medium">
                            {formatCurrency(Math.abs(parseFloat(debt.amount) || 0))}
                          </td>
                          <td className="text-end fw-bold">
                            {formatCurrency(remaining)}
                          </td>
                          <td className="text-center">
                            {isRecurring ? (
                              <span className="badge bg-info-subtle text-info-emphasis">
                                <i className="bi bi-arrow-repeat me-1"></i>
                                Aylık
                              </span>
                            ) : (
                              <span className="badge bg-light text-muted">Tek Sefer</span>
                            )}
                          </td>
                          <td className="text-end">
                            <div className="d-flex gap-1 justify-content-end">
                              {isRecurring && (
                                <button
                                  className="btn btn-sm btn-outline-secondary rounded-pill py-1 px-2"
                                  title="Geçmiş Ödemeleri Göster"
                                  onClick={() => {
                                    setSelectedDebtForHistory(debt);
                                    setShowDebtHistory(true);
                                  }}
                                >
                                  <i className="bi bi-clock-history"></i>
                                </button>
                              )}
                              <button
                                className="btn btn-sm btn-outline-primary rounded-pill py-1 px-2"
                                title="Düzenle"
                                disabled={isObserver()}
                                onClick={() => {
                                  setEditingDebt(debt);
                                  setDebtFormData({
                                    name: debt.name || '',
                                    amount: Math.abs(parseFloat(debt.amount) || 0),
                                    dueDate: debt.dueDate || '',
                                    description: debt.description || '',
                                    type: debt.type || (debt.isRecurring ? 'recurring' : 'manual'),
                                    isRecurring: !!debt.isRecurring
                                  });
                                  setShowDebtForm(true);
                                }}
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              {!isPaid && (
                                <button
                                  className="btn btn-sm btn-success rounded-pill py-1 px-2"
                                  title="Borç Öde"
                                  disabled={isObserver()}
                                  onClick={async () => {
                                    // Basit ödeme için gider formunu borca göre doldur
                                    setSelectedDebtForPayment(debt);
                                    setFormData({
                                      date: new Date().toISOString().split('T')[0],
                                      type: 'expense',
                                      source: `Borç Ödemesi - ${debt.name}`,
                                      description: `Borç ödemesi (Borç ID: ${debt.id})`,
                                      amount: remaining.toFixed(2),
                                      partnerId: ''
                                    });
                                    setEditingTransaction(null);
                                    setShowExpenseForm(true);
                                  }}
                                >
                                  <i className="bi bi-currency-dollar"></i>
                                </button>
                              )}
                              <button
                                className="btn btn-sm btn-outline-danger rounded-pill py-1 px-2"
                                title="Sil"
                                disabled={isObserver()}
                                onClick={async () => {
                                  const confirm = await window.showConfirm?.(
                                    'Borcu Sil',
                                    `"${debt.name}" borcunu silmek istediğinize emin misiniz? (İlgili geçmiş ödemeler silinmez)`,
                                    'warning'
                                  );
                                  if (!confirm) return;
                                  const ok = await deleteDebt(debt.id);
                                  if (ok) {
                                    setDebts(debts.filter((d) => d.id !== debt.id));
                                  }
                                }}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-4">
                        <div className="d-flex flex-column align-items-center text-muted">
                          <i className="bi bi-journal-text mb-2" style={{ fontSize: '2rem' }}></i>
                          <p className="mb-0">Henüz kayıtlı borç bulunmuyor.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Site Payment Calculation View */}
      {!showDebtsView && showSitePaymentCalc && (
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '16px', overflow: 'hidden' }}>
          <div className="card-body">
            <h3 className="fw-bold text-dark mb-4">Site Ödemeleri Hesaplama</h3>
            
            {/* Date Range Selection */}
            <div className="row mb-4 g-3">
              <div className="col-md-5">
                <label htmlFor="sitePaymentDateFrom" className="form-label fw-medium">Başlangıç Tarihi</label>
                <input
                  type="date"
                  id="sitePaymentDateFrom"
                  name="dateFrom"
                  value={sitePaymentFilter.dateFrom}
                  onChange={handleSitePaymentFilterChange}
                  className="form-control form-control-custom rounded-pill px-3"
                />
              </div>
              <div className="col-md-5">
                <label htmlFor="sitePaymentDateTo" className="form-label fw-medium">Bitiş Tarihi</label>
                <input
                  type="date"
                  id="sitePaymentDateTo"
                  name="dateTo"
                  value={sitePaymentFilter.dateTo}
                  onChange={handleSitePaymentFilterChange}
                  className="form-control form-control-custom rounded-pill px-3"
                />
              </div>
              <div className="col-md-2 d-flex align-items-end">
                <button
                  onClick={calculateSitePayments}
                  className="btn btn-primary w-100 rounded-pill"
                >
                  <i className="bi bi-calculator me-2"></i>
                  Hesapla
                </button>
              </div>
            </div>

            {/* Results */}
            {sitePaymentResults.length > 0 && (
              <div className="mt-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-bold mb-0">Hesaplanan Ödemeler</h5>
                  <div className="text-end">
                    <p className="mb-0 text-muted small">Toplam Ödenecek Tutar</p>
                    <h4 className="mb-0 fw-bold text-primary">
                      {formatCurrency(sitePaymentResults.reduce((sum, result) => sum + result.totalAmount, 0))}
                    </h4>
                  </div>
                </div>
                
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Site Adı</th>
                        <th className="text-end">Toplam Tutar</th>
                        <th>Detaylar</th>
                        <th className="text-center">İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sitePaymentResults.map((result) => {
                        const site = sites.find(s => String(s.id) === String(result.siteId));
                        const advanceBalance = parseFloat(site?.advanceBalance || 0);
                        const amountToPay = Math.max(0, result.totalAmount - advanceBalance);
                        const remainingAdvance = Math.max(0, advanceBalance - result.totalAmount);
                        
                        return (
                        <tr key={result.siteId} className={result.paid ? 'table-success' : ''}>
                          <td className="fw-medium">{result.siteName}</td>
                          <td className="text-end">
                            <div className="d-flex flex-column align-items-end">
                              <span className="fw-bold text-primary">
                                {formatCurrency(amountToPay)}
                              </span>
                              {advanceBalance > 0 && (
                                <div className="small text-muted mt-1">
                                  <div>Hesaplanan: {formatCurrency(result.totalAmount)}</div>
                                  <div className="text-info">Avans: {formatCurrency(advanceBalance)}</div>
                                  {remainingAdvance > 0 && (
                                    <div className="text-success">Kalan Avans: {formatCurrency(remainingAdvance)}</div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-primary"
                              type="button"
                              data-bs-toggle="collapse"
                              data-bs-target={`#sitePaymentDetails-${result.siteId}`}
                            >
                              <i className="bi bi-chevron-down me-1"></i>
                              Detaylar ({result.payments.length})
                            </button>
                          </td>
                          <td className="text-center">
                            {result.paid ? (
                              <span className="badge bg-success">
                                <i className="bi bi-check-circle me-1"></i>
                                Ödendi
                              </span>
                            ) : (
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => handlePaySitePayment(result)}
                                title="Ödeme Yap"
                              >
                                <i className="bi bi-currency-dollar me-1"></i>
                                Ödeme Yap
                              </button>
                            )}
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Payment Details (Collapsible) */}
                {sitePaymentResults.map((result) => (
                  <div key={`details-${result.siteId}`} className="collapse mb-3" id={`sitePaymentDetails-${result.siteId}`}>
                    <div className="card card-body bg-light">
                      <h6 className="fw-bold mb-3">{result.siteName} - Ödeme Detayları</h6>
                      <div className="table-responsive">
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Anlaşma</th>
                              <th className="text-end">Panel</th>
                              <th className="text-end">Hafta</th>
                              <th className="text-end">Haftalık Oran</th>
                              <th className="text-end">Anlaşma %</th>
                              <th className="text-end">Tutar</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.payments.map((payment, index) => {
                              const agreement = agreements.find(a => String(a.id) === String(payment.agreementId));
                              const company = agreement ? companies.find(c => String(c.id) === String(agreement.companyId)) : null;
                              return (
                                <tr key={index}>
                                  <td>
                                    {company ? company.name : `Anlaşma #${payment.agreementId}`}
                                  </td>
                                  <td className="text-end">{payment.panelCount}</td>
                                  <td className="text-end">{payment.weeksInRange}</td>
                                  <td className="text-end">{formatCurrency(payment.weeklyRatePerPanel)}</td>
                                  <td className="text-end">{payment.agreementPercentage}%</td>
                                  <td className="text-end fw-bold">{formatCurrency(payment.amount)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {sitePaymentResults.length === 0 && sitePaymentFilter.dateFrom && sitePaymentFilter.dateTo && (
              <div className="alert alert-info mt-4">
                <i className="bi bi-info-circle me-2"></i>
                Seçili tarih aralığında ödeme gerektiren anlaşma bulunamadı.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Report View */}
      {showReport && !showDebtsView ? (
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '16px', overflow: 'hidden' }}>
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="fw-bold text-dark mb-0">Aylık Rapor</h3>
              <button 
                onClick={generateReportPDF}
                className="btn btn-primary rounded-pill px-4 py-2 d-flex align-items-center"
              >
                <i className="bi bi-file-earmark-pdf me-2"></i>
                PDF Olarak İndir
              </button>
            </div>
            
            {/* Report Filters */}
            <div className="row mb-4 g-3">
              <div className="col-md-5">
                <label htmlFor="reportDateFrom" className="form-label fw-medium">Başlangıç Tarihi</label>
                <input
                  type="date"
                  id="reportDateFrom"
                  name="dateFrom"
                  value={reportFilter.dateFrom}
                  onChange={handleReportFilterChange}
                  className="form-control form-control-custom rounded-pill px-3"
                />
              </div>
              <div className="col-md-5">
                <label htmlFor="reportDateTo" className="form-label fw-medium">Bitiş Tarihi</label>
                <input
                  type="date"
                  id="reportDateTo"
                  name="dateTo"
                  value={reportFilter.dateTo}
                  onChange={handleReportFilterChange}
                  className="form-control form-control-custom rounded-pill px-3"
                />
              </div>
            </div>

            {/* Report Content (for PDF export) */}
            <div ref={reportRef}>
              {/* Report Header for PDF */}
              <div className="mb-4 text-center">
                <h2 className="fw-bold">Kasa Raporu</h2>
                <p className="text-muted">
                  {reportFilter.dateFrom ? `Başlangıç: ${reportFilter.dateFrom}` : 'Başlangıç: Tüm Tarihler'} - 
                  {reportFilter.dateTo ? ` Bitiş: ${reportFilter.dateTo}` : ' Bitiş: Tüm Tarihler'}
                </p>
              </div>

              {/* Report Summary */}
              {reportData && (
                <div className="row mb-4 g-3">
                  <div className="col-md-4">
                    <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                      <div className="card-body">
                        <div className="d-flex align-items-center">
                          <div className="rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center me-3" 
                               style={{ width: '56px', height: '56px' }}>
                            <i className="bi bi-arrow-down-circle text-success fs-4"></i>
                          </div>
                          <div>
                            <p className="mb-1 text-muted small">Toplam Gelir</p>
                            <h4 className="mb-0 fw-bold text-dark">{formatCurrency(reportData.totals.totalIncome)}</h4>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                      <div className="card-body">
                        <div className="d-flex align-items-center">
                          <div className="rounded-circle bg-danger bg-opacity-10 d-flex align-items-center justify-content-center me-3" 
                               style={{ width: '56px', height: '56px' }}>
                            <i className="bi bi-arrow-up-circle text-danger fs-4"></i>
                          </div>
                          <div>
                            <p className="mb-1 text-muted small">Toplam Gider</p>
                            <h4 className="mb-0 fw-bold text-dark">{formatCurrency(reportData.totals.totalExpenses)}</h4>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                      <div className="card-body">
                        <div className="d-flex align-items-center">
                          <div className={`rounded-circle ${reportData.totals.net >= 0 ? 'bg-success' : 'bg-danger'} bg-opacity-10 d-flex align-items-center justify-content-center me-3`} 
                               style={{ width: '56px', height: '56px' }}>
                            <i className={`bi bi-wallet2 ${reportData.totals.net >= 0 ? 'text-success' : 'text-danger'} fs-4`}></i>
                          </div>
                          <div>
                            <p className="mb-1 text-muted small">Net</p>
                            <h4 className={`mb-0 fw-bold ${reportData.totals.net >= 0 ? 'text-success' : 'text-danger'}`}>{formatCurrency(reportData.totals.net)}</h4>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Detailed Report Sections */}
              {reportData && (
                <div className="row g-4">
                  {/* Payments from Companies */}
                  <div className="col-12">
                    <div className="card border-0 shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                      <div className="card-header bg-primary bg-opacity-10 border-0 py-3">
                        <h5 className="mb-0 fw-bold text-primary">Firmalardan Alınan Ödemeler</h5>
                      </div>
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h6 className="fw-medium">Toplam: {formatCurrency(reportData.totals.paymentsFromCompanies)}</h6>
                        </div>
                        <div className="table-responsive">
                          <table className="table table-borderless align-middle">
                            <thead>
                              <tr className="border-bottom">
                                <th className="text-muted small fw-medium">Tarih</th>
                                <th className="text-muted small fw-medium">Firma</th>
                                <th className="text-muted small fw-medium">Açıklama</th>
                                <th className="text-muted small fw-medium text-end">Tutar</th>
                              </tr>
                            </thead>
                            <tbody>
                              {reportData.paymentsFromCompanies.map((transaction, index) => (
                                <tr className="border-bottom" key={index}>
                                  <td className="small">{transaction.date}</td>
                                  <td className="fw-medium">{transaction.source.replace('Anlaşma Ödemesi - ', '')}</td>
                                  <td className="text-muted small">{transaction.description}</td>
                                  <td className="text-end fw-medium text-success">{formatCurrency(transaction.amount)}</td>
                                </tr>
                              ))}
                              {reportData.paymentsFromCompanies.length === 0 && (
                                <tr>
                                  <td colSpan="4" className="text-center py-4">
                                    <div className="d-flex flex-column align-items-center">
                                      <i className="bi bi-wallet2 text-muted mb-2" style={{ fontSize: '2rem' }}></i>
                                      <p className="mb-0 text-muted">Kayıt bulunamadı</p>
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

                  {/* Payments to Sites */}
                  <div className="col-12">
                    <div className="card border-0 shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                      <div className="card-header bg-warning bg-opacity-10 border-0 py-3">
                        <h5 className="mb-0 fw-bold text-warning">Sitelere Yapılan Ödemeler</h5>
                      </div>
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h6 className="fw-medium">Toplam: {formatCurrency(reportData.totals.paymentsToSites)}</h6>
                        </div>
                        <div className="table-responsive">
                          <table className="table table-borderless align-middle">
                            <thead>
                              <tr className="border-bottom">
                                <th className="text-muted small fw-medium">Tarih</th>
                                <th className="text-muted small fw-medium">Site</th>
                                <th className="text-muted small fw-medium">Açıklama</th>
                                <th className="text-muted small fw-medium text-end">Tutar</th>
                              </tr>
                            </thead>
                            <tbody>
                              {reportData.paymentsToSites.map((transaction, index) => (
                                <tr className="border-bottom" key={index}>
                                  <td className="small">{transaction.date}</td>
                                  <td className="fw-medium">{transaction.source.replace('Site Ödemesi - ', '')}</td>
                                  <td className="text-muted small">{transaction.description}</td>
                                  <td className="text-end fw-medium text-danger">{formatCurrency(Math.abs(transaction.amount))}</td>
                                </tr>
                              ))}
                              {reportData.paymentsToSites.length === 0 && (
                                <tr>
                                  <td colSpan="4" className="text-center py-4">
                                    <div className="d-flex flex-column align-items-center">
                                      <i className="bi bi-wallet2 text-muted mb-2" style={{ fontSize: '2rem' }}></i>
                                      <p className="mb-0 text-muted">Kayıt bulunamadı</p>
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

                  {/* Payments to Partners */}
                  <div className="col-12">
                    <div className="card border-0 shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                      <div className="card-header bg-info bg-opacity-10 border-0 py-3">
                        <h5 className="mb-0 fw-bold text-info">Ortaklara Yapılan Ödemeler</h5>
                      </div>
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h6 className="fw-medium">Toplam: {formatCurrency(reportData.totals.paymentsToPartners)}</h6>
                        </div>
                        <div className="table-responsive">
                          <table className="table table-borderless align-middle">
                            <thead>
                              <tr className="border-bottom">
                                <th className="text-muted small fw-medium">Tarih</th>
                                <th className="text-muted small fw-medium">Ortak</th>
                                <th className="text-muted small fw-medium">Açıklama</th>
                                <th className="text-muted small fw-medium text-end">Tutar</th>
                              </tr>
                            </thead>
                            <tbody>
                              {reportData.paymentsToPartners.map((transaction, index) => (
                                <tr className="border-bottom" key={index}>
                                  <td className="small">{transaction.date}</td>
                                  <td className="fw-medium">{transaction.source.replace('Ortak Ödemesi - ', '')}</td>
                                  <td className="text-muted small">{transaction.description}</td>
                                  <td className="text-end fw-medium text-danger">{formatCurrency(Math.abs(transaction.amount))}</td>
                                </tr>
                              ))}
                              {reportData.paymentsToPartners.length === 0 && (
                                <tr>
                                  <td colSpan="4" className="text-center py-4">
                                    <div className="d-flex flex-column align-items-center">
                                      <i className="bi bi-wallet2 text-muted mb-2" style={{ fontSize: '2rem' }}></i>
                                      <p className="mb-0 text-muted">Kayıt bulunamadı</p>
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
              )}
            </div>
          </div>
        </div>
      ) : showDebtsView ? null : (
        <>
          {/* Statistics Cards */}
          <div className="row mb-4 g-3">
            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center me-3" 
                         style={{ width: '56px', height: '56px' }}>
                      <i className="bi bi-wallet2 text-primary fs-4"></i>
                    </div>
                    <div>
                      <p className="mb-1 text-muted small">Toplam Bakiye</p>
                      <h4 className="mb-0 fw-bold text-dark cash-animation">{formatCurrency(totalBalance)}</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center me-3" 
                         style={{ width: '56px', height: '56px' }}>
                      <i className="bi bi-arrow-down-circle text-success fs-4"></i>
                    </div>
                    <div>
                      <p className="mb-1 text-muted small">Toplam Gelir</p>
                      <h4 className="mb-0 fw-bold text-success">{formatCurrency(tabStats.income.total)}</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="rounded-circle bg-danger bg-opacity-10 d-flex align-items-center justify-content-center me-3" 
                         style={{ width: '56px', height: '56px' }}>
                      <i className="bi bi-arrow-up-circle text-danger fs-4"></i>
                    </div>
                    <div>
                      <p className="mb-1 text-muted small">Toplam Gider</p>
                      <h4 className="mb-0 fw-bold text-danger">{formatCurrency(tabStats.expense.total)}</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '16px', overflow: 'hidden' }}>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label htmlFor="dateFrom" className="form-label fw-medium">Başlangıç Tarihi</label>
                  <input
                    type="date"
                    id="dateFrom"
                    name="dateFrom"
                    value={filter.dateFrom}
                    onChange={handleFilterChange}
                    className="form-control form-control-custom rounded-pill px-3"
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="dateTo" className="form-label fw-medium">Bitiş Tarihi</label>
                  <input
                    type="date"
                    id="dateTo"
                    name="dateTo"
                    value={filter.dateTo}
                    onChange={handleFilterChange}
                    className="form-control form-control-custom rounded-pill px-3"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '16px', overflow: 'hidden' }}>
            <div className="card-header bg-light border-0 py-3">
              <h5 className="mb-0 fw-bold">
                {activeTab === 'all' && (
                  <>
                    <i className="bi bi-list-ul me-2"></i>
                    Tüm İşlemler ({filteredTransactions.length})
                  </>
                )}
                {activeTab === 'income' && (
                  <>
                    <i className="bi bi-arrow-down-circle me-2 text-success"></i>
                    Gelirler ({filteredTransactions.length})
                  </>
                )}
                {activeTab === 'expense' && (
                  <>
                    <i className="bi bi-arrow-up-circle me-2 text-danger"></i>
                    Giderler ({filteredTransactions.length})
                  </>
                )}
              </h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-borderless align-middle">
                  <thead>
                    <tr className="border-bottom">
                      <th className="text-muted small fw-medium">Tarih</th>
                      {activeTab === 'all' && <th className="text-muted small fw-medium">Tür</th>}
                      <th className="text-muted small fw-medium">Kaynak</th>
                      <th className="text-muted small fw-medium">Açıklama</th>
                      <th className="text-muted small fw-medium">Tutar</th>
                      <th className="text-muted small fw-medium text-end">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((transaction) => (
                      <tr className="border-bottom" key={transaction.id}>
                        <td className="small">{transaction.date}</td>
                        {activeTab === 'all' && (
                          <td>
                            <span className={`badge ${transaction.type === 'income' ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'} rounded-pill px-2 py-1`}>
                              {transaction.type === 'income' ? 'Gelir' : 'Gider'}
                            </span>
                          </td>
                        )}
                        <td className="fw-medium">{transaction.source}</td>
                        <td className="text-muted small">{transaction.description}</td>
                        <td>
                          <div className="d-flex flex-column">
                          <span className={`fw-medium ${transaction.type === 'income' ? 'text-success' : 'text-danger'}`}>
                            {transaction.type === 'income' ? '+' : ''}{formatCurrency(transaction.amount)}
                          </span>
                            {/* Ortak giderlerinde originalAmount göster */}
                            {transaction.type === 'expense' && transaction.originalAmount && transaction.amount === 0 && (
                              <span className="text-info small fw-medium" style={{ fontSize: '0.85rem' }}>
                                Ortak Harcaması: {formatCurrency(transaction.originalAmount)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="text-end">
                          <div className="d-flex gap-1 justify-content-end">
                            <button
                              onClick={() => handleEditTransaction(transaction)}
                              className="btn btn-sm btn-outline-primary rounded-pill py-1 px-2"
                              title="Düzenle"
                              disabled={isObserver()}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            {(transaction.type === 'expense' || (transaction.type === 'income' && transaction.agreementId)) && (
                              <button
                                onClick={() => handleCancelTransaction(transaction)}
                                className="btn btn-sm btn-outline-danger rounded-pill py-1 px-2"
                                title={transaction.type === 'income' ? 'Ödemeyi İptal Et' : 'Vazgeç'}
                                disabled={isObserver()}
                              >
                                <i className="bi bi-x-circle"></i>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredTransactions.length === 0 && (
                      <tr>
                        <td colSpan={activeTab === 'all' ? "6" : "5"} className="text-center py-5">
                          <div className="d-flex flex-column align-items-center">
                            <i className={`bi ${activeTab === 'income' ? 'bi-arrow-down-circle' : activeTab === 'expense' ? 'bi-arrow-up-circle' : 'bi-currency-dollar'} text-muted mb-2`} style={{ fontSize: '2rem' }}></i>
                            <p className="mb-0 text-muted">
                              {activeTab === 'income' && 'Henüz gelir işlemi bulunmamaktadır.'}
                              {activeTab === 'expense' && 'Henüz gider işlemi bulunmamaktadır.'}
                              {activeTab === 'all' && 'Henüz işlem bulunmamaktadır.'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Reset All Cash Button */}
          <div className="d-flex justify-content-center">
            <button 
              onClick={handleResetAllCash}
              className="btn btn-outline-danger rounded-pill px-5 py-3 d-flex align-items-center"
            >
              <i className="bi bi-trash me-2"></i>
              Tüm Mali Verileri Sıfırla
            </button>
          </div>
        </>
      )}

      {/* Income Form Modal */}
      {showIncomeForm && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingTransaction ? 'Gelir Düzenle' : 'Yeni Gelir Ekle'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseForms}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleFormSubmit}>
                  <input type="hidden" name="type" value="income" />
                  <div className="mb-3">
                    <label htmlFor="date" className="form-label">Tarih *</label>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={formData.date}
                      onChange={handleFormChange}
                      className="form-control form-control-custom"
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="source" className="form-label">Kaynak *</label>
                    <input
                      type="text"
                      id="source"
                      name="source"
                      value={formData.source}
                      onChange={handleFormChange}
                      className="form-control form-control-custom"
                      placeholder="Gelir kaynağını girin"
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="agreementId" className="form-label">Anlaşma (Opsiyonel - Kısmi Ödeme için)</label>
                    <select
                      id="agreementId"
                      name="agreementId"
                      value={formData.agreementId}
                      onChange={(e) => {
                        const agreementId = e.target.value;
                        setFormData({ ...formData, agreementId });
                        if (agreementId) {
                          const agreement = agreements.find(a => String(a.id) === String(agreementId));
                          if (agreement) {
                            setSelectedAgreementForPayment(agreement);
                            const remaining = (agreement.totalAmount || 0) - (agreement.paidAmount || 0);
                            if (remaining > 0) {
                              setFormData(prev => ({ ...prev, agreementId, amount: remaining.toString() }));
                            }
                          }
                        } else {
                          setSelectedAgreementForPayment(null);
                        }
                      }}
                      className="form-select form-control-custom"
                    >
                      <option value="">Anlaşma seçin (opsiyonel)</option>
                      {agreements
                        .filter(a => a.status === 'active' || a.status === 'completed')
                        .map(agreement => {
                          const company = companies.find(c => String(c.id) === String(agreement.companyId));
                          const totalAmount = agreement.totalAmount || 0;
                          const paidAmount = agreement.paidAmount || 0;
                          const remainingAmount = totalAmount - paidAmount;
                          return (
                            <option key={agreement.id} value={agreement.id}>
                              {company?.name || 'Bilinmeyen'} - Anlaşma #{agreement.id} 
                              {remainingAmount > 0 ? ` (Kalan: ${formatCurrency(remainingAmount)})` : ' (Ödendi)'}
                            </option>
                          );
                        })}
                    </select>
                    {selectedAgreementForPayment && (
                      <div className="mt-2 p-2 bg-light rounded">
                        <small className="text-muted d-block">
                          <strong>Toplam Tutar:</strong> {formatCurrency(selectedAgreementForPayment.totalAmount || 0)}
                        </small>
                        <small className="text-muted d-block">
                          <strong>Ödenen Tutar:</strong> {formatCurrency(selectedAgreementForPayment.paidAmount || 0)}
                        </small>
                        <small className="text-danger d-block">
                          <strong>Kalan Tutar:</strong> {formatCurrency((selectedAgreementForPayment.totalAmount || 0) - (selectedAgreementForPayment.paidAmount || 0))}
                        </small>
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="partnerId" className="form-label">Ortak (Opsiyonel)</label>
                    <select
                      id="partnerId"
                      name="partnerId"
                      value={formData.partnerId}
                      onChange={handleFormChange}
                      className="form-select form-control-custom"
                    >
                      <option value="">Ortak seçin (opsiyonel)</option>
                      {partners.map(partner => (
                        <option key={partner.id} value={partner.id}>
                          {partner.name} (Bakiye: {formatCurrency(partner.balance || 0)})
                        </option>
                      ))}
                    </select>
                    <div className="form-text">
                      <small className="text-muted">
                        <i className="bi bi-info-circle me-1"></i>
                        Ortak seçilirse, bu gelir kasaya girer ve ortak alacaklı olur.
                      </small>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="amount" className="form-label">Tutar (₺) *</label>
                    <input
                      type="number"
                      id="amount"
                      name="amount"
                      value={formData.amount}
                      onChange={handleFormChange}
                      className="form-control form-control-custom"
                      min="0"
                      step="0.01"
                      placeholder="Tutarı girin"
                      max={selectedAgreementForPayment ? ((selectedAgreementForPayment.totalAmount || 0) - (selectedAgreementForPayment.paidAmount || 0)) : undefined}
                      required
                    />
                    {selectedAgreementForPayment && (
                      <div className="form-text">
                        <small className="text-muted">
                          Maksimum: {formatCurrency((selectedAgreementForPayment.totalAmount || 0) - (selectedAgreementForPayment.paidAmount || 0))}
                        </small>
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="description" className="form-label">Açıklama</label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleFormChange}
                      className="form-control form-control-custom"
                      rows="3"
                      placeholder="Açıklama girin"
                    ></textarea>
                  </div>
                  
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
                      className="btn btn-danger"
                      disabled={isObserver()}
                    >
                      {editingTransaction ? 'Güncelle' : 'Ekle'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expense Form Modal */}
      {showExpenseForm && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingTransaction ? 'Gider Düzenle' : 'Yeni Gider Ekle'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseForms}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleFormSubmit}>
                  <input type="hidden" name="type" value="expense" />
                  <div className="mb-3">
                    <label htmlFor="date" className="form-label">Tarih *</label>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={formData.date}
                      onChange={handleFormChange}
                      className="form-control form-control-custom"
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="source" className="form-label">Kaynak *</label>
                    <input
                      type="text"
                      id="source"
                      name="source"
                      value={formData.source}
                      onChange={handleFormChange}
                      className="form-control form-control-custom"
                      placeholder="Gider kaynağını girin"
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="siteId" className="form-label">Site (Opsiyonel - Avans Ödemesi İçin)</label>
                    <select
                      id="siteId"
                      name="siteId"
                      value={formData.siteId}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          siteId: e.target.value,
                          isSiteAdvance: e.target.value ? formData.isSiteAdvance : false
                        });
                      }}
                      className="form-select form-control-custom"
                    >
                      <option value="">Site seçin (opsiyonel)</option>
                      {sites.map(site => (
                        <option key={site.id} value={site.id}>
                          {site.name} {site.advanceBalance ? `(Avans: ${formatCurrency(site.advanceBalance || 0)})` : ''}
                        </option>
                      ))}
                    </select>
                    {formData.siteId && (
                      <div className="form-check mt-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="isSiteAdvance"
                          name="isSiteAdvance"
                          checked={formData.isSiteAdvance}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              isSiteAdvance: e.target.checked
                            });
                          }}
                        />
                        <label className="form-check-label" htmlFor="isSiteAdvance">
                          <strong>Site Avans Ödemesi</strong>
                        </label>
                      </div>
                    )}
                    <div className="form-text">
                      <small className="text-muted">
                        <i className="bi bi-info-circle me-1"></i>
                        Site seçip "Site Avans Ödemesi" işaretlenirse, bu tutar site'nin avans bakiyesine eklenir. Ortak seçilirse ortak kendi cebinden öder.
                      </small>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="partnerId" className="form-label">Ortak (Opsiyonel)</label>
                    <select
                      id="partnerId"
                      name="partnerId"
                      value={formData.partnerId}
                      onChange={handleFormChange}
                      className="form-select form-control-custom"
                      disabled={formData.isSiteAdvance}
                    >
                      <option value="">Ortak seçin (opsiyonel)</option>
                      {partners.map(partner => (
                        <option key={partner.id} value={partner.id}>
                          {partner.name} (Bakiye: {formatCurrency(partner.balance || 0)})
                        </option>
                      ))}
                    </select>
                    <div className="form-text">
                      <small className="text-muted">
                        <i className="bi bi-info-circle me-1"></i>
                        {formData.isSiteAdvance 
                          ? 'Site avans ödemesi seçildiğinde ortak seçilemez.'
                          : 'Ortak seçilirse, ortak kendi cebinden öder ve alacaklı olur. Kasadan para düşmez.'}
                      </small>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="amount" className="form-label">Tutar (₺) *</label>
                    <input
                      type="number"
                      id="amount"
                      name="amount"
                      value={formData.amount}
                      onChange={handleFormChange}
                      className="form-control form-control-custom"
                      min="0"
                      step="0.01"
                      placeholder="Tutarı girin"
                      required
                    />
                    {/* Ortak giderlerinde önceki harcanan tutarı göster */}
                    {editingTransaction && editingTransaction.originalAmount && editingTransaction.amount === 0 && (
                      <div className="mt-2">
                        <small className="text-info fw-medium">
                          <i className="bi bi-info-circle me-1"></i>
                          Önceki Ortak Harcaması: {formatCurrency(editingTransaction.originalAmount)}
                        </small>
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="description" className="form-label">Açıklama</label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleFormChange}
                      className="form-control form-control-custom"
                      rows="3"
                      placeholder="Açıklama girin"
                    ></textarea>
                  </div>
                  
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
                      className="btn btn-danger"
                      disabled={isObserver()}
                    >
                      {editingTransaction ? 'Güncelle' : 'Ekle'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Tüm Mali Verileri Sıfırla</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCancelReset}
                ></button>
              </div>
              <div className="modal-body">
                <p className="fw-bold text-danger">Tüm mali verileri sıfırlamak istediğinizden emin misiniz?</p>
                <p className="mb-2">Bu işlem şunları silecek/sıfırlayacak:</p>
                <ul className="text-start">
                  <li>Tüm kasa işlemleri (transactions)</li>
                  <li>Tüm ortak bakiyeleri</li>
                  <li>Tüm anlaşma mali bilgileri (ödemeler, tutarlar)</li>
                  <li>Tüm site bekleyen ödemeleri</li>
                  <li>Tüm firma kredi bilgileri</li>
                </ul>
                <p className="text-danger fw-bold">Bu işlem geri alınamaz!</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCancelReset}
                >
                  İptal
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleConfirmReset}
                >
                  Sıfırla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debt Form Modal */}
      {showDebtForm && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingDebt ? 'Borç Düzenle' : 'Yeni Borç Ekle'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={resetDebtForm}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleDebtFormSubmit}>
                  <div className="mb-3">
                    <label htmlFor="debtName" className="form-label">Borç Adı *</label>
                    <input
                      type="text"
                      id="debtName"
                      name="name"
                      value={debtFormData.name}
                      onChange={handleDebtFormChange}
                      className="form-control form-control-custom"
                      placeholder="Borç adını girin (örn: Personel Maaşı, Kira...)"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="debtAmount" className="form-label">Tutar (₺) *</label>
                    <input
                      type="number"
                      id="debtAmount"
                      name="amount"
                      value={debtFormData.amount}
                      onChange={handleDebtFormChange}
                      className="form-control form-control-custom"
                      min="0"
                      step="0.01"
                      placeholder="Tutarı girin"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="debtDueDate" className="form-label">Ödenecek Tarih *</label>
                    <input
                      type="date"
                      id="debtDueDate"
                      name="dueDate"
                      value={debtFormData.dueDate}
                      onChange={handleDebtFormChange}
                      className="form-control form-control-custom"
                      required
                    />
                  </div>

                  <div className="mb-3 form-check">
                    <input
                      type="checkbox"
                      id="isRecurring"
                      name="isRecurring"
                      className="form-check-input"
                      checked={debtFormData.isRecurring}
                      onChange={handleDebtFormChange}
                    />
                    <label className="form-check-label" htmlFor="isRecurring">
                      Aylık tekrarlanan borç
                    </label>
                    <div className="form-text">
                      <small className="text-muted">
                        <i className="bi bi-info-circle me-1"></i>
                        İşaretlerseniz, bu borç her ay tekrar eden bir borç olarak kabul edilir. Ödenmeyen tutar bir sonraki aya eklenir.
                      </small>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="debtDescription" className="form-label">Açıklama</label>
                    <textarea
                      id="debtDescription"
                      name="description"
                      value={debtFormData.description}
                      onChange={handleDebtFormChange}
                      className="form-control form-control-custom"
                      rows="3"
                      placeholder="Borçla ilgili ek açıklama girin"
                    ></textarea>
                  </div>

                  <div className="d-flex justify-content-end gap-2">
                    <button
                      type="button"
                      onClick={resetDebtForm}
                      className="btn btn-secondary"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      className="btn btn-danger"
                      disabled={isObserver()}
                    >
                      {editingDebt ? 'Güncelle' : 'Ekle'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cashier;