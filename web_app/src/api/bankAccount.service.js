import axiosClient from '../config/axiosClient';
import { API_ENDPOINTS } from '../config/apiEndpoints';

/**
 * Service để quản lý tài khoản ngân hàng
 */
const BankAccountService = {
  
  // =========================================
  // PUBLIC ENDPOINTS
  // =========================================
  
  /**
   * Lấy danh sách ngân hàng phổ biến
   */
  getPopularBanks: async (limit = 20) => {
    const response = await axiosClient.get(API_ENDPOINTS.BANK_ACCOUNTS.POPULAR_BANKS, {
      params: { limit }
    });
    return response.data;
  },

  // =========================================
  // USER BANK ACCOUNTS
  // =========================================

  /**
   * Tạo tài khoản ngân hàng mới
   */
  createBankAccount: async (accountData) => {
    const response = await axiosClient.post(API_ENDPOINTS.BANK_ACCOUNTS.CREATE, accountData);
    return response.data;
  },

  /**
   * Lấy danh sách tài khoản ngân hàng của user hiện tại
   */
  getUserBankAccounts: async (filters = {}) => {
    const response = await axiosClient.get(API_ENDPOINTS.BANK_ACCOUNTS.GET_USER_ACCOUNTS, {
      params: filters
    });
    return response.data;
  },

  /**
   * Lấy tài khoản ngân hàng mặc định
   */
  getDefaultBankAccount: async (hotelId = null) => {
    const params = hotelId ? { hotel_id: hotelId } : {};
    const response = await axiosClient.get(API_ENDPOINTS.BANK_ACCOUNTS.GET_DEFAULT, {
      params
    });
    return response.data;
  },

  /**
   * Lấy thông tin tài khoản ngân hàng theo ID
   */
  getBankAccountById: async (id) => {
    const response = await axiosClient.get(API_ENDPOINTS.BANK_ACCOUNTS.GET_BY_ID(id));
    return response.data;
  },

  /**
   * Cập nhật thông tin tài khoản ngân hàng
   */
  updateBankAccount: async (id, updateData) => {
    const response = await axiosClient.put(API_ENDPOINTS.BANK_ACCOUNTS.UPDATE(id), updateData);
    return response.data;
  },

  /**
   * Đặt tài khoản làm mặc định
   */
  setAsDefault: async (id) => {
    const response = await axiosClient.put(API_ENDPOINTS.BANK_ACCOUNTS.SET_DEFAULT(id));
    return response.data;
  },

  /**
   * Xóa tài khoản ngân hàng (soft delete)
   */
  deleteBankAccount: async (id) => {
    const response = await axiosClient.delete(API_ENDPOINTS.BANK_ACCOUNTS.DELETE(id));
    return response.data;
  },

  // =========================================
  // HOTEL BANK ACCOUNTS
  // =========================================

  /**
   * Lấy danh sách tài khoản ngân hàng của hotel
   */
  getHotelBankAccounts: async (hotelId, filters = {}) => {
    const response = await axiosClient.get(
      API_ENDPOINTS.BANK_ACCOUNTS.GET_HOTEL_ACCOUNTS(hotelId),
      { params: filters }
    );
    return response.data;
  },

  // =========================================
  // ADMIN ENDPOINTS
  // =========================================

  /**
   * Lấy thống kê tài khoản ngân hàng (Admin only)
   */
  getBankAccountStatistics: async () => {
    const response = await axiosClient.get(API_ENDPOINTS.BANK_ACCOUNTS.ADMIN_STATISTICS);
    return response.data;
  },

  /**
   * Xóa tài khoản ngân hàng vĩnh viễn (Admin only)
   */
  hardDeleteBankAccount: async (id) => {
    const response = await axiosClient.delete(API_ENDPOINTS.BANK_ACCOUNTS.ADMIN_HARD_DELETE(id));
    return response.data;
  },

  // =========================================
  // HELPER METHODS
  // =========================================

  /**
   * Validate dữ liệu tài khoản ngân hàng
   */
  validateBankAccountData: (data) => {
    const errors = {};

    if (!data.holder_name || !data.holder_name.trim()) {
      errors.holder_name = 'Tên chủ tài khoản là bắt buộc';
    } else if (data.holder_name.trim().length < 2) {
      errors.holder_name = 'Tên chủ tài khoản phải có ít nhất 2 ký tự';
    } else if (data.holder_name.trim().length > 100) {
      errors.holder_name = 'Tên chủ tài khoản không được quá 100 ký tự';
    }

    if (!data.account_number || !data.account_number.trim()) {
      errors.account_number = 'Số tài khoản là bắt buộc';
    } else if (!/^\d{6,20}$/.test(data.account_number.trim())) {
      errors.account_number = 'Số tài khoản phải là 6-20 chữ số';
    }

    if (!data.bank_name || !data.bank_name.trim()) {
      errors.bank_name = 'Tên ngân hàng là bắt buộc';
    } else if (data.bank_name.trim().length < 2) {
      errors.bank_name = 'Tên ngân hàng phải có ít nhất 2 ký tự';
    } else if (data.bank_name.trim().length > 100) {
      errors.bank_name = 'Tên ngân hàng không được quá 100 ký tự';
    }

    if (data.branch_name && data.branch_name.trim().length > 100) {
      errors.branch_name = 'Tên chi nhánh không được quá 100 ký tự';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  /**
   * Format số tài khoản để hiển thị
   */
  formatAccountNumber: (accountNumber) => {
    if (!accountNumber) return '';
    // Ẩn một phần số tài khoản: 1234****5678
    const length = accountNumber.length;
    if (length <= 8) {
      return accountNumber.slice(0, 2) + '*'.repeat(length - 4) + accountNumber.slice(-2);
    } else {
      return accountNumber.slice(0, 4) + '*'.repeat(length - 8) + accountNumber.slice(-4);
    }
  },

  /**
   * Lấy danh sách ngân hàng Việt Nam phổ biến (static)
   */
  getVietnameseBanks: () => [
    'Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)',
    'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam (BIDV)',
    'Ngân hàng TMCP Công thương Việt Nam (VietinBank)',
    'Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam (Agribank)',
    'Ngân hàng TMCP Kỹ thương Việt Nam (Techcombank)',
    'Ngân hàng TMCP Quân đội (MB Bank)',
    'Ngân hàng TMCP Sài Gòn Thương Tín (Sacombank)',
    'Ngân hàng TMCP Á Châu (ACB)',
    'Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)',
    'Ngân hàng TMCP Tiên Phong (TPBank)',
    'Ngân hàng TMCP Hàng Hải (Maritime Bank)',
    'Ngân hàng TMCP Xuất Nhập khẩu Việt Nam (Eximbank)',
    'Ngân hàng TMCP Phương Đông (OCB)',
    'Ngân hàng TMCP Nam Á (Nam A Bank)',
    'Ngân hàng TMCP Bưu điện Liên Việt (LienVietPostBank)',
    'Ngân hàng TMCP Kiên Long (Kienlongbank)',
    'Ngân hàng TMCP Bản Việt (Viet Capital Bank)',
    'Ngân hàng TMCP Phát triển Thành phố Hồ Chí Minh (HDBank)',
    'Ngân hàng TMCP Đông Á (DongA Bank)',
    'Ngân hàng TMCP Việt Á (VietABank)'
  ]
};

export default BankAccountService;