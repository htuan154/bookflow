// // src/routes/AdminRoutes.js
// import React from 'react';
// import { Routes, Route, Navigate } from 'react-router-dom';
// import useAuth from '../hooks/useAuth';
// import AdminLayout from '../components/layout/admin/AdminLayout'; // Import AdminLayout
// import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
// import AdminWelcomePage from '../pages/admin/AdminWelcomePage';
// import { USER_ROLES } from '../config/roles';

// const AdminRoutes = () => {
//     const { isAuthenticated, user } = useAuth();

//     if (!isAuthenticated) {
//         return <Navigate to="/login" replace />;
//     }

//     if (user?.roleId !== USER_ROLES.ADMIN) {
//         return <Navigate to="/unauthorized" replace />;
//     }

//     return (
//         <AdminLayout>
//             <Routes>
//                 <Route path="/" element={<AdminWelcomePage />} />
//                 <Route path="/dashboard" element={<AdminDashboardPage />} />
//             </Routes>
//         </AdminLayout>
//     );
// };

// export default AdminRoutes;
// src/routes/AdminRoutes.js
import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import AdminLayout from '../components/layout/admin/AdminLayout';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AdminWelcomePage from '../pages/admin/AdminWelcomePage';
import UserListPage from '../pages/admin/UserManagementPage/UserListPage';
import HotelListPage from '../pages/admin/HotelManagement/HotelListPage';

import { UserProvider } from '../context/UserContext';
import { HotelProvider } from '../context/HotelContext';
import { USER_ROLES } from '../config/roles';

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
                <Route
                    path="users"
                    element={
                        <UserProvider>
                            <UserListPage />
                        </UserProvider>
                    }
                />
                <Route
                    path="partners"
                    element={
                        <HotelProvider>
                            <HotelListPage />
                        </HotelProvider>
                    }
                />
            </Route>
        </Routes>
    );
};

export default AdminRoutes;