import React from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const UnauthorizedPage = () => {
    const { isAuthenticated, handleLogout } = useAuth();

    const handleLogoutAndRedirect = () => {
        if (handleLogout) {
            handleLogout();
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <div className="bg-orange-500 p-3 rounded-lg inline-block mb-4">
                        <span className="text-white text-2xl">🚫</span>
                    </div>
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Không có quyền truy cập
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Bạn không có quyền truy cập vào trang này
                    </p>
                    
                    <div className="mt-6 space-y-3">
                        {isAuthenticated ? (
                            <>
                                <button
                                    onClick={handleLogoutAndRedirect}
                                    className="w-full bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors"
                                >
                                    Đăng xuất và đăng nhập lại
                                </button>
                                <Link 
                                    to="/" 
                                    className="w-full inline-block bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    Về trang chủ
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link 
                                    to="/login" 
                                    className="w-full inline-block bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
                                >
                                    Đăng nhập
                                </Link>
                                <Link 
                                    to="/" 
                                    className="w-full inline-block bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    Về trang chủ
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UnauthorizedPage;