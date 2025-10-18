import { useContext } from 'react';
import { VietQRContext } from '../context/VietQRContext';

/**
 * Custom hook to access VietQR context
 * Provides access to VietQR payment functionality and state management
 * 
 * @returns {Object} VietQR context with state and methods:
 * - Data: qrData, paymentHistory, currentPayment, paymentStatus, countdown
 * - Loading: creating, confirming
 * - Errors: error, validationErrors
 * - Actions - QR Generation: createQRForBooking, createQRAtCounter
 * - Actions - Payment: confirmPayment, simulatePaymentConfirmation, updatePaymentStatus
 * - Actions - QR Management: startCountdown, resetQR, regenerateQR, downloadQRImage
 * - Utilities: clearError, resetState, checkQRExpired, formatCountdownTime
 * @throws {Error} If used outside of VietQRProvider
 */
export const useVietQR = () => {
  const context = useContext(VietQRContext);
  
  if (!context) {
    throw new Error('useVietQR must be used within a VietQRProvider');
  }
  
  return context;
};

export default useVietQR;