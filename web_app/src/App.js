import React, { useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import AuthPage from './pages/AuthPage';

// --- Placeholder Dashboards ---
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

// Component trung gian để định tuyến đúng sau đăng nhập
const RedirectAfterLogin = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.roleId === 1) navigate('/admin', { replace: true });
      else if (user.roleId === 2) navigate('/hotel-owner', { replace: true });
      else navigate('/', { replace: true }); // fallback nếu role không hợp lệ
    }
  }, [user, navigate]);

  return null;
};

// Component chính của App khi đã có Router
const AppRoutes = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <Routes>
      {/* Nếu chưa đăng nhập, chỉ cho truy cập AuthPage */}
      {!user ? (
        <Route path="/*" element={<AuthPage />} />
      ) : (
        <>
          <Route path="/" element={<RedirectAfterLogin />} />
          <Route path="/admin" element={<AdminDashboard user={user} onLogout={logout} />} />
          <Route path="/hotel-owner" element={<HotelOwnerDashboard user={user} onLogout={logout} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      )}
    </Routes>
  );
};

// App chính: Bọc Router và AuthProvider
const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;
