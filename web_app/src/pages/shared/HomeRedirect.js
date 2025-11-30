// src/pages/HomeRedirect.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { USER_ROLES } from '../../config/roles';

const HomeRedirect = () => {
    const { isAuthenticated, user } = useAuth();

    // Debug: Log user info
    console.log('[HomeRedirect] isAuthenticated:', isAuthenticated);
    console.log('[HomeRedirect] user:', user);
    console.log('[HomeRedirect] user.roleId:', user?.roleId);

    if (!isAuthenticated) {

        return <Navigate to="/login" replace />;
    }

    if (user?.roleId === USER_ROLES.ADMIN) {

        return <Navigate to="/admin" replace />;
    }
    
    if (user?.roleId === USER_ROLES.HOTEL_OWNER) {

        return <Navigate to="/hotel-owner" replace />;
    }

    // Hotel staff should also access hotel-owner routes
    if (user?.roleId === USER_ROLES.HOTEL_STAFF) {

        return <Navigate to="/hotel-owner" replace />;
    }

    if (user?.roleId === USER_ROLES.USER) {

        return <Navigate to="/unauthorized" replace />;
    }

    return <Navigate to="/unauthorized" replace />;
};

export default HomeRedirect;
