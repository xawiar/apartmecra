/**
 * Safe object property access utility
 * Prevents null/undefined reference errors
 * These functions can be used throughout the codebase to safely access nested properties
 */

/**
 * Safely get nested property from object
 * @param {any} obj - Object to access
 * @param {string} path - Dot-separated path (e.g., 'user.profile.name')
 * @param {any} defaultValue - Default value if path doesn't exist
 * @returns {any} Property value or default value
 */
export const safeGet = (obj, path, defaultValue = null) => {
  if (!obj || !path) return defaultValue;
  
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current == null || typeof current !== 'object') {
      return defaultValue;
    }
    current = current[key];
    if (current === undefined) {
      return defaultValue;
    }
  }
  
  return current !== null && current !== undefined ? current : defaultValue;
};

/**
 * Safely check if array includes value
 * @param {any} array - Array to check (can be null/undefined)
 * @param {any} value - Value to search for
 * @returns {boolean} True if array includes value
 */
export const safeIncludes = (array, value) => {
  return Array.isArray(array) && array.includes(value);
};

/**
 * Safely get array length
 * @param {any} array - Array to get length from
 * @returns {number} Array length or 0
 */
export const safeLength = (array) => {
  return Array.isArray(array) ? array.length : 0;
};

/**
 * Safely map over array
 * @param {any} array - Array to map
 * @param {Function} callback - Map callback
 * @returns {Array} Mapped array or empty array
 */
export const safeMap = (array, callback) => {
  return Array.isArray(array) ? array.map(callback) : [];
};

/**
 * Safely filter array
 * @param {any} array - Array to filter
 * @param {Function} callback - Filter callback
 * @returns {Array} Filtered array or empty array
 */
export const safeFilter = (array, callback) => {
  return Array.isArray(array) ? array.filter(callback) : [];
};

/**
 * Safely find in array
 * @param {any} array - Array to search
 * @param {Function} callback - Find callback
 * @returns {any} Found item or null
 */
export const safeFind = (array, callback) => {
  return Array.isArray(array) ? array.find(callback) || null : null;
};

/**
 * Safely reduce array
 * @param {any} array - Array to reduce
 * @param {Function} callback - Reduce callback
 * @param {any} initialValue - Initial value
 * @returns {any} Reduced value
 */
export const safeReduce = (array, callback, initialValue = 0) => {
  return Array.isArray(array) ? array.reduce(callback, initialValue) : initialValue;
};

/**
 * Safely parse integer
 * @param {any} value - Value to parse
 * @param {number} defaultValue - Default value if parsing fails
 * @returns {number} Parsed integer or default
 */
export const safeParseInt = (value, defaultValue = 0) => {
  const parsed = parseInt(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Safely parse float
 * @param {any} value - Value to parse
 * @param {number} defaultValue - Default value if parsing fails
 * @returns {number} Parsed float or default
 */
export const safeParseFloat = (value, defaultValue = 0) => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Safely convert to string
 * @param {any} value - Value to convert
 * @param {string} defaultValue - Default value if conversion fails
 * @returns {string} String value or default
 */
export const safeString = (value, defaultValue = '') => {
  if (value == null) return defaultValue;
  return String(value);
};

/**
 * Safely check if value is array
 * @param {any} value - Value to check
 * @returns {boolean} True if value is array
 */
export const isArray = (value) => {
  return Array.isArray(value);
};

/**
 * Safely check if value is object
 * @param {any} value - Value to check
 * @returns {boolean} True if value is object
 */
export const isObject = (value) => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

/**
 * Safely check if value exists (not null/undefined)
 * @param {any} value - Value to check
 * @returns {boolean} True if value exists
 */
export const exists = (value) => {
  return value !== null && value !== undefined;
};

export default {
  safeGet,
  safeIncludes,
  safeLength,
  safeMap,
  safeFilter,
  safeFind,
  safeReduce,
  safeParseInt,
  safeParseFloat,
  safeString,
  isArray,
  isObject,
  exists
};

