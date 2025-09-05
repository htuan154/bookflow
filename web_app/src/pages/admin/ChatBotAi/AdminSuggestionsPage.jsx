// src/pages/admin/ChatBotAi/AdminSuggestionsPage.jsx
import React, { useMemo, useRef, useEffect, useState } from 'react';
import { MapPin, Send, Loader2, Sparkles, Utensils, ChevronDown } from 'lucide-react';
import { ChatbotProvider } from '../../../context/ChatbotContext';
import useChatbot from '../../../hooks/useChatbot';
import useAutocomplete from '../../../hooks/useAutocomplete';

/* ===================== helpers ===================== */
const cx = (...cls) => cls.filter(Boolean).join(' ');

// RỘNG FULL NGANG (không giới hạn max-width)
const containerCls = 'mx-auto w-full px-6 max-w-none';

const Bubble = ({ role = 'assistant', children }) => {
  const isUser = role === 'user';
  return (
    <div className={cx('w-full', isUser ? 'flex justify-end' : 'flex justify-start')}>
      <div
        className={cx(
          'w-full rounded-2xl px-5 py-4 shadow-sm border',
          isUser
            ? 'bg-orange-500 text-white border-orange-500'
            : 'bg-white text-gray-800 border-gray-200'
        )}
      >
        {children}
      </div>
    </div>
  );
};

const TypingDots = () => (
  <div className="inline-flex items-center gap-1">
    <span className="w-2 h-2 rounded-full bg-gray-300 animate-bounce [animation-delay:-0.2s]" />
    <span className="w-2 h-2 rounded-full bg-gray-300 animate-bounce [animation-delay:-0.05s]" />
    <span className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" />
  </div>
);

const Pill = ({ children, onClick }) => (
  <button
    onClick={onClick}
    className="px-3 py-1.5 text-sm rounded-full bg-orange-100 text-orange-700 hover:bg-orange-200 transition"
  >
    {children}
  </button>
);

// Chuẩn hóa list theo nhiều schema BE khác nhau
function normalizeList(x) {
  if (!x) return [];
  if (Array.isArray(x)) return x;
  if (Array.isArray(x?.items)) return x.items;
  if (Array.isArray(x?.data)) return x.data;
  return [];
}
// Lấy danh sách đầu tiên có phần tử từ một loạt key
function pickList(obj, keys) {
  for (const k of keys) {
    const arr = normalizeList(obj?.[k]);
    if (arr && arr.length > 0) return arr;
  }
  return [];
}

/* ===================== Assistant Result (chat style) ===================== */
function AssistantResult({ response }) {
  const [showRaw, setShowRaw] = useState(false);

  const province =
    response?.province || response?.tinh || response?.provinceName || '';

  // Dùng pickList để không dính lỗi [] là truthy
  const places = pickList(response, ['places', 'destinations', 'diem_den']);
  const foods  = pickList(response, ['foods', 'dishes', 'mon_an', 'specialties']);
  const tips   = pickList(response, ['tips', 'ghi_chu', 'notes', 'suggestions']);

  const hasAny = places.length > 0 || foods.length > 0 || tips.length > 0;

  if (!hasAny) {
    return (
      <div className="space-y-2 leading-relaxed">
        <p>
          Mình chưa đọc được dữ liệu theo mẫu chuẩn. Bạn thử gõ lại tên tỉnh/thành
          hoặc chọn từ gợi ý phía trên nhé.
        </p>
        <button
          onClick={() => setShowRaw((v) => !v)}
          className="text-sm text-orange-600 hover:underline"
        >
          {showRaw ? 'Ẩn JSON' : 'Xem JSON'}
        </button>
        {showRaw && (
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-auto text-sm md:text-[15px] max-h-[70vh]">
{JSON.stringify(response ?? {}, null, 2)}
          </pre>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5 leading-relaxed text-[15px]">
      {province && (
        <p>Đây là một vài gợi ý cho <b>{province}</b>:</p>
      )}

      {places.length > 0 && (
        <div>
          <p className="font-semibold mb-2 flex items-center gap-2">
            <span className="inline-flex w-6 h-6 items-center justify-center rounded-full bg-orange-100">
              <MapPin size={16} className="text-orange-600" />
            </span>
            Địa danh nên ghé
          </p>
          <ul className="list-disc pl-6 text-gray-800">
            {places.map((p, i) => {
              const name = p?.name || p?.title || String(p);
              const where = p?.location || p?.address || p?.area;
              const note = p?.description || p?.note;
              return (
                <li key={i} className="mb-1">
                  <span className="font-medium">{name}</span>
                  {where && <span className="text-gray-500"> — {where}</span>}
                  {note && <span className="text-gray-600">. {note}</span>}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {foods.length > 0 && (
        <div>
          <p className="font-semibold mb-2 flex items-center gap-2">
            <span className="inline-flex w-6 h-6 items-center justify-center rounded-full bg-orange-100">
              <Utensils size={16} className="text-orange-600" />
            </span>
            Món ăn nên thử
          </p>
          <ul className="list-disc pl-6 text-gray-800">
            {foods.map((f, i) => {
              const name = f?.name || String(f);
              const where = f?.place || f?.where;
              const note = f?.description || f?.note;
              return (
                <li key={i} className="mb-1">
                  <span className="font-medium">{name}</span>
                  {where && <span className="text-gray-500"> — {where}</span>}
                  {note && <span className="text-gray-600">. {note}</span>}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {tips.length > 0 && (
        <div>
          <p className="font-semibold mb-2">Mẹo nhỏ</p>
          <ul className="list-disc pl-6 text-gray-700">
            {tips.map((t, i) => (
              <li key={i} className="mb-1">{String(t)}</li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={() => setShowRaw((v) => !v)}
        className="text-sm text-orange-600 hover:underline"
      >
        {showRaw ? 'Ẩn JSON' : 'Xem JSON'}
      </button>
      {showRaw && (
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-auto text-sm md:text-[15px] max-h-[70vh]">
{JSON.stringify(response ?? {}, null, 2)}
        </pre>
      )}
    </div>
  );
}

/* ===================== Chat page ===================== */
function SuggestionsChat() {
  const {
    state,
    sendMessage,
    chooseSuggestion,
    setFilters,
    setTopN,
  } = useChatbot();

  // LLM đã được bật mặc định ở ChatbotContext (useLLM: true)

  const [input, setInput] = useState('');
  const [openAC, setOpenAC] = useState(false);
  const { list: acList, loading: acLoading } = useAutocomplete(input, 2);

  // auto-scroll
  const bottomRef = useRef(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [state.loading, state.lastResponse, state.error]);

  const onSubmit = async (e) => {
    e?.preventDefault?.();
    const q = input.trim();
    if (!q) return;
    setOpenAC(false);
    await sendMessage(q);
    setInput('');
  };
  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#f7f7f9] border-b border-gray-200">
        <div className={`${containerCls} py-4 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <MapPin size={20} className="text-orange-600" />
            </div>
            <div>
              <div className="text-[20px] font-semibold text-gray-800">Gợi ý địa danh</div>
              <div className="text-xs text-gray-500">Theo tỉnh/thành Việt Nam</div>
            </div>
          </div>

          {/* Quick controls */}
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500 hidden md:block">Top</div>
            <div className="relative">
              <select
                className="text-sm rounded-lg border-gray-300 pr-8 h-9"
                value={state.topN}
                onChange={(e) => setTopN(Number(e.target.value))}
              >
                {[5, 7, 10, 12, 15, 20].map(n => <option key={n} value={n}>Top {n}</option>)}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Conversation area */}
      <div className="flex-1 bg-[#f7f7f9]">
        <div className={`${containerCls} py-6 space-y-4`}>
          {/* Hướng dẫn + filter nhanh */}
          <Bubble role="assistant">
            <div className="text-sm text-gray-700">
              Hãy nhập tên tỉnh/thành (ví dụ: <em>Hà Nội</em>, <em>Đà Nẵng</em>). Có thể lọc nhanh:
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <Pill onClick={() => setFilters({ category: 'places' })}>
                <span className="inline-flex items-center gap-1"><MapPin size={14}/> Địa danh</span>
              </Pill>
              <Pill onClick={() => setFilters({ category: 'foods' })}>
                <span className="inline-flex items-center gap-1"><Utensils size={14}/> Món ăn</span>
              </Pill>
              <Pill onClick={() => setFilters({ special: 'must_try' })}>
                <span className="inline-flex items-center gap-1"><Sparkles size={14}/> Must-try</span>
              </Pill>
            </div>
          </Bubble>

          {/* Clarify (chọn tỉnh) */}
          {state.suggestions?.length > 0 && (
            <Bubble role="assistant">
              <div className="text-sm text-amber-700 mb-2">Bạn muốn chọn tỉnh/thành nào?</div>
              <div className="flex flex-wrap gap-2">
                {state.suggestions.map((s) => (
                  <Pill key={s} onClick={() => chooseSuggestion(s)}>{s}</Pill>
                ))}
              </div>
            </Bubble>
          )}

          {/* Kết quả */}
          {state.loading && (
            <Bubble role="assistant">
              <div className="flex items-center gap-2 text-gray-600">
                <Loader2 size={18} className="animate-spin" />
                <TypingDots />
              </div>
            </Bubble>
          )}

          {!state.loading && state.error && (
            <Bubble role="assistant">
              <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">
                Lỗi: {typeof state.error === 'string' ? state.error : JSON.stringify(state.error)}
              </div>
            </Bubble>
          )}

          {!state.loading && !state.error && state.lastResponse && (
            <Bubble role="assistant">
              <AssistantResult response={state.lastResponse} />
              {state?.latencyMs != null && (
                <p className="text-xs text-gray-500 mt-3">Độ trễ: {state.latencyMs} ms</p>
              )}
            </Bubble>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input bar cố định dưới */}
      <div className="sticky bottom-0 z-10 bg-gradient-to-t from-[#f7f7f9] via-[#f7f7f9] to-transparent">
        <div className={`${containerCls} pb-5`}>
          <form
            onSubmit={onSubmit}
            className="relative bg-white border border-gray-200 rounded-2xl shadow-sm text-[15px]"
          >
            <textarea
              rows={1}
              value={input}
              onChange={(e) => { setInput(e.target.value); setOpenAC(true); }}
              onFocus={() => setOpenAC(true)}
              onKeyDown={onKeyDown}
              placeholder="Nhập tỉnh/thành cần gợi ý… (Enter để gửi, Shift+Enter xuống dòng)"
              className="w-full resize-none px-5 py-[14px] pr-14 rounded-2xl focus:outline-none"
            />

            {/* Autocomplete tỉnh/thành */}
            {openAC && acList.length > 0 && (
              <div className="absolute bottom-full mb-2 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow max-h-[56vh] overflow-auto">
                {acList.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => { setInput(name); setOpenAC(false); }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}

            <button
              type="submit"
              className="absolute right-2 bottom-2 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-orange-500 hover:bg-orange-600 text-white"
              title="Gửi"
            >
              {state.loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </form>

          <div className="text-[10px] text-center text-gray-500 mt-2">
            Dùng LLM đã được bật mặc định • Tuỳ chọn TopN ở góc phải trên
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminSuggestionsPage() {
  return (
    <ChatbotProvider>
      <SuggestionsChat />
    </ChatbotProvider>
  );
}
