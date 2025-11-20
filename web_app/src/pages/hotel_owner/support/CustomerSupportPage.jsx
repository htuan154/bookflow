import React, { useEffect, useState, useRef } from 'react';
import { 
    Hotel, MessageCircle, Users, Send, X, 
    Calendar, Clock, DollarSign, User, PlusCircle
} from 'lucide-react';
import { useHotelOwner } from '../../../hooks/useHotelOwner';
import { useChat } from '../../../hooks/useChat';
import { useContext } from 'react';
import { AuthContext } from '../../../context/AuthContext';
import { staffApiService } from '../../../api/staff.service';
import { hotelApiService } from '../../../api/hotel.service';
import { seasonPricingService } from '../../../api/seasonPricing.service';
import { bookingNightlyPriceService } from '../../../api/bookingNightlyPrice.service';
import { calculateBookingPrice, createBookingDetailMessage, createNoRoomAvailableMessage } from '../../../utils/bookingPriceCalculator';
import { useBooking } from '../../../hooks/useBooking';
import { useBookingDetail } from '../../../hooks/useBookingDetail';

const CustomerSupportPage = () => {
        const [roomGuestError, setRoomGuestError] = useState('');
    const { fetchOwnerHotel, fetchBookingsByHotelId, loading, error } = useHotelOwner();
    const { user } = useContext(AuthContext);
    const [selectedHotelId, setSelectedHotelId] = useState('');
    const [hotels, setHotels] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loadingStaffInfo, setLoadingStaffInfo] = useState(false);
    const [selectedHotel, setSelectedHotel] = useState(null);
    const [chatOpen, setChatOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [bookingForm, setBookingForm] = useState({
        checkInDate: '',
        checkOutDate: '',
        numGuests: 1,
        numRooms: 1,
        paymentMethod: '', // Mặc định là rỗng
    });
    const [availableRoomTypes, setAvailableRoomTypes] = useState([]);
    const [showRoomTypeTable, setShowRoomTypeTable] = useState(false);
    const [selectedRoomTypeId, setSelectedRoomTypeId] = useState(null);
    const [checkingAvailability, setCheckingAvailability] = useState(false);
    const [sendingBookingMessage, setSendingBookingMessage] = useState(false);
    const [creatingBooking, setCreatingBooking] = useState(false);
    // Lấy hook booking để dùng createBookingForCustomer
    const { createBookingForCustomer } = useBooking();
    // Lấy hook booking detail để dùng createBookingDetailForCustomer
    const { createBookingDetailForCustomer } = useBookingDetail();
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

    // Load danh sách khách sạn của owner hoặc load staff info cho hotel_staff
    useEffect(() => {
        const loadHotelsOrStaffInfo = async () => {
            try {
                if (user?.roleId === 6) { // hotel_staff role_id = 6
                    setLoadingStaffInfo(true);
                    try {
                        // Gọi API staff trực tiếp
                        const response = await staffApiService.getStaffByUserId(user.userId);
                        const staffData = response?.data || response;
                        
                        if (staffData && Array.isArray(staffData) && staffData.length > 0) {
                            const firstStaff = staffData[0];
                            const hotelId = firstStaff.hotelId || firstStaff.hotel_id;
                            
                            if (hotelId) {
                                // Load hotel info
                                const hotelRes = await hotelApiService.getHotelById(hotelId);
                                const hotelData = hotelRes?.data || hotelRes;
                                
                                if (hotelData) {
                                    setHotels([hotelData]);
                                    setSelectedHotelId(hotelId);
                                    setSelectedHotel(hotelData);
                                }
                            }
                        }
                    } catch (error) {
                        console.error('Error loading staff info:', error);
                    } finally {
                        setLoadingStaffInfo(false);
                    }
                } else {
                    // Owner: load tất cả khách sạn của owner
                    const data = await fetchOwnerHotel();
                    if (Array.isArray(data)) {
                        setHotels(data);
                    } else if (data) {
                        setHotels([data]);
                    } else {
                        setHotels([]);
                    }
                }
            } catch (error) {
                console.error('Error loading hotels:', error);
            }
        };
        if (user?.userId) {
            loadHotelsOrStaffInfo();
        }
    }, [user?.roleId, user?.userId, fetchOwnerHotel]);

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
        setShowBookingForm(false);
        await fetchMessages(booking.bookingId);
    };

    const closeChat = () => {
        setChatOpen(false);
        setSelectedBooking(null);
        setMessages([]);
        setNewMessage('');
        setShowBookingForm(false);
    };

    // Khi bấm nút Đặt phòng
    const handleOpenBookingForm = () => {
        setShowBookingForm(true);
        setShowRoomTypeTable(false);
        setAvailableRoomTypes([]);
        setBookingForm({
            checkInDate: '',
            checkOutDate: '',
            numGuests: 1,
            numRooms: 1,
            paymentMethod: '', // Reset về rỗng mỗi lần mở form
        });
    };

    // Khi bấm Hủy trên form đặt phòng
    const handleCancelBookingForm = () => {
        setShowBookingForm(false);
    };

    // Khi thay đổi input trên form đặt phòng
    const handleBookingFormChange = (e) => {
        const { name, value } = e.target;
        let newValue = value;
        // Cho phép xóa input, nhưng nếu nhập số bé hơn 1 thì sẽ set về 1 khi blur
        if (name === 'numGuests' || name === 'numRooms') {
            if (value === '') {
                newValue = '';
            } else {
                if (name === 'numGuests') {
                    newValue = Math.min(10, parseInt(value) || 1);
                } else {
                    newValue = Math.min(5, parseInt(value) || 1);
                }
            }
        }

        setBookingForm(prev => {
            let updated = { ...prev, [name]: newValue };
            let showError = false;
            // Nếu thay đổi số khách, kiểm tra số phòng
            if (name === 'numGuests') {
                if (parseInt(updated.numRooms) > newValue) {
                    updated.numRooms = newValue;
                    showError = true;
                }
            }
            // Nếu thay đổi số phòng, không cho vượt quá số khách
            if (name === 'numRooms') {
                if (parseInt(newValue) > parseInt(updated.numGuests)) {
                    updated.numRooms = updated.numGuests;
                    showError = true;
                }
            }
            // Nếu chọn ngày checkin thì tự động set ngày checkout = checkin + 1 ngày nếu checkout cũ không hợp lệ
            if (name === 'checkInDate') {
                const checkIn = new Date(newValue);
                if (!isNaN(checkIn.getTime())) {
                    const minCheckOut = new Date(checkIn);
                    minCheckOut.setDate(minCheckOut.getDate() + 1);
                    const checkOut = new Date(updated.checkOutDate);
                    if (isNaN(checkOut.getTime()) || checkOut <= checkIn) {
                        // Format yyyy-mm-dd
                        const y = minCheckOut.getFullYear();
                        const m = String(minCheckOut.getMonth() + 1).padStart(2, '0');
                        const d = String(minCheckOut.getDate()).padStart(2, '0');
                        updated.checkOutDate = `${y}-${m}-${d}`;
                    }
                }
            }
            setRoomGuestError(showError ? 'Số phòng không được vượt quá số khách' : '');
            return updated;
        });
    };

    // Khi blur input số người/số phòng: nếu rỗng hoặc < 1 thì set về 1
    const handleBookingFormBlur = (e) => {
        const { name, value } = e.target;
        if ((name === 'numGuests' || name === 'numRooms') && (value === '' || parseInt(value) < 1)) {
            setBookingForm(prev => ({ ...prev, [name]: 1 }));
        }
    };

    // Xử lý kiểm tra phòng còn trống
    const handleCheckAvailability = async () => {
        const { checkInDate, checkOutDate, numGuests, numRooms } = bookingForm;
        
        // Validate form
        if (!checkInDate || !checkOutDate) {
            alert('Vui lòng chọn ngày nhận phòng và ngày trả phòng');
            return;
        }
        
        if (!selectedHotelId) {
            alert('Vui lòng chọn khách sạn');
            return;
        }
        
        try {
            setCheckingAvailability(true);
            setRoomGuestError('');
            
            // Import hotelApiService
            const { hotelApiService } = await import('../../../api/hotel.service');
            
            // Gọi API
            const response = await hotelApiService.getAvailableRoomsByHotelId(
                selectedHotelId,
                checkInDate,
                checkOutDate
            );
            
            const roomTypes = response.data || response;
            
            // Lọc phòng theo điều kiện:
            // 1. available_rooms >= numRooms (số phòng còn trống đủ)
            // 2. available_rooms * max_occupancy >= numGuests (số khách có thể chứa)
            const eligibleRoomTypes = roomTypes.filter(roomType => {
                const hasEnoughRooms = roomType.available_rooms >= numRooms;
                const canAccommodateGuests = (roomType.available_rooms * roomType.max_occupancy) >= numGuests;
                return hasEnoughRooms && canAccommodateGuests;
            });
            
            setAvailableRoomTypes(eligibleRoomTypes);
            setShowRoomTypeTable(true);
            
            if (eligibleRoomTypes.length === 0) {
                setRoomGuestError('Không tìm thấy loại phòng phù hợp với yêu cầu của bạn');
            }
            
        } catch (error) {
            console.error('Error checking availability:', error);
            setRoomGuestError('Có lỗi xảy ra khi kiểm tra phòng trống. Vui lòng thử lại.');
        } finally {
            setCheckingAvailability(false);
        }
    };

    // Gửi tin nhắn chi tiết booking cho một loại phòng
    const handleSendBookingDetail = async (roomType) => {
        if (!selectedBooking) return;

        try {
            setSendingBookingMessage(true);

            const { checkInDate, checkOutDate, numGuests, numRooms } = bookingForm;

            // Import room type service để lấy thông tin đầy đủ
            const roomTypeService = (await import('../../../api/roomType.service')).default;
            
            // Lấy thông tin room type đầy đủ (bao gồm base_price)
            const roomTypeDetailResponse = await roomTypeService.getById(roomType.room_type_id);
            const roomTypeDetail = roomTypeDetailResponse.data || roomTypeDetailResponse;
            const basePrice = roomTypeDetail.base_price || roomTypeDetail.basePrice || 0;

            // Lấy seasonal pricing cho room type này
            const seasonalPricingResponse = await seasonPricingService.getSeasonPricingByRoomType(roomType.room_type_id);
            const seasonalPricings = seasonalPricingResponse.data || [];
            
            // Debug: Kiểm tra seasonal pricing data
            console.log('=== DEBUG SEASONAL PRICING ===');
            console.log('Room Type ID:', roomType.room_type_id);
            console.log('Check-in:', checkInDate);
            console.log('Check-out:', checkOutDate);
            console.log('Seasonal Pricings:', seasonalPricings);
            console.log('Number of pricings:', seasonalPricings.length);
            if (seasonalPricings.length > 0) {
                console.log('First pricing:', {
                    name: seasonalPricings[0].name,
                    startDate: seasonalPricings[0].startDate,
                    endDate: seasonalPricings[0].endDate,
                    priceModifier: seasonalPricings[0].priceModifier
                });
            }

            // Tính giá booking
            const priceCalculation = calculateBookingPrice(
                checkInDate,
                checkOutDate,
                basePrice,
                numRooms,
                seasonalPricings
            );
            
            // Debug: Kiểm tra kết quả tính toán
            console.log('Price Calculation Result:', priceCalculation);
            console.log('Nightly Prices:', priceCalculation.nightlyPrices);

            // Lấy thông tin user từ booking - cần import user service
            const userService = (await import('../../../api/user.service')).default;
            let userInfo = {
                fullName: 'N/A',
                email: 'N/A',
                phoneNumber: 'N/A',
            };

            try {
                const userResponse = await userService.getUserById(selectedBooking.userId);
                const userData = userResponse.data || userResponse;
                userInfo = {
                    fullName: userData.full_name || userData.fullName || 'N/A',
                    email: userData.email || 'N/A',
                    phoneNumber: userData.phone_number || userData.phoneNumber || 'N/A',
                };
            } catch (userError) {
                console.error('Error fetching user info:', userError);
            }

            // Tạo message chi tiết
            const bookingDetailMessage = createBookingDetailMessage({
                roomTypeName: roomType.room_type_name,
                checkInDate,
                checkOutDate,
                numGuests,
                numRooms,
                nightlyPrices: priceCalculation.nightlyPrices,
                totalPrice: priceCalculation.totalPrice,
                userInfo,
            });

            // Lấy senderId từ localStorage (user hoặc authUser)
            const currentUser = JSON.parse(localStorage.getItem('user') || localStorage.getItem('authUser') || '{}');
            const senderId = currentUser.id || currentUser.userId || currentUser.user_id;
            await sendChatMessage(selectedBooking.bookingId, bookingDetailMessage, senderId);

            // Tin nhắn đã được gửi, không đóng form để có thể gửi thêm loại phòng khác
            console.log('✓ Đã gửi chi tiết đặt phòng cho khách hàng');
        } catch (error) {
            console.error('Error sending booking detail:', error);
            alert('Có lỗi xảy ra khi gửi thông tin. Vui lòng thử lại.');
        } finally {
            setSendingBookingMessage(false);
        }
    };

    // Gửi tin nhắn khi không có phòng phù hợp
    const handleSendNoRoomMessage = async () => {
        if (!selectedBooking) return;

        try {
            setSendingBookingMessage(true);

            const noRoomMessage = createNoRoomAvailableMessage();
            // Lấy senderId từ localStorage (user hoặc authUser)
            const currentUser = JSON.parse(localStorage.getItem('user') || localStorage.getItem('authUser') || '{}');
            const senderId = currentUser.id || currentUser.userId || currentUser.user_id;
            
            await sendChatMessage(selectedBooking.bookingId, noRoomMessage, senderId);

            console.log('✓ Đã gửi tin nhắn cho khách hàng');
        } catch (error) {
            console.error('Error sending no room message:', error);
            alert('Có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại.');
        } finally {
            setSendingBookingMessage(false);
        }
    };

    // Khi submit form đặt phòng
    const handleSubmitBookingForm = async (e) => {
        e.preventDefault();
        // Kiểm tra đã chọn loại phòng chưa
        if (!selectedRoomTypeId) {
            alert('Vui lòng chọn loại phòng trước khi đặt!');
            return;
        }
        const selectedRoomType = availableRoomTypes.find(rt => rt.room_type_id === selectedRoomTypeId);
        if (!selectedRoomType) {
            alert('Không tìm thấy loại phòng đã chọn!');
            return;
        }

        // Validate ngày checkin/check-out
        const today = new Date();
        today.setHours(0,0,0,0);
        const minCheckIn = new Date(today);
        minCheckIn.setDate(minCheckIn.getDate() + 1);
        const checkIn = new Date(bookingForm.checkInDate);
        const checkOut = new Date(bookingForm.checkOutDate);
        if (isNaN(checkIn.getTime()) || checkIn < minCheckIn) {
            alert('Ngày nhận phòng phải lớn hơn hôm nay ít nhất 1 ngày!');
            return;
        }
        const minCheckOut = new Date(checkIn);
        minCheckOut.setDate(minCheckOut.getDate() + 1);
        if (isNaN(checkOut.getTime()) || checkOut < minCheckOut) {
            alert('Ngày trả phòng phải lớn hơn ngày nhận phòng ít nhất 1 ngày!');
            return;
        }
        setCreatingBooking(true);
        try {
            setSendingBookingMessage(true);
            const { checkInDate, checkOutDate, numGuests, numRooms, paymentMethod } = bookingForm;
            // Debug: Log form data
            console.log('📝 Form data:', { checkInDate, checkOutDate, numGuests, numRooms, paymentMethod });
            // Validate payment_method
            if (!paymentMethod) {
                alert('Vui lòng chọn phương thức thanh toán!');
                setSendingBookingMessage(false);
                setCreatingBooking(false);
                return;
            }
            // Import services
            const roomTypeService = (await import('../../../api/roomType.service')).default;
            const { bookingService } = await import('../../../api/booking.service');
            // Đã lấy createBookingForCustomer từ hook ở đầu component
            const { bookingDetailApiService } = await import('../../../api/bookingDetail.service');
            // Kiểm tra user có booking no_show không
            let bookingStatus = 'confirmed'; // Mặc định là confirmed
            try {
                const noShowResponse = await bookingService.getUserNoShowBookings(selectedBooking.userId);
                const noShowBookings = noShowResponse.data || [];
                if (noShowBookings.length > 0) {
                    bookingStatus = 'pending'; // Nếu có no_show thì tạo booking với status pending
                    console.log('⚠️ User có booking no_show, tạo booking với status pending');
                }
            } catch (noShowError) {
                console.warn('Không thể kiểm tra no_show bookings:', noShowError);
                // Nếu lỗi khi kiểm tra, vẫn tiếp tục với status confirmed
            }
            // Lấy thông tin room type để tính giá
            const roomTypeDetailResponse = await roomTypeService.getById(selectedRoomType.room_type_id);
            const roomTypeDetail = roomTypeDetailResponse.data || roomTypeDetailResponse;
            const basePrice = roomTypeDetail.base_price || roomTypeDetail.basePrice || 0;
            // Lấy seasonal pricing
            const seasonalPricingResponse = await seasonPricingService.getSeasonPricingByRoomType(selectedRoomType.room_type_id);
            const seasonalPricings = seasonalPricingResponse.data || [];
            // Tính giá booking
            const priceCalculation = calculateBookingPrice(
                checkInDate,
                checkOutDate,
                basePrice,
                numRooms,
                seasonalPricings
            );
            // Tính nights
            const checkIn = new Date(checkInDate);
            const checkOut = new Date(checkOutDate);
            const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
            // Tạo booking với status đã kiểm tra (sử dụng snake_case cho backend)
            const bookingData = {
                user_id: selectedBooking.userId,
                hotel_id: selectedHotelId,
                check_in_date: checkInDate,
                check_out_date: checkOutDate,
                nights,
                total_guests: numGuests,
                total_price: priceCalculation.totalPrice,
                booking_status: bookingStatus, // Sử dụng status đã kiểm tra
                payment_status: 'pending',
                payment_method: paymentMethod,
            };
            console.log('📤 Booking data being sent:', bookingData);
            // Lấy userId từ selectedBooking (hoặc nguồn phù hợp)
            const userId = selectedBooking?.userId;
            if (!userId) {
                throw new Error('Không xác định được userId để tạo booking');
            }
            const bookingResponse = await createBookingForCustomer(userId, bookingData);
            const newBookingId = bookingResponse?.booking?.bookingId || bookingResponse?.bookingId;
            if (!newBookingId) {
                throw new Error('Không nhận được booking ID từ server');
            }
            // Tạo booking detail (chỉ gửi các field liên quan booking detail)
            const unitPrice = basePrice;
            const bookingDetailData = {
                room_details: [
                    {
                        room_type_id: selectedRoomType.room_type_id,
                        quantity: numRooms,
                        unit_price: unitPrice,
                        subtotal: priceCalculation.totalPrice,
                        guests_per_room: Math.floor(numGuests / numRooms)
                    }
                ]
            };
            // Gửi bookingId qua param, không gửi booking_id trong body
            await createBookingDetailForCustomer(newBookingId, bookingDetailData);
            // Tạo booking nightly prices (sử dụng snake_case cho backend)
            for (const nightPrice of priceCalculation.nightlyPrices) {
                const nightlyPriceData = {
                    booking_id: newBookingId,
                    room_type_id: selectedRoomType.room_type_id,
                    stay_date: nightPrice.date,
                    quantity: numRooms,
                    base_rate: nightPrice.basePrice,
                    season_pricing_id: nightPrice.seasonInfo?.id || null,
                    season_multiplier: nightPrice.seasonInfo?.modifier || 1.0,
                    gross_nightly_price: nightPrice.dailyPrice,
                    gross_nightly_total: nightPrice.totalDailyPrice,
                };
                await bookingNightlyPriceService.create(nightlyPriceData);
            }
            alert('Đặt phòng thành công! Booking ID: ' + newBookingId);
            // Reset form và đóng
            setShowBookingForm(false);
            setSelectedRoomTypeId(null);
            setAvailableRoomTypes([]);
            setShowRoomTypeTable(false);
            // Refresh bookings list
            const data = await fetchBookingsByHotelId(selectedHotelId);
            setBookings(Array.isArray(data) ? data : (data?.data || []));
        } catch (error) {
            console.error('Error creating booking:', error);
            alert('Có lỗi xảy ra khi đặt phòng: ' + (error.response?.data?.message || error.message));
        } finally {
            setSendingBookingMessage(false);
            setCreatingBooking(false);
        }
    };

    const sendMessage = async () => {
        if (newMessage.trim() && selectedBooking) {
            // Lấy senderId từ localStorage hoặc context nếu có
            const currentUser = JSON.parse(localStorage.getItem('user') || localStorage.getItem('authUser') || '{}');
            const senderId = currentUser.id || currentUser.userId || currentUser.user_id;
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

    // Hiển thị loading khi đang load thông tin staff
    if (loadingStaffInfo) {
        return (
            <div className="h-[calc(100vh-120px)] grid place-items-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải thông tin khách sạn...</p>
                </div>
            </div>
        );
    }

    // Nếu chưa chọn khách sạn, hiển thị màn hình chọn khách sạn (chỉ cho owner)
    if (!selectedHotelId) {
        // Nếu là staff mà chưa có hotel thì hiển thị thông báo
        if (user?.roleId === 6) {
            return (
                <div className="h-[calc(100vh-120px)] grid place-items-center">
                    <div className="text-center">
                        <p className="text-gray-600">Không tìm thấy thông tin khách sạn của bạn.</p>
                    </div>
                </div>
            );
        }

        // Owner: cho phép chọn khách sạn
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
                {showBookingForm ? (
                    <div className="flex flex-col h-full bg-white justify-center items-center">
                        <div className="w-full max-w-md h-[80vh] overflow-y-auto bg-white border rounded-xl p-6 shadow-md mt-8 relative pb-16">
                        <form onSubmit={handleSubmitBookingForm} className="w-full">
                            <h2 className="text-lg font-bold mb-4 text-gray-800">Đặt phòng mới</h2>
                            <div className="mb-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Khách sạn</label>
                                <input
                                    type="text"
                                    value={selectedHotel?.name || selectedHotel?.hotel_name || ''}
                                    readOnly
                                    className="w-full border rounded-lg px-3 py-2 bg-gray-100 text-gray-700"
                                />
                            </div>
                            <div className="mb-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Hotel ID</label>
                                <input
                                    type="text"
                                    value={selectedHotel?.hotelId || selectedHotel?.hotel_id || ''}
                                    readOnly
                                    className="w-full border rounded-lg px-3 py-2 bg-gray-100 text-gray-700"
                                />
                            </div>
                            <div className="mb-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày nhận phòng (Check-in)</label>
                                <input
                                    type="date"
                                    name="checkInDate"
                                    value={bookingForm.checkInDate}
                                    onChange={handleBookingFormChange}
                                    className="w-full border rounded-lg px-3 py-2"
                                    required
                                    min={(function(){
                                        const today = new Date();
                                        today.setDate(today.getDate() + 1);
                                        // Fix: use local time, not UTC, for min date
                                        const y = today.getFullYear();
                                        const m = String(today.getMonth() + 1).padStart(2, '0');
                                        const d = String(today.getDate()).padStart(2, '0');
                                        return `${y}-${m}-${d}`;
                                    })()}
                                />
                            </div>
                            <div className="mb-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày trả phòng (Check-out)</label>
                                <input
                                    type="date"
                                    name="checkOutDate"
                                    value={bookingForm.checkOutDate}
                                    onChange={handleBookingFormChange}
                                    className="w-full border rounded-lg px-3 py-2"
                                    required
                                    min={(function(){
                                        const checkIn = new Date(bookingForm.checkInDate);
                                        if (!isNaN(checkIn.getTime())) {
                                            checkIn.setDate(checkIn.getDate() + 1);
                                            return checkIn.toISOString().split('T')[0];
                                        }
                                        const today = new Date();
                                        today.setDate(today.getDate() + 2);
                                        return today.toISOString().split('T')[0];
                                    })()}
                                />
                            </div>
                            {/* Thêm số người và số phòng */}
                            <div className="mb-3 flex gap-3">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Số người</label>
                                    <input
                                        type="number"
                                        name="numGuests"
                                        min={1}
                                        max={10}
                                        value={bookingForm.numGuests === 0 ? '' : bookingForm.numGuests}
                                        onChange={handleBookingFormChange}
                                        onBlur={handleBookingFormBlur}
                                        className="w-full border rounded-lg px-3 py-2"
                                        placeholder="Tối đa 10"
                                        required
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Số phòng</label>
                                    <input
                                        type="number"
                                        name="numRooms"
                                        min={1}
                                        max={5}
                                        value={bookingForm.numRooms === 0 ? '' : bookingForm.numRooms}
                                        onChange={handleBookingFormChange}
                                        onBlur={handleBookingFormBlur}
                                        className="w-full border rounded-lg px-3 py-2"
                                        placeholder="Tối đa 5"
                                        required
                                    />
                                </div>
                            </div>
                            {roomGuestError && (
                                <div className="text-red-600 text-sm mb-2">{roomGuestError}</div>
                            )}
                            
                            {/* Phương thức thanh toán - Luôn hiển thị */}
                            <div className="mb-3">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Phương thức thanh toán</label>
                                <select
                                    name="paymentMethod"
                                    value={bookingForm.paymentMethod}
                                    onChange={handleBookingFormChange}
                                    className="w-full border rounded-lg px-3 py-2"
                                    required
                                >
                                    <option value="" disabled>Vui lòng chọn phương thức thanh toán</option>
                                    <option value="credit_card">Thẻ tín dụng</option>
                                    <option value="cash">Tiền mặt tại khách sạn</option>
                                </select>
                            </div>
                            
                            {/* Nút kiểm tra nằm trên hai nút dưới cùng */}
                            <div className="w-full flex justify-start mb-2">
                                <button
                                    type="button"
                                    className="px-5 py-2 bg-blue-600 text-white rounded-full shadow hover:bg-blue-700 transition-all text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={handleCheckAvailability}
                                    disabled={checkingAvailability}
                                >
                                    {checkingAvailability ? 'Đang kiểm tra...' : 'Kiểm tra'}
                                </button>
                            </div>
                            
                            {/* Bảng hiển thị loại phòng phù hợp */}
                            {showRoomTypeTable && availableRoomTypes.length > 0 && (
                                <div className="mb-4 border rounded-lg overflow-hidden">
                                    <div className="bg-gray-50 px-3 py-2 border-b">
                                        <h3 className="text-sm font-semibold text-gray-700">Loại phòng phù hợp ({availableRoomTypes.length})</h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Loại phòng</th>
                                                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-700">Sức chứa</th>
                                                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-700">Phòng trống</th>
                                                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-700">Tổng chỗ</th>
                                                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-700">Thao tác</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {availableRoomTypes.map((roomType) => (
                                                    <tr key={roomType.room_type_id} className="hover:bg-gray-50">
                                                        <td className="px-3 py-2 text-gray-900 flex items-center gap-2">
                                                            <input
                                                                type="radio"
                                                                name="selectedRoomType"
                                                                checked={selectedRoomTypeId === roomType.room_type_id}
                                                                onChange={() => setSelectedRoomTypeId(roomType.room_type_id)}
                                                                className="form-radio text-blue-600 h-4 w-4"
                                                            />
                                                            <span>{roomType.room_type_name}</span>
                                                        </td>
                                                        <td className="px-3 py-2 text-center text-gray-600">{roomType.max_occupancy} người/phòng</td>
                                                        <td className="px-3 py-2 text-center">
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                {roomType.available_rooms} phòng
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2 text-center text-gray-600">
                                                            {roomType.available_rooms * roomType.max_occupancy} người
                                                        </td>
                                                        <td className="px-3 py-2 text-center">
                                                            <button
                                                                onClick={() => handleSendBookingDetail(roomType)}
                                                                disabled={sendingBookingMessage}
                                                                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                {sendingBookingMessage ? 'Đang gửi...' : 'Gửi tin nhắn'}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                            
                            {/* Hiển thị nút gửi tin nhắn khi không có phòng phù hợp */}
                            {showRoomTypeTable && availableRoomTypes.length === 0 && roomGuestError && (
                                <div className="mb-4 border border-red-200 rounded-lg p-4 bg-red-50">
                                    <p className="text-red-600 text-sm mb-3">{roomGuestError}</p>
                                    <button
                                        onClick={handleSendNoRoomMessage}
                                        disabled={sendingBookingMessage}
                                        className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {sendingBookingMessage ? 'Đang gửi...' : 'Gửi tin nhắn cho khách'}
                                    </button>
                                </div>
                            )}
                            <div className="flex justify-end gap-2 mt-4">
                                <button
                                    type="button"
                                    onClick={handleCancelBookingForm}
                                    className="px-4 py-2 rounded-lg border bg-gray-100 text-gray-700 hover:bg-gray-200"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                                    disabled={creatingBooking}
                                >
                                    {creatingBooking ? 'Đang tạo booking...' : 'Xác nhận đặt phòng'}
                                </button>
                            </div>
                        </form>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="p-3">
                            {/* Hotel Selection Dropdown - chỉ hiển thị cho owner */}
                            {user?.roleId !== 6 && (
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
                            )}

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
                    </>
                )}
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
                            <div className="flex items-center gap-2">
                                <button
                                    className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                    onClick={handleOpenBookingForm}
                                >
                                    <PlusCircle size={18} className="mr-1" /> Đặt phòng
                                </button>
                                <button 
                                    onClick={closeChat}
                                    className="text-gray-500 hover:bg-gray-100 p-2 rounded-full transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
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
                                                        <p className="text-sm whitespace-pre-line break-words">{message.messageContent}</p>
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