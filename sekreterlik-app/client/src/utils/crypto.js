import CryptoJS from 'crypto-js';

// Encryption key - production'da environment variable'dan alınmalı
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 
  'ilsekreterlik-app-encryption-key-2024-secret-very-long-key-for-security';

/**
 * Veriyi şifreler
 * @param {any} data - Şifrelenecek veri
 * @returns {string} Şifrelenmiş string
 */
export function encryptData(data) {
  if (data === null || data === undefined) return null;
  
  try {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(dataString, ENCRYPTION_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    return data; // Hata durumunda orijinal veriyi döndür
  }
}

/**
 * Şifrelenmiş veriyi çözer
 * @param {string} encryptedData - Şifrelenmiş veri
 * @returns {any} Çözülmüş veri
 */
export function decryptData(encryptedData) {
  if (!encryptedData) return null;
  
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    
    // JSON parse denemesi
    try {
      return JSON.parse(decrypted);
    } catch {
      return decrypted; // String ise direkt döndür
    }
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedData; // Hata durumunda orijinal veriyi döndür
  }
}

/**
 * Nesneyi şifrelenmiş hale getirir (recursive)
 * @param {object} obj - Şifrelenecek nesne
 * @param {string[]} fieldsToEncrypt - Şifrelenecek alan isimleri
 * @returns {object} Şifrelenmiş nesne
 */
export function encryptObject(obj, fieldsToEncrypt = []) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const encrypted = { ...obj };
  
  fieldsToEncrypt.forEach(field => {
    if (encrypted[field] !== undefined && encrypted[field] !== null) {
      encrypted[field] = encryptData(encrypted[field]);
    }
  });
  
  return encrypted;
}

/**
 * Şifrelenmiş nesneyi çözer (recursive)
 * @param {object} obj - Şifrelenmiş nesne
 * @param {string[]} fieldsToDecrypt - Çözülecek alan isimleri
 * @returns {object} Çözülmüş nesne
 */
export function decryptObject(obj, fieldsToDecrypt = []) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const decrypted = { ...obj };
  
  fieldsToDecrypt.forEach(field => {
    if (decrypted[field] !== undefined && decrypted[field] !== null) {
      decrypted[field] = decryptData(decrypted[field]);
    }
  });
  
  return decrypted;
}

/**
 * Hassas alanlar listesi (varsayılan)
 */
export const SENSITIVE_FIELDS = [
  'password',
  'phone',
  'email',
  'tc',      // TC kimlik numarası
  'tcNo',    // Alternatif TC alan adı
  'address',
  'notes',
  'description',
  'content',
  'message'
];

