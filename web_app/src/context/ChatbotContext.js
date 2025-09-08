// src/context/ChatbotContext.js
import React, { createContext, useReducer, useMemo } from 'react';
import { chatSuggest, provincesAutocomplete } from '../api/chatbot.service';

const ChatbotContext = createContext(null);

const initialState = {
  messages: [],           // [{id, role: 'user'|'assistant', content, ts}]
  loading: false,
  suggestions: [],        // clarify suggestions (tên tỉnh)
  lastResponse: null,     // JSON trả về từ BE
  error: null,
  filters: {},            // { seafood:true, meal:'toi', ... }
  topN: 7,                // số item muốn lấy mặc định
  useLLM: true,      // có thể override BE (true/false), undefined = mặc định
  latencyMs: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SEND_START':
      return { ...state, loading: true, error: null, suggestions: [] };
    case 'SEND_SUCCESS':
      return {
        ...state,
        loading: false,
        lastResponse: action.payload.data,
        suggestions: [],
        latencyMs: action.payload.latencyMs ?? null,
        messages: [
          ...state.messages,
          { id: crypto.randomUUID(), role: 'user', content: action.payload.userMsg, ts: Date.now() },
          { id: crypto.randomUUID(), role: 'assistant', content: JSON.stringify(action.payload.data), ts: Date.now() }
        ],
      };
    case 'SEND_CLARIFY':
      return {
        ...state,
        loading: false,
        lastResponse: action.payload.data,
        suggestions: action.payload.data?.suggestions || [],
        latencyMs: action.payload.latencyMs ?? null,
        messages: [
          ...state.messages,
          { id: crypto.randomUUID(), role: 'user', content: action.payload.userMsg, ts: Date.now() },
          { id: crypto.randomUUID(), role: 'assistant',
            content: 'Cần chọn tỉnh/thành: ' + (action.payload.data?.suggestions || []).join(' • '),
            ts: Date.now()
          }
        ],
      };
    case 'SEND_ERROR':
      return { ...state, loading: false, error: action.error || 'UNKNOWN_ERROR' };
    case 'SET_FILTERS':
      return { ...state, filters: { ...(state.filters||{}), ...(action.filters||{}) } };
    case 'SET_TOPN':
      return { ...state, topN: action.topN || 7 };
    case 'SET_USE_LLM':
      return { ...state, useLLM: action.value };
    case 'RESET':
      return { ...initialState };
    default:
      return state;
  }
}

export function ChatbotProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  /** Gửi câu hỏi tới BE */
  const sendMessage = async (message, opts = {}) => {
    const userMsg = String(message || '').trim();
    if (!userMsg) return;

    dispatch({ type: 'SEND_START' });
    try {
      const body = {
        message: userMsg,
        top_n: opts.top_n ?? state.topN,
        filters: { ...(state.filters || {}), ...(opts.filters || {}) },
      };
      if (typeof state.useLLM === 'boolean') body.use_llm = state.useLLM;
      if (typeof opts.use_llm === 'boolean') body.use_llm = opts.use_llm;

      // gọi BE
      const t0 = performance.now();
      const data = await chatSuggest(userMsg, body); // service đã .then(r => r.data)
      const t1 = performance.now();
      const latencyMs = Math.round(t1 - t0);

      if (data?.clarify_required) {
        dispatch({ type: 'SEND_CLARIFY', payload: { data, latencyMs, userMsg } });
      } else {
        dispatch({ type: 'SEND_SUCCESS', payload: { data, latencyMs, userMsg } });
      }
      return data;
    } catch (err) {
      dispatch({ type: 'SEND_ERROR', error: err?.response?.data || err?.message });
      return null;
    }
  };

  /** Chọn 1 gợi ý từ clarify -> query lại */
  const chooseSuggestion = async (suggestion) => {
    if (!suggestion) return;
    // Gửi lại nguyên tên tỉnh; BE sẽ detect intent từ message cũ nếu bạn muốn có thể thêm template “{tỉnh} ăn gì/đi đâu”
    return sendMessage(String(suggestion));
  };

  /** Autocomplete tỉnh cho ô input (dùng chung) */
  const autocomplete = async (q) => {
    if (!q || q.length < 2) return [];
    try {
      const list = await provincesAutocomplete(q); // service đã .then(r => r.data)
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  };

  /** Setters nhỏ */
  const setFilters  = (filters) => dispatch({ type: 'SET_FILTERS', filters });
  const setTopN     = (n)       => dispatch({ type: 'SET_TOPN', topN: n });
  const setUseLLM   = (v)       => dispatch({ type: 'SET_USE_LLM', value: v });
  const reset       = ()        => dispatch({ type: 'RESET' });

  const value = useMemo(
    () => ({ state, sendMessage, chooseSuggestion, autocomplete, setFilters, setTopN, setUseLLM, reset }),
    [state]
  );

  return <ChatbotContext.Provider value={value}>{children}</ChatbotContext.Provider>;
}

export default ChatbotContext;
