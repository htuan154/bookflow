'use strict';
const axios = require('axios');
const crypto = require('crypto');

const getEnv = (key, fallback = '') => {
  const value = process.env[key];
  if (value === undefined || value === null) return fallback;
  return typeof value === 'string' ? value.trim() : value;
};

function makePayOSSignature({ amount, cancelUrl, description, orderCode, returnUrl }) {
  const checksumKey = getEnv('PAYOS_CHECKSUM_KEY', '');
  if (!checksumKey) {
    throw new Error('PAYOS_CHECKSUM_KEY is not configured');
  }
  const payload = `amount=${amount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}`;
  return crypto.createHmac('sha256', checksumKey).update(payload).digest('hex');
}

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
      
      // ✅ Nếu status = 'paid', cập nhật luôn booking payment_status
      if (status === 'paid' && q.rows[0]?.booking_id) {
        await client.query(
          `UPDATE bookings SET payment_status='paid', last_updated_at=now() WHERE booking_id=$1`,
          [q.rows[0].booking_id]
        );
      }
      
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
    // === PayOS: tạo payment-request (polling, không webhook) ===
  async payosCreate({ orderCode, amount, description, returnUrl, cancelUrl }) {
    console.log('\n💳 ========== [PayOS Service] CREATE PAYMENT ==========');
    
    const base = getEnv('PAYOS_BASE_URL', 'https://api-merchant.payos.vn');
    const clientId = getEnv('PAYOS_CLIENT_ID');
    const apiKey = getEnv('PAYOS_API_KEY');
    const redirectUrl = getEnv('REDIRECT_URL', 'http://localhost:5173/payment/result');
    const headers = {
      'x-client-id': clientId,
      'x-api-key': apiKey,
      'Content-Type': 'application/json'
    };
    
    console.log('🔑 PayOS Config:', {
      base,
      clientId,
      hasApiKey: !!apiKey
    });
    
    // PayOS yêu cầu phải có items array
    const body = { 
      orderCode, 
      amount, 
      description: description || 'Thanh toan don',
      items: [
        {
          name: description || 'Thanh toan don',
          quantity: 1,
          price: amount
        }
      ],
      returnUrl: returnUrl || redirectUrl,
      cancelUrl: cancelUrl || redirectUrl
    };
    
    body.signature = makePayOSSignature({
      amount: body.amount,
      cancelUrl: body.cancelUrl,
      description: body.description,
      orderCode: body.orderCode,
      returnUrl: body.returnUrl
    });
    
    console.log('📤 Request to PayOS:', JSON.stringify({ ...body, signature: '[HMAC]' }, null, 2));
    
    const { data } = await axios.post(`${base}/v2/payment-requests`, body, { headers, timeout: 15000 });
    
    console.log('📥 Response from PayOS:', JSON.stringify(data, null, 2));
    
    if (!data) {
      console.log('❌ Empty response from PayOS');
      throw new Error('payOS create: empty response');
    }
    
    // Check error code
    if (data.code && data.code !== '00') {
      console.log('❌ PayOS Error:', { code: data.code, desc: data.desc });
      const err = new Error(`PayOS Error ${data.code}: ${data.desc || 'Unknown error'}`);
      err.gatewayCode = data.code;
      err.gatewayData = data;
      throw err;
    }
    
    console.log('✅ PayOS payment created successfully');
    console.log('💳 ========== [PayOS Service] DONE ==========\n');
    
    return data.data || data;
  }

  // === PayOS: lấy trạng thái theo orderCode ===
  async payosGetStatus(orderCode) {
    console.log('\n🔍 ========== [PayOS Service] GET STATUS ==========');
    console.log('📌 OrderCode:', orderCode);
    
    const base = getEnv('PAYOS_BASE_URL', 'https://api-merchant.payos.vn');
    const headers = {
      'x-client-id': getEnv('PAYOS_CLIENT_ID'),
      'x-api-key': getEnv('PAYOS_API_KEY')
    };
    
    const url = `${base}/v2/payment-requests/${orderCode}`;
    console.log('📡 GET', url);
    
    const { data } = await axios.get(url, { headers, timeout: 15000 });
    
    console.log('📥 Response from PayOS:', JSON.stringify(data, null, 2));
    
    if (!data) {
      console.log('❌ Empty response from PayOS');
      throw new Error('payOS status: empty response');
    }
    
    console.log('✅ Status retrieved successfully');
    console.log('🔍 ========== [PayOS Service] DONE ==========\n');
    
    return data.data || data;
  }

}

module.exports = new VietQRService();
