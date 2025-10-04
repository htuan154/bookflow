// src/components/hotel/HotelDataTable.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useHotelStatus from '../../hooks/useHotelStatus';
import { toast } from 'react-toastify';
import { FaEye, FaCheck, FaTimes, FaUndo, FaStar, FaMapMarkerAlt, FaEnvelope, FaPhone } from 'react-icons/fa';
import RejectModal from '../modal/RejectModal';
import ApprovalModal from '../modal/ApprovalModal';
import RestoreModal from '../modal/RestoreModal';

const HotelDataTable = ({ hotels, showActions = false, status, onDataRefresh }) => {
    const navigate = useNavigate();
    const { approveHotel, rejectHotel, restoreHotel, loading } = useHotelStatus();
    const [processingId, setProcessingId] = useState(null);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [approvalModalOpen, setApprovalModalOpen] = useState(false);
    const [restoreModalOpen, setRestoreModalOpen] = useState(false);
    const [selectedHotel, setSelectedHotel] = useState(null);

    const handleApprove = (hotel) => {
        setSelectedHotel(hotel);
        setApprovalModalOpen(true);
    };

    const handleApproveConfirm = async () => {
        if (!selectedHotel) return;

        console.log('handleApproveConfirm called with hotel:', selectedHotel);
        setProcessingId(selectedHotel.hotelId);
        try {
            console.log('Calling approveHotel...');
            const hotelData = {
                name: selectedHotel.name,
                ownerId: selectedHotel.ownerId || selectedHotel.owner_id || selectedHotel.ownerID,
                oldStatus: selectedHotel.status || 'pending'
            };
            console.log('Hotel data being passed:', hotelData);
            console.log('Full hotel object:', selectedHotel);
            await approveHotel(selectedHotel.hotelId, hotelData);
            console.log('approveHotel completed successfully');
            toast.success('Đã duyệt khách sạn thành công!');
            // Refresh data thay vì reload page
            if (onDataRefresh) {
                onDataRefresh();
            }
        } catch (error) {
            console.error('Error in approveHotel:', error);
            toast.error('Có lỗi xảy ra khi duyệt khách sạn');
            throw error; // Re-throw để modal có thể handle
        } finally {
            setProcessingId(null);
        }
    };

    const handleApprovalModalClose = () => {
        setApprovalModalOpen(false);
        setSelectedHotel(null);
    };

    const handleReject = (hotel) => {
        setSelectedHotel(hotel);
        setRejectModalOpen(true);
    };

    const handleRejectConfirm = async (reason) => {
        if (!selectedHotel) return;
        
        setProcessingId(selectedHotel.hotelId);
        try {
            const hotelData = {
                name: selectedHotel.name,
                ownerId: selectedHotel.ownerId || selectedHotel.owner_id || selectedHotel.ownerID,
                oldStatus: selectedHotel.status || 'pending'
            };
            console.log('Hotel data being passed (reject):', hotelData);
            await rejectHotel(selectedHotel.hotelId, reason, hotelData);
            toast.success('Đã từ chối khách sạn thành công!');
            // Refresh data thay vì reload page
            if (onDataRefresh) {
                onDataRefresh();
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra khi từ chối khách sạn');
            throw error; // Re-throw để modal có thể handle
        } finally {
            setProcessingId(null);
        }
    };

    const handleRejectModalClose = () => {
        setRejectModalOpen(false);
        setSelectedHotel(null);
    };

    const handleRestore = (hotel) => {
        setSelectedHotel(hotel);
        setRestoreModalOpen(true);
    };

    const handleRestoreConfirm = async (note = '') => {
        if (!selectedHotel) return;

        setProcessingId(selectedHotel.hotelId);
        try {
            const hotelData = {
                name: selectedHotel.name,
                ownerId: selectedHotel.ownerId || selectedHotel.owner_id || selectedHotel.ownerID,
                oldStatus: selectedHotel.status || 'rejected',
                note: note.trim()
            };
            console.log('Hotel data being passed (restore):', hotelData);
            await restoreHotel(selectedHotel.hotelId, hotelData);
            toast.success('Đã khôi phục khách sạn thành công!');
            // Refresh data thay vì reload page
            if (onDataRefresh) {
                onDataRefresh();
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra khi khôi phục khách sạn');
            throw error; // Re-throw để modal có thể handle
        } finally {
            setProcessingId(null);
        }
    };

    const handleRestoreModalClose = () => {
        setRestoreModalOpen(false);
        setSelectedHotel(null);
    };

    const handleViewHotelDetail = (hotelId) => {
        navigate(`/admin/hotels/${hotelId}`);
    };

    const getStatusBadge = (hotelStatus) => {
        const statusConfig = {
            'approved': { color: 'bg-green-100 text-green-800', text: 'Đã duyệt' },
            'pending': { color: 'bg-yellow-100 text-yellow-800', text: 'Chờ duyệt' },
            'rejected': { color: 'bg-red-100 text-red-800', text: 'Đã từ chối' },
            'active': { color: 'bg-blue-100 text-blue-800', text: 'Đang hoạt động' },
            'inactive': { color: 'bg-gray-100 text-gray-800', text: 'Ngừng hoạt động' }
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
                                            onClick={() => handleViewHotelDetail(hotel.hotelId)}
                                            className="text-blue-600 hover:text-blue-900 p-1"
                                            title="Xem chi tiết"
                                        >
                                            <FaEye />
                                        </button>
                                        {hotel.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleApprove(hotel)}
                                                    disabled={loading || processingId === hotel.hotelId}
                                                    className="text-green-600 hover:text-green-900 p-1 disabled:opacity-50"
                                                    title="Duyệt"
                                                >
                                                    {processingId === hotel.hotelId ? (
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                                                    ) : (
                                                        <FaCheck />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleReject(hotel)}
                                                    disabled={loading || processingId === hotel.hotelId}
                                                    className="text-red-600 hover:text-red-900 p-1 disabled:opacity-50"
                                                    title="Từ chối"
                                                >
                                                    {processingId === hotel.hotelId ? (
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                                    ) : (
                                                        <FaTimes />
                                                    )}
                                                </button>
                                            </>
                                        )}
                                        {hotel.status === 'rejected' && (
                                            <button
                                                onClick={() => handleRestore(hotel)}
                                                disabled={loading || processingId === hotel.hotelId}
                                                className="text-yellow-600 hover:text-yellow-900 p-1 disabled:opacity-50"
                                                title="Khôi phục"
                                            >
                                                {processingId === hotel.hotelId ? (
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

            {/* Reject Modal */}
            <RejectModal
                isOpen={rejectModalOpen}
                onClose={handleRejectModalClose}
                onConfirm={handleRejectConfirm}
                hotelName={selectedHotel?.name || ''}
            />

            {/* Approval Modal */}
            <ApprovalModal
                isOpen={approvalModalOpen}
                onClose={handleApprovalModalClose}
                onConfirm={handleApproveConfirm}
                hotelName={selectedHotel?.name || ''}
            />

            {/* Restore Modal */}
            <RestoreModal
                isOpen={restoreModalOpen}
                onClose={handleRestoreModalClose}
                onConfirm={handleRestoreConfirm}
                hotelName={selectedHotel?.name || ''}
            />
        </div>
    );
};

export default HotelDataTable;