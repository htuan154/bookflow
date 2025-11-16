# Booking Price Calculator - Hướng dẫn sử dụng

## Tổng quan
Hệ thống tính giá booking tự động với seasonal pricing, gửi tin nhắn chi tiết cho khách hàng.

## Các file đã tạo/cập nhật

### 1. API Services
- `src/api/bookingNightlyPrice.service.js` - Service để làm việc với booking nightly prices
- `src/config/apiEndpoints.js` - Đã thêm BOOKING_NIGHTLY_PRICE_ENDPOINTS

### 2. Context & Hooks
- `src/context/BookingNightlyPriceContext.js` - Context quản lý state của booking nightly prices
- `src/hooks/useBookingNightlyPrice.js` - Hook để sử dụng BookingNightlyPriceContext

### 3. Utilities
- `src/utils/bookingPriceCalculator.js` - Các hàm tính giá và format message
  - `calculateBookingPrice()` - Tính giá theo từng đêm với seasonal pricing
  - `formatPrice()` - Format giá VND
  - `createBookingDetailMessage()` - Tạo message chi tiết booking
  - `createNoRoomAvailableMessage()` - Message khi không có phòng phù hợp

### 4. Components
- `src/pages/hotel_owner/support/CustomerSupportPage.jsx` - Đã cập nhật với các tính năng:
  - Kiểm tra phòng còn trống
  - Tính giá theo từng đêm với seasonal pricing
  - Gửi tin nhắn chi tiết booking cho từng loại phòng
  - Gửi tin nhắn khi không có phòng phù hợp

## Cách sử dụng

### Trong CustomerSupportPage:

1. **Kiểm tra phòng còn trống**:
   - Nhập ngày check-in, check-out, số khách, số phòng
   - Nhấn nút "Kiểm tra"
   - Hệ thống sẽ hiển thị danh sách loại phòng phù hợp trong bảng

2. **Gửi tin nhắn chi tiết booking**:
   - Sau khi kiểm tra, click vào nút "Gửi tin nhắn" ở cột "Thao tác" của loại phòng muốn gửi
   - Hệ thống sẽ:
     * Lấy thông tin user từ booking
     * Lấy seasonal pricing của room type
     * Tính giá theo từng đêm
     * Tạo message chi tiết với bảng giá
     * Gửi tin nhắn vào chat

3. **Gửi tin nhắn khi không có phòng**:
   - Nếu không có loại phòng nào phù hợp
   - Nhấn nút "Gửi tin nhắn cho khách" ở phần thông báo lỗi màu đỏ
   - Hệ thống sẽ gửi tin nhắn từ chối lịch sự

## Format tin nhắn chi tiết booking

```
📋 THÔNG TIN ĐẶT PHÒNG

👤 Khách hàng: Nguyễn Văn A
📧 Email: example@gmail.com
📞 SĐT: 0123456789

🏨 Loại phòng: Deluxe Room
📅 Check-in: 10/11/2025
📅 Check-out: 24/11/2025
👥 Số khách: 2
🛏️ Số phòng: 1

💰 CHI TIẾT GIÁ THEO TỪNG ĐÊM:
──────────────────────────────────────────────────
Đêm 1 (10/11/2025):
  Giá gốc: 500,000 VNĐ × 1 phòng (Giá thường)
  Thành tiền: 500,000 VNĐ

Đêm 2 (11/11/2025):
  Giá gốc: 500,000 VNĐ × 1 phòng (Mùa cao điểm x1.5)
  Thành tiền: 750,000 VNĐ

...

──────────────────────────────────────────────────
💵 TỔNG CỘNG: 7,000,000 VNĐ
──────────────────────────────────────────────────
```

## Luồng xử lý

### 1. Kiểm tra phòng (handleCheckAvailability)
```
User nhập form → Gọi API getAvailableRoomsByHotelId
→ Lọc phòng phù hợp (số phòng và sức chứa)
→ Hiển thị bảng kết quả
```

### 2. Gửi tin nhắn chi tiết (handleSendBookingDetail)
```
User click "Gửi tin nhắn" trên 1 loại phòng
→ Lấy thông tin room type đầy đủ (base_price)
→ Lấy seasonal pricing cho room type
→ Lấy thông tin user từ booking
→ Tính giá từng đêm với calculateBookingPrice()
→ Tạo message với createBookingDetailMessage()
→ Gửi message qua sendChatMessage()
```

### 3. Tính giá booking (calculateBookingPrice)
```
Loop qua từng ngày từ check-in đến check-out:
  - Kiểm tra seasonal pricing áp dụng cho ngày đó
  - Nếu có: dailyPrice = basePrice × priceModifier
  - Nếu không: dailyPrice = basePrice
  - totalDailyPrice = dailyPrice × numRooms
  - Lưu vào nightlyPrices array
→ Trả về { nightlyPrices, totalPrice, totalDays, numRooms }
```

## APIs sử dụng

### Room Type Service
- `getRoomTypeById(roomTypeId)` - Lấy thông tin room type

### Season Pricing Service
- `getSeasonPricingByRoomType(roomTypeId)` - Lấy seasonal pricing

### User Service
- `getUserById(userId)` - Lấy thông tin user

### Hotel Service
- `getAvailableRoomsByHotelId(hotelId, checkInDate, checkOutDate)` - Lấy phòng còn trống

### Chat Service
- `sendChatMessage(bookingId, message, senderId)` - Gửi tin nhắn

## TODO
- [ ] Lấy senderId từ auth context thay vì hardcode
- [ ] Thêm loading state khi fetch data
- [ ] Cache seasonal pricing để tránh gọi API nhiều lần
- [ ] Thêm preview message trước khi gửi
- [ ] Export booking detail ra PDF
- [ ] Lưu booking nightly prices vào database khi tạo booking mới
