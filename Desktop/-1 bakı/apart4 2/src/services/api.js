// src/services/api.js
// Dynamic API service selector - Firebase or Local mode
import { auth } from '../config/firebase.js';

// Check if Firebase is enabled (auth object exists)
const isFirebaseEnabled = () => {
  return auth !== null && auth !== undefined;
};

// Select API service based on Firebase availability
const getApiService = async () => {
  if (isFirebaseEnabled()) {
    console.log('🔥 Using Firebase API service');
    return await import('./firebaseApi.js');
  } else {
    // Firebase not available - this should not happen in production
    console.error('❌ Firebase is not available - application may not work correctly');
    return await import('./localApi.js');
  }
};

// Create a proxy object that dynamically calls the appropriate API service
const createApiProxy = () => {
  return new Proxy({}, {
    get(target, prop) {
      return async (...args) => {
        const apiService = await getApiService();
        if (apiService[prop]) {
          return apiService[prop](...args);
        } else {
          throw new Error(`API method ${prop} not found`);
        }
      };
    }
  });
};

// Export the proxy object
const apiService = createApiProxy();

// Export all API methods
export const login = apiService.login;
export const changePassword = apiService.changePassword;
export const getDashboardSummary = apiService.getDashboardSummary;
export const getRecentTransactions = apiService.getRecentTransactions;
export const getSites = apiService.getSites;
export const createSite = apiService.createSite;
export const updateSite = apiService.updateSite;
export const deleteSite = apiService.deleteSite;
export const archiveSite = apiService.archiveSite;
export const getCompanies = apiService.getCompanies;
export const createCompany = apiService.createCompany;
export const updateCompany = apiService.updateCompany;
export const deleteCompany = apiService.deleteCompany;
export const archiveCompany = apiService.archiveCompany;
export const getAgreements = apiService.getAgreements;
export const createAgreement = apiService.createAgreement;
export const updateAgreement = apiService.updateAgreement;
export const deleteAgreement = apiService.deleteAgreement;
export const archiveAgreement = apiService.archiveAgreement;
export const getTransactions = apiService.getTransactions;
export const createTransaction = apiService.createTransaction;
export const updateTransaction = apiService.updateTransaction;
export const deleteTransaction = apiService.deleteTransaction;
export const getPartners = apiService.getPartners;
export const createPartner = apiService.createPartner;
export const updatePartner = apiService.updatePartner;
export const deletePartner = apiService.deletePartner;
export const getArchivedSites = apiService.getArchivedSites;
export const getArchivedCompanies = apiService.getArchivedCompanies;
export const getArchivedAgreements = apiService.getArchivedAgreements;
export const deleteArchivedSite = apiService.deleteArchivedSite;
export const deleteArchivedCompany = apiService.deleteArchivedCompany;
export const deleteArchivedAgreement = apiService.deleteArchivedAgreement;
export const restoreSite = apiService.restoreSite;
export const restoreCompany = apiService.restoreCompany;
export const restoreAgreement = apiService.restoreAgreement;
export const getUsers = apiService.getUsers;
export const createUser = apiService.createUser;
export const updateUser = apiService.updateUser;
export const deleteUser = apiService.deleteUser;
export const getSiteData = apiService.getSiteData;
export const getSiteAgreements = apiService.getSiteAgreements;
export const getSiteTransactions = apiService.getSiteTransactions;
export const getLogs = apiService.getLogs;
export const createLog = apiService.createLog;
export const deleteLog = apiService.deleteLog;
export const getPanelImages = apiService.getPanelImages;
export const uploadPanelImage = apiService.uploadPanelImage;
export const cleanupExpiredImages = apiService.cleanupExpiredImages;
export const onAuthStateChange = apiService.onAuthStateChange;
export const getCurrentUser = apiService.getCurrentUser;
export const hasPermission = apiService.hasPermission;
export const canAccessSite = apiService.canAccessSite;
export const canAccessCompany = apiService.canAccessCompany;