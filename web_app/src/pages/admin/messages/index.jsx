'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Paperclip, Send, Search, Image as ImageIcon, FileText, Loader2 } from 'lucide-react';
import useIM from '../../../hooks/useIM';           // dùng IMContext (đã có) :contentReference[oaicite:2]{index=2}
import imService from '../../../api/im.service';     // wrapper API (đã có, vừa bổ sung)
import useAuth from '../../../hooks/useAuth';        // để lấy user hiện tại

export default function AdminMessagesPage() {
  const { user } = useAuth();
  const { startStream, stopStream, messages, sendText } = useIM(); // từ IMContext :contentReference[oaicite:3]{index=3}
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null); // conversation đang mở
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [text, setText] = useState('');
  const [cursor, setCursor] = useState(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // 1) Load danh sách phòng (admin thường xem theo hotel hoặc toàn bộ)
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingList(true);
      try {
        // có thể truyền ?type='dm'|'group' hoặc hotel_id nếu muốn
        const list = await imService.listConversations({});
        if (!mounted) return;
        setConversations(list);
        if (list.length) openConversation(list[0]); // tự mở phòng đầu tiên
      } catch (e) { console.error(e); }
      finally { setLoadingList(false); }
    })();
    return () => { mounted = false; };
  }, []);

  // 2) Mở 1 phòng: load lịch sử & startStream
  async function openConversation(conv) {
    if (!conv?._id) return;
    setActive(conv);
    setCursor(null);
    // lấy lịch sử trang đầu
    const his = await imService.history({ conversation_id: conv._id, limit: 30 });
    // vì stream sẽ push tin mới, ta set trước lịch sử:
    // (IMContext giữ messages; ở đây ta chỉ cần reset messages hiển thị = history)
    // Cách nhẹ nhàng: phát sự kiện giả (hoặc bạn có thể thêm API vào context). Ta tạm gán local:
    // => để nhất quán, ta dựa vào stream: setMessages không exposed; nên hiển thị = state cục bộ + stream.
    // -> Giải pháp: lưu historyLocal và merge với messages từ stream.
    setHistory(his.items.reverse());
    setCursor(his.nextCursor || null);

    // mở stream realtime cho phòng mới
    startStream(conv._id);
    // scroll xuống cuối sau khi render
    setTimeout(() => scrollToBottom(), 0);
  }

  // giữ history local để render cùng messages realtime
  const [historyLocal, setHistory] = useState([]);
  const allMessages = useMemo(() => {
    // ghép history (cũ) + realtime (mới)
    // tránh trùng bằng _id
    const map = new Map();
    [...historyLocal, ...messages].forEach(m => map.set(String(m._id), m));
    return Array.from(map.values()).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }, [historyLocal, messages]);

  useEffect(() => { scrollToBottom(); }, [allMessages.length]);

  function scrollToBottom() {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }

  async function loadMore() {
    if (!active?._id || !cursor) return;
    setLoadingMore(true);
    try {
      const more = await imService.history({ conversation_id: active._id, limit: 30, cursor });
      // prepend vào historyLocal
      setHistory(prev => [...(more.items.reverse()), ...prev]);
      setCursor(more.nextCursor || null);
    } finally {
      setLoadingMore(false);
    }
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
    // chuyển base64
    const b64 = await fileToBase64(file);
    const meta = await imService.uploadBase64({
      file_name: file.name,
      mime_type: file.type,
      file_base64: b64.replace(/^data:.+;base64,/, '')
    });
    // gửi message kiểu file
    await imService.sendFile({
      conversation_id: active._id,
      text: '',
      attachments: [meta]
    });
  }

  return (
    <div className="h-full grid grid-cols-12">
      {/* LEFT: danh sách phòng */}
      <aside className="col-span-4 border-r bg-white flex flex-col">
        <div className="p-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100">
            <Search size={18} className="text-gray-500" />
            <input placeholder="Tìm kiếm" className="bg-transparent outline-none text-sm flex-1" />
          </div>
        </div>
        <div className="px-3 pb-2 text-xs text-gray-400">TẤT CẢ HỘI THOẠI</div>
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
                  active?._id === c._id ? 'bg-orange-50' : ''
                }`}
              >
                <div className="h-10 w-10 rounded-full bg-orange-200 flex items-center justify-center text-white text-sm">
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

      {/* RIGHT: khung chat */}
      <section className="col-span-8 flex flex-col">
        {/* header */}
        <div className="h-14 border-b bg-white px-4 flex items-center justify-between">
          <div className="font-semibold">
            {active?.title || active?.name || (active?.type === 'dm' ? 'Admin ↔ Owner' : 'Nhóm')}
          </div>
          <div className="text-xs text-gray-500">{active ? (active.type === 'dm' ? 'Đoạn chat' : 'Nhóm') : ''}</div>
        </div>

        {/* content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto bg-gray-50 p-4">
          {active && cursor && (
            <div className="flex justify-center my-2">
              <button
                onClick={loadMore}
                className="text-xs px-3 py-1.5 rounded-full bg-white/80 hover:bg-white border flex items-center gap-2"
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
                  mine ? 'bg-orange-500 text-white rounded-br-sm' : 'bg-white rounded-bl-sm'
                }`}>
                  {/* text */}
                  {m.text && <div className="whitespace-pre-wrap break-words text-sm">{m.text}</div>}
                  {/* file preview đơn giản */}
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

        {/* input */}
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
          <button type="submit" className="p-2 rounded-full bg-orange-500 text-white hover:bg-orange-600">
            <Send size={18} />
          </button>
        </form>
      </section>
    </div>
  );
}

// helper: File -> Base64 dataURL
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
