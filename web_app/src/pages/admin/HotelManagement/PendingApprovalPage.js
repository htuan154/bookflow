// src/pages/admin/HotelManagement/PendingHotelsPage.js
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { hotelApiService } from '../../../api/hotel.service';
//import PendingHotelsList from '../../../components/hotel/PendingHotelsList';
import PendingHotelsList from '../../../components/hotel/PendingHotelList';

const PendingHotelsPage = () => {
    const [statusCounts, setStatusCounts] = useState({
        pending: 0,
        rejected: 0,
        approved: 0,
        active: 0,
        inactive: 0,
    });
    const [loading, setLoading] = useState(true);

    const fetchHotelStats = async () => {
        try {
            setLoading(true);
            const [pendingRes, rejectedRes, approvedRes, activeRes, inactiveRes] = await Promise.all([
                hotelApiService.getHotelsByStatus('pending'),
                hotelApiService.getHotelsByStatus('rejected'),
                hotelApiService.getHotelsByStatus('approved'),
                hotelApiService.getHotelsByStatus('active'),
                hotelApiService.getHotelsByStatus('inactive'),
            ]);

            setStatusCounts({
                pending: (pendingRes.data || []).length,
                rejected: (rejectedRes.data || []).length,
                approved: (approvedRes.data || []).length,
                active: (activeRes.data || []).length,
                inactive: (inactiveRes.data || []).length,
            });
        } catch (error) {
            console.error('Error fetching hotel stats:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHotelStats();
    }, []);
    return (
        <>
            <Helmet>
                <title>Khách Sạn Chờ Duyệt & Từ Chối - Quản Trị Viên</title>
                <meta 
                    name="description" 
                    content="Quản lý danh sách khách sạn chờ duyệt và bị từ chối trong hệ thống" 
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
                                                Khách sạn chờ duyệt & từ chối
                                            </span>
                                        </div>
                                    </li>
                                </ol>
                            </nav>
                            
                            <div className="mt-4">
                                <h1 className="text-3xl font-bold text-gray-900">
                                    Khách Sạn Chờ Duyệt & Từ Chối
                                </h1>
                                <p className="mt-2 text-sm text-gray-600">
                                    Quản lý các khách sạn đang chờ duyệt và các khách sạn đã bị từ chối
                                </p>
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                            {/* Chờ duyệt */}
                            <div className="bg-white overflow-hidden shadow rounded-lg">
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
                                                    {loading ? '--' : statusCounts.pending}
                                                </dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Đã từ chối */}
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
                                                    {loading ? '--' : statusCounts.rejected}
                                                </dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Tổng cần xử lý */}
                            <div className="bg-white overflow-hidden shadow rounded-lg">
                                <div className="p-5">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 truncate">
                                                    Tổng khách sạn
                                                </dt>
                                                <dd className="text-lg font-medium text-gray-900">
                                                    {loading ? '--' : (statusCounts.pending + statusCounts.rejected + statusCounts.approved + statusCounts.active + statusCounts.inactive)}
                                                </dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Đã duyệt */}
                            <div className="bg-white overflow-hidden shadow rounded-lg">
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
                                                    {loading ? '--' : statusCounts.approved}
                                                </dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Đang hoạt động */}
                            <div className="bg-white overflow-hidden shadow rounded-lg">
                                <div className="p-5">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <div className="w-8 h-8 bg-teal-100 rounded-md flex items-center justify-center">
                                                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2l4-4" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 truncate">
                                                    Đang hoạt động
                                                </dt>
                                                <dd className="text-lg font-medium text-gray-900">
                                                    {loading ? '--' : statusCounts.active}
                                                </dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Ngừng hoạt động */}
                            <div className="bg-white overflow-hidden shadow rounded-lg">
                                <div className="p-5">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <div className="w-8 h-8 bg-gray-200 rounded-md flex items-center justify-center">
                                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728M5.636 5.636l12.728 12.728" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 truncate">
                                                    Ngừng hoạt động
                                                </dt>
                                                <dd className="text-lg font-medium text-gray-900">
                                                    {loading ? '--' : statusCounts.inactive}
                                                </dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        {/* <div className="bg-white shadow rounded-lg mb-8">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                    Thao tác nhanh
                                </h3>
                                <div className="flex flex-wrap gap-3">
                                    <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Duyệt tất cả chờ duyệt
                                    </button>
                                    <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Xuất danh sách
                                    </button>
                                    <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Làm mới dữ liệu
                                    </button>
                                </div>
                            </div>
                        </div> */}

                        {/* Main Content */}
                        <div className="space-y-6">
                            <PendingHotelsList onStatsRefresh={fetchHotelStats} />
                        </div>

                        {/* Footer Info */}
                        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-blue-800">
                                        Lưu ý quan trọng
                                    </h3>
                                    <div className="mt-2 text-sm text-blue-700">
                                        <ul className="list-disc pl-5 space-y-1">
                                            <li>Kiểm tra kỹ thông tin khách sạn trước khi duyệt</li>
                                            <li>Cung cấp lý do rõ ràng khi từ chối để đối tác có thể chỉnh sửa</li>
                                            <li>Khách sạn bị từ chối có thể được khôi phục và duyệt lại</li>
                                            <li>Thông báo sẽ được gửi tự động đến chủ khách sạn khi có thay đổi trạng thái</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PendingHotelsPage;