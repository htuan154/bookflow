'use strict';
const pool = require('../../../config/db');
const AdminDailyRevenueByHotelItem = require('../../../models/admin_daily_revenue_by_hotel.model');
const AdminPaymentListItem = require('../../../models/admin_payment_list.model');
const AdminPayoutOverviewItem = require('../../../models/admin_payouts_overview.model');
const HotelOwnerPaymentListItem = require('../../../models/hotel_owner_payment_list.model');
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
    // ⭐ Query trực tiếp từ view admin_daily_revenue_by_hotel (đã tính đúng)
    let sql = `
      SELECT 
        TO_CHAR(biz_date_vn, 'YYYY-MM-DD') as biz_date_vn, 
        hotel_id, 
        hotel_name, 
        hotel_city,
        bookings_count,
        final_sum,
        pg_fee_sum, 
        admin_fee_sum, 
        hotel_net_sum,
        EXISTS (
          SELECT 1 FROM payouts po
          WHERE po.hotel_id = admin_daily_revenue_by_hotel.hotel_id 
            AND po.cover_date = admin_daily_revenue_by_hotel.biz_date_vn
        ) AS exists_in_payouts
      FROM admin_daily_revenue_by_hotel
      WHERE biz_date_vn BETWEEN $1::date AND $2::date
    `;
    
    const params = [dateFrom, dateTo];

    if (hotelIds && hotelIds.length > 0) {
      sql += ` AND hotel_id = ANY($3::uuid[])`;
      params.push(hotelIds);
    }

    sql += ` ORDER BY biz_date_vn DESC, hotel_name`;

    try {
      const { rows } = await pool.query(sql, params);
      console.log('✅ getAdminDailyRevenue returned rows:', rows.length);
      if (rows.length > 0) {
        console.log('🔍 First row sample:', JSON.stringify(rows[0], null, 2));
      }
      return rows.map(row => new AdminDailyRevenueByHotelItem(row));
    } catch (err) {
      console.error('❌ Error in getAdminDailyRevenue:', err);
      throw err;
    }
  }

  /**
   * OLD CODE - Kept for reference if view is fixed later
   */
  async _getAdminDailyRevenueFromView_DEPRECATED({ dateFrom, dateTo, hotelIds = null }) {
    let sql = `
      SELECT TO_CHAR(biz_date_vn, 'YYYY-MM-DD') as biz_date_vn, 
             hotel_id, hotel_name, hotel_city,
             bookings_count,
             gross_sum AS final_sum,     -- ⭐ alias để khớp model FE
             pg_fee_sum, admin_fee_sum, hotel_net_sum,
             EXISTS (
               SELECT 1 FROM payouts po
               WHERE po.hotel_id = admin_daily_revenue_by_hotel.hotel_id 
                 AND po.cover_date = admin_daily_revenue_by_hotel.biz_date_vn
             ) AS exists_in_payouts
      FROM admin_daily_revenue_by_hotel
      WHERE biz_date_vn BETWEEN $1::date AND $2::date
    `;
    const params = [dateFrom, dateTo];

    if (hotelIds && hotelIds.length > 0) {
      sql += ` AND hotel_id = ANY($3::uuid[])`;
      params.push(hotelIds);
    }

    sql += ` ORDER BY biz_date_vn DESC, hotel_name`;

    // Try to read from materialized/view `admin_daily_revenue_by_hotel` first
    try {
      const { rows } = await pool.query(sql, params);
      return rows.map(row => new AdminDailyRevenueByHotelItem(row));
    } catch (err) {
      // If the view schema is different or missing columns (e.g. gross_sum),
      // fallback to computing aggregates directly from payments table.
      // ⚠️ IMPORTANT: Calculate amounts in SQL because GENERATED columns return 0
      if (err && err.code === '42703') {
        const fallbackSql = `
          SELECT
            agg.biz_date_vn,
            agg.hotel_id,
            agg.hotel_name,
            agg.hotel_city,
            agg.bookings_count,
            agg.final_sum,
            agg.pg_fee_sum,
            agg.admin_fee_sum,
            agg.hotel_net_sum,
            EXISTS (
              SELECT 1 FROM payouts po
              WHERE po.hotel_id = agg.hotel_id 
                AND po.cover_date = agg.biz_date_vn::date
            ) AS exists_in_payouts
          FROM (
            SELECT
              TO_CHAR((p.paid_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date, 'YYYY-MM-DD') AS biz_date_vn,
              p.hotel_id,
              h.name AS hotel_name,
              h.city AS hotel_city,
              COUNT(*) AS bookings_count,
              SUM(p.base_amount + COALESCE(p.surcharge_amount, 0) - COALESCE(p.discount_amount, 0)) AS final_sum,
              SUM(COALESCE(p.pg_fee_amount, 0)) AS pg_fee_sum,
              SUM(COALESCE(p.admin_fee_amount, 0)) AS admin_fee_sum,
              SUM(
                (p.base_amount + COALESCE(p.surcharge_amount, 0) - COALESCE(p.discount_amount, 0))
                - COALESCE(p.pg_fee_amount, 0) 
                - COALESCE(p.admin_fee_amount, 0)
              ) AS hotel_net_sum
            FROM payments p
            LEFT JOIN hotels h ON h.hotel_id = p.hotel_id
            WHERE p.status = 'paid'
              AND p.paid_at IS NOT NULL
              AND (p.paid_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date BETWEEN $1::date AND $2::date
        `;

        const fallbackParams = [dateFrom, dateTo];
        let finalSql = fallbackSql;
        if (hotelIds && hotelIds.length > 0) {
          finalSql += ` AND p.hotel_id = ANY($3::uuid[])`;
          fallbackParams.push(hotelIds);
        }

        finalSql += ` GROUP BY biz_date_vn, p.hotel_id, h.name, h.city
          ) agg
          ORDER BY agg.biz_date_vn DESC, agg.hotel_id`;

        const { rows: fbRows } = await pool.query(finalSql, fallbackParams);
        console.log('✅ Fallback getAdminDailyRevenue returned rows:', fbRows.length);
        if (fbRows.length > 0) {
          console.log('🔍 First row sample:', JSON.stringify(fbRows[0], null, 2));
        }
        return fbRows.map(row => new AdminDailyRevenueByHotelItem(row));
      }

      // rethrow if it's another error
      throw err;
    }
  }

  /**
   * Lấy danh sách giao dịch thanh toán chi tiết (payments_detail)
   */
  async getPaymentsDetail({ dateFrom, dateTo, hotelIds = null }) {
    let sql = `
      SELECT payment_id, booking_id, hotel_id,
             base_amount, surcharge_amount, discount_amount, final_amount,
             final_amount AS gross_amount,
             pg_fee_amount, admin_fee_amount, hotel_net_amount,
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
      base_amount: row.base_amount,
      surcharge_amount: row.surcharge_amount,
      discount_amount: row.discount_amount,
      final_amount: row.final_amount,
      gross_amount: row.gross_amount,
      pg_fee_amount: row.pg_fee_amount,
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

    try {
      const { rows } = await pool.query(sql, params);
      return rows.map(row => ({
        cover_date: row.cover_date,
        hotel_id: row.hotel_id,
        total_net_amount: row.total_net_amount,
        exists_in_payouts: row.exists_in_payouts
      }));
    } catch (err) {
      console.error('❌ Error querying admin_daily_revenue_by_hotel for payout proposals:', err.message);
      console.log('🔄 Returning empty payout proposals array');
      // Return empty array instead of failing - payout proposals are optional
      return [];
    }
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
    // Try view first - với filter loại bỏ payments đã có payout
    let sql = `
      SELECT hopl.*
      FROM hotel_owner_payment_list hopl
      WHERE 1=1
        -- ⭐ Loại bỏ những payment đã được tạo payout (đã thanh toán cho khách sạn)
        AND NOT EXISTS (
          SELECT 1 FROM payouts po
          WHERE po.hotel_id = hopl.hotel_id 
            AND po.cover_date = hopl.biz_date_vn
            AND po.status IN ('processed', 'scheduled')
        )
    `;
    const params = [];

    if (hotelIds && hotelIds.length > 0) {
      params.push(hotelIds);
      sql += ` AND hopl.hotel_id = ANY($${params.length}::uuid[])`;
    }

    if (dateFrom) {
      params.push(dateFrom);
      sql += ` AND hopl.biz_date_vn >= $${params.length}`;
    }

    if (dateTo) {
      params.push(dateTo);
      sql += ` AND hopl.biz_date_vn <= $${params.length}`;
    }

    sql += ` ORDER BY hopl.paid_at DESC`;

    try {
      const { rows } = await pool.query(sql, params);
      console.log('🔍 hotel_owner_payment_list view returned', rows.length, 'rows');
      
      // Check if data has valid amounts
      if (rows.length > 0) {
        const firstRow = rows[0];
        console.log('🔍 First row sample:', {
          payment_id: firstRow.payment_id?.slice(0, 8),
          final_amount: firstRow.final_amount,
          hotel_net_amount: firstRow.hotel_net_amount,
          base_amount: firstRow.base_amount
        });
        
        // If view returns data but amounts are 0/null, fallback to direct query
        // Convert to number for proper comparison (DB returns string for numeric types)
        // Check final_amount specifically since that's what matters for display
        const hasValidAmounts = rows.some(r => 
          r.final_amount && parseFloat(r.final_amount) > 0
        );
        
        if (!hasValidAmounts) {
          console.warn('⚠️ View returned rows but all final_amount are 0, falling back to payments table with calculated amounts');
          return await this._getHotelOwnerPaymentsFallback({ hotelIds, dateFrom, dateTo });
        }
      }
      
      return rows.map(row => new HotelOwnerPaymentListItem(row));
    } catch (err) {
      console.error('❌ Error querying hotel_owner_payment_list view:', err.message);
      console.log('🔄 Falling back to direct payments query');
      return await this._getHotelOwnerPaymentsFallback({ hotelIds, dateFrom, dateTo });
    }
  }

  /**
   * Fallback: lấy trực tiếp từ bảng payments + join hotels & bookings
   * Tính toán final_amount và hotel_net_amount trong query thay vì dùng GENERATED columns
   */
  async _getHotelOwnerPaymentsFallback({ hotelIds, dateFrom, dateTo }) {
    let sql = `
      SELECT 
        p.payment_id,
        p.created_at,
        p.paid_at,
        (p.paid_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS biz_date_vn,
        p.status,
        p.booking_id,
        b.user_id AS guest_id,
        b.check_in_date,
        b.check_out_date,
        p.hotel_id,
        h.name AS hotel_name,
        h.city AS hotel_city,
        p.base_amount,
        COALESCE(p.surcharge_amount, 0) AS surcharge_amount,
        COALESCE(p.discount_amount, 0) AS discount_amount,
        -- Tính final_amount: base + surcharge - discount
        (p.base_amount + COALESCE(p.surcharge_amount, 0) - COALESCE(p.discount_amount, 0)) AS final_amount,
        COALESCE(p.pg_fee_amount, 0) AS pg_fee_amount,
        COALESCE(p.admin_fee_amount, 0) AS admin_fee_amount,
        -- Tính hotel_net_amount: final - pg_fee - admin_fee
        (p.base_amount + COALESCE(p.surcharge_amount, 0) - COALESCE(p.discount_amount, 0) 
         - COALESCE(p.pg_fee_amount, 0) - COALESCE(p.admin_fee_amount, 0)) AS hotel_net_amount,
        p.tx_ref
      FROM payments p
      LEFT JOIN bookings b ON b.booking_id = p.booking_id
      LEFT JOIN hotels h ON h.hotel_id = p.hotel_id
      WHERE p.status = 'paid'
        AND p.paid_at IS NOT NULL
        -- ⭐ Loại bỏ những payment đã được tạo payout (đã thanh toán cho khách sạn)
        AND NOT EXISTS (
          SELECT 1 FROM payouts po
          WHERE po.hotel_id = p.hotel_id 
            AND po.cover_date = (p.paid_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
            AND po.status IN ('processed', 'scheduled')
        )
    `;
    const params = [];

    if (hotelIds && hotelIds.length > 0) {
      params.push(hotelIds);
      sql += ` AND p.hotel_id = ANY($${params.length}::uuid[])`;
    }

    if (dateFrom) {
      params.push(dateFrom);
      sql += ` AND (p.paid_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date >= $${params.length}`;
    }

    if (dateTo) {
      params.push(dateTo);
      sql += ` AND (p.paid_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date <= $${params.length}`;
    }

    sql += ` ORDER BY p.paid_at DESC`;

    const { rows } = await pool.query(sql, params);
    console.log('✅ Fallback query returned', rows.length, 'rows from payments table');
    if (rows.length > 0) {
      console.log('✅ First row from fallback:', {
        payment_id: rows[0].payment_id?.slice(0, 8),
        final_amount: rows[0].final_amount,
        hotel_net_amount: rows[0].hotel_net_amount,
        base_amount: rows[0].base_amount
      });
    }
    
    return rows.map(row => new HotelOwnerPaymentListItem(row));
  }

  /**
   * Lấy danh sách payout của chủ khách sạn
   */
  async getHotelOwnerPayouts({ hotelIds, dateFrom, dateTo }) {
    let sql = `
      SELECT 
        p.payout_id,
        p.hotel_id,
        p.cover_date,
        p.scheduled_at,
        p.total_net_amount,
        p.status,
        p.note,
        p.created_at
      FROM payouts p
      WHERE 1=1
    `;
    const params = [];

    if (hotelIds && hotelIds.length > 0) {
      params.push(hotelIds);
      sql += ` AND p.hotel_id = ANY($${params.length}::uuid[])`;
    }

    if (dateFrom) {
      params.push(dateFrom);
      sql += ` AND p.cover_date >= $${params.length}`;
    }

    if (dateTo) {
      params.push(dateTo);
      sql += ` AND p.cover_date <= $${params.length}`;
    }

    sql += ` ORDER BY p.cover_date DESC, p.created_at DESC`;

    const { rows } = await pool.query(sql, params);
    return rows.map(row => Payout.fromDB(row));
  }

  // =========================================
  // CRUD OPERATIONS FOR PAYMENTS & PAYOUTS
  // =========================================

  async createPayment(paymentData) {
    const sql = `
      INSERT INTO payments (
        booking_id, hotel_id, base_amount, surcharge_amount, discount_amount,
        pg_fee_amount, admin_fee_amount, status, tx_ref, paid_at, note
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    const values = [
      paymentData.booking_id,
      paymentData.hotel_id,
      paymentData.base_amount,
      paymentData.surcharge_amount || 0,
      paymentData.discount_amount || 0,
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

  async createPayout(payoutData) {
    // Lưu thông tin payout với note chứa details (JSON)
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
      payoutData.status || 'processed', // ⭐ Admin xác nhận = đã xử lý thanh toán (processed)
      payoutData.note // Chứa JSON với thông tin bank account, commission, etc.
    ];

    const { rows } = await pool.query(sql, values);
    return new Payout(rows[0]);
  }

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
