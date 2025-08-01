// // src/pages/admin/ContractManagement/ContractListPage.js
import React, { useState, useContext, useEffect } from 'react';
import { ContractContext, ContractProvider } from '../../../context/ContractContext'; // Thêm ContractProvider vào đây
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
  } = useContext(ContractContext);

  // Gọi fetchContracts khi component mount
  useEffect(() => {
    console.log('Fetching contracts...');
    fetchContracts();
  }, [fetchContracts]);

  // Log contracts để debug
  console.log('Contracts in ContractListContent:', contracts);

  const handleViewDetail = (contract) => {
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
      for (const contractId of contractIds) {
        await approveContract(contractId, {
          approvedBy: 'admin',
          notes: 'Đã duyệt'
        });
      }
      handleApprovalSuccess('Duyệt hợp đồng thành công');
    } catch (error) {
      console.error('Error approving contracts:', error);
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

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-6">
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                  Quản lý hợp đồng
                </h1>
                <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Xem và xét duyệt các hợp đồng trong hệ thống
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">
                    {successMessage}
                  </p>
                </div>
                <div className="ml-auto pl-3">
                  <div className="-mx-1.5 -my-1.5">
                    <button
                      onClick={() => setSuccessMessage('')}
                      className="inline-flex bg-green-50 rounded-md p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600"
                    >
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Contract Table - TRUYỀN PROPS VÀO ĐÂY */}
          <ContractTable 
            contracts={contracts}
            loading={loading}
            onViewDetail={handleViewDetail}
            onApprove={handleApprove}
            onReject={handleReject}
            showActions={true}
          />

          {/* Contract Detail Modal */}
          {showDetail && selectedContractId && (
            <ContractDetail
              contractId={selectedContractId}
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

// src/pages/admin/ContractManagement/ContractListPage.js
// import React from 'react';
// import { ContractProvider } from '../../../context/ContractContext';
// import ContractListContent from './ContractListContent';

// const ContractListPage = () => (
//   <ContractProvider>
//     <ContractListContent />
//   </ContractProvider>
// );

// export default ContractListPage;
