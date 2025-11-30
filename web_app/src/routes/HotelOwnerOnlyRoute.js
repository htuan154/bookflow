// src/routes/HotelOwnerOnlyRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { USER_ROLES } from '../config/roles';

/**
 * Component bảo vệ route: chỉ cho phép HOTEL_OWNER, không cho phép HOTEL_STAFF
 */
const HotelOwnerOnlyRoute = () => {
    const { user } = useAuth();

    // Debug logs
    console.log('[HotelOwnerOnlyRoute] user:', user);
    console.log('[HotelOwnerOnlyRoute] user.roleId:', user?.roleId);
    console.log('[HotelOwnerOnlyRoute] HOTEL_STAFF role:', USER_ROLES.HOTEL_STAFF);

    // Nếu là HOTEL_STAFF thì chuyển về unauthorized
    if (user?.roleId === USER_ROLES.HOTEL_STAFF) {
        console.log('[HotelOwnerOnlyRoute] Blocking HOTEL_STAFF - redirecting to unauthorized');
        return <Navigate to="/unauthorized" replace />;
    }

    // Nếu là HOTEL_OWNER thì cho phép truy cập
    console.log('[HotelOwnerOnlyRoute] Access granted');
    return <Outlet />;
};

export default HotelOwnerOnlyRoute;
