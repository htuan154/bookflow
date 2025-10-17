import React, { createContext, useCallback, useMemo, useState, useEffect } from 'react';
import vietqrService from '../api/vietqr.service';

export const VietQRContext = createContext(null);

export function VietQRProvider({ children }) {
  // =========================================
  // STATE MANAGEMENT
  // =========================================
  
  const [qrData, setQrData] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [currentPayment, setCurrentPayment] = useState(null);
  
  // Payment Status: 'idle', 'pending', 'paid', 'expired', 'error'
  const [paymentStatus, setPaymentStatus] = useState('idle');
  const [countdown, setCountdown] = useState(null);
  
  // UI State
  const [creating, setCreating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  
  // Error State
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // =========================================
  // UTILITY FUNCTIONS
  // =========================================

  /**
   * Đếm ngược thời gian hết hạn QR (10 phút)
   */
  const startCountdown = useCallback((minutes = 10) => {
    setCountdown(minutes * 60); // Convert to seconds
  }, []);

  // =========================================
  // ACTIONS - QR GENERATION
  // =========================================

  /**
   * UC01 & UC02: Tạo QR code cho booking có sẵn
   */
  const createQRForBooking = useCallback(async (bookingId) => {
    if (!bookingId) {
      setError('Booking ID là bắt buộc');
      throw new Error('Booking ID là bắt buộc');
    }

    setCreating(true);
    setError(null);
    setValidationErrors({});

    try {
      const response = await vietqrService.createQRForBooking(bookingId);
      
      // Update state
      setQrData(response);
      setCurrentPayment({
        ...response,
        bookingId,
        paymentType: 'booking',
        createdAt: new Date().toISOString()
      });
      setPaymentStatus('pending');
      startCountdown();

      // Add to history
      setPaymentHistory(prev => [
        {
          ...response,
          bookingId,
          paymentType: 'booking',
          createdAt: new Date().toISOString(),
          status: 'pending'
        },
        ...prev
      ]);

      return response;
    } catch (err) {
      const errorMsg = err?.response?.data?.error || err?.message || 'Lỗi khi tạo QR cho booking';
      setError(errorMsg);
      setPaymentStatus('error');
      
      if (err?.response?.data?.errors) {
        setValidationErrors(err.response.data.errors);
      }
      
      throw err;
    } finally {
      setCreating(false);
    }
  }, [startCountdown]);

  /**
   * UC03: Tạo QR code cho walk-in tại quầy
   */
  const createQRAtCounter = useCallback(async (hotelId, payload) => {
    if (!hotelId) {
      setError('Hotel ID là bắt buộc');
      throw new Error('Hotel ID là bắt buộc');
    }

    if (!payload?.amount || payload.amount <= 0) {
      setError('Số tiền phải lớn hơn 0');
      throw new Error('Số tiền phải lớn hơn 0');
    }

    setCreating(true);
    setError(null);
    setValidationErrors({});

    try {
      const response = await vietqrService.createQRAtCounter(hotelId, payload);
      
      // Update state
      setQrData(response);
      setCurrentPayment({
        ...response,
        hotelId,
        paymentType: 'walk-in',
        createdAt: new Date().toISOString(),
        ...payload
      });
      setPaymentStatus('pending');
      startCountdown();

      // Add to history
      setPaymentHistory(prev => [
        {
          ...response,
          hotelId,
          paymentType: 'walk-in',
          createdAt: new Date().toISOString(),
          status: 'pending',
          ...payload
        },
        ...prev
      ]);

      return response;
    } catch (err) {
      const errorMsg = err?.response?.data?.error || err?.message || 'Lỗi khi tạo QR tại quầy';
      setError(errorMsg);
      setPaymentStatus('error');
      
      if (err?.response?.data?.errors) {
        setValidationErrors(err.response.data.errors);
      }
      
      throw err;
    } finally {
      setCreating(false);
    }
  }, [startCountdown]);

  // =========================================
  // ACTIONS - PAYMENT CONFIRMATION
  // =========================================

  /**
   * Xác nhận thanh toán (webhook simulation hoặc thật)
   */
  const confirmPayment = useCallback(async (payload) => {
    if (!payload?.tx_ref) {
      setError('Transaction reference là bắt buộc');
      throw new Error('Transaction reference là bắt buộc');
    }

    setConfirming(true);
    setError(null);

    try {
      const response = await vietqrService.confirmPayment(payload);
      
      if (response.ok) {
        // Update current payment status
        setPaymentStatus('paid');
        setCountdown(null);
        
        // Update current payment
        if (currentPayment && currentPayment.tx_ref === payload.tx_ref) {
          setCurrentPayment(prev => ({
            ...prev,
            status: 'paid',
            paidAt: payload.paid_at || new Date().toISOString(),
            providerTxId: payload.provider_tx_id
          }));
        }

        // Update payment history
        setPaymentHistory(prev => prev.map(payment =>
          payment.tx_ref === payload.tx_ref
            ? {
                ...payment,
                status: 'paid',
                paidAt: payload.paid_at || new Date().toISOString(),
                providerTxId: payload.provider_tx_id
              }
            : payment
        ));
      }

      return response;
    } catch (err) {
      const errorMsg = err?.response?.data?.error || err?.message || 'Lỗi khi xác nhận thanh toán';
      setError(errorMsg);
      setPaymentStatus('error');
      throw err;
    } finally {
      setConfirming(false);
    }
  }, [currentPayment]);

  /**
   * Giả lập xác nhận thanh toán (dùng cho demo)
   */
  const simulatePaymentConfirmation = useCallback(async (txRef, amount) => {
    if (!txRef) {
      throw new Error('Transaction reference là bắt buộc');
    }

    try {
      const payload = vietqrService.createWebhookPayload(txRef, amount);
      return await confirmPayment(payload);
    } catch (err) {
      console.error('Lỗi giả lập thanh toán:', err);
      throw err;
    }
  }, [confirmPayment]);

  /**
   * Cập nhật status payment
   */
  const updatePaymentStatus = useCallback(async ({ paymentId, txRef, status, paidAt }) => {
    setConfirming(true);
    setError(null);

    try {
      const response = await vietqrService.updatePaymentStatus({
        paymentId,
        txRef,
        status,
        paidAt
      });
      
      if (response.ok) {
        // Update current payment status
        if (status === 'paid') {
          setPaymentStatus('paid');
          setCountdown(null);
        } else if (status === 'failed') {
          setPaymentStatus('error');
        } else if (status === 'refunded') {
          setPaymentStatus('refunded');
        }
        
        // Update current payment
        if (currentPayment && (currentPayment.tx_ref === txRef || currentPayment.payment_id === paymentId)) {
          setCurrentPayment(prev => ({
            ...prev,
            status,
            paidAt: paidAt || prev.paidAt
          }));
        }

        // Update payment history
        setPaymentHistory(prev => prev.map(payment =>
          payment.tx_ref === txRef || payment.payment_id === paymentId
            ? { ...payment, status, paidAt: paidAt || payment.paidAt }
            : payment
        ));
      }

      return response;
    } catch (err) {
      const errorMsg = err?.response?.data?.error || err?.message || 'Lỗi khi cập nhật status';
      setError(errorMsg);
      throw err;
    } finally {
      setConfirming(false);
    }
  }, [currentPayment]);

  // =========================================
  // ACTIONS - QR MANAGEMENT
  // =========================================

  /**
   * Reset QR và trạng thái thanh toán
   */
  const resetQR = useCallback(() => {
    setQrData(null);
    setCurrentPayment(null);
    setPaymentStatus('idle');
    setCountdown(null);
    setError(null);
    setValidationErrors({});
  }, []);

  /**
   * Tạo QR mới (regenerate)
   */
  const regenerateQR = useCallback(async () => {
    if (!currentPayment) {
      throw new Error('Không có thông tin để tạo QR mới');
    }

    try {
      if (currentPayment.paymentType === 'booking') {
        return await createQRForBooking(currentPayment.bookingId);
      } else if (currentPayment.paymentType === 'walk-in') {
        return await createQRAtCounter(currentPayment.hotelId, {
          bookingId: currentPayment.bookingId,
          amount: currentPayment.amount,
          note: currentPayment.note
        });
      }
    } catch (err) {
      console.error('Lỗi tạo QR mới:', err);
      throw err;
    }
  }, [currentPayment, createQRForBooking, createQRAtCounter]);

  /**
   * Download QR image
   */
  const downloadQRImage = useCallback((filename) => {
    if (!qrData?.qr_image) {
      throw new Error('Không có QR code để tải');
    }

    const finalFilename = filename || `qr-${qrData.tx_ref}.png`;
    vietqrService.downloadQRImage(qrData.qr_image, finalFilename);
  }, [qrData]);

  // =========================================
  // UTILITY ACTIONS
  // =========================================

  /**
   * Clear errors
   */
  const clearError = useCallback(() => {
    setError(null);
    setValidationErrors({});
  }, []);

  /**
   * Reset toàn bộ state
   */
  const resetState = useCallback(() => {
    setQrData(null);
    setPaymentHistory([]);
    setCurrentPayment(null);
    setPaymentStatus('idle');
    setCountdown(null);
    setError(null);
    setValidationErrors({});
  }, []);

  /**
   * Check QR expired
   */
  const checkQRExpired = useCallback((createdAt, ttlMinutes = 10) => {
    return vietqrService.isQRExpired(createdAt, ttlMinutes);
  }, []);

  /**
   * Format countdown time
   */
  const formatCountdownTime = useCallback((seconds) => {
    if (!seconds || seconds <= 0) return '00:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // =========================================
  // EFFECTS - Countdown Timer
  // =========================================

  useEffect(() => {
    if (countdown === null || countdown <= 0 || paymentStatus !== 'pending') {
      return;
    }

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 0) {
          setPaymentStatus('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, paymentStatus]);

  // =========================================
  // EFFECTS - Payment Status Polling
  // =========================================

  useEffect(() => {
    // Chỉ poll khi đang pending và có tx_ref
    if (paymentStatus !== 'pending' || !qrData?.tx_ref) {
      return;
    }

    // Poll mỗi 3 giây
    const pollInterval = setInterval(async () => {
      try {
        const status = await vietqrService.checkPaymentStatus(qrData.tx_ref);
        
        if (status.status === 'paid') {
          setPaymentStatus('paid');
          setCountdown(null);
          
          // Update payment history
          setPaymentHistory(prev => 
            prev.map(p => 
              p.tx_ref === qrData.tx_ref 
                ? { ...p, status: 'paid', paid_at: status.paid_at }
                : p
            )
          );
        }
      } catch (error) {
        console.error('Lỗi kiểm tra trạng thái thanh toán:', error);
        // Không set error để không làm gián đoạn polling
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [paymentStatus, qrData]);

  // =========================================
  // COMPUTED VALUES
  // =========================================

  const contextValue = useMemo(() => ({
    // Data
    qrData,
    paymentHistory,
    currentPayment,
    paymentStatus,
    countdown,
    
    // Loading states
    creating,
    confirming,
    
    // Error states
    error,
    validationErrors,
    
    // Actions - QR Generation
    createQRForBooking,
    createQRAtCounter,
    
    // Actions - Payment Confirmation
    confirmPayment,
    simulatePaymentConfirmation,
    updatePaymentStatus,
    
    // Actions - QR Management
    startCountdown,
    resetQR,
    regenerateQR,
    downloadQRImage,
    
    // Utility actions
    clearError,
    resetState,
    checkQRExpired,
    formatCountdownTime,
    
    // Helper functions from service
    createWebhookPayload: vietqrService.createWebhookPayload,
    isQRExpired: vietqrService.isQRExpired,
  }), [
    qrData, paymentHistory, currentPayment, paymentStatus, countdown,
    creating, confirming,
    error, validationErrors,
    createQRForBooking, createQRAtCounter,
    confirmPayment, simulatePaymentConfirmation, updatePaymentStatus,
    startCountdown, resetQR, regenerateQR, downloadQRImage,
    clearError, resetState, checkQRExpired, formatCountdownTime
  ]);

  return (
    <VietQRContext.Provider value={contextValue}>
      {children}
    </VietQRContext.Provider>
  );
}