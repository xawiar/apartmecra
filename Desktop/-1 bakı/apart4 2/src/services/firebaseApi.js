// src/services/firebaseApi.js
// Firebase-based API service that replaces the JSON Server API

import { 
  loginWithEmail, 
  logoutUser, 
  getCurrentUser, 
  onAuthStateChange,
  hasPermission,
  canAccessSite,
  canAccessCompany,
  initializeAdminUser,
  createUserWithEmail
} from './firebaseAuth.js';

import {
  // Sites
  getSites as getSitesFromDb,
  createSite as createSiteInDb,
  updateSite as updateSiteInDb,
  deleteSite as deleteSiteFromDb,
  archiveSite as archiveSiteInDb,
  
  // Companies
  getCompanies as getCompaniesFromDb,
  createCompany as createCompanyInDb,
  updateCompany as updateCompanyInDb,
  deleteCompany as deleteCompanyFromDb,
  archiveCompany as archiveCompanyInDb,
  
  // Agreements
  getAgreements as getAgreementsFromDb,
  createAgreement as createAgreementInDb,
  updateAgreement as updateAgreementInDb,
  deleteAgreement as deleteAgreementFromDb,
  archiveAgreement as archiveAgreementInDb,
  
  // Transactions
  getTransactions as getTransactionsFromDb,
  createTransaction as createTransactionInDb,
  updateTransaction as updateTransactionInDb,
  deleteTransaction as deleteTransactionFromDb,
  
  // Partners
  getPartners as getPartnersFromDb,
  createPartner as createPartnerInDb,
  updatePartner as updatePartnerInDb,
  deletePartner as deletePartnerFromDb,
  
  // Users
  getUsers as getUsersFromDb,
  createUser as createUserInDb,
  updateUser as updateUserFromDb,
  deleteUser as deleteUserFromDb,
  createPersonnelUser,
  
  // Logs
  getLogs as getLogsFromDb,
  createLog as createLogInDb,
  deleteLog as deleteLogFromDb,
  
  // Dashboard
  getDashboardSummary as getDashboardSummaryFromDb,
  
  // Collections
  getCollection,
  deleteDocument,
  
  // Accounting Records
  getAccountingRecords as getAccountingRecordsFromDb,
  createAccountingRecord as createAccountingRecordInDb
} from './firebaseDb.js';

// Initialize Firebase services
let isInitialized = false;

const initializeFirebase = async () => {
  // Check if Firebase is enabled
  const { auth } = await import('../config/firebase.js');
  
  if (!auth) {
    console.log('🚫 Firebase is disabled - using local mode');
    return false;
  }
  
  if (!isInitialized) {
    try {
      await initializeAdminUser();
      isInitialized = true;
    } catch (error) {
      console.error('Firebase initialization error:', error);
      isInitialized = true; // Continue anyway
    }
  }
  
  return true;
};

// Auth endpoints
export const login = async (username, password) => {
  try {
    console.log('API login called with:', username);
    
    // Import getDocument for archive checking
    const { getDocument } = await import('./firebaseDb.js');
    
    // Try different login types in order
    const loginAttempts = [];
    
    if (username.includes('@')) {
      // Direct email login - determine role from email
      let role = 'admin';
      if (username.includes('@site.local')) {
        role = 'site_user';
      } else if (username.includes('@company.local')) {
        role = 'company';
      } else if (username.includes('@personnel.local')) {
        role = 'personnel';
      }
      loginAttempts.push({
        email: username,
        role: role
      });
    } else {
      // If username is "admin", try admin login first
      if (username.toLowerCase() === 'admin') {
        loginAttempts.push({
          email: 'admin@apartmecra.com',
          role: 'admin'
        });
        loginAttempts.push({
          email: 'admin@example.com',
        role: 'admin'
      });
    } else {
      // Try site login first
      loginAttempts.push({
        email: `${username}@site.local`,
        role: 'site_user'
      });
      
      // Try company login
      loginAttempts.push({
        email: `${username}@company.local`,
        role: 'company'
      });
      
      // Try personnel login
      loginAttempts.push({
        email: `${username}@personnel.local`,
        role: 'personnel'
      });
      }
    }
    
    // Try each login attempt
    for (const attempt of loginAttempts) {
      console.log('Attempting login with email:', attempt.email, 'role:', attempt.role);
      
      try {
        // Check if user is archived before attempting login
        if (attempt.role === 'site_user') {
          const siteId = attempt.email.replace('@site.local', '');
          const siteResult = await getDocument('sites', siteId);
          if (siteResult.success && siteResult.data.status === 'archived') {
            console.log('Site user is archived, login denied:', siteId);
            return { error: 'Bu site arşivlenmiş, giriş yapılamaz' };
          }
        }
        
        if (attempt.role === 'company') {
          const companyId = attempt.email.replace('@company.local', '');
          const companyResult = await getDocument('companies', companyId);
          if (companyResult.success && companyResult.data.status === 'archived') {
            console.log('Company user is archived, login denied:', companyId);
            return { error: 'Bu firma arşivlenmiş, giriş yapılamaz' };
          }
        }
        
        const result = await loginWithEmail(attempt.email, password);
        
        if (result.success) {
          console.log('API login successful with role:', attempt.role);
          return {
            token: result.token,
            user: {
              username: result.user.username,
              role: attempt.role,
              siteId: result.user.siteId || null,
              companyId: result.user.companyId || null,
              id: result.user.uid
            }
          };
        }
      } catch (error) {
        console.log('Login attempt failed for:', attempt.email, error.message);
        continue; // Try next attempt
      }
    }
    
    // All attempts failed
    console.error('All login attempts failed');
    return { error: 'Geçersiz kimlik bilgileri' };
    
  } catch (error) {
    console.error('API login error:', error);
    return { error: 'Bağlantı hatası: Sunucuya ulaşılamıyor' };
  }
};

export const changePassword = async (currentPassword, newPassword) => {
  try {
    const user = getCurrentUser();
    if (!user) {
      return { error: 'No authenticated user' };
    }
    
    const { updateUserPassword } = await import('./firebaseAuth.js');
    const result = await updateUserPassword(newPassword);
    
    if (result.success) {
      return { success: true };
    } else {
      return { error: result.error };
    }
  } catch (error) {
    return { error: 'Password change failed' };
  }
};

// Dashboard endpoints
export const getDashboardSummary = async () => {
  await initializeFirebase();
  return await getDashboardSummaryFromDb();
};

export const getRecentTransactions = async (limit = 5) => {
  await initializeFirebase();
  const transactions = await getTransactionsFromDb();
  return transactions.slice(0, limit);
};

// Sites endpoints
export const getSites = async () => {
  await initializeFirebase();
  return await getSitesFromDb();
};

export const createSite = async (siteData, allSites = null, sequenceNumber = null) => {
  try {
    console.log('Creating site with data:', siteData);
    await initializeFirebase();
    
    const result = await createSiteInDb(siteData);
    console.log('Create site result:', result);
    
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.error || 'Site creation failed');
    }
  } catch (error) {
    console.error('Error in createSite:', error);
    throw error;
  }
};

export const updateSite = async (siteId, siteData) => {
  await initializeFirebase();
  
  const result = await updateSiteInDb(siteId, siteData);
  
  if (result.success) {
    return result.data;
  } else {
    return null;
  }
};

export const deleteSite = async (siteId) => {
  await initializeFirebase();
  
  const result = await deleteSiteFromDb(siteId);
  return result.success;
};

export const archiveSite = async (siteId) => {
  await initializeFirebase();
  
  const result = await archiveSiteInDb(siteId);
  return result;
};

// Companies endpoints
export const getCompanies = async () => {
  await initializeFirebase();
  return await getCompaniesFromDb();
};

export const createCompany = async (companyData) => {
  await initializeFirebase();
  
  const result = await createCompanyInDb(companyData);
  
  if (result.success) {
    return result.data;
  } else {
    return null;
  }
};

export const updateCompany = async (companyId, companyData) => {
  await initializeFirebase();
  
  const result = await updateCompanyInDb(companyId, companyData);
  
  if (result.success) {
    return result.data;
  } else {
    console.error('updateCompany failed:', result.error);
    throw new Error(result.error || 'Company update failed');
  }
};

export const deleteCompany = async (companyId) => {
  await initializeFirebase();
  
  const result = await deleteCompanyFromDb(companyId);
  return result.success;
};

export const archiveCompany = async (companyId) => {
  await initializeFirebase();
  
  const result = await archiveCompanyInDb(companyId);
  return result;
};

// Agreements endpoints
export const getAgreements = async () => {
  await initializeFirebase();
  return await getAgreementsFromDb();
};

export const createAgreement = async (agreementData) => {
  await initializeFirebase();
  
  const result = await createAgreementInDb(agreementData);
  
  if (result.success) {
    return result.data;
  } else {
    return null;
  }
};

export const updateAgreement = async (agreementId, agreementData) => {
  await initializeFirebase();
  
  const result = await updateAgreementInDb(agreementId, agreementData);
  
  if (result.success) {
    return result.data;
  } else {
    return null;
  }
};

export const deleteAgreement = async (agreementId) => {
  await initializeFirebase();
  
  const result = await deleteAgreementFromDb(agreementId);
  return result.success;
};

export const archiveAgreement = async (agreementId) => {
  await initializeFirebase();
  
  const result = await archiveAgreementInDb(agreementId);
  return result;
};

// Cashier endpoints
export const getTransactions = async () => {
  await initializeFirebase();
  return await getTransactionsFromDb();
};

export const createTransaction = async (transactionData) => {
  await initializeFirebase();
  
  const result = await createTransactionInDb(transactionData);
  
  if (result.success) {
    return result.data;
  } else {
    return null;
  }
};

export const updateTransaction = async (transactionId, transactionData) => {
  await initializeFirebase();
  
  const result = await updateTransactionInDb(transactionId, transactionData);
  
  if (result.success) {
    return result.data;
  } else {
    return null;
  }
};

export const deleteTransaction = async (transactionId) => {
  await initializeFirebase();
  
  const result = await deleteTransactionFromDb(transactionId);
  return result.success;
};

// Partner shares endpoints
export const getPartners = async () => {
  await initializeFirebase();
  return await getPartnersFromDb();
};

export const createPartner = async (partnerData) => {
  await initializeFirebase();
  
  const result = await createPartnerInDb(partnerData);
  
  if (result.success) {
    return result.data;
  } else {
    return null;
  }
};

export const updatePartner = async (partnerId, partnerData) => {
  await initializeFirebase();
  
  const result = await updatePartnerInDb(partnerId, partnerData);
  
  if (result.success) {
    return result.data;
  } else {
    return null;
  }
};

export const deletePartner = async (partnerId) => {
  await initializeFirebase();
  
  const result = await deletePartnerFromDb(partnerId);
  return result.success;
};

// Archive endpoints
export const getArchivedSites = async () => {
  await initializeFirebase();
  const result = await getCollection('archivedSites', [], 'archivedAt', 'desc');
  return result.data || [];
};

export const getArchivedCompanies = async () => {
  await initializeFirebase();
  const result = await getCollection('archivedCompanies', [], 'archivedAt', 'desc');
  return result.data || [];
};

export const getArchivedAgreements = async () => {
  await initializeFirebase();
  const result = await getCollection('archivedAgreements', [], 'archivedAt', 'desc');
  return result.data || [];
};

// Add missing functions for updating and deleting archived items
export const deleteArchivedSite = async (siteId) => {
  await initializeFirebase();
  const result = await deleteDocument('archivedSites', siteId);
  return result.success;
};

export const deleteArchivedCompany = async (companyId) => {
  await initializeFirebase();
  const result = await deleteDocument('archivedCompanies', companyId);
  return result.success;
};

export const deleteArchivedAgreement = async (agreementId) => {
  await initializeFirebase();
  const result = await deleteDocument('archivedAgreements', agreementId);
  return result.success;
};

// Add missing restore functions
export const restoreSite = async (siteId) => {
  await initializeFirebase();
  
  try {
    const { getDocument, createDocument, deleteDocument } = await import('./firebaseDb.js');
    
    const siteResult = await getDocument('archivedSites', siteId);
    if (!siteResult.success) {
      return false;
    }
    
    const site = siteResult.data;
    delete site.status;
    delete site.archivedAt;
    
    const restoreResult = await createDocument('sites', site);
    
    if (restoreResult.success) {
      await deleteDocument('archivedSites', siteId);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error restoring site:', error);
    return false;
  }
};

export const restoreCompany = async (companyId) => {
  await initializeFirebase();
  
  try {
    const { getDocument, createDocument, deleteDocument } = await import('./firebaseDb.js');
    
    const companyResult = await getDocument('archivedCompanies', companyId);
    if (!companyResult.success) {
      return false;
    }
    
    const company = companyResult.data;
    delete company.status;
    delete company.archivedAt;
    
    const restoreResult = await createDocument('companies', company);
    
    if (restoreResult.success) {
      await deleteDocument('archivedCompanies', companyId);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error restoring company:', error);
    return false;
  }
};

export const restoreAgreement = async (agreementId) => {
  await initializeFirebase();
  
  try {
    const { getDocument, createDocument, deleteDocument } = await import('./firebaseDb.js');
    
    const agreementResult = await getDocument('archivedAgreements', agreementId);
    if (!agreementResult.success) {
      return false;
    }
    
    const agreement = agreementResult.data;
    delete agreement.status;
    delete agreement.archivedAt;
    
    const restoreResult = await createDocument('agreements', agreement);
    
    if (restoreResult.success) {
      await deleteDocument('archivedAgreements', agreementId);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error restoring agreement:', error);
    return false;
  }
};

// Add missing user management functions
export const getUsers = async () => {
  await initializeFirebase();
  return await getUsersFromDb();
};

export const createUser = async (userData) => {
  await initializeFirebase();
  
  // Kullanıcı oluşturma tamamen backend/Functions'a devredildi.
  // Frontend üzerinden sadece personel kullanıcıları oluşturulabilir.
  if (userData.role === 'personnel' && userData.username && userData.password) {
    const created = await createPersonnelUser(userData.username, userData.password, userData);
    return created;
  }

  console.error('createUser: Only personnel users can be created from frontend. Requested role:', userData.role);
  throw new Error('Sadece personel kullanıcıları bu ekrandan oluşturulabilir. Firma ve Site kullanıcıları otomatik olarak eklenir.');
};

export const updateUser = async (userId, userData) => {
  await initializeFirebase();
  
  const result = await updateUserInDb(userId, userData);
  
  if (result.success) {
    return result.data;
  } else {
    return null;
  }
};

export const deleteUser = async (userId) => {
  await initializeFirebase();
  
  const result = await deleteUserFromDb(userId);
  return result.success;
};

// Site-specific data endpoints
export const getSiteData = async (siteId) => {
  await initializeFirebase();
  
  try {
    // Check if siteId is valid
    if (!siteId) {
      console.error('getSiteData: siteId is null or undefined');
      return { site: null, agreements: [], transactions: [] };
    }
    
    const { getDocument, getCollection } = await import('./firebaseDb.js');
    
    const [siteDocResult, agreements, transactions] = await Promise.all([
      getDocument('sites', siteId),
      getAgreementsFromDb(),
      getTransactionsFromDb()
    ]);
    
    let siteRecord = null;

    if (siteDocResult.success && siteDocResult.data) {
      // Found by document ID
      siteRecord = siteDocResult.data;
    } else {
      // Fallback: some records may have custom ID stored in 'id' field instead of document ID
      const fallback = await getCollection('sites', [
        { field: 'id', operator: '==', value: siteId }
      ]);

      if (fallback.success && fallback.data && fallback.data.length > 0) {
        siteRecord = fallback.data[0];
      } else {
        console.error('getSiteData: Site not found for siteId (docId or field id):', siteId);
      return { site: null, agreements: [], transactions: [] };
      }
    }
    
    const siteAgreements = agreements.filter(agreement => 
      agreement.siteIds && agreement.siteIds.includes(siteId)
    );
    
    const siteTransactions = transactions.filter(transaction => 
      (transaction.type === 'expense' && transaction.source?.includes('Site Ödemesi') && transaction.source?.includes(siteRecord.name)) ||
      (transaction.type === 'income' && transaction.source?.includes('Anlaşma Ödemesi') && 
       siteAgreements.some(agreement => transaction.source?.includes(agreement.id)))
    );
    
    return {
      site: siteRecord,
      agreements: siteAgreements,
      transactions: siteTransactions
    };
  } catch (error) {
    console.error('Error fetching site data:', error);
    return { site: null, agreements: [], transactions: [] };
  }
};

export const getSiteAgreements = async (siteId) => {
  await initializeFirebase();
  
  const agreements = await getAgreementsFromDb();
  return agreements.filter(agreement => 
    agreement.siteIds && agreement.siteIds.includes(siteId)
  );
};

export const getSiteTransactions = async (siteId) => {
  await initializeFirebase();
  
  try {
    const { getDocument } = await import('./firebaseDb.js');
    
    const [transactions, site, agreements] = await Promise.all([
      getTransactionsFromDb(),
      getDocument('sites', siteId),
      getAgreementsFromDb()
    ]);
    
    if (!site.success) {
      return [];
    }
    
    const siteAgreements = agreements.filter(agreement => 
      agreement.siteIds && agreement.siteIds.includes(siteId)
    );
    
    return transactions.filter(transaction => 
      (transaction.type === 'expense' && transaction.source?.includes('Site Ödemesi') && transaction.source?.includes(site.data.name)) ||
      (transaction.type === 'income' && transaction.source?.includes('Anlaşma Ödemesi') && 
       siteAgreements.some(agreement => transaction.source?.includes(agreement.id)))
    );
  } catch (error) {
    console.error('Error fetching site transactions:', error);
    return [];
  }
};

// Logs endpoints
export const getLogs = async () => {
  await initializeFirebase();
  return await getLogsFromDb();
};

export const createLog = async (logData) => {
  await initializeFirebase();
  
  const result = await createLogInDb(logData);
  
  if (result.success) {
    return result.data;
  } else {
    return null;
  }
};

export const deleteLog = async (logId) => {
  await initializeFirebase();
  
  const result = await deleteLogFromDb(logId);
  return result.success;
};

// Panel Image Functions
export const getPanelImages = async (filters = {}) => {
  try {
    const { getPanelImages: firebaseGetPanelImages } = await import('./firebaseStorage.js');
    const result = await firebaseGetPanelImages(filters);
    console.log('getPanelImages called - returning images:', result.data);
    return result.data || [];
  } catch (error) {
    console.error('Error fetching panel images:', error);
    return [];
  }
};

export const uploadPanelImage = async (formData) => {
  try {
    const { uploadPanelImage: firebaseUploadPanelImage } = await import('./firebaseStorage.js');
    
    // Extract metadata from FormData (same shape as localApi)
    const agreementId = formData.get('agreementId');
    const siteId = formData.get('siteId');
    const blockId = formData.get('blockId');
    const panelId = formData.get('panelId');
    const companyId = formData.get('companyId');
    const file = formData.get('image');
    
    if (!file) {
      throw new Error('Image file is missing');
    }
    
    const metadata = { agreementId, siteId, blockId, panelId, companyId };
    
    const result = await firebaseUploadPanelImage(file, metadata);
    console.log('uploadPanelImage called - returning result:', result);
    return result;
  } catch (error) {
    console.error('Error uploading panel image:', error);
    throw error;
  }
};

export const cleanupExpiredImages = async () => {
  try {
    const { cleanupExpiredImages: firebaseCleanupExpiredImages } = await import('./firebaseStorage.js');
    const result = await firebaseCleanupExpiredImages();
    console.log('cleanupExpiredImages called - result:', result);
    return result;
  } catch (error) {
    console.error('Error cleaning up expired images:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Reset all panel images (delete every panel image)
export const resetPanelImages = async () => {
  try {
    const { resetAllPanelImages } = await import('./firebaseStorage.js');
    const result = await resetAllPanelImages();
    console.log('resetPanelImages called - result:', result);
    return result;
  } catch (error) {
    console.error('Error resetting panel images:', error);
  return {
      success: false,
      error: error.message
    };
  }
};

// Accounting Records endpoints
export const getAccountingRecords = async () => {
  await initializeFirebase();
  return await getAccountingRecordsFromDb();
};

export const createAccountingRecord = async (recordData) => {
  await initializeFirebase();
  return await createAccountingRecordInDb(recordData);
};

// Export Firebase-specific functions
export { onAuthStateChange, getCurrentUser, hasPermission, canAccessSite, canAccessCompany };