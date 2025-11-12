// src/components/payment/BookingPayment.jsx
import React from 'react';
import { VietQRProvider } from '../../context/VietQRContext';
import VietQRPayment from './VietQRPayment';

/**
 * UC01: Thanh toán booking qua app ngay lập tức
 */
const BookingPaymentImmediate = ({ bookingId, amount, onSuccess, onError }) => {
  return (
    <VietQRProvider>
      <div className="booking-payment-immediate">
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-800">Thanh toán đặt phòng</h4>
          <p className="text-sm text-blue-600">
            Quét mã QR để hoàn tất đặt phòng của bạn
          </p>
        </div>
        
        <VietQRPayment
          provider="payos"
          bookingId={bookingId}
          //hotelId=
          amount={amount}
          paymentType="booking"
          onPaymentSuccess={onSuccess}
          onPaymentError={onError}
          autoConfirm={process.env.NODE_ENV === 'development'} // Auto confirm trong dev
        />
      </div>
    </VietQRProvider>
  );
};

/**
 * UC02: Thanh toán khi check-in
 */
const CheckInPayment = ({ bookingId, amount, onSuccess, onError }) => {
  return (
    <VietQRProvider>
      <div className="checkin-payment">
        <div className="mb-4 p-4 bg-green-50 rounded-lg">
          <h4 className="font-semibold text-green-800">Thanh toán khi check-in</h4>
          <p className="text-sm text-green-600">
            Vui lòng thanh toán để hoàn tất việc check-in
          </p>
        </div>
        
        <VietQRPayment
          bookingId={bookingId}
          amount={amount}
          paymentType="booking"
          onPaymentSuccess={onSuccess}
          onPaymentError={onError}
        />
      </div>
    </VietQRProvider>
  );
};

/**
 * UC03: Walk-in payment tại quầy
 */
const WalkInPayment = ({ hotelId, bookingId, amount, onSuccess, onError }) => {
  return (
    <VietQRProvider>
      <div className="walkin-payment">
        <div className="mb-4 p-4 bg-orange-50 rounded-lg">
          <h4 className="font-semibold text-orange-800">Thanh toán Walk-in</h4>
          <p className="text-sm text-orange-600">
            Khách hàng walk-in - Thanh toán tại quầy
          </p>
        </div>
        
        <VietQRPayment
          hotelId={hotelId}
          bookingId={bookingId}
          amount={amount}
          paymentType="walk-in"
          onPaymentSuccess={onSuccess}
          onPaymentError={onError}
        />
      </div>
    </VietQRProvider>
  );
};

export {
  BookingPaymentImmediate,
  CheckInPayment,
  WalkInPayment
};