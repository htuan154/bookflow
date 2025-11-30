// src/api/vietqr.service.js
import axiosClient from '../config/axiosClient';
import { API_ENDPOINTS } from '../config/apiEndpoints';

class VietQRService {
  normalizeQrImage(qrValue) {
    console.log('🔧 normalizeQrImage input:', qrValue?.substring(0, 100));
    
    if (!qrValue) {
      console.log('❌ No qrValue provided');
      return null;
    }
    
    const lower = qrValue.toLowerCase();
    if (lower.startsWith('data:image') || lower.startsWith('http://') || lower.startsWith('https://')) {
      console.log('✅ Already a URL/dataURL');
      return qrValue;
    }
    
    // EMVCo QR string -> convert to Google Charts API URL
    const encoded = encodeURIComponent(qrValue);
    const url = `https://chart.googleapis.com/chart?cht=qr&chs=400x400&chl=${encoded}`;
    console.log('✅ Generated QR URL:', url.substring(0, 150) + '...');
    
    return url;
  }

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
   // ================================
  // ================================
  // PayOS (create + polling status)
  // ================================
  async createPayOSPayment({ bookingId, hotelId, amount, description }) {
    console.log('\n💳 [VietQR Service] createPayOSPayment');
    console.log('📤 Request:', { bookingId, hotelId, amount, description });
    
    const payload = { bookingId, hotelId, amount, description };
    const res = await axiosClient.post(API_ENDPOINTS.PAYOS.CREATE, payload);
    
    console.log('📥 Response status:', res.status);
    console.log('📥 Response data:', JSON.stringify(res.data, null, 2));
    
    // BE trả: { ok, orderId, checkoutUrl, qrCode, qr_image }
    const d = res.data || {};
    
    console.log('🔍 Backend response fields:', {
      hasQrCode: !!d.qrCode,
      hasQrImage: !!d.qr_image,
      qrCodeLength: d.qrCode?.length,
      qrImageLength: d.qr_image?.length
    });
    
    // Prioritize qr_image (if backend already converted), fallback to qrCode
    const rawQr = d.qr_image || d.qrCode || null;
    console.log('🔍 Using rawQr:', rawQr?.substring(0, 100));
    
    const result = {
      ok: !!d.ok,
      // Chuẩn hóa để UI cũ dùng được:
      tx_ref: d.tx_ref || d.orderId,   // dùng làm khóa để poll
      qr_code: rawQr,  // Raw EMVCo QR string for QRCodeSVG component
      qr_image: this.normalizeQrImage(rawQr),  // Google Charts URL (fallback)
      checkout_url: d.checkout_url || d.checkoutUrl || null,
      amount: d.amount,
      raw: d
    };
    
    console.log('✅ Parsed result:', {
      ok: result.ok,
      tx_ref: result.tx_ref,
      has_qr_code: !!result.qr_code,
      qr_code_preview: result.qr_code?.substring(0, 100),
      has_qr_image: !!result.qr_image,
      qr_image_preview: result.qr_image?.substring(0, 150)
    });
    return result;
  }

  async checkPayOSStatus(orderCode) {
    console.log('\n🔍 [VietQR Service] checkPayOSStatus');
    console.log('📤 OrderCode:', orderCode);
    
    const res = await axiosClient.get(API_ENDPOINTS.PAYOS.STATUS(orderCode));
    
    console.log('📥 Response status:', res.status);
    console.log('📥 Response data:', JSON.stringify(res.data, null, 2));
    
    // BE trả: { ok, orderId, gatewayStatus, dbStatus, paid_at }
    const d = res.data || {};
    const result = {
      ok: !!d.ok,
      tx_ref: d.orderId,
      status: d.dbStatus === 'paid' ? 'paid' : (d.gatewayStatus || 'PENDING'),
      paid_at: d.paid_at || null,
      gatewayStatus: d.gatewayStatus,
      dbStatus: d.dbStatus
    };
    
    console.log('✅ Parsed result:', result);
    return result;
  }
}

const vietqrService = new VietQRService();
export default vietqrService;
