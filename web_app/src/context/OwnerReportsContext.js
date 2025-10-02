import React, { createContext, useCallback, useMemo, useState } from 'react';
import ReportsOwnerService from '../api/reports.owner.service';

export const OwnerReportsContext = createContext(null);

const todayISO = () => new Date().toISOString().slice(0, 10);
const weekAgoISO = () => {
  const d = new Date(); d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
};

export function OwnerReportsProvider({ children }) {
  const [filters, setFilters] = useState({
    date_from: weekAgoISO(),
    date_to: todayISO(),
    page: 1,
    page_size: 20,
  });

  const [payments, setPayments] = useState({ rows: [], pagination: null });
  const [payouts, setPayouts]   = useState({ rows: [], pagination: null });

  const [loadingPayments, setLoadingPayments] = useState(false);
  const [loadingPayouts, setLoadingPayouts] = useState(false);
  const [error, setError] = useState(null);

  const fetchPayments = useCallback(async (overrides = {}) => {
    setLoadingPayments(true); setError(null);
    try {
      const res = await ReportsOwnerService.getPayments({ ...filters, ...overrides });
      setPayments({
        rows: res?.data || res?.rows || res || [],
        pagination: res?.pagination || null,
      });
    } catch (err) {
      setError(err?.response?.data || err?.message || 'Fetch owner payments failed');
    } finally {
      setLoadingPayments(false);
    }
  }, [filters]);

  const fetchPayouts = useCallback(async (overrides = {}) => {
    setLoadingPayouts(true); setError(null);
    try {
      const res = await ReportsOwnerService.getPayouts({ ...filters, ...overrides });
      setPayouts({
        rows: res?.data || res?.rows || res || [],
        pagination: res?.pagination || null,
      });
    } catch (err) {
      setError(err?.response?.data || err?.message || 'Fetch owner payouts failed');
    } finally {
      setLoadingPayouts(false);
    }
  }, [filters]);

  const value = useMemo(() => ({
    filters, setFilters,
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
