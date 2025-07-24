import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

/**
 * Component bảo vệ route: kiểm tra đăng nhập và vai trò
 */
const ProtectedRoute = ({ allowedRoles }) => {
    const { isAuthenticated, user } = useAuth();
    const location = useLocation();

    // 1. Chưa đăng nhập → chuyển về login
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 2. Kiểm tra roleId (dùng số)
    if (allowedRoles && !allowedRoles.includes(user.roleId)) {
        return <Navigate to="/unauthorized" replace />;
    }

    // 3. Hợp lệ → render các route con
    return <Outlet />;
};

export default ProtectedRoute;
