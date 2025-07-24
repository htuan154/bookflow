// src/routes/AdminRoutes.js
import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AdminWelcomePage from '../pages/admin/AdminWelcomePage';
import { USER_ROLES } from '../constants/roles';
const AdminRoutes = () => {
    const { isAuthenticated, user } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (user?.roleId !== USER_ROLES.ADMIN) {
        return <Navigate to="/unauthorized" replace />;
    }



    return (
        <Routes>
            <Route path="/" element={<AdminWelcomePage />} />
            <Route path="/dashboard" element={<AdminDashboardPage />} />
        </Routes>
    );
};

export default AdminRoutes;
