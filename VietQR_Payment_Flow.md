# VietQR Payment Flow (rút gọn)

## 0) Tiền đề

```env
VIETQR_BASE_URL=https://api.vietqr.io
ADMIN_BANK_ACCOUNT=1031761248
ADMIN_BANK_NAME=LE DANG HOANG TUAN
ADMIN_ACQID=970436
PLATFORM_ADMIN_FEE_RATE=0
PG_FEE_RATE=0
```

* QR luôn chuyển tiền **vào STK ADMIN** ở trên.
* Báo cáo/payout đọc từ bảng `payments` **khi status='paid'**.

---

## 1) Sơ đồ tổng quát

| Bước | Actor | Hành động | Kết quả |
|------|-------|-----------|---------|
| 1 | App/Quầy | Gửi yêu cầu tạo QR | → Backend nhận request |
| 2 | Backend | Gọi API VietQR | → Tạo mã QR thanh toán |
| 3 | VietQR API | Trả về QR image | → Backend nhận qrDataURL |
| 4 | Backend | Gửi QR cho client | → App/Quầy hiển thị QR |
| 5 | Khách hàng | Quét QR bằng app ngân hàng | → Chuyển tiền vào TK ADMIN (VCB) |
| 6 | Webhook/Confirm | POST tx_ref đến Backend | → Xác nhận thanh toán |
| 7 | Backend | UPDATE database | → payments = paid, bookings = paid |
| 8 | System | Tạo báo cáo/payout | → Đọc từ bảng payments |

---

## 2) Ba luồng nghiệp vụ

### 2.1 Luồng 1 — Đặt **trên app & thanh toán luôn**

| Use Case | **UC01: Thanh toán booking qua app** |
|----------|--------------------------------------|
| **Actor chính** | Khách hàng sử dụng mobile app |
| **Mục tiêu** | Đặt phòng và thanh toán ngay lập tức |
| **Tiền điều kiện** | Khách đã chọn phòng và tạo booking; Booking có total_price > 0; payment_status = 'unpaid' |

| **Luồng chính** |
|-----------------|
| 1. App gửi POST `/bookings/:id/payments/qr` |
| 2. Backend SELECT booking(total_price, hotel_id) từ DB |
| 3. Backend INSERT payment record (status='pending', tx_ref, base_amount) |
| 4. Backend gọi VietQR API generate QR với amount = total_price |
| 5. VietQR API trả về qrDataURL |
| 6. Backend trả về {qr_image, tx_ref} cho App |
| 7. App hiển thị QR code cho khách |
| 8. Khách quét QR và chuyển tiền vào TK ADMIN |
| 9. Webhook gửi POST `/webhooks/vietqr` với {tx_ref, amount, paid_at} |
| 10. Backend UPDATE payments → status='paid' |
| 11. Backend UPDATE bookings → payment_status='paid' |

| **Kết quả** | Booking được thanh toán thành công, tiền vào TK ADMIN |

### 2.2 Luồng 2 — Đặt **trên app, trả tiền khi check-in**

| Use Case | **UC02: Đặt phòng trước, thanh toán khi check-in** |
|----------|---------------------------------------------------|
| **Actor chính** | Khách hàng app + Nhân viên quầy |
| **Mục tiêu** | Đặt phòng trước qua app, thanh toán khi đến khách sạn |
| **Tiền điều kiện** | Booking đã tạo từ app; payment_status = 'unpaid'; Khách đến check-in |

| **Luồng chính** |
|-----------------|
| 1. Khách đã đặt phòng qua app (booking tạo với payment_status='unpaid') |
| 2. Khách đến khách sạn để check-in |
| 3. Nhân viên quầy xác nhận booking |
| 4. Quầy/App gửi POST `/bookings/:id/payments/qr` |
| 5. Backend SELECT booking(total_price, hotel_id) từ DB |
| 6. Backend INSERT payment record (status='pending', tx_ref, base_amount) |
| 7. Backend gọi VietQR API generate QR với amount = total_price |
| 8. VietQR API trả về qrDataURL |
| 9. Backend trả về {qr_image, tx_ref} cho Quầy |
| 10. Quầy hiển thị QR cho khách thanh toán |
| 11. Khách quét QR và chuyển tiền vào TK ADMIN |
| 12. Webhook gửi POST `/webhooks/vietqr` với {tx_ref, amount, paid_at} |
| 13. Backend UPDATE payments → status='paid' |
| 14. Backend UPDATE bookings → payment_status='paid' |
| 15. Nhân viên quầy xác nhận check-in thành công |

| **Kết quả** | Booking được thanh toán khi check-in, khách có thể vào phòng |

### 2.3 Luồng 3 — **Walk-in tại quầy** (tạo booking & thanh toán tại chỗ)

| Use Case | **UC03: Walk-in thanh toán tại quầy** |
|----------|---------------------------------------|
| **Actor chính** | Nhân viên quầy lễ tân |
| **Mục tiêu** | Tạo booking cho khách walk-in và thu tiền ngay |
| **Tiền điều kiện** | Có phòng trống; Khách đến trực tiếp quầy |

| **Luồng chính** |
|-----------------|
| 1. Quầy tạo booking mới: POST `/bookings` (status='unpaid') |
| 2. Backend INSERT booking vào DB |
| 3. Quầy gửi POST `/bookings/:id/payments/qr` |
| 4. Backend INSERT payment record (pending, hotel_id, base_amount) |
| 5. Backend gọi VietQR API generate QR |
| 6. VietQR API trả về qrDataURL |
| 7. Backend trả về {qr_image, tx_ref} cho Quầy |
| 8. Quầy hiển thị QR cho khách |
| 9. Khách quét QR và chuyển tiền vào TK ADMIN |
| 10. Webhook gửi POST `/webhooks/vietqr` |
| 11. Backend UPDATE payments → status='paid' |
| 12. Backend UPDATE bookings → payment_status='paid' |

| **Kết quả** | Booking walk-in được tạo và thanh toán thành công |

> **Lưu ý:** Có thể dùng `/hotels/:hotelId/payments/qr` (booking_id=NULL) nếu không cần tạo booking cho walk-in.

---

## 3) API tối thiểu

### 3.1 Tạo QR theo booking (dùng cho Luồng 1 & 2 & 3)

`POST /api/v1/bookings/:bookingId/payments/qr`

* Lấy `total_price`, chặn `payment_status='paid'`.
* Tạo `tx_ref`, **INSERT `payments`**:

  * `booking_id`, `hotel_id`
  * `base_amount = total_price`, `surcharge_amount=0`, `discount_amount=0`
  * `pg_fee_amount=0`, `admin_fee_amount=0`
  * `status='pending'`, `tx_ref`, `provider='api.vietqr.io'`, `note='Booking QR'`
* Gọi VietQR generate → trả `{qr_image, tx_ref, amount}`.

### 3.2 (Tuỳ chọn) QR tại quầy không booking

`POST /api/v1/hotels/:hotelId/payments/qr` `{ amount, note }`

* **INSERT `payments`**: `booking_id=NULL`, `hotel_id`, `base_amount=amount`, `status='pending'`, `tx_ref`…
* Gọi VietQR generate → trả `{qr_image, tx_ref, amount}`.

### 3.3 Webhook/Xác nhận thanh toán (dùng chung)

`POST /api/v1/webhooks/vietqr`
**Body tối thiểu**:

```json
{ "tx_ref": "PAY-169...", "amount": 150000, "paid_at": "2025-10-10T22:15:00+07:00", "provider_tx_id": "VQR123" }
```

**Xử lý:**

* Tìm payment theo `tx_ref`; nếu đã `paid` → **bỏ qua** (idempotent).
* Tính phí (hiện 0%):

  * `pg_fee_amount=0`, `admin_fee_amount=0`, `hotel_net_amount = base_amount`.
* `UPDATE payments → paid` (+ `paid_at`, `provider_tx_id`).
* Nếu có `booking_id` → `UPDATE bookings.payment_status='paid'`.

---

## 4) Quy tắc & lưu ý

* **Tiền thật** luôn **vào TK ADMIN** (không vào TK khách sạn).
* **Báo cáo & payout** đọc `payments WHERE status='paid'`.
* **Idempotent** webhook: không xử lý trùng khi `status='paid'`.
* **Validate**: không tạo QR nếu `payment_status='paid'` hoặc `total_price<=0`.
* (Sau này) nếu dùng VietQR Portal/PayOS → verify chữ ký webhook bằng `VIETQR_SECRET`.

---

## 5) Trạng thái chính

* `payments.status`: `pending` → `paid`.
* `bookings.payment_status`: `unpaid` → `paid` (khi payment gắn booking chuyển `paid`).

---
