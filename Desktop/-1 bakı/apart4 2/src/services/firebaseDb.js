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
  DEBTS: 'debts',
  PARTNERS: 'partners',
  ARCHIVED_SITES: 'archivedSites',
  ACCOUNTING_RECORDS: 'accountingRecords',
  ARCHIVED_COMPANIES: 'archivedCompanies',
  ARCHIVED_AGREEMENTS: 'archivedAgreements',
  LOGS: 'logs',
  PANEL_IMAGES: 'panelImages',
  CHECKS: 'checks'
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
    
    // Get updated document to return complete data
    const updatedDocSnap = await getDoc(docRef);
    const updatedData = updatedDocSnap.exists() ? updatedDocSnap.data() : data;
    
    const result = {
      success: true,
      data: { id: docId, _docId: docId, ...updatedData }
    };
    
    // Firebase senkronizasyonu
    await syncWithFirebase('update', { id: docId, ...updatedData }, collectionName);
    
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
  // archivedSites koleksiyonundan tüm arşivlenen siteleri getir
  const result = await getCollection(COLLECTIONS.ARCHIVED_SITES, [], 'archivedAt', 'desc');
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
    let oldSiteData = null;
    const siteResult = await getDocument(COLLECTIONS.SITES, siteId);
    
    if (!siteResult.success || !siteResult.data) {
      // Fallback: search by custom 'id' field
      const queryRef = collection(db, COLLECTIONS.SITES);
      const q = query(queryRef, where('id', '==', siteId));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        docId = docSnap.id; // This is the actual Firestore document ID
        oldSiteData = docSnap.data();
      } else {
        return { success: false, error: 'Site not found' };
      }
    } else {
      oldSiteData = siteResult.data;
    }
    
    // Check if phone number changed
    const oldPhone = oldSiteData?.phone || '';
    const newPhone = siteData.phone || '';
    const phoneChanged = oldPhone !== newPhone && newPhone;
    
    // Calculate elevators and panels only if blocks/elevatorsPerBlock are provided
    // Otherwise, keep existing values (for partial updates like location, manager, etc.)
    let updatedSiteData = { ...siteData };
    
    if (siteData.blocks !== undefined || siteData.elevatorsPerBlock !== undefined) {
      const blocks = parseInt(siteData.blocks) || parseInt(oldSiteData?.blocks) || 0;
      const elevatorsPerBlock = parseInt(siteData.elevatorsPerBlock) || parseInt(oldSiteData?.elevatorsPerBlock) || 0;
  const elevators = blocks * elevatorsPerBlock;
  const panels = elevators * 2;
  
      updatedSiteData = {
        ...updatedSiteData,
    elevators: elevators,
    panels: panels
  };
    } else {
      // Keep existing elevators and panels if not updating blocks/elevatorsPerBlock
      updatedSiteData = {
        ...updatedSiteData,
        elevators: oldSiteData?.elevators,
        panels: oldSiteData?.panels
      };
    }
    
    const updateResult = await updateDocument(COLLECTIONS.SITES, docId, updatedSiteData);
    
    // If phone changed, update user password in Auth and users collection
    if (phoneChanged && updateResult.success) {
      try {
        // Use custom ID from oldSiteData, fallback to siteId parameter
        const logicalSiteId = oldSiteData?.id || siteId;
        const email = `${logicalSiteId}@site.local`;
        
        console.log(`Updating site user password: ${email} (siteId: ${logicalSiteId}, oldPhone: ${oldPhone}, newPhone: ${newPhone})`);
        
        // Update user in users collection
        const usersRef = collection(db, COLLECTIONS.USERS);
        const userQuery = query(usersRef, where('email', '==', email));
        const userSnapshot = await getDocs(userQuery);
        
        if (!userSnapshot.empty) {
          const userDoc = userSnapshot.docs[0];
          await updateDoc(userDoc.ref, {
            password: newPhone,
            updatedAt: new Date()
          });
          console.log(`✅ User document password updated in Firestore: ${email}`);
          
          // Update password in Firebase Auth via Cloud Function
          const { getFunctions, httpsCallable } = await import('firebase/functions');
          const { auth } = await import('../config/firebase.js');
          const functions = getFunctions();
          const updateUserPassword = httpsCallable(functions, 'updateUserPasswordByEmail');
          
          const updateResult = await updateUserPassword({ email, newPassword: newPhone });
          if (updateResult.data && updateResult.data.success) {
            console.log(`✅ Site user password updated in Firebase Auth: ${email}`);
          } else {
            console.error(`⚠️ Failed to update password in Firebase Auth: ${email}`, updateResult.data);
          }
        } else {
          console.warn(`⚠️ Site user not found in users collection: ${email}`);
        }
      } catch (error) {
        console.error('Error updating site user password:', error);
        // Don't fail the site update if password update fails
      }
    }
    
    return updateResult;
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
      
      // Delete associated user from users collection first
      try {
        const usersRef = collection(db, COLLECTIONS.USERS);
        const userQuery = query(usersRef, where('email', '==', siteEmail));
        const userSnapshot = await getDocs(userQuery);
        
        if (!userSnapshot.empty) {
          // Delete all matching user documents (should be only one, but handle multiple just in case)
          const deleteUserPromises = userSnapshot.docs.map(doc => deleteDoc(doc.ref));
          await Promise.all(deleteUserPromises);
          console.log(`✅ User document(s) deleted from Firestore: ${siteEmail}`);
        }
      } catch (err) {
        console.error(`⚠️ Failed to delete user document ${siteEmail}:`, err.message || err);
      }
      
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
    
    const siteData = siteResult.data;
    
    // Site verisini archivedSites koleksiyonuna kopyala
    const archiveData = {
      ...siteData,
      originalDocId: docId,
      archivedAt: serverTimestamp(),
      archivedFrom: 'sites'
    };
    
    // archivedSites koleksiyonuna ekle
    const archiveRef = await addDoc(collection(db, COLLECTIONS.ARCHIVED_SITES), archiveData);
    
    // Orijinal dokümanı sil
    const siteDocRef = doc(db, COLLECTIONS.SITES, docId);
    await deleteDoc(siteDocRef);
    
    console.log(`✅ Site ${siteId} (doc: ${docId}) archived successfully to archivedSites`);
      console.log(`⚠️ Site user ${siteId}@site.local login is now disabled`);
      return { success: true, message: `Site archived. User login disabled.` };
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
  // archivedCompanies koleksiyonundan tüm arşivlenen firmaları getir
  const result = await getCollection(COLLECTIONS.ARCHIVED_COMPANIES, [], 'archivedAt', 'desc');
  return result.data || [];
};

// Restore archived site back to sites collection
export const restoreSite = async (siteId) => {
  try {
    // Find archived site by id field
    const queryRef = collection(db, COLLECTIONS.ARCHIVED_SITES);
    const q = query(queryRef, where('id', '==', siteId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.error('restoreSite: Archived site not found for id:', siteId);
      return { success: false, error: 'Archived site not found' };
    }

    const archivedDoc = querySnapshot.docs[0];
    const archivedData = archivedDoc.data();
    
    // Remove archive-specific fields
    const { originalDocId, archivedAt, archivedFrom, ...siteData } = archivedData;
    
    // Create site in sites collection
    const siteRef = await addDoc(collection(db, COLLECTIONS.SITES), {
      ...siteData,
      status: 'active', // Restore as active
      restoredAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Delete from archivedSites
    await deleteDoc(archivedDoc.ref);
    
    console.log(`✅ Site ${siteId} restored successfully from archivedSites`);
    return { success: true, message: 'Site restored successfully' };
  } catch (error) {
    console.error('Error restoring site:', error);
    return { success: false, error: error.message };
  }
};

// Restore archived company back to companies collection
export const restoreCompany = async (companyId) => {
  try {
    // Find archived company by id field
    const queryRef = collection(db, COLLECTIONS.ARCHIVED_COMPANIES);
    const q = query(queryRef, where('id', '==', companyId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.error('restoreCompany: Archived company not found for id:', companyId);
      return { success: false, error: 'Archived company not found' };
    }

    const archivedDoc = querySnapshot.docs[0];
    const archivedData = archivedDoc.data();
    
    // Remove archive-specific fields
    const { originalDocId, archivedAt, archivedFrom, ...companyData } = archivedData;
    
    // Create company in companies collection
    const companyRef = await addDoc(collection(db, COLLECTIONS.COMPANIES), {
      ...companyData,
      status: 'active', // Restore as active
      restoredAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Delete from archivedCompanies
    await deleteDoc(archivedDoc.ref);
    
    console.log(`✅ Company ${companyId} restored successfully from archivedCompanies`);
    return { success: true, message: 'Company restored successfully' };
  } catch (error) {
    console.error('Error restoring company:', error);
    return { success: false, error: error.message };
  }
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
    let oldCompanyData = null;
    const companyResult = await getDocument(COLLECTIONS.COMPANIES, companyId);
    
    if (!companyResult.success || !companyResult.data) {
      // Fallback: search by custom 'id' field
      const queryRef = collection(db, COLLECTIONS.COMPANIES);
      const q = query(queryRef, where('id', '==', companyId));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        docId = docSnap.id; // This is the actual Firestore document ID
        oldCompanyData = docSnap.data();
      } else {
        return { success: false, error: 'Company not found' };
      }
    } else {
      oldCompanyData = companyResult.data;
    }
    
    // Check if phone number changed
    const oldPhone = oldCompanyData?.phone || '';
    const newPhone = companyData.phone || '';
    const phoneChanged = oldPhone !== newPhone && newPhone;
    
    const updateResult = await updateDocument(COLLECTIONS.COMPANIES, docId, companyData);
    
    // If phone changed, update user password in Auth and users collection
    if (phoneChanged && updateResult.success) {
      try {
        // Use custom ID from oldCompanyData, fallback to companyId parameter
        const logicalCompanyId = oldCompanyData?.id || companyId;
        const email = `${logicalCompanyId}@company.local`;
        
        console.log(`Updating company user password: ${email} (companyId: ${logicalCompanyId}, oldPhone: ${oldPhone}, newPhone: ${newPhone})`);
        
        // Update user in users collection
        const usersRef = collection(db, COLLECTIONS.USERS);
        const userQuery = query(usersRef, where('email', '==', email));
        const userSnapshot = await getDocs(userQuery);
        
        if (!userSnapshot.empty) {
          const userDoc = userSnapshot.docs[0];
          await updateDoc(userDoc.ref, {
            password: newPhone,
            updatedAt: new Date()
          });
          console.log(`✅ User document password updated in Firestore: ${email}`);
          
          // Update password in Firebase Auth via Cloud Function
          const { getFunctions, httpsCallable } = await import('firebase/functions');
          const { auth } = await import('../config/firebase.js');
          const functions = getFunctions();
          const updateUserPassword = httpsCallable(functions, 'updateUserPasswordByEmail');
          
          const updateResult = await updateUserPassword({ email, newPassword: newPhone });
          if (updateResult.data && updateResult.data.success) {
            console.log(`✅ Company user password updated in Firebase Auth: ${email}`);
          } else {
            console.error(`⚠️ Failed to update password in Firebase Auth: ${email}`, updateResult.data);
          }
        } else {
          console.warn(`⚠️ Company user not found in users collection: ${email}`);
        }
      } catch (error) {
        console.error('Error updating company user password:', error);
        // Don't fail the company update if password update fails
      }
    }
    
    return updateResult;
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
      
      // Delete associated user from users collection first
      try {
        const usersRef = collection(db, COLLECTIONS.USERS);
        const userQuery = query(usersRef, where('email', '==', companyEmail));
        const userSnapshot = await getDocs(userQuery);
        
        if (!userSnapshot.empty) {
          // Delete all matching user documents (should be only one, but handle multiple just in case)
          const deleteUserPromises = userSnapshot.docs.map(doc => deleteDoc(doc.ref));
          await Promise.all(deleteUserPromises);
          console.log(`✅ User document(s) deleted from Firestore: ${companyEmail}`);
        }
      } catch (err) {
        console.error(`⚠️ Failed to delete user document ${companyEmail}:`, err.message || err);
      }
      
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
    
    const companyData = companyResult.data;
    const docId = companyId;
    
    // Company verisini archivedCompanies koleksiyonuna kopyala
    const archiveData = {
      ...companyData,
      originalDocId: docId,
      archivedAt: serverTimestamp(),
      archivedFrom: 'companies'
    };
    
    // archivedCompanies koleksiyonuna ekle
    const archiveRef = await addDoc(collection(db, COLLECTIONS.ARCHIVED_COMPANIES), archiveData);
    
    // Orijinal dokümanı sil
    const companyDocRef = doc(db, COLLECTIONS.COMPANIES, docId);
    await deleteDoc(companyDocRef);
    
    console.log(`✅ Company ${companyId} (doc: ${docId}) archived successfully to archivedCompanies`);
      console.log(`⚠️ Company user ${companyId}@company.local login is now disabled`);
      return { success: true, message: `Company archived. User login disabled.` };
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
    // First try to get by document ID
    let docId = agreementId;
    let agreement = null;
    const agreementResult = await getDocument(COLLECTIONS.AGREEMENTS, agreementId);
    
    if (!agreementResult.success || !agreementResult.data) {
      // Fallback: search by custom 'id' field
      const queryRef = collection(db, COLLECTIONS.AGREEMENTS);
      const q = query(queryRef, where('id', '==', agreementId));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        docId = docSnap.id; // This is the actual Firestore document ID
        agreement = docSnap.data();
      } else {
      return { success: false, error: 'Agreement not found' };
      }
    } else {
      agreement = agreementResult.data;
    }
    
    if (!agreement) {
      return { success: false, error: 'Agreement not found' };
    }
    
    const archivedAgreement = {
      ...agreement,
      status: 'archived',
      archivedAt: serverTimestamp()
    };
    
    const archiveResult = await createDocument(COLLECTIONS.ARCHIVED_AGREEMENTS, archivedAgreement);
    
    if (archiveResult.success) {
      await deleteAgreement(docId);
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

// Debts operations
export const getDebts = async () => {
  const result = await getCollection(COLLECTIONS.DEBTS, [], 'dueDate', 'asc');
  return result.data || [];
};

export const createDebt = async (debtData) => {
  return await createDocument(COLLECTIONS.DEBTS, debtData);
};

export const updateDebt = async (debtId, debtData) => {
  return await updateDocument(COLLECTIONS.DEBTS, debtId, debtData);
};

export const deleteDebt = async (debtId) => {
  return await deleteDocument(COLLECTIONS.DEBTS, debtId);
};

// Checks operations
export const getChecks = async () => {
  const result = await getCollection(COLLECTIONS.CHECKS, [], 'dueDate', 'asc');
  return result.data || [];
};

export const createCheck = async (checkData) => {
  return await createDocument(COLLECTIONS.CHECKS, checkData);
};

export const updateCheck = async (checkId, checkData) => {
  return await updateDocument(COLLECTIONS.CHECKS, checkId, checkData);
};

export const deleteCheck = async (checkId) => {
  return await deleteDocument(COLLECTIONS.CHECKS, checkId);
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

export const createSiteUser = async (siteId, siteData, forceRecreate = false) => {
  try {
    const email = `${siteId}@site.local`;
    // Şifre kontrolü: phone boşsa 123456, değilse phone değeri
    const password = (siteData.phone && siteData.phone.trim() !== '') ? siteData.phone : '123456';
    
    const userData = {
      username: siteId,
      password: password,
      role: 'site_user',
      siteId: siteId,
      status: 'active',
      email: email
    };
    
    // If forceRecreate is true, delete existing user first
    if (forceRecreate) {
      try {
        // Delete from Auth using Cloud Function
        const functionUrl = `https://us-central1-apartmecra-elz.cloudfunctions.net/deleteUserByEmail`;
        await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: email })
        }).catch(() => {
          // Ignore errors if user doesn't exist
        });
        
        // Delete from Firestore users collection
        const usersSnapshot = await getDocs(query(collection(db, 'users'), where('email', '==', email)));
        const deletePromises = usersSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
      } catch (deleteError) {
        console.log('Error deleting existing user (may not exist):', deleteError.message);
        // Continue with creation
      }
    }
    
    // Check if user exists in Firestore
    const existingUsers = await getDocs(query(collection(db, 'users'), where('email', '==', email)));
    
    if (!existingUsers.empty && !forceRecreate) {
      // User exists, update password in Auth
      try {
        const { getFunctions, httpsCallable } = await import('firebase/functions');
        const { functions } = await import('../config/firebase.js');
        const updatePassword = httpsCallable(functions, 'updateUserPasswordByEmail');
        await updatePassword({ email, newPassword: password });
        console.log('Site user password updated in Auth:', email);
      } catch (updateError) {
        console.warn('Failed to update password, will try to create:', updateError.message);
        // Continue with creation attempt
      }
    }
    
    // Create or update user in Firestore
    if (existingUsers.empty || forceRecreate) {
      const createResult = await createUser(userData);
      if (!createResult || !createResult.success) {
        throw new Error(createResult?.error || 'Failed to create user in Firestore');
      }
    } else {
      // Update existing user
      const existingUserDoc = existingUsers.docs[0];
      await updateDoc(existingUserDoc.ref, {
        ...userData,
        updatedAt: serverTimestamp()
      });
    }
    
    // Create user in Firebase Authentication (if doesn't exist)
    const authResult = await createUserWithEmail(email, password, userData);
    
    if (authResult.success) {
      console.log('Site user created/updated in Firebase Auth:', email);
    } else {
      // If user already exists, update password
      if (authResult.error && authResult.error.includes('already exists')) {
        try {
          const { getFunctions, httpsCallable } = await import('firebase/functions');
          const { functions } = await import('../config/firebase.js');
          const updatePassword = httpsCallable(functions, 'updateUserPasswordByEmail');
          await updatePassword({ email, newPassword: password });
          console.log('Site user password updated in Auth:', email);
        } catch (updateError) {
          console.error('Failed to update site user password:', updateError);
        }
    } else {
      console.error('Failed to create site user in Firebase Auth:', authResult.error);
        throw new Error(authResult.error);
      }
    }
    
    return { success: true, email, password };
  } catch (error) {
    console.error('Error creating site user:', error);
    throw error;
  }
};

export const createCompanyUser = async (companyId, companyData, forceRecreate = false) => {
  try {
    const email = `${companyId}@company.local`;
    const password = companyData.phone || companyId;
    
    const userData = {
      username: companyId,
      password: password,
      role: 'company_user',
      companyId: companyId,
      status: 'active',
      email: email
    };
    
    // If forceRecreate is true, delete existing user first
    if (forceRecreate) {
      try {
        // Delete from Auth using Cloud Function
        const functionUrl = `https://us-central1-apartmecra-elz.cloudfunctions.net/deleteUserByEmail`;
        await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: email })
        }).catch(() => {
          // Ignore errors if user doesn't exist
        });
        
        // Delete from Firestore users collection
        const usersSnapshot = await getDocs(query(collection(db, 'users'), where('email', '==', email)));
        const deletePromises = usersSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
      } catch (deleteError) {
        console.log('Error deleting existing user (may not exist):', deleteError.message);
        // Continue with creation
      }
    }
    
    // Check if user exists in Firestore
    const existingUsers = await getDocs(query(collection(db, 'users'), where('email', '==', email)));
    
    if (!existingUsers.empty && !forceRecreate) {
      // User exists, update password in Auth
      try {
        const { getFunctions, httpsCallable } = await import('firebase/functions');
        const { functions } = await import('../config/firebase.js');
        const updatePassword = httpsCallable(functions, 'updateUserPasswordByEmail');
        await updatePassword({ email, newPassword: password });
        console.log('Company user password updated in Auth:', email);
      } catch (updateError) {
        console.warn('Failed to update password, will try to create:', updateError.message);
        // Continue with creation attempt
      }
    }
    
    // Create or update user in Firestore
    if (existingUsers.empty || forceRecreate) {
      const createResult = await createUser(userData);
      if (!createResult || !createResult.success) {
        throw new Error(createResult?.error || 'Failed to create user in Firestore');
      }
    } else {
      // Update existing user
      const existingUserDoc = existingUsers.docs[0];
      await updateDoc(existingUserDoc.ref, {
        ...userData,
        updatedAt: serverTimestamp()
      });
    }
    
    // Create user in Firebase Authentication (if doesn't exist)
    const authResult = await createUserWithEmail(email, password, userData);
    
    if (authResult.success) {
      console.log('Company user created/updated in Firebase Auth:', email);
    } else {
      // If user already exists, update password
      if (authResult.error && authResult.error.includes('already exists')) {
        try {
          const { getFunctions, httpsCallable } = await import('firebase/functions');
          const { functions } = await import('../config/firebase.js');
          const updatePassword = httpsCallable(functions, 'updateUserPasswordByEmail');
          await updatePassword({ email, newPassword: password });
          console.log('Company user password updated in Auth:', email);
        } catch (updateError) {
          console.error('Failed to update company user password:', updateError);
        }
      } else {
        console.error('Failed to create company user in Firebase Auth:', authResult.error);
        throw new Error(authResult.error);
      }
    }
    
    return { success: true, email, password };
  } catch (error) {
    console.error('Error creating company user:', error);
    throw error;
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
