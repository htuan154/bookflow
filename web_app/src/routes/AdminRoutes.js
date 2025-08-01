// src/routes/AdminRoutes.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import useAuth from '../hooks/useAuth';
import { USER_ROLES } from '../config/roles';

// Layout
import AdminLayout from '../components/layout/admin/AdminLayout';

// Pages
import AdminWelcomePage from '../pages/admin/AdminWelcomePage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import UserListPage from '../pages/admin/UserManagementPage/UserListPage';

// Hotel Management Pages

import HotelManagementPage from '../pages/admin/HotelManagement/HotelManagentPage';
import ApprovedHotelsPage from '../pages/admin/HotelManagement/ApprovedHotelsPage';
import PendingApprovalPage from '../pages/admin/HotelManagement/PendingApprovalPage';
// import AllHotelsPage from '../pages/admin/HotelManagement/AllHotelsPage'; // Tạo thêm nếu cần

import ContractListPage from '../pages/admin/ContractManagement/ContractListPage';
import PromotionManagementPage from '../pages/admin/PromotionManagementPage/PromotionManagementPage';

// Context Providers
import { UserProvider } from '../context/UserContext';
import { HotelProvider } from '../context/HotelContext';
import { ContractProvider } from '../context/ContractContext';

const AdminRoutes = () => {
    const { isAuthenticated, user } = useAuth();

    // Nếu chưa đăng nhập, chuyển hướng đến trang đăng nhập
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Nếu không phải admin, chuyển hướng đến trang không có quyền
    if (user?.roleId !== USER_ROLES.ADMIN) {
        return <Navigate to="/unauthorized" replace />;
    }

    return (
        <Routes>
            <Route element={<AdminLayout />}>
                <Route index element={<AdminWelcomePage />} />
                <Route path="dashboard" element={<AdminDashboardPage />} />

                <Route
                    path="users"
                    element={
                        <UserProvider>
                            <UserListPage />
                        </UserProvider>
                    }
                />

                {/* Hotel Management Routes */}
                {/* Main hotel management page - trang tổng hợp */}
                <Route
                    path="hotels"
                    element={
                        <HotelProvider>
                            <HotelManagementPage />
                        </HotelProvider>
                    }
                />

                {/* Approved hotels page */}
                <Route
                    path="hotels/admin/approved"
                    element={
                        <HotelProvider>
                            <ApprovedHotelsPage />
                        </HotelProvider>
                    }
                />

                {/* Pending & rejected hotels page */}
                <Route
                    path="hotels/admin/pending"
                    element={
                        <HotelProvider>
                            <PendingApprovalPage />
                        </HotelProvider>
                    }
                />

                {/* All hotels page - có thể tạo thêm */}
                {/* <Route
                    path="hotels/admin/all"
                    element={
                        <HotelProvider>
                            <AllHotelsPage />
                        </HotelProvider>
                    }
                /> */}

                {/* Legacy routes for backward compatibility */}
                <Route
                    path="partners"
                    element={
                        <HotelProvider>
                            <PendingApprovalPage />
                        </HotelProvider>
                    }
                />

                <Route
                    path="hotels/approved"
                    element={
                        <Navigate to="/hotels/admin/approved" replace />
                    }
                />

                <Route
                    path="hotels/pending"
                    element={
                        <Navigate to="/hotels/admin/admin/pending" replace />
                    }
                />

                <Route
                    path="contracts"
                    element={
                        <HotelProvider>
                            <ContractProvider> 
                                <ContractListPage />
                            </ContractProvider>
                        </HotelProvider>
                        // <HotelProvider>
                        //     <ContractListPage />
                        // </HotelProvider>
                    }
                />

                <Route
                    path="promotions"
                    element={<PromotionManagementPage />}
                />
            </Route>
        </Routes>
    );
};

export default AdminRoutes;