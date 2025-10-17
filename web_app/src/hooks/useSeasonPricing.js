// src/hooks/useSeasonPricing.js
import { useState, useEffect } from 'react';
import seasonPricingService from '../api/seasonPricing.service';
import { toast } from 'react-toastify';

export const useSeasonPricing = () => {
  const [seasonPricing, setSeasonPricing] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Lấy tất cả season pricing
  const fetchAllSeasonPricing = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await seasonPricingService.getAllSeasonPricing();
      setSeasonPricing(response.data || []);
      return response.data;
    } catch (err) {
      console.error('Error fetching season pricing:', err);
      setError(err.message);
      toast.error('Không thể tải danh sách giá theo mùa');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Lấy season pricing theo hotel
  const fetchSeasonPricingByHotel = async (hotelId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await seasonPricingService.getSeasonPricingByHotel(hotelId);
      setSeasonPricing(response.data || []);
      return response.data;
    } catch (err) {
      console.error('Error fetching season pricing by hotel:', err);
      setError(err.message);
      toast.error('Không thể tải giá theo mùa của khách sạn');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Lấy season pricing theo room type
  const fetchSeasonPricingByRoomType = async (roomTypeId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await seasonPricingService.getSeasonPricingByRoomType(roomTypeId);
      setSeasonPricing(response.data || []);
      return response.data;
    } catch (err) {
      console.error('Error fetching season pricing by room type:', err);
      setError(err.message);
      toast.error('Không thể tải giá theo mùa của loại phòng');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Lấy các seasons chưa có seasonal pricing cho một room type trong một năm
  const fetchAvailableSeasonsForRoomType = async (roomTypeId, year) => {
    try {
      setLoading(true);
      setError(null);
      const response = await seasonPricingService.getAvailableSeasonsForRoomType(roomTypeId, year);
      return response.data || [];
    } catch (err) {
      console.error('Error fetching available seasons:', err);
      setError(err.message);
      toast.error('Không thể tải danh sách mùa có sẵn');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Lấy season pricing theo season
  const fetchSeasonPricingBySeason = async (seasonId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await seasonPricingService.getSeasonPricingBySeason(seasonId);
      setSeasonPricing(response.data || []);
      return response.data;
    } catch (err) {
      console.error('Error fetching season pricing by season:', err);
      setError(err.message);
      toast.error('Không thể tải giá của mùa này');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Tạo season pricing mới
  const createSeasonPricing = async (pricingData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await seasonPricingService.createSeasonPricing(pricingData);
      toast.success('Tạo giá theo mùa thành công');
      await fetchAllSeasonPricing(); // Refresh list
      return response.data;
    } catch (err) {
      console.error('Error creating season pricing:', err);
      setError(err.message);
      toast.error('Không thể tạo giá theo mùa');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật season pricing
  const updateSeasonPricing = async (pricingId, pricingData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await seasonPricingService.updateSeasonPricing(pricingId, pricingData);
      toast.success('Cập nhật giá theo mùa thành công');
      await fetchAllSeasonPricing(); // Refresh list
      return response.data;
    } catch (err) {
      console.error('Error updating season pricing:', err);
      setError(err.message);
      toast.error('Không thể cập nhật giá theo mùa');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Xóa season pricing
  const deleteSeasonPricing = async (pricingId) => {
    try {
      setLoading(true);
      setError(null);
      await seasonPricingService.deleteSeasonPricing(pricingId);
      toast.success('Xóa giá theo mùa thành công');
      await fetchAllSeasonPricing(); // Refresh list
    } catch (err) {
      console.error('Error deleting season pricing:', err);
      setError(err.message);
      toast.error('Không thể xóa giá theo mùa');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Tạo nhiều season pricing cùng lúc
  const bulkCreateSeasonPricing = async (bulkData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await seasonPricingService.bulkCreateSeasonPricing(bulkData);
      toast.success(response.message || 'Tạo bulk giá theo mùa thành công');
      await fetchAllSeasonPricing(); // Refresh list
      return response.data;
    } catch (err) {
      console.error('Error bulk creating season pricing:', err);
      setError(err.message);
      toast.error('Không thể tạo bulk giá theo mùa');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    seasonPricing,
    loading,
    error,
    fetchAllSeasonPricing,
    fetchSeasonPricingByHotel,
    fetchSeasonPricingByRoomType,
    fetchAvailableSeasonsForRoomType,
    fetchSeasonPricingBySeason,
    createSeasonPricing,
    updateSeasonPricing,
    deleteSeasonPricing,
    bulkCreateSeasonPricing
  };
};

export default useSeasonPricing;
