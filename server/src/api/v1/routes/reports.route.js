// src/api/v1/routes/reports.route.js
const express = require('express');
const { 
  getAdminSummaryReport,
  getAdminPayments,
  getAdminPayouts,
  getOwnerPayments,
  getOwnerPayouts,
  createAdminPayout,
  previewAdminPayout,
  getHotelRevenueDates
} = require('../controllers/reports.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireAdmin, requireAdminOrOwner } = require('../middlewares/admin.middleware');

const router = express.Router();

// =========================================
// ADMIN REPORTS (cần quyền admin)
// =========================================

/**
 * @swagger
 * /api/v1/admin/reports/summary:
 *   get:
 *     summary: Báo cáo tổng hợp Admin
 *     tags: [Admin Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date_from
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày bắt đầu (YYYY-MM-DD)
 *       - in: query
 *         name: date_to
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày kết thúc (YYYY-MM-DD)
 *       - in: query
 *         name: hotel_filter
 *         schema:
 *           type: string
 *         description: Lọc khách sạn (ALL hoặc uuid1,uuid2,...)
 *     responses:
 *       200:
 *         description: Báo cáo thành công
 */
router.get('/admin/reports/summary', authenticate, requireAdmin, getAdminSummaryReport);

/**
 * @swagger
 * /api/v1/admin/reports/payments:
 *   get:
 *     summary: Danh sách thanh toán Admin
 *     tags: [Admin Reports]
 *     security:
 *       - bearerAuth: []
 */
router.get('/admin/reports/payments', authenticate, requireAdmin, getAdminPayments);

/**
 * @swagger
 * /api/v1/admin/reports/payouts:
 *   get:
 *     summary: Tổng quan Payout Admin
 *     tags: [Admin Reports]
 *     security:
 *       - bearerAuth: []
 */
router.get('/admin/reports/payouts', authenticate, requireAdmin, getAdminPayouts);

/**
 * @swagger
 * /api/v1/admin/reports/payouts:
 *   post:
 *     summary: Tạo payout mới cho Admin
 *     tags: [Admin Reports]
 *     security:
 *       - bearerAuth: []
 */
router.post('/admin/reports/payouts', authenticate, requireAdmin, createAdminPayout);

/**
 * @swagger
 * /api/v1/admin/reports/payouts/preview:
 *   post:
 *     summary: Preview payout - Lấy thông tin chi tiết TRƯỚC KHI tạo payout
 *     tags: [Admin Reports]
 *     security:
 *       - bearerAuth: []
 */
router.post('/admin/reports/payouts/preview', authenticate, requireAdmin, previewAdminPayout);

/**
 * @swagger
 * /api/v1/admin/reports/hotels/:hotelId/revenue-dates:
 *   get:
 *     summary: Lấy danh sách ngày có revenue (để chọn ngày payout)
 *     tags: [Admin Reports]
 *     security:
 *       - bearerAuth: []
 */
router.get('/admin/reports/hotels/:hotelId/revenue-dates', authenticate, requireAdmin, getHotelRevenueDates);

// =========================================
// HOTEL OWNER REPORTS (cần authentication)
// =========================================

/**
 * @swagger
 * /api/v1/owner/reports/payments:
 *   get:
 *     summary: Báo cáo thanh toán của Hotel Owner
 *     tags: [Owner Reports]
 *     security:
 *       - bearerAuth: []
 */
router.get('/owner/reports/payments', authenticate, getOwnerPayments);

/**
 * @swagger
 * /api/v1/owner/reports/payouts:
 *   get:
 *     summary: Báo cáo payout của Hotel Owner
 *     tags: [Owner Reports]
 *     security:
 *       - bearerAuth: []
 */
router.get('/owner/reports/payouts', authenticate, getOwnerPayouts);

module.exports = router;