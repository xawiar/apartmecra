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
import logger from '../utils/logger';

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
  
  // Debts
  getDebts as getDebtsFromDb,
  createDebt as createDebtInDb,
  updateDebt as updateDebtFromDb,
  deleteDebt as deleteDebtFromDb,
  
  // Checks
  getChecks as getChecksFromDb,
  createCheck as createCheckInDb,
  updateCheck as updateCheckFromDb,
  deleteCheck as deleteCheckFromDb,
  
  // Site Update Requests
  getSiteUpdateRequests as getSiteUpdateRequestsFromDb,
  createSiteUpdateRequest as createSiteUpdateRequestInDb,
  updateSiteUpdateRequest as updateSiteUpdateRequestInDb,
  deleteSiteUpdateRequest as deleteSiteUpdateRequestFromDb,
  
  // Company Update Requests
  getCompanyUpdateRequests as getCompanyUpdateRequestsFromDb,
  createCompanyUpdateRequest as createCompanyUpdateRequestInDb,
  updateCompanyUpdateRequest as updateCompanyUpdateRequestInDb,
  deleteCompanyUpdateRequest as deleteCompanyUpdateRequestFromDb,
  
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
  createAccountingRecord as createAccountingRecordInDb,
  
  // Notifications
  getNotifications as getNotificationsFromDb,
  createNotification as createNotificationInDb,
  markNotificationAsRead as markNotificationAsReadInDb,
  markAllNotificationsAsRead as markAllNotificationsAsReadInDb,
  deleteNotification as deleteNotificationFromDb,
  sendNotificationToSite as sendNotificationToSiteInDb,
  sendAnnouncementToAllSites as sendAnnouncementToAllSitesInDb,
  
  // Announcements
  getAnnouncements as getAnnouncementsFromDb,
  createAnnouncement as createAnnouncementInDb,
  updateAnnouncement as updateAnnouncementInDb,
  deleteAnnouncement as deleteAnnouncementFromDb,
  
  // Meetings
  getMeetings as getMeetingsFromDb,
  createMeeting as createMeetingInDb,
  updateMeeting as updateMeetingInDb,
  deleteMeeting as deleteMeetingFromDb
} from './firebaseDb.js';

// Initialize Firebase services
let isInitialized = false;

const initializeFirebase = async () => {
  // Check if Firebase is enabled
  const { auth } = await import('../config/firebase.js');
  
  if (!auth) {
    logger.log('🚫 Firebase is disabled - using local mode');
    return false;
  }
  
  if (!isInitialized) {
    try {
      await initializeAdminUser();
      isInitialized = true;
    } catch (error) {
      logger.error('Firebase initialization error:', error);
      isInitialized = true; // Continue anyway
    }
  }
  
  return true;
};

// Auth endpoints
export const login = async (username, password) => {
  try {
    logger.log('API login called with:', username);
    
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
    const loginErrors = [];
    for (const attempt of loginAttempts) {
      // Only log first attempt in development
      if (loginAttempts.indexOf(attempt) === 0) {
        logger.log('Attempting login with email:', attempt.email, 'role:', attempt.role);
      }
      
      try {
        // Check if user is archived before attempting login
        let siteData = null;
        if (attempt.role === 'site_user') {
          const siteId = attempt.email.replace('@site.local', '');
          // Try to get site by document ID first
          let siteResult = await getDocument('sites', siteId);
          
          // If not found by document ID, try to find by custom 'id' field
          if (!siteResult.success) {
            const { collection, query, where, getDocs } = await import('firebase/firestore');
            const { db } = await import('../config/firebase.js');
            const sitesRef = collection(db, 'sites');
            const q = query(sitesRef, where('id', '==', siteId));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
              const docSnap = querySnapshot.docs[0];
              siteResult = {
                success: true,
                data: { id: docSnap.id, ...docSnap.data() }
              };
            }
          }
          
          if (siteResult.success) {
            if (siteResult.data.status === 'archived') {
            logger.warn('Site user is archived, login denied:', siteId);
            return { error: 'Bu site arşivlenmiş, giriş yapılamaz' };
            }
            siteData = siteResult.data;
          }
        }
        
        let companyData = null;
        if (attempt.role === 'company') {
          const companyId = attempt.email.replace('@company.local', '');
          // Try to get company by document ID first
          let companyResult = await getDocument('companies', companyId);
          
          // If not found by document ID, try to find by custom 'id' field
          if (!companyResult.success) {
            const { collection, query, where, getDocs } = await import('firebase/firestore');
            const { db } = await import('../config/firebase.js');
            const companiesRef = collection(db, 'companies');
            const q = query(companiesRef, where('id', '==', companyId));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
              const docSnap = querySnapshot.docs[0];
              companyResult = {
                success: true,
                data: { id: docSnap.id, ...docSnap.data() }
              };
            }
          }
          
          if (companyResult.success) {
            if (companyResult.data.status === 'archived') {
            logger.warn('Company user is archived, login denied:', companyId);
            return { error: 'Bu firma arşivlenmiş, giriş yapılamaz' };
            }
            companyData = companyResult.data;
          }
        }
        
        // Use silent mode for all attempts
        // Böylece auth/invalid-credential gibi beklenen hatalar konsolu kirletmez
        const result = await loginWithEmail(attempt.email, password, true);
        
        if (result.success) {
          logger.log('API login successful with role:', attempt.role);
          
          // Build user object with name for company and site users
          const userObj = {
              username: result.user.username,
              role: attempt.role,
              siteId: result.user.siteId || null,
              companyId: result.user.companyId || null,
              id: result.user.uid
          };
          
          // Add name field for company users
          if (attempt.role === 'company' && companyData) {
            userObj.name = companyData.name || companyData.id || result.user.username;
            userObj.id = companyData.id || result.user.uid; // Use company custom ID instead of Firebase UID
          }
          
          // Add name field for site users
          if (attempt.role === 'site_user' && siteData) {
            userObj.name = siteData.name || siteData.id || result.user.username;
            userObj.id = siteData.id || result.user.uid; // Use site custom ID instead of Firebase UID
          }
          
          return {
            token: result.token,
            user: userObj
          };
        }
      } catch (error) {
        // Log all errors for debugging (especially network/auth domain issues)
        logger.error('Login attempt error:', {
          email: attempt.email,
          role: attempt.role,
          code: error.code,
          message: error.message,
          error: error
        });
        
        // Store error for final reporting, but don't log each failed attempt
        // auth/invalid-credential is expected when trying different login types
        if (error.code !== 'auth/invalid-credential') {
          loginErrors.push({ email: attempt.email, error: error.message, code: error.code });
        }
        continue; // Try next attempt
      }
    }
    
    // If all attempts failed, log the errors (only unexpected ones)
    if (loginErrors.length > 0) {
      logger.error('Login attempts failed with unexpected errors:', loginErrors);
    } else if (loginAttempts.length > 0) {
      // All attempts failed with expected auth/invalid-credential
      logger.warn('All login attempts failed - invalid credentials');
    }
    
    // All attempts failed
    return { error: 'Geçersiz kimlik bilgileri' };
    
  } catch (error) {
    logger.error('API login error:', error);
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

// Debts endpoints
export const getDebts = async () => {
  await initializeFirebase();
  return await getDebtsFromDb();
};

export const createDebt = async (debtData) => {
  await initializeFirebase();
  const result = await createDebtInDb(debtData);
  return result.success ? result.data : null;
};

export const updateDebt = async (debtId, debtData) => {
  await initializeFirebase();
  const result = await updateDebtFromDb(debtId, debtData);
  return result.success ? result.data : null;
};

export const deleteDebt = async (debtId) => {
  await initializeFirebase();
  const result = await deleteDebtFromDb(debtId);
  return result.success;
};

// Checks endpoints
export const getChecks = async () => {
  await initializeFirebase();
  return await getChecksFromDb();
};

export const createCheck = async (checkData) => {
  await initializeFirebase();
  const result = await createCheckInDb(checkData);
  return result.success ? result.data : null;
};

export const updateCheck = async (checkId, checkData) => {
  await initializeFirebase();
  const result = await updateCheckFromDb(checkId, checkData);
  return result.success ? result.data : null;
};

export const deleteCheck = async (checkId) => {
  await initializeFirebase();
  const result = await deleteCheckFromDb(checkId);
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
  
  const { restoreSite: restoreSiteInDb } = await import('./firebaseDb.js');
  const result = await restoreSiteInDb(siteId);
  return result.success || false;
};

export const restoreCompany = async (companyId) => {
  await initializeFirebase();
  
  const { restoreCompany: restoreCompanyInDb } = await import('./firebaseDb.js');
  const result = await restoreCompanyInDb(companyId);
  return result.success || false;
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
  // Frontend üzerinden personel ve observer kullanıcıları oluşturulabilir.
  if ((userData.role === 'personnel' || userData.role === 'observer') && userData.username && userData.password) {
    const created = await createPersonnelUser(userData.username, userData.password, userData);
    return created;
  }

  console.error('createUser: Only personnel and observer users can be created from frontend. Requested role:', userData.role);
  throw new Error('Sadece personel ve gözlemci kullanıcıları bu ekrandan oluşturulabilir. Firma ve Site kullanıcıları otomatik olarak eklenir.');
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
    
    // Fetch all data in parallel
    const [siteDocResult, allSitesResult, agreements, transactions] = await Promise.all([
      getDocument('sites', siteId), // Try document ID first (fastest)
      getCollection('sites'), // Get all sites for comprehensive search
      getAgreementsFromDb(),
      getTransactionsFromDb()
    ]);
    
    let siteRecord = null;

    // Strategy 1: Check if found by document ID
    if (siteDocResult.success && siteDocResult.data) {
      siteRecord = siteDocResult.data;
    } else if (allSitesResult.success && allSitesResult.data) {
      // Strategy 2: Search through all sites with comprehensive matching
      // This handles all possible ID formats and variations
      const searchId = String(siteId).trim();
      
      siteRecord = allSitesResult.data.find(site => {
        // Check all possible ID fields with various formats
        const siteIdStr = site.id ? String(site.id).trim() : '';
        const siteSiteIdStr = site.siteId ? String(site.siteId).trim() : '';
        const siteDocIdStr = site._docId ? String(site._docId).trim() : '';
        
        // Exact matches (case-sensitive)
        if (siteIdStr === searchId || siteSiteIdStr === searchId || siteDocIdStr === searchId) {
          return true;
        }
        
        // Case-insensitive matches
        if (siteIdStr.toLowerCase() === searchId.toLowerCase() ||
            siteSiteIdStr.toLowerCase() === searchId.toLowerCase() ||
            siteDocIdStr.toLowerCase() === searchId.toLowerCase()) {
          return true;
        }
        
        // Numeric matches (if both are numeric)
        const searchIdNum = Number(searchId);
        if (!isNaN(searchIdNum)) {
          const siteIdNum = Number(site.id);
          const siteSiteIdNum = Number(site.siteId);
          if (!isNaN(siteIdNum) && siteIdNum === searchIdNum) return true;
          if (!isNaN(siteSiteIdNum) && siteSiteIdNum === searchIdNum) return true;
        }
        
        return false;
      });
      
      // Site found - no need to log in production
    }
    
    if (!siteRecord) {
      console.error('getSiteData: Site not found for siteId:', siteId);
      
      // Debug: List all available sites to help identify the issue
      if (allSitesResult.success && allSitesResult.data && allSitesResult.data.length > 0) {
        console.error('getSiteData: Available sites in database (total:', allSitesResult.data.length, '):');
        allSitesResult.data.forEach((s, index) => {
          console.error(`  [${index}] id: "${s.id}", siteId: "${s.siteId}", _docId: "${s._docId}", name: "${s.name}"`);
        });
        
        // Check if any site has yak34 in any field
        const yak34Sites = allSitesResult.data.filter(site => {
          const idStr = String(site.id || '');
          const siteIdStr = String(site.siteId || '');
          const docIdStr = String(site._docId || '');
          const searchStr = String(siteId);
          return idStr === searchStr || siteIdStr === searchStr || docIdStr === searchStr ||
                 idStr.toLowerCase() === searchStr.toLowerCase() ||
                 siteIdStr.toLowerCase() === searchStr.toLowerCase() ||
                 docIdStr.toLowerCase() === searchStr.toLowerCase();
        });
        
        if (yak34Sites.length > 0) {
          console.warn('getSiteData: Found exact or case-insensitive matches:', yak34Sites.map(s => ({
            id: s.id,
            siteId: s.siteId,
            _docId: s._docId,
            name: s.name
          })));
        } else {
          console.warn('getSiteData: No exact match found. Searching for sites containing "yak34"...');
          const partialMatches = allSitesResult.data.filter(site => {
            const idStr = String(site.id || '').toLowerCase();
            const siteIdStr = String(site.siteId || '').toLowerCase();
            const searchStr = String(siteId).toLowerCase();
            // Only match if one contains the other (not just any substring)
            return (idStr.includes(searchStr) && searchStr.length >= 3) || 
                   (siteIdStr.includes(searchStr) && searchStr.length >= 3) ||
                   (searchStr.includes(idStr) && idStr.length >= 3) ||
                   (searchStr.includes(siteIdStr) && siteIdStr.length >= 3);
          });
          
          if (partialMatches.length > 0 && partialMatches.length <= 5) {
            console.warn('getSiteData: Found partial matches (showing max 5):', partialMatches.map(s => ({
              id: s.id,
              siteId: s.siteId,
              _docId: s._docId,
              name: s.name
            })));
          }
        }
      } else {
        console.error('getSiteData: No sites found in database at all!');
      }
      
      return { site: null, agreements: [], transactions: [] };
    }
    
    // Get all possible IDs for this site to match against agreements
    // Include all variations: original, string, number, case variations
    const possibleSiteIds = new Set();
    
    // Add all variations
    [siteId, siteRecord.id, siteRecord.siteId, siteRecord._docId].forEach(id => {
      if (id != null && id !== undefined) {
        possibleSiteIds.add(id);
        possibleSiteIds.add(String(id));
        possibleSiteIds.add(String(id).toLowerCase());
        possibleSiteIds.add(String(id).toUpperCase());
        const numId = Number(id);
        if (!isNaN(numId)) {
          possibleSiteIds.add(numId);
        }
      }
    });
    
    const possibleSiteIdsArray = Array.from(possibleSiteIds);
    
    // Filter agreements that include any of the possible site IDs
    const siteAgreements = agreements.filter(agreement => {
      if (!agreement.siteIds || !Array.isArray(agreement.siteIds)) return false;
      
      // Check if any agreement siteId matches any of our possible IDs
      return agreement.siteIds.some(agreementSiteId => {
        const agreementSiteIdStr = String(agreementSiteId);
        return possibleSiteIdsArray.some(possibleId => {
          const possibleIdStr = String(possibleId);
          // Exact match
          if (agreementSiteIdStr === possibleIdStr) return true;
          // Case-insensitive match
          if (agreementSiteIdStr.toLowerCase() === possibleIdStr.toLowerCase()) return true;
          // Numeric match
          const agreementNum = Number(agreementSiteId);
          const possibleNum = Number(possibleId);
          if (!isNaN(agreementNum) && !isNaN(possibleNum) && agreementNum === possibleNum) return true;
          return false;
        });
      });
    });
    
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

// Site Update Requests endpoints
export const getSiteUpdateRequests = async () => {
  await initializeFirebase();
  return await getSiteUpdateRequestsFromDb();
};

export const createSiteUpdateRequest = async (requestData) => {
  await initializeFirebase();
  const result = await createSiteUpdateRequestInDb(requestData);
  return result.success ? result.data : null;
};

export const updateSiteUpdateRequest = async (requestId, requestData) => {
  await initializeFirebase();
  const result = await updateSiteUpdateRequestInDb(requestId, requestData);
  return result.success ? result.data : null;
};

export const deleteSiteUpdateRequest = async (requestId) => {
  await initializeFirebase();
  const result = await deleteSiteUpdateRequestFromDb(requestId);
  return result.success;
};

// Company Update Requests endpoints
export const getCompanyUpdateRequests = async () => {
  await initializeFirebase();
  return await getCompanyUpdateRequestsFromDb();
};

export const createCompanyUpdateRequest = async (requestData) => {
  await initializeFirebase();
  const result = await createCompanyUpdateRequestInDb(requestData);
  return result.success ? result.data : null;
};

export const updateCompanyUpdateRequest = async (requestId, requestData) => {
  await initializeFirebase();
  const result = await updateCompanyUpdateRequestInDb(requestId, requestData);
  return result.success ? result.data : null;
};

export const deleteCompanyUpdateRequest = async (requestId) => {
  await initializeFirebase();
  const result = await deleteCompanyUpdateRequestFromDb(requestId);
  return result.success;
};

// Notifications endpoints
export const getNotifications = async (userId = null, unreadOnly = false) => {
  await initializeFirebase();
  return await getNotificationsFromDb(userId, unreadOnly);
};

export const createNotification = async (notificationData) => {
  await initializeFirebase();
  const result = await createNotificationInDb(notificationData);
  return result.success ? result.data : null;
};

export const markNotificationAsRead = async (notificationId) => {
  await initializeFirebase();
  const result = await markNotificationAsReadInDb(notificationId);
  return result.success;
};

export const markAllNotificationsAsRead = async (userId) => {
  await initializeFirebase();
  const result = await markAllNotificationsAsReadInDb(userId);
  return result.success;
};

export const deleteNotification = async (notificationId) => {
  await initializeFirebase();
  const result = await deleteNotificationFromDb(notificationId);
  return result.success;
};

export const sendNotificationToSite = async (siteId, title, message, type = 'info', link = null, announcementId = null) => {
  await initializeFirebase();
  return await sendNotificationToSiteInDb(siteId, title, message, type, link, announcementId);
};

export const sendAnnouncementToAllSites = async (title, message, type = 'info', link = null, announcementId = null) => {
  await initializeFirebase();
  return await sendAnnouncementToAllSitesInDb(title, message, type, link, announcementId);
};

// Announcements endpoints
export const getAnnouncements = async () => {
  await initializeFirebase();
  return await getAnnouncementsFromDb();
};

export const createAnnouncement = async (announcementData) => {
  await initializeFirebase();
  const result = await createAnnouncementInDb(announcementData);
  return result.success ? result.data : null;
};

export const updateAnnouncement = async (announcementId, announcementData) => {
  await initializeFirebase();
  const result = await updateAnnouncementInDb(announcementId, announcementData);
  return result.success ? result.data : null;
};

export const deleteAnnouncement = async (announcementId) => {
  await initializeFirebase();
  const result = await deleteAnnouncementFromDb(announcementId);
  return result.success;
};

// Meetings
export const getMeetings = async (type = null) => {
  await initializeFirebase();
  return await getMeetingsFromDb(type);
};

export const createMeeting = async (meetingData) => {
  await initializeFirebase();
  const result = await createMeetingInDb(meetingData);
  return result.success ? result.data : null;
};

export const updateMeeting = async (meetingId, meetingData) => {
  await initializeFirebase();
  const result = await updateMeetingInDb(meetingId, meetingData);
  return result.success;
};

export const deleteMeeting = async (meetingId) => {
  await initializeFirebase();
  const result = await deleteMeetingFromDb(meetingId);
  return result.success;
};

// Export Firebase-specific functions
export { onAuthStateChange, getCurrentUser, hasPermission, canAccessSite, canAccessCompany };