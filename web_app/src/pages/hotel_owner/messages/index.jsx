'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Paperclip, Send, Search, FileText, Loader2, AlertCircle, Users } from 'lucide-react';

import useIM from '../../../hooks/useIM';
import useUser from '../../../hooks/useUser';
import useHotel from '../../../hooks/useHotel';

import imService from '../../../api/im.service';
import axiosClient from '../../../config/axiosClient';

/* ----------------------------- Hotel Picker ----------------------------- */
function HotelPickerInline({ onPicked }) {
  const [loading, setLoading] = useState(true);
  const [hotels, setHotels] = useState([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await axiosClient.get('/hotels/my-hotels');
        const rows = res?.data?.data ?? res?.data ?? [];
        setHotels(rows);
      } catch (e) {
        console.error(e);
        setErr('Không tải được danh sách khách sạn.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleChange = (e) => {
    const id = e.target.value || '';
    if (!id) return;
    localStorage.setItem('current_hotel_id', id);
    onPicked?.(id);
  };

  return (
    <div className="h-[calc(100vh-120px)] grid place-items-center">
      <div className="w-[520px] bg-white border rounded-xl p-6 shadow-sm">
        <div className="text-base font-semibold mb-2">Chọn khách sạn để bắt đầu chat</div>
        <p className="text-sm text-gray-500 mb-4">
          Hệ thống sẽ tạo sẵn cuộc trò chuyện Admin ↔ Chủ KS cho khách sạn được chọn.
        </p>

        {loading ? (
          <div className="text-sm text-gray-500">Đang tải danh sách…</div>
        ) : err ? (
          <div className="text-sm text-red-600">{err}</div>
        ) : hotels.length === 0 ? (
          <div className="text-sm text-gray-500">Bạn chưa có khách sạn nào.</div>
        ) : (
          <select
            className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            defaultValue=""
            onChange={handleChange}
          >
            <option value="" disabled>Vui lòng chọn khách sạn</option>
            {hotels.map((h, i) => {
              const hid = h?.hotel_id ?? h?.id ?? `row-${i}`;
              return (
                <option key={hid} value={hid}>
                  {h.name} {h.city ? `• ${h.city}` : ''}
                </option>
              );
            })}
          </select>
        )}
      </div>
    </div>
  );
}

/* --------------------------- Messages Page (Owner) --------------------------- */
function OwnerMessagesPage() {
  const { user } = useUser();
  const { selectedHotel, setSelectedHotel } = useHotel();
  const { startStream, messages, sendText } = useIM();

  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [text, setText] = useState('');
  const [cursor, setCursor] = useState(null);
  const ensuredRef = useRef(false);

  const [historyLocal, setHistory] = useState([]);
  const [pageError, setPageError] = useState('');
  const listRef = useRef(null);
  const inputRef = useRef(null);

  const [hasSelectedHotel, setHasSelectedHotel] = useState(
    !!localStorage.getItem('current_hotel_id')
  );

  const hotelId = hasSelectedHotel ? (selectedHotel?.hotel_id || localStorage.getItem('current_hotel_id')) : null;

  const [myHotels, setMyHotels] = useState([]);
  useEffect(() => {
    (async () => {
      try {
        const res = await axiosClient.get('/hotels/my-hotels');
        const rows = res?.data?.data ?? res?.data ?? [];
        setMyHotels(rows);
      } catch (e) {
        console.error('load my-hotels failed', e);
      }
    })();
  }, []);

  function scrollToBottom() {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }

  const allMessages = useMemo(() => {
    const map = new Map();
    [...historyLocal, ...messages].forEach(m => map.set(String(m._id), m));
    return Array.from(map.values()).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }, [historyLocal, messages]);

  async function openConversation(conv) {
    if (!conv?._id) return;
    setActive(conv);
    setCursor(null);

    const his = await imService.history({ conversation_id: conv._id, limit: 30 });
    setHistory(his.items.reverse());
    setCursor(his.nextCursor || null);

    startStream(conv._id);
    setTimeout(scrollToBottom, 0);
  }

  async function loadMore() {
    if (!active?._id || !cursor) return;
    setLoadingMore(true);
    try {
      const more = await imService.history({ conversation_id: active._id, limit: 30, cursor });
      setHistory(prev => [...(more.items.reverse()), ...prev]);
      setCursor(more.nextCursor || null);
    } finally { setLoadingMore(false); }
  }

  async function onSend(e) {
    e?.preventDefault?.();
    if (!text.trim() || !active?._id) return;
    await sendText({ convId: active._id, text: text.trim() });
    setText('');
    inputRef.current?.focus();
  }

  async function onAttachFile(e) {
    const file = e.target.files?.[0];
    if (!file || !active?._id) return;
    const b64 = await fileToBase64(file);
    const meta = await imService.uploadBase64({
      file_name: file.name,
      mime_type: file.type,
      file_base64: b64.replace(/^data:.+;base64,/, '')
    });
    await imService.sendFile({
      conversation_id: active._id,
      text: '',
      attachments: [meta]
    });
  }

  const ADMIN_ID = '76c26936-1c91-40bf-bfb4-89ddeeffbef7';

  async function resolveOwnerId() {
    try {
      const res = await axiosClient.get(`/hotels/${hotelId}`);
      return res?.data?.data?.owner_id ?? res?.data?.owner_id ?? user?.user_id;
    } catch {
      return user?.user_id;
    }
  }

  async function ensureDefaultDM(currentRows = []) {
    const hasDM = (currentRows || []).some(
      (c) => c.type === 'dm' && c.subtype === 'admin_owner_dm'
    );
    if (hasDM || !hotelId || !user?.user_id) return;

    if (ensuredRef.current) return;
    ensuredRef.current = true;
    try {
      const ownerId = await resolveOwnerId();
      const payload = {
        hotel_id: hotelId,
        owner_id: ownerId,
        admin_id: ADMIN_ID,
        created_by: user.user_id
      };
      console.debug('[createDM] payload:', payload);
      const conv = await imService.createDM(payload);
      setConversations(prev => [conv, ...prev]);
      await openConversation(conv);
    } catch (e) {
      const msg = e?.response?.data?.message || e.message || 'Tạo DM thất bại';
      setPageError(msg);
      console.error('ensureDefaultDM error:', e);
      ensuredRef.current = false;
    }
  }

  useEffect(() => {
    if (!hotelId || !user?.user_id) {
      if (!hotelId) {
        setConversations([]); setActive(null); setHistory([]); setCursor(null);
        setLoadingList(false);
      }
      return;
    }
    let mounted = true;
    (async () => {
      setLoadingList(true);
      try {
        const rows = await imService.listConversations({ hotel_id: hotelId });
        if (!mounted) return;
        setConversations(rows);
        if (rows.length) openConversation(rows[0]);
        else await ensureDefaultDM(rows);
      } catch (err) {
        console.error('listConversations failed:', err);
        await ensureDefaultDM([]);
      } finally {
        setLoadingList(false);
      }
    })();
    return () => { mounted = false; };
  }, [hotelId, user?.user_id]);

  useEffect(() => { if (active?._id) scrollToBottom(); }, [allMessages.length]);
  useEffect(() => { ensuredRef.current = false; }, [hotelId]);

  if (!hasSelectedHotel || !hotelId) {
    return (
      <HotelPickerInline
        onPicked={(id) => {
          localStorage.setItem('current_hotel_id', id);
          setSelectedHotel?.({ hotel_id: id });
          setHasSelectedHotel(true);
        }}
      />
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] grid grid-cols-12">
      {/* LEFT */}
      <aside className="col-span-4 border-r bg-white flex flex-col">
        <div className="p-3">
          <select
            className="w-full mb-2 border rounded-lg px-3 py-2 bg-white"
            value={hotelId || ''}
            onChange={(e) => {
              const id = e.target.value || '';
              if (id) {
                localStorage.setItem('current_hotel_id', id);
                setSelectedHotel?.({ hotel_id: id });
                setHasSelectedHotel(true);
              } else {
                localStorage.removeItem('current_hotel_id');
                setSelectedHotel?.(null);
                setHasSelectedHotel(false);
              }
              setConversations([]);
              setActive(null);
              setHistory([]);
              setCursor(null);
            }}
          >
            <option value="">Vui lòng chọn khách sạn</option>
            {myHotels.map((h, i) => {
              const hid = h?.hotel_id ?? h?.id ?? `row-${i}`;
              return (
                <option key={hid} value={hid}>
                  {h.name} {h.city ? `• ${h.city}` : ''}
                </option>
              );
            })}
          </select>

          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100">
            <Search size={18} className="text-gray-500" />
            <input placeholder="Tìm kiếm" className="bg-transparent outline-none text-sm flex-1" />
          </div>
        </div>

        <div className="px-3 flex gap-2">
          <button
            onClick={() => ensureDefaultDM(conversations)}
            className="text-xs px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            + Chat với Admin
          </button>
          <button
            disabled
            className="text-xs px-3 py-1.5 rounded bg-gray-300 text-gray-600 cursor-not-allowed flex items-center gap-1"
            title="API nhóm nội bộ chưa được hỗ trợ"
          >
            <Users size={14} /> Nhóm nội bộ
          </button>
        </div>

        <div className="px-3 pb-1 text-xs text-gray-400">TẤT CẢ HỘI THOẠI</div>
        {pageError && (
          <div className="px-3 pb-2 text-xs text-red-600">{pageError}</div>
        )}
        <div className="flex-1 overflow-y-auto">
          {loadingList ? (
            <div className="p-4 text-sm text-gray-500">Đang tải…</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">Chưa có cuộc trò chuyện</div>
          ) : (
            conversations.map(c => (
              <button
                key={c._id}
                onClick={() => openConversation(c)}
                className={`w-full text-left px-3 py-2.5 flex gap-3 items-center hover:bg-gray-50 ${
                  active?._id === c._id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="h-10 w-10 rounded-full bg-blue-200 flex items-center justify-center text-white text-sm">
                  {c.type === 'dm' ? 'DM' : 'GR'}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {c.title || c.name || (c.type === 'dm' ? 'Admin ↔ Owner' : 'Nhóm')}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {c.last_message?.text || '—'}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* RIGHT */}
      <section className="col-span-8 flex flex-col">
        {!active ? (
          <div className="flex-1 grid place-items-center text-gray-500">
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle size={18} />
              <span>Chọn một cuộc trò chuyện</span>
            </div>
          </div>
        ) : (
          <>
            <div className="h-14 border-b bg-white px-4 flex items-center justify-between">
              <div className="font-semibold">
                {active?.title || active?.name || (active?.type === 'dm' ? 'Admin ↔ Owner' : 'Nhóm')}
              </div>
              <div className="text-xs text-gray-500">{active?.type === 'dm' ? 'Đoạn chat' : 'Nhóm'}</div>
            </div>

            <div ref={listRef} className="flex-1 overflow-y-auto bg-gray-50 p-4">
              {cursor && (
                <div className="flex justify-center my-2">
                  <button
                    onClick={loadMore}
                    className="text-xs px-3 py-1.5 rounded-full bg-white hover:bg-gray-50 border flex items-center gap-2"
                    disabled={loadingMore}
                  >
                    {loadingMore && <Loader2 size={14} className="animate-spin" />}
                    Xem tin cũ hơn
                  </button>
                </div>
              )}

              {allMessages.map(m => {
                const mine = user?.user_id && m.sender_id === user.user_id;
                const isFile = m.kind === 'file' && m.attachments?.length;
                return (
                  <div key={m._id} className={`mb-2 flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-3 py-2 shadow-sm ${
                      mine ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white rounded-bl-sm'
                    }`}>
                      {m.text && <div className="whitespace-pre-wrap break-words text-sm">{m.text}</div>}
                      {isFile && (
                        <div className={`mt-1 text-xs flex items-center gap-2 ${mine ? 'text-white/90' : 'text-gray-600'}`}>
                          <FileText size={16} />
                          <span className="truncate">{m.attachments[0].file_name}</span>
                        </div>
                      )}
                      <div className={`text-[10px] mt-1 ${mine ? 'text-white/80' : 'text-gray-500'}`}>
                        {new Date(m.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={onSend} className="h-16 border-t bg-white flex items-center gap-2 px-3">
              <label className="cursor-pointer p-2 rounded hover:bg-gray-100">
                <input type="file" className="hidden" onChange={onAttachFile} />
                <Paperclip size={20} />
              </label>
              <div className="flex-1">
                <input
                  ref={inputRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full bg-gray-100 px-3 py-2 rounded-full outline-none"
                  placeholder="Nhập tin nhắn…"
                />
              </div>
              <button type="submit" className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700">
                <Send size={18} />
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export default OwnerMessagesPage;
