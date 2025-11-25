import { getSites, createSite, updateSite, deleteSite, archiveSite } from '../../services/api';
import { getTransactions, createTransaction } from '../../services/api';
import { createLog } from '../../services/api';
import { getAgreements } from '../../services/api';
import { getCompanies } from '../../services/api';
import * as XLSX from 'xlsx';
import SitesDataHandlers from './SitesDataHandlers';
import SitesPaymentHandlers from './SitesPaymentHandlers';
import SitesExcelHandlers from './SitesExcelHandlers';
import SitesFormHandlers from './SitesFormHandlers';

const SiteHandlers = ({
  sites, setSites,
  transactions, setTransactions,
  agreements, setAgreements,
  companies, setCompanies,
  formData, setFormData,
  selectedSiteForPayment, setSelectedSiteForPayment,
  pendingPayments, setPendingPayments,
  showPaymentSelection, setShowPaymentSelection,
  currentSiteForAgreements, setCurrentSiteForAgreements,
  currentSite, setCurrentSite,
  setShowAddForm,
  calculateTotalElevators,
  calculatePanels,
  formatCurrency,
  refreshData,
  processedPayments, setProcessedPayments,
  helpers
}) => {
  // Handle showing site details
  const handleShowSite = (site) => {
    // Call the UI handler to show the modal
    // This will be handled by UI handlers in the parent component
    console.log('Show site:', site);
  };

  // Handle showing active agreements for a site
  const handleShowActiveAgreements = (site) => {
    setCurrentSiteForAgreements(site);
  };

  // Initialize data handlers
  const dataHandlers = SitesDataHandlers({
    sites, setSites,
    transactions, setTransactions,
    agreements, setAgreements,
    companies, setCompanies,
    refreshData
  });

  // Initialize payment handlers
  const paymentHandlers = SitesPaymentHandlers({
    sites, setSites,
    transactions, setTransactions,
    selectedSiteForPayment,
    setSelectedSiteForPayment,
    setShowPaymentSelection,
    setPendingPayments,
    formatCurrency,
    refreshData,
    processedPayments, setProcessedPayments,
    helpers,
    agreements,
    companies
  });

  // Initialize Excel handlers
  const excelHandlers = SitesExcelHandlers({
    sites, setSites,
    refreshData
  });

  // Initialize form handlers
  const formHandlers = SitesFormHandlers({
    sites, setSites,
    currentSite, setCurrentSite,
    setShowAddForm,
    setFormData,
    formData,
    calculateTotalElevators,
    calculatePanels,
    calculateAveragePeople: helpers.calculateAveragePeople,
    refreshData
  });

  return {
    // Data handlers
    getSites: dataHandlers.getSites,
    getTransactions: dataHandlers.getTransactions,
    getAgreements: dataHandlers.getAgreements,
    getCompanies: dataHandlers.getCompanies,
    handleArchiveSite: dataHandlers.handleArchiveSite,
    handleDeleteAllSites: dataHandlers.handleDeleteAllSites,
    
    // Payment handlers
    handlePaymentSite: paymentHandlers.handlePaymentSite,
    processSitePayment: paymentHandlers.processSitePayment,
    handleSelectPayment: paymentHandlers.handleSelectPayment,
    handlePayAllPayments: paymentHandlers.handlePayAllPayments,
    
    // Excel handlers
    handleExcelImport: excelHandlers.handleExcelImport,
    importSitesFromExcel: excelHandlers.importSitesFromExcel,
    handleExportToExcel: () => excelHandlers.exportSitesToExcel(sites), // Pass current sites array
    
    // Form handlers
    handleFormSubmit: formHandlers.handleFormSubmit,
    
    // UI handlers
    handleShowSite,
    handleShowActiveAgreements,
    
    // Utility functions
    refreshData,
    sites,
    transactions
  };
};

export default SiteHandlers;