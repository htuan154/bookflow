// // src/__tests__/integration/hotel.integration.test.js
// const request = require('supertest');
// const bcrypt = require('bcryptjs');
// const app = require('../../../index');
// const pool = require('../../config/db');

// describe('Hotel API - Integration Tests', () => {
//     let adminToken, ownerToken, userToken;
//     let hotelId; // Đảm bảo hotelId được khai báo ở scope này để dùng chung

//     // --- SETUP: Chạy một lần trước tất cả các test ---
//     beforeAll(async () => {
//         // 1. Dọn dẹp DB theo đúng thứ tự để tránh lỗi khóa ngoại
//         await pool.query('DELETE FROM hotels');
//         await pool.query("DELETE FROM users WHERE email LIKE '%@hotel-test.com'");
        
//         // 2. Đảm bảo các vai trò đã tồn tại
//         await pool.query(`
//             INSERT INTO roles (role_id, role_name)
//             VALUES (1, 'admin'), (2, 'hotel_owner'), (3, 'user')
//             ON CONFLICT (role_id) DO NOTHING;
//         `);

//         // 3. Tạo các user test
//         const passwordHash = await bcrypt.hash('password123', 10);
//         const timestamp = Date.now();

//         await pool.query(
//             `INSERT INTO users (username, email, password_hash, full_name, role_id) VALUES ($1, $2, $3, 'Test Admin', 1)`,
//             [`testadmin_${timestamp}`, 'admin@hotel-test.com', passwordHash]
//         );

//         await pool.query(
//             `INSERT INTO users (username, email, password_hash, full_name, role_id) VALUES ($1, $2, $3, 'Test Owner', 2)`,
//             [`testowner_${timestamp}`, 'owner@hotel-test.com', passwordHash]
//         );

//         await pool.query(
//             `INSERT INTO users (username, email, password_hash, full_name, role_id) VALUES ($1, $2, $3, 'Test User', 3)`,
//             [`testuser_${timestamp}`, 'user@hotel-test.com', passwordHash]
//         );

//         // 4. Đăng nhập để lấy token
//         const adminLogin = await request(app).post('/api/v1/auth/login').send({ identifier: 'admin@hotel-test.com', password: 'password123' });
//         adminToken = adminLogin.body.data?.token;

//         const ownerLogin = await request(app).post('/api/v1/auth/login').send({ identifier: 'owner@hotel-test.com', password: 'password123' });
//         ownerToken = ownerLogin.body.data?.token;

//         const userLogin = await request(app).post('/api/v1/auth/login').send({ identifier: 'user@hotel-test.com', password: 'password123' });
//         userToken = userLogin.body.data?.token;

//         if (!adminToken || !ownerToken || !userToken) {
//             throw new Error('Lỗi không lấy được token xác thực, vui lòng kiểm tra logic tạo user và login');
//         }
//     });

//     // --- TEARDOWN: Chạy một lần sau khi tất cả các test hoàn thành ---
//     afterAll(async () => {
//         // Dọn dẹp dữ liệu test sau khi chạy xong tất cả các test
//         await pool.query('DELETE FROM hotels');
//         await pool.query("DELETE FROM users WHERE email LIKE '%@hotel-test.com'");
//         await pool.end(); // Đóng kết nối pool sau khi hoàn tất tất cả các test
//     });

//     // --- TESTS ---
//     describe('Public Routes', () => {
//         it('GET /api/v1/hotels - Phải trả về danh sách khách sạn (có thể rỗng)', async () => {
//             const res = await request(app).get('/api/v1/hotels');
            
//             expect(res.statusCode).toBe(200);
//             // FIX: API trả về `status`, không phải `success`
//             expect(res.body.status).toBe('success');
//             expect(Array.isArray(res.body.data)).toBe(true);
//         });
//     });

//     describe('Hotel Creation & Details', () => {
//         it('POST /api/v1/hotels - User thường gửi thiếu dữ liệu sẽ nhận lỗi 400', async () => {
//             const res = await request(app)
//                 .post('/api/v1/hotels')
//                 .set('Authorization', `Bearer ${userToken}`)
//                 .send({ name: 'Invalid Hotel' });
            
//             // FIX: Middleware validation chạy trước, nên lỗi là 400 (Bad Request), không phải 403.
//             expect(res.statusCode).toBe(400); 
//         });

//         it('POST /api/v1/hotels - Owner có thể tạo khách sạn thành công', async () => {
//             // FIX: Sử dụng bộ dữ liệu an toàn, và dùng tên trường camelCase cho đúng với code repository
//             const validHotelData = {
//                 name: 'Khách Sạn Hoàn Hảo Sài Gòn',
//                 description: 'Một mô tả đủ dài và chi tiết về khách sạn tuyệt vời này tại trung tâm thành phố.',
//                 address: 'Số 123, Đường Đồng Khởi, Quận 1, Thành phố Hồ Chí Minh',
//                 country: 'Vietnam',
//                 city: 'Ho Chi Minh City',
//                 phoneNumber: '0987654321', // Dùng phoneNumber và số 10 số
//                 email: 'hotel.owner@gmail.com',
//                 checkInTime: '14:00',
//                 checkOutTime: '12:00',
//                 starRating: 5
//             };

//             const res = await request(app)
//                 .post('/api/v1/hotels')
//                 .set('Authorization', `Bearer ${ownerToken}`)
//                 .send(validHotelData);

//             // FIX: Dùng expect trực tiếp để test thất bại khi có lỗi
//             expect(res.statusCode).toBe(201);
//             expect(res.body.success).toBe(true);
//             expect(res.body.data).toHaveProperty('hotelId');
//             expect(res.body.data.name).toBe(validHotelData.name);
//             expect(res.body.data.status).toBe('pending');
            
//             // Lưu lại hotelId cho các test sau
//             hotelId = res.body.data.hotelId;
//         });

//         it('GET /api/v1/hotels/:id - Phải lấy được thông tin chi tiết khách sạn vừa tạo', async () => {
//             // Test này giờ sẽ chạy được vì hotelId đã được tạo ở trên
//             expect(hotelId).toBeDefined();

//             const res = await request(app).get(`/api/v1/hotels/${hotelId}`);
            
//             expect(res.statusCode).toBe(200);
//             expect(res.body.success).toBe(true);
//             expect(res.body.data.hotelId).toBe(hotelId);
//         });
//     });

//     describe('Admin Routes', () => {
//         it('PATCH /api/v1/admin/hotels/:id/status - Admin có thể duyệt khách sạn', async () => {
//             expect(hotelId).toBeDefined();

//             const res = await request(app)
//                 .patch(`/api/v1/admin/hotels/${hotelId}/status`)
//                 .set('Authorization', `Bearer ${adminToken}`)
//                 .send({ status: 'approved' });

//             expect(res.statusCode).toBe(200);
//             expect(res.body.data.status).toBe('approved');

//             // Kiểm tra lại trong DB để chắc chắn
//             const dbCheck = await pool.query('SELECT status FROM hotels WHERE hotel_id = $1', [hotelId]);
//             expect(dbCheck.rows[0].status).toBe('approved');
//         });

//         it('GET /api/v1/admin/hotels/statistics - Admin có thể xem thống kê', async () => {
//             const res = await request(app)
//                 .get('/api/v1/admin/hotels/statistics')
//                 .set('Authorization', `Bearer ${adminToken}`);

//             expect(res.statusCode).toBe(200);
//             expect(res.body.success).toBe(true);
//             expect(res.body.data).toHaveProperty('pending');
//             expect(res.body.data).toHaveProperty('approved', 1);
//         });
//     });
// });