import { useState, useEffect, useCallback } from 'react';
import { contractServices } from '../api/contract.service';
import { hotelApiService } from '../api/hotel.service';

// Không cần truyền hotelId nếu chỉ lấy all contract
export const useHotelOwnerContract = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedContract, setSelectedContract] = useState(null);
  const [approvedHotels, setApprovedHotels] = useState([]);

  // Lấy tất cả hợp đồng
  const fetchContracts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await contractServices.getAllContracts();
      const contractsData = Array.isArray(res.data) ? res.data : [];
      setContracts(contractsData);
    } catch (err) {
      setError(err.message || 'Lỗi khi lấy danh sách hợp đồng');
      setContracts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Tạo hợp đồng mới
  const createContract = useCallback(async (contractData) => {
    setLoading(true);
    setError('');
    try {
      const res = await contractServices.createContract(contractData);
      await fetchContracts();
      return res;
    } catch (err) {
      setError(err.message || 'Lỗi khi tạo hợp đồng');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchContracts]);

  // Sửa hợp đồng
  const updateContract = useCallback(async (contractId, contractData) => {
    setLoading(true);
    setError('');
    try {
      const res = await contractServices.updateContract(contractId, contractData);
      await fetchContracts();
      return res;
    } catch (err) {
      setError(err.message || 'Lỗi khi cập nhật hợp đồng');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchContracts]);

  // Xóa hợp đồng
  const deleteContract = useCallback(async (contractId) => {
    setLoading(true);
    setError('');
    try {
      const res = await contractServices.deleteContract(contractId);
      await fetchContracts();
      return res;
    } catch (err) {
      setError(err.message || 'Lỗi khi xóa hợp đồng');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchContracts]);

  // Gửi hợp đồng sang trạng thái chờ duyệt
  const sendForApproval = useCallback(async (contractId) => {
    setLoading(true);
    setError('');
    try {
      const res = await contractServices.updateContractStatus(contractId, { status: 'pending' });
      await fetchContracts();
      return res;
    } catch (err) {
      setError(err.message || 'Lỗi khi gửi hợp đồng chờ duyệt');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchContracts]);

  // Lấy chi tiết hợp đồng
  const fetchContractById = useCallback(async (contractId) => {
    setLoading(true);
    setError('');
    setSelectedContract(null); // Reset trước khi fetch
    try {
      console.log('Fetching contract by ID:', contractId);
      const res = await contractServices.getContractById(contractId);
      console.log('Contract API response:', res);
      
      const contractData = res.data || res;
      console.log('Processed contract data:', contractData);
      
      setSelectedContract(contractData);
      return contractData;
    } catch (err) {
      console.error('Error fetching contract:', err);
      setError(err.message || 'Lỗi khi lấy chi tiết hợp đồng');
      setSelectedContract(null);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Lấy danh sách khách sạn đã duyệt cho dropdown
  const fetchApprovedHotelsDropdown = useCallback(async () => {
    try {
      const res = await hotelApiService.getApprovedHotelsDropdown();
      setApprovedHotels(res.data || []);
    } catch {
      setApprovedHotels([]);
    }
  }, []);

  // useEffect để gọi API khi component mount
  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  return {
    contracts,
    loading,
    error,
    selectedContract,
    approvedHotels,
    fetchContracts,
    createContract,
    updateContract,
    deleteContract,
    sendForApproval,
    fetchContractById,
    fetchApprovedHotelsDropdown,
    setSelectedContract,
    clearSelectedContract: () => setSelectedContract(null),
  };
};