// src/hooks/usePromotions.js
import { useState, useEffect, useCallback } from 'react';
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

    // Initialize filters
    useEffect(() => {
        if (Object.keys(initialFilters).length > 0) {
            context.updateFilters(initialFilters);
        }
        if (hotelId) {
            context.updateFilters({ hotelId });
        }
        if (status !== 'all') {
            context.updateFilters({ status });
        }
    }, [hotelId, status, initialFilters, context]);

    // Auto fetch on mount or filter changes
    useEffect(() => {
        if (autoFetch) {
            context.fetchPromotions();
        }
    },[autoFetch, context.fetchPromotions, context.filters]); 
    //[autoFetch, context.filters, context]);

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

// Hook for promotion form management
export const usePromotionForm = (initialData = null) => {
    const { createPromotion, updatePromotion } = usePromotionsContext();
    const [formData, setFormData] = useState(initialData || {
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
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Update form data
    const updateFormData = useCallback((updates) => {
        setFormData(prev => ({ ...prev, ...updates }));
        // Clear related errors
        const clearedErrors = { ...errors };
        Object.keys(updates).forEach(key => {
            delete clearedErrors[key];
        });
        setErrors(clearedErrors);
    }, [errors]);

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

export default usePromotions;