// src/pages/hotel_owner/reviews/ReviewsPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Star, StarHalf, Search, Filter, ChevronLeft, ChevronRight, X, Calendar, Image as ImageIcon } from 'lucide-react';
import ActionButton from '../../../components/common/ActionButton';

import useHotel from '../../../hooks/useHotel';
import useReview from '../../../hooks/useReview';
import useReviewImage from '../../../hooks/useReviewImage';
import useAuth from '../../../hooks/useAuth';
import { USER_ROLES } from '../../../config/roles';
import { staffApiService } from '../../../api/staff.service';
import { hotelApiService } from '../../../api/hotel.service';

const ReviewsPage = () => {
  const { approvedHotels: hotels, loading: hotelsLoading, fetchApprovedHotels } = useHotel();
  const { reviews, loading: reviewsLoading, fetchPagedByHotelId } = useReview();
  const { images, fetchImagesByReviewId, clearImages } = useReviewImage();
  const { user } = useAuth();

  const [selectedHotel, setSelectedHotel] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingStaffInfo, setLoadingStaffInfo] = useState(false);
  
  // Filter states
  const [filterRating, setFilterRating] = useState(null); // null = all, 1-5 = specific rating
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);

  // Load danh sách khách sạn của owner hoặc load staff info cho hotel_staff
  useEffect(() => {
    const loadData = async () => {
      // Nếu là HOTEL_STAFF, load thông tin staff trước để lấy hotel_id
      if (user?.roleId === USER_ROLES.HOTEL_STAFF && user?.userId) {
        try {
          setLoadingStaffInfo(true);
          const response = await staffApiService.getStaffByUserId(user.userId);

          if (response?.data && Array.isArray(response.data) && response.data.length > 0) {
            const staff = response.data[0];
            if (staff.hotelId) {
              // Cố gắng fetch full hotel details từ API
              try {
                const hotelRes = await hotelApiService.getHotelById(staff.hotelId);
                // hotelApiService may return { data: { ... } } or the object directly
                const hotelObj = hotelRes?.data || hotelRes;
                setSelectedHotel({
                  hotelId: staff.hotelId,
                  hotelName: hotelObj?.name || hotelObj?.hotelName || hotelObj?.hotel_name || 'Khách sạn',
                  address: hotelObj?.address || hotelObj?.location || '',
                  averageRating: Number(hotelObj?.averageRating || hotelObj?.average_rating || 0),
                  totalReviews: hotelObj?.totalReviews || hotelObj?.total_reviews || 0
                });
              } catch (hErr) {
                // Nếu fetch chi tiết khách sạn thất bại, vẫn set hotelId để load reviews
                console.error('Error fetching hotel details for staff:', hErr);
                setSelectedHotel({ hotelId: staff.hotelId, hotelName: 'Khách sạn', address: '', averageRating: 0, totalReviews: 0 });
              }
            }
          }
        } catch (error) {
          console.error('Error loading staff hotel info:', error);
        } finally {
          setLoadingStaffInfo(false);
        }
      } else {
        // Nếu là HOTEL_OWNER, load danh sách khách sạn
        fetchApprovedHotels();
      }
    };

    loadData();
  }, [user?.roleId, user?.userId, fetchApprovedHotels]);

  // Load reviews khi chọn khách sạn hoặc thay đổi pagination
  useEffect(() => {
    if (selectedHotel) {
      fetchPagedByHotelId(selectedHotel.hotelId, currentPage, itemsPerPage);
    }
  }, [selectedHotel, currentPage, itemsPerPage, fetchPagedByHotelId]);

  // Handle chọn khách sạn
  const handleHotelSelect = (e) => {
    const hotelId = e.target.value;
    const hotel = hotels.find(h => h.hotelId === hotelId);
    setSelectedHotel(hotel);
    setCurrentPage(1); // Reset về trang 1 khi chọn khách sạn mới
  };

  // Render stars
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} className="w-5 h-5 fill-yellow-400 text-yellow-400" />);
    }
    if (hasHalfStar) {
      stars.push(<StarHalf key="half" className="w-5 h-5 fill-yellow-400 text-yellow-400" />);
    }
    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-5 h-5 text-gray-300" />);
    }
    return stars;
  };

  // Filter reviews by search term
  const filteredReviews = reviews.filter(review => 
    review.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Thống kê theo số sao
  const ratingStats = useMemo(() => {
    if (!reviews || reviews.length === 0) {
      return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    }
    
    const stats = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      const rating = Math.round(review.rating);
      if (rating >= 1 && rating <= 5) {
        stats[rating]++;
      }
    });
    return stats;
  }, [reviews]);

  // Apply filters (rating + date range)
  const filteredAndDateFilteredReviews = useMemo(() => {
    let filtered = [...filteredReviews];

    // Filter by rating
    if (filterRating !== null) {
      filtered = filtered.filter(review => Math.round(review.rating) === filterRating);
    }

    // Filter by date range
    if (startDate) {
      filtered = filtered.filter(review => new Date(review.createdAt) >= new Date(startDate));
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include full end date
      filtered = filtered.filter(review => new Date(review.createdAt) <= end);
    }

    return filtered;
  }, [filteredReviews, filterRating, startDate, endDate]);

  // Handle view detail
  const handleViewDetail = async (review) => {
    setSelectedReview(review);
    setShowDetailModal(true);
    // Fetch images for this review
    await fetchImagesByReviewId(review.reviewId);
  };

  // Handle close modal
  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedReview(null);
    clearImages();
  };

  // Reset filters
  const resetFilters = () => {
    setFilterRating(null);
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
  };

  // Pagination
  const totalPages = Math.ceil(filteredAndDateFilteredReviews.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentReviews = filteredAndDateFilteredReviews.slice(startIndex, endIndex);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý đánh giá</h1>
        <p className="text-gray-600">Xem và quản lý các đánh giá từ khách hàng</p>
      </div>

      {/* Hotel Selection - Hide for staff if auto-loaded */}
      {(user?.roleId !== USER_ROLES.HOTEL_STAFF || !selectedHotel) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chọn khách sạn
          </label>
          <select
            value={selectedHotel?.hotelId || ''}
            onChange={handleHotelSelect}
            className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={hotelsLoading || loadingStaffInfo}
          >
            <option value="">-- Chọn khách sạn --</option>
            {hotels.map(hotel => (
              <option key={hotel.hotelId || hotel.hotel_id} value={hotel.hotelId || hotel.hotel_id}>
                {hotel.name || hotel.hotelName || hotel.hotel_name}
              </option>
            ))}
          </select>
          {loadingStaffInfo && (
            <p className="mt-2 text-sm text-gray-500">Đang tải thông tin khách sạn...</p>
          )}
        </div>
      )}

      {/* Hotel Info & Statistics */}
      {selectedHotel && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedHotel.hotelName}</h2>
              <p className="text-gray-600">{selectedHotel.address}</p>
            </div>
            <div className="mt-4 md:mt-0 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                {renderStars(selectedHotel.averageRating || 0)}
              </div>
              <div className="text-3xl font-bold text-blue-600">
                {Number(selectedHotel.averageRating || 0).toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">
                {selectedHotel.totalReviews || reviews.length} đánh giá
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rating Statistics */}
      {selectedHotel && reviews.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Thống kê đánh giá theo số sao</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = ratingStats[rating] || 0;
              const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
              
              return (
                <div 
                  key={rating}
                  onClick={() => setFilterRating(filterRating === rating ? null : rating)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    filterRating === rating 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                      <span className="text-2xl font-bold text-gray-900">{rating}</span>
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    </div>
                    <span className="text-sm font-semibold text-gray-600">{count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 text-right">{percentage.toFixed(1)}%</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Panel */}
      {selectedHotel && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Bộ lọc
            </h3>
            <button
              onClick={resetFilters}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Xóa bộ lọc
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Rating Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lọc theo số sao
              </label>
              <select
                value={filterRating || ''}
                onChange={(e) => setFilterRating(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tất cả</option>
                <option value="5">5 sao</option>
                <option value="4">4 sao</option>
                <option value="3">3 sao</option>
                <option value="2">2 sao</option>
                <option value="1">1 sao</option>
              </select>
            </div>

            {/* Start Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Từ ngày
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* End Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Đến ngày
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {(filterRating || startDate || endDate) && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-gray-600">Đang lọc:</span>
                {filterRating && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                    {filterRating} sao
                    <button onClick={() => setFilterRating(null)} className="hover:text-blue-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {startDate && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                    Từ: {new Date(startDate).toLocaleDateString('vi-VN')}
                    <button onClick={() => setStartDate('')} className="hover:text-blue-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {endDate && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                    Đến: {new Date(endDate).toLocaleDateString('vi-VN')}
                    <button onClick={() => setEndDate('')} className="hover:text-blue-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reviews Table */}
      {selectedHotel && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Search & Filter Bar */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên người dùng hoặc nội dung..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Hiển thị:</label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          {reviewsLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Đang tải đánh giá...</p>
            </div>
          ) : currentReviews.length === 0 ? (
            <div className="p-8 text-center">
              <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Chưa có đánh giá nào</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Người dùng
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Đánh giá
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nội dung
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngày tạo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentReviews.map((review) => (
                      <tr key={review.reviewId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold">
                                {review.username?.charAt(0).toUpperCase() || 'U'}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {review.username || 'Người dùng'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {renderStars(review.rating)}
                            </div>
                            <span className="text-sm font-semibold text-gray-900">
                              {review.rating.toFixed(1)}
                            </span>
                          </div>
                          {/* Sub ratings */}
                          <div className="mt-2 text-xs text-gray-600 space-y-1">
                            {review.cleanlinessRating && (
                              <div>Sạch sẽ: {review.cleanlinessRating}/5</div>
                            )}
                            {review.comfortRating && (
                              <div>Tiện nghi: {review.comfortRating}/5</div>
                            )}
                            {review.serviceRating && (
                              <div>Dịch vụ: {review.serviceRating}/5</div>
                            )}
                            {review.locationRating && (
                              <div>Vị trí: {review.locationRating}/5</div>
                            )}
                            {review.valueRating && (
                              <div>Giá trị: {review.valueRating}/5</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-md">
                            {review.comment || <span className="text-gray-400 italic">Không có bình luận</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString('vi-VN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <ActionButton
                            type="view"
                            onClick={() => handleViewDetail(review)}
                            title="Xem chi tiết"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="text-sm text-gray-700">
                    Hiển thị <span className="font-medium">{startIndex + 1}</span> đến{' '}
                    <span className="font-medium">{Math.min(endIndex, filteredAndDateFilteredReviews.length)}</span> trong tổng số{' '}
                    <span className="font-medium">{filteredAndDateFilteredReviews.length}</span> đánh giá
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => goToPage(pageNum)}
                            className={`px-4 py-2 border rounded-lg transition-colors ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'border-gray-300 hover:bg-gray-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Review Detail Modal */}
      {showDetailModal && selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Chi tiết đánh giá</h3>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* User Info */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-shrink-0 h-16 w-16 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-2xl font-semibold">
                    {selectedReview.username?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    {selectedReview.username || 'Người dùng'}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {new Date(selectedReview.createdAt).toLocaleDateString('vi-VN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              {/* Rating */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex">
                    {renderStars(selectedReview.rating)}
                  </div>
                  <span className="text-2xl font-bold text-gray-900">
                    {selectedReview.rating.toFixed(1)}
                  </span>
                </div>

                {/* Sub Ratings */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {selectedReview.cleanlinessRating && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-600 mb-1">Sạch sẽ</div>
                      <div className="text-lg font-bold text-blue-600">
                        {selectedReview.cleanlinessRating}/5
                      </div>
                    </div>
                  )}
                  {selectedReview.comfortRating && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-600 mb-1">Tiện nghi</div>
                      <div className="text-lg font-bold text-blue-600">
                        {selectedReview.comfortRating}/5
                      </div>
                    </div>
                  )}
                  {selectedReview.serviceRating && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-600 mb-1">Dịch vụ</div>
                      <div className="text-lg font-bold text-blue-600">
                        {selectedReview.serviceRating}/5
                      </div>
                    </div>
                  )}
                  {selectedReview.locationRating && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-600 mb-1">Vị trí</div>
                      <div className="text-lg font-bold text-blue-600">
                        {selectedReview.locationRating}/5
                      </div>
                    </div>
                  )}
                  {selectedReview.valueRating && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-600 mb-1">Giá trị</div>
                      <div className="text-lg font-bold text-blue-600">
                        {selectedReview.valueRating}/5
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Comment */}
              <div className="mb-6">
                <h5 className="text-sm font-semibold text-gray-700 mb-2">Nhận xét</h5>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {selectedReview.comment || <span className="text-gray-400 italic">Không có nhận xét</span>}
                  </p>
                </div>
              </div>

              {/* Images */}
              <div>
                <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Hình ảnh ({images.length})
                </h5>
                {images.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Không có hình ảnh</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {images.map((image) => (
                      <div
                        key={image.imageId}
                        className="aspect-square rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow"
                      >
                        <img
                          src={image.imageUrl}
                          alt="Review"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/300?text=Image+Not+Found';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
              <button
                onClick={handleCloseModal}
                className="w-full md:w-auto px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewsPage;