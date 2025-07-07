// src/App.js
import React, { useContext } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import AuthPage from './pages/AuthPage';

// --- Placeholder Dashboards ---
// Đây là các trang giả lập, bạn sẽ xây dựng chúng sau này.
const AdminDashboard = ({ user, onLogout }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
    <h1 className="text-3xl font-bold">Admin Dashboard</h1>
    <p className="mt-2">Chào mừng, {user.fullName || 'Admin'}!</p>
    <button onClick={onLogout} className="mt-6 px-4 py-2 bg-red-500 text-white rounded">Đăng xuất</button>
  </div>
);

const HotelOwnerDashboard = ({ user, onLogout }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
    <h1 className="text-3xl font-bold">Hotel Owner Dashboard</h1>
    <p className="mt-2">Chào mừng, {user.fullName || 'Chủ khách sạn'}!</p>
    <button onClick={onLogout} className="mt-6 px-4 py-2 bg-red-500 text-white rounded">Đăng xuất</button>
  </div>
);

// Component này sẽ quyết định hiển thị trang nào dựa trên trạng thái đăng nhập và vai trò
const AppContent = () => {
  const { user, logout } = useContext(AuthContext);

  // Nếu người dùng đã đăng nhập
  if (user) {
    // Dựa vào roleId để hiển thị dashboard tương ứng
    // Giả sử: roleId = 1 là Admin, roleId = 2 là HotelOwner
    switch (user.roleId) {
      case 1:
        return <AdminDashboard user={user} onLogout={logout} />;
      case 2:
        return <HotelOwnerDashboard user={user} onLogout={logout} />;
      default:
        // Các vai trò khác (ví dụ: Customer) sẽ quay về trang đăng nhập
        // Hoặc bạn có thể tạo một trang riêng cho họ
        return <AuthPage />;
    }
  }

  // Nếu chưa đăng nhập, luôn hiển thị trang AuthPage
  return <AuthPage />;
};



const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
