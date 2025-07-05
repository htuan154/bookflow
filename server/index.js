// server/index.js

const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = require('./src/config/db');
const authRoutes = require('./src/api/v1/routes/auth.route');

// Import swagger JSON được tự động generate
const swaggerFile = require('./swagger.json');

// --- Khởi tạo ứng dụng Express ---
const app = express();
const port = process.env.PORT || 8080;

// --- Middlewares ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Swagger Documentation ---
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile, {
  explorer: true,
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin: 50px 0 }
    .swagger-ui .info .title { color: #3b82f6 }
  `,
  customSiteTitle: 'Bookflow API Docs'
}));

// --- Health Check Route ---
app.get('/', (req, res) => {
  /*  
    #swagger.tags = ['Health Check']
    #swagger.description = 'API health check endpoint'
    #swagger.responses[200] = {
      description: 'API is running successfully',
      schema: {
        status: 'success',
        message: 'Bookflow API is up and running!',
        timestamp: '2024-01-01T00:00:00.000Z',
        docs: '/api-docs'
      }
    }
  */
  res.status(200).json({
    status: 'success',
    message: 'Bookflow API is up and running!',
    timestamp: new Date().toISOString(),
    docs: '/api-docs'
  });
});

// --- API Routes ---
app.use('/api/v1/auth', authRoutes);

// --- Khởi động Server và Kiểm tra kết nối DB ---
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, async () => {
    console.log(`🚀 Server is listening at http://localhost:${port}`);
    console.log(`📚 API Documentation available at http://localhost:${port}/api-docs`);
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
