'use strict';
const db = require('../../../config/db');
const vietqrService = require('../services/vietqr.service');
const makeTxRef = () => `PAY-${Date.now()}`;

// ✅ LUỒNG 1 + 2: booking có sẵn (trả ngay hoặc check-in)
exports.createQrForBooking = async (req, res) => {
  const { bookingId } = req.params;
  const client = await db.connect();
  try {
    const b = await client.query(
      'SELECT booking_id, hotel_id, total_price, payment_status FROM bookings WHERE booking_id=$1',
      [bookingId]
    );
    if (!b.rowCount) return res.status(404).json({ error: 'Booking không tồn tại' });
    const book = b.rows[0];
    if (book.payment_status === 'paid')
      return res.status(400).json({ error: 'Booking đã thanh toán' });

    const amount = Number(book.total_price);
    if (!amount || amount <= 0)
      return res.status(400).json({ error: 'Tổng tiền không hợp lệ' });

    const txRef = makeTxRef();

    await client.query(
      `INSERT INTO payments (
         booking_id, hotel_id,
         base_amount, surcharge_amount, discount_amount,
         pg_fee_amount, admin_fee_amount,
         status, tx_ref, note
       )
       VALUES ($1,$2,$3,0,0,0,0,'pending',$4,'VietQR Booking')`,
      [bookingId, book.hotel_id, amount, txRef]
    );

    const qr = await vietqrService.generateQr({
      amount,
      addInfo: `BOOKING ${bookingId} - ${txRef}`
    });

    res.json({ booking_id: bookingId, tx_ref: txRef, amount, qr_image: qr.qrDataURL, qr_code: qr.qrCode });
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
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Số tiền không hợp lệ' });

  const client = await db.connect();
  try {
    const txRef = makeTxRef();

    await client.query(
      `INSERT INTO payments (
         booking_id, hotel_id,
         base_amount, surcharge_amount, discount_amount,
         pg_fee_amount, admin_fee_amount,
         status, tx_ref, note
       )
       VALUES ($1,$2,$3,0,0,0,0,'pending',$4,$5)`,
      [bookingId, hotelId, Number(amount), txRef, note || 'VietQR Walk-in']
    );

    const qr = await vietqrService.generateQr({
      amount: Number(amount),
      addInfo: `WALKIN ${hotelId} - ${txRef}`
    });

    res.json({ hotel_id: hotelId, booking_id: bookingId, tx_ref: txRef, amount, qr_image: qr.qrDataURL, qr_code: qr.qrCode });
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
      'SELECT payment_id, booking_id, base_amount, status FROM payments WHERE tx_ref=$1',
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

    const amt = Number(amount || p.base_amount);
    const net = amt; // phí = 0%

    console.log('💰 [WEBHOOK] Updating payment:', { payment_id: p.payment_id, amount: amt, net });

    await client.query(
      `UPDATE payments
         SET status='paid', paid_at=$2,
             pg_fee_amount=0, admin_fee_amount=0, hotel_net_amount=$3
       WHERE payment_id=$1`,
      [p.payment_id, paid_at || new Date().toISOString(), net]
    );

    if (p.booking_id) {
      console.log('📝 [WEBHOOK] Updating booking:', p.booking_id);
      await client.query('UPDATE bookings SET payment_status=\'paid\', last_updated_at=now() WHERE booking_id=$1', [p.booking_id]);
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
