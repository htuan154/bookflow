// src/components/hotel_owner_contract/HotelOwnerContractTable.js
import React from 'react';
import { getContractStatusLabel } from '../../pages/hotel_owner/contract_management/ContractStatusUtils';

const HotelOwnerContractTable = ({
  contracts,
  loading,
  onViewDetail,
  onEdit,
  onDelete,
  onSendForApproval,
  showActions,
  hotels = [],
}) => {
  // Kiểm tra dữ liệu hợp đồng trả về từ backend
  console.log('HotelOwnerContractTable contracts:', contracts);

  // Map hotelId -> hotelName (fallback nếu backend không trả về hotelName)
  const hotelIdToName = {};
  hotels.forEach(hotel => {
    hotelIdToName[hotel.hotel_id] = hotel.name;
  });

  // Sửa logic mapping để ưu tiên hotelName từ backend
  const contractsWithHotelName = contracts.map(contract => {
    console.log('Processing contract:', contract); // Debug từng contract
    return {
      ...contract,
      // Ưu tiên hotelName từ backend, fallback sang mapping từ hotels list
      hotelName: contract.hotelName ||
                 contract.hotel_name ||
                 hotelIdToName[contract.hotelId || contract.hotel_id] ||
                 'N/A'
    };
  });

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {/* Số hợp đồng */}
            <th 
              scope="col" 
              className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider"
            >
              Số hợp đồng
            </th>
            {/* Tiêu đề + mô tả */}
            <th 
              scope="col" 
              className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider"
            >
              Tiêu đề
            </th>
            {/* Loại hợp đồng */}
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
              Loại hợp đồng
            </th>
            <th 
            >
              Khách sạn ID
            </th>
            <th 
              scope="col" 
              className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider"
            >
              Tên khách sạn
            </th>
            <th 
              scope="col" 
              className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider"
            >
              Giá trị
            </th>
            <th 
              scope="col" 
              className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider"
            >
              Loại tiền
            </th>
            <th 
              scope="col" 
              className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider"
            >
              Thời gian
            </th>
            <th 
              scope="col" 
              className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider"
            >
              Trạng thái
            </th>
            <th 
              scope="col" 
              className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider"
            >
              Ngày tạo
            </th>
            <th 
              scope="col" 
              className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider"
            >
              File hợp đồng
            </th>
            {showActions && (
              <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                Thao tác
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {contractsWithHotelName.length === 0 ? (
            <tr>
              <td colSpan={showActions ? 9 : 8} className="px-6 py-16 text-center text-gray-500">
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Không có hợp đồng nào</h3>
                  <p className="text-sm text-gray-500 max-w-md">
                    Chưa có hợp đồng nào được tạo
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            contractsWithHotelName.map((contract, index) => (
              <tr key={contract.contractId} className={`hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                {/* Số hợp đồng */}
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="text-sm font-bold text-gray-900 mb-1">
                    {contract.contractNumber}
                  </div>
                </td>
                {/* Tiêu đề + mô tả */}
                <td className="px-6 py-5">
                  <div className="text-sm font-semibold text-gray-900 max-w-xs truncate mb-1">
                    {contract.title}
                  </div>
                  <div className="text-xs text-gray-600 max-w-xs truncate">
                    {contract.description}
                  </div>
                </td>
                {/* Loại hợp đồng */}
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {contract.contractType}
                  </div>
                </td>
                {/* Khách sạn ID */}
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 bg-orange-50 px-3 py-1 rounded-lg inline-block">
                    {contract.hotelId || contract.hotel_id || 'N/A'}
                  </div>
                </td>
                {/* Tên khách sạn */}
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="text-sm font-semibold text-gray-900">
                    {contract.hotelName}
                  </div>
                </td>
                {/* Giá trị */}
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="text-sm font-bold text-emerald-700">
                    {contract.contractValue} ₫
                  </div>
                </td>
                {/* Loại tiền */}
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {contract.currency}
                  </div>
                </td>
                {/* Thời gian */}
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="text-sm text-gray-900 font-medium">
                    {new Date(contract.startDate).toLocaleDateString('vi-VN')}
                  </div>
                  <div className="text-xs text-gray-500">
                    đến {contract.endDate ? new Date(contract.endDate).toLocaleDateString('vi-VN') : '---'}
                  </div>
                </td>
                {/* Trạng thái */}
                <td className="px-6 py-5 whitespace-nowrap">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getContractStatusLabel(contract.status).color}`}>
                    {getContractStatusLabel(contract.status).label}
                  </span>
                </td>
                {/* Ngày tạo */}
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="text-sm text-gray-900 font-medium">
                    {new Date(contract.createdAt).toLocaleDateString('vi-VN')}
                  </div>
                </td>
                {/* File hợp đồng */}
                <td className="px-6 py-5 whitespace-nowrap">
                  {contract.contractFileUrl ? (
                    <a
                      href={contract.contractFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline text-xs"
                    >
                      Tải file
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400">Chưa có</span>
                  )}
                </td>
                {/* Thao tác */}
                {showActions && (
                  <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => onViewDetail(contract)}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 hover:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 transition-all duration-200 transform hover:scale-105"
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Xem
                      </button>
                      {contract.permissions?.canEdit && (
                        <button
                          onClick={() => onEdit(contract)}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 hover:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 transition-all duration-200 transform hover:scale-105"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Sửa
                        </button>
                      )}
                      {contract.permissions?.canDelete && (
                        <button
                          onClick={() => onDelete(contract.contract_id || contract.contractId)}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-all duration-200 transform hover:scale-105"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Xóa
                        </button>
                      )}
                      {contract.permissions?.canSendForApproval && (
                        <button
                          onClick={() => onSendForApproval(contract.contract_id || contract.contractId)}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200 transform hover:scale-105"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          Gửi duyệt
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default HotelOwnerContractTable;