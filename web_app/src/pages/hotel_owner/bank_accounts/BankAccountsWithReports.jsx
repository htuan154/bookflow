import React, { useState, useMemo } from 'react';
import { 
  CreditCardIcon, 
  BanknotesIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import { OwnerReportsProvider } from '../../../context/OwnerReportsContext';
import { BankAccountProvider } from '../../../context/BankAccountContext';
import useOwnerReports from '../../../hooks/useOwnerReports';
import useBankAccount from '../../../hooks/useBankAccount';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

function PaymentIntegrationCard() {
  const { accounts, getHotelAccounts, hasDefaultAccount } = useBankAccount({ autoFetchAccounts: true });
  const { summary, loading: reportsLoading } = useOwnerReports({ autoFetch: true });

  const hotelAccounts = getHotelAccounts();
  const defaultAccount = accounts.find(acc => acc.isDefault && acc.hotelId);

  const paymentStats = useMemo(() => {
    if (!summary?.daily_summary?.length) return { totalEarnings: 0, pendingPayments: 0, completedPayments: 0 };
    
    let totalEarnings = 0;
    let pendingPayments = 0;
    let completedPayments = 0;
    
    for (const row of summary.daily_summary) {
      const earnings = Number(row.hotelNetSum || 0);
      totalEarnings += earnings;
      
      if (earnings > 0) {
        if (row.exists_in_payouts) {
          completedPayments += earnings;
        } else {
          pendingPayments += earnings;
        }
      }
    }
    
    return { totalEarnings, pendingPayments, completedPayments };
  }, [summary]);

  if (reportsLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-center h-32">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-lg border border-blue-200">
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mr-3">
          <BanknotesIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Tích hợp Thanh toán</h3>
          <p className="text-sm text-gray-600">Kết nối tài khoản với báo cáo doanh thu</p>
        </div>
      </div>

      {/* Payment Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-sm text-gray-600">Tổng thu nhập</div>
          <div className="text-xl font-bold text-green-600">
            {paymentStats.totalEarnings.toLocaleString('vi-VN')} ₫
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-sm text-gray-600">Chờ thanh toán</div>
          <div className="text-xl font-bold text-orange-600">
            {paymentStats.pendingPayments.toLocaleString('vi-VN')} ₫
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-sm text-gray-600">Đã nhận</div>
          <div className="text-xl font-bold text-blue-600">
            {paymentStats.completedPayments.toLocaleString('vi-VN')} ₫
          </div>
        </div>
      </div>

      {/* Bank Account Status */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h4 className="font-medium text-gray-800 mb-3">Trạng thái tài khoản nhận tiền</h4>
        
        {hotelAccounts.length === 0 ? (
          <div className="text-center py-4">
            <CreditCardIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Chưa có tài khoản khách sạn</p>
            <p className="text-xs text-gray-400">Thêm tài khoản để nhận thanh toán</p>
          </div>
        ) : !hasDefaultAccount(true) ? (
          <div className="flex items-center justify-between bg-yellow-50 p-3 rounded-lg">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
              <span className="text-sm text-yellow-700">Chưa có tài khoản mặc định</span>
            </div>
            <span className="text-xs text-yellow-600">Cần đặt TK mặc định</span>
          </div>
        ) : defaultAccount ? (
          <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <div>
                <span className="text-sm font-medium text-green-700">
                  {defaultAccount.bankName}
                </span>
                <div className="text-xs text-green-600">
                  {defaultAccount.accountNumber} • {defaultAccount.holderName}
                </div>
              </div>
            </div>
            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
              ✓ Sẵn sàng
            </span>
          </div>
        ) : null}
        
        <div className="mt-3 text-xs text-gray-500">
          💡 Tài khoản mặc định sẽ được sử dụng để nhận thanh toán từ hệ thống
        </div>
      </div>
    </div>
  );
}

function BankAccountsWithReports({ children }) {
  return (
    <OwnerReportsProvider>
      <BankAccountProvider>
        <div className="space-y-6">
          <PaymentIntegrationCard />
          {children}
        </div>
      </BankAccountProvider>
    </OwnerReportsProvider>
  );
}

export default BankAccountsWithReports;