// src/components/Contract/ContractDetail.js
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ContractContext } from '../../context/ContractContext';
import { contractServices } from '../../api/contract.service';
import useAuth from '../../hooks/useAuth';
import { notificationService } from '../../api/notification.service';
import RejectContractModal from '../modal/RejectContractModal';
import ApprovalContractModal from '../modal/ApprovalContractModal';

const ContractDetail = ({ contractId, contract, onClose, onApprovalSuccess, onError, isPage = false }) => {
  const {
    selectedContract,
    loading,
    error,
    fetchContractDetail,
    clearError
  } = useContext(ContractContext);

  // Lấy thông tin user từ auth context
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('details');
  const [fileLoading, setFileLoading] = useState(false);
  const [localContract, setLocalContract] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState(null);
  
  // Modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  // Ưu tiên sử dụng contract prop, sau đó mới là selectedContract từ context
  const displayContract = localContract || contract || selectedContract;
  const isLoading = localLoading || loading;
  const currentError = localError || error;

  useEffect(() => {
    console.log('🔥 ContractDetail useEffect');
    console.log('contractId:', contractId, typeof contractId);
    console.log('contract prop:', contract);
    
    // Nếu đã có contract từ prop, sử dụng luôn
    if (contract) {
      console.log('✅ Using contract from prop');
      setLocalContract(contract);
      return;
    }

    // Nếu có contractId, fetch trực tiếp từ API thật
    if (contractId) {
      fetchContractFromAPI(contractId);
    }
  }, [contractId, contract]);

  // Hàm fetch contract từ API thật
  const fetchContractFromAPI = async (id) => {
    try {
      setLocalLoading(true);
      setLocalError(null);
      
      console.log('🔄 Fetching contract from REAL API with ID:', id);
      
      // SỬ DỤNG contractServices THẬT
      const contractData = await contractServices.getContractById(id);
      
      if (contractData) {
        setLocalContract(contractData);
        console.log('✅ Contract loaded successfully from API:', contractData);
      } else {
        throw new Error('Không tìm thấy dữ liệu hợp đồng');
      }
      
    } catch (err) {
      console.error('❌ API fetch failed:', err);
      const errorMessage = `Không thể tải thông tin hợp đồng: ${err.message}`;
      setLocalError(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setLocalLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount, currency = 'VND') => {
    if (!amount) return '0 ₫';
    
    // Nếu là phần trăm (%), hiển thị số với ký hiệu %
    if (currency === '%' || currency === 'Phần trăm' || currency === 'percent') {
      return `${parseFloat(amount).toFixed(2)}%`;
    }
    
    // Format tiền tệ bình thường
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  // Improved displayValue with better fallback
  const displayValue = (value, fallback = 'Chưa có dữ liệu') => {
    if (value === null || 
        value === undefined || 
        value === '' || 
        value === 'null' ||
        value === 'undefined') {
      return fallback;
    }
    return String(value);
  };

  // Helper function to get field value with multiple possible names
  const getFieldValue = (obj, ...fieldNames) => {
    for (const fieldName of fieldNames) {
      const value = obj[fieldName];
      if (value !== null && 
          value !== undefined && 
          value !== '' &&
          value !== 'null' &&
          value !== 'undefined') {
        return value;
      }
    }
    return null;
  };

  // Format date với xử lý lỗi tốt hơn
  const formatDate = (dateString) => {
    if (!dateString || 
        dateString === null || 
        dateString === undefined || 
        dateString === 'null' || 
        dateString === 'undefined' ||
        dateString === '') {
      return 'Chưa có dữ liệu';
    }
    
    try {
      let date;
      
      if (dateString instanceof Date) {
        date = dateString;
      } else if (typeof dateString === 'number') {
        date = new Date(dateString);
      } else if (typeof dateString === 'string') {
        date = new Date(dateString);
        if (isNaN(date.getTime())) {
          date = new Date(dateString.replace(/\s/g, 'T'));
        }
      }
      
      if (isNaN(date.getTime())) {
        return 'Ngày không hợp lệ';
      }
      
      const formatted = date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      return formatted;
    } catch (error) {
      console.error('ContractDetail formatDate error:', error);
      return 'Lỗi định dạng ngày';
    }
  };

  // Get status info
  const getStatusInfo = (status) => {
    const statusConfig = {
      draft: {
        label: 'Nháp',
        bgColor: 'bg-slate-50',
        textColor: 'text-slate-700',
        borderColor: 'border-slate-200',
        icon: '📝',
        ringColor: 'ring-slate-100'
      },
      pending: {
        label: 'Chờ duyệt',
        bgColor: 'bg-amber-50',
        textColor: 'text-amber-700',
        borderColor: 'border-amber-200',
        icon: '⏱️',
        ringColor: 'ring-amber-100'
      },
      active: {
        label: 'Đang hiệu lực',
        bgColor: 'bg-emerald-50',
        textColor: 'text-emerald-700',
        borderColor: 'border-emerald-200',
        icon: '✅',
        ringColor: 'ring-emerald-100'
      },
      expired: {
        label: 'Hết hạn',
        bgColor: 'bg-gray-50',
        textColor: 'text-gray-600',
        borderColor: 'border-gray-200',
        icon: '⏳',
        ringColor: 'ring-gray-100'
      },
      terminated: {
        label: 'Đã chấm dứt',
        bgColor: 'bg-red-50',
        textColor: 'text-red-700',
        borderColor: 'border-red-200',
        icon: '🚫',
        ringColor: 'ring-red-100'
      },
      cancelled: {
        label: 'Đã hủy',
        bgColor: 'bg-red-50',
        textColor: 'text-red-700',
        borderColor: 'border-red-200',
        icon: '❌',
        ringColor: 'ring-red-100'
      }
    };
    return statusConfig[status] || statusConfig.draft;
  };

  // Handle file download sử dụng API thật
  const handleDownloadFile = async () => {
    if (!displayContract?.contract_file_url) {
      
      return;
    }

    try {
      setFileLoading(true);
      
      console.log('🔄 Downloading file from REAL API:', displayContract.contract_id);
      
      // SỬ DỤNG contractServices THẬT
      const blob = await contractServices.downloadContractFile(displayContract.contract_id);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `contract-${displayContract.contract_number || displayContract.contract_id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ File downloaded successfully');
    } catch (error) {
      console.error('❌ Download failed:', error);
      
    } finally {
      setFileLoading(false);
    }
  };

  // Format date cho approval
  const formatApprovalDate = (dateString) => {
    if (!dateString) return 'Chưa có thông tin';

    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false
    }).format(new Date(dateString));
  };

  // Approve contract sử dụng API thật
  const handleApprove = () => {
    setShowApprovalModal(true);
  };

  const handleApproveConfirm = async (note = '') => {
    try {
      console.log('🔄 Approving contract via REAL API');
      console.log('Full contract object:', displayContract);
      console.log('Contract ID options:', {
        contract_id: displayContract?.contract_id,
        contractId: displayContract?.contractId,
        id: displayContract?.id,
        _id: displayContract?._id
      });
      
      // Tìm contract ID thực sự
      const actualContractId = displayContract?.contract_id || 
                              displayContract?.contractId || 
                              displayContract?.id || 
                              displayContract?._id;
      
      console.log('Actual Contract ID to use:', actualContractId);
      
      // Validate contract ID
      if (!actualContractId) {
        throw new Error('Không tìm thấy Contract ID hợp lệ trong object');
      }

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(actualContractId)) {
        console.warn('⚠️ Contract ID is not a valid UUID:', actualContractId);
        console.log('Contract ID type:', typeof actualContractId);
        console.log('Will try to use it anyway, backend might accept non-UUID');
      }

      // Lấy user info từ auth context
      const userId = user?.userId || user?.id || 'admin';
      
      console.log('Current user from auth:', user);
      console.log('Using userId for approval:', userId);
      console.log('Token available:', !!token);
      
      // Chuẩn bị data approval
      const approvalData = {
        approvedBy: userId, // Sử dụng approvedBy thay vì approved_by
        notes: 'Đã duyệt'
      };

      // Kiểm tra và thêm signed_date nếu contract chưa có
      if (!displayContract?.signed_date && !displayContract?.signedDate) {
        approvalData.signed_date = new Date().toISOString();
        console.log('✅ Adding signed_date for approval:', approvalData.signed_date);
      }

      // SỬ DỤNG contractServices THẬT với actualContractId
      const result = await contractServices.approveContract(actualContractId, approvalData);

      console.log('✅ Approval successful:', result);
      
      // Cập nhật local contract với dữ liệu mới từ API
      setLocalContract(prev => {
        const updatedContract = {
          ...prev,
          status: 'active',
          approved_by: userId,
          approved_at: new Date().toISOString()
        };

        // Thêm signed_date nếu được set trong approval
        if (approvalData.signed_date) {
          updatedContract.signed_date = approvalData.signed_date;
          console.log('✅ Updated local contract with signed_date:', updatedContract.signed_date);
        }

        return updatedContract;
      });

      // Gửi thông báo cho hotel owner
      try {
        const hotelOwnerId = displayContract?.user_id || displayContract?.userId;
        const hotelName = displayContract?.hotel?.name || displayContract?.hotelName || 'N/A';
        const oldStatus = displayContract?.status || 'pending';
        
        console.log('=== CONTRACT NOTIFICATION DEBUG ===');
        console.log('displayContract:', displayContract);
        console.log('actualContractId:', actualContractId);
        console.log('userId (sender):', userId);
        console.log('hotelOwnerId (receiver):', hotelOwnerId);
        console.log('hotelName:', hotelName);
        console.log('oldStatus:', oldStatus);
        
        if (hotelOwnerId) {
          let message = `Trạng thái hợp đồng của khách sạn: ${hotelName}, đã chuyển trạng thái: ${oldStatus} sang trạng thái: active`;
          
          // Thêm ghi chú vào message nếu có
          if (note && note.trim()) {
            message += `. Ghi chú: ${note.trim()}`;
          }
          
          const hotelId = displayContract?.hotel_id || displayContract?.hotelId;
          console.log('hotelId from contract (approve):', hotelId);
          
          const notificationData = {
            contract_id: actualContractId,
            senderId: userId,
            receiverId: hotelOwnerId,
            title: 'Thay đổi trạng thái của hợp đồng',
            message: message,
            notification_type: 'Change Status Contract',
            hotelId: hotelId
          };
          
          console.log('Contract notification data:', notificationData);
          
          await notificationService.sendHotelStatusChangeNotification(notificationData);
          
          console.log('✅ Notification sent successfully for contract approval');
        } else {
          console.warn('⚠️ Could not send notification: hotel owner ID not found');
        }
      } catch (notificationError) {
        console.error('❌ Error sending notification:', notificationError);
        // Không throw error vì notification không phải critical
      }

      if (onApprovalSuccess) {
        onApprovalSuccess('Phê duyệt hợp đồng thành công!');
      }
      
    } catch (error) {
      console.error( error);
    }
  };

  // Handle view hotel detail
  const handleViewHotelDetail = (hotelId) => {
    console.log('🏨 Opening hotel detail for ID:', hotelId);
    if (hotelId) {
      // Điều hướng đến trang hotel detail trong cùng ứng dụng
      navigate(`/admin/hotels/${hotelId}`);
    } else {
      console.error('Hotel ID is missing');
    }
  };

  // Reject contract sử dụng API thật
  const handleReject = () => {
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async (reason) => {

    try {
      console.log('🔄 Rejecting contract via REAL API');
      console.log('Full contract object:', displayContract);
      console.log('Contract ID options:', {
        contract_id: displayContract?.contract_id,
        contractId: displayContract?.contractId,
        id: displayContract?.id,
        _id: displayContract?._id
      });
      
      // Tìm contract ID thực sự
      const actualContractId = displayContract?.contract_id || 
                              displayContract?.contractId || 
                              displayContract?.id || 
                              displayContract?._id;
      
      console.log('Actual Contract ID to use:', actualContractId);
      
      // Validate contract ID
      if (!actualContractId) {
        throw new Error('Không tìm thấy Contract ID hợp lệ trong object');
      }

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(actualContractId)) {
        console.warn('⚠️ Contract ID is not a valid UUID:', actualContractId);
        console.log('Contract ID type:', typeof actualContractId);
        console.log('Will try to use it anyway, backend might accept non-UUID');
      }

      // Lấy user info từ auth context
      const userId = user?.userId || user?.id || 'admin';
      
      console.log('Current user from auth:', user);
      console.log('Using userId for rejection:', userId);
      console.log('Token available:', !!token);
      
      // SỬ DỤNG contractServices THẬT với actualContractId
      const result = await contractServices.rejectContract(actualContractId, {
        approvedBy: userId, // Sử dụng approvedBy thay vì approved_by
        notes: reason.trim() // Sử dụng lý do từ user
      });

      console.log('✅ Rejection successful:', result);
      
      // Cập nhật local contract với dữ liệu mới từ API
      setLocalContract(prev => ({
        ...prev,
        status: 'cancelled',
        approved_by: userId,
        approved_at: new Date().toISOString()
      }));

      // Gửi thông báo cho hotel owner
      try {
        const hotelOwnerId = displayContract?.user_id || displayContract?.userId;
        const hotelName = displayContract?.hotel?.name || displayContract?.hotelName || 'N/A';
        const oldStatus = displayContract?.status || 'pending';
        
        console.log('=== CONTRACT REJECT NOTIFICATION DEBUG ===');
        console.log('displayContract:', displayContract);
        console.log('actualContractId:', actualContractId);
        console.log('userId (sender):', userId);
        console.log('hotelOwnerId (receiver):', hotelOwnerId);
        console.log('hotelName:', hotelName);
        console.log('oldStatus:', oldStatus);
        console.log('reason:', reason);
        
        if (hotelOwnerId) {
          let message = `Trạng thái hợp đồng của khách sạn: ${hotelName}, đã chuyển trạng thái: ${oldStatus} sang trạng thái: cancelled`;
          
          // Thêm lý do từ chối vào message
          if (reason && reason.trim()) {
            message += `. Lý do từ chối: ${reason.trim()}`;
          }
          
          const hotelId = displayContract?.hotel_id || displayContract?.hotelId;
          console.log('hotelId from contract (reject):', hotelId);
          
          const notificationData = {
            contract_id: actualContractId,
            senderId: userId,
            receiverId: hotelOwnerId,
            title: 'Thay đổi trạng thái của hợp đồng',
            message: message,
            notification_type: 'Change Status Contract',
            hotelId: hotelId
          };
          
          console.log('Contract reject notification data:', notificationData);
          
          await notificationService.sendHotelStatusChangeNotification(notificationData);
          
          console.log('✅ Notification sent successfully for contract rejection');
        } else {
          console.warn('⚠️ Could not send notification: hotel owner ID not found');
        }
      } catch (notificationError) {
        console.error('❌ Error sending notification:', notificationError);
        // Không throw error vì notification không phải critical
      }

      if (onApprovalSuccess) {
        onApprovalSuccess('Từ chối hợp đồng thành công!');
      }
      
    } catch (error) {
      console.error( error);
      
    }
  };

  if (isLoading) {
    const LoadingComponent = () => (
      <div className="flex flex-col items-center justify-center py-16 space-y-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-orange-100 border-t-orange-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-gray-900">Đang tải thông tin hợp đồng từ API</h3>
          <p className="text-sm text-gray-500">Vui lòng chờ trong giây lát...</p>
          <div className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full inline-block">
            ID: {contractId}
          </div>
        </div>
      </div>
    );

    if (isPage) {
      return (
        <div className="min-h-screen bg-gray-50">
          <LoadingComponent />
        </div>
      );
    }
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
          <LoadingComponent />
        </div>
      </div>
    );
  }

  if (currentError) {
    const ErrorComponent = () => (
      <div className="text-center py-12 space-y-6">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-gray-900">Có lỗi xảy ra</h3>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">{currentError}</p>
            <p className="text-red-600 text-sm mt-1">Contract ID: {contractId}</p>
          </div>
        </div>
        <div className="flex justify-center space-x-3">
          <button
            onClick={() => {
              setLocalError(null);
              if (clearError) clearError();
              if (fetchContractDetail) fetchContractDetail(contractId);
            }}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
          >
            🔄 Thử lại
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Đóng
          </button>
        </div>
      </div>
    );

    if (isPage) {
      return (
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-2xl mx-auto">
            <ErrorComponent />
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full">
          <ErrorComponent />
        </div>
      </div>
    );
  }

  if (!displayContract) {
    console.log('❌ NO DISPLAY CONTRACT - checking API connection');
    
    const NoDataComponent = () => (
      <div className="text-center py-16 space-y-6">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">Không tìm thấy dữ liệu hợp đồng</h3>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left">
            <h4 className="font-semibold text-gray-700 mb-2">Thông tin debug:</h4>
            <div className="text-sm space-y-1 text-gray-600">
              <p><span className="font-medium">Contract ID:</span> {contractId || 'Không có'}</p>
              <p><span className="font-medium">API Service:</span> contractServices</p>
              <p><span className="font-medium">Method:</span> getContractById()</p>
            </div>
          </div>
        </div>
        <div className="flex justify-center space-x-3">
          <button
            onClick={() => {
              console.log('🔄 Manual retry fetch from API');
              setLocalError(null);
              if (contractId) {
                fetchContractFromAPI(contractId);
              }
            }}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium shadow-md"
          >
            🔄 Thử lại từ API
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Đóng
          </button>
        </div>
      </div>
    );

    if (isPage) {
      return (
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-2xl mx-auto">
            <NoDataComponent />
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full">
          <NoDataComponent />
        </div>
      </div>
    );
  }

  // Debug logs - CHI TIẾT HƠN VỀ TỪNG FIELD
  console.log('✅ DISPLAY CONTRACT FOUND!');
  console.log('🔍 displayContract:', displayContract);
  console.log('🔍 All Keys:', Object.keys(displayContract));
  
  // Check each important field individually
  const fieldChecks = {
    contract_id: displayContract.contract_id,
    contract_number: displayContract.contract_number,
    contract_type: displayContract.contract_type,
    title: displayContract.title,
    description: displayContract.description,
    status: displayContract.status,
    hotel_id: displayContract.hotel_id,
    user_id: displayContract.user_id,
    created_at: displayContract.created_at,
    start_date: displayContract.start_date,
    end_date: displayContract.end_date,
    signed_date: displayContract.signed_date,
    contract_value: displayContract.contract_value,
    currency: displayContract.currency,
    payment_terms: displayContract.payment_terms,
    terms_and_conditions: displayContract.terms_and_conditions,
    notes: displayContract.notes,
    contract_file_url: displayContract.contract_file_url
  };
  
  console.log('🔍 Field by field check:', fieldChecks);
  
  // Count empty fields
  const emptyFields = Object.entries(fieldChecks).filter(([key, value]) => 
    value === null || value === undefined || value === '' || value === 'null'
  );
  console.log(`📊 Empty fields (${emptyFields.length}):`, emptyFields);

  const statusInfo = getStatusInfo(displayContract.status);

  const ContractContent = () => (
    <>
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-8 py-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-5L9 2H4z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                Chi tiết hợp đồng
              </h2>
              <p className="text-orange-100 text-sm font-medium">
                {(() => {
                  // Debug contract number
                  const contractNumber = getFieldValue(displayContract, 'contract_number', 'contractNumber', 'number', 'contract_id');
                  console.log('🔍 Contract Number Debug:', {
                    contract_number: displayContract.contract_number,
                    contractNumber: displayContract.contractNumber, 
                    number: displayContract.number,
                    contract_id: displayContract.contract_id,
                    finalValue: contractNumber
                  });
                  
                  return displayValue(contractNumber, `Hợp đồng #${displayContract.contract_id || 'N/A'}`);
                })()}
              </p>
              <p className="text-orange-200 text-xs">
                {displayContract.contract_id}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`px-4 py-2 rounded-full text-sm font-semibold shadow-md ring-2 ${statusInfo.bgColor} ${statusInfo.textColor} ${statusInfo.ringColor}`}>
              <span className="mr-2">{statusInfo.icon}</span>
              {statusInfo.label}
            </div>
            {!isPage && (
              <button
                onClick={onClose}
                className="text-white hover:text-orange-100 transition-colors p-2 hover:bg-white hover:bg-opacity-10 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Tabs */}
      <div className="bg-white border-b border-gray-200 px-8">
        <div className="flex space-x-0">
          {[
            { key: 'details', label: 'Thông tin chi tiết', icon: '📋' },
            { key: 'file', label: 'File hợp đồng', icon: '📄' },
            { key: 'approval', label: 'Xét duyệt', icon: '✓' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-4 px-6 border-b-3 font-medium text-sm transition-all duration-200 ${
                activeTab === tab.key
                  ? 'border-orange-500 text-orange-600 bg-orange-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Enhanced Content */}
      <div className="overflow-y-auto max-h-[calc(90vh-200px)] bg-gray-50">
        {activeTab === 'details' && (
          <div className="p-8 space-y-8">
            {/* Contract Overview Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <span className="mr-3">📊</span>
                  Tổng quan hợp đồng
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                    <label className="text-xs font-semibold text-orange-600 uppercase tracking-wider">ID hợp đồng</label>
                    <p className="text-lg font-bold text-orange-900 mt-1">{displayValue(
                      getFieldValue(displayContract, 'contract_id', 'contractId', 'id'),
                      'Không có ID'
                    )}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                    <label className="text-xs font-semibold text-green-600 uppercase tracking-wider">Số hợp đồng</label>
                    <p className="text-lg font-bold text-green-900 mt-1">{displayValue(
                      getFieldValue(displayContract, 'contract_number', 'contractNumber', 'number'),
                      'Chưa có số hợp đồng'
                    )}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                    <label className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Loại hợp đồng</label>
                    <p className="text-lg font-bold text-purple-900 mt-1">{displayValue(
                      getFieldValue(displayContract, 'contract_type', 'contractType', 'type'),
                      'Chưa xác định loại'
                    )}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Basic Information Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <span className="mr-3">ℹ️</span>
                  Thông tin cơ bản
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                          <path fillRule="evenodd" d="M4 5a2 2 0 002-2v1a1 1 0 102 0V3h6v1a1 1 0 102 0V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <label className="text-sm font-semibold text-gray-600 block mb-1">Tiêu đề</label>
                        <p className="text-gray-900 text-base leading-relaxed">{displayValue(
                          getFieldValue(displayContract, 'title'),
                          'Chưa có tiêu đề'
                        )}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <label className="text-sm font-semibold text-gray-600 block mb-1">Trạng thái</label>
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.textColor} border ${statusInfo.borderColor}`}>
                          <span className="mr-2">{statusInfo.icon}</span>
                          {statusInfo.label}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-5L9 2H4z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <label className="text-sm font-semibold text-gray-600 block mb-1">Khách sạn ID</label>
                        <div className="flex items-center space-x-3">
                          <p className="text-gray-900 text-base">{displayValue(
                            getFieldValue(displayContract, 'hotel_id', 'hotelId'),
                            'Chưa liên kết khách sạn'
                          )}</p>
                          {getFieldValue(displayContract, 'hotel_id', 'hotelId') && (
                            <button
                              onClick={() => handleViewHotelDetail(getFieldValue(displayContract, 'hotel_id', 'hotelId'))}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200 transform hover:scale-105"
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              Xem chi tiết
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <label className="text-sm font-semibold text-gray-600 block mb-1">Người tạo ID</label>
                        <p className="text-gray-900 text-base">{displayValue(
                          getFieldValue(displayContract, 'user_id', 'userId', 'created_by'),
                          'Chưa xác định người tạo'
                        )}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <svg className="w-4 h-4 text-rose-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <label className="text-sm font-semibold text-gray-600 block mb-1">Ngày tạo</label>
                        <p className="text-gray-900 text-base">{formatDate(
                          getFieldValue(displayContract, 'created_at', 'createdAt', 'dateCreated')
                        )}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <svg className="w-4 h-4 text-cyan-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <label className="text-sm font-semibold text-gray-600 block mb-1">Ngày bắt đầu</label>
                        <p className="text-gray-900 text-base font-medium">{formatDate(
                          getFieldValue(displayContract, 'start_date', 'startDate')
                        )}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <label className="text-sm font-semibold text-gray-600 block mb-1">Ngày kết thúc</label>
                        <p className="text-gray-900 text-base font-medium">{formatDate(
                          getFieldValue(displayContract, 'end_date', 'endDate')
                        )}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <label className="text-sm font-semibold text-gray-600 block mb-1">Ngày ký</label>
                        <p className="text-gray-900 text-base font-medium">{formatDate(
                          getFieldValue(displayContract, 'signed_date', 'signedDate')
                        )}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Information Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 px-6 py-4 border-b border-emerald-200">
                <h3 className="text-lg font-bold text-emerald-900 flex items-center">
                  <span className="mr-3">💰</span>
                  Thông tin tài chính
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl border border-emerald-200">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">
                        {(() => {
                          const currency = getFieldValue(displayContract, 'currency') || 'VND';
                          return (currency === '%' || currency === 'Phần trăm') ? 'Hoa hồng (%)' : 'Giá trị hợp đồng';
                        })()}
                      </label>
                      <div className="w-8 h-8 bg-emerald-200 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-emerald-700" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                        </svg>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-emerald-900">
                      {(() => {
                        const value = getFieldValue(displayContract, 'contract_value', 'contractValue', 'value');
                        const currency = getFieldValue(displayContract, 'currency') || 'VND';
                        return value ? formatCurrency(value, currency) : 'Chưa có giá trị';
                      })()}
                    </p>
                  </div>
                  
                  {(() => {
                    const currency = getFieldValue(displayContract, 'currency') || 'VND';
                    // Chỉ hiển thị card "Tiền tệ" nếu không phải là %
                    if (currency === '%' || currency === 'Phần trăm') {
                      return null;
                    }
                    return (
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Tiền tệ</label>
                          <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-700" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                            </svg>
                          </div>
                        </div>
                        <p className="text-xl font-bold text-blue-900">{displayValue(currency, 'VND (mặc định)')}</p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
              
            {/* Detailed Information Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <span className="mr-3">📝</span>
                  Thông tin chi tiết
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                  <label className="text-sm font-bold text-gray-700 flex items-center mb-3">
                    <svg className="w-4 h-4 mr-2 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 002-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
                    </svg>
                    Mô tả
                  </label>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <p className="text-gray-900 leading-relaxed">{displayValue(
                      getFieldValue(displayContract, 'description'),
                      'Chưa có mô tả chi tiết cho hợp đồng này.'
                    )}</p>
                  </div>
                </div>
                
                <div className="bg-amber-50 rounded-xl p-6 border border-amber-100">
                  <label className="text-sm font-bold text-amber-700 flex items-center mb-3">
                    <svg className="w-4 h-4 mr-2 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                    </svg>
                    Điều khoản thanh toán
                  </label>
                  <div className="bg-white rounded-lg p-4 border border-amber-200">
                    <p className="text-gray-900 leading-relaxed">{displayValue(
                      getFieldValue(displayContract, 'payment_terms', 'paymentTerms'),
                      'Chưa có điều khoản thanh toán được quy định.'
                    )}</p>
                  </div>
                </div>
                
                <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                  <label className="text-sm font-bold text-blue-700 flex items-center mb-3">
                    <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                    </svg>
                    Điều khoản và điều kiện
                  </label>
                  <div className="bg-white rounded-lg p-4 border border-blue-200 max-h-64 overflow-y-auto">
                    <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">{displayValue(
                      getFieldValue(displayContract, 'terms_and_conditions', 'termsAndConditions'),
                      'Chưa có điều khoản và điều kiện được thiết lập cho hợp đồng này.'
                    )}</p>
                  </div>
                </div>
                
                <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
                  <label className="text-sm font-bold text-purple-700 flex items-center mb-3">
                    <svg className="w-4 h-4 mr-2 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                    </svg>
                    Ghi chú
                  </label>
                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">{displayValue(
                      getFieldValue(displayContract, 'notes'),
                      'Không có ghi chú bổ sung nào.'
                    )}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'file' && (
          <div className="p-8">
            <div className="max-w-2xl mx-auto">
              {getFieldValue(displayContract, 'contract_file_url', 'contractFileUrl', 'fileUrl') ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="text-center py-12 space-y-6">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-red-50 to-red-100 rounded-2xl flex items-center justify-center shadow-sm border border-red-200">
                      <svg className="w-10 h-10 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-5L9 2H4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-xl font-bold text-gray-900">File hợp đồng có sẵn</h3>
                      <p className="text-gray-600 max-w-md mx-auto">
                        Tài liệu hợp đồng đã được tải lên hệ thống. Nhấn vào nút bên dưới để tải xuống.
                      </p>
                      <div className="bg-gray-50 rounded-lg p-3 text-left max-w-md mx-auto border">
                        <p className="text-xs font-medium text-gray-500 mb-1">Đường dẫn file:</p>
                        <p className="text-xs text-gray-600 break-all font-mono">
                          {getFieldValue(displayContract, 'contract_file_url', 'contractFileUrl', 'fileUrl')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleDownloadFile}
                      disabled={fileLoading}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-md text-white bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {fileLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                          Đang tải từ ...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          📄 Tải xuống file hợp đồng 
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="text-center py-16 space-y-6">
                    <div className="w-24 h-24 mx-auto bg-gray-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-300">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-xl font-bold text-gray-900">Chưa có file hợp đồng</h3>
                      <p className="text-gray-500 max-w-md mx-auto">
                        File hợp đồng chưa được tải lên hoặc đính kèm vào hệ thống.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'approval' && (
          <div className="p-8">
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Quản lý xét duyệt hợp đồng</h3>
                
              </div>

              {/* Status và approval actions sử dụng API thật */}
              {displayContract.status === 'pending' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                      <h4 className="text-lg font-bold text-gray-900 flex items-center">
                        <span className="mr-3">⚡</span>
                        Hành động xét duyệt 
                      </h4>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                          onClick={handleApprove}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                          <div className="flex items-center justify-center space-x-3">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Phê duyệt</span>
                          </div>
                        </button>

                        <button
                          onClick={handleReject}
                          className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                          <div className="flex items-center justify-center space-x-3">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span>Từ chối</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {displayContract.status === 'active' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
                  <h4 className="text-xl font-bold text-emerald-900 mb-2">🎉 Hợp đồng đã được phê duyệt</h4>
                  <p className="text-emerald-700">Hợp đồng này đã được phê duyệt và đang có hiệu lực.</p>
                </div>
              )}

              {displayContract.status === 'cancelled' && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                  <h4 className="text-xl font-bold text-red-900 mb-2">❌ Hợp đồng đã bị từ chối</h4>
                  <p className="text-red-700">Hợp đồng này đã bị từ chối và không có hiệu lực.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );

  if (isPage) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ContractContent />
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden shadow-2xl">
          <ContractContent />
        </div>
      </div>

      {/* Modals */}
      <RejectContractModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onConfirm={handleRejectConfirm}
        contractNumber={displayContract?.contract_number || displayContract?.contractNumber || 'N/A'}
      />

      <ApprovalContractModal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        onConfirm={handleApproveConfirm}
        contractNumber={displayContract?.contract_number || displayContract?.contractNumber || 'N/A'}
      />
    </>
  );
};

export default ContractDetail;