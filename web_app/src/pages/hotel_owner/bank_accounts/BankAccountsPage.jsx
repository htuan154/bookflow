import React, { useState, useEffect } from 'react';
import { 
  CreditCardIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  StarIcon,
  BanknotesIcon,
  BuildingLibraryIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import useBankAccount from '../../../hooks/useBankAccount';
import BankAccountForm from '../../../components/BankAccountForm';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import ConfirmDialog from '../../../components/common/ConfirmDialog';

const BankAccountsPage = () => {
  const {
    accounts,
    defaultAccount,
    loading,
    updating,
    deleting,
    error,
    setAccountAsDefault,
    deleteBankAccount,
    clearError,
    refreshAllData,
    formatAccountNumber,
    getActiveAccounts,
    getHotelAccounts,
    getPersonalAccounts,
    hasDefaultAccount,
    isAccountProcessing
  } = useBankAccount({ 
    autoFetchAccounts: true, 
    autoFetchDefault: true 
  });

  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filter, setFilter] = useState('all'); // all, personal, hotel

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleEdit = (account) => {
    setEditingAccount(account);
    setShowForm(true);
  };

  const handleDelete = async (account) => {
    try {
      await deleteBankAccount(account.bankAccountId);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Delete account error:', error);
    }
  };

  const handleSetDefault = async (account) => {
    try {
      await setAccountAsDefault(account.bankAccountId, account.hotelId);
    } catch (error) {
      console.error('Set default account error:', error);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingAccount(null);
    refreshAllData();
  };

  const getFilteredAccounts = () => {
    const activeAccounts = getActiveAccounts();
    
    switch (filter) {
      case 'personal':
        return getPersonalAccounts().filter(acc => acc.status === 'active');
      case 'hotel':
        return getHotelAccounts().filter(acc => acc.status === 'active');
      default:
        return activeAccounts;
    }
  };

  const getBankIcon = (bankName) => {
    const bank = bankName?.toLowerCase();
    if (bank?.includes('vietcombank') || bank?.includes('vcb')) return '🏦';
    if (bank?.includes('techcombank') || bank?.includes('tcb')) return '💳';
    if (bank?.includes('bidv')) return '🏛️';
    if (bank?.includes('vietinbank')) return '🏪';
    if (bank?.includes('agribank')) return '🌾';
    if (bank?.includes('sacombank')) return '💰';
    if (bank?.includes('mb') || bank?.includes('military')) return '⭐';
    return '🏦';
  };

  const filteredAccounts = getFilteredAccounts();
  const personalAccounts = getPersonalAccounts().filter(acc => acc.status === 'active');
  const hotelAccounts = getHotelAccounts().filter(acc => acc.status === 'active');

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
                <CreditCardIcon className="w-8 h-8 mr-3 text-blue-600" />
                Tài khoản Ngân hàng
              </h1>
              <p className="text-gray-600">
                Quản lý tài khoản ngân hàng để nhận thanh toán từ khách hàng đặt phòng
              </p>
            </div>
            <button
              onClick={() => {
                setEditingAccount(null);
                setShowForm(true);
              }}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 flex items-center"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Thêm tài khoản
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
              <span className="text-red-700">{error}</span>
            </div>
            <button onClick={clearError} className="text-red-500 hover:text-red-700">
              ✕
            </button>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Tổng tài khoản</p>
                <p className="text-2xl font-bold text-gray-800">{accounts.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <BanknotesIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">TK khách sạn</p>
                <p className="text-2xl font-bold text-gray-800">{hotelAccounts.length}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-xl">
                <BuildingLibraryIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">TK mặc định</p>
                <p className="text-2xl font-bold text-gray-800">
                  {hasDefaultAccount() ? '1' : '0'}
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-xl">
                <StarSolidIcon className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-2xl p-1 shadow-lg border border-gray-100 mb-6 inline-flex">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-2 rounded-xl font-medium transition-all duration-200 ${
              filter === 'all'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            Tất cả ({accounts.length})
          </button>
          <button
            onClick={() => setFilter('hotel')}
            className={`px-6 py-2 rounded-xl font-medium transition-all duration-200 ${
              filter === 'hotel'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <BuildingLibraryIcon className="w-4 h-4 inline mr-1" />
            Khách sạn ({hotelAccounts.length})
          </button>
          <button
            onClick={() => setFilter('personal')}
            className={`px-6 py-2 rounded-xl font-medium transition-all duration-200 ${
              filter === 'personal'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <UserIcon className="w-4 h-4 inline mr-1" />
            Cá nhân ({personalAccounts.length})
          </button>
        </div>

        {/* Accounts List */}
        {filteredAccounts.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-lg border border-gray-100 text-center">
            <CreditCardIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              Chưa có tài khoản ngân hàng
            </h3>
            <p className="text-gray-500 mb-6">
              Thêm tài khoản ngân hàng để nhận thanh toán từ khách hàng đặt phòng
            </p>
            <button
              onClick={() => {
                setEditingAccount(null);
                setShowForm(true);
              }}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Thêm tài khoản đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredAccounts.map((account) => (
              <div
                key={account.bankAccountId}
                className={`bg-white rounded-2xl p-6 shadow-lg border transition-all duration-200 hover:shadow-xl ${
                  account.isDefault
                    ? 'border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50'
                    : 'border-gray-100 hover:border-blue-200'
                }`}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">
                      {getBankIcon(account.bankName)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {account.bankName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {account.hotelId ? 'Tài khoản nhận tiền khách hàng' : 'Tài khoản cá nhân'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {account.isDefault && (
                      <div className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-medium flex items-center">
                        <StarSolidIcon className="w-3 h-3 mr-1" />
                        Mặc định
                      </div>
                    )}
                    <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                      Hoạt động
                    </div>
                  </div>
                </div>

                {/* Account Details */}
                <div className="space-y-3 mb-6">
                  <div>
                    <p className="text-sm text-gray-500">Chủ tài khoản</p>
                    <p className="font-medium text-gray-800">{account.holderName}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Số tài khoản</p>
                    <p className="font-mono text-lg font-semibold text-gray-800">
                      {formatAccountNumber(account.accountNumber)}
                    </p>
                  </div>
                  
                  {account.branchName && (
                    <div>
                      <p className="text-sm text-gray-500">Chi nhánh</p>
                      <p className="text-gray-700">{account.branchName}</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(account)}
                      disabled={isAccountProcessing(account.bankAccountId)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                      title="Chỉnh sửa"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => setDeleteConfirm(account)}
                      disabled={isAccountProcessing(account.bankAccountId)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                      title="Xóa"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>

                  {!account.isDefault && (
                    <button
                      onClick={() => handleSetDefault(account)}
                      disabled={updating[account.bankAccountId]}
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-4 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center text-sm"
                    >
                      {updating[account.bankAccountId] ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <StarIcon className="w-4 h-4 mr-1" />
                          Đặt mặc định
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Loading Overlay */}
                {isAccountProcessing(account.bankAccountId) && (
                  <div className="absolute inset-0 bg-white bg-opacity-75 rounded-2xl flex items-center justify-center">
                    <LoadingSpinner size="md" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <BankAccountForm
            account={editingAccount}
            onSuccess={handleFormSuccess}
            onClose={() => {
              setShowForm(false);
              setEditingAccount(null);
            }}
          />
        )}

        {/* Delete Confirmation */}
        {deleteConfirm && (
          <ConfirmDialog
            isOpen={true}
            title="Xác nhận xóa tài khoản"
            message={
              <div>
                <p className="mb-2">
                  Bạn có chắc chắn muốn xóa tài khoản ngân hàng này?
                </p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium">{deleteConfirm.bankName}</p>
                  <p className="text-sm text-gray-600">
                    {formatAccountNumber(deleteConfirm.accountNumber)}
                  </p>
                  <p className="text-sm text-gray-600">{deleteConfirm.holderName}</p>
                </div>
                <p className="mt-2 text-sm text-red-600">
                  Hành động này không thể hoàn tác.
                </p>
              </div>
            }
            confirmText="Xóa tài khoản"
            cancelText="Hủy bỏ"
            onConfirm={() => handleDelete(deleteConfirm)}
            onCancel={() => setDeleteConfirm(null)}
            loading={deleting[deleteConfirm?.bankAccountId]}
            type="danger"
          />
        )}
      </div>
    </div>
  );
};

export default BankAccountsPage;