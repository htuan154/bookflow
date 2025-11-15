'use strict';
const db = require('../../../config/db');
const vietqrService = require('../services/vietqr.service');
const makeTxRef = () => `PAY-${Date.now()}`;

// ✅ Helper: Tính toán payment amounts từ booking
async function calculatePaymentAmounts(client, bookingId, hotelId) {
  // 1. Tính base_amount và surcharge_amount từ booking_nightly_prices
  // Cả 2 đều lấy tổng gross_nightly_total (theo yêu cầu của bạn)
  const nightlyPrices = await client.query(
    `SELECT COALESCE(SUM(gross_nightly_total), 0) as total_price
     FROM booking_nightly_prices
     WHERE booking_id = $1`,
    [bookingId]
  );
  
  const total_price = Number(nightlyPrices.rows[0]?.total_price || 0);
  const base_amount = total_price;
  const surcharge_amount = total_price; // Giống base_amount (theo yêu cầu)

  // 2. Tính discount_amount từ booking_discounts (nếu có promotion_id)
  const bookingInfo = await client.query(
    `SELECT promotion_id FROM bookings WHERE booking_id = $1`,
    [bookingId]
  );
  
  let discount_amount = 0;
  if (bookingInfo.rows[0]?.promotion_id) {
    const discountInfo = await client.query(
      `SELECT COALESCE(discount_applied, 0) as discount
       FROM booking_discounts
       WHERE booking_id = $1
       LIMIT 1`,
      [bookingId]
    );
    discount_amount = Number(discountInfo.rows[0]?.discount || 0);
  }

  // 3. pg_fee_amount = 0
  const pg_fee_amount = 0;

  // 4. Tính admin_fee_amount từ contract
  // final_amount = surcharge_amount - discount_amount 
  // (base_amount = surcharge_amount nên KHÔNG cộng 2 lần)
  const final_amount = surcharge_amount - discount_amount;
  
  const contractInfo = await client.query(
    `SELECT c.contract_value
     FROM contracts c
     WHERE c.hotel_id = $1
       AND c.status = 'active'
       AND CURRENT_DATE BETWEEN c.start_date AND c.end_date
     LIMIT 1`,
    [hotelId]
  );
  
  const contract_value = Number(contractInfo.rows[0]?.contract_value || 0);
  const admin_fee_amount = (final_amount * contract_value) / 100;

  console.log('💰 [calculatePaymentAmounts]', {
    bookingId,
    hotelId,
    base_amount,
    surcharge_amount,
    discount_amount,
    pg_fee_amount,
    admin_fee_amount,
    final_amount,
    contract_value
  });

  return {
    base_amount,
    surcharge_amount,
    discount_amount,
    pg_fee_amount,
    admin_fee_amount,
    final_amount
  };
}

// ✅ LUỒNG 1 + 2: booking có sẵn (trả ngay hoặc check-in)
exports.createQrForBooking = async (req, res) => {
  const { bookingId } = req.params;
  const client = await db.connect();
  try {
    const b = await client.query(
      'SELECT booking_id, hotel_id, payment_status FROM bookings WHERE booking_id=$1',
      [bookingId]
    );
    if (!b.rowCount) return res.status(404).json({ error: 'Booking không tồn tại' });
    const book = b.rows[0];
    if (book.payment_status === 'paid')
      return res.status(400).json({ error: 'Booking đã thanh toán' });

    // Tính toán amounts từ booking_nightly_prices, booking_discounts, contract
    const amounts = await calculatePaymentAmounts(client, bookingId, book.hotel_id);
    
    if (amounts.final_amount <= 0)
      return res.status(400).json({ error: 'Tổng tiền không hợp lệ' });

    const txRef = makeTxRef();

    await client.query(
      `INSERT INTO payments (
         booking_id, hotel_id,
         base_amount, surcharge_amount, discount_amount,
         pg_fee_amount, admin_fee_amount,
         status, tx_ref, note
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,'pending',$8,'VietQR Booking')`,
      [
        bookingId, 
        book.hotel_id, 
        amounts.base_amount,
        amounts.surcharge_amount,
        amounts.discount_amount,
        amounts.pg_fee_amount,
        amounts.admin_fee_amount,
        txRef
      ]
    );

    const qr = await vietqrService.generateQr({
      amount: amounts.final_amount,
      addInfo: `BOOKING ${bookingId} - ${txRef}`
    });

    res.json({ 
      booking_id: bookingId, 
      tx_ref: txRef, 
      amount: amounts.final_amount, 
      qr_image: qr.qrDataURL, 
      qr_code: qr.qrCode 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};

// ✅ LUỒNG 3: khách walk-in → tạo booking tại quầy & thanh toán luôn
exports.createQrAtCounter = async (req, res) => {
  const { hotelId } = req.params;
  const { bookingId, amount, note } = req.body;
  if (!bookingId) return res.status(400).json({ error: 'Thiếu bookingId' });

  const client = await db.connect();
  try {
    // Tính toán amounts từ booking_nightly_prices, booking_discounts, contract
    const amounts = await calculatePaymentAmounts(client, bookingId, hotelId);
    
    if (amounts.final_amount <= 0)
      return res.status(400).json({ error: 'Tổng tiền không hợp lệ' });

    const txRef = makeTxRef();

    await client.query(
      `INSERT INTO payments (
         booking_id, hotel_id,
         base_amount, surcharge_amount, discount_amount,
         pg_fee_amount, admin_fee_amount,
         status, tx_ref, note
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,'pending',$8,$9)`,
      [
        bookingId, 
        hotelId, 
        amounts.base_amount,
        amounts.surcharge_amount,
        amounts.discount_amount,
        amounts.pg_fee_amount,
        amounts.admin_fee_amount,
        txRef,
        note || 'VietQR Walk-in'
      ]
    );

    const qr = await vietqrService.generateQr({
      amount: amounts.final_amount,
      addInfo: `WALKIN ${hotelId} - ${txRef}`
    });

    res.json({ 
      hotel_id: hotelId, 
      booking_id: bookingId, 
      tx_ref: txRef, 
      amount: amounts.final_amount, 
      qr_image: qr.qrDataURL, 
      qr_code: qr.qrCode 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};

// ✅ Xác nhận thanh toán (giả lập/webhook thật)
exports.vietqrWebhook = async (req, res) => {
  const { tx_ref, amount, paid_at, provider_tx_id } = req.body;
  console.log('📥 [WEBHOOK] Received payload:', { tx_ref, amount, paid_at, provider_tx_id });
  
  if (!tx_ref) {
    console.error('❌ [WEBHOOK] Missing tx_ref');
    return res.status(400).json({ ok: false, reason: 'missing tx_ref' });
  }

  const client = await db.connect();
  try {
    const q = await client.query(
      'SELECT payment_id, booking_id, status FROM payments WHERE tx_ref=$1',
      [tx_ref]
    );
    
    if (!q.rowCount) {
      console.log('⚠️ [WEBHOOK] No payment found for tx_ref:', tx_ref);
      return res.json({ ok: true, note: 'no local payment' });
    }

    const p = q.rows[0];
    console.log('📋 [WEBHOOK] Payment found:', p);
    
    if (p.status === 'paid') {
      console.log('✅ [WEBHOOK] Already paid');
      return res.json({ ok: true, note: 'already paid' });
    }

    console.log('💰 [WEBHOOK] Updating payment to paid:', { payment_id: p.payment_id });

    // Chỉ cập nhật status và paid_at, các amounts đã được tính khi tạo payment
    await client.query(
      `UPDATE payments
         SET status='paid', paid_at=$2
       WHERE payment_id=$1`,
      [p.payment_id, paid_at || new Date().toISOString()]
    );

    if (p.booking_id) {
      console.log('📝 [WEBHOOK] Updating booking payment_status:', p.booking_id);
      await client.query(
        'UPDATE bookings SET payment_status=\'paid\', last_updated_at=now() WHERE booking_id=$1', 
        [p.booking_id]
      );
    }

    console.log('✅ [WEBHOOK] Payment confirmed successfully');
    res.json({ ok: true });
  } catch (err) {
    console.error('❌ [WEBHOOK] Error:', err.message);
    console.error('Stack:', err.stack);
    res.status(500).json({ ok: false, error: err.message });
  } finally {
    client.release();
  }
};

// Cập nhật status payment (API)
exports.updatePaymentStatus = async (req, res) => {
  const { paymentId, txRef, status, paidAt } = req.body;
  try {
    const updated = await vietqrService.updatePaymentStatus({ paymentId, txRef, status, paidAt });
    if (!updated) return res.status(404).json({ error: 'Payment không tồn tại' });
    res.json({ ok: true, payment: updated });
  } catch (err) {
    console.error('❌ [UPDATE PAYMENT STATUS] Error:', err.message);
    res.status(400).json({ ok: false, error: err.message });
  }
};

// ✅ Kiểm tra trạng thái thanh toán (cho UI polling)
exports.checkPaymentStatus = async (req, res) => {
  const { txRef } = req.params;
  const client = await db.connect();
  try {
    const q = await client.query(
      `SELECT payment_id, booking_id, base_amount, status, paid_at, tx_ref 
       FROM payments WHERE tx_ref=$1`,
      [txRef]
    );
    
    if (!q.rowCount) {
      return res.status(404).json({ error: 'Payment không tồn tại' });
    }

    const payment = q.rows[0];
    
    res.json({
      tx_ref: payment.tx_ref,
      status: payment.status,
      amount: Number(payment.base_amount),
      paid_at: payment.paid_at,
      booking_id: payment.booking_id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};

const buildPayOSDescription = (desc, orderCode) => {
  const maxLen = 25;
  const suffix = `#${orderCode}`;
  const base = (desc || 'Thanh toan don').replace(/\s+/g, ' ').trim();
  const allowed = Math.max(0, maxLen - suffix.length - 1);
  const truncated = base.slice(0, allowed).trim() || 'Thanh toan';
  return `${truncated} ${suffix}`.slice(0, maxLen).trim();
};

// === PayOS: tạo đơn thanh toán (POLLING, không webhook) ===
exports.createPayOSPayment = async (req, res) => {
  const client = await db.connect();
  try {
    // chấp nhận camelCase / snake_case
    const booking_id = req.body.booking_id ?? req.body.bookingId;
    let   hotel_id   = req.body.hotel_id   ?? req.body.hotelId; // có thể không gửi từ FE
    const description = req.body.description || 'Thanh toan don';

    if (!booking_id) {
      return res.status(400).json({ ok:false, message:'bookingId là bắt buộc' });
    }

    // ⬇️ Lookup hotel_id từ booking nếu FE không gửi
    if (!hotel_id) {
      // TH1: bookings có cột hotel_id
      const q1 = await client.query(
        `select hotel_id from bookings where booking_id = $1 limit 1`,
        [booking_id]
      );
      hotel_id = q1.rows?.[0]?.hotel_id;

      // TH2 (fallback): join rooms nếu bookings không có cột hotel_id
      if (!hotel_id) {
        const q2 = await client.query(
          `select r.hotel_id
             from bookings b
             join rooms r on r.room_id = b.room_id
            where b.booking_id = $1
            limit 1`,
          [booking_id]
        );
        hotel_id = q2.rows?.[0]?.hotel_id;
      }
      if (!hotel_id) {
        return res.status(404).json({ ok:false, message:'Không tìm thấy hotel_id cho booking này' });
      }
    }

    // Tính toán amounts từ booking_nightly_prices, booking_discounts, contract
    const amounts = await calculatePaymentAmounts(client, booking_id, hotel_id);
    
    if (amounts.final_amount <= 0) {
      return res.status(400).json({ ok:false, message:'Tổng tiền không hợp lệ' });
    }

    const makeOrderCode = () => {
      const ts = String(Date.now()).slice(-7);
      const rand = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
      return Number(`${ts}${rand}`.slice(-11));
    };

    let payosData = null;
    let orderCode = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      orderCode = makeOrderCode();
      try {
        const safeDescription = buildPayOSDescription(description, orderCode);
        payosData = await vietqrService.payosCreate({
          orderCode,
          amount: amounts.final_amount,
          description: safeDescription
        });
        break;
      } catch (err) {
        if (err?.gatewayCode === '231' && attempt < 2) {
          console.warn(`⚠️  PayOS orderCode trùng (#${orderCode}). Thử lại (lần ${attempt + 2}/3)...`);
          continue;
        }
        throw err;
      }
    }

    if (!payosData) {
      throw new Error('Không thể tạo PayOS order sau 3 lần thử');
    }
    
    console.log('📦 PayOS API Response:', JSON.stringify(payosData, null, 2));
    
    const checkoutUrl = payosData.checkoutUrl || payosData.checkoutUrlWeb || payosData.checkoutUrlApp;
    const qrCode = payosData.qrCode || payosData.qrCodeUrl || payosData.qrDataURL;

    // 2) Lưu PENDING vào DB với amounts đã tính
    await client.query(
      `INSERT INTO payments (
         booking_id, hotel_id,
         base_amount, surcharge_amount, discount_amount,
         pg_fee_amount, admin_fee_amount,
         status, tx_ref, note
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,'pending',$8,'PayOS (polling)')`,
      [
        booking_id, 
        hotel_id, 
        amounts.base_amount,
        amounts.surcharge_amount,
        amounts.discount_amount,
        amounts.pg_fee_amount,
        amounts.admin_fee_amount,
        String(orderCode)
      ]
    );

    return res.json({ 
      ok: true, 
      tx_ref: String(orderCode),  // Frontend expects tx_ref
      orderId: String(orderCode), 
      checkout_url: checkoutUrl || null,  // Frontend expects checkout_url
      checkoutUrl: checkoutUrl || null,   // Keep for backward compatibility
      qr_image: qrCode || null,  // Frontend expects qr_image
      qrCode: qrCode || null     // Keep for backward compatibility
    });
  } catch (err) {
    const gatewayPayload = err?.gatewayData || err?.response?.data || null;
    console.error('❌ [PayOS create] Error:', gatewayPayload || err.message);
    return res.status(500).json({
      ok:false,
      message: err?.message || 'create payment failed',
      gatewayCode: err?.gatewayCode || gatewayPayload?.code || null,
      gatewayDesc: gatewayPayload?.desc || gatewayPayload?.message || null
    });
  } finally {
    client.release();
  }
};

// === PayOS: kiểm tra trạng thái (PAID -> update DB) ===
exports.checkPayOSStatus = async (req, res) => {
  const { orderCode } = req.params;
  if (!orderCode) return res.status(400).json({ ok:false, message:'orderCode required' });

  const client = await db.connect();
  try {
    // 1) hỏi PayOS
    const status = await vietqrService.payosGetStatus(orderCode);
    const gatewayStatus = String(status.status || status.payment?.status || '').toUpperCase();

    // 2) nếu PAID -> update DB (idempotent)
    if (gatewayStatus === 'PAID') {
      await client.query(
        `UPDATE payments
           SET status='paid', paid_at=now(), note=concat(coalesce(note,''),' | payOS txn ', $1)
         WHERE tx_ref=$1 AND status <> 'paid'`,
        [String(orderCode)]
      );

      // ✅ Cập nhật payment_status của booking
      await client.query(
        `UPDATE bookings
            SET payment_status='paid', last_updated_at=now()
         WHERE booking_id IN (SELECT booking_id FROM payments WHERE tx_ref=$1)`,
        [String(orderCode)]
      );
    }

    // 3) đọc trạng thái hiện tại trong DB
    const q = await client.query(
      `SELECT payment_id, booking_id, status, paid_at, tx_ref
         FROM payments WHERE tx_ref=$1 LIMIT 1`,
      [String(orderCode)]
    );
    const row = q.rows[0] || null;

    return res.json({
      ok: true,
      orderId: String(orderCode),
      gatewayStatus: gatewayStatus || 'UNKNOWN',
      dbStatus: row?.status || 'unknown',
      paid_at: row?.paid_at || null,
      booking_id: row?.booking_id || null
    });
  } catch (err) {
    console.error('❌ [PayOS status] Error:', err?.response?.data || err.message);
    return res.status(500).json({ ok:false, message:'check status failed' });
  } finally {
    client.release();
  }
};
