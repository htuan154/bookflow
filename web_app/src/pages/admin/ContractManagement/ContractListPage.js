// src/pages/admin/ContractManagement/ContractListPage.js
import React, { useState, useContext, useEffect } from 'react';
import { ContractContext, ContractProvider } from '../../../context/ContractContext';
import ContractTable from '../../../components/contract/ContractTable';
import ContractDetail from '../../../components/contract/ContractDetail';

// Component con sử dụng context
const ContractListContent = () => {
  const [selectedContractId, setSelectedContractId] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Lấy data từ context
  const {
    contracts,
    loading,
    error,
    fetchContracts,
    approveContract,
    rejectContract,
    updateContractStatus,
    setError,
  } = useContext(ContractContext);

  // Gọi fetchContracts khi component mount
  useEffect(() => {
    fetchContracts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Log contracts để debug
  console.log('Contracts in ContractListContent:', contracts);

  const handleViewDetail = (contract) => {
    console.log('Selected contract for detail:', contract); // Debug log
    setSelectedContractId(contract.contractId);
    setShowDetail(true);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedContractId(null);
  };

  const handleApprovalSuccess = (message) => {
    setSuccessMessage(message);
    setSelectedContractId(null);
    setShowDetail(false);
    
    // Làm mới danh sách sau khi duyệt
    fetchContracts();
    
    // Clear success message after 5 seconds
    setTimeout(() => {
      setSuccessMessage('');
    }, 5000);
  };

  const handleApprove = async (contractIds) => {
    try {
        await Promise.all(contractIds.map(id => {
          // Tìm contract để kiểm tra signed_date
          const contract = contracts.find(c => c.contractId === id || c.contract_id === id || c.id === id);
          
          const approvalData = {
            approvedBy: 'admin',
            notes: 'Đã duyệt'
          };
          
          // Kiểm tra và thêm signed_date nếu chưa có
          if (contract && !contract.signed_date && !contract.signedDate) {
            approvalData.signed_date = new Date().toISOString();
            console.log(`✅ Adding signed_date for contract ${id}:`, approvalData.signed_date);
          }
          
          return approveContract(id, approvalData);
        }));
        
        // Sau khi duyệt, fetch lại danh sách hợp đồng
        await fetchContracts();
        setSuccessMessage('Duyệt hợp đồng thành công!');
    } catch (error) {
        setError(error.message || 'Có lỗi khi duyệt hợp đồng');
    }
  };

  const handleReject = async (contractIds) => {
    try {
      for (const contractId of contractIds) {
        await rejectContract(contractId, {
          approvedBy: 'admin',
          notes: 'Đã từ chối'
        });
      }
      handleApprovalSuccess('Từ chối hợp đồng thành công');
    } catch (error) {
      console.error('Error rejecting contracts:', error);
    }
  };

  // Handle update contract status
  const handleUpdateStatus = async (contractId, updateData) => {
    try {
      console.log('=== UPDATING CONTRACT STATUS ===');
      console.log('Contract ID:', contractId);
      console.log('Update Data:', updateData);

      // Nếu updateData là string (backward compatibility)
      if (typeof updateData === 'string') {
        updateData = { status: updateData };
      }

      const finalUpdateData = {
        ...updateData,
        updatedBy: 'admin',
        notes: `Đã cập nhật trạng thái thành ${updateData.status}`,
        updatedAt: new Date().toISOString()
      };

      // Nếu có signed_date được set thì log ra
      if (finalUpdateData.signed_date) {
        console.log('✅ Setting signed_date:', finalUpdateData.signed_date);
      }

      await updateContractStatus(contractId, finalUpdateData);
      
      // Refresh danh sách contracts
      await fetchContracts();
      
      // Hiển thị thông báo thành công
      const statusText = {
        'pending': 'Chờ duyệt',
        'active': 'Đang hiệu lực',
        'expired': 'Hết hạn',
        'terminated': 'Đã chấm dứt',
        'cancelled': 'Đã hủy'
      };
      
      setSuccessMessage(`Cập nhật trạng thái thành "${statusText[updateData.status] || updateData.status}" thành công!`);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      
    } catch (error) {
      console.error('Error updating contract status:', error);
      setError(error.message || 'Có lỗi khi cập nhật trạng thái hợp đồng');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header - Cải tiến */}
          <div className="mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      Quản lý hợp đồng
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                      Xem và xét duyệt các hợp đồng trong hệ thống
                    </p>
                  </div>
                </div>
                
                {/* Thống kê nhanh */}
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{contracts?.length || 0}</div>
                    <div className="text-xs text-gray-500">Tổng hợp đồng</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {contracts?.filter(c => c.status === 'pending').length || 0}
                    </div>
                    <div className="text-xs text-gray-500">Chờ duyệt</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Success Message - Cải tiến */}
          {successMessage && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-400 rounded-r-lg shadow-sm">
              <div className="flex items-center p-4">
                <div className="flex-shrink-0">
                  <div className="bg-green-100 rounded-full p-2">
                    <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-green-800">
                    {successMessage}
                  </p>
                </div>
                <div className="ml-4">
                  <button
                    onClick={() => setSuccessMessage('')}
                    className="inline-flex bg-green-50 rounded-full p-1.5 text-green-500 hover:bg-green-100 transition-colors duration-200"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error Message - Cải tiến */}
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 rounded-r-lg shadow-sm">
              <div className="flex items-center p-4">
                <div className="flex-shrink-0">
                  <div className="bg-red-100 rounded-full p-2">
                    <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-red-800">
                    {error}
                  </p>
                </div>
                <div className="ml-4">
                  <button
                    onClick={() => setError('')}
                    className="inline-flex bg-red-50 rounded-full p-1.5 text-red-500 hover:bg-red-100 transition-colors duration-200"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Contract Table Container - Cải tiến */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Danh sách hợp đồng</h2>
                <div className="flex items-center space-x-2">
                  {loading && (
                    <div className="flex items-center space-x-2 text-orange-600">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-sm">Đang tải...</span>
                    </div>
                  )}
                  <button 
                    onClick={fetchContracts}
                    className="inline-flex items-center px-3 py-1.5 border border-orange-200 text-sm font-medium rounded-lg text-orange-700 bg-orange-50 hover:bg-orange-100 transition-colors duration-200"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Làm mới
                  </button>
                </div>
              </div>
            </div>
            
            <ContractTable 
              contracts={contracts}
              loading={loading}
              onViewDetail={handleViewDetail}
              onApprove={handleApprove}
              onReject={handleReject}
              onUpdateStatus={handleUpdateStatus}
              showActions={true}
            />
          </div>

          {/* Contract Detail Modal */}
          {showDetail && selectedContractId && (
            <ContractDetail
              contractId={selectedContractId}
              contract={contracts.find(c => c.contractId === selectedContractId)} // Thêm prop này
              onClose={handleCloseDetail}
              onApprovalSuccess={handleApprovalSuccess}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Component chính bọc ContractProvider
const ContractListPage = () => {
  return (
    <ContractProvider>
      <ContractListContent />
    </ContractProvider>
  );
};

export default ContractListPage;