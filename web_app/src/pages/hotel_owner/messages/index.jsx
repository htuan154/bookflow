'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Paperclip, Send, Search, FileText, Loader2, AlertCircle, Users, Image as ImageIcon } from 'lucide-react';

import useIM from '../../../hooks/useIM';
import useAuth from '../../../hooks/useAuth';
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
              // Debug log để xem hotel structure
              console.log('Hotel item:', h);
              const hid = h?.hotelId ?? h?.hotel_id ?? h?.id ?? h?._id ?? `row-${i}`;
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
  const { user } = useAuth();
  const { selectedHotel, setSelectedHotel } = useHotel();
  const { startStream, messages, sendText } = useIM();

  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [text, setText] = useState('');
  const [cursor, setCursor] = useState(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [filterType, setFilterType] = useState('dm'); // 'dm' hoặc 'group'
  const [allConversations, setAllConversations] = useState([]); // lưu tất cả conversations
  const ensuredRef = useRef(false);

  const [historyLocal, setHistory] = useState([]);
  const [pageError, setPageError] = useState('');
  const listRef = useRef(null);
  const inputRef = useRef(null);

  const [hasSelectedHotel, setHasSelectedHotel] = useState(
    !!localStorage.getItem('current_hotel_id')
  );

  const hotelId = hasSelectedHotel ? (selectedHotel?.hotelId || selectedHotel?.hotel_id || localStorage.getItem('current_hotel_id')) : null;

  const [myHotels, setMyHotels] = useState([]);
  useEffect(() => {
    (async () => {
      try {
        const res = await axiosClient.get('/hotels/my-hotels');
        const rows = res?.data?.data ?? res?.data ?? [];
        console.log('My hotels raw data:', res.data);
        console.log('My hotels processed:', rows);
        if (rows.length > 0) {
          console.log('First hotel structure:', JSON.stringify(rows[0], null, 2));
          console.log('Hotel fields:', Object.keys(rows[0]));
        }
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

  // Hàm reload tin nhắn mới nhất
  async function reloadMessages() {
    if (!active?._id) return;
    try {
      const his = await imService.history({ conversation_id: active._id, limit: 30 });
      setHistory(his.items.reverse());
      setCursor(his.nextCursor || null);
      setTimeout(() => scrollToBottom(), 100);
    } catch (error) {
      console.error('Error reloading messages:', error);
    }
  }

  // Hàm reload danh sách conversations để cập nhật last_message
  async function reloadConversations() {
    try {
      const rows = await imService.listMyConversations({ hotel_id: hotelId });
      setAllConversations(rows);
      // Áp dụng filter hiện tại
      const filtered = rows.filter(c => c.type === filterType);
      setConversations(filtered);
    } catch (error) {
      console.error('Error reloading conversations:', error);
    }
  }

  async function onSend(e) {
    e?.preventDefault?.();
    if (!text.trim() || !active?._id) return;
    try {
      await sendText({ convId: active._id, text: text.trim() });
      setText('');
      inputRef.current?.focus();
      // Reload tin nhắn để hiển thị tin nhắn vừa gửi
      await reloadMessages();
      // Reload danh sách conversations để cập nhật last_message
      await reloadConversations();
    } catch (error) {
      console.error('Error sending message:', error);
    }
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
      const payload = {
        conversation_id: String(active._id),
        text: 'Đây là file gửi kèm',
        attachments: [{
          file_name: meta.file_name || file.name,
          file_type: file.type || 'application/octet-stream'
        }]
      };
      await imService.sendFile(payload);
      // Reload tin nhắn để hiển thị file vừa gửi
      await reloadMessages();
      // Reload danh sách conversations để cập nhật last_message
      await reloadConversations();
    } catch (error) {
      console.error('Error sending file:', error);
    }
  }

  // Gửi URL/link như file attachment
  async function onSendUrl() {
    if (!urlInput.trim() || !active?._id) return;
    try {
      const payload = {
        conversation_id: String(active._id),
        text: 'Đây là file gửi kèm',
        attachments: [{
          file_name: urlInput,
          file_type: urlInput.includes('.jpg') || urlInput.includes('.jpeg') ? 'image/jpeg' :
                    urlInput.includes('.png') ? 'image/png' :
                    urlInput.includes('.gif') ? 'image/gif' : 'image'
        }]
      };
      await imService.sendFile(payload);
      setUrlInput('');
      setShowUrlInput(false);
      // Reload tin nhắn để hiển thị URL vừa gửi
      await reloadMessages();
      // Reload danh sách conversations để cập nhật last_message
      await reloadConversations();
    } catch (error) {
      console.error('Error sending URL:', error);
    }
  }

  const ADMIN_ID = '76c26936-1c91-40bf-bfb4-89ddeeffbef7';

  async function resolveOwnerId() {
    try {
      const res = await axiosClient.get(`/hotels/${hotelId}`);
      const actualUserId = user?.userId || user?.user_id || user?.id;
      return res?.data?.data?.owner_id ?? res?.data?.owner_id ?? actualUserId;
    } catch {
      return user?.userId || user?.user_id || user?.id;
    }
  }

  async function ensureDefaultDM(currentRows = []) {
    const hasDM = (currentRows || []).some(
      (c) => c.type === 'dm' && c.subtype === 'admin_owner_dm'
    );
    const actualUserId = user?.userId || user?.user_id || user?.id;
    console.log('ensureDefaultDM check:', {
      currentRows: currentRows,
      hasDM: hasDM,
      hotelId: hotelId,
      actualUserId: actualUserId
    });
    if (hasDM || !hotelId || !actualUserId) {
      console.log('Skipping DM creation:', { hasDM, hotelId: !!hotelId, actualUserId: !!actualUserId });
      return;
    }

    if (ensuredRef.current) return;
    ensuredRef.current = true;
    try {
      const ownerId = await resolveOwnerId();
      const payload = {
        hotel_id: hotelId,
        owner_id: ownerId,
        admin_id: ADMIN_ID,
        created_by: ADMIN_ID  // Đổi thành admin_id theo example
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
    console.log('useEffect triggered:', { 
      hotelId, 
      userId: user?.userId,
      userAltId: user?.user_id,
      userIdField: user?.id,
      hasSelectedHotel,
      selectedHotel,
      localStorageHotelId: localStorage.getItem('current_hotel_id'),
      user: user
    });
    // Thử với user?.id hoặc user?.user_id thay vì user?.userId
    const actualUserId = user?.userId || user?.user_id || user?.id;
    console.log('User ID check:', { 
      'user?.userId': user?.userId,
      'user?.user_id': user?.user_id, 
      'user?.id': user?.id,
      actualUserId
    });
    
    if (!hotelId || !actualUserId) {
      console.log('Missing values:', {
        hotelId: hotelId,
        actualUserId: actualUserId,
        'Boolean hotelId': Boolean(hotelId),
        'Boolean actualUserId': Boolean(actualUserId)
      });
      if (!hotelId) {
        setConversations([]); setActive(null); setHistory([]); setCursor(null);
        setLoadingList(false);
      }
      return;
    }
    let mounted = true;
    (async () => {
      console.log('Starting API call with hotelId:', hotelId);
      setLoadingList(true);
      try {
        const rows = await imService.listMyConversations({ hotel_id: hotelId });
        console.log('My conversations:', rows);
        if (rows.length > 0) {
          console.log('First conversation structure:', JSON.stringify(rows[0], null, 2));
        }
        if (!mounted) return;
        
        // Lưu tất cả conversations và áp dụng filter
        setAllConversations(rows);
        const filtered = rows.filter(c => c.type === filterType);
        setConversations(filtered);
        
        if (filtered.length) openConversation(filtered[0]);
        else await ensureDefaultDM(rows);
      } catch (err) {
        console.error('listMyConversations failed:', err);
        await ensureDefaultDM([]);
      } finally {
        setLoadingList(false);
      }
    })();
    return () => { mounted = false; };
  }, [hotelId, user?.userId, user?.user_id, user?.id]);

  // Effect để filter conversations khi filterType thay đổi
  useEffect(() => {
    if (allConversations.length > 0) {
      const filtered = allConversations.filter(c => c.type === filterType);
      setConversations(filtered);
      
      // Nếu conversation hiện tại không thuộc filter mới, chọn conversation đầu tiên
      if (active && active.type !== filterType) {
        if (filtered.length > 0) {
          openConversation(filtered[0]);
        } else {
          setActive(null);
        }
      }
    }
  }, [filterType, allConversations]);

  useEffect(() => { if (active?._id) scrollToBottom(); }, [allMessages.length]);
  useEffect(() => { ensuredRef.current = false; }, [hotelId]);

  if (!hasSelectedHotel || !hotelId) {
    return (
      <HotelPickerInline
        onPicked={(id) => {
          localStorage.setItem('current_hotel_id', id);
          setSelectedHotel?.({ hotelId: id });
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
                setSelectedHotel?.({ hotelId: id });
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
              // console.log('Main dropdown hotel item:', h);
              const hid = h?.hotelId ?? h?.hotel_id ?? h?.id ?? h?._id ?? `row-${i}`;
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
            onClick={() => {
              setFilterType('dm');
              if (filterType !== 'dm') {
                // Nếu chuyển sang dm mà chưa có DM nào, tạo mới
                const dmConversations = allConversations.filter(c => c.type === 'dm');
                if (dmConversations.length === 0) {
                  ensureDefaultDM([]);
                }
              }
            }}
            className={`text-xs px-3 py-1.5 rounded flex items-center gap-1 ${
              filterType === 'dm' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            + Chat với Admin
          </button>
          <button
            onClick={() => setFilterType('group')}
            className={`text-xs px-3 py-1.5 rounded flex items-center gap-1 ${
              filterType === 'group' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Users size={14} /> Nhóm nội bộ
          </button>
        </div>

        <div className="px-3 pb-1 text-xs text-gray-400">
          {filterType === 'dm' ? 'CHAT VỚI ADMIN' : 'NHÓM NỘI BỘ'}
        </div>
        {pageError && (
          <div className="px-3 pb-2 text-xs text-red-600">{pageError}</div>
        )}
        <div className="flex-1 overflow-y-auto">
          {loadingList ? (
            <div className="p-4 text-sm text-gray-500">Đang tải…</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">
              {filterType === 'dm' ? 'Chưa có cuộc trò chuyện với Admin' : 'Chưa có nhóm nội bộ'}
            </div>
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
                const actualUserId = user?.userId || user?.user_id || user?.id;
                const mine = actualUserId && m.sender_id === actualUserId;
                const isFile = m.kind === 'file' && m.attachments?.length;
                return (
                  <div key={m._id} className={`mb-2 flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-3 py-2 shadow-sm ${
                      mine ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white rounded-bl-sm'
                    }`}>
                      {m.text && <div className="whitespace-pre-wrap break-words text-sm">{m.text}</div>}
                      {isFile && (
                        <div className={`mt-1 text-xs ${mine ? 'text-white/90' : 'text-gray-600'}`}>
                          {/* Nếu là URL hình ảnh thì hiển thị ảnh */}
                          {m.attachments[0]?.file_name?.startsWith('http') && 
                           (m.attachments[0]?.file_type?.includes('image') || 
                            m.attachments[0]?.file_name?.match(/\.(jpg|jpeg|png|gif)$/i)) ? (
                            <div className="mb-2">
                              <img 
                                src={m.attachments[0].file_name} 
                                alt="Shared image"
                                className="max-w-48 max-h-48 rounded-lg"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                              <div className="hidden items-center gap-2">
                                <FileText size={16} />
                                <span className="truncate">{m.attachments[0].file_name}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <FileText size={16} />
                              <span className="truncate">{m.attachments[0]?.file_name}</span>
                            </div>
                          )}
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

            {/* URL input modal */}
            {showUrlInput && (
              <div className="border-t bg-white p-3">
                <div className="flex items-center gap-2">
                  <input
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="flex-1 bg-gray-100 px-3 py-2 rounded-full outline-none"
                    placeholder="Nhập URL hình ảnh..."
                    autoFocus
                  />
                  <button
                    onClick={onSendUrl}
                    className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                    disabled={!urlInput.trim()}
                  >
                    Gửi
                  </button>
                  <button
                    onClick={() => {setShowUrlInput(false); setUrlInput('');}}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-full hover:bg-gray-400"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={onSend} className="h-16 border-t bg-white flex items-center gap-2 px-3">
              <div className="flex gap-1">
                <label className="cursor-pointer p-2 rounded hover:bg-gray-100" title="Gửi file">
                  <input type="file" className="hidden" onChange={onAttachFile} />
                  <Paperclip size={20} />
                </label>
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="p-2 rounded hover:bg-gray-100"
                  title="Gửi URL hình ảnh"
                >
                  <ImageIcon size={20} />
                </button>
              </div>
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
