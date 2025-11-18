// src/api/v1/controllers/bank_account.controller.js
'use strict';
const bankAccountService = require('../services/bank_account.service');

/**
 * Bỏ mặc định tất cả tài khoản ngân hàng của hotel
 * PUT /api/v1/hotels/:hotelId/bank-accounts/unset-default
 */
exports.unsetDefaultBankAccountsByHotel = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { hotelId } = req.params;

    const updatedAccounts = await bankAccountService.unsetDefaultByHotelId(hotelId, userId, userRole);

    res.json({
      success: true,
      message: 'Unset all default bank accounts for hotel',
      data: updatedAccounts
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Tạo tài khoản ngân hàng mới
 * POST /api/v1/bank-accounts
 */
exports.createBankAccount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const bankAccountData = req.body;

    const newAccount = await bankAccountService.createBankAccount(userId, bankAccountData);

    res.status(201).json({
      success: true,
      message: 'Bank account created successfully',
      data: newAccount
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy danh sách tài khoản ngân hàng của user hiện tại
 * GET /api/v1/bank-accounts
 */
exports.getUserBankAccounts = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { hotel_id, status, include_inactive } = req.query;

    const filters = {
      hotel_id,
      status,
      include_inactive: include_inactive === 'true'
    };

    const accounts = await bankAccountService.getUserBankAccounts(userId, filters);

    res.json({
      success: true,
      data: accounts,
      total: accounts.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy danh sách tài khoản ngân hàng của hotel
 * GET /api/v1/hotels/:hotelId/bank-accounts
 */
exports.getHotelBankAccounts = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { hotelId } = req.params;
    const { status, include_inactive } = req.query;

    const filters = {
      status,
      include_inactive: include_inactive === 'true'
    };

    const accounts = await bankAccountService.getHotelBankAccounts(hotelId, userId, filters);

    res.json({
      success: true,
      data: accounts,
      total: accounts.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy thông tin tài khoản ngân hàng theo ID
 * GET /api/v1/bank-accounts/:id
 */
exports.getBankAccountById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { id } = req.params;

    const account = await bankAccountService.getBankAccountById(id, userId, userRole);

    res.json({
      success: true,
      data: account
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy tài khoản ngân hàng mặc định
 * GET /api/v1/bank-accounts/default
 */
exports.getDefaultBankAccount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { hotel_id } = req.query;

    const account = await bankAccountService.getDefaultBankAccount(userId, hotel_id);

    if (!account) {
      return res.json({
        success: true,
        data: null,
        message: 'No default bank account found'
      });
    }

    res.json({
      success: true,
      data: account
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cập nhật thông tin tài khoản ngân hàng
 * PUT /api/v1/bank-accounts/:id
 */
exports.updateBankAccount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { id } = req.params;
    const updateData = req.body;

    const updatedAccount = await bankAccountService.updateBankAccount(id, userId, updateData, userRole);

    res.json({
      success: true,
      message: 'Bank account updated successfully',
      data: updatedAccount
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Đặt tài khoản làm mặc định
 * PUT /api/v1/bank-accounts/:id/set-default
 */
exports.setAsDefault = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { id } = req.params;

    const updatedAccount = await bankAccountService.setAsDefault(id, userId, userRole);

    res.json({
      success: true,
      message: 'Bank account set as default successfully',
      data: updatedAccount
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Xóa tài khoản ngân hàng (soft delete)
 * DELETE /api/v1/bank-accounts/:id
 */
exports.deleteBankAccount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { id } = req.params;

    const deletedAccount = await bankAccountService.deleteBankAccount(id, userId, userRole);

    res.json({
      success: true,
      message: 'Bank account deleted successfully',
      data: deletedAccount
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy danh sách ngân hàng phổ biến
 * GET /api/v1/bank-accounts/popular-banks
 */
exports.getPopularBanks = async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;

    const banks = await bankAccountService.getPopularBanks(parseInt(limit));

    res.json({
      success: true,
      data: banks
    });
  } catch (error) {
    next(error);
  }
};

// =========================================
// ADMIN ENDPOINTS
// =========================================


/**
 * Lấy tất cả tài khoản ngân hàng trong hệ thống (Admin only)
 * GET /api/v1/admin/bank-accounts
 */
exports.getAllBankAccountsAdmin = async (req, res, next) => {
  try {
    const userRole = req.user.role;
    if (userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied: Admin only' });
    }
    const accounts = await bankAccountService.getAllBankAccountsAdmin();
    res.json({ success: true, data: accounts, total: accounts.length });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy thống kê tài khoản ngân hàng (Admin only)
 * GET /api/v1/admin/bank-accounts/statistics
 */
exports.getBankAccountStatistics = async (req, res, next) => {
  try {
    const userRole = req.user.role;
    const stats = await bankAccountService.getBankAccountStatistics(userRole);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

/**
 * Xóa tài khoản ngân hàng vĩnh viễn (Admin only)
 * DELETE /api/v1/admin/bank-accounts/:id/hard-delete
 */
exports.hardDeleteBankAccount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { id } = req.params;

    const deletedAccount = await bankAccountService.hardDeleteBankAccount(id, userId, userRole);

    res.json({
      success: true,
      message: 'Bank account permanently deleted',
      data: deletedAccount
    });
  } catch (error) {
    next(error);
  }
};