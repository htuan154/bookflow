import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  CreditCardIcon,
  UserIcon,
  BuildingLibraryIcon,
  MapPinIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import useBankAccount from '../hooks/useBankAccount';
import LoadingSpinner from './common/LoadingSpinner';

const BankAccountForm = ({ account, onSuccess, onClose }) => {
  const {
    popularBanks,
    creating,
    updating,
    validationErrors,
    createBankAccount,
    updateBankAccount,
    fetchPopularBanks,
    validateBankAccountData,
    getVietnameseBanks,
    clearError
  } = useBankAccount();

  const isEditing = !!account;
  const isProcessing = creating || (isEditing && updating[account?.bankAccountId]);

  const [formData, setFormData] = useState({
    holderName: '',
    accountNumber: '',
    bankName: '',
    branchName: '',
    hotelId: null,
    isDefault: false
  });

  const [localErrors, setLocalErrors] = useState({});
  const [showBankList, setShowBankList] = useState(false);

  // Initialize form data
  useEffect(() => {
    if (account) {
      setFormData({
        holderName: account.holderName || '',
        accountNumber: account.accountNumber || '',
        bankName: account.bankName || '',
        branchName: account.branchName || '',
        hotelId: account.hotelId || null,
        isDefault: account.isDefault || false
      });
    }
  }, [account]);

  // Fetch banks list
  useEffect(() => {
    if (popularBanks.length === 0) {
      fetchPopularBanks();
    }
  }, [popularBanks.length, fetchPopularBanks]);

  // Clear errors when form data changes
  useEffect(() => {
    if (Object.keys(localErrors).length > 0) {
      setLocalErrors({});
    }
    clearError();
  }, [formData, clearError]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear field error when user starts typing
    if (localErrors[field]) {
      setLocalErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const validation = validateBankAccountData(formData);
    
    if (!validation.isValid) {
      setLocalErrors(validation.errors);
      return false;
    }

    // Additional validations
    const errors = {};
    
    if (!formData.holderName.trim()) {
      errors.holderName = 'Vui lòng nhập tên chủ tài khoản';
    }
    
    if (!formData.accountNumber.trim()) {
      errors.accountNumber = 'Vui lòng nhập số tài khoản';
    } else if (formData.accountNumber.length < 6) {
      errors.accountNumber = 'Số tài khoản phải có ít nhất 6 ký tự';
    }
    
    if (!formData.bankName.trim()) {
      errors.bankName = 'Vui lòng chọn ngân hàng';
    }

    if (Object.keys(errors).length > 0) {
      setLocalErrors(errors);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const submitData = {
        holder_name: formData.holderName.trim(),
        account_number: formData.accountNumber.trim(),
        bank_name: formData.bankName.trim(),
        branch_name: formData.branchName.trim() || null,
        hotel_id: formData.hotelId || null,
        is_default: formData.isDefault
      };

      if (isEditing) {
        await updateBankAccount(account.bankAccountId, submitData);
      } else {
        await createBankAccount(submitData);
      }

      onSuccess();
    } catch (error) {
      console.error('Form submit error:', error);
    }
  };

  const handleBankSelect = (bankName) => {
    handleInputChange('bankName', bankName);
    setShowBankList(false);
  };

  const vietnameseBanks = getVietnameseBanks();
  const allErrors = { ...localErrors, ...validationErrors };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center text-white">
            <CreditCardIcon className="w-6 h-6 mr-3" />
            <h2 className="text-xl font-semibold">
              {isEditing ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản ngân hàng'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
            disabled={isProcessing}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Holder Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <UserIcon className="w-4 h-4 inline mr-2" />
                Tên chủ tài khoản *
              </label>
              <input
                type="text"
                value={formData.holderName}
                onChange={(e) => handleInputChange('holderName', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  allErrors.holderName ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Nhập tên chủ tài khoản"
                disabled={isProcessing}
              />
              {allErrors.holderName && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                  {allErrors.holderName}
                </p>
              )}
            </div>

            {/* Account Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CreditCardIcon className="w-4 h-4 inline mr-2" />
                Số tài khoản *
              </label>
              <input
                type="text"
                value={formData.accountNumber}
                onChange={(e) => {
                  // Only allow numbers
                  const value = e.target.value.replace(/\D/g, '');
                  handleInputChange('accountNumber', value);
                }}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono ${
                  allErrors.accountNumber ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Nhập số tài khoản"
                disabled={isProcessing}
              />
              {allErrors.accountNumber && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                  {allErrors.accountNumber}
                </p>
              )}
            </div>

            {/* Bank Name */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <BuildingLibraryIcon className="w-4 h-4 inline mr-2" />
                Ngân hàng *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => handleInputChange('bankName', e.target.value)}
                  onFocus={() => setShowBankList(true)}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    allErrors.bankName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Chọn hoặc nhập tên ngân hàng"
                  disabled={isProcessing}
                />
                
                {/* Bank List Dropdown */}
                {showBankList && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-xl shadow-lg z-10 max-h-64 overflow-y-auto mt-1">
                    <div className="p-2">
                      <div className="text-xs font-medium text-gray-500 px-2 py-1 uppercase tracking-wide">
                        Ngân hàng phổ biến
                      </div>
                      {vietnameseBanks.slice(0, 10).map((bank, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleBankSelect(bank)}
                          className="w-full text-left px-3 py-2 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          {bank}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {allErrors.bankName && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                  {allErrors.bankName}
                </p>
              )}
            </div>

            {/* Branch Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPinIcon className="w-4 h-4 inline mr-2" />
                Chi nhánh (tùy chọn)
              </label>
              <input
                type="text"
                value={formData.branchName}
                onChange={(e) => handleInputChange('branchName', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Nhập tên chi nhánh (nếu có)"
                disabled={isProcessing}
              />
            </div>

            {/* Hotel Account Option */}
            <div className="bg-gray-50 rounded-xl p-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={!!formData.hotelId}
                  onChange={(e) => handleInputChange('hotelId', e.target.checked ? 'temp' : null)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={isProcessing}
                />
                <span className="ml-3 text-sm font-medium text-gray-700">
                  Đây là tài khoản của khách sạn
                </span>
              </label>
              <p className="ml-7 mt-1 text-xs text-gray-500">
                Tài khoản khách sạn được sử dụng để nhận thanh toán từ khách hàng
              </p>
            </div>

            {/* Default Account Option */}
            <div className="bg-yellow-50 rounded-xl p-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => handleInputChange('isDefault', e.target.checked)}
                  className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                  disabled={isProcessing}
                />
                <span className="ml-3 text-sm font-medium text-gray-700">
                  Đặt làm tài khoản mặc định
                </span>
              </label>
              <p className="ml-7 mt-1 text-xs text-gray-500">
                Tài khoản mặc định sẽ được sử dụng cho các giao dịch tự động
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 flex items-center"
              >
                {isProcessing ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    {isEditing ? 'Đang cập nhật...' : 'Đang thêm...'}
                  </>
                ) : (
                  <>
                    {isEditing ? 'Cập nhật' : 'Thêm tài khoản'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Click outside to close bank list */}
        {showBankList && (
          <div
            className="fixed inset-0"
            onClick={() => setShowBankList(false)}
          />
        )}
      </div>
    </div>
  );
};

export default BankAccountForm;