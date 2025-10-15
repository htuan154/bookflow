'use strict';
const axios = require('axios');

class VietQRService {
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
