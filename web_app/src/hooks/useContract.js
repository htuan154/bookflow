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
        filters,
        pagination,
        fetchContracts,
        fetchContractById,
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

    // Enhanced actions with additional functionality
    const actions = useMemo(() => ({
        // Original actions
        fetchContracts,
        fetchContractById,
        approveContract,
        rejectContract,
        updateContractStatus,
        setFilters,
        clearError,

        // Enhanced filter actions
        setStatusFilter: useCallback((status) => {
            setFilters({ status });
        }, [setFilters]),

        setSearchFilter: useCallback((search) => {
            setFilters({ search });
        }, [setFilters]),

        setDateRangeFilter: useCallback((dateRange) => {
            setFilters({ dateRange });
        }, [setFilters]),

        clearFilters: useCallback(() => {
            setFilters({
                status: 'ALL',
                search: '',
                dateRange: null,
            });
        }, [setFilters]),

        // Batch operations
        approveMultipleContracts: useCallback(async (contractIds, approvalData) => {
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
        }, [approveContract]),

        rejectMultipleContracts: useCallback(async (contractIds, rejectionData) => {
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
        }, [rejectContract]),

        // Utility functions
        getContractById: useCallback((contractId) => {
            return contracts.find(contract => contract.contractId === contractId);
        }, [contracts]),

        getContractsByStatus: useCallback((status) => {
            return contracts.filter(contract => contract.status === status);
        }, [contracts]),

        isContractExpired: useCallback((contract) => {
            if (!contract.expiryDate) return false;
            return new Date(contract.expiryDate) < new Date();
        }, []),

        getContractAge: useCallback((contract) => {
            if (!contract.createdAt) return 0;
            const created = new Date(contract.createdAt);
            const now = new Date();
            return Math.floor((now - created) / (1000 * 60 * 60 * 24)); // days
        }, []),

        // Refresh data
        refreshContracts: useCallback(async () => {
            await fetchContracts(filters);
        }, [fetchContracts, filters]),

        refreshCurrentContract: useCallback(async () => {
            if (currentContract?.contractId) {
                await fetchContractById(currentContract.contractId);
            }
        }, [fetchContractById, currentContract]),
    }), [
        fetchContracts,
        fetchContractById,
        approveContract,
        rejectContract,
        updateContractStatus,
        setFilters,
        clearError,
        contracts,
        currentContract,
        filters
    ]);

    // Validation helpers
    const validation = useMemo(() => ({
        canApprove: useCallback((contract) => {
            return contract && 
                   ['PENDING', 'DRAFT'].includes(contract.status) && 
                   !loading;
        }, [loading]),

        canReject: useCallback((contract) => {
            return contract && 
                   ['PENDING', 'DRAFT'].includes(contract.status) && 
                   !loading;
        }, [loading]),

        canEdit: useCallback((contract) => {
            return contract && 
                   ['DRAFT', 'PENDING'].includes(contract.status) && 
                   !loading;
        }, [loading]),

        canDelete: useCallback((contract) => {
            return contract && 
                   contract.status === 'DRAFT' && 
                   !loading;
        }, [loading]),
    }), [loading]);

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