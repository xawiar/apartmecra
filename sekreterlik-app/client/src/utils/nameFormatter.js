/**
 * Format a person's name with first name capitalized and last name in uppercase
 * @param {string} fullName - The full name to format
 * @returns {string} - The formatted name
 */
export const formatMemberName = (fullName) => {
  if (!fullName || typeof fullName !== 'string') {
    return fullName;
  }

  // Split the name into parts
  const nameParts = fullName.trim().split(/\s+/);
  
  if (nameParts.length === 0) {
    return fullName;
  }
  
  if (nameParts.length === 1) {
    // Only one part, capitalize first letter
    return capitalizeFirstLetter(nameParts[0]);
  }
  
  // Multiple parts: capitalize first letter of first part, uppercase the rest
  const firstName = capitalizeFirstLetter(nameParts[0]);
  const lastName = nameParts.slice(1).join(' ').toUpperCase();
  
  return `${firstName} ${lastName}`;
};

/**
 * Capitalize the first letter of a string
 * @param {string} str - The string to capitalize
 * @returns {string} - The capitalized string
 */
const capitalizeFirstLetter = (str) => {
  if (!str || str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export default formatMemberName;