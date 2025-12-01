// src/utils/auth.js
import { login as apiLogin, onAuthStateChange, getCurrentUser } from '../services/api';

// Token expiration time (24 hours)
const TOKEN_EXPIRY_TIME = 24 * 60 * 60 * 1000;

// Generate secure token with timestamp
const generateSecureToken = (user) => {
  const timestamp = Date.now();
  const expiry = timestamp + TOKEN_EXPIRY_TIME;
  const tokenData = {
    userId: user.id,
    role: user.role,
    timestamp,
    expiry
  };
  
  // In a real app, this would be signed with a secret key
  return btoa(JSON.stringify(tokenData));
};

// Validate token and check expiration
const validateToken = (token) => {
  try {
    const tokenData = JSON.parse(atob(token));
    const now = Date.now();
    
    if (now > tokenData.expiry) {
      return { valid: false, reason: 'expired' };
    }
    
    return { valid: true, data: tokenData };
  } catch (error) {
    return { valid: false, reason: 'invalid' };
  }
};

// Cache authentication status to prevent unnecessary re-renders
let cachedAuthStatus = null;
let authCacheTimestamp = 0;
const AUTH_CACHE_DURATION = 1000; // 1 second cache

export const isAuthenticated = () => {
  const now = Date.now();
  // Return cached status if cache is still valid
  if (cachedAuthStatus !== null && (now - authCacheTimestamp) < AUTH_CACHE_DURATION) {
    return cachedAuthStatus;
  }
  
  const token = localStorage.getItem('token');
  if (!token) {
    cachedAuthStatus = false;
    authCacheTimestamp = now;
    return false;
  }
  
  const validation = validateToken(token);
  if (!validation.valid) {
    // Clear invalid/expired token
    logout();
    cachedAuthStatus = false;
    authCacheTimestamp = now;
    return false;
  }
  
  cachedAuthStatus = true;
  authCacheTimestamp = now;
  return true;
};

// Cache user to prevent unnecessary re-renders
let cachedUser = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 1000; // 1 second cache

export const getUser = () => {
  const now = Date.now();
  // Return cached user if cache is still valid
  if (cachedUser !== null && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedUser;
  }
  
  const user = localStorage.getItem('user');
  if (!user) {
    cachedUser = null;
    cacheTimestamp = now;
    return null;
  }
  
  try {
    const parsedUser = JSON.parse(user);
    cachedUser = parsedUser;
    cacheTimestamp = now;
    return parsedUser;
  } catch (error) {
    logout();
    cachedUser = null;
    cacheTimestamp = now;
    return null;
  }
};

// Clear user cache (call this when user logs in/out)
export const clearUserCache = () => {
  cachedUser = null;
  cacheTimestamp = 0;
};

export const getUserRole = () => {
  const user = getUser();
  return user ? user.role : null;
};

export const isSiteUser = () => {
  const user = getUser();
  return user && user.role === 'site_user';
};

export const isObserver = () => {
  const user = getUser();
  return user && user.role === 'observer';
};

export const isCompany = () => {
  const user = getUser();
  return user && user.role === 'company';
};

export const isAdmin = () => {
  const user = getUser();
  return user && (user.role === 'administrator' || user.role === 'admin');
};

export const canModify = () => {
  const user = getUser();
  return user && (user.role === 'administrator' || user.role === 'admin');
};

export const canView = () => {
  const user = getUser();
  return user && ['administrator', 'admin', 'observer', 'company'].includes(user.role);
};

export const logout = () => {
  // Clear all auth-related data
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('loginAttempts');
  
  // Clear any other sensitive data
  sessionStorage.clear();
  
  // Clear user cache
  clearUserCache();
};

export const login = async (username, password) => {
  // Use the API service for authentication
  try {
    const result = await apiLogin(username, password);
    
    if (result.error) {
      return { error: result.error };
    }
    
    // Generate secure token
    const secureToken = generateSecureToken(result.user);
    
    // Store token and user in localStorage
    localStorage.setItem('token', secureToken);
    localStorage.setItem('user', JSON.stringify(result.user));
    
    // Clear cache and update cached user
    clearUserCache();
    cachedUser = result.user;
    cacheTimestamp = Date.now();
    
    return { ...result, token: secureToken };
  } catch (error) {
    return { error: 'Authentication failed' };
  }
};

// Auto-logout on token expiry
export const checkTokenExpiry = () => {
  if (!isAuthenticated()) {
    logout();
    // Use navigate instead of window.location to prevent page refresh
    // Only redirect if we're not already on login page
    if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
      window.location.href = '/login';
    }
  }
};

// Initialize token checking - DISABLED to prevent page refresh issues
// Token checking will be done on login/logout actions only
// if (typeof window !== 'undefined') {
//   // Check token every 5 minutes
//   setInterval(checkTokenExpiry, 5 * 60 * 1000);
// }