// src/routes/AppRoutes.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { USER_ROLES } from '../constants/roles';
import AdminLayout from '../components/layout/AdminLayout';
import ProtectedRoute from './ProtectedRoute';
import AuthPage from '../pages/AuthPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AdminWelcomePage from '../pages/admin/AdminWelcomePage';

const HomeRedirect = () => {
    const { user } = useAuth();
    if (user?.roleId === USER_ROLES.ADMIN) {
        return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/login" replace />;
};

const AppRoutes = () => {
    const { isAuthenticated } = useAuth();

    return (
        <Routes>
            {/* Route công khai */}
            <Route path="/login" element={!isAuthenticated ? <AuthPage /> : <Navigate to="/" />} />
            <Route path="/unauthorized" element={<div><h1>403 - Unauthorized</h1><p>Bạn không có quyền truy cập trang này.</p></div>} />

            {/* Trang chủ điều hướng theo vai trò */}
            <Route path="/" element={isAuthenticated ? <HomeRedirect /> : <Navigate to="/login" />} />

            {/* Route dành cho Admin */}
            <Route 
                path="/admin"
                element={
                    <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                        <AdminLayout />
                    </ProtectedRoute>
                }
            >
                {/* Trang chào mừng tại /admin */}
                <Route index element={<AdminWelcomePage />} />
                {/* Dashboard riêng nếu cần */}
                <Route path="dashboard" element={<AdminDashboardPage />} />
                {/* Có thể thêm các route khác tại đây */}
            </Route>

            {/* Route mặc định nếu không khớp */}
            <Route path="*" element={<div><h1>404 - Not Found</h1></div>} />
        </Routes>
    );
};

export default AppRoutes;
