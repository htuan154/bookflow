// src/api/v1/services/reports.service.js
'use strict';
const reportsRepository = require('../repositories/reports.repository');

class ReportsService {
  
  /**
   * Tạo báo cáo tổng hợp Admin theo schema promtpay
   */
  async buildAdminSummaryReport({ dateFrom, dateTo, hotelFilter }) {
    // Parse hotel filter
    let hotelIds = this._parseHotelFilter(hotelFilter);
    
    // Validate dates
    this._validateDateRange(dateFrom, dateTo);
    
    // Fetch data parallel từ repository
    const [dailySummary, payoutProposals, paymentsDetail] = await Promise.all([
      reportsRepository.getAdminDailyRevenue({ 
        dateFrom, 
        dateTo, 
        hotelIds 
      }),
      reportsRepository.getPayoutProposals({ 
        dateFrom, 
        dateTo, 
        hotelIds 
      }),
      reportsRepository.getPaymentsDetail({ 
        dateFrom, 
        dateTo, 
        hotelIds 
      })
    ]);
    
    // Format response theo đúng schema promtpay
    return {
      meta: {
        timezone: "Asia/Ho_Chi_Minh",
        date_from: dateFrom,
        date_to: dateTo,
        filtered_hotels: hotelIds || "ALL"
      },
      daily_summary: this._formatDailySummary(dailySummary),
      payout_proposals: payoutProposals,
      payments_detail: paymentsDetail
    };
  }
  
  /**
   * Lấy danh sách thanh toán Admin với phân trang và lọc
   */
  async getAdminPaymentsList({ dateFrom, dateTo, hotelFilter, status, page = 1, limit = 50 }) {
    let hotelIds = this._parseHotelFilter(hotelFilter);
    
    const payments = await reportsRepository.getAdminPaymentList({
      dateFrom,
      dateTo,
      hotelIds,
      status
    });
    
    // Apply pagination (nếu cần)
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPayments = payments.slice(startIndex, endIndex);
    
    return {
      data: paginatedPayments,
      meta: {
        total: payments.length,
        page,
        limit,
        totalPages: Math.ceil(payments.length / limit)
      }
    };
  }
  
  /**
   * Lấy tổng quan Payout Admin với thống kê
   */
  async getAdminPayoutsOverview({ dateFrom, dateTo, hotelFilter }) {
    let hotelIds = this._parseHotelFilter(hotelFilter);
    
    const payouts = await reportsRepository.getAdminPayoutsOverview({
      dateFrom,
      dateTo,
      hotelIds
    });
    
    // Tính thống kê
    const statistics = this._calculatePayoutStatistics(payouts);
    
    return {
      data: payouts,
      statistics
    };
  }
  
  /**
   * Lấy báo cáo thanh toán của Hotel Owner (với ownership check)
   */
  async getOwnerPaymentsReport({ userId, hotelId, dateFrom, dateTo }) {
    // TODO: Implement ownership validation
    // const isOwner = await this._validateHotelOwnership(userId, hotelId);
    // if (!isOwner) throw new Error('Access denied: Not hotel owner');
    
    const hotelIds = hotelId ? [hotelId] : null;
    
    const payments = await reportsRepository.getHotelOwnerPayments({
      hotelIds,
      dateFrom,
      dateTo
    });
    
    // Tính toán thống kê cho owner
    const statistics = this._calculateOwnerPaymentStatistics(payments);
    
    return {
      data: payments,
      statistics,
      summary: {
        total_payments: payments.length,
        date_range: { from: dateFrom, to: dateTo },
        hotel_id: hotelId
      }
    };
  }
  
  /**
   * Lấy báo cáo payout của Hotel Owner
   */
  async getOwnerPayoutsReport({ userId, hotelId, dateFrom, dateTo }) {
    // TODO: Implement ownership validation
    
    const hotelIds = hotelId ? [hotelId] : null;
    
    const payouts = await reportsRepository.getHotelOwnerPayouts({
      hotelIds,
      dateFrom,
      dateTo
    });
    
    const statistics = this._calculateOwnerPayoutStatistics(payouts);
    
    return {
      data: payouts,
      statistics,
      summary: {
        total_payouts: payouts.length,
        date_range: { from: dateFrom, to: dateTo },
        hotel_id: hotelId
      }
    };
  }
  
  /**
   * Tạo payment mới (business logic)
   */
  async createPayment(paymentData) {
    // Validate payment data
    this._validatePaymentData(paymentData);
    // Không cần tính final_amount và hotel_net_amount, DB sẽ tự động tính bằng GENERATED ALWAYS AS
    // Set default paid_at if not provided
    if (!paymentData.paid_at && paymentData.status === 'paid') {
      paymentData.paid_at = new Date();
    }

    return await reportsRepository.createPayment(paymentData);
  }
  
  /**
   * Tạo payout mới (business logic)
   */
  async createPayout(payoutData) {
    const pool = require('../../../config/db');
    
    // Normalize cover_date: strip time if it's a timestamp
    // Convert "2025-10-22T17:00:00.000Z" → "2025-10-22"
    if (payoutData.cover_date && typeof payoutData.cover_date === 'string') {
      payoutData.cover_date = payoutData.cover_date.split('T')[0];
    }
    
    console.log('🔍 Creating payout for:', { 
      hotel_id: payoutData.hotel_id, 
      cover_date: payoutData.cover_date 
    });
    
    // If total_net_amount not provided, calculate it from daily revenue
    if (!payoutData.total_net_amount) {
      console.log('🔍 Querying revenue with params:', {
        dateFrom: payoutData.cover_date,
        dateTo: payoutData.cover_date,
        hotelIds: [payoutData.hotel_id]
      });
      
      const dailyRevenue = await reportsRepository.getAdminDailyRevenue({
        dateFrom: payoutData.cover_date,
        dateTo: payoutData.cover_date,
        hotelIds: [payoutData.hotel_id]
      });
      
      console.log('📊 Daily revenue query result:', {
        rows: dailyRevenue.length,
        data: dailyRevenue.length > 0 ? dailyRevenue.map(r => ({
          bizDateVn: r.bizDateVn,
          hotelId: r.hotelId,
          hotelNetSum: r.hotelNetSum
        })) : []
      });
      
      if (dailyRevenue.length === 0) {
        // Debug: Check if there are ANY payments for this hotel
        const debugQuery = `
          SELECT 
            COUNT(*) as total_payments,
            MIN((paid_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date) as earliest_date,
            MAX((paid_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date) as latest_date
          FROM payments 
          WHERE hotel_id = $1 AND status = 'paid' AND paid_at IS NOT NULL
        `;
        const debugResult = await pool.query(debugQuery, [payoutData.hotel_id]);
        console.log('🔍 Debug - Hotel payment summary:', debugResult.rows[0]);
        
        throw new Error(
          `No revenue data found for this hotel and date (${payoutData.cover_date}). ` +
          `Hotel has ${debugResult.rows[0].total_payments} total paid bookings ` +
          `from ${debugResult.rows[0].earliest_date} to ${debugResult.rows[0].latest_date}. ` +
          `Please use a date within this range.`
        );
      }
      
      // Calculate total_net_amount from daily revenue
      payoutData.total_net_amount = dailyRevenue.reduce((sum, item) => {
        return sum + parseFloat(item.hotelNetSum || 0);
      }, 0);
      
      console.log('💵 Revenue calculated:', payoutData.total_net_amount);
    }
    
    // ========================================
    // LẤY THÔNG TIN HỢP ĐỒNG ĐỂ TÍNH HOA HỒNG
    // ========================================
    // Ưu tiên: 1) contract_value < 100 (là %), 2) created_at mới nhất, 3) signed_date mới nhất
    const contractQuery = `
      SELECT contract_value, status, contract_id, start_date, end_date, created_at, currency
      FROM contracts
      WHERE hotel_id = $1 
        AND status IN ('approved', 'active', 'draft')
        AND start_date <= $2::date
        AND (end_date IS NULL OR end_date >= $2::date)
      ORDER BY 
        CASE WHEN contract_value <= 100 THEN 0 ELSE 1 END,
        created_at DESC, 
        signed_date DESC
      LIMIT 1
    `;
    
    console.log('🔍 Searching contract with params:', {
      hotel_id: payoutData.hotel_id,
      cover_date: payoutData.cover_date
    });
    
    // Debug: List ALL contracts for this hotel and date
    const debugAllQuery = `
      SELECT contract_id, contract_value, currency, status, start_date, end_date, created_at
      FROM contracts
      WHERE hotel_id = $1 
        AND start_date <= $2::date
        AND (end_date IS NULL OR end_date >= $2::date)
      ORDER BY 
        CASE WHEN contract_value <= 100 THEN 0 ELSE 1 END,
        created_at DESC
    `;
    const allContractsResult = await pool.query(debugAllQuery, [
      payoutData.hotel_id,
      payoutData.cover_date
    ]);
    console.log('🔍 ALL contracts matching date range:', allContractsResult.rows);
    
    const contractResult = await pool.query(contractQuery, [
      payoutData.hotel_id,
      payoutData.cover_date
    ]);
    
    console.log('📋 Contract query result:', {
      rows: contractResult.rows.length,
      data: contractResult.rows
    });
    
    if (contractResult.rows.length === 0) {
      // Debug: Check if ANY contract exists for this hotel
      const debugContractQuery = `
        SELECT contract_id, status, start_date, end_date, contract_value
        FROM contracts
        WHERE hotel_id = $1
        ORDER BY created_at DESC
        LIMIT 5
      `;
      const debugResult = await pool.query(debugContractQuery, [payoutData.hotel_id]);
      
      console.log('🔍 Debug - All contracts for this hotel:', debugResult.rows);
      
      throw new Error(
        'No active approved contract found for this hotel. ' +
        `Found ${debugResult.rows.length} total contracts. ` +
        'Please ensure contract is approved and valid for this date.'
      );
    }
    
    const contract = contractResult.rows[0];
    let commissionRate = parseFloat(contract.contract_value || 0);
    
    // BACKWARD COMPATIBILITY: Handle old contracts where contract_value is actual amount (VND)
    // If value > 100, it's likely an old contract with actual value instead of percentage
    if (commissionRate > 100) {
      console.warn(`⚠️ Old contract format detected: contract_value = ${commissionRate} (contract amount in VND)`);
      console.warn(`⚠️ Using default 10% commission rate. Please update contract to use percentage (0-100%).`);
      commissionRate = 10; // Default 10% for backward compatibility
    }
    
    // Validate commission rate is between 0-100%
    if (commissionRate < 0 || commissionRate > 100) {
      throw new Error(`Invalid commission rate: ${commissionRate}%. Commission must be between 0-100%. Please update the contract.`);
    }
    
    console.log('📋 Contract found:', { 
      contract_id: contract.contract_id,
      status: contract.status,
      contract_value_raw: contract.contract_value,
      commission_rate: `${commissionRate}%`,
      is_old_format: parseFloat(contract.contract_value) > 100,
      start_date: contract.start_date,
      end_date: contract.end_date
    });
    
    // ========================================
    // LẤY TÀI KHOẢN NGÂN HÀNG CHỦ KHÁCH SẠN
    // ========================================
    const bankAccountQuery = `
      SELECT ba.bank_account_id, ba.holder_name, ba.account_number, 
             ba.bank_name, ba.branch_name
      FROM bank_accounts ba
      WHERE ba.hotel_id = $1 
        AND ba.status = 'active'
        AND ba.is_default = true
      LIMIT 1
    `;
    const bankResult = await pool.query(bankAccountQuery, [payoutData.hotel_id]);
    
    if (bankResult.rows.length === 0) {
      throw new Error('No active default bank account found for this hotel. Please ensure hotel owner has registered a default bank account.');
    }
    
    const bankAccount = bankResult.rows[0];
    
    console.log('🏦 Bank account found:', { 
      holder: bankAccount.holder_name,
      bank: bankAccount.bank_name,
      account: bankAccount.account_number
    });
    
    // ========================================
    // ⭐ LƯU Ý: hotel_net_sum ĐÃ TRỪ admin_fee_amount RỒI
    // Không cần trừ commission nữa, chỉ lưu thông tin để hiển thị
    // ========================================
    const hotelNetAmount = parseFloat(payoutData.total_net_amount); // Đã trừ phí quản lý
    const payoutAmount = hotelNetAmount; // Không trừ gì nữa
    
    // Tính ngược lại total_amount và commission_amount để hiển thị
    // total_amount = hotel_net_amount / (1 - commission_rate/100)
    const totalAmount = hotelNetAmount / (1 - commissionRate / 100);
    const commissionAmount = totalAmount - hotelNetAmount;
    
    console.log('💰 Payout calculation:', {
      totalAmount: `${totalAmount.toFixed(2)} VND (doanh thu gốc)`,
      commissionRate: `${commissionRate}%`,
      commissionAmount: `${commissionAmount.toFixed(2)} VND`,
      hotelNetAmount: `${hotelNetAmount.toFixed(2)} VND (ĐÃ TRỪ PHÍ QUẢN LÝ)`,
      payoutAmount: `${payoutAmount.toFixed(2)} VND (= hotel_net_sum)`
    });
    
    // ========================================
    // LƯU THÔNG TIN VÀO NOTE (JSON format)
    // ========================================
    const payoutDetails = {
      calculation: {
        total_amount: totalAmount,        // Tổng doanh thu gốc (chưa trừ gì)
        commission_rate: commissionRate,  // Tỷ lệ hoa hồng %
        commission_amount: commissionAmount, // Số tiền hoa hồng
        hotel_net_amount: hotelNetAmount, // Số tiền hotel nhận được (đã trừ phí quản lý)
        payout_amount: payoutAmount       // = hotel_net_amount (không trừ gì thêm)
      },
      bank_account: {
        bank_account_id: bankAccount.bank_account_id,
        holder_name: bankAccount.holder_name,
        account_number: bankAccount.account_number,
        bank_name: bankAccount.bank_name,
        branch_name: bankAccount.branch_name
      },
      contract: {
        contract_id: contract.contract_id,
        commission_rate: commissionRate
      },
      user_note: payoutData.note || null
    };
    
    // Ghi đè note với thông tin chi tiết
    payoutData.note = JSON.stringify(payoutDetails);
    
    // Keep total_net_amount as-is (already net of admin fee)
    payoutData.total_net_amount = payoutAmount;
    
    // Validate payout data
    this._validatePayoutData(payoutData);
    
    // Check if payout already exists for this hotel and date
    const existing = await reportsRepository.getAdminPayoutsOverview({
      dateFrom: payoutData.cover_date,
      dateTo: payoutData.cover_date,
      hotelIds: [payoutData.hotel_id]
    });
    
    if (existing.length > 0) {
      console.warn('⚠️ Payout already exists, deleting old payout and creating new one...');
      console.log('🗑️ Old payout:', existing[0]);
      
      // Delete existing payout(s)
      const pool = require('../../../config/db');
      await pool.query(
        'DELETE FROM payouts WHERE hotel_id = $1 AND cover_date = $2',
        [payoutData.hotel_id, payoutData.cover_date]
      );
      
      console.log('✅ Old payout deleted');
    }

    console.log('✅ Creating payout record...');
    const result = await reportsRepository.createPayout(payoutData);
    
    // Parse note back to details if not already parsed
    if (!result.details && result.note) {
      try {
        result.details = JSON.parse(result.note);
      } catch (e) {
        result.details = payoutDetails;
      }
    } else if (!result.details) {
      result.details = payoutDetails;
    }
    
    console.log('✅ Payout created successfully:', {
      payout_id: result.payoutId,
      amount: result.totalNetAmount
    });
    
    return result;
  }
  
  /**
   * Preview payout - Lấy thông tin chi tiết TRƯỚC KHI tạo payout
   * (Không lưu vào database)
   */
  async previewPayout(payoutData) {
    const pool = require('../../../config/db');
    
    // Normalize cover_date
    if (payoutData.cover_date && typeof payoutData.cover_date === 'string') {
      payoutData.cover_date = payoutData.cover_date.split('T')[0];
    }
    
    console.log('🔍 Previewing payout for:', { 
      hotel_id: payoutData.hotel_id, 
      cover_date: payoutData.cover_date 
    });
    
    // Calculate revenue
    const dailyRevenue = await reportsRepository.getAdminDailyRevenue({
      dateFrom: payoutData.cover_date,
      dateTo: payoutData.cover_date,
      hotelIds: [payoutData.hotel_id]
    });
    
    if (dailyRevenue.length === 0) {
      throw new Error('No revenue data found for this hotel and date.');
    }
    
    const totalAmount = dailyRevenue.reduce((sum, item) => {
      return sum + parseFloat(item.hotelNetSum || 0);
    }, 0);
    
    // Get contract
    const contractQuery = `
      SELECT contract_value, status, contract_id, start_date, end_date, created_at, currency
      FROM contracts
      WHERE hotel_id = $1 
        AND status IN ('approved', 'active', 'draft')
        AND start_date <= $2::date
        AND (end_date IS NULL OR end_date >= $2::date)
      ORDER BY 
        CASE WHEN contract_value <= 100 THEN 0 ELSE 1 END,
        created_at DESC, 
        signed_date DESC
      LIMIT 1
    `;
    
    const contractResult = await pool.query(contractQuery, [
      payoutData.hotel_id,
      payoutData.cover_date
    ]);
    
    if (contractResult.rows.length === 0) {
      throw new Error('No active contract found for this hotel.');
    }
    
    const contract = contractResult.rows[0];
    let commissionRate = parseFloat(contract.contract_value || 0);
    
    if (commissionRate > 100) {
      console.warn(`⚠️ Old contract format detected, using default 10%`);
      commissionRate = 10;
    }
    
    if (commissionRate < 0 || commissionRate > 100) {
      throw new Error(`Invalid commission rate: ${commissionRate}%`);
    }
    
    // Get bank account
    const bankAccountQuery = `
      SELECT ba.bank_account_id, ba.holder_name, ba.account_number, 
             ba.bank_name, ba.branch_name
      FROM bank_accounts ba
      WHERE ba.hotel_id = $1 
        AND ba.status = 'active'
        AND ba.is_default = true
      LIMIT 1
    `;
    const bankResult = await pool.query(bankAccountQuery, [payoutData.hotel_id]);
    
    if (bankResult.rows.length === 0) {
      throw new Error('No active default bank account found for this hotel.');
    }
    
    const bankAccount = bankResult.rows[0];
    
    // ⭐ Calculate payout: hotel_net_sum ĐÃ TRỪ admin_fee rồi, không trừ thêm
    const hotelNetAmount = totalAmount; // Đã trừ phí quản lý
    const payoutAmount = hotelNetAmount; // Không trừ gì nữa
    
    // Tính ngược lại total_amount và commission_amount để hiển thị
    // total_amount = hotel_net_amount / (1 - commission_rate/100)
    const grossAmount = hotelNetAmount / (1 - commissionRate / 100);
    const commissionAmount = grossAmount - hotelNetAmount;
    
    console.log('💰 Preview calculation:', {
      grossAmount: `${grossAmount.toFixed(2)} VND (doanh thu gốc)`,
      commissionRate: `${commissionRate}%`,
      commissionAmount: `${commissionAmount.toFixed(2)} VND`,
      hotelNetAmount: `${hotelNetAmount.toFixed(2)} VND (ĐÃ TRỪ PHÍ QUẢN LÝ)`,
      payoutAmount: `${payoutAmount.toFixed(2)} VND (= hotel_net_sum)`
    });
    
    // Return preview details (NOT saved to DB)
    return {
      details: {
        calculation: {
          total_amount: grossAmount,        // Tổng doanh thu gốc (chưa trừ gì)
          commission_rate: commissionRate,  // Tỷ lệ hoa hồng %
          commission_amount: commissionAmount, // Số tiền hoa hồng
          hotel_net_amount: hotelNetAmount, // Số tiền hotel nhận được (đã trừ phí quản lý)
          payout_amount: payoutAmount       // = hotel_net_amount (không trừ gì thêm)
        },
        bank_account: {
          bank_account_id: bankAccount.bank_account_id,
          holder_name: bankAccount.holder_name,
          account_number: bankAccount.account_number,
          bank_name: bankAccount.bank_name,
          branch_name: bankAccount.branch_name
        },
        contract: {
          contract_id: contract.contract_id,
          commission_rate: commissionRate
        }
      }
    };
  }
  
  /**
   * Lấy danh sách ngày có revenue cho hotel
   */
  async getHotelRevenueDates({ hotelId, dateFrom, dateTo }) {
    const pool = require('../../../config/db');
    
    const query = `
      SELECT DISTINCT
        (paid_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date as revenue_date,
        COUNT(*) as bookings_count,
        SUM(
          (base_amount + COALESCE(surcharge_amount, 0) - COALESCE(discount_amount, 0))
          - COALESCE(pg_fee_amount, 0) 
          - COALESCE(admin_fee_amount, 0)
        ) as hotel_net_amount,
        -- Check if payout exists
        (SELECT COUNT(*) FROM payouts WHERE hotel_id = $1 AND cover_date = (p.paid_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date) as payout_exists
      FROM payments p
      WHERE p.hotel_id = $1
        AND p.status = 'paid'
        AND p.paid_at IS NOT NULL
        AND (p.paid_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date BETWEEN $2 AND $3
      GROUP BY revenue_date
      ORDER BY revenue_date DESC
    `;
    
    const { rows } = await pool.query(query, [hotelId, dateFrom, dateTo]);
    
    return rows.map(row => ({
      date: row.revenue_date,
      bookingsCount: parseInt(row.bookings_count),
      hotelNetAmount: parseFloat(row.hotel_net_amount),
      payoutExists: parseInt(row.payout_exists) > 0,
      canCreatePayout: parseInt(row.payout_exists) === 0
    }));
  }
  
  /**
   * Xử lý payout hàng loạt cho ngày cụ thể
   */
  async processDailyPayouts(targetDate) {
    // Lấy tất cả daily revenue cho ngày đó
    const dailyRevenues = await reportsRepository.getAdminDailyRevenue({
      dateFrom: targetDate,
      dateTo: targetDate,
      hotelIds: null
    });
    
    const payoutResults = [];
    
    for (const revenue of dailyRevenues) {
      if (revenue.hotelNetSum > 0) {
        try {
          const payout = await this.createPayout({
            hotel_id: revenue.hotelId,
            cover_date: revenue.bizDateVn,
            total_net_amount: revenue.hotelNetSum,
            status: 'scheduled',
            note: `Auto-generated payout for ${revenue.bizDateVn}`
          });
          
          payoutResults.push({
            success: true,
            hotel_id: revenue.hotelId,
            payout_id: payout.payoutId,
            amount: revenue.hotelNetSum
          });
        } catch (error) {
          payoutResults.push({
            success: false,
            hotel_id: revenue.hotelId,
            error: error.message,
            amount: revenue.hotelNetSum
          });
        }
      }
    }
    
    return {
      date: targetDate,
      total_processed: payoutResults.length,
      successful: payoutResults.filter(r => r.success).length,
      failed: payoutResults.filter(r => !r.success).length,
      results: payoutResults
    };
  }
  
  // =========================================
  // PRIVATE HELPER METHODS
  // =========================================
  
  _parseHotelFilter(hotelFilter) {
    if (!hotelFilter || hotelFilter === 'ALL') return null;
    if (Array.isArray(hotelFilter)) return hotelFilter;
    return hotelFilter.split(',').map(id => id.trim()).filter(Boolean);
  }
  
  _validateDateRange(dateFrom, dateTo) {
    if (!dateFrom || !dateTo) {
      throw new Error('date_from and date_to are required');
    }
    
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    
    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }
    
    if (from > to) {
      throw new Error('date_from must be before or equal to date_to');
    }
  }
  
  _formatDailySummary(dailySummary) {
    // Return as-is with camelCase to match frontend expectations
    return dailySummary;
  }
  
  _calculatePayoutStatistics(payouts) {
    const data = payouts.data || payouts;
    
    return {
      total_payouts: data.length,
      total_amount: data.reduce((sum, p) => sum + (p.totalNetAmount || 0), 0),
      status_breakdown: {
        scheduled: data.filter(p => p.status === 'scheduled').length,
        processed: data.filter(p => p.status === 'processed').length,
        failed: data.filter(p => p.status === 'failed').length
      }
    };
  }
  
  _calculateOwnerPaymentStatistics(payments) {
    return {
      total_payments: payments.length,
      total_gross: payments.reduce((sum, p) => sum + (p.grossAmount || 0), 0),
      total_net: payments.reduce((sum, p) => sum + (p.hotelNetAmount || 0), 0),
      total_fees: payments.reduce((sum, p) => sum + (p.adminFeeAmount || 0) + (p.pgFeeAmount || 0), 0)
    };
  }
  
  _calculateOwnerPayoutStatistics(payouts) {
    const data = payouts.data || payouts;
    
    return {
      total_payouts: data.length,
      total_amount: data.reduce((sum, p) => sum + (p.totalNetAmount || 0), 0),
      pending_amount: data
        .filter(p => p.status === 'scheduled')
        .reduce((sum, p) => sum + (p.totalNetAmount || 0), 0),
      processed_amount: data
        .filter(p => p.status === 'processed')
        .reduce((sum, p) => sum + (p.totalNetAmount || 0), 0)
    };
  }
  
  _validatePaymentData(data) {
    const required = ['booking_id', 'hotel_id', 'base_amount'];
    for (const field of required) {
      if (!data[field]) {
        throw new Error(`${field} is required`);
      }
    }
    
    if (data.base_amount < 0) {
      throw new Error('base_amount must be non-negative');
    }
    if (data.surcharge_amount && data.surcharge_amount < 0) {
      throw new Error('surcharge_amount cannot be negative');
    }
    if (data.discount_amount && data.discount_amount < 0) {
      throw new Error('discount_amount cannot be negative');
    }
    if (data.pg_fee_amount && data.pg_fee_amount < 0) {
      throw new Error('pg_fee_amount cannot be negative');
    }
    if (data.admin_fee_amount && data.admin_fee_amount < 0) {
      throw new Error('admin_fee_amount cannot be negative');
    }
  }
  
  _validatePayoutData(data) {
    const required = ['hotel_id', 'cover_date', 'total_net_amount'];
    for (const field of required) {
      if (!data[field]) {
        throw new Error(`${field} is required`);
      }
    }
    
    if (data.total_net_amount < 0) {
      throw new Error('total_net_amount must be non-negative');
    }
  }
  
  // TODO: Implement ownership validation
  async _validateHotelOwnership(userId, hotelId) {
    // Query hotels table to check if user owns this hotel
    // const hotel = await hotelRepository.findByIdAndOwner(hotelId, userId);
    // return !!hotel;
    return true; // Temporary - always return true
  }
}

module.exports = new ReportsService();