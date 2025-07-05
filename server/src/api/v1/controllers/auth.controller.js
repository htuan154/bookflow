// src/api/v1/controllers/auth.controller.js
const authService = require('../services/auth.service');

const handleRegister = async (req, res) => {
  try {
    const newUser = await authService.registerUser(req.body);
    res.status(201).json({
      status: 'success',
      message: 'User registered successfully!',
      data: { user: newUser.toJSON() },
    });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

const handleLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);
    res.status(200).json({
      status: 'success',
      message: 'Login successful!',
      data: result,
    });
  } catch (error) {
    res.status(401).json({ status: 'error', message: error.message });
  }
};

const getMyProfile = async (req, res) => {
  try {
    // Dùng userId từ token (do middleware 'protect' gắn vào) để lấy đúng profile
    const user = await authService.getUserProfile(req.user.userId);
    res.status(200).json({
      status: 'success',
      data: user.toJSON(),
    });
  } catch (error) {
    res.status(404).json({ status: 'error', message: error.message });
  }
};

const handleLogout = (req, res) => {
  res.status(200).json({ status: 'success', message: 'Logout successful' });
};

module.exports = {
  handleRegister,
  handleLogin,
  getMyProfile,
  handleLogout,
};
