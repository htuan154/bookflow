// src/pages/hotel_owner/contract_management/ContractManagement.js
import React, { useState, useEffect, useMemo } from 'react';
import { contractServices } from '../../../api/contract.service';
import { hotelApiService } from '../../../api/hotel.service';
import { useHotel } from '../../../context/HotelContext';
import HotelOwnerContractTable from '../../../components/hotel_owner_contract/HotelOwnerContractTable';
import ContractDetail from '../../../components/hotel_owner_contract/HotelOwnerContractDetail';
import ContractForm from '../../../components/hotel_owner_contract/ContractForm';
import { getHotelOwnerPermissions } from './ContractStatusUtils';
import Toast from '../../../components/common/Toast';
import { useToast } from '../../../hooks/useToast';

const ContractManagement = () => {
  const { currentHotel } = useHotel();
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [contracts, setContracts] = useState([]);
  const [approvedHotels, setApprovedHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedContract, setSelectedContract] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingContract, setEditingContract] = useState(null);

  const [renewModal, setRenewModal] = useState({ open: false, contract: null });
  const [renewMessage, setRenewMessage] = useState('');

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
          currency: contractData.currency || 'Phần trăm',
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
      const commissionValue = parseFloat(formData.contract_value);
      if (isNaN(commissionValue) || commissionValue < 0 || commissionValue > 100) {
        throw new Error('Tỷ lệ hoa hồng phải từ 0 đến 100%');
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
        showSuccess('Cập nhật hợp đồng thành công!');
      } else {
        console.log('Creating new contract');
        await contractServices.createContract(contractData);
        showSuccess('Tạo hợp đồng thành công!');
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
      showError(errorMessage);
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
      showSuccess('Xóa hợp đồng thành công!');
      await fetchAllContracts();
      setError('');
    } catch (err) {
      console.error('Error deleting contract:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Lỗi khi xóa hợp đồng';
      setError(errorMessage);
      showError(errorMessage);
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
      
      showSuccess('Gửi hợp đồng chờ duyệt thành công!');
      await fetchAllContracts();
      
    } catch (err) {
      console.error('Error sending for approval:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Lỗi khi gửi hợp đồng chờ duyệt';
      setError(errorMessage);
      showError(errorMessage);
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

  // Kiểm tra hợp đồng sắp hết hạn hoặc đã hết hạn
  const getContractExpiryStatus = (contract) => {
    if (!contract?.end_date) return null;
    const endDate = new Date(contract.end_date);
    const now = new Date();
    const diffMonths = (endDate.getFullYear() - now.getFullYear()) * 12 + (endDate.getMonth() - now.getMonth());
    if (endDate < now) return 'expired';
    if (diffMonths <= 3 && diffMonths >= 0) return 'expiring';
    return null;
  };

  // Hiển thị thông báo hết hạn/sắp hết hạn
  const contractExpiryWarning = useMemo(() => {
    if (!contracts || contracts.length === 0) return null;
    const expiring = contracts.filter(c => getContractExpiryStatus(c) === 'expiring');
    const expired = contracts.filter(c => getContractExpiryStatus(c) === 'expired');
    if (expired.length > 0) {
      return {
        type: 'expired',
        contracts: expired,
        message: 'Hợp đồng đã hết hạn. Khách sạn sẽ không hoạt động. Vui lòng tiến hành gia hạn để tiếp tục hoạt động.'
      };
    }
    if (expiring.length > 0) {
      return {
        type: 'expiring',
        contracts: expiring,
        message: 'Hợp đồng sẽ hết hạn trong vòng 3 tháng. Vui lòng chuẩn bị gia hạn để khách sạn không bị gián đoạn hoạt động.'
      };
    }
    return null;
  }, [contracts]);

  // Handler mở modal gia hạn
  const handleRenewContract = (contract) => {
    setRenewModal({ open: true, contract });
    setRenewMessage('');
  };

  // Handler xác nhận gia hạn
  const handleRenewConfirm = async () => {
    if (!renewModal.contract) return;
    try {
      setLoading(true);
      // Ví dụ: Gia hạn thêm 1 năm từ ngày hết hạn cũ
      const oldEndDate = new Date(renewModal.contract.end_date);
      const newEndDate = new Date(oldEndDate.setFullYear(oldEndDate.getFullYear() + 1));
      await contractServices.renewContract(renewModal.contract.contract_id || renewModal.contract.contractId, {
        new_end_date: newEndDate.toISOString().slice(0, 10)
      });
      setRenewMessage('Gia hạn hợp đồng thành công!');
      await fetchAllContracts();
      setRenewModal({ open: false, contract: null });
    } catch (err) {
      setRenewMessage('Lỗi khi gia hạn hợp đồng: ' + (err.message || 'Không xác định'));
      setRenewModal({ open: false, contract: null });
    } finally {
      setLoading(false);
    }
  };

  const handleRenewCancel = () => {
    setRenewModal({ open: false, contract: null });
    setRenewMessage('');
  };

  return (
    <div className="contract-management-page w-full px-0 pt-0 pb-0 bg-transparent flex justify-center">
      <div className="w-full max-w-6xl">
        {/* Hiển thị error */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between mb-6 px-8 pt-8">
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
            {/* <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto"> */}
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
            {/* </div> */}
          </div>
        )}

        {/* Bảng hợp đồng */}
        <div className="bg-white p-6 rounded-xl shadow-lg w-full mx-0">
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

        {/* Thông báo hết hạn/sắp hết hạn hợp đồng */}
        {contractExpiryWarning && contractExpiryWarning.type && (
          <div className={`mb-4 p-3 rounded border ${contractExpiryWarning.type === 'expired' ? 'bg-red-100 border-red-400 text-red-700' : 'bg-yellow-100 border-yellow-400 text-yellow-800'}`}>
            <div className="font-semibold mb-2">
              {contractExpiryWarning.type === 'expired' ? 'Hợp đồng đã hết hạn!' : 'Hợp đồng sắp hết hạn!'}
            </div>
            <div>{contractExpiryWarning.message}</div>
            {contractExpiryWarning.contracts && contractExpiryWarning.contracts.length > 0 && (
              <ul className="mt-2 text-sm">
                {contractExpiryWarning.contracts.map(c => (
                  <li key={c.contract_id || c.contractId}>
                    <span className="font-bold">{c.title}</span> - Hết hạn: {c.end_date}
                    {contractExpiryWarning.type === 'expired' && (
                      <button
                        className="ml-2 px-2 py-1 bg-blue-600 text-white rounded text-xs"
                        onClick={() => handleRenewContract(c)}
                      >
                        Gia hạn hợp đồng
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Modal gia hạn hợp đồng */}
        {renewModal.open && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4 text-blue-700">Gia hạn hợp đồng</h3>
              <div className="mb-2">Bạn muốn gia hạn hợp đồng <span className="font-bold">{renewModal.contract?.title}</span> thêm 1 năm?</div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                  onClick={handleRenewCancel}
                >
                  Hủy
                </button>
                <button
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                  onClick={handleRenewConfirm}
                >
                  Xác nhận gia hạn
                </button>
              </div>
              {renewMessage && <div className="mt-2 text-green-700">{renewMessage}</div>}
            </div>
          </div>
        )}

        {/* Modal chi tiết hợp đồng */}
        {showDetail && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            {/* <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl relative"> */}
              <ContractDetail
                contract={selectedContract}
                onClose={handleCloseDetail}
                isPage={false}
              />
            {/* </div> */}
          </div>
        )}
        
        {/* Toast Notification */}
        {toast && (
          <Toast 
            message={toast.message}
            type={toast.type}
            onClose={hideToast}
            duration={toast.duration}
          />
        )}
      </div>
    </div>
  );
};


export default ContractManagement;

