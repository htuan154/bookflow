import React, { useEffect, useState, useRef } from 'react';
import { 
    Hotel, MessageCircle, Users, Send, X, 
    Calendar, Clock, DollarSign, User
} from 'lucide-react';
import { useHotelOwner } from '../../../hooks/useHotelOwner';
import { useChat } from '../../../hooks/useChat';

const CustomerSupportPage = () => {
    const { fetchOwnerHotel, fetchBookingsByHotelId, loading, error } = useHotelOwner();
    const [selectedHotelId, setSelectedHotelId] = useState('');
    const [hotels, setHotels] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [selectedHotel, setSelectedHotel] = useState(null);
    const [chatOpen, setChatOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
        const [newMessage, setNewMessage] = useState('');
        const messagesEndRef = useRef(null);
        const messagesContainerRef = useRef(null);
        const [visibleCount, setVisibleCount] = useState(10);
        const prevMessagesLengthRef = useRef(0);
        const {
            messages,
            loading: loadingMessages,
            error: chatError,
            fetchMessages,
            sendMessage: sendChatMessage,
            setMessages,
        } = useChat();

    useEffect(() => {
        const loadHotels = async () => {
            const data = await fetchOwnerHotel();
            if (Array.isArray(data)) {
                setHotels(data);
            } else if (data) {
                setHotels([data]);
            } else {
                setHotels([]);
            }
        };
        loadHotels();
    }, [fetchOwnerHotel]);

    useEffect(() => {
        const loadBookings = async () => {
            if (selectedHotelId) {
                const data = await fetchBookingsByHotelId(selectedHotelId);
                setBookings(Array.isArray(data) ? data : (data?.data || []));
            } else {
                setBookings([]);
            }
        };
        loadBookings();
    }, [selectedHotelId, fetchBookingsByHotelId]);

    const handleChange = (e) => {
        const hotelId = e.target.value;
        setSelectedHotelId(hotelId);
        const foundHotel = hotels.find(h => h.hotelId === hotelId);
        setSelectedHotel(foundHotel || null);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };



    // Reset visibleCount when booking changes
    useEffect(() => {
        setVisibleCount(10);
    }, [selectedBooking]);


    // Scroll to bottom khi:
    // - Mở chat mới
    // - Gửi tin nhắn mới (messages tăng lên)
    // Không scroll khi chỉ load thêm tin nhắn cũ (visibleCount tăng)
    useEffect(() => {
        const prevLen = prevMessagesLengthRef.current;
        if (messages.length > prevLen) {
            scrollToBottom();
        }
        prevMessagesLengthRef.current = messages.length;
    }, [messages]);


    const openChat = async (booking) => {
        setSelectedBooking(booking);
        setChatOpen(true);
        await fetchMessages(booking.bookingId);
    };

    const closeChat = () => {
        setChatOpen(false);
        setSelectedBooking(null);
        setMessages([]);
        setNewMessage('');
    };

    const sendMessage = async () => {
        if (newMessage.trim() && selectedBooking) {
            // Lấy senderId từ localStorage hoặc context nếu có
            const senderId = "160ad88d-ccef-4715-9447-b4fd7c403384";
            await sendChatMessage(selectedBooking.bookingId, newMessage, senderId);
            setNewMessage('');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // Nếu chưa chọn khách sạn, hiển thị màn hình chọn khách sạn
    if (!selectedHotelId) {
        return (
            <div className="h-[calc(100vh-120px)] grid place-items-center">
                <div className="w-[520px] bg-white border rounded-xl p-6 shadow-sm">
                    <div className="flex items-center mb-4">
                        <MessageCircle size={24} className="text-blue-600 mr-3" />
                        <h1 className="text-xl font-bold text-gray-900">Hỗ trợ khách hàng</h1>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                        Chọn khách sạn để xem danh sách booking và chat với khách hàng.
                    </p>
                    <label htmlFor="hotel-select" className="block text-sm font-medium text-gray-700 mb-2">
                        Chọn khách sạn của bạn:
                    </label>
                    <select
                        id="hotel-select"
                        value={selectedHotelId}
                        onChange={handleChange}
                        className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                    >
                        <option value="">Vui lòng chọn khách sạn</option>
                        {hotels.map(hotel => (
                            <option key={hotel.hotelId} value={hotel.hotelId}>
                                {hotel.name || ''} • {hotel.city || ''}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        );
    }

    // Handle scroll to top to load more messages
    const handleMessagesScroll = () => {
        const container = messagesContainerRef.current;
        if (container && container.scrollTop === 0 && visibleCount < messages.length) {
            // Lưu chiều cao trước khi load thêm
            const prevScrollHeight = container.scrollHeight;
            setVisibleCount((prev) => {
                const next = Math.min(prev + 10, messages.length);
                // Đợi state cập nhật xong, giữ vị trí cuộn
                setTimeout(() => {
                    if (container && next > prev) {
                        const newScrollHeight = container.scrollHeight;
                        container.scrollTop = newScrollHeight - prevScrollHeight;
                    }
                }, 0);
                return next;
            });
        }
    };

    return (
        <div className="h-[calc(100vh-120px)] grid grid-cols-12">
            {/* LEFT - Danh sách Bookings */}
            <aside className="col-span-4 border-r bg-white flex flex-col max-h-[calc(100vh-120px)]">
                <div className="p-3">
                    {/* Hotel Selection Dropdown */}
                    <select
                        className="w-full mb-2 border rounded-lg px-3 py-2 bg-white"
                        value={selectedHotelId}
                        onChange={handleChange}
                    >
                        <option value="">Vui lòng chọn khách sạn</option>
                        {hotels.map(hotel => (
                            <option key={hotel.hotelId} value={hotel.hotelId}>
                                {hotel.name || ''} • {hotel.city || ''}
                            </option>
                        ))}
                    </select>

                    {/* Selected Hotel Info */}
                    {selectedHotel && (
                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white mb-3">
                            <div className="flex items-center">
                                <div className="p-2 bg-white/20 rounded-lg mr-3">
                                    <Hotel size={20} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold">{selectedHotel.name || selectedHotel.hotel_name}</h3>
                                    <p className="text-xs text-blue-100">{selectedHotel.city || ''}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="bg-blue-50 rounded-lg p-2 text-center">
                            <div className="text-lg font-bold text-blue-600">{bookings.length}</div>
                            <div className="text-xs text-gray-600">Tổng</div>
                        </div>
                        <div className="bg-yellow-50 rounded-lg p-2 text-center">
                            <div className="text-lg font-bold text-yellow-600">
                                {bookings.filter(b => b.bookingStatus === 'pending').length}
                            </div>
                            <div className="text-xs text-gray-600">Chờ</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-2 text-center">
                            <div className="text-lg font-bold text-green-600">
                                {bookings.filter(b => b.bookingStatus === 'confirmed').length}
                            </div>
                            <div className="text-xs text-gray-600">Xác nhận</div>
                        </div>
                    </div>
                </div>

                <div className="px-3 pb-1 text-xs text-gray-400">
                    DANH SÁCH BOOKING ({bookings.length})
                </div>

                {/* Bookings List */}
                <div className="flex-1 overflow-y-auto max-h-[calc(100vh-220px)]">
                    {loading ? (
                        <div className="p-4 text-sm text-gray-500">Đang tải danh sách booking...</div>
                    ) : bookings.length === 0 ? (
                        <div className="p-4 text-center">
                            <Calendar size={48} className="mx-auto text-gray-400 mb-2" />
                            <div className="text-sm text-gray-500">Chưa có booking nào</div>
                        </div>
                    ) : (
                        bookings.map(booking => (
                            <button
                                key={booking.bookingId}
                                onClick={() => openChat(booking)}
                                className={`w-full text-left px-3 py-3 border-b hover:bg-gray-50 transition-colors ${
                                    selectedBooking?.bookingId === booking.bookingId ? 'bg-blue-50' : ''
                                }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                                        {booking.bookingId.slice(0, 8)}...
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        booking.bookingStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                        booking.bookingStatus === 'confirmed' ? 'bg-green-100 text-green-800' :
                                        booking.bookingStatus === 'completed' ? 'bg-blue-100 text-blue-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {booking.bookingStatus}
                                    </span>
                                </div>

                                <div className="space-y-1 text-xs">
                                    <div className="flex items-center text-gray-600">
                                        <User size={14} className="mr-2" />
                                        <span className="font-mono">{booking.userId.slice(0, 8)}...</span>
                                    </div>
                                    
                                    <div className="flex items-center text-gray-600">
                                        <Calendar size={14} className="mr-2" />
                                        <span>
                                            {new Date(booking.checkInDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} - {' '}
                                            {new Date(booking.checkOutDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center justify-between text-gray-600">
                                        <div className="flex items-center">
                                            <Users size={14} className="mr-2" />
                                            <span>{booking.totalGuests} khách</span>
                                        </div>
                                        <div className="flex items-center font-medium text-blue-600">
                                            {/* <DollarSign size={14} className="mr-1" /> */}
                                            <span>{new Intl.NumberFormat('vi-VN').format(booking.totalPrice)} ₫</span>
                                        </div>
                                    </div>
                                </div>

                                {booking.specialRequests && (
                                    <div className="mt-2 text-xs text-gray-500 italic line-clamp-1">
                                        💬 {booking.specialRequests}
                                    </div>
                                )}
                            </button>
                        ))
                    )}
                </div>
            </aside>

            {/* RIGHT - Chat Area */}
            <section className="col-span-8 flex flex-col h-full max-h-[calc(100vh-120px)]">
                {!chatOpen || !selectedBooking ? (
                    <div className="flex-1 grid place-items-center text-gray-500">
                        <div className="text-center">
                            <MessageCircle size={48} className="mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Chọn một booking</h3>
                            <p className="text-sm text-gray-500">Chọn booking từ danh sách bên trái để bắt đầu chat với khách hàng</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        <div className="h-14 border-b bg-white px-4 flex items-center justify-between flex-shrink-0">
                            <div>
                                <div className="font-semibold">Chat - Booking #{selectedBooking.bookingId.slice(0, 8)}</div>
                                <div className="text-xs text-gray-500">
                                    {new Date(selectedBooking.checkInDate).toLocaleDateString('vi-VN')} - {' '}
                                    {new Date(selectedBooking.checkOutDate).toLocaleDateString('vi-VN')}
                                </div>
                            </div>
                            <button 
                                onClick={closeChat}
                                className="text-gray-500 hover:bg-gray-100 p-2 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages + Input Area (Messenger style, no gap) */}
                        <div className="flex-1 flex flex-col bg-gray-50 h-full">
                            {/* Messages Scroll Area */}
                            <div
                                ref={messagesContainerRef}
                                onScroll={handleMessagesScroll}
                                className="flex-1 overflow-y-auto p-4"
                                style={{ minHeight: 0 }}
                            >
                                {loadingMessages ? (
                                    <div className="flex justify-center items-center h-full">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {messages.slice(-visibleCount).map((message) => {
                                            const isUser = message.senderId === selectedBooking.userId;
                                            return (
                                                <div
                                                    key={message.messageId}
                                                    className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}
                                                >
                                                    <div
                                                        className={`max-w-[70%] rounded-lg p-3 ${
                                                            isUser
                                                                ? 'bg-white border border-gray-200'
                                                                : 'bg-blue-600 text-white'
                                                        }`}
                                                    >
                                                        <p className="text-sm">{message.messageContent}</p>
                                                        <p className="text-xs mt-1 opacity-70">
                                                            {new Date(message.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                            {/* Input Area - Always at bottom, no gap */}
                            <div
                                className="h-16 border-t bg-white flex items-center gap-2 px-3 flex-shrink-0"
                            >
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    className="flex-1 bg-gray-100 px-3 py-2 rounded-full outline-none"
                                    placeholder="Nhập tin nhắn..."
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={!newMessage.trim()}
                                    className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </section>
        </div>
    );
};

export default CustomerSupportPage;