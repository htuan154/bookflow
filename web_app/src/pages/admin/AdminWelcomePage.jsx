// src/pages/admin/AdminWelcomePage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const AdminWelcomePage = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();          // gọi hàm logout từ context
    navigate('/login'); // chuyển hướng về trang đăng nhập
  };

  return (
    <div className="p-6 text-center">
      <h1 className="text-3xl font-bold text-blue-600">Chào mừng đến trang quản trị!</h1>
      <p className="mt-4 text-lg text-gray-700">Bạn đã đăng nhập với quyền Admin.</p>

      <button
        onClick={handleLogout}
        className="mt-6 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition duration-300"
      >
        Đăng xuất
      </button>
    </div>
  );
};

export default AdminWelcomePage;
