// src/context/ContractContext.js
import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { contractServices } from '../api/contract.service';

// Contract Context
const ContractContext = createContext();

// Contract states
const CONTRACT_ACTIONS = {
    SET_LOADING: 'SET_LOADING',
    SET_CONTRACTS: 'SET_CONTRACTS',
    SET_CURRENT_CONTRACT: 'SET_CURRENT_CONTRACT',
    SET_ERROR: 'SET_ERROR',
    SET_FILTERS: 'SET_FILTERS',
    UPDATE_CONTRACT: 'UPDATE_CONTRACT',
    CLEAR_ERROR: 'CLEAR_ERROR',
};

// Initial state
const initialState = {
    contracts: [],
    currentContract: null,
    loading: false,
    error: null,
    filters: {
        status: 'ALL',
        search: '',
        dateRange: null,
    },
    pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0,
    },
};

// Reducer
const contractReducer = (state, action) => {
    switch (action.type) {
        case CONTRACT_ACTIONS.SET_LOADING:
            return {
                ...state,
                loading: action.payload,
            };

        case CONTRACT_ACTIONS.SET_CONTRACTS:
            console.log('🔄 Setting contracts in reducer:', action.payload); // Debug log
            return {
                ...state,
                contracts: action.payload.contracts || [],
                pagination: {
                    ...state.pagination,
                    total: action.payload.total || 0,
                },
                loading: false,
                error: null,
            };

        case CONTRACT_ACTIONS.SET_CURRENT_CONTRACT:
            return {
                ...state,
                currentContract: action.payload,
                loading: false,
                error: null,
            };

        case CONTRACT_ACTIONS.SET_ERROR:
            console.error('❌ Setting error in reducer:', action.payload); // Debug log
            return {
                ...state,
                error: action.payload,
                loading: false,
            };

        case CONTRACT_ACTIONS.SET_FILTERS:
            return {
                ...state,
                filters: { ...state.filters, ...action.payload },
                pagination: { ...state.pagination, currentPage: 1 },
            };

        case CONTRACT_ACTIONS.UPDATE_CONTRACT:
            return {
                ...state,
                contracts: state.contracts.map(contract =>
                    contract.contractId === action.payload.contractId
                        ? { ...contract, ...action.payload }
                        : contract
                ),
                currentContract: state.currentContract?.contractId === action.payload.contractId
                    ? { ...state.currentContract, ...action.payload }
                    : state.currentContract,
            };

        case CONTRACT_ACTIONS.CLEAR_ERROR:
            return {
                ...state,
                error: null,
            };

        default:
            return state;
    }
};

// Provider
export const ContractProvider = ({ children }) => {
    const [state, dispatch] = useReducer(contractReducer, initialState);

    // Actions
    const setLoading = useCallback((loading) => {
        console.log('🔄 Setting loading:', loading); // Debug log
        dispatch({ type: CONTRACT_ACTIONS.SET_LOADING, payload: loading });
    }, []);

    const setError = useCallback((error) => {
        console.error('❌ Setting error:', error); // Debug log
        dispatch({ type: CONTRACT_ACTIONS.SET_ERROR, payload: error });
    }, []);

    const clearError = useCallback(() => {
        dispatch({ type: CONTRACT_ACTIONS.CLEAR_ERROR });
    }, []);

    const setFilters = useCallback((filters) => {
        dispatch({ type: CONTRACT_ACTIONS.SET_FILTERS, payload: filters });
    }, []);

    // Fetch contracts với debug logs
    const fetchContracts = useCallback(async (filters = {}) => {
        try {
            console.log('🔄 Starting fetchContracts with filters:', filters);
            setLoading(true);
            
            let contracts;

            if (filters.status && filters.status !== 'ALL') {
                console.log('📞 Calling getContractsByStatus with status:', filters.status);
                contracts = await contractServices.getContractsByStatus(filters.status);
            } else {
                console.log('📞 Calling getAllContracts');
                contracts = await contractServices.getAllContracts();
            }

            console.log('✅ API Response received:', contracts);
            console.log('📊 Contracts data structure:', {
                isArray: Array.isArray(contracts),
                hasData: contracts?.data,
                length: contracts?.length || contracts?.data?.length,
                firstItem: contracts?.[0] || contracts?.data?.[0]
            });

            dispatch({
                type: CONTRACT_ACTIONS.SET_CONTRACTS,
                payload: {
                    contracts: contracts.data || contracts,
                    total: contracts.total || contracts.length,
                },
            });

            console.log('✅ Contracts loaded successfully. Count:', (contracts.data || contracts)?.length || 0);
        } catch (error) {
            console.error('❌ Error in fetchContracts:', error);
            console.error('❌ Error details:', {
                message: error.message,
                status: error.status,
                response: error.response
            });
            setError(error.message || 'Có lỗi xảy ra khi tải danh sách hợp đồng');
        }
    }, [setLoading, setError]);

    // Fetch contract by ID
    const fetchContractById = useCallback(async (contractId) => {
        try {
            console.log('🔄 Fetching contract by ID:', contractId);
            setLoading(true);
            const contract = await contractServices.getContractById(contractId);
            console.log('✅ Contract fetched:', contract);
            dispatch({
                type: CONTRACT_ACTIONS.SET_CURRENT_CONTRACT,
                payload: contract.data || contract,
            });
        } catch (error) {
            console.error('❌ Error fetching contract by ID:', error);
            setError(error.message || 'Có lỗi xảy ra khi tải thông tin hợp đồng');
        }
    }, [setLoading, setError]);

    // Approve contract
    const approveContract = useCallback(async (contractId, approvalData) => {
        try {
            setLoading(true);
            const result = await contractServices.approveContract(contractId, approvalData);
            
            dispatch({
                type: CONTRACT_ACTIONS.UPDATE_CONTRACT,
                payload: {
                    contractId,
                    status: 'APPROVED',
                    approvedBy: approvalData.approvedBy,
                    notes: approvalData.notes,
                },
            });

            return result;
        } catch (error) {
            setError(error.message || 'Có lỗi xảy ra khi phê duyệt hợp đồng');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [setLoading, setError]);

    // Reject contract
    const rejectContract = useCallback(async (contractId, rejectionData) => {
        try {
            setLoading(true);
            const result = await contractServices.rejectContract(contractId, rejectionData);
            
            dispatch({
                type: CONTRACT_ACTIONS.UPDATE_CONTRACT,
                payload: {
                    contractId,
                    status: 'REJECTED',
                    approvedBy: rejectionData.approvedBy,
                    notes: rejectionData.notes,
                },
            });

            return result;
        } catch (error) {
            setError(error.message || 'Có lỗi xảy ra khi từ chối hợp đồng');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [setLoading, setError]);

    // Update contract status
    const updateContractStatus = useCallback(async (contractId, statusData) => {
        try {
            setLoading(true);
            const result = await contractServices.updateContractStatus(contractId, statusData);
            
            dispatch({
                type: CONTRACT_ACTIONS.UPDATE_CONTRACT,
                payload: {
                    contractId,
                    ...statusData,
                },
            });

            return result;
        } catch (error) {
            setError(error.message || 'Có lỗi xảy ra khi cập nhật trạng thái hợp đồng');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [setLoading, setError]);

    const value = {
        // State
        ...state,
        
        // Actions
        fetchContracts,
        fetchContractById,
        approveContract,
        rejectContract,
        updateContractStatus,
        setFilters,
        clearError,
    };

    console.log('🏗️ ContractProvider rendering with state:', {
        contractsCount: state.contracts?.length || 0,
        loading: state.loading,
        error: state.error
    });

    return (
        <ContractContext.Provider value={value}>
            {children}
        </ContractContext.Provider>
    );
};

// Hook to use contract context
export const useContract = () => {
    const context = useContext(ContractContext);
    if (!context) {
        throw new Error('useContract must be used within a ContractProvider');
    }
    return context;
};