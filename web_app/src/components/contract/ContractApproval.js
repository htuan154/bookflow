// src/hooks/useContractApproval.js
import { useState, useCallback } from 'react';
import { contractServices } from '../../api/contract.service';

export const useContractApproval = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Clear error
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // Approve contract
    const approveContract = useCallback(async (contractId, approvalData = {}) => {
        try {
            setLoading(true);
            setError(null);

            const result = await contractServices.approveContract(contractId, {
                notes: approvalData.notes || '',
                approvedBy: approvalData.approvedBy,
            });

            return result;
        } catch (err) {
            console.error('Error approving contract:', err);
            const errorMessage = err.message || 'Có lỗi xảy ra khi phê duyệt hợp đồng';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    // Reject contract
    const rejectContract = useCallback(async (contractId, rejectionData = {}) => {
        try {
            setLoading(true);
            setError(null);

            if (!rejectionData.notes || rejectionData.notes.trim() === '') {
                throw new Error('Vui lòng nhập lý do từ chối');
            }

            const result = await contractServices.rejectContract(contractId, {
                notes: rejectionData.notes,
                approvedBy: rejectionData.approvedBy,
            });

            return result;
        } catch (err) {
            console.error('Error rejecting contract:', err);
            const errorMessage = err.message || 'Có lỗi xảy ra khi từ chối hợp đồng';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    // Update contract status
    const updateStatus = useCallback(async (contractId, status, notes = '') => {
        try {
            setLoading(true);
            setError(null);

            const result = await contractServices.updateContractStatus(contractId, {
                status,
                notes,
            });

            return result;
        } catch (err) {
            console.error('Error updating contract status:', err);
            const errorMessage = err.message || 'Có lỗi xảy ra khi cập nhật trạng thái hợp đồng';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    // Bulk approve contracts
    const bulkApprove = useCallback(async (contractIds, approvalData = {}) => {
        try {
            setLoading(true);
            setError(null);

            const results = await Promise.allSettled(
                contractIds.map(id => 
                    contractServices.approveContract(id, {
                        notes: approvalData.notes || '',
                        approvedBy: approvalData.approvedBy,
                    })
                )
            );

            const successful = results.filter(result => result.status === 'fulfilled');
            const failed = results.filter(result => result.status === 'rejected');

            if (failed.length > 0) {
                console.warn(`${failed.length} contracts failed to approve:`, failed);
            }

            return {
                successful: successful.length,
                failed: failed.length,
                total: contractIds.length,
            };
        } catch (err) {
            console.error('Error in bulk approve:', err);
            const errorMessage = err.message || 'Có lỗi xảy ra khi phê duyệt hàng loạt';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    // Bulk reject contracts
    const bulkReject = useCallback(async (contractIds, rejectionData = {}) => {
        try {
            setLoading(true);
            setError(null);

            if (!rejectionData.notes || rejectionData.notes.trim() === '') {
                throw new Error('Vui lòng nhập lý do từ chối');
            }

            const results = await Promise.allSettled(
                contractIds.map(id => 
                    contractServices.rejectContract(id, {
                        notes: rejectionData.notes,
                        approvedBy: rejectionData.approvedBy,
                    })
                )
            );

            const successful = results.filter(result => result.status === 'fulfilled');
            const failed = results.filter(result => result.status === 'rejected');

            if (failed.length > 0) {
                console.warn(`${failed.length} contracts failed to reject:`, failed);
            }

            return {
                successful: successful.length,
                failed: failed.length,
                total: contractIds.length,
            };
        } catch (err) {
            console.error('Error in bulk reject:', err);
            const errorMessage = err.message || 'Có lỗi xảy ra khi từ chối hàng loạt';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    // Validate contract before approval
    const validateContract = useCallback((contract) => {
        const errors = [];

        if (!contract) {
            errors.push('Không tìm thấy thông tin hợp đồng');
            return errors;
        }

        if (!contract.contractNumber) {
            errors.push('Số hợp đồng không được để trống');
        }

        if (!contract.title) {
            errors.push('Tiêu đề hợp đồng không được để trống');
        }

        if (!contract.startDate) {
            errors.push('Ngày bắt đầu không được để trống');
        }

        if (!contract.endDate) {
            errors.push('Ngày kết thúc không được để trống');
        }

        if (contract.startDate && contract.endDate) {
            const startDate = new Date(contract.startDate);
            const endDate = new Date(contract.endDate);
            
            if (startDate >= endDate) {
                errors.push('Ngày kết thúc phải sau ngày bắt đầu');
            }
        }

        if (!contract.contractValue || contract.contractValue <= 0) {
            errors.push('Giá trị hợp đồng phải lớn hơn 0');
        }

        return errors;
    }, []);

    return {
        // State
        loading,
        error,
        
        // Actions
        approveContract,
        rejectContract,
        updateStatus,
        bulkApprove,
        bulkReject,
        clearError,
        
        // Utils
        validateContract,
    };
};