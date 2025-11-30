// src/api/v1/services/bank_account.service.js
'use strict';
const bankAccountRepository = require('../repositories/bank_account.repository');
const BankAccount = require('../../../models/bank_account.model');

class BankAccountService {
    /**
     * Bỏ mặc định tất cả tài khoản ngân hàng của hotel (set is_default = false)
     */
    async unsetDefaultByHotelId(hotelId, userId, userRole = 'user') {
      // TODO: Validate hotel ownership for non-admin
      if (userRole !== 'admin') {
        // Implement hotel ownership check if needed
      }
      return await bankAccountRepository.unsetDefaultByHotelId(hotelId);
    }
  /**
   * Lấy tất cả tài khoản ngân hàng trong hệ thống (Admin only)
   */
  async getAllBankAccountsAdmin() {
    return await bankAccountRepository.getAll();
  }

  /**
   * Tạo tài khoản ngân hàng mới
   */
  async createBankAccount(userId, bankAccountData) {
    // Validate input
    try {
      this._validateBankAccountData(bankAccountData);
    } catch (validationError) {
      console.error('❌ Bank account validation failed:', validationError.message);
      console.error('📋 Data received:', JSON.stringify(bankAccountData, null, 2));
      throw validationError;
    }

    const { 
      hotel_id, 
      holder_name, 
      account_number, 
      bank_name, 
      branch_name, 
      is_default 
    } = bankAccountData;

    // Check if account already exists
    const accountExists = await bankAccountRepository.checkAccountExists(
      account_number, 
      bank_name
    );

    if (accountExists) {
      throw new Error('Account number already exists for this bank');
    }

    // If this is set as default, handle default logic
    if (is_default) {
      await this._validateDefaultAccount(userId, hotel_id);
    }

    // Create the account
    const newAccount = await bankAccountRepository.create({
      user_id: userId,
      hotel_id: hotel_id || null,
      holder_name: holder_name.trim(),
      account_number: account_number.trim(),
      bank_name: bank_name.trim(),
      branch_name: branch_name ? branch_name.trim() : null,
      is_default: is_default || false,
      status: 'active'
    });

    return newAccount;
  }

  /**
   * Lấy tài khoản ngân hàng theo ID
   */
  async getBankAccountById(bankAccountId, userId, userRole = 'user') {
    const account = await bankAccountRepository.getById(bankAccountId);
    
    if (!account) {
      throw new Error('Bank account not found');
    }

    // Check ownership for non-admin users
    if (userRole !== 'admin' && account.userId !== userId) {
      throw new Error('Access denied: Not account owner');
    }

    return account;
  }

  /**
   * Lấy danh sách tài khoản ngân hàng của user
   */
  async getUserBankAccounts(userId, filters = {}) {
    const { hotel_id, status, include_inactive = false } = filters;

    const queryOptions = {
      hotelId: hotel_id,
      status: include_inactive ? null : (status || 'active')
    };

    return await bankAccountRepository.getByUserId(userId, queryOptions);
  }

  /**
   * Lấy danh sách tài khoản ngân hàng của hotel
   */
  async getHotelBankAccounts(hotelId, userId, filters = {}) {
    // TODO: Validate hotel ownership
    // const isOwner = await this._validateHotelOwnership(userId, hotelId);
    // if (!isOwner) throw new Error('Access denied: Not hotel owner');

    const { status, include_inactive = false } = filters;

    const queryOptions = {
      status: include_inactive ? null : (status || 'active')
    };

    return await bankAccountRepository.getByHotelId(hotelId, queryOptions);
  }

  /**
   * Lấy tài khoản ngân hàng mặc định
   */
  async getDefaultBankAccount(userId, hotelId = null) {
    if (hotelId) {
      return await bankAccountRepository.getDefaultByHotelId(hotelId);
    } else {
      return await bankAccountRepository.getDefaultByUserId(userId);
    }
  }

  /**
   * Cập nhật thông tin tài khoản ngân hàng
   */
  async updateBankAccount(bankAccountId, userId, updateData, userRole = 'user') {
    // Get existing account
    const existingAccount = await this.getBankAccountById(bankAccountId, userId, userRole);

    // Validate update data
    this._validateUpdateData(updateData);

    const { 
      holder_name, 
      account_number, 
      bank_name, 
      branch_name, 
      is_default,
      status 
    } = updateData;

    // Check if account number is being changed and if it already exists
    if (account_number && account_number !== existingAccount.accountNumber) {
      const bankNameToCheck = bank_name || existingAccount.bankName;
      const accountExists = await bankAccountRepository.checkAccountExists(
        account_number, 
        bankNameToCheck, 
        bankAccountId
      );

      if (accountExists) {
        throw new Error('Account number already exists for this bank');
      }
    }

    // Prepare update data
    const updateFields = {};
    if (holder_name !== undefined) updateFields.holder_name = holder_name.trim();
    if (account_number !== undefined) updateFields.account_number = account_number.trim();
    if (bank_name !== undefined) updateFields.bank_name = bank_name.trim();
    if (branch_name !== undefined) updateFields.branch_name = branch_name ? branch_name.trim() : null;
    if (status !== undefined) updateFields.status = status;

    // Handle default setting separately
    let updatedAccount;
    if (is_default === true) {
      updatedAccount = await bankAccountRepository.setAsDefault(
        bankAccountId, 
        existingAccount.userId, 
        existingAccount.hotelId
      );
      
      // Update other fields if any
      if (Object.keys(updateFields).length > 0) {
        updatedAccount = await bankAccountRepository.update(bankAccountId, updateFields);
      }
    } else {
      if (is_default === false) updateFields.is_default = false;
      updatedAccount = await bankAccountRepository.update(bankAccountId, updateFields);
    }

    return updatedAccount;
  }

  /**
   * Đặt tài khoản làm mặc định
   */
  async setAsDefault(bankAccountId, userId, userRole = 'user') {
    const account = await this.getBankAccountById(bankAccountId, userId, userRole);

    if (account.status !== 'active') {
      throw new Error('Cannot set inactive account as default');
    }

    return await bankAccountRepository.setAsDefault(
      bankAccountId, 
      account.userId, 
      account.hotelId
    );
  }

  /**
   * Xóa tài khoản ngân hàng (soft delete)
   */
  async deleteBankAccount(bankAccountId, userId, userRole = 'user') {
    const account = await this.getBankAccountById(bankAccountId, userId, userRole);

    if (account.isDefault) {
      throw new Error('Cannot delete default bank account. Please set another account as default first.');
    }

    return await bankAccountRepository.delete(bankAccountId);
  }

  /**
   * Xóa tài khoản ngân hàng vĩnh viễn (hard delete)
   */
  async hardDeleteBankAccount(bankAccountId, userId, userRole = 'admin') {
    if (userRole !== 'admin') {
      throw new Error('Access denied: Admin only');
    }

    const account = await bankAccountRepository.getById(bankAccountId);
    if (!account) {
      throw new Error('Bank account not found');
    }

    return await bankAccountRepository.hardDelete(bankAccountId);
  }

  /**
   * Lấy thống kê tài khoản ngân hàng (admin only)
   */
  async getBankAccountStatistics(userRole = 'user') {
    if (userRole !== 'admin') {
      throw new Error('Access denied: Admin only');
    }

    const statistics = await bankAccountRepository.getStatistics();
    const popularBanks = await bankAccountRepository.getPopularBanks(10);

    return {
      statistics,
      popularBanks
    };
  }

  /**
   * Lấy danh sách ngân hàng phổ biến
   */
  async getPopularBanks(limit = 20) {
    return await bankAccountRepository.getPopularBanks(limit);
  }

  // =========================================
  // PRIVATE HELPER METHODS
  // =========================================

  /**
   * Validate bank account data
   */
  _validateBankAccountData(data) {
    const { holder_name, account_number, bank_name } = data;

    if (!holder_name || !holder_name.trim()) {
      throw new Error('Holder name is required');
    }

    if (!BankAccount.validateHolderName(holder_name)) {
      throw new Error('Invalid holder name format');
    }

    if (!account_number || !account_number.trim()) {
      throw new Error('Account number is required');
    }

    if (!BankAccount.validateAccountNumber(account_number)) {
      throw new Error('Invalid account number format (6-20 digits)');
    }

    if (!bank_name || !bank_name.trim()) {
      throw new Error('Bank name is required');
    }

    if (!BankAccount.validateBankName(bank_name)) {
      throw new Error('Invalid bank name format');
    }
  }

  /**
   * Validate update data
   */
  _validateUpdateData(data) {
    const { holder_name, account_number, bank_name, status } = data;

    if (holder_name !== undefined && !BankAccount.validateHolderName(holder_name)) {
      throw new Error('Invalid holder name format');
    }

    if (account_number !== undefined && !BankAccount.validateAccountNumber(account_number)) {
      throw new Error('Invalid account number format (6-20 digits)');
    }

    if (bank_name !== undefined && !BankAccount.validateBankName(bank_name)) {
      throw new Error('Invalid bank name format');
    }

    if (status !== undefined && !BankAccount.validateStatus(status)) {
      throw new Error('Invalid status. Must be active or inactive');
    }
  }

  /**
   * Validate default account constraints
   */
  async _validateDefaultAccount(userId, hotelId) {
    // This will be handled by database constraints, but we can add business logic here
    return true;
  }

  /**
   * Validate hotel ownership (TODO: implement)
   */
  async _validateHotelOwnership(userId, hotelId) {
    // TODO: Implement hotel ownership validation
    // Check if user owns the hotel
    return true;
  }
}

module.exports = new BankAccountService();