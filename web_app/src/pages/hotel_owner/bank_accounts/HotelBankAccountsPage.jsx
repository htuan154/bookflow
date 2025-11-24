// src/pages/hotel_owner/bank_accounts/HotelBankAccountsPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  CreditCardIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  StarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import useBankAccount from '../../../hooks/useBankAccount';
import { useHotelOwner } from '../../../hooks/useHotelOwner';

const HotelBankAccountsPage = () => {
  // States
  const [selectedHotelId, setSelectedHotelId] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({
      bankName: '',
      accountNumber: '',
      holderName: '',
      branchName: '',
      isDefault: false
  });

  // Hooks
  // Sử dụng đúng API cho hotel bank accounts
  const {
    accounts,
    loading,
    error,
    fetchHotelAccounts,
    createBankAccount,
    updateBankAccount,
    deleteBankAccount,
    setAccountAsDefault,
    unsetDefaultBankAccountsByHotel,
  } = useBankAccount();

  // Chỉ lấy bank accounts của hotel đang chọn
    const bankAccounts = useMemo(() => {
      if (!selectedHotelId) return [];
      return accounts.filter(acc => acc.hotelId === selectedHotelId);
  }, [accounts, selectedHotelId]);

  // Normalize account fields from API (snake_case) to camelCase for UI consistency
  const normalizedBankAccounts = useMemo(() => {
    return bankAccounts.map(acc => ({
      // keep original fields
      ...acc,
      // prefer camelCase if present, otherwise fall back to snake_case
      bankName: (acc.bankName ?? acc.bank_name ?? acc.bank) || '',
      accountNumber: (acc.accountNumber ?? acc.account_number ?? acc.account) || '',
      holderName: (acc.holderName ?? acc.account_holder_name ?? acc.holder_name ?? acc.holder) || '',
      branchName: (acc.branchName ?? acc.branch_name ?? acc.branch) || '',
      isDefault: (acc.isDefault ?? acc.is_default ?? acc.is_default_flag) || false,
    }));
  }, [bankAccounts]);
  
  const { 
    hotelData, 
    fetchOwnerHotel,
    loading: hotelLoading 
  } = useHotelOwner();

  // Fetch data on mount
  useEffect(() => {
    fetchOwnerHotel();
  }, [fetchOwnerHotel]);

  // Debug: Log hotel data structure
  useEffect(() => {
    console.log('🏨 Raw hotelData:', hotelData);
    const processedHotels = Array.isArray(hotelData) ? hotelData : 
                           (hotelData?.data && Array.isArray(hotelData.data)) ? hotelData.data : 
                           hotelData ? [hotelData] : [];
    console.log('🏨 Processed hotels:', processedHotels);
  }, [hotelData]);

  // Process hotel data with useMemo to avoid duplicate calculations
  const hotels = useMemo(() => {
    if (Array.isArray(hotelData)) return hotelData;
    if (hotelData?.data && Array.isArray(hotelData.data)) return hotelData.data;
    if (hotelData) return [hotelData];
    return [];
  }, [hotelData]);

  // Auto-select first hotel if none selected
  useEffect(() => {
    if (hotels.length > 0) {
      if (!selectedHotelId) {
        const firstHotel = hotels[0];
        setSelectedHotelId(firstHotel.hotel_id || firstHotel.id || firstHotel.hotelId);
      } else if (!hotels.find(h => (h.hotel_id || h.id || h.hotelId) === selectedHotelId)) {
        const firstHotel = hotels[0];
        setSelectedHotelId(firstHotel.hotel_id || firstHotel.id || firstHotel.hotelId);
      }
    }
  }, [hotels, selectedHotelId]);

  // Fetch bank accounts when hotel is selected
  useEffect(() => {
    if (selectedHotelId) {
      fetchHotelAccounts(selectedHotelId);
    }
  }, [selectedHotelId, fetchHotelAccounts]);

  // Get current hotel info
  const currentHotel = hotels.find(hotel => 
    (hotel.hotel_id || hotel.id || hotel.hotelId) === selectedHotelId
  ) || hotels[0];

  // Debug: Log bankAccounts data for troubleshooting
  useEffect(() => {
    console.log('🏦 bankAccounts:', bankAccounts);
  }, [bankAccounts]);

  // Get default bank account (use normalized list)
  const defaultAccount = normalizedBankAccounts?.find(account => account.isDefault) || null;

  // Form handlers
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedHotelId) {
      return;
    }

    try {
      // Build payload containing both camelCase and snake_case keys
      const accountData = {
        // camelCase (used in UI state)
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        holderName: formData.holderName,
        branchName: formData.branchName,
        isDefault: formData.isDefault,
        hotelId: selectedHotelId,
        // snake_case (some validation/API expect these keys)
        bank_name: formData.bankName,
        account_number: formData.accountNumber,
        holder_name: formData.holderName,
        branch_name: formData.branchName,
        is_default: formData.isDefault,
        hotel_id: selectedHotelId,
      };

      // Nếu là thêm mới và chọn làm mặc định thì unset default trước khi tạo
      if (!editingAccount && formData.isDefault) {
        await unsetDefaultBankAccountsByHotel(selectedHotelId);
      }

      if (editingAccount) {
        await updateBankAccount(editingAccount.bankAccountId || editingAccount.id, accountData);
      } else {
        await createBankAccount(accountData);
      }
      // Fetch lại danh sách tài khoản để UI luôn đúng trạng thái mặc định
      await fetchHotelAccounts(selectedHotelId);
      // Reset form
      setFormData({
        bankName: '',
        accountNumber: '',
        holderName: '',
        branchName: '',
        isDefault: false
      });
      setIsFormOpen(false);
      setEditingAccount(null);
    } catch (error) {
      console.error('Error saving bank account:', error);
    }
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    setFormData({
      bankName: account.bankName || '',
      accountNumber: account.accountNumber || '',
      holderName: account.holderName || '',
      branchName: account.branchName || '',
      isDefault: account.isDefault || false
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (accountId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tài khoản ngân hàng này?')) {
      try {
        await deleteBankAccount(accountId);
      } catch (error) {
        console.error('Error deleting bank account:', error);
      }
    }
  };

  const handleSetDefault = async (accountId) => {
    try {
      await setAccountAsDefault(accountId);
    } catch (error) {
      console.error('Error setting default account:', error);
    }
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingAccount(null);
    setFormData({
      bankName: '',
      accountNumber: '',
      holderName: '',
      branchName: '',
      isDefault: false
    });
  };

  // Loading state - only show when loading hotels
  if (hotelLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Đang tải thông tin khách sạn...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Quản lý Tài khoản Ngân hàng</h1>
            <p className="text-blue-100 mt-1">
              Quản lý tài khoản ngân hàng cho từng khách sạn
            </p>
          </div>
          <CreditCardIcon className="h-12 w-12 text-blue-200" />
        </div>
      </div>

      {/* Hotel Selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <BuildingOfficeIcon className="h-6 w-6 text-gray-400" />
          <div className="flex-1">
            <label htmlFor="hotel-select" className="block text-sm font-medium text-gray-700 mb-2">
              Chọn khách sạn
            </label>
            <select
              id="hotel-select"
              value={selectedHotelId}
              onChange={(e) => setSelectedHotelId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Vui lòng chọn khách sạn --</option>
              {hotels.map((hotel) => (
                <option 
                  key={hotel.hotel_id || hotel.id || hotel.hotelId} 
                  value={hotel.hotel_id || hotel.id || hotel.hotelId}
                >
                  {hotel.name} - {hotel.city}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Current Hotel Info */}
        {currentHotel && selectedHotelId && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-3">
              <BuildingOfficeIcon className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="font-medium text-gray-900">{currentHotel.name}</h3>
                <p className="text-sm text-gray-600">{currentHotel.address}, {currentHotel.city}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Hotel ID: {currentHotel.hotel_id || currentHotel.id || currentHotel.hotelId}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Instructions when no hotel selected */}
      {hotels.length > 0 && !selectedHotelId && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <CreditCardIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Quản lý Tài khoản Ngân hàng</h3>
            <p className="mt-2 text-sm text-gray-500">
              Vui lòng chọn khách sạn từ dropdown ở trên để xem và quản lý tài khoản ngân hàng.
            </p>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600">
                💡 <strong>Mẹo:</strong> Mỗi khách sạn có thể có nhiều tài khoản ngân hàng và 1 tài khoản mặc định để nhận thanh toán.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bank Accounts Section - Only show when hotel is selected */}
      {selectedHotelId && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Section Header */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Tài khoản Ngân hàng</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Quản lý tài khoản ngân hàng cho khách sạn: <span className="font-medium">{currentHotel?.name}</span>
                </p>
              </div>
              <button
                onClick={() => setIsFormOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
                Thêm tài khoản
              </button>
            </div>
          </div>

          {/* Default Account Banner */}
          {defaultAccount && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 m-6 mb-0">
              <div className="flex items-center">
                <StarIconSolid className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <p className="text-sm text-yellow-800">
                    <span className="font-medium">Tài khoản mặc định:</span> {defaultAccount?.bankName} - {defaultAccount?.accountNumber}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Đang tải...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Lỗi</h3>
                <p className="mt-1 text-sm text-gray-500">{error}</p>
              </div>
            ) : !bankAccounts || bankAccounts.length === 0 ? (
              <div className="text-center py-12">
                <CreditCardIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có tài khoản ngân hàng</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Thêm tài khoản ngân hàng đầu tiên cho khách sạn này.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setIsFormOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Thêm tài khoản đầu tiên
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-4">
                {normalizedBankAccounts.map((account, idx) => {
                  // Sử dụng đúng field từ API
                  const bankName = account.bankName || '(Chưa có tên ngân hàng)';
                  const accountNumber = account.accountNumber || '(Chưa có số TK)';
                  const holderName = account.holderName || '(Chưa có chủ TK)';
                  const branchName = account.branchName || '';

                  const isDefault = !!account.isDefault;

                  return (
                    <div
                      key={account.bankAccountId || idx}
                      className={`border rounded-lg p-4 ${
                        isDefault
                          ? 'border-yellow-300 bg-yellow-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{bankName}</h3>
                            {isDefault && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                <StarIconSolid className="h-3 w-3" />
                                Mặc định
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 mt-1">
                            Số TK: <span className="font-mono">{accountNumber}</span>
                          </p>
                          <p className="text-gray-600">
                            Chủ TK: {holderName}
                          </p>
                          {branchName !== '' ? (
                            <p className="text-sm text-gray-500">Chi nhánh: {branchName}</p>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {/* Đặt làm mặc định */}
                          {!isDefault && (
                            <button
                              onClick={() => handleSetDefault(account.bankAccountId)}
                              className="p-2 text-gray-400 hover:text-yellow-600 transition-colors"
                              title="Đặt làm mặc định"
                            >
                              <StarIcon className="h-4 w-4" />
                            </button>
                          )}
                          {/* Nút chỉnh sửa */}
                          <button
                            onClick={() => handleEdit(account)}
                            className={`p-2 rounded focus:outline-none transition-colors text-blue-600 hover:bg-gray-100`}
                            title={'Sửa'}
                          >
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          {/* Nút xoá */}
                          <button
                            onClick={() => !isDefault && handleDelete(account.bankAccountId)}
                            className={`p-2 rounded focus:outline-none transition-colors text-red-600 ${isDefault ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                            title={isDefault ? 'Không thể xoá tài khoản mặc định' : 'Xoá'}
                            disabled={isDefault}
                          >
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingAccount ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản mới'}
                </h3>
                <button
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên ngân hàng *
                  </label>
                  <select
                    name="bankName"
                    value={formData.bankName || ''}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- Chọn ngân hàng --</option>
                    <option value="ACB">ACB</option>
                    <option value="Agribank">Agribank</option>
                    <option value="BIDV">BIDV</option>
                    <option value="HDBank">HDBank</option>
                    <option value="HSBC">HSBC</option>
                    <option value="LPBank">LPBank</option>
                    <option value="MB">MB</option>
                    <option value="Sacombank">Sacombank</option>
                    <option value="SHB">SHB</option>
                    <option value="Shinhan Bank">Shinhan Bank</option>
                    <option value="Standard Chartered">Standard Chartered</option>
                    <option value="Techcombank">Techcombank</option>
                    <option value="TPBank">TPBank</option>
                    <option value="VIB">VIB</option>
                    <option value="Vietcombank">Vietcombank</option>
                    <option value="VietinBank">VietinBank</option>
                    <option value="VPBank">VPBank</option>
                    <option value="Woori Bank">Woori Bank</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số tài khoản *
                  </label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập số tài khoản"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên chủ tài khoản *
                  </label>
                  <input
                    type="text"
                    name="holderName"
                    value={formData.holderName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tên chủ tài khoản"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chi nhánh
                  </label>
                  <input
                    type="text"
                    name="branchName"
                    value={formData.branchName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tên chi nhánh"
                  />
                </div>

                {/* SWIFT and description removed per request */}

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isDefault"
                    name="isDefault"
                    checked={formData.isDefault}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-700">
                    Đặt làm tài khoản mặc định
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Đang lưu...' : (editingAccount ? 'Cập nhật' : 'Thêm mới')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HotelBankAccountsPage;