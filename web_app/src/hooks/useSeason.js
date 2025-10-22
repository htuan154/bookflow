// src/hooks/useSeason.js
import { useState, useEffect } from 'react';
import seasonService from '../api/season.service';
import { toast } from 'react-toastify';

export const useSeason = () => {
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Lấy tất cả seasons
  const fetchAllSeasons = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await seasonService.getAllSeasons();
      setSeasons(response.data || []);
      return response.data;
    } catch (err) {
      console.error('Error fetching seasons:', err);
      setError(err.message);
      toast.error('Không thể tải danh sách mùa');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Lấy seasons theo năm
  const fetchSeasonsByYear = async (year) => {
    try {
      setLoading(true);
      setError(null);
      const response = await seasonService.getSeasonsByYear(year);
      setSeasons(response.data || []);
      return response.data;
    } catch (err) {
      console.error('Error fetching seasons by year:', err);
      setError(err.message);
      toast.error(`Không thể tải danh sách mùa năm ${year}`);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Lấy season theo ID
  const fetchSeasonById = async (seasonId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await seasonService.getSeasonById(seasonId);
      return response.data;
    } catch (err) {
      console.error('Error fetching season by ID:', err);
      setError(err.message);
      toast.error('Không thể tải thông tin mùa');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Tạo season mới
  const createSeason = async (seasonData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await seasonService.createSeason(seasonData);
      toast.success('Tạo mùa thành công');
      await fetchAllSeasons(); // Refresh list
      return response.data;
    } catch (err) {
      console.error('Error creating season:', err);
      setError(err.message);
      toast.error('Không thể tạo mùa');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật season
  const updateSeason = async (seasonId, seasonData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await seasonService.updateSeason(seasonId, seasonData);
      toast.success('Cập nhật mùa thành công');
      await fetchAllSeasons(); // Refresh list
      return response.data;
    } catch (err) {
      console.error('Error updating season:', err);
      setError(err.message);
      toast.error('Không thể cập nhật mùa');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Xóa season
  const deleteSeason = async (seasonId) => {
    try {
      setLoading(true);
      setError(null);
      await seasonService.deleteSeason(seasonId);
      toast.success('Xóa mùa thành công');
      await fetchAllSeasons(); // Refresh list
    } catch (err) {
      console.error('Error deleting season:', err);
      setError(err.message);
      toast.error('Không thể xóa mùa');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    seasons,
    loading,
    error,
    fetchAllSeasons,
    fetchSeasonsByYear,
    fetchSeasonById,
    createSeason,
    updateSeason,
    deleteSeason
  };
};

export default useSeason;
