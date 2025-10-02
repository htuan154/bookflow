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
    
    // Calculate hotel_net_amount if not provided
    if (!paymentData.hotel_net_amount) {
      paymentData.hotel_net_amount = paymentData.gross_amount - 
        (paymentData.pg_fee_amount || 0) - 
        (paymentData.admin_fee_amount || 0);
    }
    
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
    // Validate payout data
    this._validatePayoutData(payoutData);
    
    // Check if payout already exists for this hotel and date
    const existingPayouts = await reportsRepository.getAdminPayoutsOverview({
      dateFrom: payoutData.cover_date,
      dateTo: payoutData.cover_date,
      hotelIds: [payoutData.hotel_id]
    });
    
    if (existingPayouts.data.length > 0) {
      throw new Error('Payout already exists for this hotel and date');
    }
    
    return await reportsRepository.createPayout(payoutData);
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
    const to = new Date(dateFrom);
    
    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }
    
    if (from > to) {
      throw new Error('date_from must be before or equal to date_to');
    }
  }
  
  _formatDailySummary(dailySummary) {
    return dailySummary.map(item => ({
      biz_date: item.bizDateVn,
      hotel_id: item.hotelId,
      hotel_name: item.hotelName,
      city: item.hotelCity,
      bookings_count: item.bookingsCount,
      gross_sum: item.grossSum,
      pg_fee_sum: item.pgFeeSum,
      admin_fee_sum: item.adminFeeSum,
      hotel_net_sum: item.hotelNetSum
    }));
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
    const required = ['booking_id', 'hotel_id', 'gross_amount'];
    for (const field of required) {
      if (!data[field]) {
        throw new Error(`${field} is required`);
      }
    }
    
    if (data.gross_amount < 0) {
      throw new Error('gross_amount must be non-negative');
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