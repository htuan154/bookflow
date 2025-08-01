// src/constants/contractConstants.js

// Trạng thái hợp đồng
export const CONTRACT_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    EXPIRED: 'expired',
    ACTIVE: 'active',
    CANCELLED: 'cancelled'
};

// Mapping trạng thái sang tiếng Việt
export const CONTRACT_STATUS_LABELS = {
    [CONTRACT_STATUS.PENDING]: 'Chờ duyệt',
    [CONTRACT_STATUS.APPROVED]: 'Đã duyệt',
    [CONTRACT_STATUS.REJECTED]: 'Từ chối',
    [CONTRACT_STATUS.EXPIRED]: 'Hết hạn',
    [CONTRACT_STATUS.ACTIVE]: 'Đang hoạt động',
    [CONTRACT_STATUS.CANCELLED]: 'Đã hủy'
};

// Màu sắc cho từng trạng thái (Tailwind CSS classes)
export const CONTRACT_STATUS_COLORS = {
    [CONTRACT_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800',
    [CONTRACT_STATUS.APPROVED]: 'bg-green-100 text-green-800',
    [CONTRACT_STATUS.REJECTED]: 'bg-red-100 text-red-800',
    [CONTRACT_STATUS.EXPIRED]: 'bg-gray-100 text-gray-800',
    [CONTRACT_STATUS.ACTIVE]: 'bg-blue-100 text-blue-800',
    [CONTRACT_STATUS.CANCELLED]: 'bg-red-100 text-red-800'
};

// Loại hợp đồng
export const CONTRACT_TYPES = {
    PARTNERSHIP: 'partnership',
    SERVICE: 'service',
    COMMISSION: 'commission',
    EXCLUSIVE: 'exclusive'
};

// Mapping loại hợp đồng sang tiếng Việt
export const CONTRACT_TYPE_LABELS = {
    [CONTRACT_TYPES.PARTNERSHIP]: 'Hợp tác',
    [CONTRACT_TYPES.SERVICE]: 'Dịch vụ',
    [CONTRACT_TYPES.COMMISSION]: 'Hoa hồng',
    [CONTRACT_TYPES.EXCLUSIVE]: 'Độc quyền'
};

// Đơn vị tiền tệ
export const CURRENCIES = {
    VND: 'VND',
    USD: 'USD',
    EUR: 'EUR'
};

// Mapping đơn vị tiền tệ
export const CURRENCY_LABELS = {
    [CURRENCIES.VND]: 'VNĐ',
    [CURRENCIES.USD]: 'USD',
    [CURRENCIES.EUR]: 'EUR'
};

// Điều khoản thanh toán
export const PAYMENT_TERMS = {
    MONTHLY: 'monthly',
    QUARTERLY: 'quarterly',
    YEARLY: 'yearly',
    ONE_TIME: 'one_time'
};

// Mapping điều khoản thanh toán
export const PAYMENT_TERM_LABELS = {
    [PAYMENT_TERMS.MONTHLY]: 'Hàng tháng',
    [PAYMENT_TERMS.QUARTERLY]: 'Hàng quý',
    [PAYMENT_TERMS.YEARLY]: 'Hàng năm',
    [PAYMENT_TERMS.ONE_TIME]: 'Một lần'
};

// Tabs cho trang quản lý
export const CONTRACT_TABS = {
    PENDING: 'pending',
    APPROVED: 'approved'
};

// Labels cho tabs
export const CONTRACT_TAB_LABELS = {
    [CONTRACT_TABS.PENDING]: 'Chờ duyệt',
    [CONTRACT_TABS.APPROVED]: 'Đã duyệt'
};

// Số lượng item mỗi trang (pagination)
export const ITEMS_PER_PAGE = 10;

// Format date
export const DATE_FORMAT = 'DD/MM/YYYY';

// Format currency
export const formatCurrency = (amount, currency = CURRENCIES.VND) => {
    if (!amount) return '0';
    
    if (currency === CURRENCIES.VND) {
        return new Intl.NumberFormat('vi-VN').format(amount) + ' VNĐ';
    }
    
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
};

// Kiểm tra hợp đồng có thể duyệt/từ chối không
export const canUpdateStatus = (status) => {
    return status === CONTRACT_STATUS.PENDING;
};

// Kiểm tra hợp đồng đã hết hạn chưa
export const isExpired = (endDate) => {
    if (!endDate) return false;
    return new Date(endDate) < new Date();
};