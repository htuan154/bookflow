// src/components/hotel/HotelDataTable.js
import React, { useState } from 'react';
import useHotelStatus from '../../hooks/useHotelStatus';
import { toast } from 'react-toastify';
import { FaEye, FaCheck, FaTimes, FaUndo, FaStar, FaMapMarkerAlt, FaEnvelope, FaPhone } from 'react-icons/fa';

const HotelDataTable = ({ hotels, showActions = false, status }) => {
    const { approveHotel, rejectHotel, restoreHotel, loading } = useHotelStatus();
    const [processingId, setProcessingId] = useState(null);

    const handleApprove = async (hotelId) => {
        if (window.confirm('Bạn có chắc chắn muốn duyệt khách sạn này?')) {
            setProcessingId(hotelId);
            try {
                await approveHotel(hotelId);
                toast.success('Đã duyệt khách sạn thành công!');
            } catch (error) {
                toast.error('Có lỗi xảy ra khi duyệt khách sạn');
            } finally {
                setProcessingId(null);
            }
        }
    };

    const handleReject = async (hotelId) => {
        const reason = window.prompt('Vui lòng nhập lý do từ chối:');
        if (reason) {
            setProcessingId(hotelId);
            try {
                await rejectHotel(hotelId, reason);
                toast.success('Đã từ chối khách sạn thành công!');
            } catch (error) {
                toast.error('Có lỗi xảy ra khi từ chối khách sạn');
            } finally {
                setProcessingId(null);
            }
        }
    };

    const handleRestore = async (hotelId) => {
        if (window.confirm('Bạn có chắc chắn muốn khôi phục khách sạn này?')) {
            setProcessingId(hotelId);
            try {
                await restoreHotel(hotelId);
                toast.success('Đã khôi phục khách sạn thành công!');
            } catch (error) {
                toast.error('Có lỗi xảy ra khi khôi phục khách sạn');
            } finally {
                setProcessingId(null);
            }
        }
    };

    const getStatusBadge = (hotelStatus) => {
        const statusConfig = {
            'approved': { color: 'bg-green-100 text-green-800', text: 'Đã duyệt' },
            'pending': { color: 'bg-yellow-100 text-yellow-800', text: 'Chờ duyệt' },
            'rejected': { color: 'bg-red-100 text-red-800', text: 'Đã từ chối' }
        };

        const config = statusConfig[hotelStatus] || statusConfig['pending'];
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
                {config.text}
            </span>
        );
    };

    const formatDate = (dateString) => {
        // Debug log
        console.log('created_at:', dateString);
        console.log('Type of created_at:', typeof dateString);
        console.log('hotel:', hotels);

        if (!dateString || typeof dateString !== 'string' || dateString === 'null' || dateString === 'undefined') return 'N/A';

        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';

        return date.toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
            timeZone: 'Asia/Ho_Chi_Minh'
        });
    };


    const renderStarRating = (rating) => {
        const stars = [];
        const numRating = Number(rating) || 0;
        
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <FaStar
                    key={`star-${i}-${rating}`} // Sửa lại key cho duy nhất
                    className={`w-4 h-4 ${i <= numRating ? 'text-yellow-400' : 'text-gray-300'}`}
                />
            );
        }
        return <div className="flex">{stars}</div>;
    };

    if (!hotels || hotels.length === 0) {
        return (
            <div className="text-center py-8">
                <div className="text-gray-500 text-lg">Không có khách sạn nào</div>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Thông tin khách sạn
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Liên hệ
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Đánh giá
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Trạng thái
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ngày tạo
                        </th>
                        {showActions && (
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Thao tác
                            </th>
                        )}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {hotels.map((hotel) => (
                        <tr key={hotel.hotelId} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 h-12 w-12">
                                        <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                                            <span className="text-gray-500 font-semibold">
                                                {hotel.name?.charAt(0)?.toUpperCase() || 'H'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900">
                                            {hotel.name || 'N/A'}
                                        </div>
                                        <div className="text-sm text-gray-500 flex items-center">
                                            <FaMapMarkerAlt className="mr-1" />
                                            {hotel.city || 'N/A'}
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1">
                                            ID: {hotel.hotelId}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                    <div className="flex items-center mb-1">
                                        <FaEnvelope className="mr-2 text-gray-400" />
                                        <span>{hotel.email || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <FaPhone className="mr-2 text-gray-400" />
                                        <span>{hotel.phoneNumber || 'N/A'}</span>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    {renderStarRating(hotel.starRating)}
                                    <span className="ml-2 text-sm text-gray-600">
                                        ({hotel.starRating || 0})
                                    </span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {hotel.totalReviews || 0} đánh giá
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                {getStatusBadge(hotel.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(hotel.createdAt)}
                            </td>
                            {showActions && (
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex space-x-2">
                                        <button
                                            className="text-blue-600 hover:text-blue-900 p-1"
                                            title="Xem chi tiết"
                                        >
                                            <FaEye />
                                        </button>
                                        {hotel.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleApprove(hotel.hotel_id)}
                                                    disabled={loading || processingId === hotel.hotel_id}
                                                    className="text-green-600 hover:text-green-900 p-1 disabled:opacity-50"
                                                    title="Duyệt"
                                                >
                                                    {processingId === hotel.hotel_id ? (
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                                                    ) : (
                                                        <FaCheck />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleReject(hotel.hotel_id)}
                                                    disabled={loading || processingId === hotel.hotel_id}
                                                    className="text-red-600 hover:text-red-900 p-1 disabled:opacity-50"
                                                    title="Từ chối"
                                                >
                                                    {processingId === hotel.hotel_id ? (
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                                    ) : (
                                                        <FaTimes />
                                                    )}
                                                </button>
                                            </>
                                        )}
                                        {hotel.status === 'rejected' && (
                                            <button
                                                onClick={() => handleRestore(hotel.hotel_id)}
                                                disabled={loading || processingId === hotel.hotel_id}
                                                className="text-yellow-600 hover:text-yellow-900 p-1 disabled:opacity-50"
                                                title="Khôi phục"
                                            >
                                                {processingId === hotel.hotel_id ? (
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                                                ) : (
                                                    <FaUndo />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default HotelDataTable;