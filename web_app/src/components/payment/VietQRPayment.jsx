// src/components/payment/VietQRPayment.jsx
import React, { useEffect } from 'react';
import { toast } from 'react-toastify';
import { useVietQR } from '../../hooks/useVietQR';

/**
 * provider:
 *  - 'vietqr' (mặc định): dùng luồng VietQR cũ (tạo QR tĩnh)
 *  - 'payos'           : dùng PayOS (polling). Có thể trả về qr_image hoặc chỉ có checkout_url
 */
const VietQRPayment = ({
  provider = 'vietqr',
  bookingId,
  hotelId,
  amount,
  paymentType = 'booking', // 'booking' | 'walk-in'
  onPaymentSuccess,
  onPaymentError
}) => {
  const {
    // state
    qrData,
    paymentStatus,
    countdown,
    error,
    confirming,
    // actions VietQR cũ
    createQRForBooking,
    createQRAtCounter,
    updatePaymentStatus,
    // actions PayOS mới
    createPayOSForBooking,
    // utils
    startCountdown,
    downloadQRImage,
    formatCountdownTime,
    clearError
  } = useVietQR();

  // Tạo QR / tạo đơn thanh toán tuỳ provider
  const generatePayment = async () => {
    try {
      clearError();

      if (provider === 'payos') {
        // ————— PayOS (polling) —————
        // KHÔNG bắt buộc hotelId nữa — BE sẽ tự lookup từ bookingId
        if (!bookingId || !amount || amount <= 0) {
          throw new Error('Cần bookingId và amount > 0 để tạo đơn PayOS');
        }
        const resp = await createPayOSForBooking(bookingId, {
          hotelId, // có thì gửi; nếu không có, BE sẽ tự lấy theo bookingId
          amount,
          description: `Thanh toán đơn #${bookingId}`
        });
        // Nếu không có ảnh QR (nhiều case PayOS chỉ trả link), mở checkout_url
        if (!resp?.qr_image && resp?.checkout_url) {
          window.open(resp.checkout_url, '_blank');
        }
        startCountdown();
        toast.success('Tạo đơn PayOS thành công!');
        return;
      }

      // ————— VietQR cũ —————
      let result;
      if (paymentType === 'booking' && bookingId) {
        result = await createQRForBooking(bookingId);
      } else if (paymentType === 'walk-in' && hotelId) {
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
      }
    } catch (err) {
      console.error('Lỗi tạo thanh toán:', err);
      toast.error(err.message || 'Không thể tạo thanh toán');
      onPaymentError?.(err);
    }
  };

  // Nút “Tôi đã chuyển khoản” — chỉ dành cho luồng VietQR cũ (PayOS tự cập nhật qua polling)
  const handlePaymentConfirmation = async () => {
    if (provider === 'payos') return; // PayOS không cần nút xác nhận tay
    if (!qrData?.tx_ref) {
      toast.error('Không tìm thấy thông tin giao dịch');
      return;
    }
    try {
      const response = await updatePaymentStatus({
        txRef: qrData.tx_ref,
        status: 'paid',
        paidAt: new Date().toISOString()
      });
      if (response.ok) toast.success('Xác nhận thanh toán thành công!');
    } catch (err) {
      console.error('Lỗi xác nhận thanh toán:', err);
      toast.error(err?.response?.data?.error || 'Không thể xác nhận thanh toán');
    }
  };

  // Thành công
  useEffect(() => {
    if (paymentStatus === 'paid' && qrData) {
      toast.success('Thanh toán thành công!');
      onPaymentSuccess?.(qrData, { tx_ref: qrData.tx_ref, amount: qrData.amount });
    }
  }, [paymentStatus, qrData, onPaymentSuccess]);

  // Lỗi
  useEffect(() => {
    if (error) {
      toast.error(error);
      onPaymentError?.(new Error(error));
    }
  }, [error, onPaymentError]);

  // Hết hạn
  useEffect(() => {
    if (countdown === 0 && paymentStatus === 'pending') {
      toast.warning('Phiên thanh toán đã hết hạn');
    }
  }, [countdown, paymentStatus]);

  const loading = paymentStatus === 'creating';

  return (
    <div className="vietqr-payment bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          {provider === 'payos' ? 'Thanh toán PayOS (VietQR)' : 'Thanh toán VietQR'}
        </h3>
        {amount && (
          <p className="text-2xl font-bold text-blue-600 mt-2">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)}
          </p>
        )}
      </div>

      {!qrData && (
        <div className="text-center">
          <button
            onClick={generatePayment}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Đang khởi tạo...' : (provider === 'payos' ? 'Tạo đơn PayOS' : 'Tạo mã QR thanh toán')}
          </button>
        </div>
      )}

      {qrData && (
        <div className="space-y-4">
          {/* QR Image (nếu có) */}
          {qrData.qr_image && (
            <div className="text-center">
              <img
                src={qrData.qr_image}
                alt="QR Code thanh toán"
                className="mx-auto border-2 border-gray-200 rounded-lg"
                style={{ maxWidth: '250px' }}
              />
            </div>
          )}

          {/* Thông tin giao dịch */}
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

          {/* Trạng thái */}
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
            {paymentStatus === 'paid' && <div className="text-green-600 font-medium">✅ Thanh toán thành công!</div>}
            {paymentStatus === 'expired' && <div className="text-red-600 font-medium">⏰ Phiên thanh toán đã hết hạn</div>}
            {paymentStatus === 'error' && <div className="text-red-600 font-medium">❌ Lỗi thanh toán</div>}
          </div>

          {/* Nút hành động */}
          <div className="flex space-x-3">
            {(paymentStatus === 'expired' || paymentStatus === 'error') && (
              <button
                onClick={generatePayment}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Tạo lại
              </button>
            )}

            {provider === 'vietqr' && paymentStatus === 'pending' && (
              <button
                onClick={handlePaymentConfirmation}
                disabled={confirming}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                {confirming ? (
                  <span className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Đang xác nhận...</span>
                  </span>
                ) : (
                  '✓ Tôi đã chuyển khoản'
                )}
              </button>
            )}

            {qrData?.qr_image && (
              <button
                onClick={() => downloadQRImage(qrData.qr_image, `qr-${qrData.tx_ref}.png`)}
                disabled={confirming}
                className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Tải QR
              </button>
            )}
          </div>

          {/* Hướng dẫn */}
          <div className="text-xs text-gray-500 text-center space-y-1">
            <p className="font-medium text-gray-700">Hướng dẫn thanh toán:</p>
            <p>1. Mở ứng dụng ngân hàng của bạn</p>
            {provider === 'payos'
              ? <p>2. Hệ thống sẽ mở trang PayOS, làm theo hướng dẫn để hoàn tất</p>
              : <p>2. Quét mã VietQR và xác nhận chuyển tiền</p>
            }
          </div>
        </div>
      )}
    </div>
  );
};

export default VietQRPayment;
