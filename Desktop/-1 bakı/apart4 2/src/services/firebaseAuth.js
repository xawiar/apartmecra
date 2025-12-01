// src/services/firebaseAuth.js
import { 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  deleteUser
} from 'firebase/auth';
import { auth } from '../config/firebase.js';

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  SITE_MANAGER: 'site_manager',
  COMPANY_MANAGER: 'company_manager',
  OBSERVER: 'observer',
  PERSONNEL: 'personnel'
};

// Simple login function
export const loginWithEmail = async (email, password) => {
  try {
    console.log('🔐 Attempting login with:', email);
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('✅ Login successful:', user.uid);
    
    // Get ID token
    const token = await user.getIdToken();
    console.log('🎫 Token obtained:', token ? 'Yes' : 'No');
    
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
    console.error('❌ Login error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    return {
      success: false,
      error: getErrorMessage(error.code)
    };
  }
};

// Simple logout function
export const logoutUser = async () => {
  try {
    await signOut(auth);
    console.log('✅ Logout successful');
    return { success: true };
  } catch (error) {
    console.error('❌ Logout error:', error);
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
    console.log('Creating user with email:', email);
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('User created successfully:', user.uid);
    
    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        ...userData
      }
    };
    
  } catch (error) {
    console.error('User creation error:', error);
    return {
      success: false,
      error: getErrorMessage(error.code)
    };
  }
};

// Initialize admin user
export const initializeAdminUser = async () => {
  try {
    console.log('🔧 Initializing admin user...');
    return true;
  } catch (error) {
    console.error('❌ Error initializing admin user:', error);
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
    'auth/network-request-failed': 'Ağ bağlantısı hatası',
    'auth/invalid-credential': 'Geçersiz kimlik bilgileri',
    'auth/operation-not-allowed': 'Bu işlem izin verilmiyor',
    'auth/weak-password': 'Şifre çok zayıf'
  };
  
  return errorMessages[errorCode] || `Bilinmeyen hata: ${errorCode}`;
};

// Delete user from Firebase Auth
export const deleteUserFromAuth = async (email) => {
  try {
    console.log('🗑️ Deleting user from Firebase Auth:', email);
    
    // Note: This function requires Firebase Admin SDK for server-side deletion
    // For client-side, we can only delete the currently signed-in user
    console.log('⚠️ User deletion requires Firebase Admin SDK');
    console.log('Please delete user manually from Firebase Console:');
    console.log('https://console.firebase.google.com/project/apartmecraelazig/authentication/users');
    
    return { success: false, error: 'Admin SDK required for user deletion' };
  } catch (error) {
    console.error('Error deleting user from Auth:', error);
    return { success: false, error: error.message };
  }
};