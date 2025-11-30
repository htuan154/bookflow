// src/hooks/useReviewImage.js
import { useContext } from 'react';
import { useReviewImageContext } from '../context/ReviewImageContext';

/**
 * Custom hook để dùng ReviewImageContext dễ dàng
 */
const useReviewImage = () => {
  const context = useReviewImageContext();
  if (!context) {
    throw new Error('useReviewImage must be used within a ReviewImageProvider');
  }
  return context;
};

export default useReviewImage;
