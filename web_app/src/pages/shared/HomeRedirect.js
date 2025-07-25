// src/pages/HomeRedirect.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { USER_ROLES } from '../../config/roles';
const HomeRedirect = () => {
    const { isAuthenticated, user } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (user?.roleId === USER_ROLES.ADMIN) {
        return <Navigate to="/admin" replace />;
    }

    return <Navigate to="/unauthorized" replace />;
};

export default HomeRedirect;
