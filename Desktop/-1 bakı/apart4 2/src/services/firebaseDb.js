// src/services/firebaseDb.js
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import app, { db } from '../config/firebase.js';
import { createUserWithEmail } from './firebaseAuth.js';
import { syncWithFirebase } from './firebaseSync.js';

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  SITES: 'sites',
  COMPANIES: 'companies',
  AGREEMENTS: 'agreements',
  TRANSACTIONS: 'transactions',
  PARTNERS: 'partners',
  ARCHIVED_SITES: 'archivedSites',
  ACCOUNTING_RECORDS: 'accountingRecords',
  ARCHIVED_COMPANIES: 'archivedCompanies',
  ARCHIVED_AGREEMENTS: 'archivedAgreements',
  LOGS: 'logs',
  PANEL_IMAGES: 'panelImages'
};

// Generic CRUD operations
export const createDocument = async (collectionName, data) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // If caller provided a custom id field, keep it.
    // Always expose the Firestore document ID separately as _docId.
    const docId = docRef.id;
    const customId = data && data.id ? data.id : docId;

    const result = {
      success: true,
      id: docId,
      data: {
        ...data,
        id: customId,
        _docId: docId
      }
    };
    
    // Firebase senkronizasyonu
    await syncWithFirebase('create', { id: customId, _docId: docId, ...data }, collectionName);
    
    return result;
  } catch (error) {
    console.error(`Error creating document in ${collectionName}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const getDocument = async (collectionName, docId) => {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        success: true,
        data: { id: docSnap.id, ...docSnap.data() }
      };
    } else {
      return {
        success: false,
        error: 'Document not found'
      };
    }
  } catch (error) {
    console.error(`Error getting document from ${collectionName}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const updateDocument = async (collectionName, docId, data) => {
  try {
    const docRef = doc(db, collectionName, docId);
    
    // First check if document exists
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      // Document not found - don't create new one, return error
      console.error(`Document ${docId} not found in ${collectionName}, cannot update`);
      return {
        success: false,
        error: `Document ${docId} not found in ${collectionName}`
      };
    }
    
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    
    const result = {
      success: true,
      data: { id: docId, ...data }
    };
    
    // Firebase senkronizasyonu
    await syncWithFirebase('update', { id: docId, ...data }, collectionName);
    
    return result;
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const deleteDocument = async (collectionName, docId) => {
  try {
    // Önce silinecek dokümanı al
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    const docData = docSnap.exists() ? docSnap.data() : null;
    
    await deleteDoc(docRef);
    
    const result = {
      success: true
    };
    
    // Firebase senkronizasyonu
    if (docData) {
      await syncWithFirebase('delete', { id: docId, ...docData }, collectionName);
    }
    
    return result;
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const getCollection = async (collectionName, filters = [], orderByField = null, orderDirection = 'asc', limitCount = null) => {
  try {
    let q = collection(db, collectionName);
    
    // Apply filters
    filters.forEach(filter => {
      q = query(q, where(filter.field, filter.operator, filter.value));
    });
    
    // Apply ordering
    if (orderByField) {
      q = query(q, orderBy(orderByField, orderDirection));
    }
    
    // Apply limit
    if (limitCount) {
      q = query(q, limit(limitCount));
    }
    
    const querySnapshot = await getDocs(q);
    const documents = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Preserve custom id if exists, otherwise use document ID
      // Always store document ID as _docId
      documents.push({
        _docId: doc.id, // Firestore document ID
        ...data,
        id: data.id || doc.id // Custom ID if exists, otherwise document ID
      });
    });
    
    return {
      success: true,
      data: documents
    };
  } catch (error) {
    console.error(`Error getting collection ${collectionName}:`, error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

// Sites operations
export const getSites = async () => {
  // Tüm siteleri getir ve status alanına göre filtreyi kod tarafında yap
  // Böylece status alanı olmayan eski kayıtlar da görünebilir
  const result = await getCollection(COLLECTIONS.SITES, [], 'name', 'asc');
  const allSites = result.data || [];

  // status !== 'archived' olanları (ve status alanı olmayanları) göster
  return allSites.filter(site => site.status !== 'archived');
};

export const getArchivedSites = async () => {
  // Sadece arşivlenen siteleri getir
  const result = await getCollection(COLLECTIONS.SITES, [
    { field: 'status', operator: '==', value: 'archived' }
  ], 'archivedAt', 'desc');
  return result.data || [];
};

export const createSite = async (siteData) => {
  // Generate custom ID
  const sequenceNumber = await getNextSequenceNumber(COLLECTIONS.SITES);
  const customId = generateSiteId(siteData.name, sequenceNumber, siteData.siteType);
  
  const sitePayload = {
    ...siteData,
    id: customId,
    sequenceNumber: sequenceNumber
  };
  
  const result = await createDocument(COLLECTIONS.SITES, sitePayload);
  
  if (result.success) {
    // Create site user automatically
    await createSiteUser(customId, siteData);
  }
  
  return result;
};

export const updateSite = async (siteId, siteData) => {
  try {
    // First try to get by document ID
    let docId = siteId;
    const siteResult = await getDocument(COLLECTIONS.SITES, siteId);
    
    if (!siteResult.success || !siteResult.data) {
      // Fallback: search by custom 'id' field
      const queryRef = collection(db, COLLECTIONS.SITES);
      const q = query(queryRef, where('id', '==', siteId));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        docId = docSnap.id; // This is the actual Firestore document ID
      } else {
        return { success: false, error: 'Site not found' };
      }
    }
    
    // Calculate elevators and panels
    const blocks = parseInt(siteData.blocks) || 0;
    const elevatorsPerBlock = parseInt(siteData.elevatorsPerBlock) || 0;
    const elevators = blocks * elevatorsPerBlock;
    const panels = elevators * 2;
    
    const updatedSiteData = {
      ...siteData,
      elevators: elevators,
      panels: panels
    };
    
    return await updateDocument(COLLECTIONS.SITES, docId, updatedSiteData);
  } catch (error) {
    console.error('Error updating site:', error);
    return { success: false, error: error.message };
  }
};

export const deleteSite = async (siteId) => {
  try {
    // Get site data first to find associated user and real document id
    let siteRecord = null;
    let docId = siteId;

    // First try to get by document ID
    const siteResult = await getDocument(COLLECTIONS.SITES, siteId);
    if (siteResult.success && siteResult.data) {
      siteRecord = siteResult.data;
      // siteResult.data.id is the document ID from getDocument
      docId = siteId; // siteId is the document ID in this case
    } else {
      // Fallback: search by custom 'id' field
      const queryRef = collection(db, COLLECTIONS.SITES);
      const q = query(queryRef, where('id', '==', siteId));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        docId = docSnap.id; // This is the actual Firestore document ID
        const data = docSnap.data();
        // Preserve custom id and document ID separately
        siteRecord = {
          _docId: docSnap.id,
          ...data,
          id: data.id || docSnap.id // Custom ID if exists, otherwise document ID
        };
      } else {
        return { success: false, error: 'Site not found' };
      }
    }

    // Get logical site ID for email (could be siteId field or the custom id field)
    const logicalSiteId = siteRecord.siteId || siteRecord.id || siteId;
    const siteEmail = `${logicalSiteId}@site.local`;

    // Delete from Firestore using the actual document ID
    const deleteResult = await deleteDocument(COLLECTIONS.SITES, docId);
    
    if (deleteResult.success) {
      console.log(`✅ Site ${logicalSiteId} (doc: ${docId}) deleted from Firestore`);
      
      // Delete associated Auth user using fetch (onRequest endpoint)
      try {
        const functionUrl = `https://us-central1-apartmecra-elz.cloudfunctions.net/deleteUserByEmail`;
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: siteEmail })
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            console.log(`✅ Auth user deleted: ${siteEmail}`);
          } else {
            console.error(`⚠️ Failed to delete Auth user ${siteEmail}:`, result.error);
          }
        } else {
          console.error(`⚠️ Failed to delete Auth user ${siteEmail}: HTTP ${response.status}`);
        }
      } catch (err) {
        console.error(`⚠️ Failed to delete Auth user ${siteEmail}:`, err.message || err);
      }

      return { success: true, message: `Site and associated user ${siteEmail} deleted.` };
    }
    
    return deleteResult;
  } catch (error) {
    console.error('Error deleting site:', error);
    return { success: false, error: error.message };
  }
};

export const archiveSite = async (siteId) => {
  try {
    // Önce dokümanı doğrudan ID ile almaya çalış
    let docId = siteId;
    let siteResult = await getDocument(COLLECTIONS.SITES, siteId);

    if (!siteResult.success || !siteResult.data) {
      // Eğer bulunamazsa, custom 'id' alanına göre ara
      const queryRef = collection(db, COLLECTIONS.SITES);
      const q = query(queryRef, where('id', '==', siteId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.error('archiveSite: Site not found for id:', siteId);
        return { success: false, error: 'Site not found' };
      }

      const docSnap = querySnapshot.docs[0];
      docId = docSnap.id;
      siteResult = { success: true, data: { id: docSnap.id, ...docSnap.data() } };
    }
    
    // Artık doğru Firestore doküman ID'si elimizde: docId
    const updateResult = await updateDocument(COLLECTIONS.SITES, docId, {
      status: 'archived',
      archivedAt: serverTimestamp()
    });
    
    if (updateResult.success) {
      console.log(`✅ Site ${siteId} (doc: ${docId}) archived successfully`);
      console.log(`⚠️ Site user ${siteId}@site.local login is now disabled`);
      return { success: true, message: `Site archived. User login disabled.` };
    }
    
    console.error('archiveSite: Failed to update document for site:', siteId, 'docId:', docId);
    return { success: false, error: 'Failed to archive site' };
  } catch (error) {
    console.error('Error archiving site:', error);
    return { success: false, error: error.message };
  }
};

// Companies operations
export const getCompanies = async () => {
  // Sadece aktif firmaları getir (status !== 'archived')
  const result = await getCollection(COLLECTIONS.COMPANIES, [
    { field: 'status', operator: '!=', value: 'archived' }
  ], 'name', 'asc');
  return result.data || [];
};

export const getArchivedCompanies = async () => {
  // Sadece arşivlenen firmaları getir
  const result = await getCollection(COLLECTIONS.COMPANIES, [
    { field: 'status', operator: '==', value: 'archived' }
  ], 'archivedAt', 'desc');
  return result.data || [];
};

export const createCompany = async (companyData) => {
  const sequenceNumber = await getNextSequenceNumber(COLLECTIONS.COMPANIES);
  const customId = generateCompanyId(companyData.name, sequenceNumber);
  
  const companyPayload = {
    ...companyData,
    id: customId,
    sequenceNumber: sequenceNumber
  };
  
  const result = await createDocument(COLLECTIONS.COMPANIES, companyPayload);
  
  // Note: Company user will be automatically created by Cloud Function (createCompanyUser)
  // No need to create manually here to avoid duplicates
  
  return result;
};

export const updateCompany = async (companyId, companyData) => {
  try {
    // First try to get by document ID
    let docId = companyId;
    const companyResult = await getDocument(COLLECTIONS.COMPANIES, companyId);
    
    if (!companyResult.success || !companyResult.data) {
      // Fallback: search by custom 'id' field
      const queryRef = collection(db, COLLECTIONS.COMPANIES);
      const q = query(queryRef, where('id', '==', companyId));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        docId = docSnap.id; // This is the actual Firestore document ID
      } else {
        return { success: false, error: 'Company not found' };
      }
    }
    
    return await updateDocument(COLLECTIONS.COMPANIES, docId, companyData);
  } catch (error) {
    console.error('Error updating company:', error);
    return { success: false, error: error.message };
  }
};

export const deleteCompany = async (companyId) => {
  try {
    // Get company data first to find associated user and real document id
    let companyRecord = null;
    let docId = companyId;

    // First try to get by document ID
    const companyResult = await getDocument(COLLECTIONS.COMPANIES, companyId);
    if (companyResult.success && companyResult.data) {
      companyRecord = companyResult.data;
      docId = companyId; // companyId is the document ID in this case
    } else {
      // Fallback: search by custom 'id' field
      const queryRef = collection(db, COLLECTIONS.COMPANIES);
      const q = query(queryRef, where('id', '==', companyId));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        docId = docSnap.id; // This is the actual Firestore document ID
        companyRecord = { id: docSnap.id, ...docSnap.data() };
      } else {
        return { success: false, error: 'Company not found' };
      }
    }

    // Get logical company ID for email
    const logicalCompanyId = companyRecord.companyId || companyRecord.id || companyId;
    const companyEmail = `${logicalCompanyId}@company.local`;
    
    // Delete from Firestore using the actual document ID
    const deleteResult = await deleteDocument(COLLECTIONS.COMPANIES, docId);
    
    if (deleteResult.success) {
      console.log(`✅ Company ${logicalCompanyId} (doc: ${docId}) deleted from Firestore`);
      
      // Delete associated Auth user using fetch (onRequest endpoint)
      try {
        const functionUrl = `https://us-central1-apartmecra-elz.cloudfunctions.net/deleteUserByEmail`;
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: companyEmail })
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            console.log(`✅ Auth user deleted: ${companyEmail}`);
          } else {
            console.error(`⚠️ Failed to delete Auth user ${companyEmail}:`, result.error);
          }
        } else {
          console.error(`⚠️ Failed to delete Auth user ${companyEmail}: HTTP ${response.status}`);
        }
      } catch (err) {
        console.error(`⚠️ Failed to delete Auth user ${companyEmail}:`, err.message || err);
      }

      return { success: true, message: `Company and associated user ${companyEmail} deleted.` };
    }
    
    return deleteResult;
  } catch (error) {
    console.error('Error deleting company:', error);
    return { success: false, error: error.message };
  }
};

export const archiveCompany = async (companyId) => {
  try {
    const companyResult = await getDocument(COLLECTIONS.COMPANIES, companyId);
    if (!companyResult.success) {
      return { success: false, error: 'Company not found' };
    }
    
    const company = companyResult.data;
    
    // Update company status to archived (don't delete, just change status)
    const updateResult = await updateDocument(COLLECTIONS.COMPANIES, companyId, {
      status: 'archived',
      archivedAt: serverTimestamp()
    });
    
    if (updateResult.success) {
      console.log(`✅ Company ${companyId} archived successfully`);
      console.log(`⚠️ Company user ${companyId}@company.local login is now disabled`);
      return { success: true, message: `Company archived. User login disabled.` };
    }
    
    return { success: false, error: 'Failed to archive company' };
  } catch (error) {
    console.error('Error archiving company:', error);
    return { success: false, error: error.message };
  }
};

// Agreements operations
export const getAgreements = async () => {
  const result = await getCollection(COLLECTIONS.AGREEMENTS, [], 'startDate', 'desc');
  return result.data || [];
};

export const createAgreement = async (agreementData) => {
  const sequenceNumber = await getNextSequenceNumber(COLLECTIONS.AGREEMENTS);
  const customId = generateAgreementId(agreementData.startDate, sequenceNumber);
  
  const agreementPayload = {
    ...agreementData,
    id: customId,
    sequenceNumber: sequenceNumber
  };
  
  return await createDocument(COLLECTIONS.AGREEMENTS, agreementPayload);
};

export const updateAgreement = async (agreementId, agreementData) => {
  try {
    // First try to get by document ID
    let docId = agreementId;
    const agreementResult = await getDocument(COLLECTIONS.AGREEMENTS, agreementId);
    
    if (!agreementResult.success || !agreementResult.data) {
      // Fallback: search by custom 'id' field
      const queryRef = collection(db, COLLECTIONS.AGREEMENTS);
      const q = query(queryRef, where('id', '==', agreementId));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        docId = docSnap.id; // This is the actual Firestore document ID
      } else {
        return { success: false, error: 'Agreement not found' };
      }
    }
    
    return await updateDocument(COLLECTIONS.AGREEMENTS, docId, agreementData);
  } catch (error) {
    console.error('Error updating agreement:', error);
    return { success: false, error: error.message };
  }
};

export const deleteAgreement = async (agreementId) => {
  try {
    // Get agreement data first and determine real document id
    let agreementRecord = null;
    let docId = agreementId;

    // First try to get by document ID
    const agreementResult = await getDocument(COLLECTIONS.AGREEMENTS, agreementId);
    if (agreementResult.success && agreementResult.data) {
      agreementRecord = agreementResult.data;
      docId = agreementId; // agreementId is the document ID in this case
    } else {
      // Fallback: search by custom 'id' field
      const queryRef = collection(db, COLLECTIONS.AGREEMENTS);
      const q = query(queryRef, where('id', '==', agreementId));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        docId = docSnap.id; // This is the actual Firestore document ID
        agreementRecord = { id: docSnap.id, ...docSnap.data() };
      } else {
        return { success: false, error: 'Agreement not found' };
      }
    }
    
    // Delete from Firestore using the actual document ID
    const deleteResult = await deleteDocument(COLLECTIONS.AGREEMENTS, docId);
    
    if (deleteResult.success) {
      console.log(`✅ Agreement ${agreementId} (doc: ${docId}) deleted from Firestore`);
      return { success: true, message: `Agreement deleted successfully.` };
    }
    
    return deleteResult;
  } catch (error) {
    console.error('Error deleting agreement:', error);
    return { success: false, error: error.message };
  }
};

export const archiveAgreement = async (agreementId) => {
  try {
    const agreementResult = await getDocument(COLLECTIONS.AGREEMENTS, agreementId);
    if (!agreementResult.success) {
      return { success: false, error: 'Agreement not found' };
    }
    
    const agreement = agreementResult.data;
    const archivedAgreement = {
      ...agreement,
      status: 'archived',
      archivedAt: serverTimestamp()
    };
    
    const archiveResult = await createDocument(COLLECTIONS.ARCHIVED_AGREEMENTS, archivedAgreement);
    
    if (archiveResult.success) {
      await deleteAgreement(agreementId);
      return { success: true };
    }
    
    return { success: false, error: 'Failed to archive agreement' };
  } catch (error) {
    console.error('Error archiving agreement:', error);
    return { success: false, error: error.message };
  }
};

// Transactions operations
export const getTransactions = async () => {
  const result = await getCollection(COLLECTIONS.TRANSACTIONS, [], 'date', 'desc');
  return result.data || [];
};

export const createTransaction = async (transactionData) => {
  return await createDocument(COLLECTIONS.TRANSACTIONS, transactionData);
};

export const updateTransaction = async (transactionId, transactionData) => {
  return await updateDocument(COLLECTIONS.TRANSACTIONS, transactionId, transactionData);
};

export const deleteTransaction = async (transactionId) => {
  return await deleteDocument(COLLECTIONS.TRANSACTIONS, transactionId);
};

// Partners operations
export const getPartners = async () => {
  const result = await getCollection(COLLECTIONS.PARTNERS, [], 'name', 'asc');
  return result.data || [];
};

export const createPartner = async (partnerData) => {
  return await createDocument(COLLECTIONS.PARTNERS, partnerData);
};

export const updatePartner = async (partnerId, partnerData) => {
  return await updateDocument(COLLECTIONS.PARTNERS, partnerId, partnerData);
};

export const deletePartner = async (partnerId) => {
  return await deleteDocument(COLLECTIONS.PARTNERS, partnerId);
};

// Accounting Records operations
export const getAccountingRecords = async () => {
  const result = await getCollection(COLLECTIONS.ACCOUNTING_RECORDS, [], 'date', 'desc');
  return result.data || [];
};

export const createAccountingRecord = async (recordData) => {
  const result = await createDocument(COLLECTIONS.ACCOUNTING_RECORDS, recordData);
  if (result.success) {
    return result.data;
  }
  return null;
};

// Users operations
export const getUsers = async () => {
  const result = await getCollection(COLLECTIONS.USERS, [], 'username', 'asc');
  return result.data || [];
};

export const createUser = async (userData) => {
  return await createDocument(COLLECTIONS.USERS, userData);
};

export const updateUser = async (userId, userData) => {
  return await updateDocument(COLLECTIONS.USERS, userId, userData);
};

export const deleteUser = async (userId) => {
  return await deleteDocument(COLLECTIONS.USERS, userId);
};

// Logs operations
export const getLogs = async () => {
  const result = await getCollection(COLLECTIONS.LOGS, [], 'timestamp', 'desc', 100);
  return result.data || [];
};

export const createLog = async (logData) => {
  return await createDocument(COLLECTIONS.LOGS, {
    ...logData,
    timestamp: serverTimestamp()
  });
};

export const deleteLog = async (logId) => {
  return await deleteDocument(COLLECTIONS.LOGS, logId);
};

// Dashboard operations
export const getDashboardSummary = async () => {
  try {
    const [sites, companies, agreements, transactions] = await Promise.all([
      getSites(),
      getCompanies(),
      getAgreements(),
      getTransactions()
    ]);
    
    const activeAgreements = agreements.filter(ag => ag.status === 'active');
    const activeCompanies = companies.filter(c => c.status === 'active');
    
    const totalRevenue = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, transaction) => sum + (transaction.amount || 0), 0);
      
    const totalExpenses = Math.abs(transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, transaction) => sum + (transaction.amount || 0), 0));
    
    const netCash = totalRevenue - totalExpenses;
    
    return {
      activeSites: sites.length,
      activeCompanies: activeCompanies.length,
      activeAgreements: activeAgreements.length,
      totalRevenue,
      totalExpenses,
      netCash
    };
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    return {
      activeSites: 0,
      activeCompanies: 0,
      activeAgreements: 0,
      totalRevenue: 0,
      totalExpenses: 0,
      netCash: 0
    };
  }
};

// Helper functions
const getNextSequenceNumber = async (collectionName) => {
  try {
    const result = await getCollection(collectionName, [], 'sequenceNumber', 'desc', 1);
    if (result.success && result.data.length > 0) {
      return (result.data[0].sequenceNumber || 0) + 1;
    }
    return 1;
  } catch (error) {
    console.error('Error getting next sequence number:', error);
    return 1;
  }
};

const generateSiteId = (name, sequenceNumber, siteType = 'site') => {
  const prefix = name.substring(0, 3).toUpperCase()
    .replace(/İ/g, 'I')
    .replace(/Ğ/g, 'G')
    .replace(/Ü/g, 'U')
    .replace(/Ş/g, 'S')
    .replace(/Ö/g, 'O')
    .replace(/Ç/g, 'C');
  
  // İş merkezi için farklı prefix kullan
  if (siteType === 'business_center') {
    return `IM${prefix}${sequenceNumber}`;
  }
  
  return `${prefix}${sequenceNumber}`;
};

const generateCompanyId = (name, sequenceNumber) => {
  const prefix = name.substring(0, 3).toUpperCase().replace(/İ/g, 'I').replace(/Ğ/g, 'G').replace(/Ü/g, 'U').replace(/Ş/g, 'S').replace(/Ö/g, 'O').replace(/Ç/g, 'C');
  return `${prefix}${sequenceNumber}`;
};

const generateAgreementId = (date, sequenceNumber) => {
  const dateObj = new Date(date);
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  return `${sequenceNumber}${day}${month}${String(year).slice(-2)}`;
};

const createSiteUser = async (siteId, siteData) => {
  try {
    const email = `${siteId}@site.local`;
    const password = siteData.phone || siteId;
    
    // Check if user already exists (to prevent duplicate creation)
    // Cloud Function might have already created the user
    try {
      const { getAuth } = await import('firebase/auth');
      const { auth } = await import('../config/firebase.js');
      
      // Try to sign in to check if user exists
      // If user doesn't exist, this will throw an error
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      try {
        await signInWithEmailAndPassword(auth, email, password);
        // User exists, skip creation
        console.log('Site user already exists, skipping creation:', email);
        return;
      } catch (checkError) {
        // If error is not "user-not-found", it might be wrong password
        // In that case, user exists but we can't verify, so skip creation to be safe
        if (checkError.code !== 'auth/user-not-found' && checkError.code !== 'auth/wrong-password') {
          console.log('Site user might already exist, skipping creation:', email);
          return;
        }
        // User doesn't exist, continue with creation
      }
    } catch (checkError) {
      // If we can't check, continue with creation (will fail gracefully if duplicate)
      console.log('Could not check existing user, attempting creation:', checkError.message);
    }
    
    const userData = {
      username: siteId,
      password: password,
      role: 'site_user',
      siteId: siteId,
      status: 'active',
      email: email
    };
    
    // Create user in Firestore
    await createUser(userData);
    
    // Create user in Firebase Authentication
    const authResult = await createUserWithEmail(email, password, userData);
    
    if (authResult.success) {
      console.log('Site user created in Firebase Auth:', authResult.user.uid);
    } else {
      // If user already exists, that's okay (Cloud Function might have created it)
      if (authResult.error && authResult.error.includes('already exists')) {
        console.log('Site user already exists (likely created by Cloud Function):', email);
      } else {
        console.error('Failed to create site user in Firebase Auth:', authResult.error);
      }
    }
    
  } catch (error) {
    // If user already exists, that's okay (Cloud Function might have created it)
    if (error.message && error.message.includes('already exists')) {
      console.log('Site user already exists (likely created by Cloud Function):', `${siteId}@site.local`);
    } else {
      console.error('Error creating site user:', error);
    }
  }
};

const createCompanyUser = async (companyId, companyData) => {
  try {
    const email = `${companyId}@company.local`;
    const password = companyData.phone || companyId;
    
    // Check if user already exists (to prevent duplicate creation)
    // Cloud Function might have already created the user
    try {
      const { getAuth } = await import('firebase/auth');
      const { auth } = await import('../config/firebase.js');
      
      // Try to sign in to check if user exists
      // If user doesn't exist, this will throw an error
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      try {
        await signInWithEmailAndPassword(auth, email, password);
        // User exists, skip creation
        console.log('Company user already exists, skipping creation:', email);
        return;
      } catch (checkError) {
        // If error is not "user-not-found", it might be wrong password
        // In that case, user exists but we can't verify, so skip creation to be safe
        if (checkError.code !== 'auth/user-not-found' && checkError.code !== 'auth/wrong-password') {
          console.log('Company user might already exist, skipping creation:', email);
          return;
        }
        // User doesn't exist, continue with creation
      }
    } catch (checkError) {
      // If we can't check, continue with creation (will fail gracefully if duplicate)
      console.log('Could not check existing user, attempting creation:', checkError.message);
    }
    
    const userData = {
      username: companyId,
      password: password,
      role: 'company_user',
      companyId: companyId,
      status: 'active',
      email: email
    };
    
    // Create user in Firestore
    await createUser(userData);
    
    // Create user in Firebase Authentication
    const authResult = await createUserWithEmail(email, password, userData);
    
    if (authResult.success) {
      console.log('Company user created in Firebase Auth:', authResult.user.uid);
    } else {
      // If user already exists, that's okay (Cloud Function might have created it)
      if (authResult.error && authResult.error.includes('already exists')) {
        console.log('Company user already exists (likely created by Cloud Function):', email);
      } else {
        console.error('Failed to create company user in Firebase Auth:', authResult.error);
      }
    }
    
  } catch (error) {
    // If user already exists, that's okay (Cloud Function might have created it)
    if (error.message && error.message.includes('already exists')) {
      console.log('Company user already exists (likely created by Cloud Function):', `${companyId}@company.local`);
    } else {
      console.error('Error creating company user:', error);
    }
  }
};

// Create personnel user (manual creation from Settings)
export const createPersonnelUser = async (username, password, extraData = {}) => {
  try {
    const email = `${username}@personnel.local`;
    
    const userData = {
      username,
      password,
      role: 'personnel',
      status: 'active',
      email,
      ...extraData
    };
    
    // Create user in Firestore
    await createUser(userData);
    
    // Create user in Firebase Authentication
    const authResult = await createUserWithEmail(email, password, userData);
    
    if (authResult.success) {
      console.log('Personnel user created in Firebase Auth:', authResult.user.uid);
    } else {
      console.error('Failed to create personnel user in Firebase Auth:', authResult.error);
    }
    
    return userData;
  } catch (error) {
    console.error('Error creating personnel user:', error);
    throw error;
  }
};

// Batch operations
export const batchCreate = async (collectionName, documents) => {
  try {
    const batch = writeBatch(db);
    
    documents.forEach(doc => {
      const docRef = doc(collection(db, collectionName));
      batch.set(docRef, {
        ...doc,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });
    
    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error('Error in batch create:', error);
    return { success: false, error: error.message };
  }
};

export const batchUpdate = async (collectionName, updates) => {
  try {
    const batch = writeBatch(db);
    
    updates.forEach(update => {
      const docRef = doc(db, collectionName, update.id);
      batch.update(docRef, {
        ...update.data,
        updatedAt: serverTimestamp()
      });
    });
    
    await batch.commit();
    
    const result = { success: true };
    
    // Firebase senkronizasyonu
    await syncWithFirebase('batch_update', updates, collectionName);
    
    return result;
  } catch (error) {
    console.error('Error in batch update:', error);
    return { success: false, error: error.message };
  }
};

export const batchDelete = async (collectionName, docIds) => {
  try {
    const batch = writeBatch(db);
    
    docIds.forEach(id => {
      const docRef = doc(db, collectionName, id);
      batch.delete(docRef);
    });
    
    await batch.commit();
    
    const result = { success: true };
    
    // Firebase senkronizasyonu
    await syncWithFirebase('batch_delete', docIds, collectionName);
    
    return result;
  } catch (error) {
    console.error('Error in batch delete:', error);
    return { success: false, error: error.message };
  }
};
