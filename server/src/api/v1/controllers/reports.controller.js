'use strict';
const reportsService = require('../services/reports.service');

/**
 * Báo cáo tổng hợp Admin theo đúng schema từ promtpay.txt
 * GET /api/v1/admin/reports/summary?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD&hotel_filter=ALL|uuid1,uuid2
 */
exports.getAdminSummaryReport = async (req, res, next) => {
  try {
    // Ăn cả snake_case & camelCase
    const date_from    = req.query.date_from ?? req.query.dateFrom;
    const date_to      = req.query.date_to   ?? req.query.dateTo;
    const hotel_filter = req.query.hotel_filter ?? req.query.hotelFilter ?? null;

    if (!date_from || !date_to) {
      return res.status(400).json({
        success: false,
        message: 'date_from and date_to are required (YYYY-MM-DD format)'
      });
    }

    const response = await reportsService.buildAdminSummaryReport({
      dateFrom: date_from,
      dateTo: date_to,
      hotelFilter: hotel_filter
    });

    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Danh sách thanh toán Admin
 * GET /api/v1/admin/reports/payments
 */
exports.getAdminPayments = async (req, res, next) => {
  try {
    // normalize
    const date_from    = req.query.date_from ?? req.query.dateFrom;
    const date_to      = req.query.date_to   ?? req.query.dateTo;
    const hotel_filter = req.query.hotel_filter ?? req.query.hotelFilter ?? null;
    const status       = req.query.status ?? undefined;

    const page  = parseInt(req.query.page  ?? 1, 10);
    const limit = parseInt(req.query.limit ?? 50, 10);

    const result = await reportsService.getAdminPaymentsList({
      dateFrom: date_from,
      dateTo: date_to,
      hotelFilter: hotel_filter,
      status,
      page,
      limit
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Tổng quan Payout Admin
 * GET /api/v1/admin/reports/payouts
 */
exports.getAdminPayouts = async (req, res, next) => {
  try {
    // normalize
    const date_from    = req.query.date_from ?? req.query.dateFrom;
    const date_to      = req.query.date_to   ?? req.query.dateTo;
    const hotel_filter = req.query.hotel_filter ?? req.query.hotelFilter ?? null;

    const result = await reportsService.getAdminPayoutsOverview({
      dateFrom: date_from,
      dateTo: date_to,
      hotelFilter: hotel_filter
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Báo cáo thanh toán của Hotel Owner
 * GET /api/v1/owner/reports/payments
 */
exports.getOwnerPayments = async (req, res, next) => {
  try {
    // normalize
    const date_from = req.query.date_from ?? req.query.dateFrom;
    const date_to   = req.query.date_to   ?? req.query.dateTo;
    const hotel_id  = req.query.hotel_id  ?? req.query.hotelId ?? null;

    const userId = req.user?.id ?? req.user?.userId ?? null;
    const userRole = req.user?.role ?? req.user?.roleId ?? req.user?.role_id ?? null;
    
    // Debug log
    console.log('🔍 [getOwnerPayments] User info:', {
      userId,
      userRole,
      userObject: req.user
    });

    const result = await reportsService.getOwnerPaymentsReport({
      userId,
      userRole,
      hotelId: hotel_id,
      dateFrom: date_from,
      dateTo: date_to
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Báo cáo payout của Hotel Owner
 * GET /api/v1/owner/reports/payouts
 */
exports.getOwnerPayouts = async (req, res, next) => {
  try {
    // normalize
    const date_from = req.query.date_from ?? req.query.dateFrom;
    const date_to   = req.query.date_to   ?? req.query.dateTo;
    const hotel_id  = req.query.hotel_id  ?? req.query.hotelId ?? null;

    const userId = req.user?.id ?? req.user?.userId ?? null;
    const userRole = req.user?.role ?? req.user?.roleId ?? req.user?.role_id ?? null;
    
    // Debug log
    console.log('🔍 [getOwnerPayouts] User info:', {
      userId,
      userRole,
      userObject: req.user
    });

    const result = await reportsService.getOwnerPayoutsReport({
      userId,
      userRole,
      hotelId: hotel_id,
      dateFrom: date_from,
      dateTo: date_to
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Tạo payout mới cho Admin
 * POST /api/v1/admin/reports/payouts
 */
exports.createAdminPayout = async (req, res, next) => {
  try {
    const { hotel_id, cover_date, note } = req.body;

    if (!hotel_id || !cover_date) {
      return res.status(400).json({
        success: false,
        message: 'hotel_id and cover_date are required'
      });
    }

    const result = await reportsService.createPayout({
      hotel_id,
      cover_date,
      note
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Payout created successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Preview payout - Lấy thông tin chi tiết TRƯỚC KHI tạo payout
 * POST /api/v1/admin/reports/payouts/preview
 */
exports.previewAdminPayout = async (req, res, next) => {
  try {
    const { hotel_id, cover_date } = req.body;

    if (!hotel_id || !cover_date) {
      return res.status(400).json({
        success: false,
        message: 'hotel_id and cover_date are required'
      });
    }

    const result = await reportsService.previewPayout({
      hotel_id,
      cover_date
    });

    res.json({
      success: true,
      data: result,
      message: 'Payout preview retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy danh sách ngày có revenue cho hotel (để chọn ngày payout)
 * GET /api/v1/admin/reports/hotels/:hotelId/revenue-dates
 */
exports.getHotelRevenueDates = async (req, res, next) => {
  try {
    const { hotelId } = req.params;
    const { dateFrom, dateTo } = req.query;

    const result = await reportsService.getHotelRevenueDates({
      hotelId,
      dateFrom: dateFrom || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days ago
      dateTo: dateTo || new Date().toISOString().split('T')[0] // today
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};
