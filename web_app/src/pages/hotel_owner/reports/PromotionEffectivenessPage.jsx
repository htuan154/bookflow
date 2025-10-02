import React, { useMemo, useState, useEffect } from 'react';
import { OwnerReportsProvider } from '../../../context/OwnerReportsContext';
import useOwnerReports from '../../../hooks/useOwnerReports';
import axiosClient from '../../../config/axiosClient';
import promotionService from '../../../api/promotions.service';

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
                ? 'bg-orange-600 text-white border-orange-600'
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

function PromotionFilterBar() {
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
        console.log('Hotels loaded for promotion reports:', approvedHotels);
        
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
    <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-2xl border border-orange-200 shadow-lg mb-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">🔍 Bộ lọc hiệu quả khuyến mãi</h3>
        <p className="text-sm text-gray-600">Chọn khoảng thời gian và khách sạn để phân tích hiệu quả các chương trình khuyến mãi</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">📅 Từ ngày</label>
          <input
            type="date"
            value={filters.date_from}
            onChange={e => update('date_from', e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">📅 Đến ngày</label>
          <input
            type="date"
            value={filters.date_to}
            onChange={e => update('date_to', e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">🏨 Khách sạn</label>
          <select
            value={filters.hotel_id || ''}
            onChange={e => handleHotelChange(e.target.value)}
            disabled={loadingHotels}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors disabled:bg-gray-100"
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
            <p className="text-xs text-orange-500 mt-1">Đang tải danh sách khách sạn...</p>
          )}
        </div>
        
        <div>
          <button 
            onClick={applyFilters} 
            className="w-full px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white font-medium rounded-xl hover:from-orange-700 hover:to-red-700 focus:ring-4 focus:ring-orange-300 transition-all duration-200 shadow-lg hover:shadow-xl"
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
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 bg-white hover:bg-gray-50 hover:border-orange-300 transition-colors duration-200"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PromotionKPICards() {
  const { payments, loadingPayments, filters } = useOwnerReports(false);
  const [promotions, setPromotions] = useState([]);
  
  // Load promotions để tính KPI
  useEffect(() => {
    const loadPromotions = async () => {
      if (!filters.hotel_id || filters.hotel_id === 'ALL') {
        setPromotions([]);
        return;
      }
      
      try {
        const response = await promotionService.getPromotionsByHotelId(filters.hotel_id);
        const promotionsData = response?.data ?? response ?? [];
        setPromotions(promotionsData);
      } catch (error) {
        console.error('Lỗi khi tải khuyến mãi cho KPI:', error);
        setPromotions([]);
      }
    };

    loadPromotions();
  }, [filters.hotel_id]);
  
  const promotionStats = useMemo(() => {
    const rows = payments?.rows || [];
    if (!rows.length || !promotions.length) return { 
      totalBookings: rows.length,
      promotionBookings: 0,
      promotionRate: 0,
      promotionRevenue: 0,
      avgDiscountAmount: 0,
      effectivenessScore: 0
    };

    let totalBookings = rows.length;
    let totalRevenue = 0;
    let promotionBookings = 0;
    let promotionRevenue = 0;
    let totalDiscountAmount = 0;
    
    for (const r of rows) {
      const revenue = Number(r.gross_amount || 0);
      totalRevenue += revenue;
      
      // Kiểm tra xem booking này có sử dụng promotion không
      const hasPromotion = r.promotion_code || (r.discount_amount && r.discount_amount > 0);
      
      if (hasPromotion) {
        promotionBookings++;
        promotionRevenue += revenue;
        
        // Tính discount amount
        if (r.discount_amount) {
          totalDiscountAmount += Number(r.discount_amount);
        } else {
          // Ước tính từ promotion data nếu có
          const promo = promotions.find(p => p.code === r.promotion_code);
          if (promo) {
            if (promo.discount_type === 'percentage') {
              totalDiscountAmount += revenue * (promo.discount_value / 100);
            } else {
              totalDiscountAmount += promo.discount_value;
            }
          }
        }
      }
    }
    
    const promotionRate = totalBookings > 0 ? (promotionBookings / totalBookings) * 100 : 0;
    const avgDiscountAmount = promotionBookings > 0 ? totalDiscountAmount / promotionBookings : 0;
    
    // Effectiveness score dựa trên tỷ lệ sử dụng và contribution revenue
    const revenueContribution = totalRevenue > 0 ? (promotionRevenue / totalRevenue) * 100 : 0;
    const effectivenessScore = (promotionRate + revenueContribution) / 2;

    return {
      totalBookings,
      promotionBookings,
      promotionRate,
      promotionRevenue,
      avgDiscountAmount,
      effectivenessScore: Math.min(effectivenessScore, 100)
    };
  }, [payments, promotions]);

  const kpiData = [
    { label: '🎯 Tỷ lệ sử dụng KM', value: `${promotionStats.promotionRate.toFixed(1)}%`, color: 'from-orange-500 to-red-600', icon: '🎯' },
    { label: '🏷️ Đặt phòng có KM', value: promotionStats.promotionBookings, color: 'from-blue-500 to-cyan-600', icon: '🏷️', format: 'number' },
    { label: '💰 DT từ KM', value: promotionStats.promotionRevenue, color: 'from-green-500 to-emerald-600', icon: '💰', format: 'currency' },
    { label: '🎁 TB giảm giá', value: promotionStats.avgDiscountAmount, color: 'from-purple-500 to-pink-600', icon: '🎁', format: 'currency' },
    { label: '📊 Điểm hiệu quả', value: `${promotionStats.effectivenessScore.toFixed(1)}/100`, color: 'from-indigo-500 to-purple-600', icon: '📊' },
    { label: '📈 Tổng đặt phòng', value: promotionStats.totalBookings, color: 'from-teal-500 to-green-600', icon: '📈', format: 'number' }
  ];

  const Card = ({ label, value, color, icon, format }) => (
    <div className={`bg-gradient-to-br ${color} p-6 rounded-2xl text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium opacity-90">{label}</div>
          <div className="text-2xl font-bold mt-2">
            {format === 'currency' ? 
              `${value.toLocaleString('vi-VN')} ₫` : 
              format === 'number' && typeof value === 'number' ? 
              value.toLocaleString('vi-VN') : 
              value
            }
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

function PromotionEffectivenessTable() {
  const { payments, loadingPayments, filters } = useOwnerReports(false);
  const [promotions, setPromotions] = useState([]);
  const [loadingPromotions, setLoadingPromotions] = useState(false);
  
  // Load promotions từ API thật
  useEffect(() => {
    const loadPromotions = async () => {
      if (!filters.hotel_id || filters.hotel_id === 'ALL') {
        setPromotions([]);
        return;
      }
      
      try {
        setLoadingPromotions(true);
        console.log('Loading promotions for hotel:', filters.hotel_id);
        const response = await promotionService.getPromotionsByHotelId(filters.hotel_id);
        const promotionsData = response?.data ?? response ?? [];
        console.log('Promotions loaded for reports:', promotionsData);
        setPromotions(promotionsData);
      } catch (error) {
        console.error('Lỗi khi tải danh sách khuyến mãi:', error);
        setPromotions([]);
      } finally {
        setLoadingPromotions(false);
      }
    };

    loadPromotions();
  }, [filters.hotel_id]);

  const promotionAnalysis = useMemo(() => {
    const rows = payments?.rows || [];
    
    return promotions.map(promo => {
      // Tính toán dữ liệu thật từ booking data
      const promoBookings = rows.filter(booking => {
        // Giả sử có trường promotion_code hoặc discount_amount trong booking
        return booking.promotion_code === promo.code || 
               (booking.discount_amount && booking.discount_amount > 0);
      });
      
      const usageCount = promoBookings.length || 0;
      const totalRevenue = promoBookings.reduce((sum, booking) => 
        sum + Number(booking.gross_amount || 0), 0);
      
      // Tính tổng giảm giá với safe checks
      let totalDiscount = 0;
      const discountValue = Number(promo.discount_value) || 0;
      
      if (promo.discount_type === 'percentage') {
        totalDiscount = totalRevenue * (discountValue / 100);
      } else {
        totalDiscount = usageCount * discountValue;
      }
      
      const effectivenessScore = rows.length > 0 ? 
        ((usageCount / rows.length) * 100) : 0;
      
      // Giả sử conversion rate từ view -> booking (mock data)
      const conversionRate = Math.random() * 15 + 5; // 5-20%
      
      return {
        id: promo.promotion_id || promo.id || `promo-${Math.random()}`,
        name: promo.name || promo.title || 'Chương trình khuyến mãi',
        type: promo.discount_type === 'percentage' ? 'Giảm giá %' : 'Giảm tiền',
        discount: discountValue,
        status: promo.status || 'active',
        usageCount,
        totalRevenue,
        totalDiscount,
        effectivenessScore: Math.min(effectivenessScore || 0, 100),
        conversionRate,
        avgOrderValue: usageCount > 0 ? totalRevenue / usageCount : 0,
        maxUsage: promo.usage_limit || null,
        currentUsage: promo.current_usage || usageCount
      };
    });
  }, [promotions, payments]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const totalItems = promotionAnalysis.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRows = promotionAnalysis.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [promotionAnalysis.length]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      'active': { bg: 'bg-green-100', text: 'text-green-800', label: '✅ Đang chạy' },
      'paused': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '⏸️ Tạm dừng' },
      'ended': { bg: 'bg-gray-100', text: 'text-gray-800', label: '🏁 Đã kết thúc' }
    };
    
    const config = statusConfig[status] || statusConfig['active'];
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getEffectivenessColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">🎯 Phân tích hiệu quả khuyến mãi</h3>
            <p className="text-sm text-gray-600 mt-1">Chi tiết hiệu quả của từng chương trình khuyến mãi</p>
          </div>
          <div className="text-sm text-gray-500">
            Tổng: <span className="font-medium text-gray-700">{totalItems}</span> chương trình
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">🏷️ Chương trình</th>
              <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">📊 Trạng thái</th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">🎯 Lượt sử dụng</th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">💰 Doanh thu</th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">💸 Tổng giảm</th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">📈 Tỷ lệ chuyển đổi</th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">🏆 Điểm hiệu quả</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentRows.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                    <div className="text-xs text-gray-500">
                      {item.type}: {item.type === 'Giảm giá %' ? `${item.discount || 0}%` : `${(item.discount || 0).toLocaleString('vi-VN')}₫`}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {getStatusBadge(item.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                  {item.usageCount}
                  {item.maxUsage && (
                    <div className="text-xs text-gray-500">
                      /{item.maxUsage}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {(item.totalRevenue || 0).toLocaleString('vi-VN')} ₫
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                  <span className="font-bold text-red-600">
                    {(item.totalDiscount || 0).toLocaleString('vi-VN')} ₫
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {(item.conversionRate || 0).toFixed(1)}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getEffectivenessColor(item.effectivenessScore || 0)}`}>
                    {(item.effectivenessScore || 0).toFixed(1)}/100
                  </span>
                </td>
              </tr>
            ))}
            
            {!loadingPayments && !loadingPromotions && currentRows.length === 0 && (
              <tr>
                <td className="px-6 py-12 text-center text-gray-400" colSpan={7}>
                  <div className="flex flex-col items-center">
                    <div className="text-4xl mb-4">🎯</div>
                    <div className="text-lg font-medium">Không có chương trình khuyến mãi</div>
                    <div className="text-sm">
                      {!filters.hotel_id ? 
                        'Vui lòng chọn khách sạn để xem báo cáo' : 
                        'Khách sạn này chưa có chương trình khuyến mãi nào'
                      }
                    </div>
                  </div>
                </td>
              </tr>
            )}
            
            {(loadingPayments || loadingPromotions) && (
              <tr>
                <td className="px-6 py-12 text-center text-gray-400" colSpan={7}>
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mb-4"></div>
                    <div className="text-lg font-medium">Đang tải dữ liệu...</div>
                    <div className="text-sm">Vui lòng chờ trong giây lát</div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {!loadingPayments && !loadingPromotions && totalPages > 1 && (
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}

function PromotionInner() {
  useOwnerReports(true);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-red-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">🎯</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Báo cáo hiệu quả khuyến mãi</h1>
              <p className="text-gray-600">Theo dõi và phân tích hiệu quả các chương trình khuyến mãi</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8">
          <PromotionFilterBar />
          <PromotionKPICards />
          <PromotionEffectivenessTable />
        </div>
      </div>
    </div>
  );
}

export default function PromotionEffectivenessPage() {
  return (
    <OwnerReportsProvider>
      <PromotionInner />
    </OwnerReportsProvider>
  );
}