// src/routes/AdminRoutes.js
import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import NotFoundPage from '../pages/shared/NotFoundPage';
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

// Blog Management Pages
import CreateBlogPage from '../pages/admin/BlogManagement/CreateBlogPage';
import EditBlogPage from '../pages/admin/BlogManagement/EditBlogPage';
import BlogDetailPage from '../pages/admin/BlogManagement/BlogDetailPage';
import BlogManagementPage from '../pages/admin/BlogManagement/BlogManagementPage';
import BlogListPage from '../pages/admin/BlogManagement/BlogListPage';
// import PublishedBlogsPage from '../pages/admin/BlogManagement/PublishedBlogsPage';
// import PendingBlogsPage from '../pages/admin/BlogManagement/PendingBlogsPage';
// import DraftBlogsPage from '../pages/admin/BlogManagement/DraftBlogsPage';
import AdminSuggestionsPage from '../pages/admin/ChatBotAi/AdminSuggestionsPage';
import ContractListPage from '../pages/admin/ContractManagement/ContractListPage';


import CustomerManagement from '../pages/admin/CustomerManagement/CustomerManagement';
import CommentManagementPage from '../pages/admin/CommentManagement/CommentManagementPage';

// Context Providers
import { UserProvider } from '../context/UserContext';
import { HotelProvider } from '../context/HotelContext';
import { ContractProvider } from '../context/ContractContext';
import { PromotionsProvider } from '../context/PromotionsContext';
import { BlogProvider } from '../context/BlogContext';
import { CustomerProvider }  from '../context/CustomerContext';
import { BlogCommentProvider } from '../context/BlogCommentContext'; // Thêm dòng này
import AdminMessagesPage from '../pages/admin/messages';
import { IMProvider } from '../context/IMContext';
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

                {/* Customer Management - BỔ SUNG */}
                <Route
                    path="customers"
                    element={
                        <CustomerProvider>
                            <CustomerManagement />
                        </CustomerProvider>
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

                {/* Blog Management - Articles */}
                <Route
                    path="blog-management"
                    element={
                        <BlogProvider>
                            <Outlet />
                        </BlogProvider>
                    }
                >
                    <Route index element={<BlogManagementPage />} />
                    <Route path="list" element={<BlogListPage />} />
                    <Route path="create" element={<CreateBlogPage />} />
                    <Route path="edit/:blogId" element={<EditBlogPage />} />
                    <Route path="view/:blogId" element={<BlogDetailPage />} />
                </Route>

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
                <Route
                    path="messages"
                    element={
                        <IMProvider>
                            <AdminMessagesPage />
                        </IMProvider>
                    }
                />

                {/* Comment Management */}
                <Route
                    path="comments"
                    element={
                        <BlogCommentProvider>
                            <CommentManagementPage />
                        </BlogCommentProvider>
                    }
                />
                <Route path="suggestions" element={<AdminSuggestionsPage />} />
                <Route path="*" element={<NotFoundPage />} />
            </Route>
        </Routes>
    );
};

export default AdminRoutes;