// src/context/PromotionsContext.js
import React, { createContext, useContext, useReducer, useCallback, useRef, useMemo } from 'react';
import promotionService from '../api/promotions.service';

// Initial state
const initialState = {
    // Promotions data
    promotions: [],
    currentPromotion: null,
    promotionDetails: [],
    usageHistory: [],
    
    // UI states
    loading: false,
    error: null,
    
    // Pagination
    pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        limit: 10
    },
    
    // Filters
    filters: {
        status: 'all', // 'all', 'active', 'inactive', 'expired'
        hotelId: null,
        search: '',
        dateRange: {
            from: null,
            to: null
        }
    },
    
    // Validation
    validationResult: null,
    appliedPromotion: null
};

// Action types
const PROMOTION_ACTIONS = {
    // Loading states
    SET_LOADING: 'SET_LOADING',
    SET_ERROR: 'SET_ERROR',
    CLEAR_ERROR: 'CLEAR_ERROR',
    
    // Promotions
    SET_PROMOTIONS: 'SET_PROMOTIONS',
    ADD_PROMOTION: 'ADD_PROMOTION',
    UPDATE_PROMOTION: 'UPDATE_PROMOTION',
    DELETE_PROMOTION: 'DELETE_PROMOTION',
    
    // Current promotion
    SET_CURRENT_PROMOTION: 'SET_CURRENT_PROMOTION',
    CLEAR_CURRENT_PROMOTION: 'CLEAR_CURRENT_PROMOTION',
    
    // Promotion details
    SET_PROMOTION_DETAILS: 'SET_PROMOTION_DETAILS',
    ADD_PROMOTION_DETAIL: 'ADD_PROMOTION_DETAIL',
    
    // Usage history
    SET_USAGE_HISTORY: 'SET_USAGE_HISTORY',
    
    // Pagination
    SET_PAGINATION: 'SET_PAGINATION',
    
    // Filters
    SET_FILTERS: 'SET_FILTERS',
    RESET_FILTERS: 'RESET_FILTERS',
    
    // Validation
    SET_VALIDATION_RESULT: 'SET_VALIDATION_RESULT',
    SET_APPLIED_PROMOTION: 'SET_APPLIED_PROMOTION',
    CLEAR_VALIDATION: 'CLEAR_VALIDATION'
};

// Reducer
const promotionsReducer = (state, action) => {
    switch (action.type) {
        case PROMOTION_ACTIONS.SET_LOADING:
            return {
                ...state,
                loading: action.payload
            };
            
        case PROMOTION_ACTIONS.SET_ERROR:
            return {
                ...state,
                error: action.payload,
                loading: false
            };
            
        case PROMOTION_ACTIONS.CLEAR_ERROR:
            return {
                ...state,
                error: null
            };
            
        case PROMOTION_ACTIONS.SET_PROMOTIONS:
            return {
                ...state,
                promotions: action.payload,
                loading: false,
                error: null
            };
            
        case PROMOTION_ACTIONS.ADD_PROMOTION:
            return {
                ...state,
                promotions: [action.payload, ...state.promotions],
                loading: false
            };
            
        case PROMOTION_ACTIONS.UPDATE_PROMOTION:
            return {
                ...state,
                promotions: state.promotions.map(promo =>
                    promo.promotionId === action.payload.promotionId
                        ? { ...promo, ...action.payload }
                        : promo
                ),
                currentPromotion: state.currentPromotion?.promotionId === action.payload.promotionId
                    ? { ...state.currentPromotion, ...action.payload }
                    : state.currentPromotion
            };
            
        case PROMOTION_ACTIONS.DELETE_PROMOTION:
            return {
                ...state,
                promotions: state.promotions.filter(promo => promo.promotionId !== action.payload),
                currentPromotion: state.currentPromotion?.promotionId === action.payload
                    ? null
                    : state.currentPromotion
            };
            
        case PROMOTION_ACTIONS.SET_CURRENT_PROMOTION:
            return {
                ...state,
                currentPromotion: action.payload,
                loading: false
            };
            
        case PROMOTION_ACTIONS.CLEAR_CURRENT_PROMOTION:
            return {
                ...state,
                currentPromotion: null,
                promotionDetails: [],
                usageHistory: []
            };
            
        case PROMOTION_ACTIONS.SET_PROMOTION_DETAILS:
            return {
                ...state,
                promotionDetails: action.payload,
                loading: false
            };
            
        case PROMOTION_ACTIONS.ADD_PROMOTION_DETAIL:
            return {
                ...state,
                promotionDetails: [...state.promotionDetails, action.payload]
            };
            
        case PROMOTION_ACTIONS.SET_USAGE_HISTORY:
            return {
                ...state,
                usageHistory: action.payload,
                loading: false
            };
            
        case PROMOTION_ACTIONS.SET_PAGINATION:
            return {
                ...state,
                pagination: {
                    ...state.pagination,
                    ...action.payload
                }
            };
            
        case PROMOTION_ACTIONS.SET_FILTERS:
            return {
                ...state,
                filters: {
                    ...state.filters,
                    ...action.payload
                }
            };
            
        case PROMOTION_ACTIONS.RESET_FILTERS:
            return {
                ...state,
                filters: initialState.filters
            };
            
        case PROMOTION_ACTIONS.SET_VALIDATION_RESULT:
            return {
                ...state,
                validationResult: action.payload,
                loading: false
            };
            
        case PROMOTION_ACTIONS.SET_APPLIED_PROMOTION:
            return {
                ...state,
                appliedPromotion: action.payload
            };
            
        case PROMOTION_ACTIONS.CLEAR_VALIDATION:
            return {
                ...state,
                validationResult: null,
                appliedPromotion: null
            };
            
        default:
            return state;
    }
};

// Create context
const PromotionsContext = createContext();

// Provider component
export const PromotionsProvider = ({ children }) => {
    const [state, dispatch] = useReducer(promotionsReducer, initialState);
    
    // Refs for request management
    const abortControllerRef = useRef(null);
    const pendingRequestsRef = useRef(new Set());

    // Utility function to cancel pending requests
    const cancelPendingRequests = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        pendingRequestsRef.current.clear();
    }, []);

    // Stable action creators
    const actions = useMemo(() => ({
        setLoading: (loading) => {
            dispatch({ type: PROMOTION_ACTIONS.SET_LOADING, payload: loading });
        },
        
        setError: (error) => {
            dispatch({ type: PROMOTION_ACTIONS.SET_ERROR, payload: error });
        },
        
        clearError: () => {
            dispatch({ type: PROMOTION_ACTIONS.CLEAR_ERROR });
        },
        
        setPromotions: (promotions, pagination) => {
            dispatch({ type: PROMOTION_ACTIONS.SET_PROMOTIONS, payload: promotions });
            if (pagination) {
                dispatch({ type: PROMOTION_ACTIONS.SET_PAGINATION, payload: pagination });
            }
        },
        
        addPromotion: (promotion) => {
            dispatch({ type: PROMOTION_ACTIONS.ADD_PROMOTION, payload: promotion });
        },
        
        setCurrentPromotion: (promotion) => {
            dispatch({ type: PROMOTION_ACTIONS.SET_CURRENT_PROMOTION, payload: promotion });
        },
        
        setPromotionDetails: (details) => {
            dispatch({ type: PROMOTION_ACTIONS.SET_PROMOTION_DETAILS, payload: details });
        },
        
        setUsageHistory: (history) => {
            dispatch({ type: PROMOTION_ACTIONS.SET_USAGE_HISTORY, payload: history });
        },
        
        setValidationResult: (result) => {
            dispatch({ type: PROMOTION_ACTIONS.SET_VALIDATION_RESULT, payload: result });
        },
        
        setAppliedPromotion: (promotion) => {
            dispatch({ type: PROMOTION_ACTIONS.SET_APPLIED_PROMOTION, payload: promotion });
        },
        
        updateFilters: (filters) => {
            dispatch({ type: PROMOTION_ACTIONS.SET_FILTERS, payload: filters });
        },
        
        resetFilters: () => {
            dispatch({ type: PROMOTION_ACTIONS.RESET_FILTERS });
        },
        
        updatePagination: (pagination) => {
            dispatch({ type: PROMOTION_ACTIONS.SET_PAGINATION, payload: pagination });
        },
        
        clearValidation: () => {
            dispatch({ type: PROMOTION_ACTIONS.CLEAR_VALIDATION });
        },
        
        clearCurrentPromotion: () => {
            dispatch({ type: PROMOTION_ACTIONS.CLEAR_CURRENT_PROMOTION });
        }
    }), []);

    // Main API functions - completely stable
    const apiMethods = useMemo(() => {
        const createAbortController = () => {
            const controller = new AbortController();
            abortControllerRef.current = controller;
            return controller;
        };

        return {
            fetchPromotions: async (params = {}) => {
                const requestId = Date.now().toString();
                
                // Prevent duplicate requests
                if (pendingRequestsRef.current.has('fetchPromotions')) {
                    return;
                }
                
                try {
                    pendingRequestsRef.current.add('fetchPromotions');
                    actions.setLoading(true);
                    actions.clearError();
                    
                    // Get current state values
                    const currentFilters = state.filters;
                    const currentPagination = state.pagination;
                    
                    const mergedParams = {
                        ...currentFilters,
                        page: currentPagination.currentPage,
                        limit: currentPagination.limit,
                        ...params
                    };
                    
                    const response = await promotionService.getAllPromotions(mergedParams);
                    
                    // Check if request is still valid
                    if (pendingRequestsRef.current.has('fetchPromotions')) {
                        actions.setPromotions(response.data || [], response.pagination);
                    }
                } catch (error) {
                    if (pendingRequestsRef.current.has('fetchPromotions')) {
                        actions.setError(error.message);
                    }
                } finally {
                    pendingRequestsRef.current.delete('fetchPromotions');
                }
            },

            createPromotion: async (promotionData) => {
                try {
                    actions.setLoading(true);
                    actions.clearError();
                    
                    const transformedData = promotionService.transformPromotionData(promotionData);
                    const response = await promotionService.createPromotion(transformedData);
                    
                    actions.addPromotion(response.data);
                    return response.data;
                } catch (error) {
                    actions.setError(error.message);
                    throw error;
                }
            },

            getPromotionDetails: async (promotionId) => {
                try {
                    actions.setLoading(true);
                    actions.clearError();
                    const response = await promotionService.getPromotionDetails(promotionId);
                    console.log('API getPromotionDetails', promotionId, response.data); // Thêm dòng này
                    actions.setCurrentPromotion(response.data);
                    return response.data;
                } catch (error) {
                    actions.setError(error.message);
                    throw error;
                }
            },

            addPromotionDetails: async (promotionId, detailsData) => {
                try {
                    actions.setLoading(true);
                    actions.clearError();
                    
                    const transformedDetails = detailsData.map(detail =>
                        promotionService.transformPromotionDetailData(detail)
                    );
                    
                    const response = await promotionService.addPromotionDetails(promotionId, transformedDetails);
                    actions.setPromotionDetails(response.data);
                    return response.data;
                } catch (error) {
                    actions.setError(error.message);
                    throw error;
                }
            },

            getUsageHistory: async (promotionId, params = {}) => {
                try {
                    actions.setLoading(true);
                    actions.clearError();
                    
                    const response = await promotionService.getPromotionUsageHistory(promotionId, params);
                    actions.setUsageHistory(response.data || []);
                    return response.data;
                } catch (error) {
                    actions.setError(error.message);
                    throw error;
                }
            },

            validatePromotionCode: async (code, bookingInfo) => {
                try {
                    actions.setLoading(true);
                    actions.clearError();
                    
                    const response = await promotionService.validatePromotionCode(code, bookingInfo);
                    actions.setValidationResult(response);
                    return response;
                } catch (error) {
                    actions.setError(error.message);
                    throw error;
                }
            },

            applyPromotion: async (code, bookingData) => {
                try {
                    actions.setLoading(true);
                    actions.clearError();
                    
                    const response = await promotionService.applyPromotion(code, bookingData);
                    actions.setAppliedPromotion(response);
                    return response;
                } catch (error) {
                    actions.setError(error.message);
                    throw error;
                }
            }
        };
    }, [actions]);
        //[actions, state.filters, state.pagination]);
    // Memoized context value
    const contextValue = useMemo(() => ({
        // State
        ...state,
        
        // API Methods
        ...apiMethods,
        
        // Actions
        updateFilters: actions.updateFilters,
        resetFilters: actions.resetFilters,
        updatePagination: actions.updatePagination,
        clearValidation: actions.clearValidation,
        clearCurrentPromotion: actions.clearCurrentPromotion,
        clearError: actions.clearError,
        
        // Utilities
        cancelPendingRequests,
        
        // Computed values
        hasPromotions: state.promotions.length > 0,
        filteredPromotionsCount: state.promotions.length,
        isValidatingCode: state.loading && state.validationResult === null,
        isLoadingPromotions: state.loading && state.promotions.length === 0,
        hasError: !!state.error,
        hasCurrentPromotion: !!state.currentPromotion,
        hasPromotionDetails: state.promotionDetails.length > 0,
        hasUsageHistory: state.usageHistory.length > 0
    }), [state, apiMethods, actions, cancelPendingRequests]);

    return (
        <PromotionsContext.Provider value={contextValue}>
            {children}
        </PromotionsContext.Provider>
    );
};

// Hook to use promotions context
export const usePromotionsContext = () => {
    const context = useContext(PromotionsContext);
    if (!context) {
        throw new Error('usePromotionsContext must be used within a PromotionsProvider');
    }
    return context;
};

// Specialized hooks with built-in request management
export const usePromotionsList = (autoFetch = true) => {
    const { 
        promotions, 
        loading, 
        error, 
        fetchPromotions, 
        hasPromotions,
        filteredPromotionsCount 
    } = usePromotionsContext();
    
    // Auto fetch on mount - only once
    const hasFetched = useRef(false);
    
    const fetch = useCallback(() => {
        if (!hasFetched.current && autoFetch) {
            hasFetched.current = true;
            fetchPromotions();
        }
    }, [fetchPromotions, autoFetch]);
    
    return {
        promotions,
        loading,
        error,
        hasPromotions,
        filteredPromotionsCount,
        fetchPromotions,
        fetch
    };
};

export const usePromotionValidation = () => {
    const { 
        validatePromotionCode, 
        validationResult, 
        clearValidation, 
        isValidatingCode,
        loading
    } = usePromotionsContext();
    
    return {
        validateCode: validatePromotionCode,
        validationResult,
        clearValidation,
        isValidating: isValidatingCode || loading
    };
};

export const usePromotionFilters = () => {
    const { 
        filters, 
        updateFilters, 
        resetFilters, 
        fetchPromotions 
    } = usePromotionsContext();
    
    const applyFilters = useCallback((newFilters) => {
        updateFilters(newFilters);
        // Debounced fetch
        const timeoutId = setTimeout(() => {
            fetchPromotions();
        }, 300);
        
        return () => clearTimeout(timeoutId);
    }, [updateFilters, fetchPromotions]);
    
    return {
        filters,
        updateFilters,
        resetFilters,
        applyFilters
    };
};

export const usePromotionPagination = () => {
    const { 
        pagination, 
        updatePagination, 
        fetchPromotions 
    } = usePromotionsContext();
    
    const goToPage = useCallback((page) => {
        if (page !== pagination.currentPage) {
            updatePagination({ currentPage: page });
            fetchPromotions();
        }
    }, [updatePagination, fetchPromotions, pagination.currentPage]);
    
    const changePageSize = useCallback((limit) => {
        if (limit !== pagination.limit) {
            updatePagination({ limit, currentPage: 1 });
            fetchPromotions();
        }
    }, [updatePagination, fetchPromotions, pagination.limit]);
    
    return {
        pagination,
        goToPage,
        changePageSize,
        updatePagination
    };
};

export default PromotionsContext;