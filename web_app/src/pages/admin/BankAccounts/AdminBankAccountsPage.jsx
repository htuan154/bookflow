import React, { useState, useEffect, useMemo } from 'react';
import { 
  BanknotesIcon, 
  CreditCardIcon,
  BuildingLibraryIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { AdminReportsProvider } from '../../../context/AdminReportsContext';
import { BankAccountProvider } from '../../../context/BankAccountContext';
import { HotelProvider } from '../../../context/HotelContext';
import useAdminReports from '../../../hooks/useAdminReports';
import useBankAccount from '../../../hooks/useBankAccount';
import { useHotel } from '../../../hooks/useHotel';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

function FilterBar() {
  const { filters, setFilters, fetchSummary } = useAdminReports(false);
  const { fetchApprovedHotels, approvedHotels } = useHotel();
  const [loadingHotels, setLoadingHotels] = useState(false);

  const update = (k, v) => setFilters(prev => ({ ...prev, [k]: v }));

  useEffect(() => {
    const loadHotels = async () => {
      try {
        setLoadingHotels(true);
        await fetchApprovedHotels();
      } catch (error) {
        console.error('Error loading hotels:', error);
      } finally {
        setLoadingHotels(false);
      }
    };
    loadHotels();
  }, [fetchApprovedHotels]);

  const presets = useMemo(() => ([
    { label: '7 ngày qua', range: () => {
      const end = new Date(); const start = new Date(); start.setDate(end.getDate()-6);
      return { date_from: start.toISOString().slice(0,10), date_to: end.toISOString().slice(0,10) };
    }},
    { label: '30 ngày qua', range: () => {
      const end = new Date(); const start = new Date(); start.setDate(end.getDate()-29);
      return { date_from: start.toISOString().slice(0,10), date_to: end.toISOString().slice(0,10) };
    }},
    { label: 'Tháng này', range: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { date_from: start.toISOString().slice(0,10), date_to: now.toISOString().slice(0,10) };
    }},
  ]), []);

  const applyAll = async () => {
    await fetchSummary();
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200 shadow-lg mb-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">🔍 Bộ lọc thống kê</h3>
        <p className="text-sm text-gray-600">Chọn khoảng thời gian và khách sạn để xem thống kê tài khoản</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">📅 Từ ngày</label>
          <input
            type="date"
            value={filters.date_from}
            onChange={e => update('date_from', e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">📅 Đến ngày</label>
          <input
            type="date"
            value={filters.date_to}
            onChange={e => update('date_to', e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">🏨 Khách sạn</label>
          <select
            value={filters.hotel_filter || 'ALL'}
            onChange={e => update('hotel_filter', e.target.value === 'ALL' ? 'ALL' : e.target.value)}
            disabled={loadingHotels}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100"
          >
            <option value="ALL">Tất cả khách sạn</option>
            {approvedHotels.map(hotel => (
              <option key={hotel.hotel_id} value={hotel.hotel_id}>
                {hotel.name} - {hotel.city}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <button 
            onClick={applyAll} 
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-300 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            🔄 Áp dụng bộ lọc
          </button>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-sm font-medium text-gray-700 mb-3">⚡ Chọn nhanh:</p>
        <div className="flex flex-wrap gap-2">
          {presets.map(p => (
            <button
              key={p.label}
              onClick={() => setFilters(prev => ({ ...prev, ...p.range() }))}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 bg-white hover:bg-gray-50 hover:border-blue-300 transition-colors duration-200"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatisticsCards() {
  const { summary, loading } = useAdminReports(false);
  const { accounts, statistics, fetchAllBankAccounts } = useBankAccount();

  useEffect(() => {
    fetchAllBankAccounts();
  }, [fetchAllBankAccounts]);

  const revenueData = useMemo(() => {
    if (!summary?.daily_summary?.length) return { gross: 0, pg: 0, admin: 0, net: 0, bookings: 0, hotels: 0 };
    let gross=0, pg=0, admin=0, net=0, bookings=0;
    const hotels = new Set();
    for (const r of summary.daily_summary) {
      gross += Number(r.finalSum || 0);
      pg    += Number(r.pgFeeSum || 0);
      admin += Number(r.adminFeeSum || 0);
      net   += Number(r.hotelNetSum || 0);
      bookings += Number(r.bookingsCount || 0);
      if (r.hotelId) hotels.add(r.hotelId);
    }
    return { gross, pg, admin, net, bookings, hotels: hotels.size };
  }, [summary]);

  const bankAccountData = useMemo(() => {
    const total = accounts.length;
    const active = accounts.filter(acc => acc.status === 'active').length;
    const hotel = accounts.filter(acc => acc.hotelId && acc.status === 'active').length;
    const personal = accounts.filter(acc => !acc.hotelId && acc.status === 'active').length;
    const withDefault = accounts.filter(acc => acc.isDefault).length;
    const pending = accounts.filter(acc => acc.status === 'pending').length;
    
    return { total, active, hotel, personal, withDefault, pending };
  }, [accounts]);

  const statisticsData = [
    // Revenue Statistics
    { 
      label: '💰 Tổng doanh thu', 
      value: revenueData.gross, 
      format: 'currency',
      color: 'from-green-500 to-emerald-600', 
      icon: '💰',
      description: 'Tổng doanh thu từ đặt phòng'
    },
    { 
      label: '🏨 Thu nhập KS chờ TT', 
      value: revenueData.net, 
      format: 'currency',
      color: 'from-orange-500 to-red-600', 
      icon: '🏨',
      description: 'Số tiền cần thanh toán cho khách sạn'
    },
    { 
      label: '⚙️ Phí quản lý', 
      value: revenueData.admin, 
      format: 'currency',
      color: 'from-purple-500 to-violet-600', 
      icon: '⚙️',
      description: 'Phí quản lý hệ thống'
    },
    
    // Bank Account Statistics
    { 
      label: '🏦 Tổng TK ngân hàng', 
      value: bankAccountData.total, 
      format: 'number',
      color: 'from-blue-500 to-cyan-600', 
      icon: '🏦',
      description: 'Tổng số tài khoản trong hệ thống'
    },
    { 
      label: '🏨 TK khách sạn', 
      value: bankAccountData.hotel, 
      format: 'number',
      color: 'from-indigo-500 to-blue-600', 
      icon: '🏨',
      description: 'Tài khoản khách sạn đã kích hoạt'
    },
    { 
      label: '⭐ TK mặc định', 
      value: bankAccountData.withDefault, 
      format: 'number',
      color: 'from-yellow-500 to-orange-500', 
      icon: '⭐',
      description: 'Tài khoản được đặt làm mặc định'
    }
  ];

  const Card = ({ label, value, format, color, icon, description }) => (
    <div className={`bg-gradient-to-br ${color} p-6 rounded-2xl text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-3xl opacity-80">{icon}</div>
        <div className="text-sm font-medium opacity-90">{label}</div>
      </div>
      <div className="text-2xl font-bold mb-1">
        {format === 'currency' 
          ? `${value.toLocaleString('vi-VN')} ₫`
          : value.toLocaleString('vi-VN')
        }
      </div>
      <div className="text-xs opacity-75">{description}</div>
    </div>
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-gray-200 animate-pulse rounded-2xl h-32"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {statisticsData.map((item, index) => (
        <Card key={index} {...item} />
      ))}
    </div>
  );
}

function PayoutManagementTable() {
  const { summary, loading, createPayout, fetchSummary } = useAdminReports(false);
  const { accounts } = useBankAccount();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch summary data when component mounts
  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Filter rows that need payout (have hotel net income > 0)
  const payoutRows = useMemo(() => {
    if (!summary?.daily_summary?.length) return [];
    return summary.daily_summary.filter(r => Number(r.hotelNetSum || 0) > 0);
  }, [summary]);

  // Get hotel bank account info
  const getHotelBankAccount = (hotelId) => {
    return accounts.find(acc => acc.hotelId === hotelId && acc.isDefault) || 
           accounts.find(acc => acc.hotelId === hotelId);
  };

  // Calculate pagination
  const totalItems = payoutRows.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRows = payoutRows.slice(startIndex, endIndex);

  const handleCreatePayout = async (row) => {
    try {
      await createPayout({ hotel_id: row.hotelId, cover_date: row.bizDateVn });
    } catch (error) {
      console.error('Error creating payout:', error);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Pagination component
  const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between bg-white px-6 py-4 border-t border-gray-200">
        <div className="text-sm text-gray-700">
          Trang <span className="font-medium">{currentPage}</span> / <span className="font-medium">{totalPages}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ←
          </button>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const page = i + 1;
            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`px-3 py-2 rounded-lg border transition-colors ${
                  page === currentPage
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            );
          })}
          
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            →
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <CurrencyDollarIcon className="w-6 h-6 mr-2 text-blue-600" />
              Quản lý thanh toán cho khách sạn
            </h3>
            <p className="text-sm text-gray-600 mt-1">Thanh toán doanh thu cho các khách sạn có tài khoản ngân hàng</p>
          </div>
          <div className="text-sm text-gray-500">
            Cần thanh toán: <span className="font-medium text-red-600">{totalItems}</span> bản ghi
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">📅 Ngày</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">🏨 Khách sạn</th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">💰 Số tiền TT</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">🏦 Tài khoản NH</th>
              <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">🔐 Trạng thái</th>
              <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">💳 Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentRows.map((row, index) => {
              const bankAccount = getHotelBankAccount(row.hotelId);
              const payoutAmount = Number(row.hotelNetSum || 0);
              
              return (
                <tr key={`${row.bizDateVn}-${row.hotelId}-${index}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {row.bizDateVn}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{row.hotelName}</div>
                    <div className="text-xs text-gray-500">{row.hotelCity}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <span className="font-bold text-green-600">
                      {payoutAmount.toLocaleString('vi-VN')} ₫
                    </span>
                    <div className="text-xs text-gray-500">
                      ({Number(row.bookingsCount || 0)} đặt phòng)
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {bankAccount ? (
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{bankAccount.bankName}</div>
                        <div className="text-xs text-gray-500">
                          {bankAccount.accountNumber} • {bankAccount.holderName}
                        </div>
                        {bankAccount.isDefault && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mt-1">
                            ⭐ Mặc định
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center text-red-500">
                        <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                        <span className="text-xs">Chưa có TK</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {row.exists_in_payouts ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                        Đã thanh toán
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        Chờ thanh toán
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {!row.exists_in_payouts && bankAccount ? (
                      <button
                        onClick={() => handleCreatePayout(row)}
                        className="inline-flex items-center px-4 py-2 text-xs font-medium rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 focus:ring-4 focus:ring-green-300 transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        <CurrencyDollarIcon className="w-4 h-4 mr-1" />
                        Thanh toán
                      </button>
                    ) : !bankAccount ? (
                      <span className="text-xs text-gray-400 flex items-center">
                        <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                        Cần TK ngân hàng
                      </span>
                    ) : (
                      <span className="text-xs text-green-600 flex items-center justify-center">
                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                        Hoàn tất
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            
            {!loading && currentRows.length === 0 && (
              <tr>
                <td className="px-6 py-12 text-center text-gray-400" colSpan={6}>
                  <div className="flex flex-col items-center">
                    <CurrencyDollarIcon className="w-12 h-12 text-gray-300 mb-4" />
                    <div className="text-lg font-medium">Không có giao dịch cần thanh toán</div>
                    <div className="text-sm">Tất cả các khoản đã được thanh toán hoặc chưa có doanh thu</div>
                  </div>
                </td>
              </tr>
            )}
            
            {loading && (
              <tr>
                <td className="px-6 py-12 text-center text-gray-400" colSpan={6}>
                  <div className="flex flex-col items-center">
                    <LoadingSpinner size="lg" className="mb-4" />
                    <div className="text-lg font-medium">Đang tải dữ liệu...</div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {!loading && totalPages > 1 && (
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}

function BankAccountOverview() {
  const { accounts, loading, fetchAllBankAccounts } = useBankAccount();

  useEffect(() => {
    fetchAllBankAccounts();
  }, [fetchAllBankAccounts]);
  const [filter, setFilter] = useState('all');

  const filteredAccounts = useMemo(() => {
    switch (filter) {
      case 'hotel':
        return accounts.filter(acc => acc.hotelId);
      case 'personal':
        return accounts.filter(acc => !acc.hotelId);
      case 'default':
        return accounts.filter(acc => acc.isDefault);
      default:
        return accounts;
    }
  }, [accounts, filter]);

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

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <BuildingLibraryIcon className="w-6 h-6 mr-2 text-indigo-600" />
              Tổng quan tài khoản ngân hàng
            </h3>
            <p className="text-sm text-gray-600 mt-1">Danh sách tất cả tài khoản ngân hàng trong hệ thống</p>
          </div>
          
          {/* Filter Tabs */}
          <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-200">
            {[
              { key: 'all', label: 'Tất cả', count: accounts.length },
              { key: 'hotel', label: 'Khách sạn', count: accounts.filter(acc => acc.hotelId).length },
              { key: 'personal', label: 'Cá nhân', count: accounts.filter(acc => !acc.hotelId).length },
              { key: 'default', label: 'Mặc định', count: accounts.filter(acc => acc.isDefault).length }
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filter === key
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="p-12 text-center">
          <LoadingSpinner size="lg" className="mb-4" />
          <div className="text-gray-500">Đang tải tài khoản ngân hàng...</div>
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="p-12 text-center">
          <BuildingLibraryIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <div className="text-lg font-medium text-gray-600 mb-2">
            Không có tài khoản nào
          </div>
          <div className="text-gray-500">
            {filter === 'all' ? 'Chưa có tài khoản ngân hàng nào được đăng ký' : `Không có tài khoản ${filter === 'hotel' ? 'khách sạn' : filter === 'personal' ? 'cá nhân' : 'mặc định'}`}
          </div>
        </div>
      ) : (
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAccounts.map((account) => (
              <div
                key={account.bankAccountId}
                className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${
                  account.isDefault
                    ? 'border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50'
                    : account.hotelId
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">
                      {getBankIcon(account.bankName)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 text-sm">
                        {account.bankName}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {account.hotelId ? 'Khách sạn' : 'Cá nhân'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-1">
                    {account.isDefault && (
                      <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium">
                        ⭐ Mặc định
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      account.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {account.status === 'active' ? '✅ Hoạt động' : '⏳ Chờ duyệt'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Chủ tài khoản</p>
                    <p className="font-medium text-gray-800 text-sm">{account.holderName}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500">Số tài khoản</p>
                    <p className="font-mono text-sm font-semibold text-gray-800">
                      {account.accountNumber?.replace(/(\d{4})(?=\d)/g, '$1 ')}
                    </p>
                  </div>
                  
                  {account.branchName && (
                    <div>
                      <p className="text-xs text-gray-500">Chi nhánh</p>
                      <p className="text-sm text-gray-700">{account.branchName}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PayoutHistoryTable() {
  const { payouts, loadingPayouts, fetchPayouts } = useAdminReports(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState(null);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  const rows = payouts?.rows || [];
  const totalItems = rows.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRows = rows.slice(startIndex, endIndex);

  const parsePayoutDetails = (note) => {
    if (!note) return null;
    try {
      return typeof note === 'string' ? JSON.parse(note) : note;
    } catch (e) {
      return null;
    }
  };

  const getStatusBadge = (status) => {
    const configs = {
      'processed': { bg: 'bg-green-100', text: 'text-green-800', label: '✅ Đã xử lý' },
      'scheduled': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '⏰ Đã lên lịch' },
      'failed': { bg: 'bg-red-100', text: 'text-red-800', label: '❌ Thất bại' },
      'pending': { bg: 'bg-blue-100', text: 'text-blue-800', label: '⏳ Chờ xử lý' }
    };
    const config = configs[status] || configs['pending'];
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-between bg-white px-6 py-4 border-t border-gray-200">
        <div className="text-sm text-gray-700">
          Trang <span className="font-medium">{currentPage}</span> / <span className="font-medium">{totalPages}</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ←
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-3 py-2 rounded-lg border ${
                page === currentPage
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            →
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <CheckCircleIcon className="w-6 h-6 mr-2 text-green-600" />
              Lịch sử thanh toán Admin (Payouts)
            </h3>
            <p className="text-sm text-gray-600 mt-1">Tất cả các khoản thanh toán đã được admin tạo cho các khách sạn</p>
          </div>
          <div className="text-sm text-gray-500">
            Tổng: <span className="font-medium text-gray-700">{totalItems}</span> thanh toán
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">📅 Ngày bao trùm</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">⏰ Thời gian tạo</th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase">💰 Số tiền</th>
              <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase">📊 Trạng thái</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">📝 Chi tiết</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentRows.map((r, i) => {
              const details = parsePayoutDetails(r.note);
              const isExpanded = expandedRow === i;
              return (
                <React.Fragment key={r.payout_id || i}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{r.cover_date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(r.scheduled_at).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <span className="font-bold text-green-600">
                        {Number(r.total_net_amount || 0).toLocaleString('vi-VN')} ₫
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {getStatusBadge(r.status)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {details ? (
                        <button
                          onClick={() => setExpandedRow(isExpanded ? null : i)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {isExpanded ? '▼ Ẩn' : '▶ Xem'}
                        </button>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                  </tr>
                  {isExpanded && details && (
                    <tr className="bg-blue-50">
                      <td colSpan={5} className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {details.calculation && (
                            <div className="bg-white rounded-lg p-4 border">
                              <h4 className="font-semibold mb-2">💰 Tính toán</h4>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span>Tổng:</span>
                                  <span>{details.calculation.total_amount?.toLocaleString('vi-VN')} ₫</span>
                                </div>
                                <div className="flex justify-between text-red-600">
                                  <span>Hoa hồng ({details.calculation.commission_rate}):</span>
                                  <span>-{details.calculation.commission_amount?.toLocaleString('vi-VN')} ₫</span>
                                </div>
                                <div className="flex justify-between font-bold text-green-600 pt-1 border-t">
                                  <span>Thanh toán:</span>
                                  <span>{details.calculation.payout_amount?.toLocaleString('vi-VN')} ₫</span>
                                </div>
                              </div>
                            </div>
                          )}
                          {details.bank_account && (
                            <div className="bg-white rounded-lg p-4 border">
                              <h4 className="font-semibold mb-2">🏦 Tài khoản</h4>
                              <div className="space-y-1 text-sm">
                                <div><strong>{details.bank_account.holder_name}</strong></div>
                                <div className="font-mono">{details.bank_account.account_number}</div>
                                <div>{details.bank_account.bank_name}</div>
                              </div>
                            </div>
                          )}
                          {details.contract && (
                            <div className="bg-white rounded-lg p-4 border">
                              <h4 className="font-semibold mb-2">📋 Hợp đồng</h4>
                              <div className="space-y-1 text-sm">
                                <div>ID: {details.contract.contract_id?.slice(0,15)}...</div>
                                <div>Hoa hồng: <strong>{details.contract.commission_rate}</strong></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {!loadingPayouts && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                  <CheckCircleIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <div className="text-lg font-medium">Chưa có thanh toán</div>
                </td>
              </tr>
            )}
            {loadingPayouts && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <LoadingSpinner size="lg" className="mb-4" />
                  <div>Đang tải...</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {!loadingPayouts && totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      )}
    </div>
  );
}

function AdminBankAccountsInner() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <BanknotesIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Thống kê Tài khoản & Thanh toán</h1>
              <p className="text-gray-600">Quản lý tài khoản ngân hàng và thanh toán cho khách sạn</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8">
          <FilterBar />
          <StatisticsCards />
          <PayoutManagementTable />
          <BankAccountOverview />
        </div>
      </div>
    </div>
  );
}

export default function AdminBankAccountsPage() {
  return (
    <HotelProvider>
      <AdminReportsProvider>
        <BankAccountProvider>
          <AdminBankAccountsInner />
        </BankAccountProvider>
      </AdminReportsProvider>
    </HotelProvider>
  );
}