import React, { useMemo, useState, useEffect } from 'react';
import { OwnerReportsProvider } from '../../../context/OwnerReportsContext';
import { HotelProvider } from '../../../context/HotelContext';
import useOwnerReports from '../../../hooks/useOwnerReports';
import { useHotel } from '../../../hooks/useHotel';

function OwnerFilterBar() {
  const { filters, setFilters, setSelectedHotel,fetchPayments, fetchPayouts } = useOwnerReports(false);
  const { fetchApprovedHotels, approvedHotels } = useHotel();
  const [loadingHotels, setLoadingHotels] = useState(false);
  
  const update = (k, v) => setFilters(prev => ({ ...prev, [k]: v }));

  // Load hotels for dropdown
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
    { label: 'Hôm qua', range: () => {
      const d = new Date(); d.setDate(d.getDate() - 1);
      const iso = d.toISOString().slice(0,10);
      return { date_from: iso, date_to: iso };
    }},
    { label: '7 ngày qua', range: () => {
      const end = new Date(); const start = new Date(); start.setDate(end.getDate() - 6);
      return { date_from: start.toISOString().slice(0,10), date_to: end.toISOString().slice(0,10) };
    }},
    { label: '30 ngày qua', range: () => {
      const end = new Date(); const start = new Date(); start.setDate(end.getDate() - 29);
      return { date_from: start.toISOString().slice(0,10), date_to: end.toISOString().slice(0,10) };
    }},
    { label: 'Tháng này', range: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { date_from: start.toISOString().slice(0,10), date_to: now.toISOString().slice(0,10) };
    }},
  ]), []);

  const applyAll = async () => {
    try {
      await Promise.all([fetchPayments(), fetchPayouts()]);
    } catch (err) {
      // fetchPayments / fetchPayouts will set context error, but also log here for visibility
      console.error('Error applying filters:', err);
      // Rethrow so callers (if any) can handle it
      throw err;
    }
  };

  const handleHotelChange = (value) => {
    if (value === 'ALL') {
      update('hotel_id', 'ALL');
    } else {
      update('hotel_id', value);
    }
  };

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200 shadow-lg mb-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">🔍 Bộ lọc báo cáo doanh thu</h3>
        <p className="text-sm text-gray-600">Chọn khoảng thời gian và khách sạn để xem báo cáo chi tiết</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">📅 Từ ngày</label>
          <input
            type="date"
            value={filters.date_from}
            onChange={e => update('date_from', e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">📅 Đến ngày</label>
          <input
            type="date"
            value={filters.date_to}
            onChange={e => update('date_to', e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">🏨 Khách sạn</label>
          <select
            value={filters.hotel_id || ''}
            onChange={e => handleHotelChange(e.target.value)}
            disabled={loadingHotels}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors disabled:bg-gray-100"
          >
            <option value="">Vui lòng chọn khách sạn</option>
            <option value="ALL">Tất cả khách sạn của tôi</option>
           {approvedHotels.map((hotel, idx) => {
   const id =
     hotel.hotel_id ??
     hotel.hotelId ??
     hotel.id ??
     `tmp-${idx}`; // fallback cuối cùng để tránh trùng key
   const name = hotel.name ?? hotel.hotel_name ?? 'Khách sạn';
   const city = hotel.city ?? hotel.hotel_city ?? '';
   return (
     <option key={String(id)} value={String(id)}>
       {name} - {city}
     </option>
   );
 })}
          </select>
          {loadingHotels && (
            <p className="text-xs text-green-500 mt-1">Đang tải danh sách khách sạn...</p>
          )}
        </div>
        
        <div>
          <button 
            onClick={applyAll} 
            className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-xl hover:from-green-700 hover:to-emerald-700 focus:ring-4 focus:ring-green-300 transition-all duration-200 shadow-lg hover:shadow-xl"
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
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 bg-white hover:bg-gray-50 hover:border-green-300 transition-colors duration-200"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function OwnerKPICards() {
  const { payments, loadingPayments } = useOwnerReports(false);
  const totals = useMemo(() => {
    const rows = payments?.rows || [];
    let gross=0, pg=0, admin=0, net=0, count=0;
    for (const r of rows) {
      gross += Number(r.finalAmount || 0);  // Backend model sử dụng finalAmount
      pg    += Number(r.pgFeeAmount || 0);  // Backend model sử dụng pgFeeAmount
      admin += Number(r.adminFeeAmount || 0);  // Backend model sử dụng adminFeeAmount
      net   += Number(r.hotelNetAmount || 0);  // Backend model sử dụng hotelNetAmount
      count += 1;
    }
    return { gross, pg, admin, net, count };
  }, [payments]);

  const kpiData = [
    { label: '💰 Tổng doanh thu', value: totals.gross, color: 'from-green-500 to-emerald-600', icon: '💰' },
    { label: '🏦 Phí thanh toán', value: totals.pg, color: 'from-blue-500 to-cyan-600', icon: '🏦' },
    { label: '⚙️ Phí quản lý', value: totals.admin, color: 'from-purple-500 to-violet-600', icon: '⚙️' },
    { label: '🏨 Thu nhập thực tế', value: totals.net, color: 'from-orange-500 to-red-600', icon: '🏨' },
    { label: '📋 Số giao dịch', value: totals.count, color: 'from-indigo-500 to-blue-600', icon: '📋' }
  ];

  const Card = ({ label, value, color, icon }) => (
    <div className={`bg-gradient-to-br ${color} p-6 rounded-2xl text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium opacity-90">{label}</div>
          <div className="text-2xl font-bold mt-2">{typeof value === 'number' ? value.toLocaleString('vi-VN') : value}</div>
        </div>
        <div className="text-3xl opacity-80">{icon}</div>
      </div>
    </div>
  );

  if (loadingPayments) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="bg-gray-200 animate-pulse rounded-2xl h-28"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {kpiData.map((item, index) => (
        <Card key={index} {...item} />
      ))}
    </div>
  );
}

// Pagination component
function Pagination({ currentPage, totalPages, onPageChange }) {
  const pages = [];
  const maxVisible = 5;
  
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  
  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

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
          <span className="text-lg">←</span>
        </button>
        
        {startPage > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              1
            </button>
            {startPage > 2 && <span className="text-gray-400">...</span>}
          </>
        )}
        
        {pages.map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-2 rounded-lg border transition-colors ${
              page === currentPage
                ? 'bg-green-600 text-white border-green-600'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {page}
          </button>
        ))}
        
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="text-gray-400">...</span>}
            <button
              onClick={() => onPageChange(totalPages)}
              className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {totalPages}
            </button>
          </>
        )}
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span className="text-lg">→</span>
        </button>
      </div>
    </div>
  );
}

function OwnerPaymentsTable() {
  const { payments, loadingPayments } = useOwnerReports(false);
  const rows = payments?.rows || [];
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Calculate pagination
  const totalItems = rows.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRows = rows.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Reset to page 1 when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [rows.length]);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden mb-6">
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">📊 Chi tiết giao dịch đặt phòng</h3>
            <p className="text-sm text-gray-600 mt-1">Danh sách các giao dịch booking từ khách hàng (chưa thanh toán cho khách sạn)</p>
          </div>
          <div className="text-sm text-gray-500">
            Tổng: <span className="font-medium text-gray-700">{totalItems}</span> giao dịch
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">📅 Ngày</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">🏨 Khách sạn</th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">💰 Tổng thu</th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">🏦 Phí TT</th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">⚙️ Phí QL</th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">🏨 Thu nhập</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">📋 Booking</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">👤 Khách</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentRows.map((r, i) => (
              <tr key={`${r.paymentId || r.payment_id || i}`} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{r.bizDateVn}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{r.hotelName}</div>
                  <div className="text-xs text-gray-500">ID: {r.paymentId?.slice(0, 8)}...</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                  {Number(r.finalAmount||0).toLocaleString('vi-VN')} ₫
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {Number(r.pgFeeAmount||0).toLocaleString('vi-VN')} ₫
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {Number(r.adminFeeAmount||0).toLocaleString('vi-VN')} ₫
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                  <span className="font-bold text-green-600">
                    {Number(r.hotelNetAmount||0).toLocaleString('vi-VN')} ₫
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {r.bookingId?.slice(0, 8)}...
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {r.guestId?.slice(0, 8)}...
                </td>
              </tr>
            ))}
            
            {!loadingPayments && currentRows.length === 0 && (
              <tr>
                <td className="px-6 py-12 text-center text-gray-400" colSpan={8}>
                  <div className="flex flex-col items-center">
                    <div className="text-4xl mb-4">💳</div>
                    <div className="text-lg font-medium">Không có giao dịch</div>
                    <div className="text-sm">Vui lòng thay đổi bộ lọc để xem kết quả</div>
                  </div>
                </td>
              </tr>
            )}
            
            {loadingPayments && (
              <tr>
                <td className="px-6 py-12 text-center text-gray-400" colSpan={8}>
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-4"></div>
                    <div className="text-lg font-medium">Đang tải dữ liệu...</div>
                    <div className="text-sm">Vui lòng chờ trong giây lát</div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {!loadingPayments && totalPages > 1 && (
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}

function OwnerPayoutsTable() {
  const { payouts, loadingPayouts } = useOwnerReports(false);
  const rows = payouts?.rows || [];
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState(null);
  const itemsPerPage = 10;
  
  // Calculate pagination
  const totalItems = rows.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRows = rows.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Reset to page 1 when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [rows.length]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      'processed': { bg: 'bg-green-100', text: 'text-green-800', label: '✅ Đã xử lý' },
      'scheduled': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '⏰ Đã lên lịch' },
      'failed': { bg: 'bg-red-100', text: 'text-red-800', label: '❌ Thất bại' },
      'pending': { bg: 'bg-blue-100', text: 'text-blue-800', label: '⏳ Chờ xử lý' }
    };
    
    const config = statusConfig[status] || statusConfig['pending'];
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  // Parse note JSON to display details
  const parsePayoutDetails = (note) => {
    if (!note) return null;
    try {
      const details = typeof note === 'string' ? JSON.parse(note) : note;
      return details;
    } catch (e) {
      return null;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">💳 Lịch sử thanh toán nhận được (Payouts)</h3>
            <p className="text-sm text-gray-600 mt-1">Các khoản tiền admin đã chuyển vào tài khoản ngân hàng của bạn</p>
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
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">📅 Ngày bao trùm</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">⏰ Thời gian tạo</th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">💰 Số tiền</th>
              <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">📊 Trạng thái</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">📝 Ghi chú</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentRows.map((r, i) => {
              const details = parsePayoutDetails(r.note);
              const isExpanded = expandedRow === i;
              const payoutId = r.payoutId || r.payout_id || i;
              
              return (
                <React.Fragment key={payoutId}>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {r.cover_date || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        {r.scheduled_at ? new Date(r.scheduled_at).toLocaleDateString('vi-VN') : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {r.scheduled_at ? new Date(r.scheduled_at).toLocaleTimeString('vi-VN') : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <span className="font-bold text-green-600">
                        {Number(r.total_net_amount||0).toLocaleString('vi-VN')} ₫
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {getStatusBadge(r.status)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {details ? (
                        <button
                          onClick={() => setExpandedRow(isExpanded ? null : i)}
                          className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
                        >
                          {isExpanded ? '▼ Ẩn chi tiết' : '▶ Xem chi tiết'}
                        </button>
                      ) : (
                        <span className="text-gray-500">{r.note || '—'}</span>
                      )}
                    </td>
                  </tr>
                  {isExpanded && details && (
                    <tr className="bg-blue-50">
                      <td colSpan={5} className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Calculation Details */}
                          {details.calculation && (
                            <div className="bg-white rounded-lg p-4 border border-blue-200">
                              <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                                <span className="text-lg mr-2">💰</span>
                                Chi Tiết Tính Toán
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Tổng doanh thu:</span>
                                  <span className="font-semibold">{details.calculation.total_amount?.toLocaleString('vi-VN')} ₫</span>
                                </div>
                                <div className="flex justify-between text-red-600">
                                  <span>Hoa hồng ({details.calculation.commission_rate}):</span>
                                  <span className="font-semibold">- {details.calculation.commission_amount?.toLocaleString('vi-VN')} ₫</span>
                                </div>
                                <div className="border-t border-gray-200 pt-2 flex justify-between">
                                  <span className="font-semibold text-gray-800">Số tiền nhận được:</span>
                                  <span className="font-bold text-green-600">{details.calculation.payout_amount?.toLocaleString('vi-VN')} ₫</span>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Bank Account Details */}
                          {details.bank_account && (
                            <div className="bg-white rounded-lg p-4 border border-green-200">
                              <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                                <span className="text-lg mr-2">🏦</span>
                                Tài Khoản Nhận Tiền
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div>
                                  <p className="text-xs text-gray-500">Chủ tài khoản</p>
                                  <p className="font-semibold text-gray-900">{details.bank_account.holder_name}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Số tài khoản</p>
                                  <p className="font-mono font-bold text-gray-900">{details.bank_account.account_number}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Ngân hàng</p>
                                  <p className="font-medium text-gray-900">{details.bank_account.bank_name}</p>
                                </div>
                                {details.bank_account.branch_name && (
                                  <div>
                                    <p className="text-xs text-gray-500">Chi nhánh</p>
                                    <p className="font-medium text-gray-900">{details.bank_account.branch_name}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Contract Info */}
                          {details.contract && (
                            <div className="bg-white rounded-lg p-4 border border-purple-200 md:col-span-2">
                              <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                                <span className="text-lg mr-2">📋</span>
                                Thông Tin Hợp Đồng
                              </h4>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-xs text-gray-500">ID Hợp đồng</p>
                                  <p className="font-mono text-sm">{details.contract.contract_id?.slice(0, 20)}...</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Tỉ lệ hoa hồng</p>
                                  <p className="font-bold text-purple-600">{details.contract.commission_rate}</p>
                                </div>
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
            
            {!loadingPayouts && currentRows.length === 0 && (
              <tr>
                <td className="px-6 py-12 text-center text-gray-400" colSpan={5}>
                  <div className="flex flex-col items-center">
                    <div className="text-4xl mb-4">💳</div>
                    <div className="text-lg font-medium">Chưa có thanh toán</div>
                    <div className="text-sm">Các giao dịch sẽ được thanh toán theo lịch trình</div>
                  </div>
                </td>
              </tr>
            )}
            
            {loadingPayouts && (
              <tr>
                <td className="px-6 py-12 text-center text-gray-400" colSpan={5}>
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-4"></div>
                    <div className="text-lg font-medium">Đang tải dữ liệu...</div>
                    <div className="text-sm">Vui lòng chờ trong giây lát</div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {!loadingPayouts && totalPages > 1 && (
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}

function OwnerReportsInner() {
  const { error } = useOwnerReports(true); // auto fetch payments & payouts lần đầu
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">📊</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Báo cáo doanh thu khách sạn</h1>
              <p className="text-gray-600">Theo dõi thu nhập và thanh toán của các khách sạn bạn sở hữu</p>
            </div>
          </div>
        </div>

        {/* Global error banner for owner reports (e.g., authentication/network) */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
            <strong className="block font-medium">Lỗi khi tải báo cáo</strong>
            <div className="text-sm mt-1">{typeof error === 'string' ? error : (error?.message || JSON.stringify(error))}</div>
            {error?.status === 401 && (
              <div className="text-sm mt-2">
                Bạn chưa đăng nhập hoặc phiên đã hết hạn. Vui lòng đăng nhập lại.
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="space-y-8">
          <OwnerFilterBar />
          <OwnerKPICards />
          <OwnerPaymentsTable />
          <OwnerPayoutsTable />
        </div>
      </div>
    </div>
  );
}

export default function OwnerReportsPage() {
  return (
    <HotelProvider>
      <OwnerReportsProvider>
        <OwnerReportsInner />
      </OwnerReportsProvider>
    </HotelProvider>
  );
}
