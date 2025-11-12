// src/api/v1/routes/bank_account.route.js
const express = require('express');
const {
  createBankAccount,
  getUserBankAccounts,
  getHotelBankAccounts,
  getBankAccountById,
  getDefaultBankAccount,
  updateBankAccount,
  setAsDefault,
  deleteBankAccount,
  getPopularBanks,
  getBankAccountStatistics,
  hardDeleteBankAccount
} = require('../controllers/bank_account.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireAdmin } = require('../middlewares/admin.middleware');

const router = express.Router();

// =========================================
// PUBLIC ENDPOINTS
// =========================================

/**
 * @swagger
 * /api/v1/bank-accounts/popular-banks:
 *   get:
 *     summary: Lấy danh sách ngân hàng phổ biến
 *     tags: [Bank Accounts]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Số lượng ngân hàng trả về
 *     responses:
 *       200:
 *         description: Danh sách ngân hàng phổ biến
 */
router.get('/bank-accounts/popular-banks', getPopularBanks);

// =========================================
// AUTHENTICATED ENDPOINTS
// =========================================

/**
 * @swagger
 * /api/v1/bank-accounts:
 *   post:
 *     summary: Tạo tài khoản ngân hàng mới
 *     tags: [Bank Accounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - holder_name
 *               - account_number
 *               - bank_name
 *             properties:
 *               hotel_id:
 *                 type: string
 *                 description: ID khách sạn (nếu tài khoản dành cho khách sạn)
 *               holder_name:
 *                 type: string
 *                 description: Tên chủ tài khoản
 *               account_number:
 *                 type: string
 *                 description: Số tài khoản (6-20 chữ số)
 *               bank_name:
 *                 type: string
 *                 description: Tên ngân hàng
 *               branch_name:
 *                 type: string
 *                 description: Tên chi nhánh
 *               is_default:
 *                 type: boolean
 *                 description: Đặt làm tài khoản mặc định
 *     responses:
 *       201:
 *         description: Tạo tài khoản thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
router.post('/bank-accounts', authenticate, createBankAccount);

/**
 * @swagger
 * /api/v1/bank-accounts:
 *   get:
 *     summary: Lấy danh sách tài khoản ngân hàng của user
 *     tags: [Bank Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: hotel_id
 *         schema:
 *           type: string
 *         description: Lọc theo khách sạn
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Lọc theo trạng thái
 *       - in: query
 *         name: include_inactive
 *         schema:
 *           type: boolean
 *         description: Bao gồm tài khoản bị vô hiệu hóa
 *     responses:
 *       200:
 *         description: Danh sách tài khoản ngân hàng
 */
router.get('/bank-accounts', authenticate, getUserBankAccounts);

/**
 * @swagger
 * /api/v1/bank-accounts/default:
 *   get:
 *     summary: Lấy tài khoản ngân hàng mặc định
 *     tags: [Bank Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: hotel_id
 *         schema:
 *           type: string
 *         description: ID khách sạn (để lấy tài khoản mặc định của khách sạn)
 *     responses:
 *       200:
 *         description: Tài khoản ngân hàng mặc định
 */
router.get('/bank-accounts/default', authenticate, getDefaultBankAccount);

/**
 * @swagger
 * /api/v1/bank-accounts/{id}:
 *   get:
 *     summary: Lấy thông tin tài khoản ngân hàng theo ID
 *     tags: [Bank Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID tài khoản ngân hàng
 *     responses:
 *       200:
 *         description: Thông tin tài khoản ngân hàng
 *       404:
 *         description: Không tìm thấy tài khoản
 */
router.get('/bank-accounts/:id', authenticate, getBankAccountById);

/**
 * @swagger
 * /api/v1/bank-accounts/{id}:
 *   put:
 *     summary: Cập nhật thông tin tài khoản ngân hàng
 *     tags: [Bank Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID tài khoản ngân hàng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               holder_name:
 *                 type: string
 *               account_number:
 *                 type: string
 *               bank_name:
 *                 type: string
 *               branch_name:
 *                 type: string
 *               is_default:
 *                 type: boolean
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/bank-accounts/:id', authenticate, updateBankAccount);

/**
 * @swagger
 * /api/v1/bank-accounts/{id}/set-default:
 *   put:
 *     summary: Đặt tài khoản làm mặc định
 *     tags: [Bank Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID tài khoản ngân hàng
 *     responses:
 *       200:
 *         description: Đặt mặc định thành công
 */
router.put('/bank-accounts/:id/set-default', authenticate, setAsDefault);

/**
 * @swagger
 * /api/v1/bank-accounts/{id}:
 *   delete:
 *     summary: Xóa tài khoản ngân hàng (soft delete)
 *     tags: [Bank Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID tài khoản ngân hàng
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/bank-accounts/:id', authenticate, deleteBankAccount);

/**
 * @swagger
 * /api/v1/hotels/{hotelId}/bank-accounts:
 *   get:
 *     summary: Lấy danh sách tài khoản ngân hàng của khách sạn
 *     tags: [Bank Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hotelId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID khách sạn
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Lọc theo trạng thái
 *       - in: query
 *         name: include_inactive
 *         schema:
 *           type: boolean
 *         description: Bao gồm tài khoản bị vô hiệu hóa
 *     responses:
 *       200:
 *         description: Danh sách tài khoản ngân hàng của khách sạn
 */
router.get('/hotels/:hotelId/bank-accounts', authenticate, getHotelBankAccounts);

// =========================================
// ADMIN ENDPOINTS
/**
 * @swagger
 * /api/v1/admin/bank-accounts:
 *   get:
 *     summary: Lấy tất cả tài khoản ngân hàng trong hệ thống (Admin only)
 *     tags: [Admin Bank Accounts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách tài khoản ngân hàng
 */
router.get('/admin/bank-accounts', authenticate, requireAdmin, require('../controllers/bank_account.controller').getAllBankAccountsAdmin);
// =========================================

/**
 * @swagger
 * /api/v1/admin/bank-accounts/statistics:
 *   get:
 *     summary: Lấy thống kê tài khoản ngân hàng (Admin only)
 *     tags: [Admin Bank Accounts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thống kê tài khoản ngân hàng
 */
router.get('/admin/bank-accounts/statistics', authenticate, requireAdmin, getBankAccountStatistics);

/**
 * @swagger
 * /api/v1/admin/bank-accounts/{id}/hard-delete:
 *   delete:
 *     summary: Xóa tài khoản ngân hàng vĩnh viễn (Admin only)
 *     tags: [Admin Bank Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID tài khoản ngân hàng
 *     responses:
 *       200:
 *         description: Xóa vĩnh viễn thành công
 */
router.delete('/admin/bank-accounts/:id/hard-delete', authenticate, requireAdmin, hardDeleteBankAccount);

module.exports = router;