import React, { createContext, useState } from 'react';
import { contractServices } from '../api/contract.service';
import { hotelApiService } from '../api/hotel.service'; // Thêm import

export const HotelOwnerContractContext = createContext();

export const HotelOwnerContractProvider = ({ children }) => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedContract, setSelectedContract] = useState(null);
  const [approvedHotels, setApprovedHotels] = useState([]);

  // Lấy danh sách hợp đồng theo hotelId
  const fetchContractsByHotel = async (hotelId) => {
    setLoading(true);
    setError('');
    try {
      const res = await contractServices.getContractsByHotel(hotelId);
      setContracts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.message || 'Lỗi khi lấy hợp đồng theo khách sạn');
    } finally {
      setLoading(false);
    }
  };

  // Thêm hàm lấy tất cả hợp đồng
  const fetchAllContracts = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await contractServices.getAllContracts();
      setContracts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.message || 'Lỗi khi lấy danh sách hợp đồng');
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  // Tạo hợp đồng mới
  const createContract = async (contractData) => {
    setLoading(true);
    setError('');
    try {
      const res = await contractServices.createContract(contractData);
      await fetchAllContracts(); // Thay đổi ở đây
      return res;
    } catch (err) {
      setError(err.message || 'Lỗi khi tạo hợp đồng');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sửa hợp đồng
  const updateContract = async (contractId, contractData) => {
    setLoading(true);
    setError('');
    try {
      const res = await contractServices.updateContract(contractId, contractData);
      await fetchAllContracts(); // Thay đổi ở đây
      return res;
    } catch (err) {
      setError(err.message || 'Lỗi khi cập nhật hợp đồng');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Xóa hợp đồng
  const deleteContract = async (contractId) => {
    setLoading(true);
    setError('');
    try {
      const res = await contractServices.deleteContract(contractId);
      await fetchAllContracts(); // Thay đổi ở đây
      return res;
    } catch (err) {
      setError(err.message || 'Lỗi khi xóa hợp đồng');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Gửi hợp đồng sang trạng thái chờ duyệt
  const sendForApproval = async (contractId) => {
    setLoading(true);
    setError('');
    try {
      const res = await contractServices.updateContractStatus(contractId, { status: 'pending' });
      await fetchAllContracts(); // Thay đổi ở đây
      return res;
    } catch (err) {
      setError(err.message || 'Lỗi khi gửi hợp đồng chờ duyệt');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Lấy chi tiết hợp đồng
  const fetchContractById = async (contractId) => {
    setLoading(true);
    setError('');
    try {
      const res = await contractServices.getContractById(contractId);
      setSelectedContract(res.data || null);
      return res.data;
    } catch (err) {
      setError(err.message || 'Lỗi khi lấy chi tiết hợp đồng');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Lấy danh sách khách sạn đã duyệt cho dropdown
  const fetchApprovedHotelsDropdown = async () => {
    try {
      const res = await hotelApiService.getApprovedHotelsDropdown();
      setApprovedHotels(res.data || []);
    } catch {
      setApprovedHotels([]);
    }
  };

  return (
    <HotelOwnerContractContext.Provider value={{
      contracts,
      loading,
      error,
      selectedContract,
      approvedHotels,
      createContract,
      updateContract,
      deleteContract,
      sendForApproval,
      fetchContractById,
      setSelectedContract,
      fetchAllContracts, // Thêm hàm này vào context
      fetchApprovedHotelsDropdown,
      // fetchContractsByHotel, // Nếu vẫn muốn giữ, có thể để lại
    }}>
      {children}
    </HotelOwnerContractContext.Provider>
  );
};
