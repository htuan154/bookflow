// src/constants/apiEndpoints.js

const API_BASE_URL = 'http://localhost:8080/api/v1';

export const API_ENDPOINTS = {
    // --- Auth Endpoints ---
    AUTH: {
        LOGIN: `${API_BASE_URL}/auth/login`,
        REGISTER: `${API_BASE_URL}/auth/register`,
        PROFILE: `${API_BASE_URL}/auth/profile`,
        LOGOUT: `${API_BASE_URL}/auth/logout`,
    },

    // --- Hotel Endpoints ---
    HOTELS: {
        // Public
        GET_ALL: `${API_BASE_URL}/hotels`,
        SEARCH: `${API_BASE_URL}/hotels/search`,
        GET_BY_ID: (hotelId) => `${API_BASE_URL}/hotels/${hotelId}`,

        // Authenticated (Hotel Owner)
        CREATE: `${API_BASE_URL}/hotels`,
        MY_HOTELS: `${API_BASE_URL}/hotels/my-hotels`,
        UPDATE: (hotelId) => `${API_BASE_URL}/hotels/${hotelId}`,
        DELETE: (hotelId) => `${API_BASE_URL}/hotels/${hotelId}`,
    },
    
    // --- Hotel Image Endpoints ---
    HOTEL_IMAGES: {
        // Dùng hàm để tạo endpoint động với hotelId
        UPLOAD: (hotelId) => `${API_BASE_URL}/hotels/${hotelId}/images`,
        DELETE: (hotelId, imageId) => `${API_BASE_URL}/hotels/${hotelId}/images/${imageId}`,
        SET_THUMBNAIL: (hotelId, imageId) => `${API_BASE_URL}/hotels/${hotelId}/images/${imageId}/set-thumbnail`,
    },

    // --- Amenity Endpoints (Admin only) ---
    AMENITIES: {
        GET_ALL: `${API_BASE_URL}/amenities`,
        CREATE: `${API_BASE_URL}/amenities`,
        UPDATE: (amenityId) => `${API_BASE_URL}/amenities/${amenityId}`,
        DELETE: (amenityId) => `${API_BASE_URL}/amenities/${amenityId}`,
    },
    
    // --- Hotel-Amenity Relationship Endpoints ---
    HOTEL_AMENITIES: {
        GET_FOR_HOTEL: (hotelId) => `${API_BASE_URL}/hotels/${hotelId}/amenities`,
        ADD_TO_HOTEL: (hotelId) => `${API_BASE_URL}/hotels/${hotelId}/amenities`,
        REMOVE_FROM_HOTEL: (hotelId, amenityId) => `${API_BASE_URL}/hotels/${hotelId}/amenities/${amenityId}`,
    },

    // --- Admin Endpoints ---
    ADMIN: {
        GET_ALL_HOTELS: `${API_BASE_URL}/hotels/admin/all`,
        GET_PENDING_HOTELS: `${API_BASE_URL}/hotels/admin/pending`,
        GET_STATISTICS: `${API_BASE_URL}/hotels/admin/statistics`,
        UPDATE_HOTEL_STATUS: (hotelId) => `${API_BASE_URL}/hotels/admin/${hotelId}/status`,
    }
};