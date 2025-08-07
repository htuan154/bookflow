// src/routes/AppRoutes.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import AuthPage from '../pages/shared/AuthPage';
import AdminRoutes from './AdminRoutes';
import HomeRedirect from '../pages/shared/HomeRedirect';
import HotelOwnerRoutes from './HotelOwnerRouters';
import NotFoundPage from '../pages/shared/NotFoundPage';
import UnauthorizedPage from '../pages/shared/UnauthorizedPage';

import GuestHomePage from '../pages/guest/GuestHomePage';

const AppRoutes = () => {
    const { isAuthenticated } = useAuth();

    return (
        <Routes>
            {/* Route công khai */}
            <Route path="/login" element={!isAuthenticated ? <AuthPage /> : <Navigate to="/" />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Trang chủ điều hướng */}
            <Route path="/" element={isAuthenticated ? <HomeRedirect /> : <GuestHomePage />} />

            {/* Protected routes - chỉ khi đã đăng nhập */}
            {isAuthenticated && (
                <>
                    <Route path="/admin/*" element={<AdminRoutes />} />
                    <Route path="/hotel-owner/*" element={<HotelOwnerRoutes />} />
                </>
            )}

            {/* Redirect chưa đăng nhập về login */}
            {!isAuthenticated && (
                <>
                    <Route path="/admin/*" element={<Navigate to="/login" />} />
                    <Route path="/hotel-owner/*" element={<Navigate to="/login" />} />
                </>
            )}

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
};

export default AppRoutes;
