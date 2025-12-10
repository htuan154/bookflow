// src/utils/stringUtils.js

/**
 * Remove Vietnamese accents from a string
 * @param {string} str - The string to process
 * @returns {string} - The string without Vietnamese accents
 */
export const removeVietnameseAccents = (str) => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
};

/**
 * Compare two strings ignoring Vietnamese accents (case-insensitive)
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {boolean} - True if strings match (ignoring accents)
 */
export const compareIgnoreAccents = (str1, str2) => {
  const normalized1 = removeVietnameseAccents(str1).toLowerCase();
  const normalized2 = removeVietnameseAccents(str2).toLowerCase();
  return normalized1.includes(normalized2);
};

/**
 * Search for a term in a string, ignoring Vietnamese accents
 * @param {string} text - The text to search in
 * @param {string} searchTerm - The term to search for
 * @returns {boolean} - True if search term is found (ignoring accents)
 */
export const searchIgnoreAccents = (text, searchTerm) => {
  if (!text || !searchTerm) return false;
  return compareIgnoreAccents(text, searchTerm);
};
