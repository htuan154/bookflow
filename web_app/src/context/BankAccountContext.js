import React, { createContext, useCallback, useMemo, useState } from 'react';
import BankAccountService from '../api/bankAccount.service';

export const BankAccountContext = createContext(null);

export function BankAccountProvider({ children }) {
  // =========================================
  // STATE MANAGEMENT
  // =========================================
  
  const [accounts, setAccounts] = useState([]);
  const [defaultAccount, setDefaultAccount] = useState(null);
  const [popularBanks, setPopularBanks] = useState([]);
  const [statistics, setStatistics] = useState(null);
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [loadingDefault, setLoadingDefault] = useState(false);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState({});
  const [deleting, setDeleting] = useState({});
  
  // Error State
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // =========================================
  // ACTIONS - USER ACCOUNTS
  // =========================================

  /**
   * Fetch danh sách tài khoản ngân hàng của user hoặc hotel
   */
  const fetchUserAccounts = useCallback(async (hotelIdOrFilters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      let response;
      
      // Check if first parameter is a string (hotelId) or object (filters)
      if (typeof hotelIdOrFilters === 'string') {
        // Fetch hotel accounts
        response = await BankAccountService.getHotelBankAccounts(hotelIdOrFilters);
      } else {
        // Fetch user accounts with filters
        response = await BankAccountService.getUserBankAccounts(hotelIdOrFilters);
      }
      
      setAccounts(response.data || []);
      return response;
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Lỗi khi tải danh sách tài khoản';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch tài khoản mặc định
   */
  const fetchDefaultAccount = useCallback(async (hotelId = null) => {
    setLoadingDefault(true);
    setError(null);
    
    try {
      const response = await BankAccountService.getDefaultBankAccount(hotelId);
      setDefaultAccount(response.data);
      return response;
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Lỗi khi tải tài khoản mặc định';
      setError(errorMsg);
      throw err;
    } finally {
      setLoadingDefault(false);
    }
  }, []);

  /**
   * Tạo tài khoản ngân hàng mới
   */
  const createBankAccount = useCallback(async (accountData) => {
    // Validate data
    const validation = BankAccountService.validateBankAccountData(accountData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      throw new Error('Dữ liệu không hợp lệ');
    }

    setCreating(true);
    setError(null);
    setValidationErrors({});

    try {
      const response = await BankAccountService.createBankAccount(accountData);
      
      // Update local state
      const newAccount = response.data;
      setAccounts(prev => [newAccount, ...prev]);
      
      // If this is set as default, update default account
      if (newAccount.isDefault) {
        setDefaultAccount(newAccount);
        // Reset other default accounts in local state
        setAccounts(prev => prev.map(acc => 
          acc.bankAccountId === newAccount.bankAccountId 
            ? acc 
            : { ...acc, isDefault: false }
        ));
      }

      return response;
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Lỗi khi tạo tài khoản';
      setError(errorMsg);
      
      // Handle validation errors from server
      if (err?.response?.data?.errors) {
        setValidationErrors(err.response.data.errors);
      }
      
      throw err;
    } finally {
      setCreating(false);
    }
  }, []);

  /**
   * Cập nhật tài khoản ngân hàng
   */
  const updateBankAccount = useCallback(async (accountId, updateData) => {
    // Validate data if needed
    if (updateData.holder_name || updateData.account_number || updateData.bank_name) {
      const validation = BankAccountService.validateBankAccountData(updateData);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        throw new Error('Dữ liệu không hợp lệ');
      }
    }

    setUpdating(prev => ({ ...prev, [accountId]: true }));
    setError(null);
    setValidationErrors({});

    try {
      const response = await BankAccountService.updateBankAccount(accountId, updateData);
      
      // Update local state
      const updatedAccount = response.data;
      setAccounts(prev => prev.map(acc =>
        acc.bankAccountId === accountId ? updatedAccount : acc
      ));

      // Update default account if needed
      if (updatedAccount.isDefault) {
        setDefaultAccount(updatedAccount);
      } else if (defaultAccount?.bankAccountId === accountId) {
        setDefaultAccount(null);
      }

      return response;
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Lỗi khi cập nhật tài khoản';
      setError(errorMsg);
      
      if (err?.response?.data?.errors) {
        setValidationErrors(err.response.data.errors);
      }
      
      throw err;
    } finally {
      setUpdating(prev => ({ ...prev, [accountId]: false }));
    }
  }, [defaultAccount]);

  /**
   * Đặt tài khoản làm mặc định
   */
  const setAccountAsDefault = useCallback(async (accountId) => {
    setUpdating(prev => ({ ...prev, [accountId]: true }));
    setError(null);

    try {
      const response = await BankAccountService.setAsDefault(accountId);
      
      // Update local state
      const updatedAccount = response.data;
      setAccounts(prev => prev.map(acc => ({
        ...acc,
        isDefault: acc.bankAccountId === accountId
      })));
      setDefaultAccount(updatedAccount);

      return response;
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Lỗi khi đặt tài khoản mặc định';
      setError(errorMsg);
      throw err;
    } finally {
      setUpdating(prev => ({ ...prev, [accountId]: false }));
    }
  }, []);

  /**
   * Xóa tài khoản ngân hàng
   */
  const deleteBankAccount = useCallback(async (accountId) => {
    setDeleting(prev => ({ ...prev, [accountId]: true }));
    setError(null);

    try {
      const response = await BankAccountService.deleteBankAccount(accountId);
      
      // Update local state
      setAccounts(prev => prev.filter(acc => acc.bankAccountId !== accountId));
      
      // Clear default account if deleted
      if (defaultAccount?.bankAccountId === accountId) {
        setDefaultAccount(null);
      }

      return response;
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Lỗi khi xóa tài khoản';
      setError(errorMsg);
      throw err;
    } finally {
      setDeleting(prev => ({ ...prev, [accountId]: false }));
    }
  }, [defaultAccount]);

  // =========================================
  // ACTIONS - HOTEL ACCOUNTS
  // =========================================

  /**
   * Fetch danh sách tài khoản ngân hàng của hotel
   */
  const fetchHotelAccounts = useCallback(async (hotelId, filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await BankAccountService.getHotelBankAccounts(hotelId, filters);
      // Don't update main accounts state for hotel accounts
      return response;
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Lỗi khi tải danh sách tài khoản khách sạn';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // =========================================
  // ACTIONS - POPULAR BANKS
  // =========================================

  /**
   * Fetch danh sách ngân hàng phổ biến
   */
  const fetchPopularBanks = useCallback(async (limit = 20) => {
    setLoadingBanks(true);
    setError(null);
    
    try {
      const response = await BankAccountService.getPopularBanks(limit);
      setPopularBanks(response.data || []);
      return response;
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Lỗi khi tải danh sách ngân hàng';
      setError(errorMsg);
      // Fallback to static list
      setPopularBanks(BankAccountService.getVietnameseBanks().map(name => ({ bank_name: name })));
      throw err;
    } finally {
      setLoadingBanks(false);
    }
  }, []);

  // =========================================
  // ACTIONS - ADMIN
  // =========================================

  /**
   * Fetch thống kê tài khoản ngân hàng (Admin only)
   */
  const fetchBankAccountStatistics = useCallback(async () => {
    setLoadingStats(true);
    setError(null);
    
    try {
      const response = await BankAccountService.getBankAccountStatistics();
      setStatistics(response.data);
      return response;
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Lỗi khi tải thống kê';
      setError(errorMsg);
      throw err;
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // =========================================
  // UTILITY ACTIONS
  // =========================================

  /**
   * Clear errors
   */
  const clearError = useCallback(() => {
    setError(null);
    setValidationErrors({});
  }, []);

  /**
   * Reset state
   */
  const resetState = useCallback(() => {
    setAccounts([]);
    setDefaultAccount(null);
    setPopularBanks([]);
    setStatistics(null);
    setError(null);
    setValidationErrors({});
  }, []);

  // =========================================
  // COMPUTED VALUES
  // =========================================

  const contextValue = useMemo(() => ({
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
    
    // Actions - User accounts
    fetchUserAccounts,
    fetchDefaultAccount,
    createBankAccount,
    updateBankAccount,
    setAccountAsDefault,
    deleteBankAccount,
    
    // Actions - Hotel accounts
    fetchHotelAccounts,
    
    // Actions - Popular banks
    fetchPopularBanks,
    
    // Actions - Admin
    fetchBankAccountStatistics,
    
    // Utility actions
    clearError,
    resetState,
    
    // Helper functions
    formatAccountNumber: BankAccountService.formatAccountNumber,
    validateBankAccountData: BankAccountService.validateBankAccountData,
    getVietnameseBanks: BankAccountService.getVietnameseBanks,
  }), [
    accounts, defaultAccount, popularBanks, statistics,
    loading, loadingDefault, loadingBanks, loadingStats, creating, updating, deleting,
    error, validationErrors,
    fetchUserAccounts, fetchDefaultAccount, createBankAccount, updateBankAccount,
    setAccountAsDefault, deleteBankAccount, fetchHotelAccounts,
    fetchPopularBanks, fetchBankAccountStatistics, clearError, resetState
  ]);

  return (
    <BankAccountContext.Provider value={contextValue}>
      {children}
    </BankAccountContext.Provider>
  );
}