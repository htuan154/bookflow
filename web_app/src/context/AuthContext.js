// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { authService } from '../api/auth.service';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = async () => {
            if (token) {
                try {
                    const decodedToken = jwtDecode(token);
                    
                    // Kiểm tra token hết hạn
                    if (decodedToken.exp * 1000 < Date.now()) {
                        logout();
                    } else {
                        // Lấy thông tin user từ API /profile
                        try {
                            const response = await authService.getProfile(token);
                            setUser(response.data.data);
                        } catch (error) {
                            console.error("Error fetching profile:", error);
                            logout();
                        }
                    }
                } catch (error) {
                    console.error("Invalid token:", error);
                    logout();
                }
            }
            setLoading(false);
        };

        initializeAuth();
    }, [token]);

    const login = (userData, userToken) => {
        localStorage.setItem('token', userToken);
        setToken(userToken);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            token, 
            login, 
            logout, 
            loading,
            isAuthenticated: !!user && !!token
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export { AuthContext, AuthProvider };