// src/api/v1/repositories/reports.repository.js
'use strict';
const pool = require('../../../config/db');
const AdminDailyRevenueByHotelItem = require('../../../models/admin_daily_revenue_by_hotel.model');
const AdminPaymentListItem = require('../../../models/admin_payment_list.model');
const AdminPayoutOverviewItem = require('../../../models/admin_payouts_overview.model');
const Payment = require('../../../models/payment.model');
const Payout = require('../../../models/payout.model');

class ReportsRepository {
  
  // =========================================
  // ADMIN REPORTS
  // =========================================
  
  /**
   * Lấy tổng hợp doanh thu theo ngày x khách sạn (daily_summary)
   */
  async getAdminDailyRevenue({ dateFrom, dateTo, hotelIds = null }) {
    let sql = `
      SELECT biz_date_vn, hotel_id, hotel_name, hotel_city,
             bookings_count, gross_sum, pg_fee_sum, admin_fee_sum, hotel_net_sum
      FROM admin_daily_revenue_by_hotel
      WHERE biz_date_vn BETWEEN $1 AND $2
    `;
    const params = [dateFrom, dateTo];
    
    if (hotelIds && hotelIds.length > 0) {
      sql += ` AND hotel_id = ANY($3::uuid[])`;
      params.push(hotelIds);
    }
    
    sql += ` ORDER BY biz_date_vn DESC, hotel_name`;
    
    const { rows } = await pool.query(sql, params);
    return rows.map(row => new AdminDailyRevenueByHotelItem(row));
  }
  
  /**
   * Lấy danh sách giao dịch thanh toán chi tiết (payments_detail)
   */
  async getPaymentsDetail({ dateFrom, dateTo, hotelIds = null }) {
    let sql = `
      SELECT payment_id, booking_id, hotel_id,
             gross_amount, admin_fee_amount, hotel_net_amount,
             tx_ref, paid_at,
             (paid_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS biz_date
      FROM payments
      WHERE status = 'paid' 
        AND paid_at IS NOT NULL
        AND (paid_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date BETWEEN $1 AND $2
    `;
    const params = [dateFrom, dateTo];
    
    if (hotelIds && hotelIds.length > 0) {
      sql += ` AND hotel_id = ANY($3::uuid[])`;
      params.push(hotelIds);
    }
    
    sql += ` ORDER BY paid_at DESC`;
    
    const { rows } = await pool.query(sql, params);
    return rows.map(row => ({
      payment_id: row.payment_id,
      booking_id: row.booking_id,
      hotel_id: row.hotel_id,
      gross_amount: row.gross_amount,
      admin_fee_amount: row.admin_fee_amount,
      hotel_net_amount: row.hotel_net_amount,
      tx_ref: row.tx_ref,
      paid_at: row.paid_at,
      biz_date: row.biz_date
    }));
  }
  
  /**
   * Tạo đề xuất payout (payout_proposals)
   */
  async getPayoutProposals({ dateFrom, dateTo, hotelIds = null }) {
    let sql = `
      SELECT 
        adh.biz_date_vn AS cover_date,
        adh.hotel_id,
        adh.hotel_net_sum AS total_net_amount,
        EXISTS (
          SELECT 1 FROM payouts po
          WHERE po.hotel_id = adh.hotel_id 
            AND po.cover_date = adh.biz_date_vn
        ) AS exists_in_payouts
      FROM admin_daily_revenue_by_hotel adh
      WHERE adh.biz_date_vn BETWEEN $1 AND $2
        AND adh.hotel_net_sum > 0
    `;
    const params = [dateFrom, dateTo];
    
    if (hotelIds && hotelIds.length > 0) {
      sql += ` AND adh.hotel_id = ANY($3::uuid[])`;
      params.push(hotelIds);
    }
    
    sql += ` ORDER BY cover_date DESC, total_net_amount DESC`;
    
    const { rows } = await pool.query(sql, params);
    return rows.map(row => ({
      cover_date: row.cover_date,
      hotel_id: row.hotel_id,
      total_net_amount: row.total_net_amount,
      exists_in_payouts: row.exists_in_payouts
    }));
  }
  
  /**
   * Lấy danh sách thanh toán admin (từ view admin_payment_list)
   */
  async getAdminPaymentList({ dateFrom, dateTo, hotelIds = null, status = null }) {
    let sql = `
      SELECT *
      FROM admin_payment_list
      WHERE 1=1
    `;
    const params = [];
    
    if (dateFrom) {
      params.push(dateFrom);
      sql += ` AND biz_date_vn >= $${params.length}`;
    }
    
    if (dateTo) {
      params.push(dateTo);
      sql += ` AND biz_date_vn <= $${params.length}`;
    }
    
    if (status) {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }
    
    if (hotelIds && hotelIds.length > 0) {
      params.push(hotelIds);
      sql += ` AND hotel_id = ANY($${params.length}::uuid[])`;
    }
    
    sql += ` ORDER BY paid_at DESC`;
    
    const { rows } = await pool.query(sql, params);
    return rows.map(row => new AdminPaymentListItem(row));
  }
  
  /**
   * Lấy tổng quan payout admin (từ view admin_payouts_overview)
   */
  async getAdminPayoutsOverview({ dateFrom, dateTo, hotelIds = null }) {
    let sql = `
      SELECT *
      FROM admin_payouts_overview
      WHERE 1=1
    `;
    const params = [];
    
    if (dateFrom) {
      params.push(dateFrom);
      sql += ` AND cover_date >= $${params.length}`;
    }
    
    if (dateTo) {
      params.push(dateTo);
      sql += ` AND cover_date <= $${params.length}`;
    }
    
    if (hotelIds && hotelIds.length > 0) {
      params.push(hotelIds);
      sql += ` AND hotel_id = ANY($${params.length}::uuid[])`;
    }
    
    sql += ` ORDER BY cover_date DESC`;
    
    const { rows } = await pool.query(sql, params);
    return rows.map(row => new AdminPayoutOverviewItem(row));
  }
  
  // =========================================
  // HOTEL OWNER REPORTS
  // =========================================
  
  /**
   * Lấy danh sách thanh toán của chủ khách sạn
   */
  async getHotelOwnerPayments({ hotelIds, dateFrom, dateTo }) {
    let sql = `
      SELECT *
      FROM hotel_owner_payment_list
      WHERE 1=1
    `;
    const params = [];
    
    if (hotelIds && hotelIds.length > 0) {
      params.push(hotelIds);
      sql += ` AND hotel_id = ANY($${params.length}::uuid[])`;
    }
    
    if (dateFrom) {
      params.push(dateFrom);
      sql += ` AND biz_date_vn >= $${params.length}`;
    }
    
    if (dateTo) {
      params.push(dateTo);
      sql += ` AND biz_date_vn <= $${params.length}`;
    }
    
    sql += ` ORDER BY paid_at DESC`;
    
    const { rows } = await pool.query(sql, params);
    return rows.map(row => new AdminPaymentListItem(row));
  }
  
  /**
   * Lấy danh sách payout của chủ khách sạn
   */
  async getHotelOwnerPayouts({ hotelIds, dateFrom, dateTo }) {
    let sql = `
      SELECT *
      FROM hotel_owner_payouts
      WHERE 1=1
    `;
    const params = [];
    
    if (hotelIds && hotelIds.length > 0) {
      params.push(hotelIds);
      sql += ` AND hotel_id = ANY($${params.length}::uuid[])`;
    }
    
    if (dateFrom) {
      params.push(dateFrom);
      sql += ` AND cover_date >= $${params.length}`;
    }
    
    if (dateTo) {
      params.push(dateTo);
      sql += ` AND cover_date <= $${params.length}`;
    }
    
    sql += ` ORDER BY cover_date DESC`;
    
    const { rows } = await pool.query(sql, params);
    return rows.map(row => new AdminPayoutOverviewItem(row));
  }
  
  // =========================================
  // CRUD OPERATIONS FOR PAYMENTS & PAYOUTS
  // =========================================
  
  /**
   * Tạo payment mới
   */
  async createPayment(paymentData) {
    const sql = `
      INSERT INTO payments (
        booking_id, hotel_id, gross_amount, pg_fee_amount, 
        admin_fee_amount, status, tx_ref, paid_at, note
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const values = [
      paymentData.booking_id,
      paymentData.hotel_id,
      paymentData.gross_amount,
      paymentData.pg_fee_amount || 0,
      paymentData.admin_fee_amount || 0,
      paymentData.status || 'paid',
      paymentData.tx_ref,
      paymentData.paid_at,
      paymentData.note
    ];
    
    const { rows } = await pool.query(sql, values);
    return new Payment(rows[0]);
  }
  
  /**
   * Tạo payout mới
   */
  async createPayout(payoutData) {
    const sql = `
      INSERT INTO payouts (
        hotel_id, cover_date, total_net_amount, status, note
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [
      payoutData.hotel_id,
      payoutData.cover_date,
      payoutData.total_net_amount,
      payoutData.status || 'scheduled',
      payoutData.note
    ];
    
    const { rows } = await pool.query(sql, values);
    return new Payout(rows[0]);
  }
  
  /**
   * Cập nhật trạng thái payout
   */
  async updatePayoutStatus(payoutId, status, note = null) {
    const sql = `
      UPDATE payouts 
      SET status = $2, note = COALESCE($3, note)
      WHERE payout_id = $1
      RETURNING *
    `;
    
    const { rows } = await pool.query(sql, [payoutId, status, note]);
    if (rows.length === 0) {
      throw new Error('Payout not found');
    }
    return new Payout(rows[0]);
  }
}

module.exports = new ReportsRepository();