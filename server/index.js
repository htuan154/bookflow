// server/index.js

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const swaggerUi = require('swagger-ui-express');
const swaggerFile = require('./swagger-output.json'); 

const pool = require('./src/config/db');

// Import các file route
const authRoutes = require('./src/api/v1/routes/auth.route');
const hotelRoutes = require('./src/api/v1/routes/hotel.route');
const amenityRoutes = require('./src/api/v1/routes/amenity.route');
const roomTypeImageRoutes = require('./src/api/v1/routes/roomTypeImage.route');
const roomAssignmentRoutes = require('./src/api/v1/routes/roomAssignment.route');
const contractRoutes = require('./src/api/v1/routes/contract.route');
const bookingRoutes = require('./src/api/v1/routes/booking.route');
// ... các route khác

// --- Khởi tạo ứng dụng Express ---
const app = express();
const port = process.env.PORT || 8080;

// --- Middlewares ---

// Cấu hình CORS chi tiết hơn
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
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/hotels', hotelRoutes);
app.use('/api/v1/amenities', amenityRoutes);
app.use('/api/v1', roomTypeImageRoutes);
app.use('/api/v1/assignments', roomAssignmentRoutes);
app.use('/api/v1/contracts', contractRoutes);
app.use('/api/v1/bookings', bookingRoutes);
// ...

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
