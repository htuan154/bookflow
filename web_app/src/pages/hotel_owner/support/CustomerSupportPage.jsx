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

    useEffect(() => {
        scrollToBottom();
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                        <MessageCircle size={24} className="text-blue-600 mr-3" />
                        <h1 className="text-2xl font-bold text-gray-900">Hỗ trợ khách hàng</h1>
                    </div>
                </div>

                {/* Hotel Selection */}
                <div className="mb-4">
                    <label htmlFor="hotel-select" className="block text-sm font-medium text-gray-700 mb-2">
                        Chọn khách sạn của bạn:
                    </label>
                    <select
                        id="hotel-select"
                        value={selectedHotelId}
                        onChange={handleChange}
                        className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                    >
                        <option value="">Chọn khách sạn...</option>
                        {hotels.map(hotel => (
                            <option key={hotel.hotelId} value={hotel.hotelId}>
                                {hotel.name || ''} | {hotel.address || ''} | {hotel.city || ''}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Selected Hotel Info */}
                {selectedHotel && (
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
                        <div className="flex items-center">
                            <div className="p-2 bg-white/20 rounded-lg mr-4">
                                <Hotel size={24} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">{selectedHotel.name || selectedHotel.hotel_name}</h3>
                                <p className="text-blue-100">{selectedHotel.address || ''} | {selectedHotel.city || ''}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Stats */}
            {selectedHotel && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Calendar size={24} className="text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <h3 className="text-sm font-medium text-gray-500">Tổng booking</h3>
                                <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <MessageCircle size={24} className="text-green-600" />
                            </div>
                            <div className="ml-4">
                                <h3 className="text-sm font-medium text-gray-500">Có thể chat</h3>
                                <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-yellow-100 rounded-lg">
                                <Clock size={24} className="text-yellow-600" />
                            </div>
                            <div className="ml-4">
                                <h3 className="text-sm font-medium text-gray-500">Đang chờ</h3>
                                <p className="text-2xl font-bold text-gray-900">
                                    {bookings.filter(b => b.bookingStatus === 'pending').length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Bookings List */}
            {selectedHotel && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center">
                            <Calendar className="mr-2" size={20} />
                            Danh sách booking ({bookings.length})
                        </h3>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Đang tải danh sách booking...</p>
                        </div>
                    ) : bookings.length === 0 ? (
                        <div className="p-8 text-center">
                            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có booking nào</h3>
                            <p className="text-gray-600">Khi có booking mới sẽ hiển thị ở đây</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
                            {bookings.map(booking => (
                                <div key={booking.bookingId} className="bg-white border rounded-lg p-4 hover:shadow-lg transition-shadow">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                                            {booking.bookingId.slice(0, 8)}...
                                        </div>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                            booking.bookingStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            booking.bookingStatus === 'confirmed' ? 'bg-green-100 text-green-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {booking.bookingStatus}
                                        </span>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center text-gray-600">
                                            <User size={16} className="mr-2" />
                                            <span className="font-mono text-xs">{booking.userId.slice(0, 8)}...</span>
                                        </div>
                                        
                                        <div className="flex items-center text-gray-600">
                                            <Calendar size={16} className="mr-2" />
                                            <span>
                                                {new Date(booking.checkInDate).toLocaleDateString('vi-VN')} - {' '}
                                                {new Date(booking.checkOutDate).toLocaleDateString('vi-VN')}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center text-gray-600">
                                            <Users size={16} className="mr-2" />
                                            <span>{booking.totalGuests} khách</span>
                                        </div>
                                        
                                        <div className="flex items-center text-gray-600">
                                            <DollarSign size={16} className="mr-2" />
                                            <span className="font-medium">
                                                {new Intl.NumberFormat('vi-VN').format(booking.totalPrice)} VNĐ
                                            </span>
                                        </div>
                                    </div>

                                    {booking.specialRequests && (
                                        <div className="mt-3 p-2 bg-blue-50 rounded text-sm text-blue-700">
                                            <div className="font-medium">Yêu cầu đặc biệt:</div>
                                            <div className="italic">{booking.specialRequests}</div>
                                        </div>
                                    )}

                                    <button 
                                        onClick={() => openChat(booking)}
                                        className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                                    >
                                        <MessageCircle size={16} className="mr-2" />
                                        Chat với khách
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Chat Modal */}
            {chatOpen && selectedBooking && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-md h-[80vh] flex flex-col shadow-xl">
                        {/* Chat Header */}
                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-t-lg flex justify-between items-center">
                            <div>
                                <h3 className="font-semibold">Chat - Booking</h3>
                                <p className="text-sm text-blue-100 font-mono">
                                    {selectedBooking.bookingId.slice(0, 8)}...
                                </p>
                            </div>
                            <button 
                                onClick={closeChat}
                                className="text-white hover:bg-white/20 p-1 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                            {loadingMessages ? (
                                <div className="flex justify-center items-center h-full">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {messages.map((message) => {
                                        const isUser = message.senderId === selectedBooking.userId;
                                        return (
                                            <div key={message.messageId} className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
                                                <div className={`max-w-[75%] p-3 rounded-2xl ${
                                                    isUser 
                                                        ? 'bg-white text-gray-800 rounded-bl-sm' 
                                                        : 'bg-blue-500 text-white rounded-br-sm'
                                                } shadow-sm`}>
                                                    <p className="text-sm">{message.messageContent}</p>
                                                    <p className="text-xs mt-1 opacity-70">
                                                        {new Date(message.createdAt).toLocaleTimeString('vi-VN', { 
                                                            hour: '2-digit', 
                                                            minute: '2-digit' 
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </div>

                        {/* Message Input */}
                        <div className="border-t border-gray-200 p-4">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Nhập tin nhắn..."
                                    className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={!newMessage.trim()}
                                    className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerSupportPage;