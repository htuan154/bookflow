// src/hooks/useBookingStatusHistory.js
import { useState, useCallback } from 'react';
import { getBookingStatusHistory, createBookingStatusHistory } from '../api/bookingStatusHistory.service';

export function useBookingStatusHistory(bookingId) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchHistory = useCallback(async () => {
        if (!bookingId) return;
        
        setLoading(true);
        setError(null);
        try {
            const response = await getBookingStatusHistory(bookingId);
            // Xử lý response - có thể là { data: [...] } hoặc trực tiếp array
            const historyData = response?.data || response;
            setHistory(Array.isArray(historyData) ? historyData : []);
        } catch (err) {
            console.error('Error fetching history:', err);
            setError(err);
            setHistory([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    }, [bookingId]);

    const addHistory = useCallback(async (payload) => {
        setLoading(true);
        setError(null);
        try {
            const response = await createBookingStatusHistory(bookingId, payload);
            // Xử lý response - có thể là { data: {...} } hoặc trực tiếp object
            const newHistoryItem = response?.data || response;
            
            setHistory((prev) => {
                // Đảm bảo prev luôn là array
                const currentHistory = Array.isArray(prev) ? prev : [];
                return [...currentHistory, newHistoryItem];
            });
            
            return newHistoryItem;
        } catch (err) {
            console.error('Error adding history:', err);
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [bookingId]);

    return {
        history,
        loading,
        error,
        fetchHistory,
        addHistory,
    };
}
