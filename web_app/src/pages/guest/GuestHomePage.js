import React from 'react';
import { Link } from 'react-router-dom';

const GuestHomePage = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="max-w-md w-full space-y-8 text-center">
                <div className="bg-orange-500 p-3 rounded-lg inline-block">
                    <span className="text-white text-4xl font-bold">📚</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900">BookFlow</h1>
                <p className="text-gray-600">Chào mừng đến với nền tảng đặt phòng khách sạn</p>
                
                <div className="space-y-4">
                    <Link 
                        to="/login" 
                        className="w-full bg-orange-500 text-white py-3 px-6 rounded-lg hover:bg-orange-600 transition-colors block"
                    >
                        Đăng nhập
                    </Link>
                    <p className="text-sm text-gray-500">
                        Đăng nhập để truy cập vào hệ thống quản lý
                    </p>
                </div>
            </div>
        </div>
    );
};

export default GuestHomePage;