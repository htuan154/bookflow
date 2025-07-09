// server/index.js
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Import các module cho Swagger
const swaggerUi = require('swagger-ui-express');
const swaggerFile = require('./swagger-output.json'); 

const pool = require('./src/config/db');

// Import các file route
const authRoutes = require('./src/api/v1/routes/auth.route');
const hotelRoutes = require('./src/api/v1/routes/hotel.route'); 
const adminRouter = require('./src/api/v1/routes/admin.routes');
const roomTypeRouter = require('./src/api/v1/routes/roomType.routes');
const roomRouter = require('./src/api/v1/routes/room.routes');
// --- Khởi tạo ứng dụng Express ---
const app = express();
const port = process.env.PORT || 8080;

// --- Middlewares ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Health Check Route ---
app.get('/', (req, res) => {
  
  res.status(200).json({
    status: 'success',
    message: 'Bookflow API is up and running!',
    timestamp: new Date().toISOString(),
  });
});

// --- API Documentation Route ---
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));

// --- API Routes ---
// Gắn các route vào đường dẫn tương ứng
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/hotels', hotelRoutes); 
app.use('/api/v1/admin', adminRouter); 
app.use('/api/v1/roomtypes', roomTypeRouter);
app.use('/api/v1/rooms', roomRouter);
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
