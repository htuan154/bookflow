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
            const response = await fetch(API_ENDPOINTS.CONTRACTS.GET_ALL, {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching contracts:', error);
            throw error;
        }
    },

    // Lấy hợp đồng theo ID
    getContractById: async (contractId) => {
        try {
            const response = await fetch(API_ENDPOINTS.CONTRACTS.GET_BY_ID(contractId), {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
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
            console.log('✅ [DEBUG] Response JSON:', data);

            return data;
        } catch (error) {
            console.error('❌ Error fetching contracts by status:', error);
            throw error;
        }
    },

    // Lấy hợp đồng theo hotel
    getContractsByHotel: async (hotelId) => {
        try {
            const response = await fetch(API_ENDPOINTS.CONTRACTS.GET_BY_HOTEL(hotelId), {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
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
                method: 'PUT',
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
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    status: 'APPROVED',
                    notes: approvalData.notes,
                    approvedBy: approvalData.approvedBy,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
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
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    status: 'REJECTED',
                    notes: rejectionData.notes,
                    approvedBy: rejectionData.approvedBy,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error rejecting contract:', error);
            throw error;
        }
    },
};