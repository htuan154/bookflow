// src/hooks/usePromotions.js
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { usePromotionsContext } from '../context/PromotionsContext';
import promotionService from '../api/promotions.service';

// Custom hook for promotions management
export const usePromotions = (options = {}) => {
    const {
        autoFetch = true,
        hotelId = null,
        status = 'all',
        initialFilters = {}
    } = options;

    const context = usePromotionsContext();
    
    // Local state for additional functionality
    const [localLoading, setLocalLoading] = useState(false);
    const [localError, setLocalError] = useState(null);

    // ✅ FIX: Stable reference for filters initialization
    const initFilters = useCallback(() => {
        const filtersToApply = {};
        
        if (Object.keys(initialFilters).length > 0) {
            Object.assign(filtersToApply, initialFilters);
        }
        if (hotelId) {
            filtersToApply.hotelId = hotelId;
        }
        if (status !== 'all') {
            filtersToApply.status = status;
        }
        
        if (Object.keys(filtersToApply).length > 0) {
            context.updateFilters(filtersToApply);
        }
    }, [hotelId, status, JSON.stringify(initialFilters), context.updateFilters]);

    // ✅ Initialize filters once
    useEffect(() => {
        initFilters();
    }, [initFilters]);

    // ✅ Auto fetch with stable dependency
    useEffect(() => {
        if (autoFetch && context.fetchPromotions) {
            context.fetchPromotions();
        }
    }, [autoFetch, context.fetchPromotions]);

    // Clear errors
    const clearErrors = useCallback(() => {
        context.clearError();
        setLocalError(null);
    }, [context]);

    // Handle local operations
    const handleLocalOperation = useCallback(async (operation) => {
        try {
            setLocalLoading(true);
            setLocalError(null);
            const result = await operation();
            return result;
        } catch (error) {
            setLocalError(error.message);
            throw error;
        } finally {
            setLocalLoading(false);
        }
    }, []);

    return {
        // Context state and actions
        ...context,
        
        // Additional loading and error states
        localLoading,
        localError,
        isLoading: context.loading || localLoading,
        hasError: !!(context.error || localError),
        errorMessage: context.error || localError,
        
        // Enhanced actions
        clearErrors,
        handleLocalOperation
    };
};

// ✅ NEW: Hook for promotion bulk operations
export const usePromotionBulkOperations = () => {
    const { bulkUpdatePromotions, bulkDeletePromotions, selectedPromotions } = usePromotionsContext();
    const [localState, setLocalState] = useState({
        selectedIds: [],
        isSelectAll: false,
        bulkLoading: false,
        bulkError: null
    });

    // Select/deselect promotions
    const toggleSelection = useCallback((promotionId) => {
        setLocalState(prev => ({
            ...prev,
            selectedIds: prev.selectedIds.includes(promotionId)
                ? prev.selectedIds.filter(id => id !== promotionId)
                : [...prev.selectedIds, promotionId]
        }));
    }, []);

    // Select all promotions
    const selectAll = useCallback((promotionIds) => {
        setLocalState(prev => ({
            ...prev,
            selectedIds: prev.isSelectAll ? [] : promotionIds,
            isSelectAll: !prev.isSelectAll
        }));
    }, []);

    // Clear selection
    const clearSelection = useCallback(() => {
        setLocalState(prev => ({
            ...prev,
            selectedIds: [],
            isSelectAll: false
        }));
    }, []);

    // Bulk update
    const performBulkUpdate = useCallback(async (updateData) => {
        if (localState.selectedIds.length === 0) {
            throw new Error('Không có khuyến mãi nào được chọn');
        }

        try {
            setLocalState(prev => ({ ...prev, bulkLoading: true, bulkError: null }));
            const result = await bulkUpdatePromotions(localState.selectedIds, updateData);
            clearSelection();
            return result;
        } catch (error) {
            setLocalState(prev => ({ ...prev, bulkError: error.message }));
            throw error;
        } finally {
            setLocalState(prev => ({ ...prev, bulkLoading: false }));
        }
    }, [localState.selectedIds, bulkUpdatePromotions, clearSelection]);

    // Bulk delete
    const performBulkDelete = useCallback(async () => {
        if (localState.selectedIds.length === 0) {
            throw new Error('Không có khuyến mãi nào được chọn');
        }

        try {
            setLocalState(prev => ({ ...prev, bulkLoading: true, bulkError: null }));
            const result = await bulkDeletePromotions(localState.selectedIds);
            clearSelection();
            return result;
        } catch (error) {
            setLocalState(prev => ({ ...prev, bulkError: error.message }));
            throw error;
        } finally {
            setLocalState(prev => ({ ...prev, bulkLoading: false }));
        }
    }, [localState.selectedIds, bulkDeletePromotions, clearSelection]);

    return {
        selectedIds: localState.selectedIds,
        isSelectAll: localState.isSelectAll,
        bulkLoading: localState.bulkLoading,
        bulkError: localState.bulkError,
        selectedCount: localState.selectedIds.length,
        hasSelection: localState.selectedIds.length > 0,
        toggleSelection,
        selectAll,
        clearSelection,
        performBulkUpdate,
        performBulkDelete
    };
};

// ✅ NEW: Hook for promotion import/export
export const usePromotionImportExport = () => {
    const { exportPromotions, importPromotions } = usePromotionsContext();
    const [exportState, setExportState] = useState({
        isExporting: false,
        exportError: null,
        exportProgress: 0
    });
    const [importState, setImportState] = useState({
        isImporting: false,
        importError: null,
        importProgress: 0,
        importResult: null
    });

    // Export promotions with progress tracking
    const performExport = useCallback(async (filters = {}, format = 'csv') => {
        try {
            setExportState(prev => ({ ...prev, isExporting: true, exportError: null, exportProgress: 0 }));
            
            // Simulate progress
            const progressInterval = setInterval(() => {
                setExportState(prev => ({
                    ...prev,
                    exportProgress: Math.min(prev.exportProgress + 10, 90)
                }));
            }, 100);

            const result = await exportPromotions(filters);
            
            clearInterval(progressInterval);
            setExportState(prev => ({ ...prev, exportProgress: 100 }));
            
            // Reset after delay
            setTimeout(() => {
                setExportState(prev => ({ ...prev, isExporting: false, exportProgress: 0 }));
            }, 1000);

            return result;
        } catch (error) {
            setExportState(prev => ({ 
                ...prev, 
                isExporting: false, 
                exportError: error.message,
                exportProgress: 0
            }));
            throw error;
        }
    }, [exportPromotions]);

    // Import promotions with progress tracking
    const performImport = useCallback(async (file) => {
        try {
            setImportState(prev => ({ 
                ...prev, 
                isImporting: true, 
                importError: null, 
                importProgress: 0,
                importResult: null
            }));

            // Simulate progress
            const progressInterval = setInterval(() => {
                setImportState(prev => ({
                    ...prev,
                    importProgress: Math.min(prev.importProgress + 5, 90)
                }));
            }, 200);

            const result = await importPromotions(file);
            
            clearInterval(progressInterval);
            setImportState(prev => ({ 
                ...prev, 
                importProgress: 100,
                importResult: result
            }));

            // Reset after delay
            setTimeout(() => {
                setImportState(prev => ({ 
                    ...prev, 
                    isImporting: false, 
                    importProgress: 0
                }));
            }, 2000);

            return result;
        } catch (error) {
            setImportState(prev => ({ 
                ...prev, 
                isImporting: false, 
                importError: error.message,
                importProgress: 0
            }));
            throw error;
        }
    }, [importPromotions]);

    // Reset states
    const resetExportState = useCallback(() => {
        setExportState({
            isExporting: false,
            exportError: null,
            exportProgress: 0
        });
    }, []);

    const resetImportState = useCallback(() => {
        setImportState({
            isImporting: false,
            importError: null,
            importProgress: 0,
            importResult: null
        });
    }, []);

    return {
        // Export
        isExporting: exportState.isExporting,
        exportError: exportState.exportError,
        exportProgress: exportState.exportProgress,
        performExport,
        resetExportState,
        
        // Import
        isImporting: importState.isImporting,
        importError: importState.importError,
        importProgress: importState.importProgress,
        importResult: importState.importResult,
        performImport,
        resetImportState
    };
};

// ✅ NEW: Hook for promotion analytics and statistics
export const usePromotionAnalytics = (promotionId = null) => {
    const { getPromotionStats, promotions } = usePromotionsContext();
    const [analyticsState, setAnalyticsState] = useState({
        stats: null,
        loading: false,
        error: null,
        overallStats: null
    });

    // Fetch individual promotion stats
    const fetchPromotionStats = useCallback(async (id = promotionId) => {
        if (!id) return;

        try {
            setAnalyticsState(prev => ({ ...prev, loading: true, error: null }));
            const stats = await getPromotionStats(id);
            setAnalyticsState(prev => ({ ...prev, stats, loading: false }));
            return stats;
        } catch (error) {
            setAnalyticsState(prev => ({ 
                ...prev, 
                loading: false, 
                error: error.message 
            }));
            throw error;
        }
    }, [promotionId, getPromotionStats]);

    // Calculate overall statistics
    const calculateOverallStats = useCallback(() => {
        if (!promotions || promotions.length === 0) {
            return {
                total: 0,
                active: 0,
                inactive: 0,
                expired: 0,
                upcoming: 0,
                totalUsage: 0,
                averageDiscount: 0,
                mostUsedPromotion: null,
                recentPromotions: []
            };
        }

        const now = new Date();
        const stats = {
            total: promotions.length,
            active: promotions.filter(p => p.status === 'active').length,
            inactive: promotions.filter(p => p.status === 'inactive').length,
            expired: promotions.filter(p => p.status === 'expired').length,
            upcoming: promotions.filter(p => new Date(p.validFrom) > now).length,
            totalUsage: promotions.reduce((sum, p) => sum + (p.usedCount || 0), 0),
            averageDiscount: promotions.reduce((sum, p) => sum + (parseFloat(p.discountValue) || 0), 0) / promotions.length,
            mostUsedPromotion: promotions.reduce((max, p) => 
                (p.usedCount || 0) > (max?.usedCount || 0) ? p : max, null
            ),
            recentPromotions: promotions
                .filter(p => new Date(p.createdAt || p.validFrom) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
                .length
        };

        setAnalyticsState(prev => ({ ...prev, overallStats: stats }));
        return stats;
    }, [promotions]);

    // Auto-calculate overall stats when promotions change
    useEffect(() => {
        calculateOverallStats();
    }, [calculateOverallStats]);

    // Auto-fetch individual stats when promotionId changes
    useEffect(() => {
        if (promotionId) {
            fetchPromotionStats(promotionId);
        }
    }, [promotionId, fetchPromotionStats]);

    return {
        // Individual promotion stats
        stats: analyticsState.stats,
        loading: analyticsState.loading,
        error: analyticsState.error,
        
        // Overall statistics
        overallStats: analyticsState.overallStats,
        
        // Actions
        fetchPromotionStats,
        calculateOverallStats,
        refreshStats: () => {
            if (promotionId) fetchPromotionStats();
            calculateOverallStats();
        }
    };
};

// Hook for promotion validation and application
export const usePromotionValidation = () => {
    const { validatePromotionCode, applyPromotion, validationResult, appliedPromotion, loading, clearValidation } = usePromotionsContext();
    const [validationState, setValidationState] = useState({
        isValidating: false,
        isApplying: false,
        validatedCode: null,
        appliedCode: null
    });

    // Validate promotion with debounce
    const validateCode = useCallback(async (code, bookingInfo, delay = 500) => {
        if (!code || code.length < 3) {
            clearValidation();
            return;
        }

        setValidationState(prev => ({ ...prev, isValidating: true, validatedCode: code }));

        // Debounce validation
        const timeoutId = setTimeout(async () => {
            try {
                await validatePromotionCode(code, bookingInfo);
            } catch (error) {
                console.error('Validation error:', error);
            } finally {
                setValidationState(prev => ({ ...prev, isValidating: false }));
            }
        }, delay);

        return () => clearTimeout(timeoutId);
    }, [validatePromotionCode, clearValidation]);

    // Apply promotion
    const applyCode = useCallback(async (code, bookingData) => {
        setValidationState(prev => ({ ...prev, isApplying: true }));
        
        try {
            const result = await applyPromotion(code, bookingData);
            setValidationState(prev => ({ ...prev, appliedCode: code }));
            return result;
        } catch (error) {
            throw error;
        } finally {
            setValidationState(prev => ({ ...prev, isApplying: false }));
        }
    }, [applyPromotion]);

    // Reset validation state
    const resetValidation = useCallback(() => {
        clearValidation();
        setValidationState({
            isValidating: false,
            isApplying: false,
            validatedCode: null,
            appliedCode: null
        });
    }, [clearValidation]);

    return {
        validationResult,
        appliedPromotion,
        ...validationState,
        isLoading: loading || validationState.isValidating || validationState.isApplying,
        validateCode,
        applyCode,
        resetValidation,
        isCodeValid: validationResult?.valid === true,
        validationMessage: validationResult?.message,
        discountAmount: validationResult?.discountAmount || appliedPromotion?.discountAmount
    };
};

// Hook for promotion statistics
export const usePromotionStats = (promotionId) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchStats = useCallback(async () => {
        if (!promotionId) return;

        try {
            setLoading(true);
            setError(null);
            const statsData = await promotionService.getPromotionStats(promotionId);
            setStats(statsData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [promotionId]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return {
        stats,
        loading,
        error,
        refetch: fetchStats,
        usagePercentage: stats ? (stats.totalUsage / Math.max(stats.usageLimit, 1)) * 100 : 0,
        remainingUsage: stats?.remainingUsage || 0,
        isFullyUsed: stats ? stats.remainingUsage <= 0 : false
    };
};

// Hook for promotion filtering and search
export const usePromotionFilters = () => {
    const { filters, updateFilters, resetFilters, fetchPromotions } = usePromotionsContext();
    const [localFilters, setLocalFilters] = useState(filters);

    // Sync local filters with context
    useEffect(() => {
        setLocalFilters(filters);
    }, [filters]);

    // Apply filters with debounce
    const applyFilters = useCallback((newFilters, immediate = false) => {
        const mergedFilters = { ...localFilters, ...newFilters };
        setLocalFilters(mergedFilters);

        const applyFn = () => {
            updateFilters(mergedFilters);
            fetchPromotions();
        };

        if (immediate) {
            applyFn();
        } else {
            // Debounce for search
            const timeoutId = setTimeout(applyFn, 300);
            return () => clearTimeout(timeoutId);
        }
    }, [localFilters, updateFilters, fetchPromotions]);

    // Quick filter functions
    const filterByStatus = useCallback((status) => {
        applyFilters({ status }, true);
    }, [applyFilters]);

    const filterByHotel = useCallback((hotelId) => {
        applyFilters({ hotelId }, true);
    }, [applyFilters]);

    const searchPromotions = useCallback((search) => {
        applyFilters({ search });
    }, [applyFilters]);

    const filterByDateRange = useCallback((dateRange) => {
        applyFilters({ dateRange }, true);
    }, [applyFilters]);

    // Reset all filters
    const clearAllFilters = useCallback(() => {
        resetFilters();
        setLocalFilters({});
        fetchPromotions();
    }, [resetFilters, fetchPromotions]);

    return {
        filters: localFilters,
        applyFilters,
        filterByStatus,
        filterByHotel,
        searchPromotions,
        filterByDateRange,
        clearAllFilters,
        hasActiveFilters: Object.values(localFilters).some(value => 
            value !== null && value !== '' && value !== 'all'
        )
    };
};

// ✅ NEW: Hook for promotion code availability
export const usePromotionCodeCheck = () => {
    const { checkCodeAvailability } = usePromotionsContext();
    const [checkState, setCheckState] = useState({
        isChecking: false,
        checkResult: null,
        checkError: null,
        lastCheckedCode: null
    });

    // Debounced code availability check
    const checkCodeAvailabilityDebounced = useCallback(
        debounce(async (code, excludeId = null) => {
            if (!code || code.length < 2) {
                setCheckState(prev => ({ 
                    ...prev, 
                    checkResult: null, 
                    checkError: null,
                    lastCheckedCode: null
                }));
                return;
            }

            try {
                setCheckState(prev => ({ 
                    ...prev, 
                    isChecking: true, 
                    checkError: null,
                    lastCheckedCode: code
                }));
                
                const result = await checkCodeAvailability(code, excludeId);
                
                setCheckState(prev => ({ 
                    ...prev, 
                    isChecking: false, 
                    checkResult: result
                }));
                
                return result;
            } catch (error) {
                setCheckState(prev => ({ 
                    ...prev, 
                    isChecking: false, 
                    checkError: error.message
                }));
                throw error;
            }
        }, 500),
        [checkCodeAvailability]
    );

    // Reset check state
    const resetCheckState = useCallback(() => {
        setCheckState({
            isChecking: false,
            checkResult: null,
            checkError: null,
            lastCheckedCode: null
        });
    }, []);

    return {
        isChecking: checkState.isChecking,
        checkResult: checkState.checkResult,
        checkError: checkState.checkError,
        lastCheckedCode: checkState.lastCheckedCode,
        isCodeAvailable: checkState.checkResult?.available === true,
        checkCode: checkCodeAvailabilityDebounced,
        resetCheckState
    };
};

// Hook for promotion form management
export const usePromotionForm = (initialData = null) => {
    const { createPromotion, updatePromotion } = usePromotionsContext();
    const [formData, setFormData] = useState(() => {
      if (initialData) {
        return {
          ...initialData,
          max_discount_amount: initialData.maxDiscountAmount ?? ''
        };
      }
      return {
        hotelId: null,
        code: '',
        name: '',
        description: '',
        discountValue: 0,
        minBookingPrice: 0,
        validFrom: '',
        validUntil: '',
        usageLimit: 0,
        status: 'active',
        promotionType: 'percentage'
      };
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Update form data
    const updateFormData = useCallback((updates) => {
        setFormData(prev => ({ ...prev, ...updates }));
        // Clear related errors
        setErrors(prevErrors => {
            const clearedErrors = { ...prevErrors };
            Object.keys(updates).forEach(key => {
                delete clearedErrors[key];
            });
            return clearedErrors;
        });
    }, []); // Remove errors dependency to prevent infinite loop

    // Validate form
    const validateForm = useCallback(() => {
        const newErrors = {};

        if (!formData.code?.trim()) newErrors.code = 'Promotion code is required';
        if (!formData.name?.trim()) newErrors.name = 'Promotion name is required';
        if (!formData.validFrom) newErrors.validFrom = 'Start date is required';
        if (!formData.validUntil) newErrors.validUntil = 'End date is required';
        if (formData.discountValue <= 0) newErrors.discountValue = 'Discount value must be greater than 0';
        if (formData.usageLimit <= 0) newErrors.usageLimit = 'Usage limit must be greater than 0';

        // Date validation
        if (formData.validFrom && formData.validUntil) {
            if (new Date(formData.validFrom) >= new Date(formData.validUntil)) {
                newErrors.validUntil = 'End date must be after start date';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);

    // Submit form
    const submitForm = useCallback(async () => {
        if (!validateForm()) {
            return false;
        }

        try {
            setIsSubmitting(true);
            
            if (initialData?.promotionId) {
                // Update existing promotion
                await updatePromotion(initialData.promotionId, formData);
            } else {
                // Create new promotion
                await createPromotion(formData);
            }
            
            return true;
        } catch (error) {
            setErrors({ submit: error.message });
            return false;
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, validateForm, createPromotion, updatePromotion, initialData]);

    // Reset form
    const resetForm = useCallback(() => {
        setFormData(initialData || {});
        setErrors({});
        setIsSubmitting(false);
    }, [initialData]);

    return {
        formData,
        errors,
        isSubmitting,
        updateFormData,
        validateForm,
        submitForm,
        resetForm,
        isValid: Object.keys(errors).length === 0,
        hasChanges: JSON.stringify(formData) !== JSON.stringify(initialData)
    };
};

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

export default usePromotions;