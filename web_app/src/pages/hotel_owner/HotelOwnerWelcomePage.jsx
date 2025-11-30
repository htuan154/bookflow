// src/pages/hotel-owner/HotelOwnerWelcomePage.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { USER_ROLES } from '../../config/roles';
import { hotelApiService } from '../../api/hotel.service';
import ReportsOwnerService from '../../api/reports.owner.service';

const safeNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const monthStartISO = () => {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
};

const normalizeHotelList = (payload) => {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.hotels)) return payload.hotels;
  if (Array.isArray(payload)) return payload;
  return [];
};

const extractDateOnly = (row) => {
  const raw = row?.bizDateVn || row?.biz_date_vn || row?.bizDate || row?.paidAt || row?.createdAt;
  if (!raw) return '';
  return String(raw).slice(0, 10);
};

const formatCurrency = (value) =>
  safeNumber(value).toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  });

const HotelOwnerWelcomePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [overviewStats, setOverviewStats] = useState({
    loading: true,
    todayBookings: 0,
    monthlyRevenue: 0,
    averageRating: 0,
    error: null,
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Hàm để lấy tên role từ roleId
  const getRoleName = (roleId) => {
    switch (roleId) {
      case USER_ROLES.ADMIN:
        return 'Admin';
      case USER_ROLES.HOTEL_OWNER:
        return 'Chủ khách sạn';
      case USER_ROLES.USER:
        return 'Người dùng';
      default:
        return 'Không xác định';
    }
  };

  useEffect(() => {
    const fetchOverviewStats = async () => {
      setOverviewStats((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const dateFrom = monthStartISO();
        const dateTo = todayISO();

        const [hotelsResponse, paymentsResponse] = await Promise.all([
          hotelApiService.getHotelsForOwner(),
          ReportsOwnerService.getPayments({ date_from: dateFrom, date_to: dateTo }),
        ]);

        const hotels = normalizeHotelList(hotelsResponse);
        const paymentRows = Array.isArray(paymentsResponse?.data)
          ? paymentsResponse.data
          : paymentsResponse?.rows ?? [];

        const todayBookings = paymentRows.filter((row) => extractDateOnly(row) === dateTo).length;
        const monthlyRevenue = paymentRows.reduce(
          (sum, row) => sum + safeNumber(row?.hotelNetAmount ?? row?.finalAmount),
          0
        );

        const ratingAggregate = hotels.reduce(
          (acc, hotel) => {
            const average = safeNumber(hotel?.averageRating ?? hotel?.average_rating);
            const count = safeNumber(hotel?.totalReviews ?? hotel?.total_reviews);
            if (count > 0) {
              acc.totalScore += average * count;
              acc.totalReviews += count;
            }
            return acc;
          },
          { totalScore: 0, totalReviews: 0 }
        );

        const averageRating = ratingAggregate.totalReviews
          ? ratingAggregate.totalScore / ratingAggregate.totalReviews
          : 0;

        setOverviewStats({
          loading: false,
          todayBookings,
          monthlyRevenue,
          averageRating,
          error: null,
        });
      } catch (error) {
        setOverviewStats((prev) => ({
          ...prev,
          loading: false,
          error:
            error?.response?.data?.message ||
            error?.message ||
            'Không thể tải thống kê nhanh. Vui lòng thử lại.',
        }));
      }
    };

    fetchOverviewStats();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mb-6 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Chào mừng Chủ khách sạn!
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Bạn đã đăng nhập thành công vào hệ thống quản lý khách sạn. Hãy bắt đầu quản lý khách sạn của bạn một cách hiệu quả!
          </p>
        </div>

        {/* Profile Card */}
        {user && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-8">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Thông tin tài khoản</h2>
                  <p className="text-blue-100">Chi tiết profile chủ khách sạn</p>
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-8">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Họ tên */}
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Họ và tên</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {user.fullName || user.name || 'Chưa cập nhật'}
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Email</p>
                    <p className="text-lg font-semibold text-gray-900">{user.email}</p>
                  </div>
                </div>

                {/* Vai trò */}
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Vai trò</p>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                      {user.roleId ? getRoleName(user.roleId) : 'Chưa xác định'}
                    </span>
                  </div>
                </div>

                {/* Số điện thoại */}
                {user.phone && (
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Số điện thoại</p>
                      <p className="text-lg font-semibold text-gray-900">{user.phone}</p>
                    </div>
                  </div>
                )}

                {/* Trạng thái */}
                {user.status && (
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Trạng thái</p>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        {user.status}
                      </span>
                    </div>
                  </div>
                )}

                {/* Ngày tạo */}
                {user.createdAt && (
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Ngày tạo tài khoản</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {new Date(user.createdAt).toLocaleDateString('vi-VN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats Cards */}
        {overviewStats.error && (
          <p className="text-center text-sm text-red-500 mb-3">{overviewStats.error}</p>
        )}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Booking hôm nay</p>
                <p className="text-2xl font-bold text-gray-900">
                  {overviewStats.loading
                    ? '...'
                    : overviewStats.todayBookings.toLocaleString('vi-VN')}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Doanh thu tháng</p>
                <p className="text-2xl font-bold text-gray-900">
                  {overviewStats.loading ? '...' : formatCurrency(overviewStats.monthlyRevenue)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Đánh giá trung bình</p>
                <p className="text-2xl font-bold text-gray-900">
                  {overviewStats.loading ? '...' : overviewStats.averageRating.toFixed(1)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleLogout}
            className="group relative px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-red-300"
          >
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Đăng xuất</span>
            </div>
          </button>
          
          <button
            onClick={() => navigate('/hotel-owner/dashboard')}
            className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300"
          >
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span>Vào trang quản lý khách sạn</span>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500">
          <p className="text-sm">
            © 2025 Hotel Management System. Được thiết kế với ❤️ để giúp bạn quản lý khách sạn hiệu quả.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HotelOwnerWelcomePage;
