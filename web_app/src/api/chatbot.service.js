// src/api/chatbot.service.js
import axiosClient from '../config/axiosClient';
import { API_ENDPOINTS } from '../config/apiEndpoints';

export const chatSuggest = (message, opts = {}) =>
  axiosClient.post(API_ENDPOINTS.CHATBOT.SUGGEST, { message, ...opts })
             .then(r => r.data);

export const chatHealth = () =>
  axiosClient.get(API_ENDPOINTS.CHATBOT.HEALTH).then(r => r.data);

export const provincesAutocomplete = (q) =>
  axiosClient.get(API_ENDPOINTS.CHATBOT.AUTOCOMPLETE(q)).then(r => r.data);
