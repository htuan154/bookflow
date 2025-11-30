// src/hooks/useBookingNightlyPrice.js
import { useContext } from 'react';
import BookingNightlyPriceContext from '../context/BookingNightlyPriceContext';

/**
 * Custom hook để sử dụng BookingNightlyPriceContext
 * @returns {Object} Context state và actions
 */
export const useBookingNightlyPrice = () => {
  const context = useContext(BookingNightlyPriceContext);

  if (!context) {
    throw new Error(
      'useBookingNightlyPrice must be used within a BookingNightlyPriceProvider'
    );
  }

  return context;
};

export default useBookingNightlyPrice;
