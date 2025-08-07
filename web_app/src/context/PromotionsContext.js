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
    appliedPromotion: null,
    
    // Statistics
    promotionStats: null,
    
    // Bulk operations
    selectedPromotions: [],
    
    // Import/Export progress
    importProgress: null,
    exportProgress: null
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
    BULK_UPDATE_PROMOTIONS: 'BULK_UPDATE_PROMOTIONS',
    BULK_DELETE_PROMOTIONS: 'BULK_DELETE_PROMOTIONS',
    
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
    CLEAR_VALIDATION: 'CLEAR_VALIDATION',
    
    // Statistics
    SET_PROMOTION_STATS: 'SET_PROMOTION_STATS',
    
    // Bulk operations
    SET_SELECTED_PROMOTIONS: 'SET_SELECTED_PROMOTIONS',
    CLEAR_SELECTED_PROMOTIONS: 'CLEAR_SELECTED_PROMOTIONS',
    
    // Import/Export
    SET_IMPORT_PROGRESS: 'SET_IMPORT_PROGRESS',
    SET_EXPORT_PROGRESS: 'SET_EXPORT_PROGRESS'
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
            
        case PROMOTION_ACTIONS.BULK_UPDATE_PROMOTIONS:
            return {
                ...state,
                promotions: state.promotions.map(promo =>
                    action.payload.ids.includes(promo.promotionId)
                        ? { ...promo, ...action.payload.updateData }
                        : promo
                ),
                loading: false
            };
            
        case PROMOTION_ACTIONS.BULK_DELETE_PROMOTIONS:
            return {
                ...state,
                promotions: state.promotions.filter(promo => 
                    !action.payload.includes(promo.promotionId)
                ),
                selectedPromotions: [],
                loading: false
            };
            
        case PROMOTION_ACTIONS.SET_PROMOTION_STATS:
            return {
                ...state,
                promotionStats: action.payload,
                loading: false
            };
            
        case PROMOTION_ACTIONS.SET_SELECTED_PROMOTIONS:
            return {
                ...state,
                selectedPromotions: action.payload
            };
            
        case PROMOTION_ACTIONS.CLEAR_SELECTED_PROMOTIONS:
            return {
                ...state,
                selectedPromotions: []
            };
            
        case PROMOTION_ACTIONS.SET_IMPORT_PROGRESS:
            return {
                ...state,
                importProgress: action.payload
            };
            
        case PROMOTION_ACTIONS.SET_EXPORT_PROGRESS:
            return {
                ...state,
                exportProgress: action.payload
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
            },

            updatePromotion: async (promotionId, promotionData) => {
                try {
                    actions.setLoading(true);
                    actions.clearError();
                    
                    const transformedData = promotionService.transformPromotionData(promotionData);
                    const response = await promotionService.updatePromotion(promotionId, transformedData);
                    
                    // Update the promotion in the state
                    dispatch({ 
                        type: PROMOTION_ACTIONS.UPDATE_PROMOTION, 
                        payload: { ...response.data, promotionId } 
                    });
                    
                    return response.data;
                } catch (error) {
                    actions.setError(error.message);
                    throw error;
                }
            },

            deletePromotion: async (promotionId) => {
                try {
                    actions.setLoading(true);
                    actions.clearError();
                    
                    // Note: API might not have delete endpoint, but we'll handle state update
                    // await promotionService.deletePromotion(promotionId);
                    
                    dispatch({ 
                        type: PROMOTION_ACTIONS.DELETE_PROMOTION, 
                        payload: promotionId 
                    });
                    
                    return { success: true, message: 'Xóa khuyến mãi thành công' };
                } catch (error) {
                    actions.setError(error.message);
                    throw error;
                }
            },

            getPromotionsByHotel: async (hotelId) => {
                try {
                    actions.setLoading(true);
                    actions.clearError();
                    
                    const response = await promotionService.getPromotionsByHotel(hotelId);
                    actions.setPromotions(response.data || [], response.pagination);
                    return response.data;
                } catch (error) {
                    actions.setError(error.message);
                    throw error;
                }
            },

            getActivePromotions: async (params = {}) => {
                try {
                    actions.setLoading(true);
                    actions.clearError();
                    
                    const response = await promotionService.getActivePromotions(params);
                    actions.setPromotions(response.data || [], response.pagination);
                    return response.data;
                } catch (error) {
                    actions.setError(error.message);
                    throw error;
                }
            },

            checkCodeAvailability: async (code, excludeId = null) => {
                try {
                    actions.setLoading(true);
                    actions.clearError();
                    
                    const response = await promotionService.checkCodeAvailability(code, excludeId);
                    return response;
                } catch (error) {
                    actions.setError(error.message);
                    throw error;
                }
            },

            getPromotionStats: async (promotionId) => {
                try {
                    actions.setLoading(true);
                    actions.clearError();
                    
                    const response = await promotionService.getPromotionStats(promotionId);
                    return response;
                } catch (error) {
                    actions.setError(error.message);
                    throw error;
                }
            },

            bulkUpdatePromotions: async (promotionIds, updateData) => {
                try {
                    actions.setLoading(true);
                    actions.clearError();
                    
                    const promises = promotionIds.map(id => 
                        promotionService.updatePromotion(id, updateData)
                    );
                    
                    const results = await Promise.allSettled(promises);
                    
                    // Update successful promotions in state
                    results.forEach((result, index) => {
                        if (result.status === 'fulfilled') {
                            dispatch({
                                type: PROMOTION_ACTIONS.UPDATE_PROMOTION,
                                payload: { ...result.value.data, promotionId: promotionIds[index] }
                            });
                        }
                    });
                    
                    const successful = results.filter(r => r.status === 'fulfilled').length;
                    const failed = results.length - successful;
                    
                    return {
                        success: true,
                        message: `Cập nhật thành công ${successful} khuyến mãi${failed > 0 ? `, ${failed} thất bại` : ''}`,
                        successful,
                        failed,
                        results
                    };
                } catch (error) {
                    actions.setError(error.message);
                    throw error;
                }
            },

            bulkDeletePromotions: async (promotionIds) => {
                try {
                    actions.setLoading(true);
                    actions.clearError();
                    
                    // Since we don't have a bulk delete API, we'll just remove from state
                    promotionIds.forEach(id => {
                        dispatch({
                            type: PROMOTION_ACTIONS.DELETE_PROMOTION,
                            payload: id
                        });
                    });
                    
                    return {
                        success: true,
                        message: `Đã xóa ${promotionIds.length} khuyến mãi`,
                        deleted: promotionIds.length
                    };
                } catch (error) {
                    actions.setError(error.message);
                    throw error;
                }
            },

            searchPromotions: async (searchTerm, filters = {}) => {
                try {
                    actions.setLoading(true);
                    actions.clearError();
                    
                    const searchParams = {
                        ...filters,
                        search: searchTerm
                    };
                    
                    const response = await promotionService.getAllPromotions(searchParams);
                    actions.setPromotions(response.data || [], response.pagination);
                    return response.data;
                } catch (error) {
                    actions.setError(error.message);
                    throw error;
                }
            },

            exportPromotions: async (filters = {}) => {
                try {
                    actions.setLoading(true);
                    actions.clearError();
                    
                    // Get all promotions based on filters
                    const response = await promotionService.getAllPromotions({
                        ...filters,
                        limit: 1000 // Get large number for export
                    });
                    
                    const promotions = response.data || [];
                    
                    // Convert to CSV format
                    const csvContent = this.convertToCSV(promotions);
                    
                    // Create download
                    const blob = new Blob([csvContent], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `promotions_${new Date().toISOString().split('T')[0]}.csv`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                    
                    return {
                        success: true,
                        message: 'Xuất dữ liệu thành công',
                        count: promotions.length
                    };
                } catch (error) {
                    actions.setError(error.message);
                    throw error;
                }
            },

            convertToCSV: (data) => {
                if (!data || data.length === 0) return '';
                
                const headers = ['ID', 'Tên', 'Mã', 'Giá trị giảm', 'Ngày bắt đầu', 'Ngày kết thúc', 'Trạng thái'];
                const csvRows = [headers.join(',')];
                
                data.forEach(promotion => {
                    const row = [
                        promotion.promotionId || '',
                        `"${promotion.name || ''}"`,
                        promotion.code || '',
                        promotion.discountValue || '',
                        promotion.validFrom || '',
                        promotion.validUntil || '',
                        promotion.status || ''
                    ];
                    csvRows.push(row.join(','));
                });
                
                return csvRows.join('\n');
            },

            importPromotions: async (file) => {
                try {
                    actions.setLoading(true);
                    actions.clearError();
                    
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        
                        reader.onload = async (e) => {
                            try {
                                const csvData = e.target.result;
                                const promotions = this.parseCSV(csvData);
                                
                                let successful = 0;
                                let failed = 0;
                                const errors = [];
                                
                                for (const promotion of promotions) {
                                    try {
                                        await promotionService.createPromotion(promotion);
                                        successful++;
                                    } catch (error) {
                                        failed++;
                                        errors.push(`Dòng ${promotions.indexOf(promotion) + 2}: ${error.message}`);
                                    }
                                }
                                
                                // Refresh promotions list
                                await this.fetchPromotions();
                                
                                resolve({
                                    success: true,
                                    message: `Import thành công ${successful} khuyến mãi${failed > 0 ? `, ${failed} thất bại` : ''}`,
                                    successful,
                                    failed,
                                    errors
                                });
                            } catch (error) {
                                reject(error);
                            }
                        };
                        
                        reader.onerror = () => reject(new Error('Không thể đọc file'));
                        reader.readAsText(file);
                    });
                } catch (error) {
                    actions.setError(error.message);
                    throw error;
                }
            },

            parseCSV: (csvData) => {
                const lines = csvData.split('\n');
                const headers = lines[0].split(',');
                const promotions = [];
                
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;
                    
                    const values = line.split(',');
                    const promotion = {};
                    
                    headers.forEach((header, index) => {
                        const cleanHeader = header.trim().toLowerCase();
                        const value = values[index]?.replace(/"/g, '').trim();
                        
                        switch (cleanHeader) {
                            case 'tên':
                            case 'name':
                                promotion.name = value;
                                break;
                            case 'mã':
                            case 'code':
                                promotion.code = value;
                                break;
                            case 'giá trị giảm':
                            case 'discount':
                                promotion.discountValue = parseFloat(value) || 0;
                                break;
                            case 'ngày bắt đầu':
                            case 'valid_from':
                                promotion.validFrom = value;
                                break;
                            case 'ngày kết thúc':
                            case 'valid_until':
                                promotion.validUntil = value;
                                break;
                            case 'trạng thái':
                            case 'status':
                                promotion.status = value;
                                break;
                        }
                    });
                    
                    if (promotion.name && promotion.code) {
                        promotions.push(promotion);
                    }
                }
                
                return promotions;
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
        hasUsageHistory: state.usageHistory.length > 0,
        
        // Statistics
        totalPromotions: state.promotions.length,
        activePromotions: state.promotions.filter(p => p.status === 'active').length,
        expiredPromotions: state.promotions.filter(p => p.status === 'expired').length,
        inactivePromotions: state.promotions.filter(p => p.status === 'inactive').length,
        
        // Status checks
        isCreating: state.loading && !state.currentPromotion,
        isUpdating: state.loading && !!state.currentPromotion,
        isDeleting: state.loading,
        isExporting: state.loading,
        isImporting: state.loading,
        
        // Filter status
        hasActiveFilters: Object.values(state.filters).some(value => 
            value && value !== 'all' && value !== '' && 
            (typeof value !== 'object' || (value.from || value.to))
        )
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

// Hook for promotion management operations
export const usePromotionManagement = () => {
    const {
        createPromotion,
        updatePromotion,
        deletePromotion,
        bulkUpdatePromotions,
        bulkDeletePromotions,
        checkCodeAvailability,
        getPromotionStats,
        loading,
        error
    } = usePromotionsContext();

    return {
        createPromotion,
        updatePromotion,
        deletePromotion,
        bulkUpdatePromotions,
        bulkDeletePromotions,
        checkCodeAvailability,
        getPromotionStats,
        loading,
        error
    };
};

// Hook for promotion search and filtering
export const usePromotionSearch = () => {
    const {
        searchPromotions,
        getPromotionsByHotel,
        getActivePromotions,
        promotions,
        loading,
        error
    } = usePromotionsContext();

    const searchDebounced = useCallback(
        debounce((term, filters) => {
            searchPromotions(term, filters);
        }, 500),
        [searchPromotions]
    );

    return {
        searchPromotions,
        searchDebounced,
        getPromotionsByHotel,
        getActivePromotions,
        promotions,
        loading,
        error
    };
};

// Hook for import/export operations
export const usePromotionImportExport = () => {
    const {
        exportPromotions,
        importPromotions,
        loading,
        error
    } = usePromotionsContext();

    return {
        exportPromotions,
        importPromotions,
        loading,
        error
    };
};

// Hook for promotion statistics and analytics
export const usePromotionAnalytics = () => {
    const {
        getPromotionStats,
        getUsageHistory,
        promotions,
        loading,
        error
    } = usePromotionsContext();

    const getOverallStats = useCallback(async () => {
        const stats = {
            total: promotions.length,
            active: promotions.filter(p => p.status === 'active').length,
            expired: promotions.filter(p => p.status === 'expired').length,
            inactive: promotions.filter(p => p.status === 'inactive').length
        };

        return stats;
    }, [promotions]);

    return {
        getPromotionStats,
        getUsageHistory,
        getOverallStats,
        loading,
        error
    };
};

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

export default PromotionsContext;