import axiosClient from '../config/axiosClient';
import { API_ENDPOINTS } from '../config/apiEndpoints';

/**
 * Chuẩn hoá query chung (VN timezone, inclusive)
 * params: { date_from, date_to, hotels, page, page_size, status }
 */
const buildQuery = (params = {}) => {
  const q = { ...params };
  // chuẩn hoá key thường dùng
  if (!q.date_from || !q.date_to) {
    throw new Error('date_from and date_to are required');
  }
  // hotels: 'ALL' hoặc mảng UUID -> server hỗ trợ cả 2
  if (Array.isArray(q.hotels)) q.hotels = q.hotels.join(',');
  return q;
};

const ReportsAdminService = {
  /** Gộp: daily_summary + payout_proposals + payments_detail */
  getSummary: async (params) => {
    const res = await axiosClient.get(API_ENDPOINTS.REPORTS.ADMIN_SUMMARY, {
      params: buildQuery(params),
    });
    return res.data;
  },

  /** Danh sách giao dịch (có thể phân trang) */
  getPayments: async (params) => {
    const res = await axiosClient.get(API_ENDPOINTS.REPORTS.ADMIN_PAYMENTS, {
      params: buildQuery(params),
    });
    return res.data;
  },

  /** Lịch sử payouts */
  getPayouts: async (params) => {
    const res = await axiosClient.get(API_ENDPOINTS.REPORTS.ADMIN_PAYOUTS, {
      params: buildQuery(params),
    });
    return res.data;
  },

  /**
   * Tạo payout cho 1 khách sạn × 1 cover_date (YYYY-MM-DD)
   * body = { hotel_id, cover_date }
   */
  createPayout: async (body) => {
    if (!body?.hotel_id || !body?.cover_date) {
      throw new Error('hotel_id and cover_date are required');
    }
    const res = await axiosClient.post(API_ENDPOINTS.REPORTS.ADMIN_CREATE_PAYOUT, body);
    return res.data;
  },
};

export default ReportsAdminService;
