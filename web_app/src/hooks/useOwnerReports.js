import { useContext, useEffect } from 'react';
import { OwnerReportsContext } from '../context/OwnerReportsContext';

export default function useOwnerReports(autoFetch = true) {
  const ctx = useContext(OwnerReportsContext);
  if (!ctx) throw new Error('useOwnerReports must be used within OwnerReportsProvider');

  const {
    filters, setFilters,
    payments, payouts,
    loadingPayments, loadingPayouts,
    error,
    fetchPayments, fetchPayouts,
  } = ctx;

  useEffect(() => {
    if (autoFetch) {
      fetchPayments();
      fetchPayouts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch]);

  return {
    filters, setFilters,
    payments, payouts,
    loadingPayments, loadingPayouts,
    error,
    fetchPayments, fetchPayouts,
  };
}
