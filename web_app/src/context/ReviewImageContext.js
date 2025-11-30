// src/context/ReviewImageContext.js
import { createContext, useContext, useState, useCallback } from 'react';
import reviewImageService from '../api/reviewImage.service';

const ReviewImageContext = createContext();

export const ReviewImageProvider = ({ children }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Lấy tất cả hình ảnh của một review
   */
  const fetchImagesByReviewId = useCallback(async (reviewId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await reviewImageService.getImagesByReviewId(reviewId);
      setImages(data);
      return data;
    } catch (err) {
      setError(err);
      setImages([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Upload hình ảnh cho review
   */
  const uploadImages = useCallback(async (reviewId, imageUrls) => {
    setLoading(true);
    setError(null);
    try {
      const newImages = await reviewImageService.uploadImages(reviewId, imageUrls);
      setImages((prev) => [...prev, ...newImages]);
      return newImages;
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Xóa một hình ảnh
   */
  const deleteImage = useCallback(async (imageId) => {
    setLoading(true);
    setError(null);
    try {
      const success = await reviewImageService.deleteImage(imageId);
      if (success) {
        setImages((prev) => prev.filter((img) => img.imageId !== imageId));
      }
      return success;
    } catch (err) {
      setError(err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Clear images
   */
  const clearImages = useCallback(() => {
    setImages([]);
    setError(null);
  }, []);

  return (
    <ReviewImageContext.Provider
      value={{
        images,
        loading,
        error,
        fetchImagesByReviewId,
        uploadImages,
        deleteImage,
        clearImages,
        setImages,
      }}
    >
      {children}
    </ReviewImageContext.Provider>
  );
};

export const useReviewImageContext = () => useContext(ReviewImageContext);
