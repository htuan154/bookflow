// src/api/v1/middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const protect = (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  // 1. Kiểm tra xem header 'Authorization' có tồn tại và bắt đầu bằng 'Bearer' không
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      // 2. Lấy token từ header (bỏ chữ 'Bearer ')
      token = authHeader.split(' ')[1];

      // 3. Xác thực token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. Gắn thông tin user đã được giải mã vào request để các hàm sau có thể dùng
      req.user = decoded; // Sẽ chứa { userId, roleId, ... }

      next(); // Cho phép đi tiếp
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };