// src/services/localApi.js
// Local API service that uses JSON Server for offline functionality

// Use environment variable or detect current origin for production
// In production (Render), API is served from the same origin
const getApiBaseUrl = () => {
  // Check if we're in production (Render)
  if (import.meta.env.PROD || window.location.hostname !== 'localhost') {
    // In production, API is on the same origin
    return window.location.origin;
  }
  // In development, use localhost:3001
  return 'http://localhost:3001';
};

const API_BASE_URL = getApiBaseUrl();

// Generate site ID based on name and sequence number
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

// Generate company ID based on name and sequence number
const generateCompanyId = (name, sequenceNumber) => {
  const prefix = name.substring(0, 3).toUpperCase()
    .replace(/İ/g, 'I')
    .replace(/Ğ/g, 'G')
    .replace(/Ü/g, 'U')
    .replace(/Ş/g, 'S')
    .replace(/Ö/g, 'O')
    .replace(/Ç/g, 'C');
  
  return `${prefix}${sequenceNumber}`;
};

// Generate agreement ID based on date and sequence number
const generateAgreementId = (date, sequenceNumber) => {
  const dateObj = new Date(date);
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  return `${sequenceNumber}${day}${month}${String(year).slice(-2)}`;
};

// Create company user
const createCompanyUser = async (companyId, companyData) => {
  try {
    const email = `${companyId}@company.local`;
    const password = companyData.phone || companyId;
    
    const userData = {
      username: companyId,
      password: password,
      role: 'company',
      companyId: companyId,
      status: 'active',
      email: email
    };
    
    // Create user in local database
    await apiCall('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    
    console.log('Company user created:', userData);
  } catch (error) {
    console.error('Error creating company user:', error);
  }
};

// Create site user for both sites and business centers
const createSiteUser = async (siteId, siteData) => {
  try {
    const email = `${siteId}@site.local`;
    const password = siteData.phone || siteId;
    
    const userData = {
      username: siteId,
      password: password,
      role: 'site_user',
      siteId: siteId,
      status: 'active',
      email: email
    };
    
    // Create user in local database
    await apiCall('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    
    console.log('Site user created:', userData);
  } catch (error) {
    console.error('Error creating site user:', error);
  }
};

// Helper function to make API calls with timeout
const apiCall = async (endpoint, options = {}) => {
  const timeout = 5000; // 5 second timeout
  
  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      signal: controller.signal,
      ...options
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('API call timeout:', endpoint);
      throw new Error('Sunucuya bağlanılamadı. Lütfen JSON Server\'ın çalıştığından emin olun (Port 3001).');
    }
    console.error('API call failed:', error);
    throw error;
  }
};

// Auth endpoints
export const login = async (username, password) => {
  try {
    console.log('Local API login called with:', username);
    
    // Try to find user in local database
    const response = await apiCall(`/users?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`);
    
    if (response && response.length > 0) {
      const user = response[0];
      return {
        token: 'local-token-' + Date.now(),
        user: {
          username: user.username,
          role: user.role,
          siteId: user.siteId || null,
          companyId: user.companyId || null,
          id: user.id
        }
      };
    } else {
      return { error: 'Geçersiz kimlik bilgileri' };
    }
  } catch (error) {
    console.error('Local API login error:', error);
    return { error: 'Bağlantı hatası: Sunucuya ulaşılamıyor' };
  }
};

export const changePassword = async (currentPassword, newPassword) => {
  // Local implementation - would need to be implemented
  return { success: true };
};

// Dashboard endpoints
export const getDashboardSummary = async () => {
  try {
    const [sites, companies, agreements, transactions] = await Promise.all([
      apiCall('/sites'),
      apiCall('/companies'),
      apiCall('/agreements'),
      apiCall('/transactions')
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
      activeSites: sites.filter(site => site.status !== 'archived').length,
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

export const getRecentTransactions = async (limit = 5) => {
  try {
    const transactions = await apiCall('/transactions');
    return transactions.slice(0, limit);
  } catch (error) {
    console.error('Error fetching recent transactions:', error);
    return [];
  }
};

// Sites endpoints
export const getSites = async () => {
  try {
    const sites = await apiCall('/sites');
    // Arşivlenmiş siteleri filtrele (status !== 'archived')
    return sites.filter(site => site.status !== 'archived');
  } catch (error) {
    console.error('Error fetching sites:', error);
    return [];
  }
};

export const createSite = async (siteData) => {
  try {
    // Generate site ID based on name and sequence number
    const sites = await apiCall('/sites');
    const sequenceNumber = sites.length + 1;
    const siteId = generateSiteId(siteData.name, sequenceNumber, siteData.siteType);
    
    const sitePayload = {
      ...siteData,
      id: siteId,
      sequenceNumber: sequenceNumber
    };
    
    const result = await apiCall('/sites', {
      method: 'POST',
      body: JSON.stringify(sitePayload)
    });
    
    if (result) {
      // Create site user automatically
      await createSiteUser(siteId, siteData);
    }
    
    return result;
  } catch (error) {
    console.error('Error creating site:', error);
    throw error;
  }
};

export const updateSite = async (siteId, siteData) => {
  try {
    return await apiCall(`/sites/${siteId}`, {
      method: 'PUT',
      body: JSON.stringify(siteData)
    });
  } catch (error) {
    console.error('Error updating site:', error);
    return null;
  }
};

export const deleteSite = async (siteId) => {
  try {
    await apiCall(`/sites/${siteId}`, {
      method: 'DELETE'
    });
    return true;
  } catch (error) {
    console.error('Error deleting site:', error);
    return false;
  }
};

export const archiveSite = async (siteId) => {
  try {
    const site = await apiCall(`/sites/${siteId}`);
    const updatedSite = { ...site, status: 'archived', archivedAt: new Date().toISOString() };
    await apiCall(`/sites/${siteId}`, {
      method: 'PUT',
      body: JSON.stringify(updatedSite)
    });
    return { success: true };
  } catch (error) {
    console.error('Error archiving site:', error);
    return { success: false, error: error.message };
  }
};

// Companies endpoints
export const getCompanies = async () => {
  try {
    return await apiCall('/companies');
  } catch (error) {
    console.error('Error fetching companies:', error);
    return [];
  }
};

export const createCompany = async (companyData) => {
  try {
    // Get next sequence number for companies
    const companies = await apiCall('/companies');
    const sequenceNumber = companies.length + 1;
    
    // Generate custom ID
    const customId = generateCompanyId(companyData.name, sequenceNumber);
    
    const companyPayload = {
      ...companyData,
      id: customId,
      sequenceNumber: sequenceNumber
    };
    
    const result = await apiCall('/companies', {
      method: 'POST',
      body: JSON.stringify(companyPayload)
    });
    
    if (result) {
      // Create company user automatically
      await createCompanyUser(customId, companyData);
    }
    
    return result;
  } catch (error) {
    console.error('Error creating company:', error);
    return null;
  }
};

export const updateCompany = async (companyId, companyData) => {
  try {
    return await apiCall(`/companies/${companyId}`, {
      method: 'PUT',
      body: JSON.stringify(companyData)
    });
  } catch (error) {
    console.error('Error updating company:', error);
    return null;
  }
};

export const deleteCompany = async (companyId) => {
  try {
    await apiCall(`/companies/${companyId}`, {
      method: 'DELETE'
    });
    return true;
  } catch (error) {
    console.error('Error deleting company:', error);
    return false;
  }
};

export const archiveCompany = async (companyId) => {
  try {
    const company = await apiCall(`/companies/${companyId}`);
    const updatedCompany = { ...company, status: 'archived', archivedAt: new Date().toISOString() };
    await apiCall(`/companies/${companyId}`, {
      method: 'PUT',
      body: JSON.stringify(updatedCompany)
    });
    return { success: true };
  } catch (error) {
    console.error('Error archiving company:', error);
    return { success: false, error: error.message };
  }
};

// Agreements endpoints
export const getAgreements = async () => {
  try {
    return await apiCall('/agreements');
  } catch (error) {
    console.error('Error fetching agreements:', error);
    return [];
  }
};

export const createAgreement = async (agreementData) => {
  try {
    // Get next sequence number for agreements
    const agreements = await apiCall('/agreements');
    const sequenceNumber = agreements.length + 1;
    
    // Generate custom ID
    const customId = generateAgreementId(agreementData.startDate, sequenceNumber);
    
    const agreementPayload = {
      ...agreementData,
      id: customId,
      sequenceNumber: sequenceNumber
    };
    
    const result = await apiCall('/agreements', {
      method: 'POST',
      body: JSON.stringify(agreementPayload)
    });
    
    return result;
  } catch (error) {
    console.error('Error creating agreement:', error);
    return null;
  }
};

export const updateAgreement = async (agreementId, agreementData) => {
  try {
    return await apiCall(`/agreements/${agreementId}`, {
      method: 'PUT',
      body: JSON.stringify(agreementData)
    });
  } catch (error) {
    console.error('Error updating agreement:', error);
    return null;
  }
};

export const deleteAgreement = async (agreementId) => {
  try {
    await apiCall(`/agreements/${agreementId}`, {
      method: 'DELETE'
    });
    return true;
  } catch (error) {
    console.error('Error deleting agreement:', error);
    return false;
  }
};

export const archiveAgreement = async (agreementId) => {
  try {
    const agreement = await apiCall(`/agreements/${agreementId}`);
    const updatedAgreement = { ...agreement, status: 'archived', archivedAt: new Date().toISOString() };
    await apiCall(`/agreements/${agreementId}`, {
      method: 'PUT',
      body: JSON.stringify(updatedAgreement)
    });
    return { success: true };
  } catch (error) {
    console.error('Error archiving agreement:', error);
    return { success: false, error: error.message };
  }
};

// Cashier endpoints
export const getTransactions = async () => {
  try {
    return await apiCall('/transactions');
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
};

export const createTransaction = async (transactionData) => {
  try {
    return await apiCall('/transactions', {
      method: 'POST',
      body: JSON.stringify(transactionData)
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return null;
  }
};

export const updateTransaction = async (transactionId, transactionData) => {
  try {
    return await apiCall(`/transactions/${transactionId}`, {
      method: 'PUT',
      body: JSON.stringify(transactionData)
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    return null;
  }
};

export const deleteTransaction = async (transactionId) => {
  try {
    await apiCall(`/transactions/${transactionId}`, {
      method: 'DELETE'
    });
    return true;
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return false;
  }
};

// Partner shares endpoints
export const getPartners = async () => {
  try {
    return await apiCall('/partners');
  } catch (error) {
    console.error('Error fetching partners:', error);
    return [];
  }
};

export const createPartner = async (partnerData) => {
  try {
    return await apiCall('/partners', {
      method: 'POST',
      body: JSON.stringify(partnerData)
    });
  } catch (error) {
    console.error('Error creating partner:', error);
    return null;
  }
};

export const updatePartner = async (partnerId, partnerData) => {
  try {
    return await apiCall(`/partners/${partnerId}`, {
      method: 'PUT',
      body: JSON.stringify(partnerData)
    });
  } catch (error) {
    console.error('Error updating partner:', error);
    return null;
  }
};

export const deletePartner = async (partnerId) => {
  try {
    await apiCall(`/partners/${partnerId}`, {
      method: 'DELETE'
    });
    return true;
  } catch (error) {
    console.error('Error deleting partner:', error);
    return false;
  }
};

// Archive endpoints
export const getArchivedSites = async () => {
  try {
    const sites = await apiCall('/sites');
    return sites.filter(site => site.status === 'archived');
  } catch (error) {
    console.error('Error fetching archived sites:', error);
    return [];
  }
};

export const getArchivedCompanies = async () => {
  try {
    const companies = await apiCall('/companies');
    return companies.filter(company => company.status === 'archived');
  } catch (error) {
    console.error('Error fetching archived companies:', error);
    return [];
  }
};

export const getArchivedAgreements = async () => {
  try {
    const agreements = await apiCall('/agreements');
    return agreements.filter(agreement => agreement.status === 'archived');
  } catch (error) {
    console.error('Error fetching archived agreements:', error);
    return [];
  }
};

export const deleteArchivedSite = async (siteId) => {
  try {
    await apiCall(`/sites/${siteId}`, {
      method: 'DELETE'
    });
    return true;
  } catch (error) {
    console.error('Error deleting archived site:', error);
    return false;
  }
};

export const deleteArchivedCompany = async (companyId) => {
  try {
    await apiCall(`/companies/${companyId}`, {
      method: 'DELETE'
    });
    return true;
  } catch (error) {
    console.error('Error deleting archived company:', error);
    return false;
  }
};

export const deleteArchivedAgreement = async (agreementId) => {
  try {
    // Archived agreements are stored in agreements collection with status: 'archived'
    // So we delete from agreements endpoint, not archivedAgreements
    await apiCall(`/agreements/${agreementId}`, {
      method: 'DELETE'
    });
    return true;
  } catch (error) {
    console.error('Error deleting archived agreement:', error);
    return false;
  }
};

export const restoreSite = async (siteId) => {
  try {
    const site = await apiCall(`/sites/${siteId}`);
    const restoredSite = { ...site };
    delete restoredSite.status;
    delete restoredSite.archivedAt;
    
    await apiCall(`/sites/${siteId}`, {
      method: 'PUT',
      body: JSON.stringify(restoredSite)
    });
    return true;
  } catch (error) {
    console.error('Error restoring site:', error);
    return false;
  }
};

export const restoreCompany = async (companyId) => {
  try {
    const company = await apiCall(`/companies/${companyId}`);
    const restoredCompany = { ...company };
    delete restoredCompany.status;
    delete restoredCompany.archivedAt;
    
    await apiCall(`/companies/${companyId}`, {
      method: 'PUT',
      body: JSON.stringify(restoredCompany)
    });
    return true;
  } catch (error) {
    console.error('Error restoring company:', error);
    return false;
  }
};

export const restoreAgreement = async (agreementId) => {
  try {
    const agreement = await apiCall(`/agreements/${agreementId}`);
    const restoredAgreement = { ...agreement };
    delete restoredAgreement.status;
    delete restoredAgreement.archivedAt;
    
    await apiCall(`/agreements/${agreementId}`, {
      method: 'PUT',
      body: JSON.stringify(restoredAgreement)
    });
    return true;
  } catch (error) {
    console.error('Error restoring agreement:', error);
    return false;
  }
};

// User management endpoints
export const getUsers = async () => {
  try {
    return await apiCall('/users');
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

export const createUser = async (userData) => {
  try {
    return await apiCall('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const updateUser = async (userId, userData) => {
  try {
    return await apiCall(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return null;
  }
};

export const deleteUser = async (userId) => {
  try {
    await apiCall(`/users/${userId}`, {
      method: 'DELETE'
    });
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
  }
};

// Site-specific data endpoints
export const getSiteData = async (siteId) => {
  try {
    const [site, agreements, transactions] = await Promise.all([
      apiCall(`/sites/${siteId}`),
      apiCall('/agreements'),
      apiCall('/transactions')
    ]);
    
    const siteAgreements = agreements.filter(agreement => 
      agreement.siteIds && agreement.siteIds.includes(siteId)
    );
    
    const siteTransactions = transactions.filter(transaction => 
      (transaction.type === 'expense' && transaction.source?.includes('Site Ödemesi') && transaction.source?.includes(site.name)) ||
      (transaction.type === 'income' && transaction.source?.includes('Anlaşma Ödemesi') && 
       siteAgreements.some(agreement => transaction.source?.includes(agreement.id)))
    );
    
    return {
      site,
      agreements: siteAgreements,
      transactions: siteTransactions
    };
  } catch (error) {
    console.error('Error fetching site data:', error);
    return { site: null, agreements: [], transactions: [] };
  }
};

export const getSiteAgreements = async (siteId) => {
  try {
    const agreements = await apiCall('/agreements');
    return agreements.filter(agreement => 
      agreement.siteIds && agreement.siteIds.includes(siteId)
    );
  } catch (error) {
    console.error('Error fetching site agreements:', error);
    return [];
  }
};

export const getSiteTransactions = async (siteId) => {
  try {
    const [transactions, site, agreements] = await Promise.all([
      apiCall('/transactions'),
      apiCall(`/sites/${siteId}`),
      apiCall('/agreements')
    ]);
    
    const siteAgreements = agreements.filter(agreement => 
      agreement.siteIds && agreement.siteIds.includes(siteId)
    );
    
    return transactions.filter(transaction => 
      (transaction.type === 'expense' && transaction.source?.includes('Site Ödemesi') && transaction.source?.includes(site.name)) ||
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
  try {
    return await apiCall('/logs');
  } catch (error) {
    console.error('Error fetching logs:', error);
    return [];
  }
};

export const createLog = async (logData) => {
  try {
    return await apiCall('/logs', {
      method: 'POST',
      body: JSON.stringify(logData)
    });
  } catch (error) {
    console.error('Error creating log:', error);
    return null;
  }
};

export const deleteLog = async (logId) => {
  try {
    await apiCall(`/logs/${logId}`, {
      method: 'DELETE'
    });
    return true;
  } catch (error) {
    console.error('Error deleting log:', error);
    return false;
  }
};

// Panel Image Functions
export const getPanelImages = async () => {
  try {
    const response = await fetch('http://localhost:3001/panelImages');
    if (!response.ok) {
      throw new Error('Failed to fetch panel images');
    }
    const images = await response.json();
    console.log('getPanelImages called - returning images:', images);
    return images;
  } catch (error) {
    console.error('Error fetching panel images:', error);
    return [];
  }
};

export const uploadPanelImage = async (formData) => {
  try {
    // Extract metadata from formData
    const agreementId = formData.get('agreementId');
    const siteId = formData.get('siteId');
    const blockId = formData.get('blockId');
    const panelId = formData.get('panelId');
    const companyId = formData.get('companyId');
    const file = formData.get('image');
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1E9);
    const fileExtension = file.name.split('.').pop();
    const filename = `panel-${agreementId}-${siteId}-${blockId}-${panelId}-${timestamp}-${randomSuffix}.${fileExtension}`;
    
    // Convert file to base64 for storage
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    
    // Create image info object with base64 data
    const imageInfo = {
      filename: filename,
      originalName: file.name,
      size: file.size,
      url: base64, // Store as base64 data URL
      agreementId: agreementId,
      siteId: siteId,
      blockId: blockId,
      panelId: panelId,
      companyId: companyId,
      uploadedAt: new Date().toISOString()
    };
    
    // Save to JSON Server
    const response = await fetch('http://localhost:3001/panelImages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(imageInfo)
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload panel image');
    }
    
    const result = await response.json();
    console.log('uploadPanelImage called - returning result:', result);
    return {
      success: true,
      message: 'Image uploaded successfully',
      imageUrl: imageInfo.url,
      imageInfo: result
    };
  } catch (error) {
    console.error('Error uploading panel image:', error);
    throw error;
  }
};

export const cleanupExpiredImages = async () => {
  console.log('cleanupExpiredImages called - returning mock response');
  return {
    message: 'Cleanup completed. Deleted 0 expired images.',
    deletedCount: 0
  };
};

// Auth state functions (mock implementations for local mode)
export const onAuthStateChange = (callback) => {
  // Mock implementation - always return null user for local mode
  callback(null);
  return () => {}; // Unsubscribe function
};

export const getCurrentUser = () => {
  // Mock implementation - return null for local mode
  return null;
};

export const hasPermission = (permission) => {
  // Mock implementation - return true for local mode
  return true;
};

export const canAccessSite = (siteId) => {
  // Mock implementation - return true for local mode
  return true;
};

export const canAccessCompany = (companyId) => {
  // Mock implementation - return true for local mode
  return true;
};

// Accounting Records Functions
export const getAccountingRecords = async () => {
  try {
    return await apiCall('/accountingRecords');
  } catch (error) {
    console.error('Error fetching accounting records:', error);
    return [];
  }
};

export const createAccountingRecord = async (recordData) => {
  try {
    return await apiCall('/accountingRecords', {
      method: 'POST',
      body: JSON.stringify(recordData)
    });
  } catch (error) {
    console.error('Error creating accounting record:', error);
    return null;
  }
};
