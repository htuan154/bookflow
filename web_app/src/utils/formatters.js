// src/utils/formatters.js

// ==================== DATE FORMATTERS ====================

/**
 * Format date to locale string
 * @param {string|Date} date - Date to format
 * @param {string} locale - Locale (default: 'en-US')
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date
 */
export const formatDate = (date, locale = 'en-US', options = {}) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return 'Invalid Date';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  
  return dateObj.toLocaleDateString(locale, { ...defaultOptions, ...options });
};

/**
 * Format date and time
 * @param {string|Date} date - Date to format
 * @param {string} locale - Locale (default: 'en-US')
 * @returns {string} Formatted date and time
 */
export const formatDateTime = (date, locale = 'en-US') => {
  return formatDate(date, locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Format date for input fields (YYYY-MM-DD)
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date for input
 */
export const formatDateForInput = (date) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '';
  
  return dateObj.toISOString().split('T')[0];
};

/**
 * Get relative time (e.g., "2 days ago", "in 3 hours")
 * @param {string|Date} date - Date to compare
 * @param {string|Date} referenceDate - Reference date (default: now)
 * @returns {string} Relative time string
 */
export const getRelativeTime = (date, referenceDate = new Date()) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const refDateObj = typeof referenceDate === 'string' ? new Date(referenceDate) : referenceDate;
  
  if (isNaN(dateObj.getTime()) || isNaN(refDateObj.getTime())) return 'Invalid Date';
  
  const diffMs = dateObj - refDateObj;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  if (Math.abs(diffDays) >= 1) {
    const days = Math.abs(diffDays);
    const dayText = days === 1 ? 'day' : 'days';
    return diffDays > 0 ? `in ${days} ${dayText}` : `${days} ${dayText} ago`;
  }
  
  if (Math.abs(diffHours) >= 1) {
    const hours = Math.abs(diffHours);
    const hourText = hours === 1 ? 'hour' : 'hours';
    return diffHours > 0 ? `in ${hours} ${hourText}` : `${hours} ${hourText} ago`;
  }
  
  if (Math.abs(diffMinutes) >= 1) {
    const minutes = Math.abs(diffMinutes);
    const minuteText = minutes === 1 ? 'minute' : 'minutes';
    return diffMinutes > 0 ? `in ${minutes} ${minuteText}` : `${minutes} ${minuteText} ago`;
  }
  
  return 'just now';
};

/**
 * Get Vietnamese date format
 * @param {string|Date} date - Date to format
 * @returns {string} Vietnamese formatted date
 */
export const formatDateVN = (date) => {
  return formatDate(date, 'vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Calculate days between two dates
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {number} Number of days
 */
export const daysBetween = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// ==================== NUMBER FORMATTERS ====================

/**
 * Format number with locale
 * @param {number} number - Number to format
 * @param {string} locale - Locale (default: 'en-US')
 * @param {object} options - Intl.NumberFormat options
 * @returns {string} Formatted number
 */
export const formatNumber = (number, locale = 'en-US', options = {}) => {
  if (typeof number !== 'number' || isNaN(number)) return '0';
  
  return new Intl.NumberFormat(locale, options).format(number);
};

/**
 * Format currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: 'USD')
 * @param {string} locale - Locale (default: 'en-US')
 * @returns {string} Formatted currency
 */
export const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
  if (typeof amount !== 'number' || isNaN(amount)) return '$0';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Format Vietnamese currency (VND)
 * @param {number} amount - Amount to format
 * @returns {string} Formatted VND currency
 */
export const formatVND = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) return '0₫';
  
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0
  }).format(amount);
};

/**
 * Format percentage
 * @param {number} value - Value to format as percentage
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (value, decimals = 1) => {
  if (typeof value !== 'number' || isNaN(value)) return '0%';
  
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format large numbers with K, M, B suffixes
 * @param {number} number - Number to format
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted number with suffix
 */
export const formatCompactNumber = (number, decimals = 1) => {
  if (typeof number !== 'number' || isNaN(number)) return '0';
  
  const suffixes = ['', 'K', 'M', 'B', 'T'];
  const tier = Math.log10(Math.abs(number)) / 3 | 0;
  
  if (tier === 0) return number.toString();
  
  const suffix = suffixes[tier];
  const scale = Math.pow(10, tier * 3);
  const scaled = number / scale;
  
  return scaled.toFixed(decimals) + suffix;
};

// ==================== PROMOTION FORMATTERS ====================

/**
 * Format discount value based on promotion type
 * @param {string} promotionType - 'percentage' or 'fixed'
 * @param {number} discountValue - The discount value
 * @returns {string} Formatted discount string
 */
export const formatDiscountValue = (promotionType, discountValue) => {
  if (!discountValue) return '0';
  
  switch (promotionType) {
    case 'percentage':
      return `${discountValue}%`;
    case 'fixed':
      return formatCurrency(discountValue);
    default:
      return discountValue.toString();
  }
};

/**
 * Format promotion status with color coding
 * @param {string} status - Promotion status
 * @param {string} validUntil - Expiry date
 * @returns {object} Status info with label and color
 */
export const formatPromotionStatus = (status, validUntil) => {
  const now = new Date();
  const expiryDate = new Date(validUntil);
  
  if (expiryDate < now) {
    return {
      label: 'Expired',
      color: 'red',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800'
    };
  }
  
  switch (status) {
    case 'active':
      return {
        label: 'Active',
        color: 'green',
        bgColor: 'bg-green-100',
        textColor: 'text-green-800'
      };
    case 'inactive':
      return {
        label: 'Inactive',
        color: 'gray',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800'
      };
    case 'scheduled':
      return {
        label: 'Scheduled',
        color: 'blue',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800'
      };
    default:
      return {
        label: status || 'Unknown',
        color: 'gray',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800'
      };
  }
};

/**
 * Format usage statistics
 * @param {number} usedCount - Number of times used
 * @param {number} usageLimit - Usage limit
 * @returns {object} Usage info with percentage and status
 */
export const formatUsageStats = (usedCount = 0, usageLimit = 0) => {
  if (usageLimit === 0) {
    return {
      text: `${usedCount} / Unlimited`,
      percentage: 0,
      isLimitReached: false
    };
  }
  
  const percentage = (usedCount / usageLimit) * 100;
  const isLimitReached = usedCount >= usageLimit;
  
  return {
    text: `${usedCount} / ${usageLimit}`,
    percentage: Math.min(percentage, 100),
    isLimitReached
  };
};

/**
 * Format date range for promotion validity
 * @param {string} validFrom - Start date
 * @param {string} validUntil - End date
 * @returns {string} Formatted date range
 */
export const formatDateRange = (validFrom, validUntil) => {
  if (!validFrom || !validUntil) return 'Invalid date range';
  
  const fromDate = new Date(validFrom);
  const untilDate = new Date(validUntil);
  
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  };
  
  const fromFormatted = fromDate.toLocaleDateString('en-US', options);
  const untilFormatted = untilDate.toLocaleDateString('en-US', options);
  
  return `${fromFormatted} - ${untilFormatted}`;
};

/**
 * Calculate days remaining until expiry
 * @param {string} validUntil - Expiry date
 * @returns {object} Days remaining info
 */
export const calculateDaysRemaining = (validUntil) => {
  if (!validUntil) return { days: 0, isExpired: true, isExpiringSoon: false };
  
  const now = new Date();
  const expiryDate = new Date(validUntil);
  const diffTime = expiryDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return {
    days: Math.max(diffDays, 0),
    isExpired: diffDays < 0,
    isExpiringSoon: diffDays >= 0 && diffDays <= 7 // Expires within 7 days
  };
};

/**
 * Format promotion code for display
 * @param {string} code - Promotion code
 * @returns {string} Formatted code
 */
export const formatPromotionCode = (code) => {
  if (!code) return '';
  return code.toUpperCase();
};

/**
 * Get promotion urgency level
 * @param {string} validUntil - Expiry date
 * @param {number} usedCount - Times used
 * @param {number} usageLimit - Usage limit
 * @returns {object} Urgency info
 */
export const getPromotionUrgency = (validUntil, usedCount = 0, usageLimit = 0) => {
  const { days, isExpired, isExpiringSoon } = calculateDaysRemaining(validUntil);
  const { percentage, isLimitReached } = formatUsageStats(usedCount, usageLimit);
  
  if (isExpired || isLimitReached) {
    return {
      level: 'high',
      message: isExpired ? 'Expired' : 'Usage limit reached',
      color: 'red'
    };
  }
  
  if (isExpiringSoon || percentage > 80) {
    return {
      level: 'medium',
      message: isExpiringSoon ? `Expires in ${days} days` : 'Nearly full usage',
      color: 'orange'
    };
  }
  
  return {
    level: 'low',
    message: 'Active',
    color: 'green'
  };
};

// ==================== TEXT FORMATTERS ====================

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || typeof text !== 'string') return '';
  
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength).trim() + '...';
};

/**
 * Capitalize first letter
 * @param {string} text - Text to capitalize
 * @returns {string} Capitalized text
 */
export const capitalize = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Convert to title case
 * @param {string} text - Text to convert
 * @returns {string} Title case text
 */
export const toTitleCase = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  return text.toLowerCase().split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

/**
 * Format phone number
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  return phone;
};

// ==================== VALIDATION FORMATTERS ====================

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate promotion code format
 * @param {string} code - Promotion code
 * @returns {object} Validation result
 */
export const validatePromotionCode = (code) => {
  if (!code) {
    return { isValid: false, message: 'Code is required' };
  }
  
  if (code.length < 3) {
    return { isValid: false, message: 'Code must be at least 3 characters' };
  }
  
  if (code.length > 20) {
    return { isValid: false, message: 'Code must be less than 20 characters' };
  }
  
  if (!/^[A-Z0-9]+$/.test(code.toUpperCase())) {
    return { isValid: false, message: 'Code can only contain letters and numbers' };
  }
  
  return { isValid: true, message: 'Valid code' };
};

// ==================== UTILITY FORMATTERS ====================

/**
 * Format file size
 * @param {number} bytes - Size in bytes
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (typeof bytes !== 'number' || isNaN(bytes)) return '0 Bytes';
  
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
};

/**
 * Format rating with stars
 * @param {number} rating - Rating value (0-5)
 * @param {number} maxRating - Maximum rating (default: 5)
 * @returns {object} Rating info with stars and text
 */
export const formatRating = (rating, maxRating = 5) => {
  if (typeof rating !== 'number' || isNaN(rating)) rating = 0;
  
  const clampedRating = Math.max(0, Math.min(rating, maxRating));
  const fullStars = Math.floor(clampedRating);
  const hasHalfStar = clampedRating % 1 >= 0.5;
  const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0);
  
  return {
    value: clampedRating,
    text: `${clampedRating.toFixed(1)}/${maxRating}`,
    stars: {
      full: fullStars,
      half: hasHalfStar ? 1 : 0,
      empty: emptyStars
    }
  };
};

/**
 * Generate slug from text
 * @param {string} text - Text to convert to slug
 * @returns {string} URL-friendly slug
 */
export const generateSlug = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Deep clone object
 * @param {any} obj - Object to clone
 * @returns {any} Cloned object
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
};

// ==================== EXPORTS ====================

const formatters = {
  // Date formatters
  formatDate,
  formatDateTime,
  formatDateForInput,
  getRelativeTime,
  formatDateVN,
  daysBetween,
  
  // Number formatters
  formatNumber,
  formatCurrency,
  formatVND,
  formatPercentage,
  formatCompactNumber,
  
  // Promotion formatters
  formatDiscountValue,
  formatPromotionStatus,
  formatUsageStats,
  formatDateRange,
  calculateDaysRemaining,
  formatPromotionCode,
  getPromotionUrgency,
  
  // Text formatters
  truncateText,
  capitalize,
  toTitleCase,
  formatPhoneNumber,
  
  // Validation
  isValidEmail,
  validatePromotionCode,
  
  // Utility
  formatFileSize,
  formatRating,
  generateSlug,
  deepClone
};


export default formatters;