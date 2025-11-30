'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Paperclip, Send, Search, Image as ImageIcon, FileText, Loader2, RotateCcw } from 'lucide-react';
import useIM from '../../../hooks/useIM';
import imService from '../../../api/im.service';
import useAuth from '../../../hooks/useAuth';
import axiosClient from '../../../config/axiosClient';

export default function AdminMessagesPage() {
  const { user } = useAuth();
  const { startStream, messages, sendText } = useIM();
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [text, setText] = useState('');
  const [cursor, setCursor] = useState(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const [historyLocal, setHistory] = useState([]);
  const [hotelNameMap, setHotelNameMap] = useState({});

  // --- SEARCH UI ---
  const [q, setQ] = useState('');
  const [qDebounced, setQDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q.trim().toLowerCase()), 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingList(true);
      try {
        const list = await imService.listConversations({ type: 'dm' });
        if (!mounted) return;
        setConversations(list);
        if (list.length) openConversation(list[0]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingList(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  async function ensureHotelName(hid) {
    if (!hid || hotelNameMap[hid]) return hotelNameMap[hid];
    try {
      const res = await axiosClient.get(`/hotels/${hid}`);
      const name = res?.data?.data?.name ?? res?.data?.name ?? '';
      if (name) setHotelNameMap(prev => ({ ...prev, [hid]: name }));
      return name;
    } catch {
      return '';
    }
  }

  function getConvTitle(c) {
    if (c?.title) return c.title;
    if (c?.name) return c.name;
    if (c?.type === 'dm' && (c?.subtype === 'admin_owner_dm' || c?.hotel_id)) {
      const hid = String(c.hotel_id || '');
      const hotelName = hotelNameMap[hid];
      if (!hotelName && hid) ensureHotelName(hid);
      return hotelName ? `Admin ↔ ${hotelName}` : 'Admin ↔ Owner';
    }
    return c?.type === 'dm' ? 'Admin ↔ Owner' : 'Nhóm';
  }

  function getConvSubtitle(c) {
    const txt = c?.last_message?.text || '';
    const time = c?.last_message?.created_at
      ? new Date(c.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';
    return (txt ? txt.slice(0, 40) : '—') + (time ? ` · ${time}` : '');
  }

  async function openConversation(conv) {
    if (!conv?._id) return;
    setActive(conv);
    setCursor(null);
    try {
      const his = await imService.history({ conversation_id: conv._id, limit: 40 });
      setHistory(his.items.reverse());
      setCursor(his.nextCursor || null);
      startStream(conv._id);
      setTimeout(scrollToBottom, 0);
    } catch (e) {
      console.error(e);
    }
  }

  const allMessages = useMemo(() => {
    const map = new Map();
    [...historyLocal, ...messages].forEach(m => map.set(String(m._id), m));
    return Array.from(map.values()).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }, [historyLocal, messages]);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    if (!qDebounced) return conversations;
    return conversations.filter(c => {
      const title = getConvTitle(c).toLowerCase();
      const last = (c?.last_message?.text || '').toLowerCase();
      return title.includes(qDebounced) || last.includes(qDebounced);
    });
  }, [qDebounced, conversations, hotelNameMap]);

  useEffect(() => { scrollToBottom(); }, [allMessages.length]);
  function scrollToBottom() {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }

  async function loadMore() {
    if (!active?._id || !cursor) return;
    setLoadingMore(true);
    try {
      const more = await imService.history({ conversation_id: active._id, limit: 40, cursor });
      setHistory(prev => [...more.items.reverse(), ...prev]);
      setCursor(more.nextCursor || null);
    } finally {
      setLoadingMore(false);
    }
  }

  async function reloadMessages() {
    if (!active?._id) return;
    try {
      const his = await imService.history({ conversation_id: active._id, limit: 40 });
      setHistory(his.items.reverse());
      setCursor(his.nextCursor || null);
      setTimeout(scrollToBottom, 50);
    } catch (e) {
      console.error(e);
    }
  }

  async function reloadConversations() {
    try {
      const list = await imService.listConversations({ type: 'dm' });
      setConversations(list);
    } catch (e) {
      console.error(e);
    }
  }

  async function onSend(e) {
    e?.preventDefault?.();
    if (!text.trim() || !active?._id) return;
    try {
      await sendText({ convId: active._id, text: text.trim() });
      setText('');
      inputRef.current?.focus();
      await reloadMessages();
      await reloadConversations();
    } catch (e) { console.error(e); }
  }

  async function onAttachFile(e) {
    const file = e.target.files?.[0];
    if (!file || !active?._id) return;
    try {
      const b64 = await fileToBase64(file);
      const meta = await imService.uploadBase64({
        file_name: file.name,
        mime_type: file.type,
        file_base64: b64.replace(/^data:.+;base64,/, '')
      });
      await imService.sendFile({
        conversation_id: String(active._id),
        text: 'Đây là file gửi kèm',
        attachments: [{
          file_name: meta.file_name || file.name,
          file_type: file.type || 'application/octet-stream'
        }]
      });
      await reloadMessages();
      await reloadConversations();
    } catch (e) { console.error(e); }
  }

  async function onSendUrl() {
    if (!urlInput.trim() || !active?._id) return;
    try {
      await imService.sendFile({
        conversation_id: String(active._id),
        text: 'Đây là file gửi kèm',
        attachments: [{
          file_name: urlInput.trim(),
          file_type: urlInput.match(/\.(png|jpg|jpeg|gif|webp)$/i) ? 'image' : 'link'
        }]
      });
      setUrlInput('');
      setShowUrlInput(false);
      await reloadMessages();
      await reloadConversations();
    } catch (e) { console.error(e); }
  }

  const actualUserId = user?.userId || user?.user_id || user?.id;

  // Group messages by day
  const groupedMessages = useMemo(() => {
    const out = [];
    let lastDay = '';
    for (const m of allMessages) {
      const day = new Date(m.created_at).toLocaleDateString();
      if (day !== lastDay) {
        out.push({ _sep: true, day });
        lastDay = day;
      }
      out.push(m);
    }
    return out;
  }, [allMessages]);

  return (
    <div className="h-full grid grid-cols-12">
      {/* LEFT */}
      <aside className="col-span-3 2xl:col-span-2 border-r bg-white flex flex-col">
        <div className="p-2 pb-1.5">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gray-100 focus-within:ring-2 ring-orange-300">
            <Search size={14} className="text-gray-500 shrink-0" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm kiếm hội thoại..."
              className="bg-transparent outline-none text-[13px] flex-1"
            />
            {q && (
              <button
                onClick={() => setQ('')}
                className="text-[11px] text-gray-400 hover:text-gray-600"
              >✕</button>
            )}
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <div className="text-[10px] tracking-wide font-medium text-gray-500">
              TẤT CẢ HỘI THOẠI ({filteredConversations.length})
            </div>
            <button
              onClick={reloadConversations}
              className="p-1 rounded hover:bg-gray-100 text-gray-500"
              title="Làm mới"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingList ? (
            <div className="p-3 text-[13px] text-gray-500">Đang tải…</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-3 text-[13px] text-gray-500">
              {qDebounced ? 'Không tìm thấy hội thoại phù hợp.' : 'Chưa có cuộc trò chuyện'}
            </div>
          ) : (
            filteredConversations.map(c => {
              const title = getConvTitle(c);
              return (
                <button
                  key={c._id}
                  onClick={() => openConversation(c)}
                  className={`w-full text-left px-3 py-2 flex gap-2.5 items-start hover:bg-gray-50 transition ${
                    active?._id === c._id ? 'bg-orange-50' : ''
                  }`}
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-[10px] font-semibold">
                    {c.type === 'dm' ? 'DM' : 'GR'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium truncate">{title}</div>
                    <div className="text-[11px] text-gray-500 truncate">{getConvSubtitle(c)}</div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* RIGHT */}
      <section className="col-span-9 2xl:col-span-10 flex flex-col bg-[#fafafa]">
        <div className="h-12 border-b bg-white px-4 flex items-center justify-between">
          <div className="font-semibold text-[13px] sm:text-sm">
            {active ? getConvTitle(active) : 'Chưa chọn cuộc trò chuyện'}
          </div>
          {active && (
            <div className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">
              {active.type === 'dm' ? 'Direct' : 'Group'}
            </div>
          )}
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
          {!active && (
            <div className="h-full flex items-center justify-center text-gray-400 text-[13px]">
              Chọn một hội thoại bên trái để bắt đầu.
            </div>
          )}

          {active && cursor && (
            <div className="flex justify-center">
              <button
                onClick={loadMore}
                className="text-[11px] px-3 py-1 rounded-full bg-white hover:bg-gray-50 border flex items-center gap-2"
                disabled={loadingMore}
              >
                {loadingMore && <Loader2 size={12} className="animate-spin" />}
                Tin cũ hơn
              </button>
            </div>
          )}

          {groupedMessages.map(m => {
            if (m._sep) {
              return (
                <div
                  key={`sep-${m.day}`}
                  className="text-[10px] text-gray-500 uppercase tracking-wide text-center my-1.5"
                >
                  {m.day}
                </div>
              );
            }
            const mine = actualUserId && String(m.sender_id) === String(actualUserId);
            const isFile = m.kind === 'file' && m.attachments?.length;
            const isImageAttachment = isFile && m.attachments?.[0]?.file_name && (
              m.attachments[0].file_name.startsWith('http') &&
              (m.attachments[0].file_type?.includes('image') || m.attachments[0].file_name.match(/\.(jpg|jpeg|png|gif|webp)$/i))
            );
            return (
              <div key={m._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[60%] rounded-2xl px-3 py-1.5 shadow-sm text-[13px] leading-relaxed break-words ${
                    mine ? 'bg-orange-500 text-white rounded-br-sm' : 'bg-white rounded-bl-sm'
                  }`}
                >
                  {m.text && <div>{m.text}</div>}

                  {isFile && isImageAttachment && (
                    <div className={`mt-1.5 text-[11px] ${mine ? 'text-white/90' : 'text-gray-600'}`}>
                      <div className="mb-1">
                        <img
                          src={m.attachments[0].file_name}
                          alt="Shared"
                          className="max-w-52 max-h-52 rounded-lg object-cover"
                          onError={(e) => { e.target.onerror = null; e.target.src = '/image/placeholder.png'; }}
                        />
                      </div>
                    </div>
                  )}

                  {isFile && !isImageAttachment && (
                    <div className={`mt-1.5 text-[11px] ${mine ? 'text-white/90' : 'text-gray-600'}`}>
                      <div className="flex items-center gap-1.5">
                        <FileText size={14} />
                        <span className="truncate">{m.attachments[0]?.file_name}</span>
                      </div>
                    </div>
                  )}
                  <div className={`text-[9px] mt-1.5 ${mine ? 'text-white/70' : 'text-gray-500'}`}>
                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {showUrlInput && active && (
          <div className="border-t bg-white px-3 py-2">
            <div className="flex items-center gap-2">
              <input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1 bg-gray-100 px-3 py-1.5 rounded-full outline-none text-[13px]"
                placeholder="Dán URL hình ảnh..."
                autoFocus
              />
              <button
                onClick={onSendUrl}
                className="px-3 py-1.5 bg-orange-500 text-white rounded-full hover:bg-orange-600 text-[12px] disabled:opacity-50"
                disabled={!urlInput.trim()}
              >Gửi</button>
              <button
                onClick={() => { setShowUrlInput(false); setUrlInput(''); }}
                className="px-3 py-1.5 bg-gray-300 text-gray-700 rounded-full hover:bg-gray-400 text-[12px]"
              >Hủy</button>
            </div>
          </div>
        )}

        <form onSubmit={onSend} className="h-14 border-t bg-white flex items-center gap-2.5 px-3">
          <div className="flex gap-1">
            <label className="cursor-pointer p-1.5 rounded hover:bg-gray-100" title="Gửi file">
              <input type="file" className="hidden" onChange={onAttachFile} />
              <Paperclip size={18} />
            </label>
            <button
              type="button"
              onClick={() => setShowUrlInput(s => !s)}
              className="p-1.5 rounded hover:bg-gray-100"
              title="Gửi URL hình ảnh"
            >
              <ImageIcon size={18} />
            </button>
          </div>
          <div className="flex-1">
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full bg-gray-100 px-3 py-1.5 rounded-full outline-none text-[13px]"
              placeholder={active ? 'Nhập tin nhắn…' : 'Chọn hội thoại trước...'}
              disabled={!active}
            />
          </div>
          <button
            type="submit"
            disabled={!text.trim() || !active}
            className="p-1.5 rounded-full bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
            title="Gửi"
          >
            <Send size={16} />
          </button>
        </form>
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
