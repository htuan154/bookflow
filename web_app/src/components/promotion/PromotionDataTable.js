// src/components/promotion/PromotionDataTable.js
import React from 'react';
import Spinner from '../common/Spinner';

const PromotionDataTable = ({ promotions, onEdit, loading }) => {
    // Format date helper
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // Format currency helper
    const formatCurrency = (amount) => {
        if (!amount) return '0 VNĐ';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    // Status badge component
    const StatusBadge = ({ status }) => {
        const getStatusStyle = (status) => {
            switch (status?.toLowerCase()) {
                case 'active':
                    return 'bg-green-100 text-green-800 border-green-200';
                case 'inactive':
                    return 'bg-red-100 text-red-800 border-red-200';
                case 'expired':
                    return 'bg-gray-100 text-gray-800 border-gray-200';
                case 'pending':
                    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                default:
                    return 'bg-gray-100 text-gray-800 border-gray-200';
            }
        };

        const getStatusText = (status) => {
            switch (status?.toLowerCase()) {
                case 'active':
                    return 'Đang hoạt động';
                case 'inactive':
                    return 'Không hoạt động';
                case 'expired':
                    return 'Đã hết hạn';
                case 'pending':
                    return 'Đang chờ';
                default:
                    return status || 'Không xác định';
            }
        };

        return (
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusStyle(status)}`}>
                {getStatusText(status)}
            </span>
        );
    };

    // Promotion type badge component
    const PromotionTypeBadge = ({ type }) => {
        const getTypeStyle = (type) => {
            switch (type?.toLowerCase()) {
                case 'percentage':
                    return 'bg-blue-100 text-blue-800 border-blue-200';
                case 'fixed_amount':
                    return 'bg-purple-100 text-purple-800 border-purple-200';
                case 'free_night':
                    return 'bg-orange-100 text-orange-800 border-orange-200';
                default:
                    return 'bg-gray-100 text-gray-800 border-gray-200';
            }
        };

        const getTypeText = (type) => {
            switch (type?.toLowerCase()) {
                case 'percentage':
                    return 'Phần trăm';
                case 'fixed_amount':
                    return 'Số tiền cố định';
                case 'free_night':
                    return 'Đêm miễn phí';
                default:
                    return type || 'Không xác định';
            }
        };

        return (
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getTypeStyle(type)}`}>
                {getTypeText(type)}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-32">
                <Spinner />
            </div>
        );
    }

    if (!promotions || promotions.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="text-gray-500 text-lg mb-2">
                    Chưa có khuyến mãi nào
                </div>
                <p className="text-gray-400 text-sm">
                    Hãy tạo khuyến mãi đầu tiên để bắt đầu
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Mã & Tên
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Loại & Giá trị
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Thời gian hiệu lực
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Sử dụng
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Trạng thái
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Thao tác
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {promotions.map((promotion) => (
                        <tr key={promotion.promotionId} className="hover:bg-gray-50">
                            {/* Mã & Tên */}
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                    <div className="text-sm font-medium text-gray-900">
                                        {promotion.code}
                                    </div>
                                    <div className="text-sm text-gray-500 max-w-xs truncate">
                                        {promotion.name}
                                    </div>
                                </div>
                            </td>

                            {/* Loại & Giá trị */}
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="space-y-1">
                                    <PromotionTypeBadge type={promotion.promotionType} />
                                    <div className="text-sm font-medium text-gray-900">
                                        {promotion.promotionType?.toLowerCase() === 'percentage' 
                                            ? `${promotion.discountValue}%`
                                            : formatCurrency(promotion.discountValue)
                                        }
                                    </div>
                                </div>
                            </td>

                            {/* Thời gian hiệu lực */}
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                    <div>Từ: {formatDate(promotion.validFrom)}</div>
                                    <div>Đến: {formatDate(promotion.validUntil)}</div>
                                </div>
                            </td>

                            {/* Sử dụng */}
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                    <div>
                                        <span className="font-medium">{promotion.usedCount || 0}</span>
                                        {promotion.usageLimit && (
                                            <span className="text-gray-500">
                                                /{promotion.usageLimit}
                                            </span>
                                        )}
                                    </div>
                                    {promotion.minBookingPrice && (
                                        <div className="text-xs text-gray-500">
                                            Tối thiểu: {formatCurrency(promotion.minBookingPrice)}
                                        </div>
                                    )}
                                </div>
                            </td>

                            {/* Trạng thái */}
                            <td className="px-6 py-4 whitespace-nowrap">
                                <StatusBadge status={promotion.status} />
                            </td>

                            {/* Thao tác */}
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                <button
                                    onClick={() => onEdit(promotion)}
                                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Chỉnh sửa
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default PromotionDataTable;