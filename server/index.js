// server/index.js

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Import các module cho Swagger
const swaggerUi = require('swagger-ui-express');
const swaggerFile = require('./swagger-output.json'); 

const pool = require('./src/config/db');

// Import tất cả các file route chính
const authRoutes = require('./src/api/v1/routes/auth.route');
const userRoutes = require('./src/api/v1/routes/user.route');
const hotelRoutes = require('./src/api/v1/routes/hotel.route');
const amenityRoutes = require('./src/api/v1/routes/amenity.route');
const roomRoutes = require('./src/api/v1/routes/room.routes'); 
const roomTypeRoutes = require('./src/api/v1/routes/roomType.routes');
const roomTypeImageRoutes = require('./src/api/v1/routes/roomTypeImage.route');
const roomAssignmentRoutes = require('./src/api/v1/routes/roomAssignment.route');
const contractRoutes = require('./src/api/v1/routes/contract.route');
const bookingRoutes = require('./src/api/v1/routes/booking.route');
const bookingDetailRoutes = require('./src/api/v1/routes/bookingDetail.route'); 
const seasonRoutes = require('./src/api/v1/routes/season.route');
const seasonalPricingRoutes = require('./src/api/v1/routes/seasonalPricing.route');
const touristLocationRoutes = require('./src/api/v1/routes/touristLocation.route');
const reviewRoutes = require('./src/api/v1/routes/review.route');
const promotionRoutes = require('./src/api/v1/routes/promotion.route');
const foodRecommendationRoutes = require('./src/api/v1/routes/foodRecommendation.route');
const reviewImageRoutes = require('./src/api/v1/routes/reviewImage.route');
const hotelStaffRoutes = require('./src/api/v1/routes/hotelStaff.route');
const hotelImageRoutes = require('./src/api/v1/routes/hotelImage.route');
const blogCommentRoutes = require('./src/api/v1/routes/blogComment.route');
const blogImageRoutes = require('./src/api/v1/routes/blogImage.route');
const blogLikeRoutes = require('./src/api/v1/routes/blogLike.route');
const blogRoutes = require('./src/api/v1/routes/blog.route');
const chatRoutes = require('./src/api/v1/routes/chat.route');
const roleRoutes = require('./src/api/v1/routes/role.route');
// --- Khởi tạo ứng dụng Express ---
const app = express();
const port = process.env.PORT || 8080;

// --- Middlewares ---
app.use(cors({
  origin: 'http://localhost:3000', // Chỉ cho phép frontend của bạn truy cập
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'] // Quan trọng: Cho phép header Authorization
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- API Documentation Route ---
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));

// --- API Routes ---
// Gắn các route vào đường dẫn tương ứng
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/hotels', hotelRoutes);
app.use('/api/v1/amenities', amenityRoutes);
app.use('/api/v1/rooms', roomRoutes);
app.use('/api/v1/assignments', roomAssignmentRoutes);
app.use('/api/v1/contracts', contractRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/booking-details', bookingDetailRoutes); 
app.use('/api/v1/seasons', seasonRoutes);
app.use('/api/v1/seasonal-pricings', seasonalPricingRoutes);
app.use('/api/v1/tourist-locations', touristLocationRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/promotions', promotionRoutes);
app.use('/api/v1/food-recommendations', foodRecommendationRoutes);
app.use('/api/v1/blogs', blogRoutes);
app.use('/api/v1/chats', chatRoutes);
app.use('/api/v1/roles', roleRoutes);
app.use('/api/v1/room-types', roomTypeRoutes);
// Các route có cấu trúc đặc biệt hơn
app.use('/api/v1', roomTypeImageRoutes);
app.use('/api/v1', reviewImageRoutes);
app.use('/api/v1', hotelImageRoutes);
app.use('/api/v1', hotelStaffRoutes);
app.use('/api/v1', blogCommentRoutes);
app.use('/api/v1', blogImageRoutes);
app.use('/api/v1', blogLikeRoutes);
// --- Khởi động Server ---
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, async () => {
    console.log(`🚀 Server is listening at http://localhost:${port}`);
    console.log(`📚 API documentation available at http://localhost:${port}/api-docs`);
    try {
      const client = await pool.connect();
      console.log('✅ Database connected successfully!');
      client.release();
    } catch (error) {
      console.error('❌ Failed to connect to the database:', error.message);
    }
  });
}

module.exports = app;
