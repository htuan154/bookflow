// src/routes/AdminRoutes.js
import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';

import useAuth from '../hooks/useAuth';
import { USER_ROLES } from '../config/roles';

// Layout
import AdminLayout from '../components/layout/admin/AdminLayout';

// Pages
import AdminWelcomePage from '../pages/admin/AdminWelcomePage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import UserListPage from '../pages/admin/UserManagementPage/UserListPage';

import HotelManagementPage from '../pages/admin/HotelManagement/HotelManagentPage';
import ApprovedHotelsPage from '../pages/admin/HotelManagement/ApprovedHotelsPage';
import PendingApprovalPage from '../pages/admin/HotelManagement/PendingApprovalPage';

import ContractListPage from '../pages/admin/ContractManagement/ContractListPage';

// Context Providers
import { UserProvider } from '../context/UserContext';
import { HotelProvider } from '../context/HotelContext';
import { ContractProvider } from '../context/ContractContext';
import { PromotionsProvider } from '../context/PromotionsContext';

// Promotion pages
import {
    PromotionManagement,
    PromotionCreate,
    PromotionEdit,
    PromotionView,
    PromotionAnalytics
} from '../pages/admin/PromotionManagement';

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
            <Route element={<AdminLayout />}>
                <Route index element={<AdminWelcomePage />} />
                <Route path="dashboard" element={<AdminDashboardPage />} />

                {/* User Management */}
                <Route
                    path="users"
                    element={
                        <UserProvider>
                            <UserListPage />
                        </UserProvider>
                    }
                />

                {/* Hotel Management */}
                <Route
                    path="hotels"
                    element={
                        <HotelProvider>
                            <HotelManagementPage />
                        </HotelProvider>
                    }
                />
                <Route
                    path="hotels/admin/approved"
                    element={
                        <HotelProvider>
                            <ApprovedHotelsPage />
                        </HotelProvider>
                    }
                />
                <Route
                    path="hotels/admin/pending"
                    element={
                        <HotelProvider>
                            <PendingApprovalPage />
                        </HotelProvider>
                    }
                />

                {/* Legacy route redirects */}
                <Route
                    path="hotels/approved"
                    element={<Navigate to="/hotels/admin/approved" replace />}
                />
                <Route
                    path="hotels/pending"
                    element={<Navigate to="/hotels/admin/pending" replace />}
                />

                {/* Partner Route (Pending) */}
                <Route
                    path="partners"
                    element={
                        <HotelProvider>
                            <PendingApprovalPage />
                        </HotelProvider>
                    }
                />

                {/* Contract Management */}
                <Route
                    path="contracts"
                    element={
                        <HotelProvider>
                            <ContractProvider>
                                <ContractListPage />
                            </ContractProvider>
                        </HotelProvider>
                    }
                />

                {/* Promotion Management */}
                <Route
                    path="promotions"
                    element={
                        <PromotionsProvider>
                            <Outlet />
                        </PromotionsProvider>
                    }
                >
                    <Route index element={<PromotionManagement />} />
                    <Route path="create" element={<PromotionCreate />} />
                    <Route path="edit/:id" element={<PromotionEdit />} />
                    <Route path="view/:id" element={<PromotionView />} />
                    <Route path="analytics" element={<PromotionAnalytics />} />
                </Route>
            </Route>
        </Routes>
    );
};

export default AdminRoutes;
