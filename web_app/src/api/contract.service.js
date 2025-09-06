// src/api/contract.services.js
import { API_ENDPOINTS } from '../config/apiEndpoints';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
    };
};

export const contractServices = {
    // Lấy tất cả hợp đồng
    getAllContracts: async () => {
        try {
            console.log('=== GET ALL CONTRACTS DEBUG ===');
            console.log('Fetching all contracts from:', API_ENDPOINTS.CONTRACTS.GET_ALL);
            
            const response = await fetch(API_ENDPOINTS.CONTRACTS.GET_ALL, {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            // Chuẩn hóa trả về: luôn là { data: [...] }
            let normalized;
            if (data && Array.isArray(data.data)) {
                normalized = { data: data.data };
            } else if (data && Array.isArray(data)) {
                normalized = { data };
            } else {
                normalized = { data: [] };
            }
            console.log('Raw ALL contracts response:', data);
            console.log('Response type:', typeof data);
            console.log('Is array:', Array.isArray(data));
            
            // Debug: Kiểm tra cấu trúc dữ liệu chi tiết
            if (data && data.data && Array.isArray(data.data)) {
                console.log('✅ Structure: { data: [...] }');
                console.log('Contracts array length:', data.data.length);
                if (data.data.length > 0) {
                    console.log('✅ First contract sample:', data.data[0]);
                    console.log('✅ First contract keys:', Object.keys(data.data[0]));
                    console.log('✅ Date fields in first contract:', {
                        created_at: data.data[0].created_at,
                        createdAt: data.data[0].createdAt,
                        start_date: data.data[0].start_date,
                        startDate: data.data[0].startDate,
                        end_date: data.data[0].end_date,
                        endDate: data.data[0].endDate
                    });
                }
            } else if (data && Array.isArray(data)) {
                console.log('✅ Structure: [...] (direct array)');
                console.log('Direct array length:', data.length);
                if (data.length > 0) {
                    console.log('✅ First contract sample (direct array):', data[0]);
                    console.log('✅ First contract keys (direct array):', Object.keys(data[0]));
                    console.log('✅ Date fields in first contract (direct array):', {
                        created_at: data[0].created_at,
                        createdAt: data[0].createdAt,
                        start_date: data[0].start_date,
                        startDate: data[0].startDate,
                        end_date: data[0].end_date,
                        endDate: data[0].endDate
                    });
                }
            } else {
                console.error('❌ Unexpected data structure:', data);
            }

            return normalized;
        } catch (error) {
            console.error('❌ Error fetching contracts:', error);
            throw error;
        }
    },

    // Lấy hợp đồng theo ID
    getContractById: async (contractId) => {
        try {
            console.log('=== CONTRACT SERVICE DEBUG ===');
            console.log('Fetching contract by ID:', contractId);
            
            const response = await fetch(API_ENDPOINTS.CONTRACTS.GET_BY_ID(contractId), {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            // Chuẩn hóa trả về: luôn là { data: {...} }
            let normalized;
            if (data && data.data) {
                normalized = { data: data.data };
            } else if (data && typeof data === 'object') {
                normalized = { data };
            } else {
                normalized = { data: null };
            }
            console.log('Raw API response:', data);
            console.log('Contract data keys:', data?.data ? Object.keys(data.data) : 'No data field');
            
            return normalized;
        } catch (error) {
            console.error('Error fetching contract by ID:', error);
            throw error;
        }
    },

    // Lấy hợp đồng theo trạng thái
    // getContractsByStatus: async (status) => {
    //     try {
    //         const response = await fetch(API_ENDPOINTS.CONTRACTS.GET_BY_STATUS(status), {
    //             method: 'GET',
    //             headers: getAuthHeaders(),
    //         });

    //         if (!response.ok) {
    //             throw new Error(`HTTP error! status: ${response.status}`);
    //         }

    //         return await response.json();
    //     } catch (error) {
    //         console.error('Error fetching contracts by status:', error);
    //         throw error;
    //     }
    // },

    getContractsByStatus: async (status) => {
        const url = API_ENDPOINTS.CONTRACTS.GET_BY_STATUS(status);
        const headers = getAuthHeaders();

        console.log('📤 [DEBUG] Fetching contracts by status...');
        console.log('➡️ URL:', url);
        console.log('🧾 Headers:', headers);

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: headers,
            });

            console.log('📥 [DEBUG] Raw response:', response);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            // Chuẩn hóa trả về: luôn là { data: [...] }
            let normalized;
            if (data && Array.isArray(data.data)) {
                normalized = { data: data.data };
            } else if (data && Array.isArray(data)) {
                normalized = { data };
            } else {
                normalized = { data: [] };
            }
            console.log('✅ [DEBUG] Response JSON:', data);

            return normalized;
        } catch (error) {
            console.error('❌ Error fetching contracts by status:', error);
            throw error;
        }
    },

    // Lấy hợp đồng theo hotel
    getContractsByHotel: async (hotelId) => {
        try {
            console.log('=== GET CONTRACTS BY HOTEL DEBUG ===');
            console.log('Fetching contracts for hotelId:', hotelId);
            console.log('URL:', API_ENDPOINTS.CONTRACTS.GET_BY_HOTEL(hotelId));
            console.log('Headers:', getAuthHeaders());
            
            const response = await fetch(API_ENDPOINTS.CONTRACTS.GET_BY_HOTEL(hotelId), {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            // Chuẩn hóa trả về: luôn là { data: [...] }
            let normalized;
            if (data && Array.isArray(data.data)) {
                normalized = { data: data.data };
            } else if (data && Array.isArray(data)) {
                normalized = { data };
            } else {
                normalized = { data: [] };
            }
            console.log('Raw hotel contracts response:', data);
            console.log('Data structure:', typeof data);
            console.log('Is data.data array?', Array.isArray(data.data));
            console.log('Contracts count:', data.data?.length || 0);
            
            return normalized;
        } catch (error) {
            console.error('Error fetching contracts by hotel:', error);
            throw error;
        }
    },

    // Tạo hợp đồng mới
    createContract: async (contractData) => {
        try {
            const response = await fetch(API_ENDPOINTS.CONTRACTS.CREATE, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(contractData),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error creating contract:', error);
            throw error;
        }
    },

    // Cập nhật trạng thái hợp đồng
    updateContractStatus: async (contractId, statusData) => {
        try {
            const response = await fetch(API_ENDPOINTS.CONTRACTS.UPDATE_STATUS(contractId), {
                method: 'PATCH', // Đổi từ 'PUT' sang 'PATCH'
                headers: getAuthHeaders(),
                body: JSON.stringify(statusData),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating contract status:', error);
            throw error;
        }
    },

    // Phê duyệt hợp đồng
    approveContract: async (contractId, approvalData) => {
        try {
            const response = await fetch(API_ENDPOINTS.CONTRACTS.UPDATE_STATUS(contractId), {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    status: 'active', // luôn là active khi duyệt
                    notes: approvalData.notes,
                    approvedBy: approvalData.approvedBy,
                }),
            });

            if (!response.ok) {
                // Đọc lỗi trả về từ backend (nếu có)
                let errorMsg = `HTTP error! status: ${response.status}`;
                try {
                    const errJson = await response.json();
                    if (errJson?.message) errorMsg = errJson.message;
                } catch {}
                throw new Error(errorMsg);
            }

            return await response.json();
        } catch (error) {
            console.error('Error approving contract:', error);
            throw error;
        }
    },

    // Từ chối hợp đồng
    rejectContract: async (contractId, rejectionData) => {
        try {
            const response = await fetch(API_ENDPOINTS.CONTRACTS.UPDATE_STATUS(contractId), {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    status: 'cancelled', // luôn là cancelled khi từ chối
                    notes: rejectionData.notes,
                    approvedBy: rejectionData.approvedBy,
                }),
            });

            if (!response.ok) {
                let errorMsg = `HTTP error! status: ${response.status}`;
                try {
                    const errJson = await response.json();
                    if (errJson?.message) errorMsg = errJson.message;
                } catch {}
                throw new Error(errorMsg);
            }

            return await response.json();
        } catch (error) {
            console.error('Error rejecting contract:', error);
            throw error;
        }
    },
///thêm ngafy21/8/9h53
    // Sửa hợp đồng
  // Cập nhật hợp đồng
    updateContract: async (contractId, updateData) => {
        try {
            const response = await fetch(API_ENDPOINTS.CONTRACTS.UPDATE(contractId), {
                method: 'PATCH', // khớp với route backend
                headers: getAuthHeaders(),
                body: JSON.stringify(updateData),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating contract:', error);
            throw error;
        }
    },


    // Xóa hợp đồng
    deleteContract: async (contractId) => {
        try {
            const response = await fetch(API_ENDPOINTS.CONTRACTS.DELETE(contractId), {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error deleting contract:', error);
            throw error;
        }
    },
    // Gửi hợp đồng đi duyệt (draft -> pending)
    sendForApproval: async (contractId) => {
        try {
            const response = await fetch(API_ENDPOINTS.CONTRACTS.SEND_FOR_APPROVAL(contractId), {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify({}), // body rỗng
            });

            if (!response.ok) {
                let errorMsg = `HTTP error! status: ${response.status}`;
                try {
                    const errJson = await response.json();
                    if (errJson?.message) errorMsg = errJson.message;
                } catch {}
                throw new Error(errorMsg);
            }

            return await response.json();
        } catch (error) {
            console.error('❌ Error sending contract for approval:', error);
            throw error;
        }
    },

};