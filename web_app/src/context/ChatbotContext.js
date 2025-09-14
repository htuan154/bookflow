// src/context/ChatbotContext.js
import React, { createContext, useReducer, useMemo, useRef } from 'react';
import useAuth from '../hooks/useAuth'
import {
  chatSuggest,
  provincesAutocomplete,
  getChatSessions,
  getChatMessages,
} from '../api/chatbot.service';

const ChatbotContext = createContext(null);

const initialState = {
  // hội thoại hiện tại (UI đang hiển thị)
  messages: [],               // [{id, role: 'user'|'assistant'|'system', content, ts}]
  loading: false,
  suggestions: [],            // gợi ý clarify (tên tỉnh/thành)
  lastResponse: null,         // JSON trả về từ BE (để dev xem raw khi cần)
  error: null,

  // tuỳ chọn gửi
  filters: {},                // { seafood:true, meal:'toi', ... }
  topN: 5,                    // số item muốn lấy mặc định
  useLLM: true,               // override BE (true/false), undefined = mặc định

  latencyMs: null,

  // quản lý lịch sử (sessions/messages)
  sessions: [],               // [{sessionId, firstAt, lastAt, turns, meta...}]
  activeSessionId: null,      // đang xem/tiếp tục phiên nào
  historyLoading: false,
  historyError: null,

  // phân trang messages lịch sử
  page: 1,
  pageSize: 20,
  hasMore: true,
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
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            // Hiển thị “thân thiện” nếu BE không trả gì hữu ích
            content: stringifyAssistantPayload(action.payload.data),
            ts: Date.now(),
          }
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
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: buildClarifyMessage(action.payload.data?.suggestions || []),
            ts: Date.now()
          }
        ],
      };

    case 'SEND_ERROR':
      return { ...state, loading: false, error: normalizeError(action.error) };

    case 'SET_FILTERS':
      return { ...state, filters: { ...(state.filters || {}), ...(action.filters || {}) } };

    case 'SET_TOPN':
      return { ...state, topN: action.topN || 5 };

    case 'SET_USE_LLM':
      return { ...state, useLLM: action.value };

    case 'RESET':
      return { ...initialState, activeSessionId: state.activeSessionId }; // giữ session hiện hành

    // ======= LỊCH SỬ =======
    case 'HIST_SESS_START':
      return { ...state, historyLoading: true, historyError: null };

    case 'HIST_SESS_SUCCESS':
      return {
        ...state,
        historyLoading: false,
        sessions: Array.isArray(action.sessions) ? action.sessions : [],
        // nếu chưa có activeSession, chọn phiên mới nhất
        activeSessionId: state.activeSessionId || action.sessions?.[0]?.sessionId || null,
      };

    case 'HIST_SESS_ERROR':
      return { ...state, historyLoading: false, historyError: normalizeError(action.error) };

    case 'HIST_MSG_START':
      return { ...state, historyLoading: true, historyError: null, messages: [] };

    case 'HIST_MSG_SUCCESS':
      return {
        ...state,
        historyLoading: false,
        messages: mergeHistoryIntoMessages(action.items),
        page: action.page,
        pageSize: action.pageSize,
        hasMore: !!action.hasMore,
        activeSessionId: action.sessionId || state.activeSessionId,
      };

    case 'HIST_MSG_ERROR':
      return { ...state, historyLoading: false, historyError: normalizeError(action.error) };

    case 'SET_ACTIVE_SESSION':
      return { ...state, activeSessionId: action.sessionId };

    default:
      return state;
  }
}

/** Xây “assistant bubble” dễ đọc nếu data rỗng */
function stringifyAssistantPayload(data) {
  try {
    if (!data || typeof data !== 'object') {
      return 'Mình chưa có dữ liệu phù hợp. Bạn thử mô tả rõ hơn nhé!';
    }

    // Nếu có danh sách hotels/promotions nhưng trống -> trả lời mặc định
    if (Array.isArray(data.hotels) && data.hotels.length === 0) {
      return 'Chưa tìm thấy khách sạn phù hợp theo tiêu chí. Bạn thử đổi bộ lọc hoặc tỉnh/thành khác nhé!';
    }
    if (Array.isArray(data.promotions) && data.promotions.length === 0) {
      return 'Hiện chưa có khuyến mãi phù hợp. Bạn thử tháng khác, từ khoá khác, hoặc tỉnh khác nhé!';
    }
    if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
      return buildClarifyMessage(data.suggestions);
    }

    // Với fallback nosql+llm: chuẩn hoá khi “suggestions”: [] hoặc places/dishes rỗng
    if (data.source === 'nosql+llm') {
      const pieces = [];
      if (data.province) pieces.push(`**${String(data.province).trim()}**`);

      const places = Array.isArray(data.places) ? data.places : [];
      const dishes = Array.isArray(data.dishes) ? data.dishes : [];
      const tips   = Array.isArray(data.tips)   ? data.tips   : [];

      if (places.length) {
        pieces.push('• Địa điểm gợi ý:');
        pieces.push(...places.slice(0, 5).map((p, i) => `   ${i + 1}. ${p.name}${p.hint ? ` – ${p.hint}` : ''}`));
      }
      if (dishes.length) {
        pieces.push('• Món ăn gợi ý:');
        pieces.push(...dishes.slice(0, 5).map((d, i) => `   ${i + 1}. ${d.name}${d.where ? ` (${d.where})` : ''}`));
      }
      if (tips.length) {
        pieces.push('• Tips:');
        pieces.push(...tips.slice(0, 5).map((t, i) => `   - ${t}`));
      }

      if (pieces.length === 0) {
        return 'Mình chưa có gợi ý phù hợp. Bạn có thể chỉ rõ **tỉnh/thành** hoặc **món/điểm đến** cụ thể hơn nhé!';
      }
      return pieces.join('\n');
    }

    // Nếu đã có dữ liệu (sql:top/sql:amenities/...) thì stringify có kiểm soát
    return JSON.stringify(data, null, 2);
  } catch {
    return 'Có lỗi khi hiển thị kết quả. Bạn thử lại giúp mình nhé!';
  }
}

/** Tin nhắn clarify */
function buildClarifyMessage(suggestions) {
  const list = (suggestions || []).map(s => `“${s}”`).join(' • ');
  if (!list) {
    return 'Bạn vui lòng cung cấp **tỉnh/thành** để mình tư vấn chính xác hơn!';
  }
  return `Cần chọn tỉnh/thành: ${list}`;
}

/** Normalize lỗi cho state */
function normalizeError(err) {
  if (!err) return 'UNKNOWN_ERROR';
  if (typeof err === 'string') return err;
  if (err.message) return err.message;
  if (err.error) return err.error;
  try { return JSON.stringify(err); } catch { return 'ERROR'; }
}

/** Gộp dữ liệu history (server payload) -> mảng messages UI */
function mergeHistoryIntoMessages(items) {
  // items có thể là [{ messageText, replyPayload, createdAt, ... }]
  if (!Array.isArray(items) || items.length === 0) return [];
  const rows = [];
  items.forEach((row) => {
    const ts = row.createdAt ? new Date(row.createdAt).getTime() : Date.now();
    if (row.messageText) {
      rows.push({ id: crypto.randomUUID(), role: 'user', content: row.messageText, ts });
    }
    if (row.replyPayload) {
      rows.push({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: stringifyAssistantPayload(row.replyPayload),
        ts: ts + 1,
      });
    }
  });
  return rows;
}

export function ChatbotProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  // Session FE -> gửi BE để nhóm lịch sử
  const sessionRef = useRef(crypto.randomUUID());
  const { isAuthenticated, user, /* login, logout, */ isLoading, ...auth } = useAuth();
  /** Gửi câu hỏi tới BE (điểm chính) */
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

      const headers = { 'X-Session-Id': sessionRef.current };
      // nếu đang xem lại một session cụ thể -> gửi cùng header để BE lưu tiếp vào đúng session
      if (state.activeSessionId) headers['X-Session-Id'] = state.activeSessionId;

      const token = auth?.token || localStorage.getItem('token');
      if (token) headers.Authorization = `Bearer ${token}`;

      const t0 = performance.now();
      const data = await chatSuggest(userMsg, body, headers);
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

  /** Chọn 1 gợi ý clarify -> gửi lại luôn */
  const chooseSuggestion = async (suggestion) => {
    if (!suggestion) return;
    return sendMessage(String(suggestion));
  };

  /** Autocomplete tỉnh cho ô input (dùng chung) */
  const autocomplete = async (q) => {
    if (!q || q.length < 2) return [];
    try {
      const list = await provincesAutocomplete(q);
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  };

  /** === LỊCH SỬ: tải danh sách phiên === */
  const loadSessions = async () => {
    dispatch({ type: 'HIST_SESS_START' });
    try {
      const headers = {};
      const token = localStorage.getItem('accessToken');
      if (token) headers.Authorization = `Bearer ${token}`;
      const resp = await getChatSessions(headers); // {sessions: [...] } hoặc [...]
      const sessions = Array.isArray(resp?.sessions) ? resp.sessions : (Array.isArray(resp) ? resp : []);
      dispatch({ type: 'HIST_SESS_SUCCESS', sessions });
      return sessions;
    } catch (err) {
      dispatch({ type: 'HIST_SESS_ERROR', error: err?.response?.data || err?.message });
      return [];
    }
  };

  /** === LỊCH SỬ: tải tin nhắn trong 1 phiên (có phân trang) === */
  const loadMessages = async (sessionId, page = 1, pageSize = 20) => {
    if (!sessionId) return [];
    dispatch({ type: 'HIST_MSG_START' });
    try {
      const headers = {};
      const token = localStorage.getItem('accessToken');
      if (token) headers.Authorization = `Bearer ${token}`;
      const resp = await getChatMessages(sessionId, page, pageSize, headers);
      // BE có thể trả: { items, page, pageSize, hasMore } hoặc { data, ... }
      const items = resp?.items || resp?.data || [];
      const hasMore = !!(resp?.hasMore ?? (Array.isArray(items) && items.length === pageSize));
      dispatch({
        type: 'HIST_MSG_SUCCESS',
        items,
        page,
        pageSize,
        hasMore,
        sessionId,
      });
      // khi người dùng “tiếp tục chat” từ phiên cũ
      sessionRef.current = sessionId;
      return items;
    } catch (err) {
      dispatch({ type: 'HIST_MSG_ERROR', error: err?.response?.data || err?.message });
      return [];
    }
  };

  /** Bắt đầu một phiên mới (UI có thể gán nút “New chat”) */
  const startNewSession = () => {
    sessionRef.current = crypto.randomUUID();
    dispatch({ type: 'SET_ACTIVE_SESSION', sessionId: sessionRef.current });
    dispatch({ type: 'RESET' });
  };

  /** Khôi phục chat theo một sessionId có sẵn (khi chọn trong sidebar lịch sử) */
  const restoreSession = async (sessionId) => {
    if (!sessionId) return;
    dispatch({ type: 'SET_ACTIVE_SESSION', sessionId });
    await loadMessages(sessionId, 1, state.pageSize);
  };

  /** Setters nhỏ */
  const setFilters = (filters) => dispatch({ type: 'SET_FILTERS', filters });
  const setTopN = (n) => dispatch({ type: 'SET_TOPN', topN: n });
  const setUseLLM = (v) => dispatch({ type: 'SET_USE_LLM', value: v });
  const reset = () => dispatch({ type: 'RESET' });

  const value = useMemo(
    () => ({
      state,
      // chat chính
      sendMessage,
      chooseSuggestion,
      autocomplete,
      // lịch sử
      loadSessions,
      loadMessages,
      startNewSession,
      restoreSession,
      // tiện ích
      setFilters,
      setTopN,
      setUseLLM,
      reset,
    }),
    [state]
  );

  return <ChatbotContext.Provider value={value}>{children}</ChatbotContext.Provider>;
}

export default ChatbotContext;
