import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getCompanies, createCompany, updateCompany, deleteCompany, archiveCompany, createUser, getAgreements, updateAgreement, getTransactions, createTransaction, getSites } from '../services/api';
import { createLog } from '../services/api';
import { isObserver } from '../utils/auth';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

const Companies = () => {
  const [companies, setCompanies] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [sites, setSites] = useState([]); // Add sites state
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentCompany, setCurrentCompany] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    phone: '',
    email: '',
    address: '',
    taxOffice: '',
    taxNumber: '',
    notes: '',
    status: 'active'
  });
  const [showExcelInfo, setShowExcelInfo] = useState(false);
  
  // State for credit purchase modal
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditData, setCreditData] = useState({
    panelPrice: 300, // Default panel price
    panelCount: 1,
    totalAmount: 300
  });
  
  // Refs for PDF generation and Excel import
  const modalContentRef = useRef(null);
  const fileInputRef = useRef(null);
  const hasFetchedRef = useRef(false);

  // Memoize checkExpiredAgreements to prevent infinite loops
  const checkExpiredAgreements = useCallback(async () => {
    try {
      const [agreementsData, companiesData] = await Promise.all([
        getAgreements(),
        getCompanies()
      ]);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
      
      let updatedCompanies = [...companiesData];
      let companiesChanged = false;
      
      for (const agreement of agreementsData) {
        // If agreement is active and end date has passed, mark as inactive
        const agreementEndDate = new Date(agreement.endDate);
        agreementEndDate.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
        
        if (agreement.status === 'active' && agreementEndDate < today) {
          try {
            const updatedAgreement = { ...agreement, status: 'inactive' };
            // Update the agreement
            const savedAgreement = await updateAgreement(agreement.id, updatedAgreement);
            
            if (savedAgreement) {
              // Log the action
              console.log(`Anlaşma otomatik olarak pasif yapıldı: ${agreement.companyId} (ID: ${agreement.id})`);
              
              // Check if the company associated with this agreement has any other active agreements
              const companyAgreements = agreementsData.filter(a => 
                String(a.companyId) === String(agreement.companyId) && 
                a.status === 'active' && 
                a.id !== agreement.id
              );
              
              // If the company has no other active agreements, mark the company as inactive
              if (companyAgreements.length === 0) {
                const companyIndex = updatedCompanies.findIndex(c => String(c.id) === String(agreement.companyId));
                if (companyIndex !== -1 && updatedCompanies[companyIndex].status === 'active') {
                  updatedCompanies[companyIndex] = { ...updatedCompanies[companyIndex], status: 'inactive' };
                  // Update the company
                  const savedCompany = await updateCompany(updatedCompanies[companyIndex].id, updatedCompanies[companyIndex]);
                  
                  if (savedCompany) {
                    updatedCompanies[companyIndex] = savedCompany;
                    companiesChanged = true;
                    
                    // Log the action
                    console.log(`Firma otomatik olarak pasif yapıldı: ${savedCompany.name} (ID: ${savedCompany.id})`);
                  }
                }
              }
            }
          } catch (error) {
            console.error('Error updating agreement status:', error);
          }
        }
      }
      
      // If any companies were updated, update the state
      if (companiesChanged) {
        setCompanies(updatedCompanies);
      }
    } catch (error) {
      console.error('Error checking expired agreements:', error);
    }
  }, []); // Empty dependency array - only create once

  useEffect(() => {
    // Prevent multiple fetches
    if (hasFetchedRef.current) {
      return;
    }
    
    const fetchCompanies = async () => {
      try {
        hasFetchedRef.current = true;
        setLoading(true);
        
        const companiesData = await getCompanies();
        // Filter out archived companies
        const activeCompanies = companiesData.filter(company => company.status !== 'archived');
        setCompanies(activeCompanies);
      } catch (error) {
        console.error('Error fetching companies:', error);
        hasFetchedRef.current = false; // Reset on error to allow retry
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
    
    // Check for expired agreements when component mounts (only once)
    checkExpiredAgreements();
    
    // Set up interval to check for expired agreements every 5 minutes
    const interval = setInterval(() => {
      checkExpiredAgreements();
    }, 5 * 60 * 1000); // 5 minutes in milliseconds
    
    // Clean up interval on component unmount
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once

  const handleShowCompany = async (company) => {
    setCurrentCompany(company);
    setShowModal(true);
    
    // Fetch agreements, transactions, and sites for the company
    try {
      const [agreementsData, transactionsData, sitesData] = await Promise.all([
        getAgreements(),
        getTransactions(),
        getSites()
      ]);
      
      setAgreements(agreementsData);
      setTransactions(transactionsData);
      setSites(sitesData); // Set sites data
    } catch (error) {
      console.error('Error fetching company details:', error);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentCompany(null);
    setAgreements([]);
    setTransactions([]);
    setSites([]); // Clear sites data
  };

  const handleAddCompany = () => {
    setFormData({
      name: '',
      contact: '',
      phone: '',
      email: '',
      address: '',
      taxOffice: '',
      taxNumber: '',
      notes: '',
      status: 'active'
    });
    setCurrentCompany(null);
    setShowAddForm(true);
  };

  const handleEditCompany = (company) => {
    setFormData({
      name: company.name || '',
      contact: company.contact || '',
      phone: company.phone || '',
      email: company.email || '',
      address: company.address || '',
      taxOffice: company.taxOffice || '',
      taxNumber: company.taxNumber || '',
      notes: company.notes || '',
      status: company.status || 'active'
    });
    setCurrentCompany(company);
    setShowAddForm(true);
  };

  const handleCloseAddForm = () => {
    setShowAddForm(false);
    setCurrentCompany(null);
  };

  // Handle credit purchase button click
  const handleBuyCredit = (company) => {
    setCurrentCompany(company);
    setCreditData({
      panelPrice: 300,
      panelCount: 1,
      totalAmount: 300
    });
    setShowCreditModal(true);
  };

  // Handle credit data change
  const handleCreditChange = (e) => {
    const { name, value } = e.target;
    const newData = {
      ...creditData,
      [name]: parseFloat(value) || 0
    };
    
    // Calculate total amount
    if (name === 'panelPrice' || name === 'panelCount') {
      newData.totalAmount = newData.panelPrice * newData.panelCount;
    }
    
    setCreditData(newData);
  };

  // Handle credit purchase submission
  const handleCreditSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentCompany || creditData.totalAmount <= 0) {
      await window.showAlert(
        'Hata',
        'Geçerli bir tutar giriniz.',
        'warning'
      );
      return;
    }
    
    try {
      // Create transaction for the credit purchase
      const transactionData = {
        type: 'income',
        amount: creditData.totalAmount,
        date: new Date().toISOString().split('T')[0],
        source: 'Kredi Satışı',
        description: `${currentCompany.name} firmasından ${creditData.panelCount} adet panel kredisi satışı`,
        category: 'Kredi Satışı'
      };
      
      const newTransaction = await createTransaction(transactionData);
      
      if (!newTransaction) {
        throw new Error('Transaction creation failed');
      }
      
      // Update company with credit information
      const updatedCompanyData = {
        name: currentCompany.name,
        contact: currentCompany.contact,
        phone: currentCompany.phone,
        email: currentCompany.email,
        notes: currentCompany.notes,
        status: currentCompany.status,
        credit: (currentCompany.credit || 0) + creditData.panelCount,
        creditHistory: [
          ...(currentCompany.creditHistory || []),
          {
            purchaseDate: new Date().toISOString().split('T')[0],
            panelCount: creditData.panelCount,
            panelPrice: creditData.panelPrice,
            totalAmount: creditData.totalAmount
          }
        ]
      };
      
      const updatedCompany = await updateCompany(currentCompany.id, updatedCompanyData);
      
      if (!updatedCompany) {
        throw new Error('Company update failed');
      }
      
      // Update companies list - use functional update to prevent duplicates
      setCompanies(prevCompanies => {
        // Check if company already exists (prevent duplicates)
        const exists = prevCompanies.some(c => 
          (c.id === updatedCompany.id && c._docId === updatedCompany._docId) ||
          (c.id && updatedCompany.id && c.id === updatedCompany.id) ||
          (c._docId && updatedCompany._docId && c._docId === updatedCompany._docId)
        );
        if (exists) {
          // Update existing company
          return prevCompanies.map(c => 
            (c.id === updatedCompany.id || c._docId === updatedCompany._docId || 
             (c.id && updatedCompany.id && c.id === updatedCompany.id) ||
             (c._docId && updatedCompany._docId && c._docId === updatedCompany._docId))
              ? updatedCompany : c
          );
        } else {
          // This shouldn't happen, but just in case
          return prevCompanies;
        }
      });
      
      // Close modal and reset state
      setShowCreditModal(false);
      setCurrentCompany(null);
      
      // Log the action
      await createLog({
        user: 'Admin',
        action: `Firma kredisi satın alındı: ${currentCompany.name} (${creditData.panelCount} panel, ${creditData.totalAmount} ₺)`
      });
      
      await window.showAlert(
        'Başarılı',
        'Kredi başarıyla satın alındı.',
        'success'
      );
    } catch (error) {
      console.error('Error processing credit purchase:', error);
      await window.showAlert(
        'Hata',
        'Kredi satın alımı sırasında bir hata oluştu.',
        'error'
      );
    }
  };

  const handleArchiveCompany = async (companyId) => {
    const result = await window.showConfirm(
      'Firma Arşivleme',
      'Bu firmayı arşivlemek istediğinize emin misiniz?',
      'warning'
    );
    
    if (result) {
      try {
        const success = await archiveCompany(companyId);
        if (success) {
          // Remove from state immediately
          setCompanies(companies.filter(company => company.id !== companyId));
          
          // Log the action
          await createLog({
            user: 'Admin',
            action: `Firma arşivlendi: ${companies.find(c => c.id === companyId)?.name || 'Bilinmeyen Firma'}`
          });
          
          // Show success message
          await window.showAlert(
            'Başarılı',
            'Firma başarıyla arşivlendi.',
            'success'
          );
        } else {
          await window.showAlert(
            'Hata',
            'Firma arşivlenirken bir hata oluştu.',
            'error'
          );
        }
      } catch (error) {
        console.error('Error archiving company:', error);
        await window.showAlert(
          'Hata',
          'Firma arşivlenirken bir hata oluştu.',
          'error'
        );
      }
    }
  };

  const handleDeleteCompany = async (companyId) => {
    const result = await window.showConfirm(
      'Firma Silme',
      'Bu firmayı kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz!',
      'error'
    );
    
    if (result) {
      try {
        const success = await deleteCompany(companyId);
        if (success) {
          // Remove from state immediately
          setCompanies(companies.filter(company => company.id !== companyId));
          
          // Log the action
          await createLog({
            user: 'Admin',
            action: `Firma silindi: ${companies.find(c => c.id === companyId)?.name || 'Bilinmeyen Firma'}`
          });
          
          // Show success message
          await window.showAlert(
            'Başarılı',
            'Firma başarıyla silindi.',
            'success'
          );
        } else {
          await window.showAlert(
            'Hata',
            'Firma silinirken bir hata oluştu.',
            'error'
          );
        }
      } catch (error) {
        console.error('Error deleting company:', error);
        await window.showAlert(
          'Hata',
          'Firma silinirken bir hata oluştu.',
          'error'
        );
      }
    }
  };

  const handleToggleStatus = async (companyId) => {
    try {
      const company = companies.find(c => c.id === companyId);
      if (company) {
        const newStatus = company.status === 'active' ? 'inactive' : 'active';
        const updatedCompany = await updateCompany(companyId, { ...company, status: newStatus });
        if (updatedCompany) {
          setCompanies(companies.map(c => c.id === companyId ? updatedCompany : c));
          // Log the action
          await createLog({
            user: 'Admin',
            action: `Firma durumu değiştirildi: ${company.name} (${newStatus === 'active' ? 'Aktif' : 'Pasif'})`
          });
        }
      }
    } catch (error) {
      console.error('Error toggling company status:', error);
    }
  };

  // New function to delete all companies and archive them
  const handleDeleteAllCompanies = async () => {
    if (companies.length === 0) {
      await window.showAlert(
        'Bilgi',
        'Silinecek firma bulunmamaktadır.',
        'info'
      );
      return;
    }

    const result = await window.showConfirm(
      'Tüm Firmaları Sil',
      `Tüm ${companies.length} firmayı arşivlemek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
      'warning'
    );
    
    if (result) {
      try {
        let successCount = 0;
        let errorCount = 0;
        
        // Create an array of promises for archiving all companies
        const archivePromises = companies.map(async (company) => {
          try {
            const success = await archiveCompany(company.id);
            if (success) {
              successCount++;
              // Log the action
              await createLog({
                user: 'Admin',
                action: `Firma arşivlendi: ${company.name}`
              });
              return { success: true, companyId: company.id };
            } else {
              errorCount++;
              return { success: false, companyId: company.id };
            }
          } catch (error) {
            console.error('Error archiving company:', company.id, error);
            errorCount++;
            return { success: false, companyId: company.id, error: error.message };
          }
        });
        
        // Wait for all archive operations to complete
        await Promise.all(archivePromises);
        
        // Update state to remove all companies
        setCompanies([]);
        
        await window.showAlert(
          'İşlem Tamamlandı',
          `${successCount} firma başarıyla arşivlendi. ${errorCount} firma arşivlenirken hata oluştu.`,
          'info'
        );
      } catch (error) {
        console.error('Error deleting all companies:', error);
        await window.showAlert(
          'Hata',
          'Firmalar arşivlenirken bir hata oluştu: ' + error.message,
          'error'
        );
      }
    }
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
    if (!formData.name) {
      await window.showAlert(
        'Eksik Bilgi',
        'Lütfen firma adını giriniz.',
        'warning'
      );
      return;
    }
    
    try {
      if (currentCompany) {
        // Update existing company
        const updatedCompany = await updateCompany(currentCompany.id, formData);
        if (updatedCompany) {
          setCompanies(companies.map(company => company.id === currentCompany.id ? updatedCompany : company));
          setShowAddForm(false);
          setCurrentCompany(null);
          // Log the action
          await createLog({
            user: 'Admin',
            action: `Firma güncellendi: ${formData.name}`
          });
          
          await window.showAlert(
            'Başarılı',
            'Firma başarıyla güncellendi.',
            'success'
          );
        }
      } else {
        // Create new company
        // Note: Company user will be automatically created by Cloud Function (createCompanyUser)
        const newCompany = await createCompany(formData);
        if (newCompany) {
          setCompanies([...companies, newCompany]);
          setShowAddForm(false);
          
          // Log the action
          await createLog({
            user: 'Admin',
            action: `Yeni firma eklendi: ${formData.name}`
          });
          
          await window.showAlert(
            'Başarılı',
            'Yeni firma başarıyla eklendi. Firma kullanıcısı otomatik olarak oluşturuldu.',
            'success'
          );
        }
      }
    } catch (error) {
      console.error('Error saving company:', error);
      await window.showAlert(
        'Hata',
        'Firma kaydedilirken bir hata oluştu.',
        'error'
      );
    }
  };

  // Handle Excel file import
  const handleExcelImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Process the data (skip header row)
        const companiesToImport = [];
        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          if (row.length >= 3) {
            const companyData = {
              name: row[0] || '',
              contact: row[1] || '',
              phone: row[2] || '',
              email: '',
              notes: '',
              status: 'inactive' // As requested, imported companies should be inactive by default
            };
            
            companiesToImport.push(companyData);
          }
        }
        
        // Import companies
        await importCompaniesFromExcel(companiesToImport);
      } catch (error) {
        console.error('Error reading Excel file:', error);
        await window.showAlert(
          'Hata',
          'Excel dosyası okunurken bir hata oluştu.',
          'error'
        );
      }
    };
    reader.readAsBinaryString(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Import companies from Excel data
  const importCompaniesFromExcel = async (companiesData) => {
    if (!companiesData || companiesData.length === 0) {
      await window.showAlert(
        'Uyarı',
        'İçe aktarılacak firma bulunamadı.',
        'warning'
      );
      return;
    }
    
    try {
      let importedCount = 0;
      let errorCount = 0;
      
      for (const companyData of companiesData) {
        try {
          // Validate required field
          if (!companyData.name) {
            errorCount++;
            continue;
          }
          
          const newCompany = await createCompany(companyData);
          if (newCompany) {
            setCompanies(prevCompanies => [...prevCompanies, newCompany]);
            importedCount++;
            
            // Log the action
            await createLog({
              user: 'Admin',
              action: `Firma Excel ile içe aktarıldı: ${companyData.name}`
            });
          } else {
            errorCount++;
          }
        } catch (error) {
          console.error('Error importing company:', error);
          errorCount++;
        }
      }
      
      await window.showAlert(
        'İçe Aktarma Tamamlandı',
        `${importedCount} firma başarıyla içe aktarıldı. ${errorCount} firma içe aktarılamadı.`,
        'info'
      );
    } catch (error) {
      console.error('Error importing companies from Excel:', error);
      await window.showAlert(
        'Hata',
        'Firmalar içe aktarılırken bir hata oluştu.',
        'error'
      );
    }
  };

  // Export companies to Excel
  const exportCompaniesToExcel = () => {
    // Prepare data for export
    const exportData = companies.map(company => ({
      'Firma Adı': company.name,
      'Yetkili Adı': company.contact,
      'Telefon Numarası': company.phone
    }));
    
    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Firmalar');
    
    // Export to file
    XLSX.writeFile(wb, 'firmalar.xlsx');
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  // Function to generate PDF of company details
  const generateCompanyPDF = async () => {
    if (!modalContentRef.current || !currentCompany) return;
    
    try {
      // Clone the modal content to avoid modifying the original
      const clone = modalContentRef.current.cloneNode(true);
      
      // Hide buttons and interactive elements in the clone
      const buttons = clone.querySelectorAll('button, .btn');
      buttons.forEach(button => button.style.display = 'none');
      
      // Create a new window for PDF generation
      const pdfWindow = window.open('', '_blank');
      pdfWindow.document.write(`
        <html>
          <head>
            <title>${currentCompany.name} - Detay</title>
            <style>
              body { font-family: Arial, sans-serif; }
              .container { max-width: 1000px; margin: 0 auto; padding: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .section { margin-bottom: 30px; }
              .section-title { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 15px; }
              .info-row { display: flex; margin-bottom: 10px; }
              .info-label { font-weight: bold; width: 200px; }
              .info-value { flex: 1; }
              table { width: 100%; border-collapse: collapse; margin: 15px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .text-center { text-align: center; }
              .text-success { color: #28a745; }
              .text-muted { color: #6c757d; }
            </style>
          </head>
          <body>
            <div class="container">
              ${clone.innerHTML}
            </div>
          </body>
        </html>
      `);
      pdfWindow.document.close();
      
      // Wait for content to load
      pdfWindow.onload = async () => {
        // Generate canvas from the content
        const canvas = await html2canvas(pdfWindow.document.body, {
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
        pdf.save(`${currentCompany.name}_detay.pdf`);
        
        // Close the temporary window
        pdfWindow.close();
        
        await window.showAlert(
          'Başarılı',
          'PDF dosyası başarıyla oluşturuldu ve indirildi.',
          'success'
        );
      };
    } catch (error) {
      console.error('Error generating PDF:', error);
      await window.showAlert(
        'Hata',
        'PDF oluşturma sırasında bir hata oluştu.',
        'error'
      );
    }
  };

  // Get agreements for the current company
  const getCompanyAgreements = () => {
    if (!currentCompany || !agreements.length) return [];
    return agreements.filter(agreement => 
      String(agreement.companyId) === String(currentCompany.id)
    );
  };

  // Get payment transactions for the current company
  const getCompanyPayments = () => {
    if (!currentCompany || !transactions.length) return [];
    return transactions.filter(transaction => 
      transaction.type === 'income' && 
      transaction.source.includes('Anlaşma Ödemesi') &&
      transaction.source.includes(currentCompany.name)
    );
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <div className="loading-spinner mx-auto"></div>
          <p className="mt-3 text-muted">Firmalar yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Get company agreements and payments for display
  const companyAgreements = getCompanyAgreements();
  const companyPayments = getCompanyPayments();

  // Calculate statistics
  const activeCompanies = companies.filter(company => company.status === 'active').length;
  const totalCredit = companies.reduce((sum, company) => sum + (company.credit || 0), 0);
  const companiesWithAgreements = [...new Set(agreements.map(a => a.companyId))].length;
  
  // Calculate payment statistics
  const paidAgreements = agreements.filter(a => a.paymentReceived || a.creditPaymentReceived);
  const unpaidAgreements = agreements.filter(a => !a.paymentReceived && !a.creditPaymentReceived);
  const paidAmount = paidAgreements.reduce((sum, agreement) => sum + (agreement.totalAmount || 0), 0);
  const unpaidAmount = unpaidAgreements.reduce((sum, agreement) => sum + (agreement.totalAmount || 0), 0);

  return (
    <div className="container-fluid">
      {/* Header with title and buttons */}
      <div className="companies-header mb-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
          <div>
            <h2 className="h3 fw-bold mb-1">Firmalar</h2>
            <p className="mb-0">Firma yönetimi ve kredi işlemleri</p>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <button 
              onClick={handleAddCompany}
              className="btn btn-companies-primary btn-icon d-flex align-items-center"
              disabled={isObserver()}
            >
              <i className="bi bi-plus-lg me-2"></i>
              <span>Firma Ekle</span>
            </button>
            <div className="position-relative">
              <button 
                className="btn btn-companies-outline btn-icon d-flex align-items-center"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                title="Excel ile Yükle"
              >
                <i className="bi bi-upload"></i>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx, .xls"
                onChange={handleExcelImport}
                style={{ display: 'none' }}
              />
            </div>
            <button 
              onClick={exportCompaniesToExcel}
              className="btn btn-companies-outline btn-icon d-flex align-items-center"
              title="Excel Çıktısı Al"
            >
              <i className="bi bi-download"></i>
            </button>
            <button 
              className="btn btn-companies-outline d-flex align-items-center"
              onClick={() => setShowExcelInfo(!showExcelInfo)}
              title="Excel Bilgilendirme"
            >
              <i className="bi bi-info-circle"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3 col-sm-6">
          <div className="companies-stats-card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Toplam Firma</h6>
                  <h3 className="mb-0 fw-bold">{companies.length}</h3>
                </div>
                <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                  <i className="bi bi-building text-primary fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="companies-stats-card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Aktif Firma</h6>
                  <h3 className="mb-0 fw-bold">{activeCompanies}</h3>
                </div>
                <div className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                  <i className="bi bi-check-circle text-success fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="companies-stats-card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Toplam Kredi</h6>
                  <h3 className="mb-0 fw-bold">{totalCredit} Panel</h3>
                </div>
                <div className="bg-info bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                  <i className="bi bi-credit-card text-info fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="companies-stats-card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Anlaşmalı Firma</h6>
                  <h3 className="mb-0 fw-bold">{companiesWithAgreements}</h3>
                </div>
                <div className="bg-warning bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                  <i className="bi bi-handshake text-warning fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Status Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3 col-sm-6">
          <div className="companies-stats-card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Ödenmiş Anlaşma</h6>
                  <h3 className="mb-0 fw-bold">{paidAgreements.length}</h3>
                  <p className="mb-0 small text-success">{new Intl.NumberFormat('tr-TR', {
                    style: 'currency',
                    currency: 'TRY'
                  }).format(paidAmount)}</p>
                </div>
                <div className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                  <i className="bi bi-check-circle text-success fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="companies-stats-card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Ödenmemiş Anlaşma</h6>
                  <h3 className="mb-0 fw-bold">{unpaidAgreements.length}</h3>
                  <p className="mb-0 small text-warning">{new Intl.NumberFormat('tr-TR', {
                    style: 'currency',
                    currency: 'TRY'
                  }).format(unpaidAmount)}</p>
                </div>
                <div className="bg-warning bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                  <i className="bi bi-clock text-warning fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="companies-stats-card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Ödeme Oranı</h6>
                  <h3 className="mb-0 fw-bold">
                    {agreements.length > 0 
                      ? Math.round((paidAgreements.length / agreements.length) * 100) 
                      : 0}%
                  </h3>
                </div>
                <div className="bg-info bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                  <i className="bi bi-percent text-info fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="companies-stats-card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Bekleyen Ödeme</h6>
                  <h3 className="mb-0 fw-bold">{new Intl.NumberFormat('tr-TR', {
                    style: 'currency',
                    currency: 'TRY'
                  }).format(unpaidAmount)}</h3>
                </div>
                <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                  <i className="bi bi-arrow-up-circle text-primary fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info about Excel template - shown only when info icon is clicked */}
      {showExcelInfo && (
        <div className="alert alert-info alert-dismissible fade show mb-4" role="alert">
          <i className="bi bi-info-circle me-2"></i>
          <strong>Excel Şablonu:</strong> Firmaları toplu olarak yüklemek için Excel dosyanızda aşağıdaki sütunları kullanın:
          <ul className="mb-1 mt-2">
            <li><strong>A1:</strong> Firma Adı</li>
            <li><strong>B1:</strong> Yetkili Adı</li>
            <li><strong>C1:</strong> Telefon Numarası</li>
          </ul>
          <small>
            İçe aktarılan firmalar otomatik olarak pasif durumda kaydedilir. 
            <a href="/company-template.csv" target="_blank" rel="noopener noreferrer" className="alert-link ms-1">
              Örnek şablonu indirmek için tıklayın
            </a>
          </small>
          <button type="button" className="btn-close" aria-label="Close" onClick={() => setShowExcelInfo(false)}></button>
        </div>
      )}

      {/* Companies Table */}
      <div className="companies-table-container border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0 companies-table">
              <thead className="companies-table-header">
                <tr>
                  <th className="border-0 py-3 px-4">Firma</th>
                  <th className="border-0 py-3 px-4 d-none d-md-table-cell">Yetkili</th>
                  <th className="border-0 py-3 px-4 d-none d-lg-table-cell">İletişim</th>
                  <th className="border-0 py-3 px-4 d-none d-xl-table-cell">Notlar</th>
                  <th className="border-0 py-3 px-4">Durum</th>
                  <th className="border-0 py-3 px-4 text-end">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.id} className="align-middle">
                    <td className="py-3 px-4">
                      <div className="d-flex align-items-center company-info">
                        <div className="company-icon me-3">
                          <div className="d-flex align-items-center justify-content-center bg-primary rounded-circle text-white fw-bold" 
                               style={{width: '40px', height: '40px'}}>
                            {company.name.charAt(0)}
                          </div>
                        </div>
                        <div>
                          <div className="company-name fw-medium">{company.name}</div>
                          <div className="company-id text-muted small">#{company.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 d-none d-md-table-cell">
                      {company.contact}
                    </td>
                    <td className="py-3 px-4 d-none d-lg-table-cell">
                      {company.phone && <div className="mb-1">Tel: {company.phone}</div>}
                      {company.email && <div>Email: {company.email}</div>}
                    </td>
                    <td className="py-3 px-4 d-none d-xl-table-cell">
                      {company.notes}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`badge ${company.status === 'active' ? 'bg-success' : 'bg-danger'} rounded-pill`}>
                        {company.status === 'active' ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-end">
                      <div className="d-flex gap-2 justify-content-end">
                        <button
                          onClick={() => handleShowCompany(company)}
                          className="btn btn-sm btn-outline-primary"
                          title="Göster"
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        <button
                          onClick={() => handleEditCompany(company)}
                          className="btn btn-sm btn-outline-secondary"
                          title="Düzenle"
                          disabled={isObserver()}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          onClick={() => handleBuyCredit(company)}
                          className="btn btn-sm btn-outline-success"
                          title="Kredi Al"
                          disabled={isObserver()}
                        >
                          <i className="bi bi-credit-card"></i>
                        </button>
                        <button
                          onClick={() => handleArchiveCompany(company.id)}
                          className="btn btn-sm btn-outline-warning"
                          title="Arşivle"
                          disabled={isObserver()}
                        >
                          <i className="bi bi-archive"></i>
                        </button>
                        <button
                          onClick={() => handleDeleteCompany(company.id)}
                          className="btn btn-sm btn-outline-danger"
                          title="Kalıcı Sil"
                          disabled={isObserver()}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {companies.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-5">
                      <div className="empty-state">
                        <i className="bi bi-building"></i>
                        <p className="mb-3">Henüz firma bulunmamaktadır.</p>
                        <button 
                          onClick={handleAddCompany}
                          className="btn btn-companies-primary"
                          disabled={isObserver()}
                        >
                          Firma Ekle
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

      {/* Delete All Companies Button */}
      {companies.length > 0 && (
        <div className="d-flex justify-content-end mt-3">
          <button
            onClick={handleDeleteAllCompanies}
            className="btn btn-outline-danger"
            title="Tüm Firmaları Sil"
            disabled={isObserver()}
          >
            <i className="bi bi-trash me-1"></i>
            Tüm Firmaları Sil
          </button>
        </div>
      )}

      {/* Company Detail Modal */}
      {showModal && currentCompany && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleCloseModal();
          }
        }}>
          <div className="modal-dialog modal-xl modal-dialog-scrollable" onClick={e => e.stopPropagation()}>
            <div className="modal-content companies-modal-content">
              <div className="modal-header bg-primary text-white rounded-top">
                <h5 className="modal-title d-flex align-items-center">
                  <i className="bi bi-building me-2"></i>
                  <span className="fw-bold">{currentCompany.name} - Detay</span>
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={handleCloseModal}
                ></button>
              </div>
              <div className="modal-body" ref={modalContentRef}>
                <div className="container-fluid">
                  {/* Company Info */}
                  <div className="row mb-4">
                    <div className="col-12">
                      <div className="detail-card">
                        <div className="detail-card-header bg-light">
                          <h6 className="mb-0 fw-bold">
                            <i className="bi bi-info-circle me-2"></i>
                            Firma Bilgileri
                          </h6>
                        </div>
                        <div className="detail-card-body">
                          <div className="row">
                            <div className="col-md-6 mb-3">
                              <div className="d-flex align-items-center mb-2">
                                <i className="bi bi-building text-primary me-2"></i>
                                <strong>Firma Adı:</strong>
                              </div>
                              <div className="ps-4">{currentCompany.name}</div>
                            </div>
                            <div className="col-md-6 mb-3">
                              <div className="d-flex align-items-center mb-2">
                                <i className="bi bi-person text-primary me-2"></i>
                                <strong>Yetkili:</strong>
                              </div>
                              <div className="ps-4">{currentCompany.contact || '-'}</div>
                            </div>
                            <div className="col-md-6 mb-3">
                              <div className="d-flex align-items-center mb-2">
                                <i className="bi bi-telephone text-primary me-2"></i>
                                <strong>Telefon:</strong>
                              </div>
                              <div className="ps-4">{currentCompany.phone || '-'}</div>
                            </div>
                            <div className="col-md-6 mb-3">
                              <div className="d-flex align-items-center mb-2">
                                <i className="bi bi-envelope text-primary me-2"></i>
                                <strong>Email:</strong>
                              </div>
                              <div className="ps-4">{currentCompany.email || '-'}</div>
                            </div>
                            <div className="col-md-6 mb-3">
                              <div className="d-flex align-items-center mb-2">
                                <i className="bi bi-credit-card text-primary me-2"></i>
                                <strong>Kredi:</strong>
                              </div>
                              <div className="ps-4">
                                <span className="fw-bold text-success">{currentCompany.credit || 0} Panel</span>
                              </div>
                            </div>
                            <div className="col-md-6 mb-3">
                              <div className="d-flex align-items-center mb-2">
                                <i className="bi bi-info-circle text-primary me-2"></i>
                                <strong>Durum:</strong>
                              </div>
                              <div className="ps-4">
                                <span className={`badge ${currentCompany.status === 'active' ? 'bg-success' : 'bg-danger'} rounded-pill`}>
                                  {currentCompany.status === 'active' ? 'Aktif' : 'Pasif'}
                                </span>
                              </div>
                            </div>
                            <div className="col-12 mb-3">
                              <div className="d-flex align-items-center mb-2">
                                <i className="bi bi-journal-text text-primary me-2"></i>
                                <strong>Notlar:</strong>
                              </div>
                              <div className="ps-4">{currentCompany.notes || '-'}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Agreements Section */}
                  <div className="row mb-4">
                    <div className="col-12">
                      <div className="detail-card">
                        <div className="detail-card-header bg-light">
                          <h6 className="mb-0 fw-bold">
                            <i className="bi bi-handshake me-2"></i>
                            Anlaşmalar ({companyAgreements.length})
                          </h6>
                        </div>
                        <div className="detail-card-body">
                          {companyAgreements.length > 0 ? (
                            <div className="table-responsive">
                              <table className="table table-bordered table-detail">
                                <thead>
                                  <tr>
                                    <th>Anlaşma ID</th>
                                    <th>Site</th>
                                    <th>Başlangıç</th>
                                    <th>Bitiş</th>
                                    <th>Panel Sayısı</th>
                                    <th>Haftalık Tutar</th>
                                    <th>Durum</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {companyAgreements.map(agreement => {
                                    // Get all sites for this agreement
                                    const agreementSites = [];
                                    if (agreement.sitePanelCounts) {
                                      Object.keys(agreement.sitePanelCounts).forEach(siteId => {
                                        const site = sites.find(s => String(s.id) === String(siteId));
                                        if (site) {
                                          agreementSites.push(site.name);
                                        }
                                      });
                                    }
                                    
                                    // Calculate total panel count
                                    const totalPanelCount = agreement.sitePanelCounts ? 
                                      Object.values(agreement.sitePanelCounts).reduce((sum, count) => sum + count, 0) : 0;
                                    
                                    // Get weekly rate per panel
                                    const weeklyRatePerPanel = parseFloat(agreement.weeklyRatePerPanel) || 0;
                                    
                                    return (
                                      <tr key={agreement.id}>
                                        <td>#{agreement.id}</td>
                                        <td>
                                          {agreementSites.length > 0 ? (
                                            <div className="d-flex flex-wrap gap-1">
                                              {agreementSites.map((siteName, index) => (
                                                <span key={index} className="badge bg-primary-subtle text-primary-emphasis">
                                                  {siteName}
                                                </span>
                                              ))}
                                            </div>
                                          ) : (
                                            <span className="text-muted">Site seçilmedi</span>
                                          )}
                                        </td>
                                        <td>{new Date(agreement.startDate).toLocaleDateString('tr-TR')}</td>
                                        <td>{new Date(agreement.endDate).toLocaleDateString('tr-TR')}</td>
                                        <td className="text-center fw-bold">{totalPanelCount}</td>
                                        <td className="fw-bold text-success text-center">{formatCurrency(weeklyRatePerPanel)}</td>
                                        <td>
                                          <span className={`badge ${agreement.status === 'active' ? 'bg-success' : 'bg-danger'} rounded-pill`}>
                                            {agreement.status === 'active' ? 'Aktif' : 'Pasif'}
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="text-center py-3">
                              <i className="bi bi-handshake fs-1 text-muted"></i>
                              <p className="mt-2 mb-0 text-muted">Bu firma için anlaşma bulunmamaktadır.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payments Section */}
                  <div className="row">
                    <div className="col-12">
                      <div className="detail-card">
                        <div className="detail-card-header bg-light">
                          <h6 className="mb-0 fw-bold">
                            <i className="bi bi-currency-dollar me-2"></i>
                            Ödemeler ({companyPayments.length})
                          </h6>
                        </div>
                        <div className="detail-card-body">
                          {companyPayments.length > 0 ? (
                            <div className="table-responsive">
                              <table className="table table-bordered table-detail">
                                <thead>
                                  <tr>
                                    <th>Ödeme ID</th>
                                    <th>Tarih</th>
                                    <th>Açıklama</th>
                                    <th>Tutar</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {companyPayments.map(payment => (
                                    <tr key={payment.id}>
                                      <td>#{payment.id}</td>
                                      <td>{new Date(payment.date).toLocaleDateString('tr-TR')}</td>
                                      <td>{payment.description}</td>
                                      <td className="fw-bold text-success">{formatCurrency(payment.amount)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="text-center py-3">
                              <i className="bi bi-currency-dollar fs-1 text-muted"></i>
                              <p className="mt-2 mb-0 text-muted">Bu firma için ödeme kaydı bulunmamaktadır.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer bg-light rounded-bottom">
                <div className="d-flex flex-column flex-md-row gap-2 w-100">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCloseModal}
                  >
                    <i className="bi bi-x-lg me-1"></i> Kapat
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={generateCompanyPDF}
                  >
                    <i className="bi bi-file-earmark-pdf me-1"></i> PDF Olarak İndir
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Company Form Modal */}
      {showAddForm && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleCloseAddForm();
          }
        }}>
          <div className="modal-dialog modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-content companies-modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <i className="bi bi-building me-2"></i>
                  {currentCompany ? 'Firma Düzenle' : 'Yeni Firma Ekle'}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={handleCloseAddForm}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleFormSubmit}>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Firma Adı <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control form-control-custom"
                      name="name"
                      value={formData.name}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Yetkili Adı</label>
                    <input
                      type="text"
                      className="form-control form-control-custom"
                      name="contact"
                      value={formData.contact}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Telefon</label>
                    <input
                      type="text"
                      className="form-control form-control-custom"
                      name="phone"
                      value={formData.phone}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Email</label>
                    <input
                      type="email"
                      className="form-control form-control-custom"
                      name="email"
                      value={formData.email}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Açık Adres</label>
                    <textarea
                      className="form-control form-control-custom"
                      name="address"
                      value={formData.address}
                      onChange={handleFormChange}
                      rows="2"
                      placeholder="Firma açık adresi (sözleşmede kullanılır)"
                    ></textarea>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">Vergi Dairesi</label>
                      <input
                        type="text"
                        className="form-control form-control-custom"
                        name="taxOffice"
                        value={formData.taxOffice}
                        onChange={handleFormChange}
                        placeholder="Örn: Merkez Vergi Dairesi"
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">Vergi No</label>
                      <input
                        type="text"
                        className="form-control form-control-custom"
                        name="taxNumber"
                        value={formData.taxNumber}
                        onChange={handleFormChange}
                        placeholder="Vergi numarası"
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Notlar</label>
                    <textarea
                      className="form-control form-control-custom"
                      name="notes"
                      value={formData.notes}
                      onChange={handleFormChange}
                      rows="3"
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Durum</label>
                    <select
                      className="form-select form-control-custom"
                      name="status"
                      value={formData.status}
                      onChange={handleFormChange}
                    >
                      <option value="active">Aktif</option>
                      <option value="inactive">Pasif</option>
                    </select>
                  </div>
                </form>
              </div>
              <div className="modal-footer bg-light">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseAddForm}
                >
                  <i className="bi bi-x-lg me-1"></i> İptal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  onClick={handleFormSubmit}
                  disabled={isObserver()}
                >
                  <i className="bi bi-check-lg me-1"></i> {currentCompany ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Credit Purchase Modal */}
      {showCreditModal && currentCompany && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowCreditModal(false);
            setCurrentCompany(null);
          }
        }}>
          <div className="modal-dialog modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-content companies-modal-content">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title">
                  <i className="bi bi-credit-card me-2"></i>
                  Kredi Satın Al
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowCreditModal(false);
                    setCurrentCompany(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleCreditSubmit}>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Firma</label>
                    <input
                      type="text"
                      className="form-control form-control-custom"
                      value={currentCompany.name}
                      disabled
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Panel Fiyatı (₺)</label>
                    <input
                      type="number"
                      className="form-control form-control-custom"
                      name="panelPrice"
                      value={creditData.panelPrice}
                      onChange={handleCreditChange}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Panel Sayısı</label>
                    <input
                      type="number"
                      className="form-control form-control-custom"
                      name="panelCount"
                      value={creditData.panelCount}
                      onChange={handleCreditChange}
                      min="1"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Toplam Tutar (₺)</label>
                    <input
                      type="number"
                      className="form-control form-control-custom"
                      value={creditData.totalAmount}
                      disabled
                    />
                  </div>
                </form>
              </div>
              <div className="modal-footer bg-light">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCreditModal(false);
                    setCurrentCompany(null);
                  }}
                >
                  <i className="bi bi-x-lg me-1"></i> İptal
                </button>
                <button
                  type="submit"
                  className="btn btn-success"
                  onClick={handleCreditSubmit}
                >
                  <i className="bi bi-credit-card me-1"></i> Satın Al
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Companies;
