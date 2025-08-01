// src/pages/admin/HotelManagement/ApprovedHotelsPage.js
import React from 'react';
import { Helmet } from 'react-helmet-async';
//import  ApprovedHotelsList from '../../../components/hotel/ApprovedHotelsList';
import ApprovedHotelsList from '../../../components/hotel/ApprovedHotelList';
const ApprovedHotelsPage = () => {
    return (
        <>
            <Helmet>
                <title>Khách Sạn Đã Duyệt - Quản Trị Viên</title>
                <meta 
                    name="description" 
                    content="Quản lý danh sách khách sạn đã được duyệt trong hệ thống" 
                />
            </Helmet>

            <div className="min-h-screen bg-gray-50">
                <div className="py-6">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {/* Header */}
                        <div className="mb-8">
                            <nav className="flex" aria-label="Breadcrumb">
                                <ol className="flex items-center space-x-4">
                                    <li>
                                        <div>
                                            <a href="/admin" className="text-gray-400 hover:text-gray-500">
                                                Dashboard
                                            </a>
                                        </div>
                                    </li>
                                    <li>
                                        <div className="flex items-center">
                                            <svg
                                                className="flex-shrink-0 h-5 w-5 text-gray-300"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                                aria-hidden="true"
                                            >
                                                <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                                            </svg>
                                            <a href="/admin/partners" className="ml-4 text-gray-400 hover:text-gray-500">
                                                Quản lý đối tác
                                            </a>
                                        </div>
                                    </li>
                                    <li>
                                        <div className="flex items-center">
                                            <svg
                                                className="flex-shrink-0 h-5 w-5 text-gray-300"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                                aria-hidden="true"
                                            >
                                                <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                                            </svg>
                                            <span className="ml-4 text-sm font-medium text-gray-500">
                                                Khách sạn đã duyệt
                                            </span>
                                        </div>
                                    </li>
                                </ol>
                            </nav>
                            
                            <div className="mt-4">
                                <h1 className="text-3xl font-bold text-gray-900">
                                    Khách Sạn Đã Duyệt
                                </h1>
                                <p className="mt-2 text-sm text-gray-600">
                                    Danh sách tất cả khách sạn đã được duyệt và đang hoạt động trong hệ thống
                                </p>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="space-y-6">
                            <ApprovedHotelsList />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ApprovedHotelsPage;