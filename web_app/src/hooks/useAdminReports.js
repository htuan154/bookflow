import { useContext, useEffect } from 'react';
import { AdminReportsContext } from '../context/AdminReportsContext';

export default function useAdminReports(autoFetch = true) {
  const ctx = useContext(AdminReportsContext);
  if (!ctx) throw new Error('useAdminReports must be used within AdminReportsProvider');

  const {
    filters, setFilters,
    summary, payments, payouts,
    loading, loadingPayments, loadingPayouts, creatingPayout,
    error,
    fetchSummary, fetchPayments, fetchPayouts, createPayout,
  } = ctx;

  // tự động tải summary lần đầu
  useEffect(() => {
    if (autoFetch) fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch]);

  return {
    filters, setFilters,
    summary, payments, payouts,
    loading, loadingPayments, loadingPayouts, creatingPayout,
    error,
    fetchSummary, fetchPayments, fetchPayouts, createPayout,
  };
}
