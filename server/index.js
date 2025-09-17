// server/index.js
'use strict';

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Mongo (chatbot) + middlewares AI
const { connectDB } = require('./src/config/mongodb');
const aiRoutes = require('./src/api/v1/routes/ai.routes');
const healthRoutes = require('./src/api/v1/routes/health.routes');
const { aiLimiter } = require('./src/api/v1/middlewares/rateLimit.middleware');
const errorHandler = require('./src/api/v1/middlewares/error.middleware');
const { initIM } = require('./src/im/bootstrap');
const imConversations = require('./src/api/v1/routes/conversations.route');
const imMessages      = require('./src/api/v1/routes/messages.route');
const imUploads       = require('./src/api/v1/routes/uploads.route');
const imStream        = require('./src/api/v1/routes/stream.route');
// Swagger
const swaggerUi = require('swagger-ui-express');
const swaggerFile = require('./swagger-output.json');

// Postgres (các module khác của bạn)
const pool = require('./src/config/db');

// Routes v1 hiện có
const authRoutes = require('./src/api/v1/routes/auth.route');
const userRoutes = require('./src/api/v1/routes/user.route');
const hotelRoutes = require('./src/api/v1/routes/hotel.route'); // ✅ Đúng tên file
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
const provincesRoutes = require('./src/api/v1/routes/provinces.routes');

// --- App ---
const app = express();
const port = process.env.PORT || 8080;

// --- Middlewares cơ bản ---
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Id', 'X-User-Id', 'Last-Event-ID','x-use-llm' ]
}));
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true }));
// Cho FE đọc header chẩn đoán
app.use((req, res, next) => {
  res.set('Access-Control-Expose-Headers', 'X-Source, X-Latency-ms');
  next();
});


// --- Swagger ---
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));

// --- API v1 (Postgres + các module sẵn có) ---
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
app.use('/api/v1/roomtypes', roomTypeRoutes);
// Các route có cấu trúc đặc biệt hơn
app.use('/api/v1', roomTypeImageRoutes);
app.use('/api/v1', reviewImageRoutes);
app.use('/api/v1', hotelImageRoutes);
app.use('/api/v1', hotelStaffRoutes);
app.use('/api/v1', blogCommentRoutes);
app.use('/api/v1', blogImageRoutes);
app.use('/api/v1', blogLikeRoutes);

// --- Chatbot (Mongo) ---
app.use('/ai', aiLimiter, aiRoutes);  // POST /ai/suggest
app.use('/ai', healthRoutes);         // GET  /ai/health
app.use('/provinces', provincesRoutes);
app.use('/api/v1/im', imConversations);
app.use('/api/v1/im', imMessages);
app.use('/api/v1/im', imUploads);
app.use('/api/v1/im', imStream);
// --- 404 chung ---
app.use((req, res) => {
  res.status(404).json({ success: false, code: 404, message: 'Not found' });
});
app.set('trust proxy', 1);
// --- Error handler cuối chuỗi ---
app.use(errorHandler);

// --- Bootstrap: kết nối Mongo, kiểm tra Postgres, rồi listen ---
if (process.env.NODE_ENV !== 'test') {
  (async () => {
    try {
      // 1) Mongo (cho chatbot)
      const db = await connectDB();
      app.locals.db = db;
      console.log('✅ MongoDB connected.');
      await initIM();
      // 2) Postgres (cho các module hiện hữu)
      try {
        const client = await pool.connect();
        console.log('✅ Postgres connected.');
        client.release();
      } catch (pgErr) {
        console.error('⚠️  Postgres connect failed:', pgErr.message);
      }

      // 3) Listen
      app.listen(port, () => {
        console.log(`🚀 Server is listening at http://localhost:${port}`);
        console.log(`📚 API docs: http://localhost:${port}/api-docs`);
      });
    } catch (err) {
      console.error('❌ Bootstrap failed:', err);
      process.exit(1);
    }
  })();
}

module.exports = app;
