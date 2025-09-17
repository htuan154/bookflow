// src/api/chatbot.service.js
import axiosClient from '../config/axiosClient';
import { API_ENDPOINTS } from '../config/apiEndpoints';

export const chatSuggest = (message, opts = {}, headers = {}) =>
  axiosClient
    .post(
      API_ENDPOINTS.CHATBOT.SUGGEST,
      // ép body.use_llm = true nếu caller chưa set
      { message, use_llm: opts.use_llm ?? true, ...opts },
      {
        headers: {
          'x-use-llm': headers['x-use-llm'] ?? 'true', // ép header cho chắc
          ...headers,
        },
      }
    )
    .then(r => r.data);

export const chatHealth = () =>
  axiosClient.get(API_ENDPOINTS.CHATBOT.HEALTH).then(r => r.data);

export const provincesAutocomplete = (q) =>
  axiosClient.get(API_ENDPOINTS.CHATBOT.AUTOCOMPLETE(q)).then(r => r.data);

export const getChatSessions = (headers = {}) =>
  axiosClient.get(API_ENDPOINTS.CHATBOT.HISTORY.SESSIONS, { headers })
    .then(r => r.data);

export const getChatMessages = (sessionId, page = 1, pageSize = 20, headers = {}) =>
  axiosClient.get(API_ENDPOINTS.CHATBOT.HISTORY.MESSAGES(sessionId, page, pageSize), { headers })
    .then(r => r.data);

// ---- Hotels ----
export const searchHotels = (city, q, limit = 20, headers = {}) =>
  axiosClient
    .get(API_ENDPOINTS.CHATBOT.HOTELS.SEARCH(city, q, limit), { headers })
    .then(r => r.data);

export const getHotelsByAnyAmenities = (city, amenities = [], limit = 10, headers = {}) =>
  axiosClient
    .post(API_ENDPOINTS.CHATBOT.HOTELS.BY_ANY_AMENITIES, { city, amenities, limit }, { headers })
    .then(r => r.data);

export const getHotelFull = (hotelId, headers = {}) =>
  axiosClient
    .get(API_ENDPOINTS.CHATBOT.HOTELS.FULL(hotelId), { headers })
    .then(r => r.data);

// ---- Promotions ----
export const getPromotionsValidToday = (limit = 50, headers = {}) =>
  axiosClient
    .get(API_ENDPOINTS.CHATBOT.PROMOTIONS.VALID_TODAY(limit), { headers })
    .then(r => r.data);

export const getPromotionsValidTodayByCity = (city, limit = 50, headers = {}) =>
  axiosClient
    .get(API_ENDPOINTS.CHATBOT.PROMOTIONS.VALID_TODAY_CITY(city, limit), { headers })
    .then(r => r.data);

export const getPromotionsByKeywordCityMonth = (city, kw, year, month, limit = 50, headers = {}) =>
  axiosClient
    .get(API_ENDPOINTS.CHATBOT.PROMOTIONS.KEYWORD_CITY_MONTH(city, kw, year, month, limit), { headers })
    .then(r => r.data);

export const promoCheckApplicability = (code, userId, bookingAmount, when = null, headers = {}) =>
  axiosClient
    .post(API_ENDPOINTS.CHATBOT.PROMOTIONS.CHECK, { code, userId, bookingAmount, when }, { headers })
    .then(r => r.data);

export const promoUsageStats = (promotionId, headers = {}) =>
  axiosClient
    .get(API_ENDPOINTS.CHATBOT.PROMOTIONS.USAGE_STATS(promotionId), { headers })
    .then(r => r.data);

// ---- Cities ----
export const listHotelCities = (headers = {}) =>
  axiosClient
    .get(API_ENDPOINTS.CHATBOT.HOTELS.CITIES, { headers })
    .then(r => r.data);
