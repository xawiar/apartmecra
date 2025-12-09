import React, { useState, useEffect } from 'react';
import { getPartners, createPartner, updatePartner, deletePartner } from '../services/api';
import { getTransactions, createTransaction } from '../services/api';
import { createLog } from '../services/api';
import { createAccountingRecord } from '../services/api';

const PartnerShares = () => {
  const [partners, setPartners] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDistributionForm, setShowDistributionForm] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [showAdvanceForm, setShowAdvanceForm] = useState(false);
  const [showAccountingModal, setShowAccountingModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [editingPartner, setEditingPartner] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    sharePercentage: '',
    balance: 0
  });
  const [distributionAmount, setDistributionAmount] = useState('');
  const [distributionNotes, setDistributionNotes] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  const [isDistributing, setIsDistributing] = useState(false);
  const [partnerPaymentChoices, setPartnerPaymentChoices] = useState({});
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalNotes, setWithdrawalNotes] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceNotes, setAdvanceNotes] = useState('');

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
      sharePercentage: '',
      balance: 0
    });
    setEditingPartner(null);
    setShowAddForm(true);
  };

  const handleEditPartner = (partner) => {
    setFormData({
      name: partner.name || '',
      sharePercentage: partner.sharePercentage || '',
      balance: partner.balance || 0
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
    setShowPaymentHistory(false);
    setShowWithdrawalForm(false);
    setShowAdvanceForm(false);
    setShowAccountingModal(false);
    setSelectedPartner(null);
    setEditingPartner(null);
    setPaymentSuccess(null);
    setDistributionAmount('');
    setDistributionNotes('');
    setWithdrawalAmount('');
    setWithdrawalNotes('');
    setAdvanceAmount('');
    setAdvanceNotes('');
    setIsDistributing(false);
    setPartnerPaymentChoices({});
  };

  const handleClosePaymentHistory = () => {
    setShowPaymentHistory(false);
    setSelectedPartner(null);
  };

  const handleDistributePayments = () => {
    // Initialize partner payment choices
    const initialChoices = {};
    partners.forEach(partner => {
      initialChoices[partner.id] = 'receive'; // Default to receive payment
    });
    setPartnerPaymentChoices(initialChoices);
    setShowDistributionForm(true);
  };

  // Function to show payment history for a partner
  const handleShowPaymentHistory = (partner) => {
    setSelectedPartner(partner);
    setShowPaymentHistory(true);
  };

  // Function to show withdrawal form for a partner
  const handleShowWithdrawalForm = (partner) => {
    setSelectedPartner(partner);
    setWithdrawalAmount('');
    setWithdrawalNotes('');
    setShowWithdrawalForm(true);
  };

  // Function to show advance form for a partner
  const handleShowAdvanceForm = (partner) => {
    setSelectedPartner(partner);
    setAdvanceAmount('');
    setAdvanceNotes('');
    setShowAdvanceForm(true);
  };

  // Function to show accounting records for a partner
  const handleShowAccountingModal = (partner) => {
    setSelectedPartner(partner);
    setShowAccountingModal(true);
  };

  // Handle partner withdrawal
  const handleWithdrawal = async () => {
    if (!selectedPartner || !withdrawalAmount) {
      await window.showAlert(
        'Eksik Bilgi',
        'Lütfen çekim miktarını girin.',
        'warning'
      );
      return;
    }

    const amount = parseFloat(withdrawalAmount);
    if (isNaN(amount) || amount <= 0) {
      await window.showAlert(
        'Geçersiz Miktar',
        'Geçerli bir miktar girin.',
        'warning'
      );
      return;
    }

    const netBalance = getPartnerNetBalance(selectedPartner);
    if (amount > netBalance) {
      await window.showAlert(
        'Yetersiz Bakiye',
        `Bu ortak için yeterli bakiye bulunmamaktadır. Mevcut net bakiye: ${formatCurrency(Math.abs(netBalance))} (${netBalance >= 0 ? 'Alacaklı' : 'Borçlu'})`,
        'warning'
      );
      return;
    }

    try {
      // Create expense transaction first
      const expenseData = {
        date: new Date().toISOString().split('T')[0],
        type: 'expense',
        source: `Ortak Para Çekimi - ${selectedPartner.name}`,
        description: `${selectedPartner.name} tarafından alacak çekimi${withdrawalNotes ? ` - ${withdrawalNotes}` : ''}`,
        amount: -amount
      };

      await createTransaction(expenseData);

      // Update partner balance in database
      const updatedPartners = partners.map(partner => 
        partner.id === selectedPartner.id 
          ? { ...partner, balance: (partner.balance || 0) - amount }
          : partner
      );
      setPartners(updatedPartners);
      
      // Update partner in database
      const updatedPartner = updatedPartners.find(p => p.id === selectedPartner.id);
      if (updatedPartner) {
        await updatePartner(updatedPartner.id, updatedPartner);
      }

      // Log the action
      await createLog({
        user: 'Admin',
        action: `${selectedPartner.name} tarafından ${formatCurrency(amount)} alacak çekildi`
      });

      setShowWithdrawalForm(false);
      setSelectedPartner(null);
      setWithdrawalAmount('');
      setWithdrawalNotes('');

      await window.showAlert(
        'Çekim Başarılı',
        `${selectedPartner.name} tarafından ${formatCurrency(amount)} başarıyla çekildi.`,
        'success'
      );
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      await window.showAlert(
        'Hata',
        'Para çekimi sırasında bir hata oluştu.',
        'error'
      );
    }
  };

  // Handle partner advance payment
  const handleAdvancePayment = async () => {
    if (!selectedPartner || !advanceAmount) {
      await window.showAlert(
        'Eksik Bilgi',
        'Lütfen avans miktarını girin.',
        'warning'
      );
      return;
    }

    const amount = parseFloat(advanceAmount);
    if (isNaN(amount) || amount <= 0) {
      await window.showAlert(
        'Geçersiz Miktar',
        'Geçerli bir miktar girin.',
        'warning'
      );
      return;
    }

    try {
      // Create expense transaction first (money goes out of cashier)
      const expenseData = {
        date: new Date().toISOString().split('T')[0],
        type: 'expense',
        source: `Ortak Avans Ödemesi - ${selectedPartner.name}`,
        description: `${selectedPartner.name} tarafından alınan avans ödemesi${advanceNotes ? ` - ${advanceNotes}` : ''}`,
        amount: -amount
      };

      await createTransaction(expenseData);

      // Update partner balance (decrease because they owe money)
      const updatedPartners = partners.map(partner => 
        partner.id === selectedPartner.id 
          ? { ...partner, balance: (partner.balance || 0) - amount }
          : partner
      );
      setPartners(updatedPartners);
      
      // Update partner in database
      const updatedPartner = updatedPartners.find(p => p.id === selectedPartner.id);
      if (updatedPartner) {
        await updatePartner(updatedPartner.id, updatedPartner);
      }

      // Log the action
      await createLog({
        user: 'Admin',
        action: `${selectedPartner.name} tarafından ${formatCurrency(amount)} avans alındı`
      });

      setShowAdvanceForm(false);
      setSelectedPartner(null);
      setAdvanceAmount('');
      setAdvanceNotes('');

      await window.showAlert(
        'Avans Başarılı',
        `${selectedPartner.name} tarafından ${formatCurrency(amount)} avans başarıyla alındı.`,
        'success'
      );
    } catch (error) {
      console.error('Error processing advance payment:', error);
      await window.showAlert(
        'Hata',
        'Avans ödemesi sırasında bir hata oluştu.',
        'error'
      );
    }
  };

  // Get partner accounting records
  const getPartnerAccountingRecords = () => {
    if (!selectedPartner) return [];
    
    // Get all relevant transactions
    const allRecords = transactions
      .filter(transaction => {
        // Direct partner transactions (income/expense with partnerId)
        if (transaction.partnerId === selectedPartner.id.toString()) {
          return true;
        }
        
        // Partner-related transactions (payments, advances, withdrawals)
        if (transaction.source?.includes(selectedPartner.name)) {
          return true;
        }
        
        return false;
      });
    
    // Remove duplicates based on ID and add unique keys
    const uniqueRecords = allRecords.map((record, index) => ({
      ...record,
      uniqueKey: `${record.id}-${index}` // Create unique key
    }));
    
    return uniqueRecords.sort((a, b) => {
      // Sort by date (newest first) and then by ID (newest first)
      const dateComparison = new Date(b.date) - new Date(a.date);
      if (dateComparison !== 0) {
        return dateComparison;
      }
      return b.id - a.id;
    });
  };

  // Calculate partner accounting summary
  const getPartnerAccountingSummary = () => {
    const records = getPartnerAccountingRecords();
    let totalCredit = 0; // Ortak alacaklı (kasa borçlu)
    let totalDebit = 0;  // Ortak borçlu (kasa alacaklı)
    
    records.forEach(record => {
      if (record.partnerId === selectedPartner.id.toString()) {
        // Direct partner transactions
        if (record.type === 'income') {
          // Ortak kasaya para verdi, alacaklı oldu
          totalCredit += Math.abs(record.amount);
        } else if (record.type === 'expense' && record.amount === 0) {
          // Ortak kendi cebinden gider ödedi, alacaklı oldu
          const expenseAmount = record.originalAmount || 0;
          totalCredit += expenseAmount;
        }
      } else if (record.source?.includes(selectedPartner.name)) {
        // Partner-related transactions
        if (record.source.includes('Ortak Alacağı')) {
          // Ortak alacaklı kaydı (İçerde Bırak seçeneği)
          totalCredit += Math.abs(record.originalAmount || record.amount);
        } else if (record.source.includes('Ortak Avans Ödemesi')) {
          // Ortak avans aldı, borçlu oldu
          totalDebit += Math.abs(record.amount);
        } else if (record.source.includes('Ortak Para Çekimi')) {
          // Ortak para çekti, borçlu oldu
          totalDebit += Math.abs(record.amount);
        }
      }
    });
    
    return {
      totalCredit, // Ortak alacaklı
      totalDebit,  // Ortak borçlu
      balance: totalCredit - totalDebit // Net bakiye: Pozitif = alacaklı, Negatif = borçlu
    };
  };

  // Calculate partner's net balance from all transactions
  const getPartnerNetBalance = (partner) => {
    console.log('Calculating partner balance from transactions:', partner.name);
    
    // Always calculate from transactions to ensure consistency with accounting records
    let totalCredit = 0; // Ortak alacaklı (kasa borçlu)
    let totalDebit = 0;  // Ortak borçlu (kasa alacaklı)
    
    // Get all relevant transactions (same logic as getPartnerAccountingRecords)
    const allRecords = transactions.filter(transaction => {
      // Direct partner transactions (income/expense with partnerId)
      if (transaction.partnerId === partner.id.toString()) {
        return true;
      }
      
      // Partner-related transactions (payments, advances, withdrawals)
      if (transaction.source?.includes(partner.name)) {
        return true;
      }
      
      return false;
    });
    
    allRecords.forEach(record => {
      if (record.partnerId === partner.id.toString()) {
        // Direct partner transactions
        if (record.type === 'income') {
          // Ortak kasaya para verdi, alacaklı oldu
          totalCredit += Math.abs(record.amount);
        } else if (record.type === 'expense' && record.amount === 0) {
          // Ortak kendi cebinden gider ödedi, alacaklı oldu
          const expenseAmount = record.originalAmount || 0;
          totalCredit += expenseAmount;
        }
      } else if (record.source?.includes(partner.name)) {
        // Partner-related transactions
        if (record.source.includes('Ortak Alacağı')) {
          // Ortak alacaklı kaydı (İçerde Bırak seçeneği)
          totalCredit += Math.abs(record.originalAmount || record.amount);
        } else if (record.source.includes('Ortak Avans Ödemesi')) {
          // Ortak avans aldı, borçlu oldu
          totalDebit += Math.abs(record.amount);
        } else if (record.source.includes('Ortak Para Çekimi')) {
          // Ortak para çekti, borçlu oldu
          totalDebit += Math.abs(record.amount);
        }
      }
    });
    
    // Net bakiye = Alacak - Borç
    // Pozitif: Ortak alacaklı, Negatif: Ortak borçlu
    const calculatedBalance = totalCredit - totalDebit;
    console.log(`Partner ${partner.name} balance calculation: Credit=${totalCredit}, Debit=${totalDebit}, Balance=${calculatedBalance}`);
    return calculatedBalance;
  };

  const handleMakePayment = (partner) => {
    // Simulate payment processing
    setPaymentSuccess(partner.id);
    // Log the action
    createLog({
      user: 'Admin',
      action: `Ortak ödemesi yapıldı: ${partner.name}`
    });
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
    
    return transactions
      .filter(transaction => {
        // Partner payment transactions
        if (transaction.type === 'expense' && 
            transaction.source === `Ortak Ödemesi - ${selectedPartner.name}`) {
          return true;
        }
        
        // Partner advance transactions
        if (transaction.type === 'expense' && 
            transaction.source === `Ortak Avans Ödemesi - ${selectedPartner.name}`) {
          return true;
        }
        
        // Partner withdrawal transactions
        if (transaction.type === 'expense' && 
            transaction.source === `Ortak Para Çekimi - ${selectedPartner.name}`) {
          return true;
        }
        
        // Direct partner transactions (income/expense with partnerId)
        if (transaction.partnerId === selectedPartner.id.toString()) {
          return true;
        }
        
        return false;
      })
      .sort((a, b) => {
        // Sort by date (newest first) and then by ID (newest first)
        const dateComparison = new Date(b.date) - new Date(a.date);
        if (dateComparison !== 0) {
          return dateComparison;
        }
        return b.id - a.id;
      });
  };

  // Calculate total payments for a partner
  const getTotalPartnerPayments = () => {
    return getPartnerPayments().reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
  };

  // Calculate payment statistics for a partner
  const getPartnerPaymentStats = () => {
    const payments = getPartnerPayments();
    if (payments.length === 0) {
      return {
        totalPayments: 0,
        totalAmount: 0,
        averageAmount: 0,
        firstPayment: null,
        lastPayment: null
      };
    }

    const totalAmount = payments.reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
    const averageAmount = totalAmount / payments.length;
    const sortedByDate = [...payments].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return {
      totalPayments: payments.length,
      totalAmount: totalAmount,
      averageAmount: averageAmount,
      firstPayment: sortedByDate[0],
      lastPayment: sortedByDate[sortedByDate.length - 1]
    };
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
    // Prevent multiple clicks
    if (isDistributing) {
      return;
    }
    
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

    // Check if there's enough money in the cashier
    if (amount > totalCashBalance) {
      await window.showAlert(
        'Yetersiz Bakiye',
        `Kasada yeterli para bulunmamaktadır. Kasadaki tutar: ${formatCurrency(totalCashBalance)}, Dağıtım miktarı: ${formatCurrency(amount)}`,
        'warning'
      );
      return;
    }

    // Set distributing state to prevent multiple clicks
    setIsDistributing(true);
    
    // Close the modal immediately when the button is clicked
    setShowDistributionForm(false);
    
    try {
      // Calculate each partner's share based on their percentage
      const updatedPartners = partners.map(partner => {
        const sharePercentage = parseFloat(partner.sharePercentage) || 0;
        const shareAmount = (amount * sharePercentage) / 100;
        const paymentChoice = partnerPaymentChoices[partner.id] || 'receive';
        
        return {
          ...partner,
          balance: (partner.balance || 0) + shareAmount // Her iki seçenek için de alacaklı olur
        };
      });

      // Update partners in state and database
      setPartners(updatedPartners);
      
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

      // Create transactions for each partner based on their choice
      for (const partner of updatedPartners) {
        const sharePercentage = parseFloat(partner.sharePercentage) || 0;
        const shareAmount = (amount * sharePercentage) / 100;
        const paymentChoice = partnerPaymentChoices[partner.id] || 'receive';
        
        if (shareAmount > 0) {
          if (paymentChoice === 'keep_inside') {
            // Create a record transaction for keeping inside (no cash movement)
            const recordData = {
              date: new Date().toISOString().split('T')[0],
              type: 'expense',
              source: `Ortak Alacağı - ${partner.name}`,
              description: `${partner.name} için ortaklık payı (${sharePercentage}%) - İçerde Bırakıldı`,
              amount: 0, // No cash movement - kasadan düşmez
              originalAmount: shareAmount // Store the actual amount for accounting purposes
            };
            
            try {
              await createTransaction(recordData);
            } catch (error) {
              console.error('Error creating record transaction:', error);
            }
            
            // Create accounting record for partner credit
            const accountingRecord = {
              date: new Date().toISOString().split('T')[0],
              type: 'partner_credit',
              category: 'Ortak Alacaklı',
              description: `${partner.name} için ortaklık payı (${sharePercentage}%) - İçerde Bırakıldı`,
              amount: shareAmount,
              partnerId: partner.id,
              partnerName: partner.name,
              status: 'pending'
            };
            
            try {
              await createAccountingRecord(accountingRecord);
              console.log('Accounting record created for partner:', partner.name);
            } catch (error) {
              console.error('Error creating accounting record:', error);
            }
          } else {
            // Create expense transaction for actual payment
            const expenseData = {
              date: new Date().toISOString().split('T')[0],
              type: 'expense',
              source: `Ortak Ödemesi - ${partner.name}`,
              description: `${partner.name} için ortaklık payı (${sharePercentage}%) - Ödendi`,
              amount: -shareAmount // Negative for expenses
            };
            
            try {
              await createTransaction(expenseData);
            } catch (error) {
              console.error('Error creating expense transaction:', error);
            }
          }
        }
      }

      // Log the action
      await createLog({
        user: 'Admin',
        action: `Ortak ödemeleri dağıtıldı: ${formatCurrency(amount)}`
      });

      // Show success message
      setPaymentSuccess('distribution');
      setTimeout(() => {
        setPaymentSuccess(null);
      }, 3000);
      
      await window.showAlert(
        'Dağıtım Başarılı',
        `Ödemeler başarıyla dağıtıldı. ${partnerUpdateCount} ortak güncellendi.`,
        'success'
      );

      // Reset state
      setDistributionAmount('');
      setDistributionNotes('');
    } catch (error) {
      console.error('Error distributing payments:', error);
      await window.showAlert(
        'Hata',
        'Ödeme dağıtımı sırasında bir hata oluştu.',
        'error'
      );
    } finally {
      // Reset distributing state
      setIsDistributing(false);
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
        {/* Partners Table - Now full width */}
        <div className="col-12 mb-4">
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
                      <th>Bakiye</th>
                      <th>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partners.map((partner) => (
                      <tr key={partner.id}>
                        <td className="fw-medium">{partner.name}</td>
                        <td>{partner.sharePercentage}%</td>
                        <td>
                          {(() => {
                            const netBalance = getPartnerNetBalance(partner);
                            return (
                              <span className={`fw-bold ${netBalance >= 0 ? 'text-success' : 'text-danger'}`}>
                                {formatCurrency(Math.abs(netBalance))}
                                <small className="d-block text-muted">
                                  {netBalance >= 0 ? 'Alacaklı' : 'Borçlu'}
                                </small>
                              </span>
                            );
                          })()}
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <button
                              onClick={() => handleShowPaymentHistory(partner)}
                              className="btn btn-sm btn-outline-info"
                              title="Ödeme Geçmişi"
                            >
                              <i className="bi bi-eye"></i>
                            </button>
                            {getPartnerNetBalance(partner) > 0 && (
                              <button
                                onClick={() => handleShowWithdrawalForm(partner)}
                                className="btn btn-sm btn-outline-success"
                                title="Para Çek"
                              >
                                <i className="bi bi-cash-coin"></i>
                              </button>
                            )}
                            <button
                              onClick={() => handleShowAdvanceForm(partner)}
                              className="btn btn-sm btn-outline-warning"
                              title="Avans Al"
                            >
                              <i className="bi bi-arrow-up-circle"></i>
                            </button>
                            <button
                              onClick={() => handleShowAccountingModal(partner)}
                              className="btn btn-sm btn-outline-primary"
                              title="Muhasebe Kayıtları"
                            >
                              <i className="bi bi-journal-text"></i>
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
                        <td colSpan="4" className="text-center py-5">
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
                        const paymentChoice = partnerPaymentChoices[partner.id] || 'receive';
                        return (
                          <li key={partner.id} className="list-group-item">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <span className="fw-medium">{partner.name} ({sharePercentage}%)</span>
                              <span className="fw-bold">{formatCurrency(shareAmount)}</span>
                            </div>
                            <div className="d-flex gap-2">
                              <div className="form-check form-check-inline">
                                <input
                                  className="form-check-input"
                                  type="radio"
                                  name={`paymentChoice_${partner.id}`}
                                  id={`receive_${partner.id}`}
                                  value="receive"
                                  checked={paymentChoice === 'receive'}
                                  onChange={(e) => setPartnerPaymentChoices({
                                    ...partnerPaymentChoices,
                                    [partner.id]: e.target.value
                                  })}
                                />
                                <label className="form-check-label" htmlFor={`receive_${partner.id}`}>
                                  <i className="bi bi-arrow-down-circle text-success me-1"></i>
                                  Ödemeyi Al
                                </label>
                              </div>
                              
                              <div className="form-check form-check-inline">
                                <input
                                  className="form-check-input"
                                  type="radio"
                                  name={`paymentChoice_${partner.id}`}
                                  id={`keep_inside_${partner.id}`}
                                  value="keep_inside"
                                  checked={paymentChoice === 'keep_inside'}
                                  onChange={(e) => setPartnerPaymentChoices({
                                    ...partnerPaymentChoices,
                                    [partner.id]: e.target.value
                                  })}
                                />
                                <label className="form-check-label" htmlFor={`keep_inside_${partner.id}`}>
                                  <i className="bi bi-bank text-primary me-1"></i>
                                  İçerde Bırak
                                </label>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
                
                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleCloseForms();
                    }}
                    className="btn btn-secondary"
                    disabled={isDistributing}
                  >
                    İptal
                  </button>
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={() => {
                      handleDistribute();
                      handleCloseForms();
                    }}
                    disabled={isDistributing}
                  >
                    {isDistributing ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                        Dağıtılıyor...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-currency-dollar me-1"></i>
                        Ödemeyi Dağıt
                      </>
                    )}
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
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-person-circle me-2"></i>
                  {selectedPartner.name} - Ödeme Geçmişi
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleClosePaymentHistory}
                ></button>
              </div>
              <div className="modal-body">
                {(() => {
                  const paymentStats = getPartnerPaymentStats();
                  const payments = getPartnerPayments();
                  
                  return (
                    <>
                      {/* Statistics Cards */}
                      <div className="row mb-4 g-3">
                        <div className="col-md-3">
                          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                            <div className="card-body text-center">
                              <div className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center mx-auto mb-2" 
                                   style={{ width: '48px', height: '48px' }}>
                                <i className="bi bi-currency-dollar text-primary fs-5"></i>
                              </div>
                              <h6 className="text-muted mb-1">Toplam Ödeme</h6>
                              <h4 className="mb-0 fw-bold text-primary">{formatCurrency(paymentStats.totalAmount)}</h4>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                            <div className="card-body text-center">
                              <div className="rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center mx-auto mb-2" 
                                   style={{ width: '48px', height: '48px' }}>
                                <i className="bi bi-list-check text-success fs-5"></i>
                              </div>
                              <h6 className="text-muted mb-1">Ödeme Sayısı</h6>
                              <h4 className="mb-0 fw-bold text-success">{paymentStats.totalPayments}</h4>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                            <div className="card-body text-center">
                              <div className="rounded-circle bg-info bg-opacity-10 d-flex align-items-center justify-content-center mx-auto mb-2" 
                                   style={{ width: '48px', height: '48px' }}>
                                <i className="bi bi-graph-up text-info fs-5"></i>
                              </div>
                              <h6 className="text-muted mb-1">Ortalama Ödeme</h6>
                              <h4 className="mb-0 fw-bold text-info">{formatCurrency(paymentStats.averageAmount)}</h4>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                            <div className="card-body text-center">
                              <div className="rounded-circle bg-warning bg-opacity-10 d-flex align-items-center justify-content-center mx-auto mb-2" 
                                   style={{ width: '48px', height: '48px' }}>
                                <i className="bi bi-percent text-warning fs-5"></i>
                              </div>
                              <h6 className="text-muted mb-1">Pay Oranı</h6>
                              <h4 className="mb-0 fw-bold text-warning">{selectedPartner.sharePercentage}%</h4>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Payment Timeline */}
                      {paymentStats.firstPayment && paymentStats.lastPayment && (
                        <div className="alert alert-light border mb-4">
                          <div className="row">
                            <div className="col-md-6">
                              <div className="d-flex align-items-center">
                                <i className="bi bi-calendar-event text-primary me-2"></i>
                                <div>
                                  <small className="text-muted">İlk Ödeme</small>
                                  <div className="fw-medium">{paymentStats.firstPayment.date}</div>
                                </div>
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="d-flex align-items-center">
                                <i className="bi bi-calendar-check text-success me-2"></i>
                                <div>
                                  <small className="text-muted">Son Ödeme</small>
                                  <div className="fw-medium">{paymentStats.lastPayment.date}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Payments Table */}
                      {payments.length > 0 ? (
                        <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                          <div className="card-header bg-light border-0 py-3">
                            <h6 className="mb-0 fw-bold">
                              <i className="bi bi-clock-history me-2"></i>
                              Ödeme Detayları ({payments.length} ödeme)
                            </h6>
                          </div>
                          <div className="card-body p-0">
                            <div className="table-responsive">
                              <table className="table table-hover mb-0">
                                <thead className="table-light">
                                  <tr>
                                    <th className="border-0 py-3 px-4">
                                      <i className="bi bi-calendar me-1"></i>
                                      Tarih
                                    </th>
                                    <th className="border-0 py-3 px-4">
                                      <i className="bi bi-currency-dollar me-1"></i>
                                      Tutar
                                    </th>
                                    <th className="border-0 py-3 px-4">
                                      <i className="bi bi-chat-text me-1"></i>
                                      Açıklama
                                    </th>
                                    <th className="border-0 py-3 px-4">
                                      <i className="bi bi-hash me-1"></i>
                                      İşlem ID
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {payments.map((transaction, index) => (
                                    <tr key={transaction.id || index} className="border-bottom">
                                      <td className="py-3 px-4">
                                        <div className="d-flex align-items-center">
                                          <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3" 
                                               style={{ width: '32px', height: '32px' }}>
                                            <i className="bi bi-calendar3 text-primary" style={{ fontSize: '12px' }}></i>
                                          </div>
                                          <div>
                                            <div className="fw-medium">{transaction.date}</div>
                                            <small className="text-muted">
                                              {new Date(transaction.date).toLocaleDateString('tr-TR', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                              })}
                                            </small>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="py-3 px-4">
                                        <div className="d-flex align-items-center">
                                          <div className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3" 
                                               style={{ width: '32px', height: '32px' }}>
                                            <i className="bi bi-arrow-down-circle text-success" style={{ fontSize: '12px' }}></i>
                                          </div>
                                          <div>
                                            <div className="fw-bold text-success fs-6">
                                              {formatCurrency(Math.abs(transaction.amount))}
                                            </div>
                                            <small className="text-muted">Ortaklık Payı</small>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="py-3 px-4">
                                        <div className="text-muted small">
                                          {transaction.description || 'Ortaklık payı ödemesi'}
                                        </div>
                                      </td>
                                      <td className="py-3 px-4">
                                        <span className="badge bg-light text-dark border">
                                          #{transaction.id}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-5">
                          <div className="bg-light bg-opacity-50 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" 
                               style={{ width: '80px', height: '80px' }}>
                            <i className="bi bi-clock-history text-muted" style={{ fontSize: '2rem' }}></i>
                          </div>
                          <h6 className="text-muted mb-2">Ödeme Geçmişi Bulunamadı</h6>
                          <p className="text-muted mb-0">Bu ortak için henüz ödeme yapılmamıştır.</p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleClosePaymentHistory}
                >
                  <i className="bi bi-x-circle me-1"></i>
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal Modal */}
      {showWithdrawalForm && selectedPartner && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-cash-coin me-2"></i>
                  {selectedPartner.name} - Para Çekme
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseForms}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-info">
                  <div className="d-flex justify-content-between align-items-center">
                    <span>Mevcut Net Bakiye:</span>
                    {(() => {
                      const netBalance = getPartnerNetBalance(selectedPartner);
                      return (
                        <span className={`fw-bold fs-5 ${netBalance >= 0 ? 'text-success' : 'text-danger'}`}>
                          {formatCurrency(Math.abs(netBalance))}
                          <small className="d-block text-muted">
                            {netBalance >= 0 ? 'Alacaklı' : 'Borçlu'}
                          </small>
                        </span>
                      );
                    })()}
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Çekim Miktarı (₺)</label>
                  <input
                    type="number"
                    className="form-control form-control-custom"
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    min="0"
                    max={selectedPartner.balance || 0}
                    step="0.01"
                    placeholder="Çekilecek miktarı girin"
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Notlar</label>
                  <textarea
                    className="form-control form-control-custom"
                    value={withdrawalNotes}
                    onChange={(e) => setWithdrawalNotes(e.target.value)}
                    rows="3"
                    placeholder="Para çekimi ile ilgili notlar..."
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
                    type="button"
                    className="btn btn-success"
                    onClick={handleWithdrawal}
                  >
                    <i className="bi bi-cash-coin me-1"></i>
                    Para Çek
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advance Payment Modal */}
      {showAdvanceForm && selectedPartner && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-arrow-up-circle me-2"></i>
                  {selectedPartner.name} - Avans Ödemesi
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseForms}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-warning">
                  <div className="d-flex justify-content-between align-items-center">
                    <span>Mevcut Net Bakiye:</span>
                    {(() => {
                      const netBalance = getPartnerNetBalance(selectedPartner);
                      return (
                        <span className={`fw-bold fs-5 ${netBalance >= 0 ? 'text-success' : 'text-danger'}`}>
                          {formatCurrency(Math.abs(netBalance))}
                          <small className="d-block text-muted">
                            {netBalance >= 0 ? 'Alacaklı' : 'Borçlu'}
                          </small>
                        </span>
                      );
                    })()}
                  </div>
                  <small className="text-muted mt-2 d-block">
                    <i className="bi bi-info-circle me-1"></i>
                    Avans alındığında bakiye azalır ve ortak borçlu duruma geçer.
                  </small>
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Avans Miktarı (₺)</label>
                  <input
                    type="number"
                    className="form-control form-control-custom"
                    value={advanceAmount}
                    onChange={(e) => setAdvanceAmount(e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="Alınacak avans miktarını girin"
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Notlar</label>
                  <textarea
                    className="form-control form-control-custom"
                    value={advanceNotes}
                    onChange={(e) => setAdvanceNotes(e.target.value)}
                    rows="3"
                    placeholder="Avans ile ilgili notlar..."
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
                    type="button"
                    className="btn btn-warning"
                    onClick={handleAdvancePayment}
                  >
                    <i className="bi bi-arrow-up-circle me-1"></i>
                    Avans Al
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Accounting Records Modal */}
      {showAccountingModal && selectedPartner && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-journal-text me-2"></i>
                  {selectedPartner.name} - Muhasebe Kayıtları
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseForms}
                ></button>
              </div>
              <div className="modal-body">
                {(() => {
                  const summary = getPartnerAccountingSummary();
                  const records = getPartnerAccountingRecords();
                  
                  return (
                    <>
                        {/* Accounting Summary Cards */}
                        <div className="row mb-4 g-3">
                          <div className="col-md-3">
                            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
                              <div className="card-body text-center">
                                <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" 
                                     style={{ width: '48px', height: '48px' }}>
                                  <i className="bi bi-arrow-down-circle text-primary" style={{ fontSize: '1.5rem' }}></i>
                                </div>
                                <h6 className="card-title text-muted mb-2">Ortak Alacaklı</h6>
                                <h4 className="text-primary fw-bold mb-0">{formatCurrency(summary.totalCredit)}</h4>
                                <small className="text-muted">Kasa Borçlu</small>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
                              <div className="card-body text-center">
                                <div className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" 
                                     style={{ width: '48px', height: '48px' }}>
                                  <i className="bi bi-arrow-up-circle text-success" style={{ fontSize: '1.5rem' }}></i>
                                </div>
                                <h6 className="card-title text-muted mb-2">Ortak Borçlu</h6>
                                <h4 className="text-success fw-bold mb-0">{formatCurrency(summary.totalDebit)}</h4>
                                <small className="text-muted">Kasa Alacaklı</small>
                              </div>
                            </div>
                          </div>
                        <div className="col-md-3">
                          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
                            <div className="card-body text-center">
                              <div className={`bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3 ${summary.balance >= 0 ? 'bg-success' : 'bg-danger'}`} 
                                   style={{ width: '48px', height: '48px' }}>
                                <i className={`bi bi-calculator ${summary.balance >= 0 ? 'text-success' : 'text-danger'}`} style={{ fontSize: '1.5rem' }}></i>
                              </div>
                              <h6 className="card-title text-muted mb-2">Net Bakiye</h6>
                              <h4 className={`fw-bold mb-0 ${summary.balance >= 0 ? 'text-success' : 'text-danger'}`}>
                                {formatCurrency(Math.abs(summary.balance))}
                              </h4>
                              <small className="text-muted">
                                {summary.balance >= 0 ? 'Ortak Alacaklı' : 'Ortak Borçlu'}
                              </small>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
                            <div className="card-body text-center">
                              <div className="bg-info bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" 
                                   style={{ width: '48px', height: '48px' }}>
                                <i className="bi bi-list-ul text-info" style={{ fontSize: '1.5rem' }}></i>
                              </div>
                              <h6 className="card-title text-muted mb-2">Toplam İşlem</h6>
                              <h4 className="text-info fw-bold mb-0">{records.length}</h4>
                              <small className="text-muted">Kayıt Sayısı</small>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Accounting Records Table */}
                      {records.length > 0 ? (
                        <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                          <div className="card-header bg-light border-0 py-3">
                            <h6 className="mb-0 fw-bold">
                              <i className="bi bi-journal-text me-2"></i>
                              Muhasebe Kayıtları ({records.length} kayıt)
                            </h6>
                          </div>
                          <div className="card-body p-0">
                            <div className="table-responsive">
                              <table className="table table-hover mb-0">
                                <thead className="table-light">
                                  <tr>
                                    <th className="border-0 py-3 px-4">
                                      <i className="bi bi-calendar me-1"></i>
                                      Tarih
                                    </th>
                                    <th className="border-0 py-3 px-4">
                                      <i className="bi bi-journal-text me-1"></i>
                                      Açıklama
                                    </th>
                                    <th className="border-0 py-3 px-4">
                                      <i className="bi bi-arrow-down-circle me-1"></i>
                                      Ortak Alacaklı
                                    </th>
                                    <th className="border-0 py-3 px-4">
                                      <i className="bi bi-arrow-up-circle me-1"></i>
                                      Ortak Borçlu
                                    </th>
                                    <th className="border-0 py-3 px-4">
                                      <i className="bi bi-calculator me-1"></i>
                                      Bakiye
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {records.map((record, index) => {
                                    let partnerCredit = 0; // Ortak alacaklı
                                    let partnerDebit = 0;  // Ortak borçlu
                                    let description = record.description || record.source;
                                    
                                    // Determine partner credit/debit based on transaction type
                                    if (record.partnerId === selectedPartner.id.toString()) {
                                      // Direct partner transactions
                                      if (record.type === 'income') {
                                        // Ortak kasaya para verdi, alacaklı oldu
                                        partnerCredit = Math.abs(record.amount);
                                      } else if (record.type === 'expense' && record.amount === 0) {
                                        // Ortak kendi cebinden gider ödedi, alacaklı oldu
                                        partnerCredit = record.originalAmount || 0;
                                      }
                                    } else if (record.source?.includes(selectedPartner.name)) {
                                      // Partner-related transactions
                                      if (record.source.includes('Ortak Alacağı')) {
                                        // Ortak alacaklı kaydı (İçerde Bırak seçeneği)
                                        partnerCredit = Math.abs(record.originalAmount || record.amount);
                                      } else if (record.source.includes('Ortak Avans Ödemesi')) {
                                        // Ortak avans aldı, borçlu oldu
                                        partnerDebit = Math.abs(record.amount);
                                      } else if (record.source.includes('Ortak Para Çekimi')) {
                                        // Ortak para çekti, borçlu oldu
                                        partnerDebit = Math.abs(record.amount);
                                      }
                                    }
                                    
                                    return (
                                      <tr key={record.uniqueKey || `${record.id}-${index}`} className="border-bottom">
                                        <td className="py-3 px-4">
                                          <div className="d-flex align-items-center">
                                            <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3" 
                                                 style={{ width: '32px', height: '32px' }}>
                                              <i className="bi bi-calendar3 text-primary" style={{ fontSize: '12px' }}></i>
                                            </div>
                                            <div>
                                              <div className="fw-medium">{record.date}</div>
                                              <small className="text-muted">
                                                {new Date(record.date).toLocaleDateString('tr-TR', {
                                                  weekday: 'long',
                                                  year: 'numeric',
                                                  month: 'long',
                                                  day: 'numeric'
                                                })}
                                              </small>
                                            </div>
                                          </div>
                                        </td>
                                        <td className="py-3 px-4">
                                          <div className="text-muted small">
                                            {description}
                                          </div>
                                        </td>
                                        <td className="py-3 px-4">
                                          {partnerCredit > 0 && (
                                            <div className="fw-bold text-primary">
                                              {formatCurrency(partnerCredit)}
                                            </div>
                                          )}
                                        </td>
                                        <td className="py-3 px-4">
                                          {partnerDebit > 0 && (
                                            <div className="fw-bold text-success">
                                              {formatCurrency(partnerDebit)}
                                            </div>
                                          )}
                                        </td>
                                        <td className="py-3 px-4">
                                          {(() => {
                                            const balance = partnerCredit - partnerDebit;
                                            const isPositive = balance >= 0;
                                            return (
                                              <div className={`fw-bold ${isPositive ? 'text-success' : 'text-danger'}`}>
                                                {formatCurrency(Math.abs(balance))}
                                                <small className="d-block text-muted">
                                                  {isPositive ? 'Alacaklı' : 'Borçlu'}
                                                </small>
                                              </div>
                                            );
                                          })()}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-5">
                          <div className="bg-light bg-opacity-50 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" 
                               style={{ width: '80px', height: '80px' }}>
                            <i className="bi bi-journal-text text-muted" style={{ fontSize: '2rem' }}></i>
                          </div>
                          <h6 className="text-muted mb-2">Muhasebe Kaydı Bulunamadı</h6>
                          <p className="text-muted mb-0">Bu ortak için henüz muhasebe kaydı bulunmamaktadır.</p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseForms}
                >
                  <i className="bi bi-x-circle me-1"></i>
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