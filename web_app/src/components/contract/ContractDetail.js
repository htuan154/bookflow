// src/components/Contract/ContractDetail.js
import { useState, useEffect, useContext  } from 'react';
import {ContractContext} from '../../context/ContractContext'
import { contractServices } from '../../api/contract.service';

const ContractDetail = ({ contractId, onClose, onApprovalSuccess }) => {
  const {
    selectedContract,
    loading,
    error,
    fetchContractDetail,
    clearError
  } = useContext(ContractContext);

  const [activeTab, setActiveTab] = useState('details');
  const [fileLoading, setFileLoading] = useState(false);

  useEffect(() => {
    if (contractId) {
      fetchContractDetail(contractId);
    }
  }, [contractId, fetchContractDetail]);

  // Format currency
  const formatCurrency = (amount, currency = 'VND') => {
    if (!amount) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get status info
  const getStatusInfo = (status) => {
    const statusConfig = {
      pending: {
        label: 'Chờ duyệt',
        color: 'yellow',
        bgColor: 'bg-yellow-50',
        textColor: 'text-yellow-800',
        borderColor: 'border-yellow-200',
        icon: '⏱️'
      },
      approved: {
        label: 'Đã duyệt',
        color: 'green',
        bgColor: 'bg-green-50',
        textColor: 'text-green-800',
        borderColor: 'border-green-200',
        icon: '✅'
      },
      rejected: {
        label: 'Từ chối',
        color: 'red',
        bgColor: 'bg-red-50',
        textColor: 'text-red-800',
        borderColor: 'border-red-200',
        icon: '❌'
      }
    };

    return statusConfig[status] || statusConfig.pending;
  };

  // Handle file download
  const handleDownloadFile = async () => {
    if (!selectedContract?.contractFileUrl) return;

    try {
      setFileLoading(true);
      const blob = await contractServices.downloadContractFile(selectedContract.contractId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `contract-${selectedContract.contractNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Không thể tải file. Vui lòng thử lại.');
    } finally {
      setFileLoading(false);
    }
  };

  // Contract type mapping
  const contractTypeMap = {
    partnership: 'Hợp đồng hợp tác',
    service: 'Hợp đồng dịch vụ',
    rental: 'Hợp đồng thuê',
    management: 'Hợp đồng quản lý'
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3">Đang tải thông tin hợp đồng...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md">
          <div className="text-red-600 mb-4">
            <h3 className="text-lg font-semibold">Có lỗi xảy ra</h3>
            <p className="mt-2">{error}</p>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={clearError}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Thử lại
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedContract) {
    return null;
  }

  const statusInfo = getStatusInfo(selectedContract.status);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Chi tiết hợp đồng
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {selectedContract.contractNumber}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.textColor} ${statusInfo.borderColor} border`}>
              {statusInfo.icon} {statusInfo.label}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 py-3 border-b border-gray-200">
          <div className="flex space-x-8">
            {[
              { key: 'details', label: 'Thông tin chi tiết' },
              { key: 'file', label: 'File hợp đồng' },
              { key: 'approval', label: 'Xét duyệt' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'details' && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                    Thông tin cơ bản
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Số hợp đồng</label>
                      <p className="text-gray-900">{selectedContract.contractNumber}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Tiêu đề</label>
                      <p className="text-gray-900">{selectedContract.title}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Loại hợp đồng</label>
                      <p className="text-gray-900">
                        {contractTypeMap[selectedContract.contractType] || selectedContract.contractType}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Mô tả</label>
                      <p className="text-gray-900">{selectedContract.description || '--'}</p>
                    </div>
                  </div>
                </div>

                {/* Financial Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                    Thông tin tài chính
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Giá trị hợp đồng</label>
                      <p className="text-gray-900 text-lg font-semibold">
                        {formatCurrency(selectedContract.contractValue, selectedContract.currency)}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Điều khoản thanh toán</label>
                      <p className="text-gray-900">{selectedContract.paymentTerms || '--'}</p>
                    </div>
                  </div>
                </div>

                {/* Date Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                    Thông tin thời gian
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Ngày ký</label>
                      <p className="text-gray-900">{formatDate(selectedContract.signedDate)}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Ngày bắt đầu</label>
                      <p className="text-gray-900">{formatDate(selectedContract.startDate)}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Ngày kết thúc</label>
                      <p className="text-gray-900">{formatDate(selectedContract.endDate)}</p>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                    Thông tin bổ sung
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Điều khoản và điều kiện</label>
                      <p className="text-gray-900 text-sm whitespace-pre-wrap">
                        {selectedContract.termsAndConditions || '--'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Ghi chú</label>
                      <p className="text-gray-900 text-sm whitespace-pre-wrap">
                        {selectedContract.notes || '--'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'file' && (
            <div className="p-6">
              <div className="text-center">
                {selectedContract.contractFileUrl ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 mx-auto bg-red-100 rounded-lg flex items-center justify-center">
                      <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-5L9 2H4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">File hợp đồng</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Nhấn vào nút bên dưới để tải xuống file hợp đồng
                      </p>
                    </div>
                    <button
                      onClick={handleDownloadFile}
                      disabled={fileLoading}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {fileLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Đang tải...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Tải xuống file
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="text-gray-500">
                    <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="mt-2">Không có file hợp đồng</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'approval' && (
            <div className="p-6">
              <useContractApproval
                contract={selectedContract}
                onApprovalSuccess={onApprovalSuccess}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContractDetail;