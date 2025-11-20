# Debug Hotel Staff Login Issue

## Vấn đề đã sửa:

### 1. **LoginForm.js** - ⚠️ VẤN ĐỀ CHÍNH
- **Vấn đề**: useEffect navigation chỉ xử lý ADMIN và HOTEL_OWNER, không có HOTEL_STAFF
- **Hậu quả**: Hotel staff bị redirect về `/unauthorized` ngay sau khi đăng nhập
- **Đã sửa**: Thêm điều kiện cho HOTEL_STAFF navigate đến `/hotel-owner`

```javascript
if (user.roleId === USER_ROLES.ADMIN) {
    navigate('/admin/dashboard', { replace: true });
} else if (user.roleId === USER_ROLES.HOTEL_OWNER || user.roleId === USER_ROLES.HOTEL_STAFF) {
    navigate('/hotel-owner', { replace: true });
} else {
    navigate('/unauthorized', { replace: true });
}
```

### 2. **HomeRedirect.js** - Thiếu xử lý cho HOTEL_STAFF
- **Vấn đề**: File không có điều kiện cho `USER_ROLES.HOTEL_STAFF` (role_id = 6)
- **Hậu quả**: Hotel staff bị redirect về `/unauthorized` khi truy cập root path
- **Đã sửa**: Thêm điều kiện redirect hotel_staff đến `/hotel-owner`

```javascript
if (user?.roleId === USER_ROLES.HOTEL_STAFF) {
    return <Navigate to="/hotel-owner" replace />;
}
```

## Các thay đổi đã thực hiện:

### File: `LoginForm.js` ⚠️ **QUAN TRỌNG NHẤT**
- ✅ **SỬA LỖI CHÍNH**: Thêm xử lý navigation cho HOTEL_STAFF
- ✅ Cho phép HOTEL_STAFF navigate đến `/hotel-owner`
- ✅ Thêm debug logs để theo dõi login flow

### File: `HomeRedirect.js`
- ✅ Thêm xử lý redirect cho HOTEL_STAFF → `/hotel-owner`
- ✅ Thêm debug logs để kiểm tra user và roleId

### File: `HotelOwnerRouters.js`
- ✅ Cho phép cả HOTEL_OWNER và HOTEL_STAFF truy cập routes
- ✅ Thêm debug logs chi tiết

### File: `HotelOwnerOnlyRoute.js` (NEW FILE)
- ✅ Tạo component mới để block HOTEL_STAFF khỏi các trang owner-only
- ✅ Thêm debug logs

### File: `AuthContext.js`
- ✅ Thêm debug logs cho login và profile fetch

### File: `HotelOwnerLayout.jsx`
- ✅ Filter menu items dựa trên role
- ✅ Ẩn các menu ownerOnly với hotel_staff
- ✅ Import USER_ROLES và thêm logic kiểm tra

## Cách kiểm tra:

1. **Mở Chrome DevTools** (F12)
2. **Mở tab Console**
3. **Đăng nhập với hotel_staff account**
4. **Kiểm tra các log sau:**

```
[AuthContext] Login - user: {...}
[AuthContext] Login - user.roleId: 6
[HomeRedirect] isAuthenticated: true
[HomeRedirect] user: {...}
[HomeRedirect] user.roleId: 6
[HotelOwnerRoutes] isAuthenticated: true
[HotelOwnerRoutes] user.roleId: 6
[HotelOwnerRoutes] HOTEL_STAFF role: 6
[HotelOwnerRoutes] Access granted
```

## HOTEL_STAFF có quyền truy cập:

✅ **Accessible Pages:**
- Welcome Page
- Profile
- Đặt phòng (Bookings)
- Đánh giá (Reviews)
- Hỗ trợ khách hàng (Support)
- Tin nhắn (Messages)
- Marketing

❌ **Restricted Pages (Owner Only):**
- Dashboard
- Quản lý Khách Sạn
- Quản lý Phòng
- Giá & Khuyến mãi
- Tài khoản Ngân hàng
- Nhân viên
- Hợp đồng
- Báo cáo & Thống kê

## Nếu vẫn gặp lỗi:

1. **Clear browser cache và localStorage:**
```javascript
// Chạy trong Console
localStorage.clear();
location.reload();
```

2. **Kiểm tra roleId trong database:**
- Đảm bảo user có `role_id = 6` trong database
- Đảm bảo API `/profile` trả về đúng `roleId`

3. **Kiểm tra API response:**
```javascript
// Check trong Network tab
// Endpoint: /api/auth/profile
// Response phải có:
{
  "data": {
    "roleId": 6,  // Hoặc "role_id": 6
    ...
  }
}
```

## Lưu ý quan trọng:

⚠️ **Tên field:** Kiểm tra xem API trả về `roleId` hay `role_id`
- Nếu API trả về `role_id`, cần convert trong code
- Kiểm tra tất cả các chỗ sử dụng `user.roleId` hoặc `user?.roleId`
