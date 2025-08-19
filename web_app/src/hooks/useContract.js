// src/hooks/useContract.js
import { useContext, useMemo, useCallback } from 'react';
// import { ContractContext } from '../context/ContractContext';
import { ContractContext } from '../context/ContractContext'; 

/**
 * Custom hook for contract management
 * Provides enhanced functionality and computed values based on ContractContext
 */
export const useContract = () => {
    const context = useContext(ContractContext);
    
    if (!context) {
        throw new Error('useContract must be used within a ContractProvider');
    }

    const {
        contracts,
        currentContract,
        loading,
        error,
        filters = { status: 'ALL', search: '', dateRange: null },
        pagination = { currentPage: 1, pageSize: 10 },
        fetchContracts,
        fetchContractById,
        fetchContractDetail, // Thêm dòng này để lấy từ context
        approveContract,
        rejectContract,
        updateContractStatus,
        setFilters,
        clearError
    } = context;

    // Computed values using useMemo for performance optimization
    const computedValues = useMemo(() => {
        // Filter contracts based on current filters
        const filteredContracts = contracts.filter(contract => {
            // Status filter
            if (filters.status !== 'ALL' && contract.status !== filters.status) {
                return false;
            }

            // Search filter (search in contract ID, client name, etc.)
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                const searchFields = [
                    contract.contractId,
                    contract.clientName,
                    contract.projectName,
                    contract.description
                ].filter(Boolean);

                const matchesSearch = searchFields.some(field => 
                    field.toString().toLowerCase().includes(searchLower)
                );

                if (!matchesSearch) return false;
            }

            // Date range filter
            if (filters.dateRange) {
                const contractDate = new Date(contract.createdAt || contract.signedDate);
                const { startDate, endDate } = filters.dateRange;
                
                if (startDate && contractDate < new Date(startDate)) return false;
                if (endDate && contractDate > new Date(endDate)) return false;
            }

            return true;
        });

        // Statistics
        const stats = {
            total: contracts.length,
            pending: contracts.filter(c => c.status === 'PENDING').length,
            approved: contracts.filter(c => c.status === 'APPROVED').length,
            rejected: contracts.filter(c => c.status === 'REJECTED').length,
            draft: contracts.filter(c => c.status === 'DRAFT').length,
            expired: contracts.filter(c => c.status === 'EXPIRED').length,
        };

        // Pagination data
        const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
        const endIndex = startIndex + pagination.pageSize;
        const paginatedContracts = filteredContracts.slice(startIndex, endIndex);

        return {
            filteredContracts,
            paginatedContracts,
            stats,
            hasContracts: contracts.length > 0,
            hasFilteredContracts: filteredContracts.length > 0,
            totalPages: Math.ceil(filteredContracts.length / pagination.pageSize),
        };
    }, [contracts, filters, pagination]);

    // Đưa các hàm useCallback ra ngoài useMemo
    const setStatusFilter = useCallback((status) => {
        setFilters({ status });
    }, [setFilters]);

    const setSearchFilter = useCallback((search) => {
        setFilters({ search });
    }, [setFilters]);

    const setDateRangeFilter = useCallback((dateRange) => {
        setFilters({ dateRange });
    }, [setFilters]);

    const clearFilters = useCallback(() => {
        setFilters({
            status: 'ALL',
            search: '',
            dateRange: null,
        });
    }, [setFilters]);

    const approveMultipleContracts = useCallback(async (contractIds, approvalData) => {
        const results = [];
        for (const contractId of contractIds) {
            try {
                const result = await approveContract(contractId, approvalData);
                results.push({ contractId, success: true, result });
            } catch (error) {
                results.push({ contractId, success: false, error: error.message });
            }
        }
        return results;
    }, [approveContract]);

    const rejectMultipleContracts = useCallback(async (contractIds, rejectionData) => {
        const results = [];
        for (const contractId of contractIds) {
            try {
                const result = await rejectContract(contractId, rejectionData);
                results.push({ contractId, success: true, result });
            } catch (error) {
                results.push({ contractId, success: false, error: error.message });
            }
        }
        return results;
    }, [rejectContract]);

    const getContractById = useCallback((contractId) => {
        return contracts.find(contract => contract.contractId === contractId);
    }, [contracts]);

    const getContractsByStatus = useCallback((status) => {
        return contracts.filter(contract => contract.status === status);
    }, [contracts]);

    const isContractExpired = useCallback((contract) => {
        if (!contract.expiryDate) return false;
        return new Date(contract.expiryDate) < new Date();
    }, []);

    const getContractAge = useCallback((contract) => {
        if (!contract.createdAt) return 0;
        const created = new Date(contract.createdAt);
        const now = new Date();
        return Math.floor((now - created) / (1000 * 60 * 60 * 24)); // days
    }, []);

    const refreshContracts = useCallback(async () => {
        await fetchContracts(filters);
    }, [fetchContracts, filters]);

    const refreshCurrentContract = useCallback(async () => {
        if (currentContract?.contractId) {
            await fetchContractById(currentContract.contractId);
        }
    }, [fetchContractById, currentContract]);

    // Validation helpers
    const canApprove = useCallback((contract) => {
        return contract && 
               ['PENDING', 'DRAFT'].includes(contract.status) && 
               !loading;
    }, [loading]);

    const canReject = useCallback((contract) => {
        return contract && 
               ['PENDING', 'DRAFT'].includes(contract.status) && 
               !loading;
    }, [loading]);

    const canEdit = useCallback((contract) => {
        return contract && 
               ['DRAFT', 'PENDING'].includes(contract.status) && 
               !loading;
    }, [loading]);

    const canDelete = useCallback((contract) => {
        return contract && 
               contract.status === 'DRAFT' && 
               !loading;
    }, [loading]);

    // Gom lại các hàm vào object nếu cần
    const actions = {
        fetchContracts,
        fetchContractById,
        approveContract,
        rejectContract,
        updateContractStatus,
        setFilters,
        clearError,
        setStatusFilter,
        setSearchFilter,
        setDateRangeFilter,
        clearFilters,
        approveMultipleContracts,
        rejectMultipleContracts,
        getContractById,
        getContractsByStatus,
        isContractExpired,
        getContractAge,
        refreshContracts,
        refreshCurrentContract,
    };

    const validation = {
        canApprove,
        canReject,
        canEdit,
        canDelete,
    };

    return {
        // Original state
        contracts,
        currentContract,
        loading,
        error,
        filters,
        pagination,

        // Computed values
        ...computedValues,

        // Actions
        ...actions,
        fetchContractDetail: fetchContractDetail || fetchContractById, // Sử dụng từ context hoặc fallback

        // Validation helpers
        ...validation,

        // Utility flags
        isLoading: loading,
        hasError: !!error,
        isEmpty: !computedValues.hasContracts,
        isFiltered: filters.status !== 'ALL' || !!filters.search || !!filters.dateRange,
    };
};

// Additional utility hooks that can be used independently

/**
 * Hook for contract statistics only
 */
export const useContractStats = () => {
    const { stats, loading, error } = useContract();
    return { stats, loading, error };
};

/**
 * Hook for current contract only
 */
export const useCurrentContract = () => {
    const { 
        currentContract, 
        loading, 
        error, 
        fetchContractById,
        refreshCurrentContract,
        canApprove,
        canReject,
        canEdit,
        canDelete
    } = useContract();
    
    return {
        contract: currentContract,
        loading,
        error,
        fetchContract: fetchContractById,
        refresh: refreshCurrentContract,
        canApprove: canApprove(currentContract),
        canReject: canReject(currentContract),
        canEdit: canEdit(currentContract),
        canDelete: canDelete(currentContract),
    };
};

/**
 * Hook for contract filtering only
 */
export const useContractFilters = () => {
    const {
        filters,
        setFilters,
        setStatusFilter,
        setSearchFilter,
        setDateRangeFilter,
        clearFilters,
        isFiltered,
        filteredContracts,
        stats
    } = useContract();

    return {
        filters,
        setFilters,
        setStatusFilter,
        setSearchFilter,
        setDateRangeFilter,
        clearFilters,
        isFiltered,
        filteredContracts,
        stats
    };
};