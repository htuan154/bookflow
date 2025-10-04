import axiosClient from '../config/axiosClient';
import { API_ENDPOINTS } from '../config/apiEndpoints';

const buildQuery = (params = {}) => {
  const q = { ...params };
  if (!q.date_from || !q.date_to) {
    throw new Error('date_from and date_to are required');
  }
  return q;
};

const ReportsOwnerService = {
  /** Giao dịch của khách sạn thuộc owner đăng nhập */
  getPayments: async (params) => {
    const res = await axiosClient.get(API_ENDPOINTS.REPORTS.OWNER_PAYMENTS, {
      params: buildQuery(params),
    });
    return res.data;
  },

  /** Payouts của khách sạn thuộc owner đăng nhập */
  getPayouts: async (params) => {
    const res = await axiosClient.get(API_ENDPOINTS.REPORTS.OWNER_PAYOUTS, {
      params: buildQuery(params),
    });
    return res.data;
  },
};

export default ReportsOwnerService;
