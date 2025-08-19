// src/hooks/useApi.js
import { useState, useCallback } from 'react';
import axios from 'axios';

const useApi = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const request = useCallback(async (config) => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios(config);
            return response.data;
        } catch (err) {
            if (err.response) {
                setError(err.response.data?.message || 'Lỗi phản hồi từ server');
            } else if (err.request) {
                setError('Không nhận được phản hồi từ server');
            } else {
                setError('Lỗi khi gửi request');
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // Thêm method apiCall để tương thích với CustomerContext
    const apiCall = useCallback(async (url, method = 'GET', data = null, config = {}) => {
        const requestConfig = {
            url,
            method,
            data,
            ...config
        };
        
        return await request(requestConfig);
    }, [request]);

    return { request, apiCall, loading, error };
};

export default useApi;
export { useApi };
