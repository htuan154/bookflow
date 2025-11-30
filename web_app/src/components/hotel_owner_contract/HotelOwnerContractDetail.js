import React from 'react';
import { FileText, Calendar, DollarSign, Percent, User, AlertCircle, Clock, FileCheck, X } from 'lucide-react';

// Status color mapping consistent with HotelOwnerContractTable
const getContractStatusLabel = (status) => {
  switch (status) {
    case 'draft':
      return { label: 'Nháp', color: 'bg-gray-100 text-gray-800 border border-gray-200' };
    case 'pending':
      return { label: 'Chờ duyệt', color: 'bg-amber-100 text-amber-800 border border-amber-200' };
    case 'active':
      return { label: 'Đang hiệu lực', color: 'bg-emerald-100 text-emerald-800 border border-emerald-200' };
    case 'terminated':
      return { label: 'Đã chấm dứt', color: 'bg-red-100 text-red-800 border border-red-200' };
    case 'cancelled':
      return { label: 'Đã hủy', color: 'bg-red-100 text-red-800 border border-red-200' };
    case 'expired':
      return { label: 'Hết hạn', color: 'bg-orange-100 text-orange-800 border border-orange-200' };
    default:
      return { label: status, color: 'bg-gray-100 text-gray-800 border border-gray-200' };
  }
};

const HotelOwnerContractDetail = ({ contract, onClose, isPage = false }) => {
  // Demo data
  const demoContract = contract || {
    contractNumber: 'HD-KHÁCH-1758249349351',
    title: 'chấp nhận dì',
    hotelId: '4537dcb2-9406-4a6a-bc24-8be60fb4162c',
    contractValue: '1000000.00',
    startDate: '2025-09-21',
    endDate: '2025-09-22',
    status: 'Đã hủy',
    createdAt: '2025-09-19',
    description: 'không chấp nhận là một',
    paymentTerms: 'sdfaf',
    termsAndConditions: 'gfdgfd',
    notes: 'Không Hợp Lệ',
    contractFileUrl: '#'
  };

  const displayContract = contract || demoContract;
  if (!displayContract) return null;

  const statusInfo = getContractStatusLabel(displayContract.status);

  const formatCurrency = (value) => {
    // Kiểm tra nếu currency là % (contract_value là hoa hồng %)
    const currency = displayContract.currency || 'VND';
    if (currency === '%' || currency === 'Phần trăm' || currency === 'percent') {
      return `${parseFloat(value).toFixed(2)}%`;
    }
    // Format tiền tệ bình thường
    return new Intl.NumberFormat('vi-VN').format(value) + ' ₫';
  };

  return (
    <>
      {/* Scrollable Content Wrapper */}
      <div style={{ maxHeight: '80vh', overflowY: 'auto', position: 'relative' }}>
        {/* Close Button (inside modal content) */}
        {!isPage && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white hover:bg-gray-100 shadow-md transition-all duration-200 hover:shadow-lg"
            style={{ position: 'absolute', right: 16, top: 16 }}
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        )}
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-t-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8" />
            <h3 className="text-2xl font-bold">Chi tiết hợp đồng</h3>
          </div>
          <p className="text-blue-100 text-sm">Thông tin chi tiết về hợp đồng của bạn</p>
        </div>

        {/* Content Section */}
        <div className="bg-white rounded-b-xl shadow-lg p-6 space-y-6">
          {/* Contract Number & Status */}
          <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-gray-200">
            <div className="flex-1 min-w-[250px]">
              <p className="text-sm text-gray-500 mb-1">Số hợp đồng</p>
              <p className="text-lg font-semibold text-gray-900">{displayContract.contractNumber}</p>
            </div>
            <div>
              <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
          </div>

          {/* Main Info Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Title */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <FileCheck className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1">Tiêu đề</p>
                  <p className="text-base font-medium text-gray-900 break-words">{displayContract.title}</p>
                </div>
              </div>
            </div>

            {/* Value */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                {(displayContract.currency === '%' || displayContract.currency === 'Phần trăm') ? (
                  <Percent className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <DollarSign className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1">
                    {(displayContract.currency === '%' || displayContract.currency === 'Phần trăm') ? 'Hoa hồng' : 'Giá trị'}
                  </p>
                  <p className="text-base font-semibold text-green-600 break-words">{formatCurrency(displayContract.contractValue)}</p>
                </div>
              </div>
            </div>

            {/* Duration */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1">Thời gian</p>
                  <p className="text-sm text-gray-900">
                    {new Date(displayContract.startDate).toLocaleDateString('vi-VN')} - {new Date(displayContract.endDate).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>
            </div>

            {/* Created Date */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1">Ngày tạo</p>
                  <p className="text-sm text-gray-900">{new Date(displayContract.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Hotel ID */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-blue-600 font-medium mb-1">Khách sạn ID</p>
                <p className="text-sm text-gray-700 font-mono break-all">{displayContract.hotelId}</p>
              </div>
            </div>
          </div>

          {/* Description & Terms Section */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              Thông tin chi tiết
            </h4>

            <div className="space-y-3">
              {displayContract.description && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Mô tả:</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{displayContract.description}</p>
                </div>
              )}

              {displayContract.paymentTerms && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Điều khoản thanh toán:</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{displayContract.paymentTerms}</p>
                </div>
              )}

              {displayContract.termsAndConditions && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Điều khoản & điều kiện:</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{displayContract.termsAndConditions}</p>
                </div>
              )}

              {displayContract.notes && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-amber-800 mb-2">Ghi chú:</p>
                  <p className="text-sm text-amber-700 leading-relaxed">{displayContract.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Contract File */}
          {displayContract.contractFileUrl && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">File hợp đồng</p>
                    <p className="text-xs text-gray-500">Nhấn để xem hoặc tải xuống</p>
                  </div>
                </div>
                <a
                  href={displayContract.contractFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium shadow-sm hover:shadow-md flex items-center gap-2"
                  download
                >
                  <FileText className="w-4 h-4" />
                  Xem/Tải file
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default HotelOwnerContractDetail;