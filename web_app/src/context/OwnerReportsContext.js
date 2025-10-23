import React, { createContext, useCallback, useMemo, useState } from 'react';
import ReportsOwnerService from '../api/reports.owner.service';

export const OwnerReportsContext = createContext(null);

const todayISO = () => new Date().toISOString().slice(0, 10);
const daysAgoISO = (n) => {
  const d = new Date(); d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

export function OwnerReportsProvider({ children }) {
  const [filters, setFilters] = useState({
    date_from: daysAgoISO(30),
    date_to: todayISO(),
    hotel_id: null, // Thêm filter theo khách sạn
    page: 1,
    page_size: 20,
  });
  const setSelectedHotel = (hotelId) => {
    setFilters((prev) => ({ ...prev, hotel_id: hotelId || null }));
  };
  const [payments, setPayments] = useState({ rows: [], pagination: null });
  const [payouts, setPayouts]   = useState({ rows: [], pagination: null });

  const [loadingPayments, setLoadingPayments] = useState(false);
  const [loadingPayouts, setLoadingPayouts] = useState(false);
  const [error, setError] = useState(null);

  const fetchPayments = useCallback(async (overrides = {}) => {
    setLoadingPayments(true); setError(null);
    try {
      const res = await ReportsOwnerService.getPayments({ ...filters, ...overrides });
      console.debug('OwnerReportsContext.fetchPayments response:', res);
      setPayments({
        rows: res?.data || res?.rows || res || [],
        pagination: res?.pagination || null,
      });
    } catch (err) {
      // Helpful debug in console for network/auth issues
      console.error('OwnerReportsContext.fetchPayments error:', {
        message: err?.message,
        status: err?.response?.status,
        data: err?.response?.data,
      });
      setError(err?.response?.data || err?.message || 'Fetch owner payments failed');
    } finally {
      setLoadingPayments(false);
    }
  }, [filters]);

  const fetchPayouts = useCallback(async (overrides = {}) => {
    setLoadingPayouts(true); setError(null);
    try {
      const res = await ReportsOwnerService.getPayouts({ ...filters, ...overrides });
      console.debug('OwnerReportsContext.fetchPayouts response:', res);
      setPayouts({
        rows: res?.data || res?.rows || res || [],
        pagination: res?.pagination || null,
      });
    } catch (err) {
      console.error('OwnerReportsContext.fetchPayouts error:', {
        message: err?.message,
        status: err?.response?.status,
        data: err?.response?.data,
      });
      setError(err?.response?.data || err?.message || 'Fetch owner payouts failed');
    } finally {
      setLoadingPayouts(false);
    }
  }, [filters]);

  const value = useMemo(() => ({
    filters, setFilters,
    setSelectedHotel,
    payments, payouts,
    loadingPayments, loadingPayouts,
    error,
    fetchPayments, fetchPayouts,
  }), [
    filters, payments, payouts,
    loadingPayments, loadingPayouts, error,
    fetchPayments, fetchPayouts
  ]);

  return (
    <OwnerReportsContext.Provider value={value}>
      {children}
    </OwnerReportsContext.Provider>
  );
}
