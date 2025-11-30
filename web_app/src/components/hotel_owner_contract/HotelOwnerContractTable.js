// src/components/hotel_owner_contract/HotelOwnerContractTable.js
import React, { useState, useMemo } from 'react';
import { getContractStatusLabel } from '../../pages/hotel_owner/contract_management/ContractStatusUtils';
// Icon SVGs giống ActionButton.js
const ViewIcon = (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);
const EditIcon = (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);
const DeleteIcon = (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
// ...existing imports...
// Component UI hiển thị danh sách thông báo hết hạn hợp đồng
function ContractNotificationList({ notifications }) {
  return (
    <div className="mb-6">
      <div className="font-bold text-lg mb-2 text-gray-800">Thông báo hợp đồng</div>
      {(!notifications || notifications.length === 0) ? (
        <div className="border rounded-lg p-4 bg-white shadow text-gray-500 text-sm flex items-center gap-2" style={{ borderLeft: '6px solid #fbbf24' }}>
          <span>Không có thông báo hết hạn hợp đồng nào.</span>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(n => (
            <div
              key={n._id}
              className={`border rounded-lg p-4 bg-white shadow flex flex-col gap-2`}
              style={{ borderLeft: '6px solid #fbbf24' }}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-yellow-700">{n.title}</span>
                <span className="text-xs text-gray-500">{new Date(n.created_at).toLocaleString()}</span>
              </div>
              <div className="text-gray-700 text-sm">{n.message}</div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                  {n.notification_type}
                </span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${n.is_read ? 'bg-gray-200 text-gray-600' : 'bg-yellow-200 text-yellow-800'}`}>{n.is_read ? 'Đã đọc' : 'Chưa đọc'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


const statusOptions = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'draft', label: 'Nháp' },
  { key: 'pending', label: 'Chờ duyệt' },
  { key: 'active', label: 'Đang hiệu lực' },
  { key: 'expired', label: 'Hết hạn' },
  { key: 'terminated', label: 'Đã chấm dứt' },
  { key: 'cancelled', label: 'Đã hủy' },
];

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
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [currentTab, setCurrentTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Kiểm tra dữ liệu hợp đồng trả về từ backend
  console.log('HotelOwnerContractTable contracts:', contracts);

  // Map hotelId -> hotelName (fallback nếu backend không trả về hotelName)
  const hotelIdToName = {};
  hotels.forEach(hotel => {
    hotelIdToName[hotel.hotel_id] = hotel.name;
  });

  // Sửa logic mapping để ưu tiên hotelName từ backend
  const contractsWithHotelName = contracts.map(contract => {
    // console.log('Processing contract:', contract); // Debug từng contract
    return {
      ...contract,
      hotelName: contract.hotelName ||
                 contract.hotel_name ||
                 hotelIdToName[contract.hotelId || contract.hotel_id] ||
                 'N/A'
    };
  });

  // Filter contracts by status
  const filteredContracts = useMemo(() => {
    let filtered = contractsWithHotelName;
    if (currentTab !== 'ALL') {
      filtered = filtered.filter(contract => contract.status === currentTab);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(contract =>
        (contract.contractNumber?.toLowerCase().includes(term) ||
         contract.title?.toLowerCase().includes(term))
      );
    }
    return filtered;
  }, [contractsWithHotelName, currentTab, searchTerm]);

  // Calculate paginated data
  const totalItems = filteredContracts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  const paginatedContracts = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredContracts.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredContracts, currentPage, itemsPerPage]);

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Handle items per page change
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
  };

  // Handle tab/status change
  const handleTabChange = (tab) => {
    setCurrentTab(tab);
    setCurrentPage(1); // Reset to first page when changing filter
  };

  // Thông báo hết hạn hợp đồng, nhận qua props hoặc để trống nếu chưa có dữ liệu
  const notifications = [];

  // Handle search change
  const handleSearchChange = (term) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page when searching
  };

  return (
    <div>
      {/* Thông báo hết hạn hợp đồng */}
      <ContractNotificationList notifications={notifications} />


      {/* Status Filter Dropdown & Search */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div className="flex items-center">
          <label htmlFor="statusFilter" className="mr-2 font-medium">Trạng thái:</label>
          <select
            id="statusFilter"
            value={currentTab}
            onChange={e => handleTabChange(e.target.value)}
            className="border rounded px-3 py-1 focus:outline-none focus:ring"
          >
            {statusOptions.map(option => (
              <option key={option.key} value={option.key}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm theo số hợp đồng, tiêu đề..."
              value={searchTerm}
              onChange={e => handleSearchChange(e.target.value)}
              className="block w-full pl-12 pr-4 py-3 border-0 rounded-lg bg-white shadow-sm ring-1 ring-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:bg-white text-sm transition-all duration-200"
            />
          </div>
        </div>
      </div>

      {/* Thanh trượt ngang cho bảng, đặt phía trên phân trang */}
      <div style={{ overflowX: 'auto', width: '100%', marginBottom: '8px' }}>
        <table className="min-w-[1200px] w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {/* Số hợp đồng */}
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Số HĐ</th>
              {/* Tiêu đề */}
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Tiêu đề</th>
              {/* Tên khách sạn */}
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Tên khách sạn</th>
              {/* Thời gian */}
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Thời gian</th>
              {/* Trạng thái */}
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Trạng thái</th>
              {/* Ngày tạo */}
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Ngày tạo</th>
              {/* File hợp đồng */}
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">File</th>
              {showActions && (
                <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Thao tác</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {paginatedContracts.length === 0 ? (
              <tr>
                <td colSpan={showActions ? 8 : 7} className="px-6 py-16 text-center text-gray-500">
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
              paginatedContracts.map((contract, index) => (
                <tr key={contract.contractId} className={`hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  {/* Số hợp đồng */}
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">
                      {contract.contractNumber}
                    </div>
                  </td>
                  {/* Tiêu đề */}
                  <td className="px-6 py-5">
                    <div className="text-sm font-semibold text-gray-900 max-w-xs truncate">
                      {contract.title}
                    </div>
                  </td>
                  {/* Tên khách sạn */}
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      {contract.hotelName}
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
                    {(() => {
                      let badgeColor = '';
                      let text = getContractStatusLabel(contract.status).label;
                      switch (contract.status) {
                        case 'draft':
                          badgeColor = 'bg-gray-100 text-gray-800 border-gray-200';
                          break;
                        case 'pending':
                          badgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
                          break;
                        case 'active':
                          badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                          break;
                        case 'terminated':
                        case 'cancelled':
                          badgeColor = 'bg-red-100 text-red-800 border-red-200';
                          break;
                        case 'expired':
                          badgeColor = 'bg-orange-100 text-orange-800 border-orange-200';
                          break;
                        default:
                          badgeColor = 'bg-gray-100 text-gray-800 border-gray-200';
                      }
                      return (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${badgeColor}`}>
                          {text}
                        </span>
                      );
                    })()}
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
                      <span className="text-xs text-gray-400">Không có</span>
                    )}
                  </td>
                  {/* Thao tác */}
                  {showActions && (
                    <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {contract.status === 'draft' ? (
                          <>
                            <button
                              onClick={() => onViewDetail(contract)}
                              title="Xem"
                              className="mx-1 p-1 rounded hover:bg-gray-100 focus:outline-none transition-colors text-green-600"
                            >
                              {ViewIcon}
                            </button>
                            <button
                              onClick={() => onEdit(contract)}
                              title="Sửa"
                              className="mx-1 p-1 rounded hover:bg-gray-100 focus:outline-none transition-colors text-blue-600"
                            >
                              {EditIcon}
                            </button>
                            <button
                              onClick={() => onDelete(contract.contract_id || contract.contractId)}
                              title="Xoá"
                              className="mx-1 p-1 rounded hover:bg-gray-100 focus:outline-none transition-colors text-red-600"
                            >
                              {DeleteIcon}
                            </button>
                            <button
                              onClick={() => onSendForApproval(contract.contract_id || contract.contractId)}
                              className="px-4 py-2 bg-[#2563eb] text-white rounded font-medium text-sm hover:bg-[#1d4ed8] focus:outline-none transition-colors duration-200"
                              style={{ minWidth: 64 }}
                            >
                              Nộp
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => onViewDetail(contract)}
                            title="Xem"
                            className="mx-1 p-1 rounded hover:bg-gray-100 focus:outline-none transition-colors text-green-600"
                          >
                            {ViewIcon}
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
      
      {/* Pagination */}
      {totalItems > 0 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Trước
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Tiếp
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-700">
                Hiển thị {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}-{Math.min(currentPage * itemsPerPage, totalItems)} trong tổng số {totalItems} hợp đồng
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Hiển thị:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value={5}>5 mục</option>
                  <option value={10}>10 mục</option>
                  <option value={20}>20 mục</option>
                  <option value={50}>50 mục</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                &lt;&lt;
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
              Trước
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === pageNum
                          ? 'z-10 bg-blue-600 border-blue-600 text-white'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Tiếp
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                &gt;&gt;
              </button>
              
              <div className="flex items-center gap-2 ml-4">
                <span className="text-sm text-gray-700">Đến trang:</span>
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const page = Number(e.target.value);
                    if (page >= 1 && page <= totalPages) {
                      handlePageChange(page);
                    }
                  }}
                  className="border border-gray-300 rounded px-2 py-1 text-sm w-16 text-center"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HotelOwnerContractTable;