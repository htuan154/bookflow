# Explore Screen Components

## Cấu trúc thư mục
```
explore/
├── explore_screen.dart          # Main screen
├── components/
│   ├── hotel_model.dart         # Hotel data model
│   ├── map_markers.dart         # Map markers logic
│   ├── map_search_bar.dart      # Search bar component
│   ├── hotel_details_bottom_sheet.dart # Hotel details modal
│   ├── loading_indicator.dart   # Loading indicator
│   ├── selected_location_info.dart # Selected location info
│   ├── hotel_count_badge.dart   # Hotel count display
│   └── location_dialog.dart     # Location selection dialog
└── README.md                    # This file
```

## Các thay đổi chính

### 1. Tách thành components
- Chia file lớn thành các component nhỏ, dễ quản lý
- Mỗi component có một chức năng rõ ràng
- Dễ dàng maintain và tái sử dụng

### 2. Giải quyết vấn đề GPS Permission
**Vấn đề cũ:** App luôn yêu cầu GPS permission mỗi khi vào trang, gây phiền toái cho người dùng.

**Giải pháp mới:**
- `_checkLocationPermission()`: Chỉ kiểm tra permission mà không yêu cầu
- `_getCurrentLocationSilently()`: Tự động lấy vị trí nếu đã có permission
- `_getCurrentLocation()`: Chỉ được gọi khi người dùng nhấn nút "My Location"
- Hiển thị thông báo nhắc nhở người dùng có thể bật GPS

### 3. Cải thiện UX
- Không còn popup permission phiền toái khi vào trang
- Thông báo rõ ràng về trạng thái GPS
- Loading indicator chính xác hơn
- Người dùng chủ động quyết định khi nào bật GPS

## Cách hoạt động

1. **Khởi tạo trang:**
   - Kiểm tra permission GPS (không yêu cầu)
   - Load danh sách hotels
   - Nếu có permission, tự động lấy vị trí hiện tại một lần

2. **Khi người dùng nhấn nút My Location:**
   - Mới yêu cầu GPS permission (nếu chưa có)
   - Lấy vị trí hiện tại và di chuyển map

3. **Thông báo:**
   - Hiển thị hint nhỏ để người dùng biết có thể bật GPS
   - Chỉ hiển thị khi cần thiết

## Lợi ích
- ✅ Không còn popup phiền toái khi vào trang
- ✅ UX tốt hơn, người dùng chủ động
- ✅ Code được tổ chức tốt hơn
- ✅ Dễ maintain và debug
- ✅ Performance tốt hơn
