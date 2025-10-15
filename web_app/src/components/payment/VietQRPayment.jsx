// src/components/payment/VietQRPayment.jsx
import React, { useEffect } from 'react';
import { toast } from 'react-toastify';
import { useVietQR } from '../../hooks/useVietQR';

const VietQRPayment = ({ 
  bookingId, 
  hotelId, 
  amount, 
  paymentType = 'booking', // 'booking' hoặc 'walk-in'
  onPaymentSuccess, 
  onPaymentError,
  autoConfirm = false // Tự động giả lập xác nhận thanh toán (dùng cho demo)
}) => {
  const {
    qrData,
    paymentStatus,
    countdown,
    error,
    createQRForBooking,
    createQRAtCounter,
    simulatePaymentConfirmation,
    startCountdown,
    downloadQRImage,
    formatCountdownTime,
    clearError
  } = useVietQR();

  // Tạo QR code
  const generateQR = async () => {
    try {
      clearError();
      let result;
      
      if (paymentType === 'booking' && bookingId) {
        // UC01 & UC02: QR cho booking có sẵn
        result = await createQRForBooking(bookingId);
      } else if (paymentType === 'walk-in' && hotelId) {
        // UC03: QR cho walk-in tại quầy
        result = await createQRAtCounter(hotelId, {
          bookingId: bookingId || null,
          amount,
          note: 'Walk-in payment'
        });
      } else {
        throw new Error('Thiếu thông tin để tạo QR code');
      }

      if (result) {
        startCountdown();
        toast.success('Tạo QR code thành công!');

        // Auto confirm nếu enabled (dùng cho demo)
        if (autoConfirm) {
          setTimeout(() => {
            simulatePaymentConfirmation(result.tx_ref, result.amount);
          }, 3000);
        }
      }

    } catch (error) {
      console.error('Lỗi tạo QR:', error);
      toast.error(error.message || 'Không thể tạo QR code');
      onPaymentError?.(error);
    }
  };

  // Handle payment success
  useEffect(() => {
    if (paymentStatus === 'paid' && qrData) {
      toast.success('Thanh toán thành công!');
      onPaymentSuccess?.(qrData, { tx_ref: qrData.tx_ref, amount: qrData.amount });
    }
  }, [paymentStatus, qrData, onPaymentSuccess]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error(error);
      onPaymentError?.(new Error(error));
    }
  }, [error, onPaymentError]);

  // Handle countdown expiration
  useEffect(() => {
    if (countdown === 0 && paymentStatus === 'pending') {
      toast.warning('QR code đã hết hạn');
    }
  }, [countdown, paymentStatus]);

  const loading = paymentStatus === 'creating';

  return (
    <div className="vietqr-payment bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          Thanh toán VietQR
        </h3>
        {amount && (
          <p className="text-2xl font-bold text-blue-600 mt-2">
            {new Intl.NumberFormat('vi-VN', { 
              style: 'currency', 
              currency: 'VND' 
            }).format(amount)}
          </p>
        )}
      </div>

      {!qrData && (
        <div className="text-center">
          <button
            onClick={generateQR}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Đang tạo QR...' : 'Tạo mã QR thanh toán'}
          </button>
        </div>
      )}

      {qrData && (
        <div className="space-y-4">
          {/* QR Code Image */}
          <div className="text-center">
            <img
              src={qrData.qr_image}
              alt="QR Code thanh toán"
              className="mx-auto border-2 border-gray-200 rounded-lg"
              style={{ maxWidth: '250px' }}
            />
          </div>

          {/* Transaction Info */}
          <div className="bg-gray-50 p-3 rounded-lg text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Mã giao dịch:</span>
              <span className="font-mono text-gray-800">{qrData.tx_ref}</span>
            </div>
            {bookingId && (
              <div className="flex justify-between mt-1">
                <span className="text-gray-600">Booking ID:</span>
                <span className="font-medium">{bookingId}</span>
              </div>
            )}
          </div>

          {/* Payment Status */}
          <div className="text-center">
            {paymentStatus === 'pending' && (
              <div className="space-y-2">
                <div className="flex items-center justify-center space-x-2 text-orange-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                  <span>Đang chờ thanh toán...</span>
                </div>
                {countdown && (
                  <p className="text-sm text-gray-600">
                    Hết hạn sau: <span className="font-mono font-medium">{formatCountdownTime(countdown)}</span>
                  </p>
                )}
              </div>
            )}

            {paymentStatus === 'paid' && (
              <div className="text-green-600 font-medium">
                ✅ Thanh toán thành công!
              </div>
            )}

            {paymentStatus === 'expired' && (
              <div className="text-red-600 font-medium">
                ⏰ QR code đã hết hạn
              </div>
            )}

            {paymentStatus === 'error' && (
              <div className="text-red-600 font-medium">
                ❌ Lỗi thanh toán
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            {(paymentStatus === 'expired' || paymentStatus === 'error') && (
              <button
                onClick={generateQR}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Tạo QR mới
              </button>
            )}

            {paymentStatus === 'pending' && autoConfirm && (
              <button
                onClick={() => simulatePaymentConfirmation(qrData.tx_ref, qrData.amount)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Giả lập thanh toán
              </button>
            )}

            <button
              onClick={() => downloadQRImage(qrData.qr_image, `qr-${qrData.tx_ref}.png`)}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
            >
              Tải QR
            </button>
          </div>

          {/* Instructions */}
          <div className="text-xs text-gray-500 text-center">
            <p>1. Mở ứng dụng ngân hàng</p>
            <p>2. Quét mã QR hoặc chụp ảnh</p>
            <p>3. Xác nhận chuyển tiền</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VietQRPayment;