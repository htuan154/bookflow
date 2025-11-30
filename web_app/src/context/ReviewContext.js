// src/context/ReviewContext.js
import { createContext, useContext, useState, useCallback } from 'react';
import reviewService from '../api/review.service';

const ReviewContext = createContext();

export const ReviewProvider = ({ children }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  // Lấy review phân trang theo hotelId
  const fetchPagedByHotelId = useCallback(async (hotelId, page = 1, limit = 10) => {
    setLoading(true);
    setError(null);
    try {
      const result = await reviewService.getPagedByHotelId(hotelId, page, limit);
      setReviews(Array.isArray(result?.data) ? result.data : []);
      return result;
    } catch (err) {
      setError(err);
      setReviews([]);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Tạo review mới
  const createReview = useCallback(async (reviewData) => {
    setLoading(true);
    setError(null);
    try {
      const newReview = await reviewService.create(reviewData);
      setReviews((prev) => [newReview, ...prev]);
      return newReview;
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Xóa review
  const deleteReview = useCallback(async (reviewId) => {
    setLoading(true);
    setError(null);
    try {
      await reviewService.delete(reviewId);
      setReviews((prev) => prev.filter((r) => r.review_id !== reviewId));
      return true;
    } catch (err) {
      setError(err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Cập nhật sub ratings
  const updateSubRatings = useCallback(async (reviewId, ratings) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await reviewService.updateSubRatings(reviewId, ratings);
      setReviews((prev) => prev.map((r) => r.review_id === reviewId ? updated : r));
      return updated;
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <ReviewContext.Provider value={{
      reviews,
      loading,
      error,
      fetchPagedByHotelId,
      createReview,
      deleteReview,
      updateSubRatings,
      setReviews,
    }}>
      {children}
    </ReviewContext.Provider>
  );
};

export const useReviewContext = () => useContext(ReviewContext);
