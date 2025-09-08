import React from 'react';
import { getContractStatusLabel } from '../../pages/hotel_owner/contract_management/ContractStatusUtils';

const HotelOwnerContractDetail = ({ contract, onClose, isPage = false }) => {
  if (!contract) return null;

  return (
    <div className={isPage ? "p-8" : ""}>
      {/* Chỉ hiển thị 1 nút đóng nếu không phải là trang riêng */}
      {!isPage && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-xl"
          style={{ position: 'absolute', right: 16, top: 16, zIndex: 10 }}
        >
          &times;
        </button>
      )}
      <h3 className="text-xl font-bold mb-4 text-blue-700">Chi tiết hợp đồng</h3>
      <div className="space-y-2">
        <div><strong>Số hợp đồng:</strong> {contract.contractNumber}</div>
        <div><strong>Tiêu đề:</strong> {contract.title}</div>
        <div><strong>Khách sạn ID:</strong> {contract.hotelId}</div>
        <div><strong>Giá trị:</strong> {contract.contractValue} ₫</div>
        <div>
          <strong>Thời gian:</strong> {new Date(contract.startDate).toLocaleDateString('vi-VN')} - {new Date(contract.endDate).toLocaleDateString('vi-VN')}
        </div>
        <div>
          <strong>Trạng thái:</strong> {getContractStatusLabel(contract.status).label}
        </div>
        <div>
          <strong>Ngày tạo:</strong> {new Date(contract.createdAt).toLocaleDateString('vi-VN')}
        </div>
        <div><strong>Mô tả:</strong> {contract.description}</div>
        <div><strong>Điều khoản thanh toán:</strong> {contract.paymentTerms}</div>
        <div><strong>Điều khoản & điều kiện:</strong> {contract.termsAndConditions}</div>
        <div><strong>Ghi chú:</strong> {contract.notes}</div>
        {/* Hiển thị link xem/tải file nếu có */}
        {contract.contractFileUrl && (
          <div>
            <strong>File hợp đồng:</strong>{' '}
            <a
              href={contract.contractFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
              download
            >
              Xem/Tải file
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default HotelOwnerContractDetail;
