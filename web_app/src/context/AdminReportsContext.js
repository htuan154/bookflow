import React, { createContext, useCallback, useMemo, useState } from 'react';
import ReportsAdminService from '../api/reports.admin.service';

export const AdminReportsContext = createContext(null);

const todayISO = () => new Date().toISOString().slice(0, 10);
 const daysAgoISO = (n) => {
  const d = new Date(); d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

export function AdminReportsProvider({ children }) {
  // ---- bộ lọc chung cho toàn trang Báo cáo thống kê (Admin)
  const [filters, setFilters] = useState({
    date_from: daysAgoISO(14),   // 14 ngày gần nhất → chắc chắn bao trùm 10/17
    date_to: todayISO(),
    hotel_filter: 'ALL',       // Đổi tên từ 'hotels' thành 'hotel_filter' để khớp backend
    page: 1,
    page_size: 20,
  });

  // ---- state dữ liệu
  const [summary, setSummary] = useState(null);            // { daily_summary, payout_proposals, payments_detail }
  const [payments, setPayments] = useState({ rows: [], pagination: null });
  const [payouts, setPayouts]   = useState({ rows: [], pagination: null });

  // ---- state ui
  const [loading, setLoading] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [loadingPayouts, setLoadingPayouts] = useState(false);
  const [creatingPayout, setCreatingPayout] = useState(false);
  const [error, setError] = useState(null);

  // ---- actions
  const fetchSummary = useCallback(async (overrides = {}) => {
    setLoading(true); setError(null);
    try {
      const res = await ReportsAdminService.getSummary({ ...filters, ...overrides });
      console.log('📊 Admin Summary Response:', res);
      console.log('📊 Daily Summary Data:', res?.daily_summary);
      if (res?.daily_summary?.length > 0) {
        console.log('📊 First Row Keys:', Object.keys(res.daily_summary[0]));
        console.log('📊 First Row Values:', res.daily_summary[0]);
      }
      setSummary(res);
    } catch (err) {
      setError(err?.response?.data || err?.message || 'Fetch summary failed');
      console.error('❌ Admin Summary Error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchPayments = useCallback(async (overrides = {}) => {
    setLoadingPayments(true); setError(null);
    try {
      const res = await ReportsAdminService.getPayments({ ...filters, ...overrides });
      // tuỳ response server: chuẩn hoá một xíu
      setPayments({
        rows: res?.data || res?.rows || res || [],
        pagination: res?.pagination || null,
      });
    } catch (err) {
      setError(err?.response?.data || err?.message || 'Fetch payments failed');
    } finally {
      setLoadingPayments(false);
    }
  }, [filters]);

  const fetchPayouts = useCallback(async (overrides = {}) => {
    setLoadingPayouts(true); setError(null);
    try {
      const res = await ReportsAdminService.getPayouts({ ...filters, ...overrides });
      setPayouts({
        rows: res?.data || res?.rows || res || [],
        pagination: res?.pagination || null,
      });
    } catch (err) {
      setError(err?.response?.data || err?.message || 'Fetch payouts failed');
    } finally {
      setLoadingPayouts(false);
    }
  }, [filters]);

  const createPayout = useCallback(async ({ hotel_id, cover_date }) => {
    setCreatingPayout(true); setError(null);
    try {
      const res = await ReportsAdminService.createPayout({ hotel_id, cover_date });
      
      // Update local state immediately - mark as exists_in_payouts
      setSummary(prevSummary => {
        if (!prevSummary?.daily_summary) return prevSummary;
        
        return {
          ...prevSummary,
          daily_summary: prevSummary.daily_summary.map(row => {
            // Find matching row by hotel_id and date
            if (row.hotelId === hotel_id && row.bizDateVn === cover_date) {
              return { ...row, exists_in_payouts: true };
            }
            return row;
          })
        };
      });
      
      // Also refetch to get accurate data from server
      setTimeout(() => fetchSummary(), 1000);
      
      return res;
    } catch (err) {
      setError(err?.response?.data || err?.message || 'Create payout failed');
      throw err;
    } finally {
      setCreatingPayout(false);
    }
  }, [fetchSummary]);

  const value = useMemo(() => ({
    filters, setFilters,
    summary, payments, payouts,
    loading, loadingPayments, loadingPayouts, creatingPayout,
    error,
    fetchSummary, fetchPayments, fetchPayouts, createPayout,
  }), [
    filters, summary, payments, payouts,
    loading, loadingPayments, loadingPayouts, creatingPayout, error,
    fetchSummary, fetchPayments, fetchPayouts, createPayout
  ]);

  return (
    <AdminReportsContext.Provider value={value}>
      {children}
    </AdminReportsContext.Provider>
  );
}
