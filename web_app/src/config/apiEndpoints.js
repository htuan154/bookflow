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

    // --- User Management Endpoints (Admin only) ---
    USERS: {
        GET_ALL: `${API_BASE_URL}/users`,
        GET_BY_ID: (userId) => `${API_BASE_URL}/users/${userId}`,
        CREATE: `${API_BASE_URL}/users`, // ← THÊM MỚI
        UPDATE: (userId) => `${API_BASE_URL}/users/${userId}`,
        DELETE: (userId) => `${API_BASE_URL}/users/${userId}`,
        UPDATE_STATUS: (userId) => `${API_BASE_URL}/users/${userId}/status`, // ← THÊM MỚI
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

    // --- Promotion Endpoints (Admin & Hotel Owner) ---
    PROMOTIONS: {
        // Basic CRUD operations
        GET_ALL: `${API_BASE_URL}/promotions`,
        GET_BY_ID: (promotionId) => `${API_BASE_URL}/promotions/${promotionId}`,
        CREATE: `${API_BASE_URL}/promotions`,
        UPDATE: (promotionId) => `${API_BASE_URL}/promotions/${promotionId}`,
        DELETE: (promotionId) => `${API_BASE_URL}/promotions/${promotionId}`,

        // Validation & Application
        VALIDATE_CODE: `${API_BASE_URL}/promotions/validate`,
        CHECK_CODE: `${API_BASE_URL}/promotions/check-code`,
        APPLY: `${API_BASE_URL}/promotions/apply`,

        // Filtered lists
        GET_ACTIVE: `${API_BASE_URL}/promotions/active`,
        GET_BY_HOTEL: (hotelId) => `${API_BASE_URL}/promotions/hotel/${hotelId}`,
        GET_BY_STATUS: (status) => `${API_BASE_URL}/promotions/status/${status}`,

        // Details & Statistics
        GET_DETAILS: (promotionId) => `${API_BASE_URL}/promotions/${promotionId}/details`,
        ADD_DETAILS: (promotionId) => `${API_BASE_URL}/promotions/${promotionId}/details`,
        GET_STATS: (promotionId) => `${API_BASE_URL}/promotions/${promotionId}/stats`,
        GET_USAGE_HISTORY: (promotionId) => `${API_BASE_URL}/promotions/${promotionId}/usage-history`,

        // Bulk operations
        BULK_UPDATE: `${API_BASE_URL}/promotions/bulk-update`,
        BULK_DELETE: `${API_BASE_URL}/promotions/bulk-delete`,
        BULK_ACTIVATE: `${API_BASE_URL}/promotions/bulk-activate`,
        BULK_DEACTIVATE: `${API_BASE_URL}/promotions/bulk-deactivate`,

        // Import/Export
        EXPORT: `${API_BASE_URL}/promotions/export`,
        IMPORT: `${API_BASE_URL}/promotions/import`,
        DOWNLOAD_TEMPLATE: `${API_BASE_URL}/promotions/template`,

        // Search & Filtering
        SEARCH: `${API_BASE_URL}/promotions/search`,
        GET_EXPIRING: `${API_BASE_URL}/promotions/expiring`,
        GET_POPULAR: `${API_BASE_URL}/promotions/popular`,

        // Admin specific
        ADMIN: {
            GET_ALL: `${API_BASE_URL}/admin/promotions`,
            GET_STATISTICS: `${API_BASE_URL}/admin/promotions/statistics`,
            GET_USAGE_REPORT: `${API_BASE_URL}/admin/promotions/usage-report`,
            APPROVE: (promotionId) => `${API_BASE_URL}/admin/promotions/${promotionId}/approve`,
            REJECT: (promotionId) => `${API_BASE_URL}/admin/promotions/${promotionId}/reject`,
        }
    },

    // --- Admin Endpoints ---
    ADMIN: {
        // Hotel Management
        GET_ALL_HOTELS: `${API_BASE_URL}/hotels/admin/all`,
        GET_PENDING_HOTELS: `${API_BASE_URL}/hotels/admin/pending`,
        GET_ALL_HOTELS_ADMIN: `${API_BASE_URL}/hotels/admin/all`,
        GET_HOTELS_BY_STATUS: (status) => `${API_BASE_URL}/hotels/admin/status/${status}`,
        GET_PENDING_REJECTED_HOTELS: `${API_BASE_URL}/hotels/admin/pending-rejected`,
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
        CREATE_HOTEL_OWNER: `${API_BASE_URL}/hotels/admin/hotel-owners`, // ← THÊM MỚI
        SUSPEND_HOTEL_OWNER: (ownerId) => `${API_BASE_URL}/hotels/admin/hotel-owners/${ownerId}/suspend`,
        ACTIVATE_HOTEL_OWNER: (ownerId) => `${API_BASE_URL}/hotels/admin/hotel-owners/${ownerId}/activate`,

        // User Management (Admin)
        GET_ALL_USERS: `${API_BASE_URL}/admin/users`,
        GET_USERS_BY_ROLE: (role) => `${API_BASE_URL}/admin/users/role/${role}`,
        GET_HOTEL_OWNERS_ADMIN: `${API_BASE_URL}/admin/users/hotel-owners`, // ← THÊM MỚI
        CREATE_USER: `${API_BASE_URL}/admin/users`, // ← THÊM MỚI
        UPDATE_USER_STATUS: (userId) => `${API_BASE_URL}/admin/users/${userId}/status`, // ← THÊM MỚI

        // Blog Management for Admin
        GET_ALL_BLOGS: `${API_BASE_URL}/blogs/admin`,
        GET_BLOGS_BY_STATUS: (status) => `${API_BASE_URL}/blogs/admin/status/${status}`,
        GET_REJECTED_BLOGS: (status) => `${API_BASE_URL}/blogs/admin/status/${status}`,
        
        // Blog Bulk Operations
        BULK_APPROVE_BLOGS: `${API_BASE_URL}/blogs/admin/bulk/approve`,
        BULK_REJECT_BLOGS: `${API_BASE_URL}/blogs/admin/bulk/reject`,
        BULK_DELETE_BLOGS: `${API_BASE_URL}/blogs/admin/bulk/delete`,
        
        // Blog Statistics for Admin
        GET_BLOG_STATISTICS: `${API_BASE_URL}/blogs/admin/statistics`,
        GET_BLOG_DETAILS_ADMIN: (blogId) => `${API_BASE_URL}/admin/blogs/${blogId}/details`,
    },

    // --- Blog/Travel Article Endpoints ---
    BLOGS: {
        // Public endpoints
        GET_ALL: `${API_BASE_URL}/blogs`,
        GET_PUBLISHED: `${API_BASE_URL}/blogs/published`,
        GET_BY_ID: (blogId) => `${API_BASE_URL}/blogs/${blogId}`,
        GET_BY_SLUG: (slug) => `${API_BASE_URL}/blogs/slug/${slug}`,
        GET_BY_HOTEL: (hotelId) => `${API_BASE_URL}/blogs/hotel/${hotelId}`,
        SEARCH: `${API_BASE_URL}/blogs/search`,
        GET_BY_TAG: (tag) => `${API_BASE_URL}/blogs/tag/${tag}`,
        GET_POPULAR: `${API_BASE_URL}/blogs/popular`,
        GET_RECENT: `${API_BASE_URL}/blogs/recent`,

        // Admin endpoints
        CREATE: `${API_BASE_URL}/blogs`,
        UPDATE: (blogId) => `${API_BASE_URL}/blogs/${blogId}`,
        DELETE: (blogId) => `${API_BASE_URL}/blogs/${blogId}`,
        UPDATE_STATUS: (blogId) => `${API_BASE_URL}/blogs/${blogId}/status`,
        APPROVE: (blogId) => `${API_BASE_URL}/blogs/${blogId}/approve`,
        REJECT: (blogId) => `${API_BASE_URL}/blogs/${blogId}/reject`,
        PUBLISH: (blogId) => `${API_BASE_URL}/blogs/${blogId}/publish`,
        UNPUBLISH: (blogId) => `${API_BASE_URL}/blogs/${blogId}/unpublish`,

        // Blog image endpoints
        UPLOAD_IMAGE: (blogId) => `${API_BASE_URL}/blogs/${blogId}/images`,
        DELETE_IMAGE: (blogId, imageId) => `${API_BASE_URL}/blogs/${blogId}/images/${imageId}`,
        SET_FEATURED_IMAGE: (blogId, imageId) => `${API_BASE_URL}/blogs/${blogId}/images/${imageId}/set-featured`,

        // Blog statistics
        GET_STATS: `${API_BASE_URL}/blogs/stats`,
        GET_BLOG_STATS: (blogId) => `${API_BASE_URL}/blogs/${blogId}/stats`,
        INCREMENT_VIEW: (blogId) => `${API_BASE_URL}/blogs/${blogId}/view`,
        LIKE: (blogId) => `${API_BASE_URL}/blogs/${blogId}/like`,
        UNLIKE: (blogId) => `${API_BASE_URL}/blogs/${blogId}/unlike`,
    },

    // --- Hotel Owner Endpoints ---
    HOTEL_OWNER: {
        // Thêm các endpoints cho hotel owner
        GET_MY_HOTELS: `${API_BASE_URL}/hotels/my-hotels`,
        GET_HOTEL_DETAIL: (hotelId) => `${API_BASE_URL}/hotels/${hotelId}`,
        CREATE_HOTEL: `${API_BASE_URL}/hotels`,
        UPDATE_HOTEL: (hotelId) => `${API_BASE_URL}/hotels/${hotelId}`,
        DELETE_HOTEL: (hotelId) => `${API_BASE_URL}/hotels/${hotelId}`,
        
        // Image management
        UPLOAD_IMAGES: (hotelId) => `${API_BASE_URL}/hotels/${hotelId}/images`,
        DELETE_IMAGE: (hotelId, imageId) => `${API_BASE_URL}/hotels/${hotelId}/images/${imageId}`,
        SET_THUMBNAIL: (hotelId, imageId) => `${API_BASE_URL}/hotels/${hotelId}/images/${imageId}/set-thumbnail`,
        
        // Status & amenities
        UPDATE_STATUS: (hotelId) => `${API_BASE_URL}/hotels/${hotelId}/status`,
        UPDATE_AMENITIES: (hotelId) => `${API_BASE_URL}/hotels/${hotelId}/amenities`,
        SUBMIT_FOR_APPROVAL: (hotelId) => `${API_BASE_URL}/hotels/${hotelId}/submit`,
        GET_STATISTICS: (hotelId = '') => `${API_BASE_URL}/hotels${hotelId ? `/${hotelId}` : ''}/statistics`,
    },

    // --- Staff Management Endpoints (Hotel Owner) ---
    STAFF: {
        GET_HOTEL_STAFF: (hotelId) => `${API_BASE_URL}/hotels/${hotelId}/staff`,
        CREATE: `${API_BASE_URL}/staff`,
        UPDATE: (staffId) => `${API_BASE_URL}/staff/${staffId}`,
        DELETE: (staffId) => `${API_BASE_URL}/staff/${staffId}`,
        UPDATE_STATUS: (staffId) => `${API_BASE_URL}/staff/${staffId}/status`,
        GET_BY_ID: (staffId) => `${API_BASE_URL}/staff/${staffId}`,
    },

    // Common endpoints
    COMMON: {
        GET_AMENITIES: `${API_BASE_URL}/amenities`,
        SEARCH_HOTELS: `${API_BASE_URL}/hotels/search`,
        GET_CITIES: `${API_BASE_URL}/hotels/cities`,
    },
};