// src/pages/hotel_owner/contract_management/ContractManagement.js
import React, { useState, useEffect } from 'react';
import { contractServices } from '../../../api/contract.service';
import { hotelApiService } from '../../../api/hotel.service';
import { useHotel } from '../../../context/HotelContext';
import HotelOwnerContractTable from '../../../components/hotel_owner_contract/HotelOwnerContractTable';
import ContractDetail from '../../../components/hotel_owner_contract/HotelOwnerContractDetail';
import ContractForm from '../../../components/hotel_owner_contract/ContractForm';
import { getHotelOwnerPermissions } from './ContractStatusUtils';

const ContractManagement = () => {
  const { currentHotel } = useHotel();
  const [contracts, setContracts] = useState([]);
  const [approvedHotels, setApprovedHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedContract, setSelectedContract] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingContract, setEditingContract] = useState(null);

  // Hàm chuẩn hóa ngày
  const toISODate = (dateStr) => {
    if (!dateStr) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    if (typeof dateStr === 'string' && dateStr.includes('T')) return dateStr.split('T')[0];
    if (typeof dateStr === 'string' && dateStr.includes(' ')) return dateStr.split(' ')[0];
    if (dateStr instanceof Date) {
      return dateStr.toISOString().slice(0, 10);
    }
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toISOString().slice(0, 10);
      }
    } catch {}
    return '';
  };

  // Lấy tất cả hợp đồng
  const fetchAllContracts = async () => {
    setLoading(true);
    setError('');
    
    try {
      const res = await contractServices.getAllContracts();
      const allContracts = Array.isArray(res.data) ? res.data : [];
      
      // Lấy userId từ localStorage
      const userStr = localStorage.getItem('user') || localStorage.getItem('authUser');
      let currentUserId = null;
      
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          currentUserId = user?.user_id || user?.id || user?.userId;
        } catch (e) {
          console.error('Error parsing user:', e);
        }
      }
      
      // Filter theo userId
      let filteredContracts = allContracts;
      if (currentUserId) {
        filteredContracts = allContracts.filter(contract => {
          const contractUserId = contract.userId || contract.user_id || contract.createdBy || contract.created_by;
          return contractUserId === currentUserId;
        });
      }
      
      setContracts(filteredContracts);
    } catch (err) {
      setError(err.message || 'Lỗi khi lấy danh sách hợp đồng');
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  // Lấy danh sách khách sạn đã duyệt
  useEffect(() => {
    hotelApiService.getApprovedHotelsDropdown()
      .then(res => {
        const hotels = (res.data || []).map(hotel => ({
          ...hotel,
          hotel_id: hotel.hotel_id || hotel.hotelId
        }));
        setApprovedHotels(hotels);
      })
      .catch(() => setApprovedHotels([]));
  }, []);

  useEffect(() => {
    fetchAllContracts();
  }, [currentHotel?.hotel_id]);

  // Xử lý xem chi tiết
  const handleViewDetail = (contract) => {
    setSelectedContract(contract);
    setShowDetail(true);
  };

  const handleCloseDetail = () => {
    setSelectedContract(null);
    setShowDetail(false);
  };

  // XỬ LÝ CHỈNH SỬA HỢP ĐỒNG - FIXED VERSION
  const handleEditContract = async (contract) => {
    try {
      console.log('=== EDIT CONTRACT DEBUG ===');
      console.log('1. Contract from table:', contract);
      
      const contractId = contract.contract_id || contract.contractId || contract.id;
      console.log('2. Contract ID:', contractId);
      
      if (!contractId) {
        setError('Không tìm thấy ID hợp đồng');
        return;
      }

      setLoading(true);
      
      try {
        // Gọi API để lấy dữ liệu mới nhất
        const response = await contractServices.getContractById(contractId);
        console.log('3. API Response:', response);
        
        const contractData = response.data || response;
        console.log('4. Contract data for edit:', contractData);
        
        if (!contractData) {
          throw new Error('Không thể lấy dữ liệu hợp đồng');
        }

        // Chuẩn hóa dữ liệu cho form
        const normalizedData = {
          contract_id: contractData.contract_id || contractData.contractId,
          title: contractData.title || '',
          description: contractData.description || '',
          contract_type: contractData.contract_type || contractData.contractType || 'service',
          contract_value: String(contractData.contract_value || contractData.contractValue || ''),
          currency: contractData.currency || 'VND',
          start_date: contractData.start_date || contractData.startDate || '',
          end_date: contractData.end_date || contractData.endDate || '',
          payment_terms: contractData.payment_terms || contractData.paymentTerms || '',
          terms_and_conditions: contractData.terms_and_conditions || contractData.termsAndConditions || '',
          notes: contractData.notes || '',
          signed_date: contractData.signed_date || contractData.signedDate || '',
          contract_file_url: contractData.contract_file_url || contractData.contractFileUrl || '',
          hotel_id: contractData.hotel_id || contractData.hotelId || '',
        };

        console.log('5. Normalized data for form:', normalizedData);
        
        setEditingContract(normalizedData);
        setShowCreateForm(true);
        setError('');
        
      } catch (apiError) {
        console.warn('API call failed, using contract data from table:', apiError);
        // Fallback: sử dụng dữ liệu từ bảng
        const fallbackData = {
          contract_id: contract.contract_id || contract.contractId,
          title: contract.title || '',
          description: contract.description || '',
          contract_type: contract.contract_type || contract.contractType || 'service',
          contract_value: String(contract.contract_value || contract.contractValue || ''),
          currency: contract.currency || 'VND',
          start_date: contract.start_date || contract.startDate || '',
          end_date: contract.end_date || contract.endDate || '',
          payment_terms: contract.payment_terms || contract.paymentTerms || '',
          terms_and_conditions: contract.terms_and_conditions || contract.termsAndConditions || '',
          notes: contract.notes || '',
          signed_date: contract.signed_date || contract.signedDate || '',
          contract_file_url: contract.contract_file_url || contract.contractFileUrl || '',
          hotel_id: contract.hotel_id || contract.hotelId || '',
        };
        
        setEditingContract(fallbackData);
        setShowCreateForm(true);
        setError('');
      }
      
    } catch (err) {
      console.error('handleEditContract Error:', err);
      setError('Lỗi khi mở form chỉnh sửa: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý lưu hợp đồng - FIXED VERSION
  const handleSaveContract = async (formData) => {
    try {
      setLoading(true);
      setError('');

      // Validation
      if (!formData.title?.trim()) {
        throw new Error('Tiêu đề không được để trống');
      }
      if (!formData.contract_value || parseFloat(formData.contract_value) <= 0) {
        throw new Error('Giá trị hợp đồng phải lớn hơn 0');
      }
      if (!formData.start_date || !formData.end_date) {
        throw new Error('Vui lòng chọn ngày bắt đầu và kết thúc');
      }
      if (!formData.hotel_id) {
        throw new Error('Vui lòng chọn khách sạn');
      }
      if (new Date(formData.start_date) >= new Date(formData.end_date)) {
        throw new Error('Ngày kết thúc phải sau ngày bắt đầu');
      }

      // Chuẩn hóa dữ liệu
      const contractData = {
        ...formData,
        contract_value: parseFloat(formData.contract_value),
        start_date: toISODate(formData.start_date),
        end_date: toISODate(formData.end_date),
        signed_date: formData.signed_date ? toISODate(formData.signed_date) : null,
      };

      console.log('=== SAVE CONTRACT DEBUG ===');
      console.log('Form data:', formData);
      console.log('Contract data to send:', contractData);
      console.log('Is editing?', !!editingContract?.contract_id);

      // Tạo hoặc cập nhật
      if (editingContract?.contract_id) {
        console.log('Updating contract:', editingContract.contract_id);
        await contractServices.updateContract(editingContract.contract_id, contractData);
        alert('✅ Cập nhật hợp đồng thành công!');
      } else {
        console.log('Creating new contract');
        await contractServices.createContract(contractData);
        alert('✅ Tạo hợp đồng thành công!');
      }
      
      // Refresh danh sách và đóng form
      await fetchAllContracts();
      setShowCreateForm(false);
      setEditingContract(null);
      setError('');
      
    } catch (err) {
      console.error('Error saving contract:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Lỗi khi lưu hợp đồng';
      setError(errorMessage);
      alert('❌ ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý xóa hợp đồng - IMPROVED VERSION
  const handleDeleteContract = async (contractId) => {
    if (!contractId) {
      setError('Không tìm thấy ID hợp đồng');
      return;
    }

    if (!window.confirm('Bạn có chắc chắn muốn xóa hợp đồng này?')) {
      return;
    }

    try {
      setLoading(true);
      await contractServices.deleteContract(contractId);
      alert('✅ Xóa hợp đồng thành công!');
      await fetchAllContracts();
      setError('');
    } catch (err) {
      console.error('Error deleting contract:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Lỗi khi xóa hợp đồng';
      setError(errorMessage);
      alert('❌ ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý gửi duyệt - FIXED VERSION with proper debugging
  const handleSendForApproval = async (contractId) => {
    console.log('=== HANDLE SEND FOR APPROVAL ===');
    console.log('Contract ID received:', contractId);
    
    if (!contractId) {
      setError('Không tìm thấy ID hợp đồng');
      return;
    }

    if (!window.confirm('Bạn có chắc chắn muốn gửi hợp đồng này để chờ duyệt?')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      console.log('Calling sendForApproval with ID:', contractId);
      
      // 🆕 Sử dụng method mới cho hotel owner
      const result = await contractServices.sendForApproval(contractId);
      
      console.log('Send for approval successful:', result);
      
      alert('✅ Gửi hợp đồng chờ duyệt thành công!');
      await fetchAllContracts();
      
    } catch (err) {
      console.error('Error sending for approval:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Lỗi khi gửi hợp đồng chờ duyệt';
      setError(errorMessage);
      alert('❌ ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý tạo mới - IMPROVED VERSION
  const handleCreateNew = () => {
    setEditingContract(null); // Reset editing contract
    setShowCreateForm(true);
    setError('');
  };

  // Xử lý hủy form - MISSING FUNCTION
  const handleCancelCreate = () => {
    setShowCreateForm(false);
    setEditingContract(null);
    setError('');
  };

  return (
    <div className="contract-management-page max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Hiển thị error */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-blue-700">Quản lý hợp đồng khách sạn</h2>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded shadow disabled:opacity-50"
          onClick={handleCreateNew}
          disabled={loading}
        >
          + Tạo hợp đồng mới
        </button>
      </div>

      {/* Form tạo/sửa hợp đồng */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-xl"
              onClick={handleCancelCreate}
            >
              &times;
            </button>
            <ContractForm
              onSave={handleSaveContract}
              onCancel={handleCancelCreate}
              contract={editingContract}
              hotels={approvedHotels}
            />
          </div>
        </div>
      )}

      {/* Bảng hợp đồng */}
      <div className="bg-gray-50 p-4 rounded-lg shadow mb-6">
        <HotelOwnerContractTable
          contracts={contracts.map(contract => ({
            ...contract,
            permissions: getHotelOwnerPermissions(contract.status)
          }))}
          loading={loading}
          onViewDetail={handleViewDetail}
          showActions={true}
          onEdit={handleEditContract}
          onDelete={handleDeleteContract}
          onSendForApproval={handleSendForApproval}
        />
      </div>

      {/* Modal chi tiết hợp đồng */}
      {showDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl relative">
            <ContractDetail
              contract={selectedContract}
              onClose={handleCloseDetail}
              isPage={false}
            />
          </div>
        </div>
      )}
    </div>
  );
};


export default ContractManagement;

