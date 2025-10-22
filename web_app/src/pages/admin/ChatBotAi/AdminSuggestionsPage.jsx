// src/pages/admin/ChatBotAi/AdminSuggestionsPage.jsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Send, Loader2 } from 'lucide-react';
import {
  chatSuggest,
  getChatSessions,
  getChatMessages,
} from '../../../api/chatbot.service';

/* ========================== Utils & Helpers ========================== */
const cls = (...a) => a.filter(Boolean).join(' ');
const fmtTime = (s) => (s ? new Date(s).toLocaleString('vi-VN') : '');
const fmtDate = (s) => (s ? new Date(s).toLocaleDateString('vi-VN') : '');
const fmtPercent = (v) =>
  v || v === 0 ? `${Number(v).toFixed(Number(v) % 1 ? 2 : 0)}%` : null;
const fmtMoney = (v) =>
  v || v === 0 ? new Intl.NumberFormat('vi-VN').format(Number(v)) + '₫' : null;

/** Trả về payload chuẩn hoá từ nhiều schema khác nhau (kể cả chuỗi JSON) */
function pickPayload(m) {
  let p =
    m?.reply?.payload ||
    m?.replyPayload ||
    m?.payload ||
    m?.reply ||
    null;
  if (typeof p === 'string') {
    try {
      p = JSON.parse(p);
    } catch {
      p = { text: p };
    }
  }
  return p;
}

/** Lấy text câu hỏi (user) từ nhiều schema */
// function pickUserText(m) {
//   return (
//     m?.message?.text ||
//     m?.messageText ||
//     m?.message_text ||
//     m?.question ||
//     ''
//   );
// }

/* ========================== Rich render cho payload ========================== */
function HotelsList({ hotels = [] }) {
  if (!Array.isArray(hotels) || hotels.length === 0) return null;
  return (
    <div className="space-y-3">
      <div className="font-semibold text-lg">Khách sạn nổi bật</div>
      <ul className="list-disc pl-6 space-y-2">
        {hotels.map((h, i) => (
          <li key={h?.hotel_id || i} className="text-base leading-relaxed">
            <span className="font-medium">{h?.name || 'Khách sạn'}</span>
            {h?.address && <span className="text-gray-600"> — {h.address}</span>}
            {(h?.star_rating || h?.average_rating) && (
              <span className="text-gray-700">
                {' '}
                • ⭐ {h?.star_rating ?? '-'} | ĐG TB: {h?.average_rating ?? '-'}
              </span>
            )}
            {h?.phone_number && <span className="text-gray-600"> • {h.phone_number}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PromotionsList({ promotions = [] }) {
  if (!Array.isArray(promotions) || promotions.length === 0) return null;
  return (
    <div className="space-y-3">
      <div className="font-semibold text-lg">Khuyến mãi</div>
      <ul className="list-disc pl-6 space-y-2">
        {promotions.map((p, i) => {
          const discount =
            fmtPercent(p?.discount_value) || fmtMoney(p?.discount_value);
          const timerange =
            (fmtDate(p?.valid_from) || '') +
            (p?.valid_from || p?.valid_until ? ' → ' : '') +
            (fmtDate(p?.valid_until) || '');
          return (
            <li key={p?.promotion_id || i} className="text-base leading-relaxed">
              <span className="font-medium">
                {p?.name || p?.code || 'Ưu đãi'}
              </span>
              {discount && <span className="text-gray-700"> — Giảm {discount}</span>}
              {timerange.trim() && <span className="text-gray-600"> • {timerange}</span>}
              {p?.description && <span className="text-gray-700">. {p.description}</span>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SimpleList({ title, items = [], nameKey = 'name' }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <div className="space-y-3">
      <div className="font-semibold text-lg">{title}</div>
      <ul className="list-disc pl-6 space-y-2">
        {items.map((x, i) => {
          const name = typeof x === 'string' ? x : x?.[nameKey] || x?.title || '';
          const where = x?.where || x?.place || x?.location || x?.address || '';
          const note = x?.hint || x?.description || x?.note || '';
          return (
            <li key={i} className="text-base leading-relaxed">
              <span className="font-medium">{name}</span>
              {where && <span className="text-gray-600"> — {where}</span>}
              {note && <span className="text-gray-700">. {note}</span>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function AssistantReply({ message }) {
  // Lấy payload trước, rồi mới lấy summary để tránh return sớm
  const pRaw = pickPayload(message);
  const p = (pRaw && typeof pRaw === 'object') ? pRaw : null;
  const summary = (p && p.summary) || message?.reply?.text || '';

  // Nếu payload không phải object hợp lệ
  if (!p) {
    return summary
      ? <div className="text-base leading-relaxed whitespace-pre-wrap">{summary}</div>
      : <div className="text-base">(payload)</div>;
  }

  // 2a) Clarify / no data gợi ý
  if (p.clarify_required || (Array.isArray(p.suggestions) && p.suggestions.length === 0)) {
    return (
      <div className="space-y-3">
        <div className="text-base">Hiện mình chưa có đủ dữ liệu để trả lời câu hỏi này.</div>
        <div className="text-gray-700 text-base">Bạn có thể thử:</div>
        <ul className="list-disc pl-6 text-gray-700 space-y-1 text-base">
          <li>Nhập rõ <b>tỉnh/thành</b> (VD: "Đà Nẵng", "Đà Lạt", "Hà Nội"...)</li>
          <li>Thêm ngữ cảnh: "khách sạn <i>có hồ bơi</i>", "<i>voucher</i> khách sạn <i>tháng 9</i>"…</li>
          <li>Dùng nhanh: "Top 5 khách sạn Đà Nẵng", "Voucher khách sạn Hồ Chí Minh tháng 9"…</li>
        </ul>
      </div>
    );
  }

  // Trích xuất các mảng dữ liệu
  const hotels = p.hotels || p.data?.hotels || [];
  const promos = p.promotions || p.data?.promotions || [];
  const places = p.places || p.destinations || p.diem_den || [];
  const foods  = p.dishes || p.foods || p.mon_an || p.specialties || [];
  const tips   = p.tips || p.ghi_chu || p.notes || [];

  // Kiểm tra hoàn toàn rỗng
  const allEmpty = hotels.length === 0 && promos.length === 0 && places.length === 0 && foods.length === 0 && tips.length === 0;

  if (allEmpty && (p.hotels !== undefined || p.promotions !== undefined || p.places !== undefined || p.dishes !== undefined || p.foods !== undefined)) {
    return (
      <div className="space-y-3">
        <div className="text-orange-600 font-medium text-lg">Xin lỗi, dữ liệu không có trên hệ thống</div>
        <div className="text-gray-700 text-base">Bạn có thể thử:</div>
        <ul className="list-disc pl-6 text-gray-700 space-y-1 text-base">
          <li>Thay đổi địa điểm: "Top 5 khách sạn Hà Nội", "Voucher Đà Nẵng"…</li>
          <li>Thử từ khóa khác: "spa", "hồ bơi", "gần biển"…</li>
          <li>Kiểm tra chính tả tên tỉnh/thành phố</li>
        </ul>
      </div>
    );
  }

  const hasAny = hotels.length || promos.length || places.length || foods.length || tips.length;

  if (hasAny) {
    return (
      <div className="space-y-5">
        {summary && <div className="text-base leading-relaxed whitespace-pre-wrap">{summary}</div>}
        <HotelsList hotels={hotels} />
        <PromotionsList promotions={promos} />
        <SimpleList title="Địa danh gợi ý" items={places} />
        <SimpleList title="Món ăn nên thử" items={foods} />
        <SimpleList title="Mẹo nhỏ" items={tips} nameKey="" />
      </div>
    );
  }

  // 2c) Không nhận diện được → nếu có summary thì in summary, nếu không in JSON
  if (summary) {
    return <div className="text-base leading-relaxed whitespace-pre-wrap">{summary}</div>;
  }
  try {
    return (
      <pre className="text-sm leading-relaxed whitespace-pre-wrap break-words">
        {JSON.stringify(p, null, 2)}
      </pre>
    );
  } catch {
    return <div className="text-base">(payload)</div>;
  }
}

/* ========================== Main Page ========================== */
export default function AdminSuggestionsPage() {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState('');

  const listEndRef = useRef(null);
  const inputRef = useRef(null);
  const lastSentRef = useRef(0); // Track last sent timestamp for client-side dedupe

  const headers = useMemo(() => {
    const h = {};
    const token = localStorage.getItem('accessToken');
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, []);

  const loadSessions = async () => {
    setLoadingList(true);
    try {
      const res = await getChatSessions(headers);
      setSessions(res?.data || []);
    } catch {
      setSessions([]);
    } finally {
      setLoadingList(false);
    }
  };

  const openSession = async (sid) => {
    setActiveSession(sid);
    setLoadingMsgs(true);
    try {
      const res = await getChatMessages(sid, 1, 500, headers);
      setMessages(res?.items || []);
    } catch {
      setMessages([]);
    } finally {
      setLoadingMsgs(false);
    }
  };

  const newChat = () => {
    const sid = crypto.randomUUID();
    setActiveSession(sid);
    setMessages([]);
  };

  const onSend = async () => {
    const text = msg.trim();
    if (!text || sending) return;

    // ✅ CLIENT-SIDE DEDUPE: Check if sent recently (< 2 seconds)
    const now = Date.now();
    if (now - lastSentRef.current < 2000) {
      console.warn('⚠️ Client-side dedupe: message sent too quickly');
      setMessages(prev => [
        ...prev,
        {
          reply: { text: '⚠️ Vui lòng đợi vài giây giữa các tin nhắn.' },
          created_at: new Date().toISOString(),
          source: 'client-dedupe'
        }
      ]);
      return;
    }
    lastSentRef.current = now;

    // ✅ XÓA INPUT NGAY LẬP TỨC (trước khi gửi)
    setMsg('');

    // ✅ Focus back to input after clearing (better UX)
    setTimeout(() => inputRef.current?.focus(), 50);

    // Optional: hạn chế độ dài để tránh request quá lớn
    if (text.length > 2000) {
      setMessages(prev => [
        ...prev,
        {
          reply: { text: '❗ Câu hỏi quá dài (>' + text.length + ' ký tự). Vui lòng rút gọn.' },
          created_at: new Date().toISOString(),
          source: 'system'
        }
      ]);
      return;
    }

    let sid = activeSession;
    if (!sid) {
      sid = crypto.randomUUID();
      setActiveSession(sid);
    }

    // ✅ SET SENDING STATE TRƯỚC KHI PUSH MESSAGE
    setSending(true);

    // ✅ Push user bubble ngay (optimistic UI)
    setMessages((prev) => [
      ...prev,
      { 
        message: { text }, 
        created_at: new Date().toISOString(), 
        source: 'client',
        _optimistic: true // đánh dấu là optimistic update
      },
    ]);

    try {
      const token = localStorage.getItem('accessToken');

      // Body mở rộng ép LLM + chỗ để truyền các tham số tùy chọn
      const body = {
        message: text,
        use_llm: true,
        session_id: sid, // thêm session_id vào body
        // top_n: 8,
        // filters: { amenities: ['pool'] },
      };

      // Headers (ép LLM thêm 1 lần qua header để BE ưu tiên)
      const h = {
        ...headers,
        'X-Session-Id': sid,
        'x-use-llm': 'true',
        // Có token thì gắn (ghi đè phòng khi headers cũ chưa có)
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      // ✅ Gửi request
      const res = await chatSuggest(text, body, h);

      // ✅ Check dedupe header
      const isDedupe = res?._headers?.['x-dedupe'] === 'true' || res?.isDedupe;
      if (isDedupe) {
        console.log('🔄 Received cached response (dedupe)');
      }

      // ✅ Push assistant (res trả raw payload → để AssistantReply xử lý)
      setMessages((prev) => [
        ...prev,
        {
          replyPayload: res,
          created_at: new Date().toISOString(),
          source: res?.source || 'nosql+llm',
          isDedupe
        },
      ]);

      // ✅ Đồng bộ lại từ server (debounced để tránh spam)
      setTimeout(() => {
        if (activeSession === sid) {
          openSession(sid);
        }
      }, 500);
      
      // ✅ Refresh sessions list (debounced)
      setTimeout(() => loadSessions(), 800);
    } catch (e) {
      console.error('❌ Chat error:', e?.response?.data || e?.message);
      
      // ✅ Handle duplicate error (HTTP 409)
      if (e?.response?.status === 409 || e?.response?.data?.code === 'DUPLICATE_MESSAGE') {
        console.warn('⚠️ Duplicate message detected by backend');
        setMessages(prev => [
          ...prev,
          {
            reply: { text: '⚠️ Tin nhắn này vừa được gửi. Vui lòng đợi vài giây trước khi gửi lại.' },
            created_at: new Date().toISOString(),
            source: 'dedupe'
          }
        ]);
        return;
      }

      setMessages(prev => [
        ...prev,
        {
          reply: { text: '⚠️ Gửi thất bại: ' + (e?.response?.data?.message || e.message || 'Unknown error') },
          created_at: new Date().toISOString(),
          source: 'error'
        }
      ]);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto scroll khi có tin mới
  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  return (
    <div className="h-screen w-full flex overflow-hidden">
      {/* Sidebar - tăng width */}
      <aside className="w-[320px] shrink-0 border-r bg-white flex flex-col">
        <div className="p-4 flex gap-3 shrink-0">
          <button
            onClick={newChat}
            className="flex-1 h-11 inline-flex items-center justify-center gap-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium"
            title="New chat"
          >
            <Plus size={18} /> New chat
          </button>
          <button
            onClick={loadSessions}
            className="w-11 h-11 inline-flex items-center justify-center rounded-lg border hover:bg-gray-50"
            title="Tải lại"
          >
            {loadingList ? <Loader2 className="animate-spin" size={18} /> : '↻'}
          </button>
        </div>

        <div className="px-4 pb-3 text-sm text-gray-500 shrink-0">Phiên gần đây</div>
        <div className="flex-1 overflow-y-auto px-3 space-y-2 min-h-0">
          {sessions.map((s) => {
            const sid = s._id || s.session_id;
            const active = activeSession === sid;
            return (
              <button
                key={sid}
                onClick={() => openSession(sid)}
                className={cls(
                  'w-full text-left p-4 rounded-lg border transition',
                  active ? 'border-orange-300 bg-orange-50' : 'border-gray-200 hover:bg-gray-50'
                )}
              >
                <div className="text-sm text-gray-500">{fmtTime(s.last_at)}</div>
                <div className="text-base font-medium line-clamp-2 leading-tight mt-1">{s.last_question || 'Untitled'}</div>
                <div className="text-sm text-gray-500 mt-1">Turns: {s.turns || 0} • {s.last_source || ''}</div>
              </button>
            );
          })}
          {!sessions.length && !loadingList && (
            <div className="text-sm text-gray-500 px-3">
              Chưa có phiên nào (hãy đăng nhập và chat).
            </div>
          )}
        </div>
      </aside>

      {/* Chat area */}
      <main className="flex-1 flex flex-col bg-[#fafafa] min-w-0">
        {/* Header - Fixed */}
        <div className="h-14 px-6 border-b bg-white flex items-center justify-between shrink-0">
          <div className="font-semibold text-lg">Chat gợi ý du lịch</div>
          <div className="text-sm text-gray-500 truncate ml-2">
            {activeSession ? `Session: ${activeSession.slice(0, 8)}...` : 'Chưa chọn phiên'}
          </div>
        </div>

        {/* Messages - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 min-h-0">
          {loadingMsgs && !messages.length && (
            <div className="text-gray-500 text-base">Đang tải hội thoại…</div>
          )}

          {!messages.length && !loadingMsgs && (
            <div className="text-gray-500 text-base">Hãy bắt đầu bằng "New chat" hoặc chọn một phiên bên trái.</div>
          )}

          {messages.map((m, idx) => {
            const userText =
              m?.message?.text ||
              m?.messageText ||
              m?.message_text ||
              m?.question ||
              '';

            const hasAssistantText = !!m?.reply?.text;
            const hasAssistantPayload =
              !!m?.replyPayload || !!m?.reply?.payload || !!m?.payload || !!m?.reply;

            return (
              <div key={idx} className="space-y-3">
                {/* USER bubble */}
                {userText && (
                  <div className="flex justify-end">
                    <div className="max-w-[min(800px,85%)] w-fit px-5 py-3 rounded-2xl bg-orange-600 text-white text-base leading-relaxed">
                      {userText}
                    </div>
                  </div>
                )}

                {/* ASSISTANT bubble */}
                {(hasAssistantText || hasAssistantPayload) && (
                  <div className="flex justify-start">
                    <div className="max-w-[min(800px,85%)] w-fit px-5 py-4 rounded-2xl bg-white shadow border">
                      <div className="text-xs text-gray-500 mb-3 flex items-center gap-2">
                        <span>{fmtTime(m.created_at)}</span>
                        {m.source && <span>• {m.source}</span>}
                        {m.isDedupe && (
                          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-medium">
                            🔄 Cached
                          </span>
                        )}
                      </div>
                      <AssistantReply message={m} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {sending && (
            <div className="flex justify-start">
              <div className="max-w-[75%] px-5 py-3 rounded-2xl bg-white shadow border text-gray-600 flex items-center gap-2 text-base">
                <Loader2 className="animate-spin" size={18} /> Đang suy nghĩ…
              </div>
            </div>
          )}

          {/* Auto scroll anchor */}
          <div ref={listEndRef} />
        </div>

        {/* Composer - Fixed */}
        <div className="border-t bg-white p-4 flex gap-3 shrink-0">
          <input
            ref={inputRef}
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder="Nhập câu hỏi… (VD: Top 5 khách sạn Đà Nẵng / Voucher khách sạn Hồ Chí Minh tháng 9)"
            className="flex-1 h-12 px-4 rounded-lg border text-base focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            disabled={sending}
            autoFocus
          />
          <button
            onClick={onSend}
            disabled={sending || !msg.trim()}
            className={cls(
              'h-12 px-5 rounded-lg inline-flex items-center gap-2 text-base font-medium transition-all',
              sending || !msg.trim()
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-orange-600 text-white hover:bg-orange-700 active:scale-95'
            )}
          >
            {sending ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Đang gửi...
              </>
            ) : (
              <>
                <Send size={18} />
                Gửi
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
