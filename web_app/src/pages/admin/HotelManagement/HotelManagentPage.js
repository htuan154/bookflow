// src/pages/admin/HotelManagement/HotelManagementPage.js
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';

const HotelManagementPage = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        approved: 0,
        pending: 0,
        rejected: 0,
        total: 0
    });

    // Mock data - thay thế bằng API call thực tế
    useEffect(() => {
        // Giả lập API call để lấy thống kê
        const fetchStats = async () => {
            try {
                // const response = await hotelAPI.getStats();
                // Mock data
                setStats({
                    approved: 45,
                    pending: 12,
                    rejected: 8,
                    total: 65
                });
            } catch (error) {
                console.error('Error fetching hotel stats:', error);
            }
        };

        fetchStats();
    }, []);

    const navigateToApproved = () => {
        navigate('/hotels/admin/approved');
    };

    const navigateToPending = () => {
        navigate('/hotels/admin/pending');
    };

    const navigateToAll = () => {
        navigate('/hotels/admin/all');
    };

    return (
        <>
            <Helmet>
                <title>Quản Lý Khách Sạn - Quản Trị Viên</title>
                <meta 
                    name="description" 
                    content="Trang quản lý tổng hợp tất cả khách sạn trong hệ thống" 
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
                                                Quản lý khách sạn
                                            </span>
                                        </div>
                                    </li>
                                </ol>
                            </nav>
                            
                            <div className="mt-4">
                                <h1 className="text-3xl font-bold text-gray-900">
                                    Quản Lý Khách Sạn
                                </h1>
                                <p className="mt-2 text-sm text-gray-600">
                                    Tổng quan và quản lý tất cả khách sạn trong hệ thống
                                </p>
                            </div>
                        </div>

                        {/* Stats Overview */}
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                            {/* Total Hotels */}
                            <div className="bg-white overflow-hidden shadow rounded-lg">
                                <div className="p-5">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <div className="w-8 h-8 bg-indigo-100 rounded-md flex items-center justify-center">
                                                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 truncate">
                                                    Tổng khách sạn
                                                </dt>
                                                <dd className="text-lg font-medium text-gray-900">
                                                    {stats.total}
                                                </dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Approved Hotels */}
                            <div className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-lg transition-shadow duration-200" onClick={navigateToApproved}>
                                <div className="p-5">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 truncate">
                                                    Đã duyệt
                                                </dt>
                                                <dd className="text-lg font-medium text-gray-900">
                                                    {stats.approved}
                                                </dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Pending Hotels */}
                            <div className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-lg transition-shadow duration-200" onClick={navigateToPending}>
                                <div className="p-5">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                                                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 truncate">
                                                    Chờ duyệt
                                                </dt>
                                                <dd className="text-lg font-medium text-gray-900">
                                                    {stats.pending}
                                                </dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Rejected Hotels */}
                            <div className="bg-white overflow-hidden shadow rounded-lg">
                                <div className="p-5">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <div className="w-8 h-8 bg-red-100 rounded-md flex items-center justify-center">
                                                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 truncate">
                                                    Đã từ chối
                                                </dt>
                                                <dd className="text-lg font-medium text-gray-900">
                                                    {stats.rejected}
                                                </dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white shadow rounded-lg mb-8">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                    Thao tác nhanh
                                </h3>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {/* Approved Hotels Button */}
                                    <button 
                                        onClick={navigateToApproved}
                                        className="relative group bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
                                    >
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-md flex items-center justify-center">
                                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <h4 className="text-lg font-medium text-white">Khách sạn đã duyệt</h4>
                                                <p className="text-green-100 text-sm">Xem danh sách khách sạn hoạt động</p>
                                            </div>
                                        </div>
                                        <div className="mt-3 text-right">
                                            <span className="text-2xl font-bold text-white">{stats.approved}</span>
                                        </div>
                                    </button>

                                    {/* Pending Hotels Button */}
                                    <button 
                                        onClick={navigateToPending}
                                        className="relative group bg-gradient-to-r from-yellow-500 to-yellow-600 p-6 rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
                                    >
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-md flex items-center justify-center">
                                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <h4 className="text-lg font-medium text-white">Chờ duyệt & từ chối</h4>
                                                <p className="text-yellow-100 text-sm">Quản lý khách sạn cần xử lý</p>
                                            </div>
                                        </div>
                                        <div className="mt-3 text-right">
                                            <span className="text-2xl font-bold text-white">{stats.pending + stats.rejected}</span>
                                        </div>
                                    </button>

                                    {/* All Hotels Button */}
                                    <button 
                                        onClick={navigateToAll}
                                        className="relative group bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
                                    >
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-md flex items-center justify-center">
                                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <h4 className="text-lg font-medium text-white">Tất cả khách sạn</h4>
                                                <p className="text-blue-100 text-sm">Xem toàn bộ danh sách</p>
                                            </div>
                                        </div>
                                        <div className="mt-3 text-right">
                                            <span className="text-2xl font-bold text-white">{stats.total}</span>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activities */}
                        <div className="bg-white shadow rounded-lg mb-8">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                    Hoạt động gần đây
                                </h3>
                                <div className="flow-root">
                                    <ul className="-mb-8">
                                        <li>
                                            <div className="relative pb-8">
                                                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                                                <div className="relative flex space-x-3">
                                                    <div>
                                                        <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
                                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        </span>
                                                    </div>
                                                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                                        <div>
                                                            <p className="text-sm text-gray-500">Đã duyệt khách sạn <span className="font-medium text-gray-900">Sunset Hotel Nha Trang</span></p>
                                                        </div>
                                                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                                            <time dateTime="2025-01-29">2 giờ trước</time>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                        <li>
                                            <div className="relative pb-8">
                                                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                                                <div className="relative flex space-x-3">
                                                    <div>
                                                        <span className="h-8 w-8 rounded-full bg-yellow-500 flex items-center justify-center ring-8 ring-white">
                                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                        </span>
                                                    </div>
                                                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                                        <div>
                                                            <p className="text-sm text-gray-500">Khách sạn mới chờ duyệt <span className="font-medium text-gray-900">Ocean View Resort</span></p>
                                                        </div>
                                                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                                            <time dateTime="2025-01-29">4 giờ trước</time>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                        <li>
                                            <div className="relative">
                                                <div className="relative flex space-x-3">
                                                    <div>
                                                        <span className="h-8 w-8 rounded-full bg-red-500 flex items-center justify-center ring-8 ring-white">
                                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </span>
                                                    </div>
                                                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                                        <div>
                                                            <p className="text-sm text-gray-500">Từ chối khách sạn <span className="font-medium text-gray-900">ABC Hotel</span> - thiếu giấy phép</p>
                                                        </div>
                                                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                                            <time dateTime="2025-01-29">6 giờ trước</time>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Additional Actions */}
                        <div className="bg-white shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                    Công cụ quản lý
                                </h3>
                                <div className="flex flex-wrap gap-3">
                                    <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Xuất báo cáo
                                    </button>
                                    <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        Cài đặt hệ thống
                                    </button>
                                    <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Đồng bộ dữ liệu
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default HotelManagementPage;