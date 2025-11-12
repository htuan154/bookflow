'use strict';
const db = require('../../../config/db');
const vietqrService = require('../services/vietqr.service');
const makeTxRef = () => `PAY-${Date.now()}`;

// ✅ Helper: Tính toán payment amounts từ booking
async function calculatePaymentAmounts(client, bookingId, hotelId) {
  console.log('\n💰 ========== BẮT ĐẦU TÍNH TOÁN PAYMENT AMOUNTS ==========');
  console.log('📌 Input:', { bookingId, hotelId });
  
  // 1. Tính base_amount từ booking_nightly_prices
  const nightlyPrices = await client.query(
    `SELECT COALESCE(SUM(gross_nightly_total), 0) as total_price
     FROM booking_nightly_prices
     WHERE booking_id = $1`,
    [bookingId]
  );
  
  const total_price = Number(nightlyPrices.rows[0]?.total_price || 0);
  const base_amount = total_price;
  
  console.log('📊 Nightly Prices:', { total_price, base_amount });

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
    console.log('🎁 Có promotion:', { promotion_id: bookingInfo.rows[0].promotion_id, discount_amount });
  } else {
    console.log('🎁 Không có promotion');
  }

  // 3. ✅ FIX: surcharge_amount = 0 (không cộng 2 lần)
  const surcharge_amount = 0;
  const pg_fee_amount = 0;

  // 4. Tính final_amount ĐÚNG: base_amount - discount_amount (KHÔNG cộng surcharge nữa)
  const final_amount = base_amount - discount_amount;
  
  console.log('🧮 Tính final_amount:', {
    formula: 'base_amount - discount_amount',
    base_amount,
    discount_amount,
    final_amount
  });
  
  // 5. Tính admin_fee_amount từ contract
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

  console.log('� Contract info:', { contract_value, admin_fee_amount });
  console.log('✅ KẾT QUẢ CUỐI CÙNG:', {
    base_amount,
    surcharge_amount,
    discount_amount,
    pg_fee_amount,
    admin_fee_amount,
    final_amount
  });
  console.log('💰 ========== KẾT THÚC TÍNH TOÁN ==========\n');

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

// === PayOS: tạo đơn thanh toán (POLLING, không webhook) ===
exports.createPayOSPayment = async (req, res) => {
  console.log('\n🚀 ========== [PayOS] TẠO ĐƠN THANH TOÁN ==========');
  console.log('📥 Request body:', JSON.stringify(req.body, null, 2));
  
  const client = await db.connect();
  try {
    // chấp nhận camelCase / snake_case
    const booking_id = req.body.booking_id ?? req.body.bookingId;
    let   hotel_id   = req.body.hotel_id   ?? req.body.hotelId; // có thể không gửi từ FE
    const description = req.body.description || 'Thanh toan don';

    console.log('📌 Parsed params:', { booking_id, hotel_id, description });

    if (!booking_id) {
      console.log('❌ Thiếu bookingId');
      return res.status(400).json({ ok:false, message:'bookingId là bắt buộc' });
    }

    // ⬇️ Lookup hotel_id từ booking nếu FE không gửi
    if (!hotel_id) {
      console.log('🔍 Tìm hotel_id từ booking...');
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
        console.log('❌ Không tìm thấy hotel_id');
        return res.status(404).json({ ok:false, message:'Không tìm thấy hotel_id cho booking này' });
      }
      console.log('✅ Tìm thấy hotel_id:', hotel_id);
    }

    // Tính toán amounts từ booking_nightly_prices, booking_discounts, contract
    console.log('🧮 Bắt đầu tính toán amounts...');
    const amounts = await calculatePaymentAmounts(client, booking_id, hotel_id);
    
    console.log('💵 Final amount to charge:', amounts.final_amount);
    
    if (amounts.final_amount <= 0) {
      console.log('❌ Số tiền không hợp lệ:', amounts.final_amount);
      return res.status(400).json({ ok:false, message:'Tổng tiền không hợp lệ' });
    }

    const makeOrderCode = () => Number(String(Date.now()).slice(-9));
    const orderCode = makeOrderCode();
    
    console.log('🔑 Generated orderCode:', orderCode);

    // 1) Gọi payOS tạo payment request (polling: KHÔNG webhookUrl)
    console.log('📡 Calling PayOS API...');
    const data = await vietqrService.payosCreate({
      orderCode,
      amount: amounts.final_amount,
      description: `${description} #${orderCode}`,
      returnUrl: process.env.REDIRECT_URL,
      cancelUrl: process.env.REDIRECT_URL
    });
    
    console.log('� PayOS API Response:', JSON.stringify(data, null, 2));
    
    const checkoutUrl = data.checkoutUrl || data.checkoutUrlWeb || data.checkoutUrlApp;
    const qrCode = data.qrCode || data.qrCodeUrl || data.qrDataURL;
    
    console.log('🔗 Extracted:', { checkoutUrl, qrCode: qrCode ? 'Có QR' : 'Không có QR' });

    // 2) Lưu PENDING vào DB với amounts đã tính
    console.log('💾 Saving payment to DB...');
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
    
    console.log('✅ Payment saved to DB');
    console.log('🚀 ========== [PayOS] HOÀN TẤT ==========\n');

    return res.json({ 
      ok: true, 
      orderId: String(orderCode), 
      checkoutUrl: checkoutUrl || null, 
      qrCode: qrCode || null 
    });
  } catch (err) {
    console.error('❌ ========== [PayOS] LỖI ==========');
    console.error('Error:', err?.response?.data || err.message);
    console.error('Stack:', err.stack);
    console.error('❌ =====================================\n');
    return res.status(500).json({ ok:false, message:'create payment failed' });
  } finally {
    client.release();
  }
};

// === PayOS: kiểm tra trạng thái (PAID -> update DB) ===
exports.checkPayOSStatus = async (req, res) => {
  const { orderCode } = req.params;
  
  console.log('\n🔍 ========== [PayOS] KIỂM TRA TRẠNG THÁI ==========');
  console.log('📌 OrderCode:', orderCode);
  
  if (!orderCode) {
    console.log('❌ Thiếu orderCode');
    return res.status(400).json({ ok:false, message:'orderCode required' });
  }

  const client = await db.connect();
  try {
    // 1) hỏi PayOS
    console.log('📡 Calling PayOS status API...');
    const status = await vietqrService.payosGetStatus(orderCode);
    const gatewayStatus = String(status.status || status.payment?.status || '').toUpperCase();
    
    console.log('📥 PayOS status response:', JSON.stringify(status, null, 2));
    console.log('🔖 Gateway status:', gatewayStatus);

    // 2) nếu PAID -> update DB (idempotent)
    if (gatewayStatus === 'PAID') {
      console.log('✅ Status = PAID, updating DB...');
      
      const updatePaymentResult = await client.query(
        `UPDATE payments
           SET status='paid', paid_at=now(), note=concat(coalesce(note,''),' | payOS txn ', $1)
         WHERE tx_ref=$1 AND status <> 'paid'
         RETURNING payment_id, booking_id`,
        [String(orderCode)]
      );
      
      console.log('💾 Updated payment rows:', updatePaymentResult.rowCount);

      // ✅ Cập nhật payment_status của booking
      const updateBookingResult = await client.query(
        `UPDATE bookings
            SET payment_status='paid', last_updated_at=now()
         WHERE booking_id IN (SELECT booking_id FROM payments WHERE tx_ref=$1)
         RETURNING booking_id`,
        [String(orderCode)]
      );
      
      console.log('📋 Updated booking rows:', updateBookingResult.rowCount);
      
      if (updateBookingResult.rows.length > 0) {
        console.log('✅ Booking IDs updated:', updateBookingResult.rows.map(r => r.booking_id));
      }
    } else {
      console.log('⏳ Status chưa PAID:', gatewayStatus);
    }

    // 3) đọc trạng thái hiện tại trong DB
    console.log('📖 Reading current DB status...');
    const q = await client.query(
      `SELECT payment_id, booking_id, status, paid_at, tx_ref
         FROM payments WHERE tx_ref=$1 LIMIT 1`,
      [String(orderCode)]
    );
    const row = q.rows[0] || null;
    
    console.log('💾 DB payment record:', row);
    console.log('🔍 ========== [PayOS] HOÀN TẤT KIỂM TRA ==========\n');

    return res.json({
      ok: true,
      orderId: String(orderCode),
      gatewayStatus: gatewayStatus || 'UNKNOWN',
      dbStatus: row?.status || 'unknown',
      paid_at: row?.paid_at || null,
      booking_id: row?.booking_id || null
    });
  } catch (err) {
    console.error('❌ ========== [PayOS] LỖI KIỂM TRA ==========');
    console.error('Error:', err?.response?.data || err.message);
    console.error('Stack:', err.stack);
    console.error('❌ ==========================================\n');
    return res.status(500).json({ ok:false, message:'check status failed' });
  } finally {
    client.release();
  }
};
