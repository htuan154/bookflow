// src/config/apiEndpoints.js

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

    // --- Contract Endpoints (Admin only) ---
    CONTRACTS: {
        GET_ALL: `${API_BASE_URL}/contracts`,
        GET_BY_ID: (contractId) => `${API_BASE_URL}/contracts/${contractId}`,
        GET_BY_STATUS: (status) => `${API_BASE_URL}/contracts/status/${status}`,
        GET_BY_HOTEL: (hotelId) => `${API_BASE_URL}/contracts/hotels/${hotelId}/contracts`,
        CREATE: `${API_BASE_URL}/contracts`,
        UPDATE_STATUS: (contractId) => `${API_BASE_URL}/contracts/${contractId}/status`,
    },

    // --- User Management Endpoints (Admin only) ---
    USERS: {
        GET_ALL: `${API_BASE_URL}/users`,
        GET_BY_ID: (userId) => `${API_BASE_URL}/users/${userId}`,
        UPDATE: (userId) => `${API_BASE_URL}/users/${userId}`,
        DELETE: (userId) => `${API_BASE_URL}/users/${userId}`,
    },

    // --- Promotion Endpoints (Admin only) ---
    PROMOTIONS: {
        GET_ALL: `${API_BASE_URL}/promotions`,
        CREATE: `${API_BASE_URL}/promotions`,
        UPDATE: (promotionId) => `${API_BASE_URL}/promotions/${promotionId}`,
    },

    // --- Admin Endpoints ---
    ADMIN: {
        // Hotel Management
        GET_ALL_HOTELS: `${API_BASE_URL}/hotels/admin/all`,
        GET_PENDING_HOTELS: `${API_BASE_URL}/hotels/admin/pending`,
        GET_ALL_HOTELS_ADMIN: `${API_BASE_URL}/hotels/admin/all`,
        GET_HOTELS_BY_STATUS: (status) => `${API_BASE_URL}/hotels/admin/status/${status}`,
        
        // Hotel Status Management
        UPDATE_HOTEL_STATUS: (hotelId) => `${API_BASE_URL}/hotels/admin/${hotelId}/status`,
        APPROVE_HOTEL: (hotelId) => `${API_BASE_URL}/hotels/admin/${hotelId}/approve`,
        REJECT_HOTEL: (hotelId) => `${API_BASE_URL}/hotels/admin/${hotelId}/reject`,
        RESTORE_HOTEL: (hotelId) => `${API_BASE_URL}/hotels/admin/${hotelId}/restore`,

        // Hotel Filter Endpoints for Admin
        GET_APPROVED_HOTELS: `${API_BASE_URL}/hotels/admin/status/approved`,
        GET_PENDING_HOTELS_ADMIN: `${API_BASE_URL}/hotels/admin/pending`,
        GET_REJECTED_HOTELS: `${API_BASE_URL}/hotels/admin/rejected`,

        // Statistics
        GET_STATISTICS: `${API_BASE_URL}/hotels/admin/statistics`,
        GET_HOTEL_STATISTICS: `${API_BASE_URL}/hotels/admin/statistics`,
        GET_DASHBOARD_STATS: `${API_BASE_URL}/admin/dashboard/stats`,
        
        // Hotel Details for Admin
        GET_HOTEL_DETAILS_ADMIN: (hotelId) => `${API_BASE_URL}/admin/hotels/${hotelId}/details`,
        
        // Bulk Operations
        BULK_APPROVE_HOTELS: `${API_BASE_URL}/hotels/admin/bulk/approve`,
        BULK_REJECT_HOTELS: `${API_BASE_URL}/hotels/admin/bulk/reject`,

        // Hotel Owner Management
        GET_HOTEL_OWNERS: `${API_BASE_URL}/hotels/admin/hotel-owners`,
        SUSPEND_HOTEL_OWNER: (ownerId) => `${API_BASE_URL}/hotels/admin/hotel-owners/${ownerId}/suspend`,
        ACTIVATE_HOTEL_OWNER: (ownerId) => `${API_BASE_URL}/hotels/admin/hotel-owners/${ownerId}/activate`,
    }
};