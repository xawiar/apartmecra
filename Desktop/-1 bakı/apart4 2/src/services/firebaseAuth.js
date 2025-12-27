// src/services/firebaseAuth.js
import { 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  deleteUser
} from 'firebase/auth';
import { auth } from '../config/firebase.js';
import logger from '../utils/logger';

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  SITE_MANAGER: 'site_manager',
  COMPANY_MANAGER: 'company_manager',
  OBSERVER: 'observer',
  PERSONNEL: 'personnel'
};

// Simple login function
// silentMode: true is used when trying multiple login attempts (don't log expected failures)
export const loginWithEmail = async (email, password, silentMode = false) => {
  try {
    if (!silentMode) {
      logger.log('🔐 Attempting login with:', email);
    }
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    logger.log('✅ Login successful:', user.uid);
    
    // Get ID token
    const token = await user.getIdToken();
    if (!silentMode) {
      logger.log('🎫 Token obtained:', token ? 'Yes' : 'No');
    }
    
    // Determine role and IDs based on email
    let role = USER_ROLES.ADMIN;
    let siteId = null;
    let companyId = null;
    let username = user.email?.split('@')[0] || 'user';
    
    if (email.includes('@site.local')) {
      role = USER_ROLES.SITE_USER;
      siteId = email.replace('@site.local', '');
      username = siteId;
    } else if (email.includes('@company.local')) {
      role = USER_ROLES.COMPANY;
      companyId = email.replace('@company.local', '');
      username = companyId;
    } else if (email.includes('@personnel.local')) {
      role = USER_ROLES.PERSONNEL;
      username = email.replace('@personnel.local', '');
    }
    
    // Simple user data
    const userData = {
      uid: user.uid,
      email: user.email,
      username: username,
      role: role,
      siteId: siteId,
      companyId: companyId,
      status: 'active'
    };
    
    return {
      success: true,
      user: userData,
      token: token
    };
    
  } catch (error) {
    // Log all errors for debugging (especially network/auth domain issues)
    logger.error('❌ Login error:', {
      code: error.code,
      message: error.message,
      email: email,
      silentMode: silentMode,
      errorObject: error
    });
    
    // auth/invalid-credential is expected during multi-attempt login, don't log it in silent mode
    if (error.code === 'auth/invalid-credential' && silentMode) {
      // Silent - this is expected when trying different login types
      return {
        success: false,
        error: getErrorMessage(error.code)
      };
    }
    
    // Check for network or domain-related errors
    if (error.code === 'auth/network-request-failed' || 
        error.message?.includes('400') || 
        error.message?.includes('Bad Request') ||
        error.code?.includes('400')) {
      logger.error('⚠️ Network or domain error detected. Check Firebase authorized domains.');
      return {
        success: false,
        error: 'Ağ bağlantısı hatası veya yetkilendirme sorunu. Lütfen Firebase Console\'da authorized domains ayarlarını kontrol edin.'
      };
    }
    
    return {
      success: false,
      error: getErrorMessage(error.code) || 'Giriş yapılırken bir hata oluştu. Lütfen bilgilerinizi kontrol edin.'
    };
  }
};

// Simple logout function
export const logoutUser = async () => {
  try {
    await signOut(auth);
    logger.log('✅ Logout successful');
    return { success: true };
  } catch (error) {
    logger.error('❌ Logout error:', error);
    return { success: false, error: error.message };
  }
};

// Get current user
export const getCurrentUser = () => {
  return auth.currentUser;
};

// Auth state change listener
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// Simple permission check
export const hasPermission = (user, permission) => {
  if (!user) return false;
  if (user.role === USER_ROLES.ADMIN) return true;
  return false;
};

// Simple access checks
export const canAccessSite = (user, siteId) => {
  if (!user) return false;
  if (user.role === USER_ROLES.ADMIN) return true;
  return user.siteId === siteId;
};

export const canAccessCompany = (user, companyId) => {
  if (!user) return false;
  if (user.role === USER_ROLES.ADMIN) return true;
  return user.companyId === companyId;
};

// Create user with email and password
export const createUserWithEmail = async (email, password, userData = {}) => {
  try {
    logger.log('Creating user with email:', email);
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    logger.log('User created successfully:', user.uid);
    
    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        ...userData
      }
    };
    
  } catch (error) {
    logger.error('User creation error:', error);
    return {
      success: false,
      error: getErrorMessage(error.code)
    };
  }
};

// Initialize admin user
export const initializeAdminUser = async () => {
  try {
    logger.log('🔧 Initializing admin user...');
    return true;
  } catch (error) {
    logger.error('❌ Error initializing admin user:', error);
    return false;
  }
};

// Error message helper
const getErrorMessage = (errorCode) => {
  const errorMessages = {
    'auth/user-not-found': 'Kullanıcı bulunamadı',
    'auth/wrong-password': 'Yanlış şifre',
    'auth/invalid-email': 'Geçersiz email adresi',
    'auth/user-disabled': 'Kullanıcı hesabı devre dışı',
    'auth/too-many-requests': 'Çok fazla deneme yapıldı, lütfen daha sonra tekrar deneyin',
    'auth/network-request-failed': 'Ağ bağlantısı hatası. Lütfen internet bağlantınızı kontrol edin.',
    'auth/invalid-credential': 'Geçersiz kimlik bilgileri',
    'auth/operation-not-allowed': 'Bu işlem izin verilmiyor',
    'auth/weak-password': 'Şifre çok zayıf',
    'auth/invalid-argument': 'Geçersiz parametre',
    'auth/missing-password': 'Şifre gereklidir',
    'auth/email-already-in-use': 'Bu email adresi zaten kullanılıyor',
    'auth/unauthorized-domain': 'Bu domain için yetkilendirme yok. Firebase Console\'da authorized domains ayarlarını kontrol edin.',
    'auth/domain-not-allowed': 'Bu domain için yetkilendirme yok. Firebase Console\'da authorized domains ayarlarını kontrol edin.'
  };
  
  // Handle 400 Bad Request errors - often related to domain/IP restrictions
  if (!errorCode || errorCode.includes('400') || errorCode.includes('Bad Request')) {
    return 'Geçersiz istek. Bu hata genellikle Firebase authorized domains ayarlarından kaynaklanır. Lütfen Firebase Console\'da authorized domains listesine mevcut domain\'i ekleyin.';
  }
  
  return errorMessages[errorCode] || `Giriş hatası: ${errorCode || 'Bilinmeyen hata'}`;
};

// Delete user from Firebase Auth
export const deleteUserFromAuth = async (email) => {
  try {
    logger.log('🗑️ Deleting user from Firebase Auth:', email);
    
    // Note: This function requires Firebase Admin SDK for server-side deletion
    // For client-side, we can only delete the currently signed-in user
    logger.warn('⚠️ User deletion requires Firebase Admin SDK');
    logger.log('Please delete user manually from Firebase Console:');
    logger.log('https://console.firebase.google.com/project/apartmecraelazig/authentication/users');
    
    return { success: false, error: 'Admin SDK required for user deletion' };
  } catch (error) {
    logger.error('Error deleting user from Auth:', error);
    return { success: false, error: error.message };
  }
};