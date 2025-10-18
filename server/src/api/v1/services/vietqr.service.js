'use strict';
const axios = require('axios');

class VietQRService {
  // Cập nhật status của payment
  async updatePaymentStatus({ paymentId, txRef, status, paidAt }) {
    if (!paymentId && !txRef) throw new Error('Thiếu paymentId hoặc txRef');
    if (!status) throw new Error('Thiếu status mới');
    const db = require('../../../config/db');
    const client = await db.connect();
    try {
      const q = await client.query(
        `UPDATE payments
           SET status=$1, paid_at=COALESCE($2, paid_at)
         WHERE ${paymentId ? 'payment_id=$3' : 'tx_ref=$3'}
         RETURNING *`,
        [status, paidAt || null, paymentId || txRef]
      );
      return q.rows[0];
    } finally {
      client.release();
    }
  }
  async generateQr({ amount, addInfo = 'Thanh toán', template = 'compact' }) {
    const baseUrl = process.env.VIETQR_BASE_URL || 'https://api.vietqr.io';
    const accountNo = process.env.ADMIN_BANK_ACCOUNT;
    const accountName = process.env.ADMIN_BANK_NAME;
    const acqId = process.env.ADMIN_ACQID || '970436'; // VCB

    if (!accountNo || !accountName)
      throw new Error('Thiếu ADMIN_BANK_ACCOUNT hoặc ADMIN_BANK_NAME trong .env');

    const payload = { accountNo, accountName, acqId, amount, addInfo, template };
    const { data } = await axios.post(`${baseUrl}/v2/generate`, payload, { timeout: 10000 });

    if (!data || data.code !== '00')
      throw new Error(data?.desc || 'Lỗi tạo QR từ VietQR');
    return data.data; // { qrDataURL, qrCode }
  }
}

module.exports = new VietQRService();
