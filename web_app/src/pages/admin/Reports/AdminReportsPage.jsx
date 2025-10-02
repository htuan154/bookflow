import React, { useMemo, useState, useEffect } from 'react';
import { AdminReportsProvider } from '../../../context/AdminReportsContext';
import { HotelProvider } from '../../../context/HotelContext';
import useAdminReports from '../../../hooks/useAdminReports';
import { useHotel } from '../../../hooks/useHotel';

function FilterBar() {
  const { filters, setFilters, fetchSummary, fetchPayments, fetchPayouts } = useAdminReports(false);
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

  const handleHotelChange = (value) => {
    if (value === 'ALL') {
      update('hotels', 'ALL');
    } else {
      update('hotels', value);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200 shadow-lg mb-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">🔍 Bộ lọc báo cáo</h3>
        <p className="text-sm text-gray-600">Chọn khoảng thời gian và khách sạn để xem báo cáo chi tiết</p>
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
            value={filters.hotels || 'ALL'}
            onChange={e => handleHotelChange(e.target.value)}
            disabled={loadingHotels}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100"
          >
            <option value="">Vui lòng chọn khách sạn</option>
            <option value="ALL">Tất cả khách sạn</option>
            {approvedHotels.map(hotel => (
              <option key={hotel.hotel_id} value={hotel.hotel_id}>
                {hotel.name} - {hotel.city}
              </option>
            ))}
          </select>
          {loadingHotels && (
            <p className="text-xs text-blue-500 mt-1">Đang tải danh sách khách sạn...</p>
          )}
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

function KPICards() {
  const { summary, loading } = useAdminReports(false);

  const totals = useMemo(() => {
    if (!summary?.daily_summary?.length) return { gross: 0, pg: 0, admin: 0, net: 0, bookings: 0, hotels: 0 };
    let gross=0, pg=0, admin=0, net=0, bookings=0;
    const hotels = new Set();
    for (const r of summary.daily_summary) {
      gross += Number(r.gross_sum || 0);
      pg    += Number(r.pg_fee_sum || 0);
      admin += Number(r.admin_fee_sum || 0);
      net   += Number(r.hotel_net_sum || 0);
      bookings += Number(r.bookings_count || 0);
      if (r.hotel_id) hotels.add(r.hotel_id);
    }
    return { gross, pg, admin, net, bookings, hotels: hotels.size };
  }, [summary]);

  const kpiData = [
    { label: '💰 Tổng doanh thu', value: totals.gross, color: 'from-green-500 to-emerald-600', icon: '💰' },
    { label: '🏦 Phí thanh toán', value: totals.pg, color: 'from-blue-500 to-cyan-600', icon: '🏦' },
    { label: '⚙️ Phí quản lý', value: totals.admin, color: 'from-purple-500 to-violet-600', icon: '⚙️' },
    { label: '🏨 Thu nhập khách sạn', value: totals.net, color: 'from-orange-500 to-red-600', icon: '🏨' },
    { label: '📋 Số đặt phòng', value: totals.bookings, color: 'from-indigo-500 to-blue-600', icon: '📋' },
    { label: '🏢 Số khách sạn', value: totals.hotels, color: 'from-pink-500 to-rose-600', icon: '🏢' }
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

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-gray-200 animate-pulse rounded-2xl h-28"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
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
                ? 'bg-blue-600 text-white border-blue-600'
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

function SummaryTable() {
  const { summary, loading, createPayout, fetchSummary, filters, setFilters } = useAdminReports(false);
  const rows = summary?.daily_summary || [];
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Calculate pagination
  const totalItems = rows.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRows = rows.slice(startIndex, endIndex);
  
  const mapKey = (r,i) => `${r.biz_date_vn}-${r.hotel_id}-${i}`;

  const handleCreate = async (r) => {
    try {
      await createPayout({ hotel_id: r.hotel_id, cover_date: r.biz_date_vn });
      // fetchSummary() đã được gọi trong context sau khi tạo payout
    } catch (error) {
      console.error('Error creating payout:', error);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Reset to page 1 when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [rows.length]);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">📊 Báo cáo tổng hợp theo ngày và khách sạn</h3>
            <p className="text-sm text-gray-600 mt-1">Chi tiết doanh thu và thanh toán từng khách sạn theo ngày</p>
          </div>
          <div className="text-sm text-gray-500">
            Tổng: <span className="font-medium text-gray-700">{totalItems}</span> bản ghi
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">📅 Ngày</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">🏨 Khách sạn</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">🌍 Thành phố</th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">📋 Đặt phòng</th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">💰 Tổng thu</th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">🏦 Phí TT</th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">⚙️ Phí QL</th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">🏨 Thu nhập KS</th>
              <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">💳 Thanh toán</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentRows.map((r,i) => (
              <tr key={mapKey(r,i)} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{r.biz_date_vn}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{r.hotel_name}</div>
                  <div className="text-xs text-gray-500">ID: {r.hotel_id?.slice(0, 8)}...</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.hotel_city}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">{r.bookings_count}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                  {Number(r.gross_sum||0).toLocaleString('vi-VN')} ₫
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {Number(r.pg_fee_sum||0).toLocaleString('vi-VN')} ₫
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {Number(r.admin_fee_sum||0).toLocaleString('vi-VN')} ₫
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                  <span className="font-bold text-green-600">
                    {Number(r.hotel_net_sum||0).toLocaleString('vi-VN')} ₫
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {(Number(r.hotel_net_sum||0) > 0) ? (
                    (r.exists_in_payouts)
                      ? <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✅ Đã thanh toán
                        </span>
                      : <button
                          onClick={() => handleCreate(r)}
                          className="inline-flex items-center px-4 py-2 text-xs font-medium rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-300 transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                          💳 Tạo thanh toán
                        </button>
                  ) : <span className="text-xs text-gray-400">—</span>}
                </td>
              </tr>
            ))}
            
            {!loading && currentRows.length === 0 && (
              <tr>
                <td className="px-6 py-12 text-center text-gray-400" colSpan={9}>
                  <div className="flex flex-col items-center">
                    <div className="text-4xl mb-4">📊</div>
                    <div className="text-lg font-medium">Không có dữ liệu</div>
                    <div className="text-sm">Vui lòng thay đổi bộ lọc để xem kết quả</div>
                  </div>
                </td>
              </tr>
            )}
            
            {loading && (
              <tr>
                <td className="px-6 py-12 text-center text-gray-400" colSpan={9}>
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                    <div className="text-lg font-medium">Đang tải dữ liệu...</div>
                    <div className="text-sm">Vui lòng chờ trong giây lát</div>
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

function AdminReportsInner() {
  const { fetchSummary } = useAdminReports();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">📊</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Báo cáo thống kê Admin</h1>
              <p className="text-gray-600">Theo dõi doanh thu và thanh toán của hệ thống</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8">
          <FilterBar />
          <KPICards />
          <SummaryTable />
        </div>
      </div>
    </div>
  );
}

export default function AdminReportsPage() {
  return (
    <HotelProvider>
      <AdminReportsProvider>
        <AdminReportsInner />
      </AdminReportsProvider>
    </HotelProvider>
  );
}
