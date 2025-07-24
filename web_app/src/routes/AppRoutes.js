// src/routes/AppRoutes.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import AuthPage from '../pages/AuthPage';
import AdminRoutes from './AdminRoutes';
import HomeRedirect from '../pages/HomeRedirect'; // ✅ Dùng file HomeRedirect đã tạo

const AppRoutes = () => {
    const { isAuthenticated } = useAuth();

    return (
        <Routes>
            {/* Route công khai */}
            <Route path="/login" element={!isAuthenticated ? <AuthPage /> : <Navigate to="/" />} />
            <Route path="/unauthorized" element={<div><h1>403 - Unauthorized</h1></div>} />

            {/* Trang chủ điều hướng */}
            <Route path="/" element={<HomeRedirect />} />

            {/* Admin routes */}
            <Route path="/admin/*" element={<AdminRoutes />} />

            {/* 404 */}
            <Route path="*" element={<div><h1>404 - Not Found</h1></div>} />
        </Routes>
    );
};

export default AppRoutes;
