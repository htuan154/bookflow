import React, { createContext, useCallback, useMemo, useState } from 'react';
import BankAccountService from '../api/bankAccount.service';
export const BankAccountContext = createContext(null);

export function BankAccountProvider({ children }) {
  /**
   * Fetch tất cả tài khoản ngân hàng trong hệ thống (admin)
   */
  const fetchAllBankAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await BankAccountService.getAllBankAccountsAdmin();
      console.log('🏦 Admin fetchAllBankAccounts RAW response:', response);
      console.log('🏦 Response.data:', response.data);
      console.log('🏦 Response.data type:', typeof response.data);
      console.log('🏦 Response.data.data:', response.data?.data);
      
      // Check if data is nested in response.data.data (common API pattern)
      let data = response.data?.data || response.data;
      if (!Array.isArray(data)) data = [];
      console.log('🏦 Admin bank accounts FINAL data:', data);
      console.log('🏦 Admin bank accounts count:', data.length);
      setAccounts(data);
      return response;
    } catch (err) {
      console.error('❌ Admin fetchAllBankAccounts error:', err);
      const errorMsg = err?.response?.data?.message || err?.message || 'Lỗi khi tải tất cả tài khoản ngân hàng';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  // =========================================
  // STATE MANAGEMENT
  // =========================================
  // (Already declared above, remove duplicate declarations)

  // =========================================
  // STATE MANAGEMENT
  // =========================================
  
  const [accounts, setAccounts] = useState([]);
  const [defaultAccount, setDefaultAccount] = useState(null);
  const [popularBanks, setPopularBanks] = useState([]);
  const [statistics, setStatistics] = useState(null);
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [loadingDefault] = useState(false);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [creating] = useState(false);
  const [updating, setUpdating] = useState({});
  const [deleting, setDeleting] = useState({});
  
  // Error State
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // =========================================
  // ACTIONS - USER ACCOUNTS
  // =========================================

  /**
   * Fetch danh sách tài khoản ngân hàng của user
   */
  const fetchUserAccounts = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await BankAccountService.getUserBankAccounts(filters);
      let data = response;
      if (!Array.isArray(data)) data = [];
      setAccounts(data);
      return response;
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Lỗi khi tải danh sách tài khoản người dùng';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Tạo tài khoản ngân hàng mới
   */
  const createBankAccount = useCallback(async (accountData) => {
    setLoading(true);
    setError(null);
    setValidationErrors({});

    try {
      const response = await BankAccountService.createBankAccount(accountData);
      
      // Update local state
      const newAccount = response.data;
      setAccounts(prev => [...prev, newAccount]);

      // Update default account if this is set as default
      if (newAccount.isDefault) {
        setDefaultAccount(newAccount);
      }

      return response;
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Lỗi khi tạo tài khoản';
      setError(errorMsg);
      
      if (err?.response?.data?.errors) {
        setValidationErrors(err.response.data.errors);
      }
      
      throw err;
    } finally {
      setLoading(false);
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
      console.log('🏦 fetchHotelAccounts response:', response);
      let data = response.data;
      if (!Array.isArray(data)) data = [];
      setAccounts(data); // <-- Update state so UI can render
      return response;
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Lỗi khi tải danh sách tài khoản khách sạn';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

    /**
   * Bỏ mặc định tất cả tài khoản ngân hàng của hotel
   */
  const unsetDefaultBankAccountsByHotel = useCallback(async (hotelId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await BankAccountService.unsetDefaultBankAccountsByHotel(hotelId);
      // Optionally update local state if needed (refetch accounts)
      return response;
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Lỗi khi bỏ mặc định tài khoản';
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
    createBankAccount,
    updateBankAccount,
    setAccountAsDefault,
    deleteBankAccount,

    // Actions - Admin
    fetchAllBankAccounts,
    
    // Actions - Hotel accounts
    fetchHotelAccounts,
    unsetDefaultBankAccountsByHotel,
    
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
    fetchUserAccounts, createBankAccount, updateBankAccount,
    setAccountAsDefault, deleteBankAccount, fetchHotelAccounts,
    fetchPopularBanks, fetchBankAccountStatistics, fetchAllBankAccounts, clearError, resetState
  ]);

  return (
    <BankAccountContext.Provider value={contextValue}>
      {children}
    </BankAccountContext.Provider>
  );
}
