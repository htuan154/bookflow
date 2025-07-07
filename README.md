Bookflow - Nền Tảng Đặt Phòng Khách Sạn & Du Lịch
Bookflow là một dự án đa nền tảng toàn diện, cung cấp giải pháp đặt phòng khách sạn và khám phá du lịch, phục vụ cho ba đối tượng người dùng chính: Khách hàng, Chủ khách sạn, và Quản trị viên.

✨ Tính Năng Nổi Bật
👤 Đối với Khách Hàng (Customer)
Tìm kiếm & Khám phá: Tìm kiếm khách sạn thông minh theo địa điểm, tên, tiện nghi.

Đặt phòng dễ dàng: Quy trình đặt phòng nhanh chóng, an toàn.

Thanh toán linh hoạt: Hỗ trợ nhiều cổng thanh toán.

Đánh giá & Bình luận: Chia sẻ trải nghiệm và xem đánh giá từ cộng đồng.

Quản lý tài khoản: Xem lại lịch sử đặt phòng, quản lý thông tin cá nhân.

Khám phá du lịch: Đọc các bài blog, gợi ý về địa điểm và món ăn.

🏨 Đối với Chủ Khách Sạn (Hotel Owner)
Dashboard quản lý: Giao diện trực quan để theo dõi hoạt động kinh doanh.

Quản lý Khách sạn: Dễ dàng cập nhật thông tin, hình ảnh, tiện nghi.

Quản lý Phòng & Giá: Thiết lập các loại phòng, quản lý giá linh động theo mùa.

Xử lý Đặt phòng: Xác nhận, check-in, check-out cho các lượt đặt phòng.

Thống kê & Báo cáo: Xem báo cáo doanh thu, lượt đặt phòng theo thời gian.

👑 Đối với Quản Trị Viên (Admin)
Dashboard tổng quan: Theo dõi toàn bộ hoạt động của hệ thống.

Quản lý Người dùng: Quản lý tất cả các tài khoản trong hệ thống.

Quản lý Đối tác: Xét duyệt, quản lý các khách sạn đăng ký tham gia.

Quản lý Nội dung: Đăng tải và quản lý các bài viết blog, địa điểm du lịch.

Quản lý Khuyến mãi: Tạo và quản lý các chương trình khuyến mãi.

🚀 Công Nghệ Sử Dụng
Dự án được xây dựng trên một cấu trúc monorepo, bao gồm 3 dự án con:

Phần

Công Nghệ

Mô Tả

Backend API

Node.js, Express.js, PostgreSQL, Supabase

Xây dựng API RESTful mạnh mẽ, sử dụng Supabase cho Database, Authentication và Storage.

Web App

React.js, Tailwind CSS

Giao diện quản trị cho Admin và Chủ khách sạn, được xây dựng với React và styling bằng Tailwind CSS.

Mobile App

Flutter

Ứng dụng di động cho khách hàng, có thể chạy trên cả iOS và Android.

🛠️ Cài Đặt & Khởi Chạy
Yêu Cầu Hệ Thống
Node.js (v18.x trở lên)

npm / yarn

Flutter SDK

Git

Các Bước Cài Đặt
Clone repository:

git clone https://github.com/htuan154/bookflow.git
cd bookflow

Thiết lập Backend (server):

# Di chuyển vào thư mục server
cd server

# Cài đặt các thư viện cần thiết
npm install

# Tạo file .env từ file .env.example và điền các thông tin của bạn
cp .env.example .env

# Chạy server
npm run dev

Server sẽ chạy tại http://localhost:8080.

Thiết lập Web App (web_app):

# Di chuyển vào thư mục web_app
cd web_app

# Cài đặt các thư viện cần thiết
npm install

# Chạy ứng dụng React
npm start

Ứng dụng web sẽ chạy tại http://localhost:3000.

Thiết lập Mobile App (mobile_app):

# Di chuyển vào thư mục mobile_app
cd mobile_app

# Lấy các thư viện cần thiết
flutter pub get

# Chạy ứng dụng trên máy ảo hoặc thiết bị thật
flutter run

📚 Tài Liệu API
Tài liệu API được tạo tự động bằng Swagger. Sau khi khởi động server, bạn có thể truy cập vào địa chỉ sau để xem và test các API:

http://localhost:8080/api-docs

🤝 Đóng Góp
Mọi sự đóng góp đều được chào đón! Vui lòng tạo một Pull Request hoặc mở một Issue để thảo luận về những thay đổi bạn muốn thực hiện.

Fork dự án.

Tạo một nhánh mới (git checkout -b feature/AmazingFeature).

Commit các thay đổi của bạn (git commit -m 'Add some AmazingFeature').

Đẩy lên nhánh (git push origin feature/AmazingFeature).

Mở một Pull Request.
