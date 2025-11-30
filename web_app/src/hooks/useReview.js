// src/hooks/useReview.js
import { useContext } from 'react';
import { useReviewContext } from '../context/ReviewContext';

// Custom hook để dùng ReviewContext dễ dàng
const useReview = () => {
  const context = useReviewContext();
  if (!context) {
    throw new Error('useReview must be used within a ReviewProvider');
  }
  return context;
};

export default useReview;
