// src/api/bookingStatusHistory.service.js
import { API_ENDPOINTS } from '../config/apiEndpoints';
import axios from 'axios';

export const getBookingStatusHistory = async (bookingId) => {
    const url = API_ENDPOINTS.BOOKINGS.GET_HISTORY(bookingId);
    const token = localStorage.getItem('token');
    const response = await axios.get(url, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response.data;
};

export const createBookingStatusHistory = async (bookingId, data) => {
    const url = API_ENDPOINTS.BOOKINGS.CREATE_HISTORY(bookingId);
    const token = localStorage.getItem('token');
    
    // Backend sẽ tự động lấy changed_by_staff từ currentUser
    // Nên không cần truyền changed_by_staff từ frontend
    const payload = {
        old_status: data.old_status,
        new_status: data.new_status,
        change_reason: data.change_reason,
        notes: data.notes
    };
    
    const response = await axios.post(url, payload, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response.data;
};
