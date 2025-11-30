import { useContext, useEffect } from 'react';
import { BankAccountContext } from '../context/BankAccountContext';

/**
 * Hook để sử dụng Bank Account Context
 * @param {Object} options - Tùy chọn auto-fetch
 * @param {boolean} options.autoFetchAccounts - Tự động fetch danh sách tài khoản
 * @param {boolean} options.autoFetchDefault - Tự động fetch tài khoản mặc định
 * @param {boolean} options.autoFetchBanks - Tự động fetch danh sách ngân hàng
 * @param {string} options.hotelId - ID khách sạn (để fetch tài khoản mặc định của hotel)
 */
export default function useBankAccount(options = {}) {
  const context = useContext(BankAccountContext);
  
  if (!context) {
    throw new Error('useBankAccount must be used within BankAccountProvider');
  }

  const {
    autoFetchAccounts = false,
    autoFetchDefault = false,
    autoFetchBanks = false,
    hotelId = null
  } = options;

  const {
    // Data
    accounts,
    defaultAccount,
    popularBanks,
    statistics,

    // Loading states
    loading,
    loadingDefault,
    loadingBanks,
    loadingStats,
    creating,
    updating,
    deleting,

    // Error states
    error,
    validationErrors,

    // Actions
    fetchUserAccounts,
    fetchDefaultAccount,
    createBankAccount,
    updateBankAccount,
    setAccountAsDefault,
    deleteBankAccount,
    fetchHotelAccounts,
    unsetDefaultBankAccountsByHotel,
    fetchPopularBanks,
    fetchBankAccountStatistics,
    fetchAllBankAccounts,
    clearError,
    resetState,

    // Helper functions
    formatAccountNumber,
    validateBankAccountData,
    getVietnameseBanks,
  } = context;

  // Auto-fetch logic
  useEffect(() => {
    const shouldFetch = async () => {
      try {
        const promises = [];
        
        if (autoFetchAccounts) {
          promises.push(fetchUserAccounts());
        }
        
        if (autoFetchDefault) {
          promises.push(fetchDefaultAccount(hotelId));
        }
        
        if (autoFetchBanks) {
          promises.push(fetchPopularBanks());
        }
        
        if (promises.length > 0) {
          await Promise.allSettled(promises);
        }
      } catch (error) {
        console.error('Auto-fetch bank accounts error:', error);
      }
    };

    shouldFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetchAccounts, autoFetchDefault, autoFetchBanks, hotelId]);

  /**
   * Tìm tài khoản theo ID
   */
  const findAccountById = (accountId) => {
    return accounts.find(acc => acc.bankAccountId === accountId);
  };

  /**
   * Lấy tài khoản đang được update
   */
  const getUpdatingAccounts = () => {
    return Object.keys(updating).filter(id => updating[id]);
  };

  /**
   * Lấy tài khoản đang được delete
   */
  const getDeletingAccounts = () => {
    return Object.keys(deleting).filter(id => deleting[id]);
  };

  /**
   * Check xem tài khoản có đang được xử lý không
   */
  const isAccountProcessing = (accountId) => {
    return updating[accountId] || deleting[accountId];
  };

  /**
   * Lấy danh sách tài khoản active
   */
  const getActiveAccounts = () => {
    return accounts.filter(acc => acc.status === 'active');
  };

  /**
   * Lấy danh sách tài khoản của hotel
   */
  const getHotelAccounts = () => {
    return accounts.filter(acc => acc.hotelId);
  };

  /**
   * Lấy danh sách tài khoản cá nhân (không thuộc hotel)
   */
  const getPersonalAccounts = () => {
    return accounts.filter(acc => !acc.hotelId);
  };

  /**
   * Check xem có tài khoản mặc định không
   */
  const hasDefaultAccount = (forHotel = false) => {
    if (forHotel) {
      return accounts.some(acc => acc.isDefault && acc.hotelId);
    }
    return accounts.some(acc => acc.isDefault && !acc.hotelId);
  };

  /**
   * Lấy thông tin validation error cho field cụ thể
   */
  const getFieldError = (fieldName) => {
    return validationErrors[fieldName];
  };

  /**
   * Check xem có validation error không
   */
  const hasValidationErrors = () => {
    return Object.keys(validationErrors).length > 0;
  };

  /**
   * Tạo account với validation
   */
  const createAccountWithValidation = async (accountData) => {
    const validation = validateBankAccountData(accountData);
    if (!validation.isValid) {
      throw new Error('Dữ liệu không hợp lệ');
    }
    
    return await createBankAccount(accountData);
  };

  /**
   * Cập nhật account với validation
   */
  const updateAccountWithValidation = async (accountId, updateData) => {
    // Only validate fields that are being updated
    const fieldsToValidate = {};
    ['holder_name', 'account_number', 'bank_name', 'branch_name'].forEach(field => {
      if (updateData[field] !== undefined) {
        fieldsToValidate[field] = updateData[field];
      }
    });

    if (Object.keys(fieldsToValidate).length > 0) {
      const validation = validateBankAccountData(fieldsToValidate);
      if (!validation.isValid) {
        throw new Error('Dữ liệu không hợp lệ');
      }
    }
    
    return await updateBankAccount(accountId, updateData);
  };

  /**
   * Refresh tất cả data
   */
  const refreshAllData = async () => {
    const promises = [];
    
    if (accounts.length > 0 || autoFetchAccounts) {
      promises.push(fetchUserAccounts());
    }
    
    if (defaultAccount || autoFetchDefault) {
      promises.push(fetchDefaultAccount(hotelId));
    }
    
    if (popularBanks.length > 0 || autoFetchBanks) {
      promises.push(fetchPopularBanks());
    }
    
    if (promises.length > 0) {
      await Promise.allSettled(promises);
    }
  };

  return {
    // Data
    accounts,
    defaultAccount,
    popularBanks,
    statistics,
    
    // Loading states
    loading,
    loadingDefault,
    loadingBanks,
    loadingStats,
    creating,
    updating,
    deleting,
    
    // Error states
    error,
    validationErrors,
    
    // Actions
    fetchUserAccounts,
    fetchBankAccounts: fetchUserAccounts, // Alias cho compatibility
    fetchDefaultAccount,
    createBankAccount: createAccountWithValidation,
    updateBankAccount: updateAccountWithValidation,
    setDefaultBankAccount: setAccountAsDefault, // Alias cho compatibility
    setAccountAsDefault,
    deleteBankAccount,
    fetchHotelAccounts,
    unsetDefaultBankAccountsByHotel,
    fetchPopularBanks,
    fetchBankAccountStatistics,
    fetchAllBankAccounts,
    clearError,
    resetState,
    refreshAllData,
    
    // Helper functions
    formatAccountNumber,
    validateBankAccountData,
    getVietnameseBanks,
    
    // Computed values & utilities
    findAccountById,
    getUpdatingAccounts,
    getDeletingAccounts,
    isAccountProcessing,
    getActiveAccounts,
    getHotelAccounts,
    getPersonalAccounts,
    hasDefaultAccount,
    getFieldError,
    hasValidationErrors,
  };
}