import React, { useMemo, useState, useEffect } from 'react';
import { OwnerReportsProvider } from '../../../context/OwnerReportsContext';
import useOwnerReports from '../../../hooks/useOwnerReports';
import axiosClient from '../../../config/axiosClient';

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
                ? 'bg-purple-600 text-white border-purple-600'
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

function OccupancyFilterBar() {
  const { filters, setFilters, fetchPayments } = useOwnerReports(false);
  const [hotels, setHotels] = useState([]);
  const [loadingHotels, setLoadingHotels] = useState(false);
  
  const update = (k, v) => setFilters(prev => ({ ...prev, [k]: v }));

  // Load hotels for dropdown - tham khảo từ PromotionsPage
  useEffect(() => {
    const loadMyHotels = async () => {
      try {
        setLoadingHotels(true);
        const res = await axiosClient.get('/hotels/my-hotels');
        const allHotels = res?.data?.data ?? res?.data ?? [];
        
        // Chỉ lấy những khách sạn có trạng thái approved hoặc active
        const approvedHotels = allHotels.filter(hotel => 
          hotel.status === 'approved' || hotel.status === 'active'
        );
        console.log('Hotels loaded for occupancy reports:', approvedHotels);
        
        setHotels(approvedHotels);
      } catch (error) {
        console.error('Lỗi khi tải danh sách khách sạn:', error);
      } finally {
        setLoadingHotels(false);
      }
    };

    loadMyHotels();
  }, []);

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

  const applyFilters = async () => {
    await fetchPayments();
  };

  const handleHotelChange = (value) => {
    if (value === 'ALL') {
      update('hotel_id', 'ALL');
    } else {
      update('hotel_id', value);
    }
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-200 shadow-lg mb-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">🔍 Bộ lọc tỷ lệ lấp đầy</h3>
        <p className="text-sm text-gray-600">Chọn khoảng thời gian và khách sạn để xem báo cáo tỷ lệ lấp đầy phòng</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">📅 Từ ngày</label>
          <input
            type="date"
            value={filters.date_from}
            onChange={e => update('date_from', e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">📅 Đến ngày</label>
          <input
            type="date"
            value={filters.date_to}
            onChange={e => update('date_to', e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">🏨 Khách sạn</label>
          <select
            value={filters.hotel_id || ''}
            onChange={e => handleHotelChange(e.target.value)}
            disabled={loadingHotels}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors disabled:bg-gray-100"
          >
            <option value="">Vui lòng chọn khách sạn</option>
            <option value="ALL">Tất cả khách sạn của tôi</option>
            {hotels.map(hotel => (
              <option key={hotel.hotelId || hotel.hotel_id || hotel.id} value={hotel.hotelId || hotel.hotel_id || hotel.id}>
                {hotel.name} - {hotel.city}
              </option>
            ))}
          </select>
          {loadingHotels && (
            <p className="text-xs text-purple-500 mt-1">Đang tải danh sách khách sạn...</p>
          )}
        </div>
        
        <div>
          <button 
            onClick={applyFilters} 
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:from-purple-700 hover:to-pink-700 focus:ring-4 focus:ring-purple-300 transition-all duration-200 shadow-lg hover:shadow-xl"
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
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 bg-white hover:bg-gray-50 hover:border-purple-300 transition-colors duration-200"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function OccupancyKPICards() {
  const { payments, loadingPayments } = useOwnerReports(false);
  
  const occupancyStats = useMemo(() => {
    const rows = payments?.rows || [];
    if (!rows.length) return { 
      totalBookings: 0,
      uniqueDates: 0,
      avgBookingsPerDay: 0,
      estimatedOccupancy: 0,
      totalRooms: 50, // Mock data - would come from hotel room capacity
      avgStayDuration: 1
    };

    const dateSet = new Set();
    let totalBookings = rows.length;
    
    for (const r of rows) {
      if (r.biz_date_vn) {
        dateSet.add(r.biz_date_vn);
      }
    }
    
    const uniqueDates = dateSet.size || 1;
    const avgBookingsPerDay = totalBookings / uniqueDates;
    
    // Mock calculation - in real app this would be based on actual room capacity
    const totalRooms = 50;
    const estimatedOccupancy = Math.min((avgBookingsPerDay / totalRooms) * 100, 100);

    return {
      totalBookings,
      uniqueDates,
      avgBookingsPerDay,
      estimatedOccupancy,
      totalRooms,
      avgStayDuration: 1.2 // Mock average stay duration
    };
  }, [payments]);

  const kpiData = [
    { label: '📊 Tỷ lệ lấp đầy', value: `${occupancyStats.estimatedOccupancy.toFixed(1)}%`, color: 'from-purple-500 to-pink-600', icon: '📊' },
    { label: '🏨 Tổng đặt phòng', value: occupancyStats.totalBookings, color: 'from-blue-500 to-cyan-600', icon: '🏨', format: 'number' },
    { label: '📅 Số ngày có KH', value: occupancyStats.uniqueDates, color: 'from-green-500 to-emerald-600', icon: '📅', format: 'number' },
    { label: '📈 TB đặt/ngày', value: occupancyStats.avgBookingsPerDay.toFixed(1), color: 'from-orange-500 to-amber-600', icon: '📈' },
    { label: '🛏️ Tổng số phòng', value: occupancyStats.totalRooms, color: 'from-indigo-500 to-purple-600', icon: '🛏️', format: 'number' },
    { label: '⏱️ TB thời gian ở', value: `${occupancyStats.avgStayDuration} đêm`, color: 'from-teal-500 to-green-600', icon: '⏱️' }
  ];

  const Card = ({ label, value, color, icon, format }) => (
    <div className={`bg-gradient-to-br ${color} p-6 rounded-2xl text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium opacity-90">{label}</div>
          <div className="text-2xl font-bold mt-2">
            {format === 'number' && typeof value === 'number' ? value.toLocaleString('vi-VN') : value}
          </div>
        </div>
        <div className="text-3xl opacity-80">{icon}</div>
      </div>
    </div>
  );

  if (loadingPayments) {
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

function OccupancyTrendChart() {
  const { payments, loadingPayments } = useOwnerReports(false);
  
  const dailyOccupancy = useMemo(() => {
    const rows = payments?.rows || [];
    const groupedByDate = {};
    const totalRooms = 50; // Mock data

    for (const r of rows) {
      const date = r.biz_date_vn;
      if (!date) continue;

      if (!groupedByDate[date]) {
        groupedByDate[date] = {
          date,
          bookings: 0,
          revenue: 0
        };
      }

      groupedByDate[date].bookings += 1;
      groupedByDate[date].revenue += Number(r.gross_amount || 0);
    }

    return Object.values(groupedByDate).map(item => ({
      ...item,
      occupancyRate: Math.min((item.bookings / totalRooms) * 100, 100),
      avgRevenuePerBooking: item.bookings > 0 ? item.revenue / item.bookings : 0
    })).sort((a, b) => a.date.localeCompare(b.date));
  }, [payments]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const totalItems = dailyOccupancy.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRows = dailyOccupancy.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [dailyOccupancy.length]);

  const getOccupancyColor = (rate) => {
    if (rate >= 80) return 'text-green-600 bg-green-100';
    if (rate >= 60) return 'text-yellow-600 bg-yellow-100';
    if (rate >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">📊 Tỷ lệ lấp đầy theo ngày</h3>
            <p className="text-sm text-gray-600 mt-1">Theo dõi tỷ lệ lấp đầy phòng hàng ngày của khách sạn</p>
          </div>
          <div className="text-sm text-gray-500">
            Tổng: <span className="font-medium text-gray-700">{totalItems}</span> ngày
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">📅 Ngày</th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">🏨 Số đặt phòng</th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">📊 Tỷ lệ lấp đầy</th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">💰 Doanh thu</th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">📈 TB/phòng</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentRows.map((item) => (
              <tr key={item.date} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {new Date(item.date).toLocaleDateString('vi-VN')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                  {item.bookings}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getOccupancyColor(item.occupancyRate)}`}>
                    {item.occupancyRate.toFixed(1)}%
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {item.revenue.toLocaleString('vi-VN')} ₫
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {item.avgRevenuePerBooking.toLocaleString('vi-VN')} ₫
                </td>
              </tr>
            ))}
            
            {!loadingPayments && currentRows.length === 0 && (
              <tr>
                <td className="px-6 py-12 text-center text-gray-400" colSpan={5}>
                  <div className="flex flex-col items-center">
                    <div className="text-4xl mb-4">📊</div>
                    <div className="text-lg font-medium">Không có dữ liệu lấp đầy</div>
                    <div className="text-sm">Vui lòng thay đổi bộ lọc để xem kết quả</div>
                  </div>
                </td>
              </tr>
            )}
            
            {loadingPayments && (
              <tr>
                <td className="px-6 py-12 text-center text-gray-400" colSpan={5}>
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-4"></div>
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

function OccupancyInner() {
  useOwnerReports(true);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">📊</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Báo cáo tỷ lệ lấp đầy</h1>
              <p className="text-gray-600">Theo dõi và phân tích tỷ lệ lấp đầy phòng của khách sạn</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8">
          <OccupancyFilterBar />
          <OccupancyKPICards />
          <OccupancyTrendChart />
        </div>
      </div>
    </div>
  );
}

export default function OccupancyPage() {
  return (
    <OwnerReportsProvider>
      <OccupancyInner />
    </OwnerReportsProvider>
  );
}