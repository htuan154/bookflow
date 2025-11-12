import { useContext } from 'react';
import { VietQRContext } from '../context/VietQRContext';

/**
 * Custom hook to access VietQR context (VietQR cũ + PayOS)
 * 
 * @returns {Object} context với:
 * - Data: qrData, paymentHistory, currentPayment, paymentStatus, countdown
 * - Loading: creating, confirming
 * - Errors: error, validationErrors
 * - Actions VietQR cũ: createQRForBooking, createQRAtCounter, confirmPayment, simulatePaymentConfirmation, updatePaymentStatus
 * - Actions PayOS mới: createPayOSForBooking
 * - QR mgmt: startCountdown, resetQR, regenerateQR, downloadQRImage
 * - Utils: clearError, resetState, checkQRExpired, formatCountdownTime
 */
export const useVietQR = () => {
  const context = useContext(VietQRContext);
  
  if (!context) {
    throw new Error('useVietQR must be used within a VietQRProvider');
  }
  
  return context;
};

export default useVietQR;