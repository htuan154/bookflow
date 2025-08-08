// src/config/apiEndpoints.js

const API_BASE_URL = 'http://localhost:8080/api/v1';

export const API_ENDPOINTS = {
    // --- Season Endpoints ---
    SEASONS: {
        GET_ALL: `${API_BASE_URL}/seasons`,
        CREATE: `${API_BASE_URL}/seasons`,
        UPDATE: (id) => `${API_BASE_URL}/seasons/${id}`,
        DELETE: (id) => `${API_BASE_URL}/seasons/${id}`,
    },

    // --- Seasonal Pricing Endpoints ---
    SEASONAL_PRICINGS: {
        CREATE: `${API_BASE_URL}/seasonal-pricings`,
        UPDATE: (pricingId) => `${API_BASE_URL}/seasonal-pricings/${pricingId}`,
        DELETE: (pricingId) => `${API_BASE_URL}/seasonal-pricings/${pricingId}`,
        GET_FOR_ROOM_TYPE: (roomTypeId) => `${API_BASE_URL}/seasonal-pricings/${roomTypeId}`,
    },

    // --- Tourist Location Endpoints ---
    TOURIST_LOCATIONS: {
        GET_ALL: `${API_BASE_URL}/tourist-locations`,
        GET_BY_CITY: (city) => `${API_BASE_URL}/tourist-locations/city/${city}`,
        CREATE: `${API_BASE_URL}/tourist-locations`,
        UPDATE: (id) => `${API_BASE_URL}/tourist-locations/${id}`,
        DELETE: (id) => `${API_BASE_URL}/tourist-locations/${id}`,
    },
    // --- Room Endpoints ---
    ROOMS: {
        CREATE: `${API_BASE_URL}/rooms`,
        GET_ALL: `${API_BASE_URL}/rooms`,
        SEARCH: `${API_BASE_URL}/rooms/search`,
        GET_BY_STATUS: (status) => `${API_BASE_URL}/rooms/status/${status}`,
        GET_BY_HOTEL: (hotelId) => `${API_BASE_URL}/rooms/hotel/${hotelId}`,
        GET_AVAILABLE_BY_HOTEL: (hotelId) => `${API_BASE_URL}/rooms/hotel/${hotelId}/available`,
        GET_STATS_BY_HOTEL: (hotelId) => `${API_BASE_URL}/rooms/hotel/${hotelId}/stats`,
        GET_BY_ROOM_TYPE: (roomTypeId) => `${API_BASE_URL}/rooms/room-type/${roomTypeId}`,
        GET_BY_ID: (id) => `${API_BASE_URL}/rooms/${id}`,
        GET_DETAILS: (id) => `${API_BASE_URL}/rooms/${id}/details`,
        CHECK_AVAILABILITY: (id) => `${API_BASE_URL}/rooms/${id}/availability`,
        UPDATE: (id) => `${API_BASE_URL}/rooms/${id}`,
        UPDATE_STATUS: (id) => `${API_BASE_URL}/rooms/${id}/status`,
        DELETE: (id) => `${API_BASE_URL}/rooms/${id}`,
    },

    // --- Room Assignment Endpoints ---
    ROOM_ASSIGNMENTS: {
        ASSIGN: `${API_BASE_URL}/assignments`,
        UNASSIGN: (assignmentId) => `${API_BASE_URL}/assignments/${assignmentId}`,
        GET_FOR_BOOKING: (bookingId) => `${API_BASE_URL}/assignments/bookings/${bookingId}`,
    },

    // --- Room Type Endpoints ---
    ROOM_TYPES: {
        GET_ALL: `${API_BASE_URL}/room-types`,
        GET_PAGINATED: `${API_BASE_URL}/room-types/paginated`,
        SEARCH: `${API_BASE_URL}/room-types/search`,
        GET_STATS: `${API_BASE_URL}/room-types/stats`,
        GET_AVAILABLE: `${API_BASE_URL}/room-types/available`,
        GET_BY_HOTEL: (hotelId) => `${API_BASE_URL}/room-types/hotel/${hotelId}`,
        GET_BY_ID: (id) => `${API_BASE_URL}/room-types/${id}`,
        GET_ROOMS: (id) => `${API_BASE_URL}/room-types/${id}/rooms`,
        CREATE: `${API_BASE_URL}/room-types`,
        UPDATE: (id) => `${API_BASE_URL}/room-types/${id}`,
        DELETE: (id) => `${API_BASE_URL}/room-types/${id}`,
        BULK_CREATE: `${API_BASE_URL}/room-types/bulk`,
        DUPLICATE: (id) => `${API_BASE_URL}/room-types/${id}/duplicate`,
        GET_BOOKINGS: (id) => `${API_BASE_URL}/room-types/${id}/bookings`,
        UPDATE_STATUS: (id) => `${API_BASE_URL}/room-types/${id}/status`,
    },

    // --- Room Type Image Endpoints ---
    ROOM_TYPE_IMAGES: {
        GET_IMAGES: (roomTypeId) => `${API_BASE_URL}/room-types/${roomTypeId}/images`,
        UPLOAD: (roomTypeId) => `${API_BASE_URL}/room-types/${roomTypeId}/images`,
        DELETE: (roomTypeId, imageId) => `${API_BASE_URL}/room-types/${roomTypeId}/images/${imageId}`,
        SET_THUMBNAIL: (roomTypeId, imageId) => `${API_BASE_URL}/room-types/${roomTypeId}/images/${imageId}/set-thumbnail`,
    },
    // --- Review Endpoints ---
    REVIEWS: {
        GET_FOR_HOTEL: (hotelId) => `${API_BASE_URL}/reviews/${hotelId}`,
        CREATE: `${API_BASE_URL}/reviews`,
        DELETE: (reviewId) => `${API_BASE_URL}/reviews/${reviewId}`,
    },

    // --- Review Image Endpoints ---
    REVIEW_IMAGES: {
        UPLOAD: (reviewId) => `${API_BASE_URL}/reviews/${reviewId}/images`,
        DELETE: (imageId) => `${API_BASE_URL}/review-images/${imageId}`,
    },

    // --- Role Endpoints (Admin only) ---
    ROLES: {
        GET_ALL: `${API_BASE_URL}/roles`,
        CREATE: `${API_BASE_URL}/roles`,
        GET_BY_ID: (id) => `${API_BASE_URL}/roles/${id}`,
        UPDATE: (id) => `${API_BASE_URL}/roles/${id}`,
        DELETE: (id) => `${API_BASE_URL}/roles/${id}`,
    },
    // --- Chat Endpoints ---
    CHATS: {
        SEND_MESSAGE: `${API_BASE_URL}/chats`, // POST /api/v1/chats
        GET_HISTORY: (bookingId) => `${API_BASE_URL}/chats/booking/${bookingId}`,
    },

    // --- Food Recommendation Endpoints ---
    FOOD_RECOMMENDATIONS: {
        GET_BY_LOCATION: (locationId) => `${API_BASE_URL}/food-recommendations/${locationId}/food-recommendations`,
        CREATE: `${API_BASE_URL}/food-recommendations`,
        UPDATE: (id) => `${API_BASE_URL}/food-recommendations/${id}`,
        DELETE: (id) => `${API_BASE_URL}/food-recommendations/${id}`,
    },
    // --- Booking Endpoints ---
    BOOKINGS: {
        CREATE: `${API_BASE_URL}/bookings`, // POST /api/v1/bookings
        GET_DETAILS: (bookingId) => `${API_BASE_URL}/bookings/${bookingId}`,
        UPDATE_STATUS: (bookingId) => `${API_BASE_URL}/bookings/${bookingId}/status`,
        GET_HISTORY: (bookingId) => `${API_BASE_URL}/bookings/${bookingId}/history`,
    },

    // --- Booking Detail Endpoints ---
    BOOKING_DETAILS: {
        GET_BY_ID: (detailId) => `${API_BASE_URL}/booking-details/${detailId}`,
        GET_BY_BOOKING: (bookingId) => `${API_BASE_URL}/booking-details/booking/${bookingId}`,
        ADD_DETAILS: (bookingId) => `${API_BASE_URL}/booking-details/booking/${bookingId}`,
    },
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
        CREATE: `${API_BASE_URL}/users`,
        UPDATE: (userId) => `${API_BASE_URL}/users/${userId}`,
        DELETE: (userId) => `${API_BASE_URL}/users/${userId}`,
        UPDATE_STATUS: (userId) => `${API_BASE_URL}/users/${userId}/status`,
        // Hotel Owners Management
        GET_HOTEL_OWNERS: `${API_BASE_URL}/users/hotel-owners`,
        GET_BY_ROLE: (roleId) => `${API_BASE_URL}/users/role/${roleId}`,
        UPDATE_USER_ROLE: (userId) => `${API_BASE_URL}/users/${userId}/role`,
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
    // Public
    GET_ALL: `${API_BASE_URL}/promotions`,
    GET_BY_CODE: (code) => `${API_BASE_URL}/promotions/code/${code}`,
    VALIDATE_CODE: `${API_BASE_URL}/promotions/validate`,

    // Authenticated (Admin & Hotel Owner)
    CREATE: `${API_BASE_URL}/promotions`,
    UPDATE: (promotionId) => `${API_BASE_URL}/promotions/${promotionId}`,
    DELETE: (promotionId) => `${API_BASE_URL}/promotions/${promotionId}`,

    GET_DETAILS: (promotionId) => `${API_BASE_URL}/promotions/${promotionId}/details`,
    ADD_DETAILS: (promotionId) => `${API_BASE_URL}/promotions/${promotionId}/details`,
    GET_BY_ID: (promotionId) => `${API_BASE_URL}/promotions/${promotionId}`,

    // /promotions/:promotionId/usage-history
    GET_USAGE_HISTORY: (promotionId) => `${API_BASE_URL}/promotions/${promotionId}/usage-history`,
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

        // User Management (Admin) - 
        GET_ALL_USERS: `${API_BASE_URL}/users`, 
        GET_USERS_BY_ROLE: (roleId) => `${API_BASE_URL}/users/role/${roleId}`,
        GET_HOTEL_OWNERS: `${API_BASE_URL}/users/hotel-owners`, 
        
        // Hotel Owner Management 
        CREATE_HOTEL_OWNER: `${API_BASE_URL}/users`, 
        UPDATE_USER_STATUS: (userId) => `${API_BASE_URL}/users/${userId}/status`,
        UPDATE_USER_ROLE: (userId) => `${API_BASE_URL}/users/${userId}/role`,
        SUSPEND_HOTEL_OWNER: (ownerId) => `${API_BASE_URL}/users/${ownerId}`, // Có thể patch status
        ACTIVATE_HOTEL_OWNER: (ownerId) => `${API_BASE_URL}/users/${ownerId}`, // Có thể patch status

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
    // Sửa lại cho đúng route backend: GET_BY_SLUG
    GET_BY_SLUG: (slug) => `${API_BASE_URL}/blogs/${slug}`,
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
    // Thêm endpoint xóa ảnh theo imageId
    DELETE_IMAGE_BY_ID: (imageId) => `${API_BASE_URL}/blog-images/${imageId}`,

    // Blog comment endpoints
    GET_COMMENTS: (blogId) => `${API_BASE_URL}/blogs/${blogId}/comments`,
    CREATE_COMMENT: (blogId) => `${API_BASE_URL}/blogs/${blogId}/comments`,
    DELETE_COMMENT: (commentId) => `${API_BASE_URL}/comments/${commentId}`,

    // Blog like endpoints
    LIKE: (blogId) => `${API_BASE_URL}/blogs/${blogId}/like`,
    UNLIKE: (likeId) => `${API_BASE_URL}/blogs/${likeId}/like`,

    // Blog statistics
    GET_STATS: `${API_BASE_URL}/blogs/admin/statistics`,
    GET_BLOG_STATS: (blogId) => `${API_BASE_URL}/blogs/admin/statistics`,
    INCREMENT_VIEW: (blogId) => `${API_BASE_URL}/blogs/${blogId}/view`,
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
    // GET /api/v1/hotels/:hotelId/staff
    GET_HOTEL_STAFF: (hotelId) => `${API_BASE_URL}/hotels/${hotelId}/staff`,
    // POST /api/v1/hotels/:hotelId/staff
    ADD_STAFF: (hotelId) => `${API_BASE_URL}/hotels/${hotelId}/staff`,
    // PUT /api/v1/staff/:staffId
    UPDATE: (staffId) => `${API_BASE_URL}/staff/${staffId}`,
    // DELETE /api/v1/staff/:staffId
    DELETE: (staffId) => `${API_BASE_URL}/staff/${staffId}`,
    // GET /api/v1/staff/:staffId
    GET_BY_ID: (staffId) => `${API_BASE_URL}/staff/${staffId}`,
    },

    // Common endpoints
    COMMON: {
        GET_AMENITIES: `${API_BASE_URL}/amenities`,
        SEARCH_HOTELS: `${API_BASE_URL}/hotels/search`,
        GET_CITIES: `${API_BASE_URL}/hotels/cities`,
    },
};