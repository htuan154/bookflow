// src/hooks/useAuth.js
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const useAuth = () => {
    const context = useContext(AuthContext);
    
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    const { isAuthenticated, user, login, logout, loading } = context;

    const handleLogout = () => {
        logout(); 
        window.location.href = '/';
    };

    return {
        isAuthenticated,
        user,
        login,
        logout,
        handleLogout,
        isLoading: loading,
    };
};

export default useAuth;

