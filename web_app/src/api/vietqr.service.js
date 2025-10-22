// src/api/vietqr.service.js
import axiosClient from '../config/axiosClient';
import { API_ENDPOINTS } from '../config/apiEndpoints';

class VietQRService {
  /**
   * UC01 & UC02: Tạo QR code cho booking có sẵn
   * @param {string} bookingId - ID của booking
   * @returns {Promise<Object>} - {booking_id, tx_ref, amount, qr_image, qr_code}
   */
  async createQRForBooking(bookingId) {
    try {
      const response = await axiosClient.post(
        API_ENDPOINTS.VIETQR.CREATE_QR_FOR_BOOKING(bookingId)
      );
      return response.data;
    } catch (error) {
      console.error('VietQR - Lỗi tạo QR cho booking:', error);
      throw error;
    }
  }

  /**
   * UC03: Tạo QR code cho walk-in tại quầy
   * @param {string} hotelId - ID của khách sạn
   * @param {Object} payload - {bookingId, amount, note}
   * @returns {Promise<Object>} - {hotel_id, booking_id, tx_ref, amount, qr_image, qr_code}
   */
  async createQRAtCounter(hotelId, payload) {
    try {
      const response = await axiosClient.post(
        API_ENDPOINTS.VIETQR.CREATE_QR_AT_COUNTER(hotelId),
        payload
      );
      return response.data;
    } catch (error) {
      console.error('VietQR - Lỗi tạo QR tại quầy:', error);
      throw error;
    }
  }

  /**
   * Giả lập webhook xác nhận thanh toán (dùng cho demo/test)
   * @param {Object} payload - {tx_ref, amount, paid_at, provider_tx_id}
   * @returns {Promise<Object>} - {ok: true/false}
   */
  async confirmPayment(payload) {
    try {
      const response = await axiosClient.post(
        API_ENDPOINTS.VIETQR.WEBHOOK_CONFIRMATION,
        payload
      );
      return response.data;
    } catch (error) {
      console.error('VietQR - Lỗi xác nhận thanh toán:', error);
      throw error;
    }
  }

  /**
   * Kiểm tra trạng thái thanh toán (polling)
   * @param {string} txRef - Transaction reference
   * @returns {Promise<Object>} - {tx_ref, status, amount, paid_at, booking_id}
   */
  async checkPaymentStatus(txRef) {
    try {
      const response = await axiosClient.get(
        API_ENDPOINTS.VIETQR.CHECK_PAYMENT_STATUS(txRef)
      );
      return response.data;
    } catch (error) {
      console.error('VietQR - Lỗi kiểm tra trạng thái:', error);
      throw error;
    }
  }

  /**
   * Cập nhật status payment
   * @param {Object} payload - {paymentId, txRef, status, paidAt}
   * @returns {Promise<Object>} - {ok: true/false, payment: {...}}
   */
  async updatePaymentStatus(payload) {
    try {
      const response = await axiosClient.patch(
        API_ENDPOINTS.VIETQR.UPDATE_PAYMENT_STATUS,
        payload
      );
      return response.data;
    } catch (error) {
      console.error('VietQR - Lỗi cập nhật status:', error);
      throw error;
    }
  }

  /**
   * Utility: Tạo payload webhook cho demo/test
   * @param {string} txRef - Transaction reference
   * @param {number} amount - Số tiền
   * @param {string} providerTxId - ID giao dịch từ VietQR (optional)
   * @returns {Object} - Payload cho webhook
   */
  createWebhookPayload(txRef, amount, providerTxId = null) {
    return {
      tx_ref: txRef,
      amount: amount,
      paid_at: new Date().toISOString(),
      provider_tx_id: providerTxId || `VQR${Date.now()}`
    };
  }

  /**
   * Utility: Download QR image
   * @param {string} qrDataURL - Base64 data URL của QR
   * @param {string} filename - Tên file download
   */
  downloadQRImage(qrDataURL, filename = 'qr-payment.png') {
    const link = document.createElement('a');
    link.href = qrDataURL;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Utility: Kiểm tra QR code đã hết hạn chưa
   * @param {string} createdAt - Thời gian tạo QR (ISO string)
   * @param {number} ttlMinutes - Thời gian sống của QR (phút)
   * @returns {boolean} - true nếu đã hết hạn
   */
  isQRExpired(createdAt, ttlMinutes = 10) {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMinutes = (now - created) / (1000 * 60);
    return diffMinutes > ttlMinutes;
  }
}

const vietqrService = new VietQRService();
export default vietqrService;