// src/pages/admin/AdminDashboardPage.js - Fixed Version
import { useState, useEffect, useCallback, useMemo } from 'react';
import useAuth from '../../hooks/useAuth';
import { useHotel } from '../../hooks/useHotel';
import { useContract } from '../../hooks/useContract';
import useBlog from '../../hooks/useBlog';
import usePromotions  from '../../hooks/usePromotions';
import useAdminReports from '../../hooks/useAdminReports';

// Import providers
import { HotelProvider } from '../../context/HotelContext';
import { ContractProvider } from '../../context/ContractContext';
import { BlogProvider } from '../../context/BlogContext';
import { PromotionsProvider } from '../../context/PromotionsContext';
import { AdminReportsProvider } from '../../context/AdminReportsContext';

import { 
    Building, 
    Users,
    FileText, 
    ScrollText,
    Receipt,
    CheckCircle, 
    TrendingUp,
    Activity,
    AlertTriangle,
    DollarSign,
    Plus,
    BarChart3
} from 'lucide-react';

// Component StatCard
const StatCard = ({ icon, title, value, color, subtitle, trend, onClick }) => (
    <div 
        className={`bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
    >
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-600">{title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                {subtitle && (
                    <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
                )}
            </div>
            <div className={`${color} p-3 rounded-lg text-white`}>
                {icon}
            </div>
        </div>
        {trend && (
            <div className="mt-4 flex items-center">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">{trend}</span>
            </div>
        )}
    </div>
);

// Component Activity Item
const ActivityItem = ({ icon, title, description, time, status }) => (
    <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
        <div className={`p-2 rounded-full ${
            status === 'success' ? 'bg-green-100 text-green-600' :
            status === 'warning' ? 'bg-yellow-100 text-yellow-600' :
            status === 'error' ? 'bg-red-100 text-red-600' :
            'bg-blue-100 text-blue-600'
        }`}>
            {icon}
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">{title}</p>
            <p className="text-sm text-gray-500">{description}</p>
            <p className="text-xs text-gray-400 mt-1">{time}</p>
        </div>
    </div>
);

// Main Dashboard Component
const AdminDashboardContent = () => {
    const { user } = useAuth();
    const [dateRange, setDateRange] = useState('today');
    
    // Safe hook usage with error boundaries
    const hotelData = useHotel();
    const contractData = useContract();
    const blogData = useBlog();
    const promotionData = usePromotions({ autoFetch: true });
    const reportsData = useAdminReports(false); // Don't auto-fetch, we'll control it

    // Destructure safely with fallbacks
    const {
        getHotelStatistics,
        isLoading: hotelsLoading = false,
        hasError: hotelsError = false,
        refreshAllHotels = () => {}
    } = hotelData || {};
    
    const hotelStatistics = useMemo(() => 
        getHotelStatistics ? getHotelStatistics() : {}, 
        [getHotelStatistics]
    );
    
    const {
        stats: contractStats = {},
        loading: contractsLoading = false,
        error: contractsError = null,
        refreshContracts = () => {}
    } = contractData || {};

    const {
        statistics: blogStats = {},
        loading: blogsLoading = false,
        error: blogsError = null,
        fetchStatistics: refreshBlogStats = () => {}
    } = blogData || {};

    const {
        promotions = [],
        loading: promotionsLoading = false,
        error: promotionsError = null
    } = promotionData || {};

    // Admin Reports Data
    const {
        summary: reportsSummary = null,
        loading: reportsLoading = false,
        error: reportsError = null,
        fetchSummary: fetchReportsSummary = () => {}
    } = reportsData || {};

    // Recent activities state
    const [recentActivities, setRecentActivities] = useState([]);
    const [activitiesLoading, setActivitiesLoading] = useState(true);

    // Calculate revenue statistics from reports
    const [revenueStats, setRevenueStats] = useState({
        totalRevenue: 0,
        totalBookings: 0,
        totalCustomers: 0,
        averageBookingValue: 0
    });

    // Overall loading and error states
    const isLoading = hotelsLoading || contractsLoading || blogsLoading || promotionsLoading || activitiesLoading || reportsLoading;
    const hasError = hotelsError || contractsError || blogsError || promotionsError || reportsError;

    // Calculate date range for reports based on selected filter
    const getDateRange = useCallback(() => {
        const today = new Date();
        let fromDate = new Date();
        
        switch(dateRange) {
            case 'today':
                fromDate = new Date();
                break;
            case 'week':
                fromDate.setDate(today.getDate() - 7);
                break;
            case 'month':
                fromDate.setDate(today.getDate() - 30);
                break;
            case 'year':
                fromDate.setFullYear(today.getFullYear() - 1);
                break;
            default:
                fromDate.setDate(today.getDate() - 7);
        }
        
        return {
            date_from: fromDate.toISOString().slice(0, 10),
            date_to: today.toISOString().slice(0, 10)
        };
    }, [dateRange]);

    // Fetch all dashboard data
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setActivitiesLoading(true);
                
                // Safely call refresh functions
                const refreshPromises = [];
                if (refreshAllHotels) refreshPromises.push(refreshAllHotels());
                if (refreshContracts) refreshPromises.push(refreshContracts());
                if (refreshBlogStats) refreshPromises.push(refreshBlogStats());
                
                // Fetch reports data with date range
                if (fetchReportsSummary) {
                    const { date_from, date_to } = getDateRange();
                    refreshPromises.push(fetchReportsSummary({ date_from, date_to, hotel_filter: 'ALL' }));
                }

                if (refreshPromises.length > 0) {
                    await Promise.allSettled(refreshPromises);
                }
                
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setActivitiesLoading(false);
            }
        };

        fetchDashboardData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateRange]);

    // Calculate revenue statistics when reports data changes
    useEffect(() => {
        if (reportsSummary?.daily_summary?.length > 0) {
            const stats = reportsSummary.daily_summary.reduce((acc, row) => {
                // Sum up revenue and bookings
                acc.totalRevenue += parseFloat(row.final_revenue || 0);
                acc.totalBookings += parseInt(row.booking_count || 0);
                
                return acc;
            }, { totalRevenue: 0, totalBookings: 0 });

            // Calculate average booking value
            stats.averageBookingValue = stats.totalBookings > 0 
                ? stats.totalRevenue / stats.totalBookings 
                : 0;

            // Estimate unique customers (rough estimate)
            stats.totalCustomers = Math.ceil(stats.totalBookings * 0.8); // Assume 80% unique

            setRevenueStats(stats);
        }
    }, [reportsSummary]);

    // Generate recent activities from real data
    const generateRecentActivities = useCallback(() => {
        const activities = [];
        
        // Revenue activity (if there's significant revenue)
        if (revenueStats.totalRevenue > 0) {
            activities.push({
                icon: <DollarSign className="w-4 h-4" />,
                title: "Doanh thu hệ thống",
                description: `${new Intl.NumberFormat('vi-VN', { 
                    style: 'currency', 
                    currency: 'VND',
                    maximumFractionDigits: 0 
                }).format(revenueStats.totalRevenue)} từ ${revenueStats.totalBookings} đặt phòng`,
                time: dateRange === 'today' ? 'Hôm nay' : dateRange === 'week' ? '7 ngày' : dateRange === 'month' ? '30 ngày' : '1 năm',
                status: "success"
            });
        }
        
        // Hotels activities
        if (hotelStatistics?.pending > 0) {
            activities.push({
                icon: <Building className="w-4 h-4" />,
                title: "Khách sạn chờ duyệt",
                description: `${hotelStatistics.pending} khách sạn đang chờ phê duyệt`,
                time: "Hôm nay",
                status: "warning"
            });
        }

        // Contracts activities
        if (contractStats?.pending > 0) {
            activities.push({
                icon: <CheckCircle className="w-4 h-4" />,
                title: "Hợp đồng chờ duyệt",
                description: `${contractStats.pending} hợp đồng cần xử lý`,
                time: "Hôm nay",
                status: "warning"
            });
        }

        // Blog activities
        if (blogStats?.pending > 0) {
            activities.push({
                icon: <FileText className="w-4 h-4" />,
                title: "Bài viết chờ duyệt",
                description: `${blogStats.pending} bài viết cần kiểm duyệt`,
                time: "Hôm nay",
                status: "warning"
            });
        }

        // Recent approvals (only if no pending items)
        if (activities.length < 4 && contractStats?.approved > 0) {
            activities.push({
                icon: <CheckCircle className="w-4 h-4" />,
                title: "Hợp đồng đã duyệt",
                description: `${contractStats.approved} hợp đồng đã được phê duyệt`,
                time: "Tuần này",
                status: "success"
            });
        }

        // Add default activity if no data
        if (activities.length === 0) {
            activities.push({
                icon: <Activity className="w-4 h-4" />,
                title: "Hệ thống hoạt động bình thường",
                description: "Tất cả dịch vụ đang hoạt động ổn định",
                time: "Vừa xong",
                status: "success"
            });
        }

        setRecentActivities(activities.slice(0, 5));
    }, [revenueStats, hotelStatistics, contractStats, blogStats, dateRange]);

    // Regenerate activities when any stat changes
    useEffect(() => {
        if (!activitiesLoading) {
            generateRecentActivities();
        }
    }, [activitiesLoading, generateRecentActivities]);

    // Quick action handlers
    const handleCreateBlog = () => {
        console.log('Navigate to create blog');
    };

    const handleProcessContracts = () => {
        window.location.href = '/admin/contracts';
    };

    const handleCreatePromotion = () => {
        window.location.href = '/admin/promotions/create';
    };

    const handleViewReports = () => {
        console.log('Navigate to reports');
    };

    if (isLoading) {
        return (
            <div className="p-8 bg-gray-50 min-h-screen">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Dashboard Quản trị viên
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Chào mừng trở lại, {user?.fullName || 'Admin'}! 
                            Đây là tổng quan hệ thống của bạn.
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium">
                            Trạng thái: Online
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    icon={<DollarSign size={24} />}
                    title="Tổng doanh thu"
                    value={new Intl.NumberFormat('vi-VN', { 
                        style: 'currency', 
                        currency: 'VND',
                        maximumFractionDigits: 0 
                    }).format(revenueStats.totalRevenue)}
                    subtitle={`${revenueStats.totalBookings} đặt phòng`}
                    color="bg-green-500"
                    trend={revenueStats.totalBookings > 0 ? `TB: ${new Intl.NumberFormat('vi-VN', { 
                        style: 'currency', 
                        currency: 'VND',
                        maximumFractionDigits: 0 
                    }).format(revenueStats.averageBookingValue)}/booking` : null}
                />
                
                <StatCard
                    icon={<Building size={24} />}
                    title="Tổng khách sạn"
                    value={hotelStatistics?.approved || 0}
                    subtitle={`${hotelStatistics?.pending || 0} chờ duyệt`}
                    color="bg-blue-500"
                    trend={hotelStatistics?.approved > 0 ? `${hotelStatistics.approved} đã duyệt` : null}
                />
                
                <StatCard 
                    icon={<ScrollText size={24} />}
                    title="Hợp đồng"
                    value={contractStats?.total || 0}
                    subtitle={`${contractStats?.pending || 0} chờ xử lý`}
                    color="bg-orange-500"
                    trend={contractStats?.approved > 0 ? `${contractStats.approved} đã duyệt` : null}
                />
                
                <StatCard 
                    icon={<FileText size={24} />}
                    title="Bài viết & KM"
                    value={blogStats?.total || 0}
                    subtitle={`${promotions?.length || 0} khuyến mãi`}
                    color="bg-purple-500"
                    trend={blogStats?.published > 0 ? `${blogStats.published} đã xuất bản` : null}
                />
            </div>

            {/* Action Cards Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div 
                    className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={handleCreateBlog}
                >
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Plus className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">Tạo bài viết</p>
                            <p className="text-sm text-gray-500">Viết nội dung mới</p>
                        </div>
                    </div>
                </div>
                
                <div 
                    className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={handleProcessContracts}
                >
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-green-500" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">Duyệt hợp đồng</p>
                            <p className="text-sm text-gray-500">{contractStats?.pending || 0} chờ xử lý</p>
                        </div>
                    </div>
                </div>
                
                <div 
                    className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={handleCreatePromotion}
                >
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <ScrollText className="w-6 h-6 text-yellow-500" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">Tạo khuyến mãi</p>
                            <p className="text-sm text-gray-500">Chương trình ưu đãi</p>
                        </div>
                    </div>
                </div>
                
                <div 
                    className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={handleViewReports}
                >
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <BarChart3 className="w-6 h-6 text-purple-500" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">Xem báo cáo</p>
                            <p className="text-sm text-gray-500">Thống kê chi tiết</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* System Overview */}
                <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Tổng quan hệ thống
                        </h3>
                        <div className="flex items-center space-x-2">
                            <select 
                                value={dateRange} 
                                onChange={(e) => setDateRange(e.target.value)}
                                className="text-sm border border-gray-300 rounded px-2 py-1"
                            >
                                <option value="today">Hôm nay</option>
                                <option value="week">7 ngày</option>
                                <option value="month">30 ngày</option>
                                <option value="year">1 năm</option>
                            </select>
                        </div>
                    </div>
                    
                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                            <DollarSign className="w-8 h-8 mx-auto text-green-500 mb-2" />
                            <div className="text-xl font-bold text-green-600">
                                {(revenueStats.totalRevenue / 1000000).toFixed(1)}M
                            </div>
                            <div className="text-sm text-gray-600">Doanh thu</div>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <Receipt className="w-8 h-8 mx-auto text-blue-500 mb-2" />
                            <div className="text-2xl font-bold text-blue-600">{revenueStats.totalBookings}</div>
                            <div className="text-sm text-gray-600">Đặt phòng</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <Users className="w-8 h-8 mx-auto text-purple-500 mb-2" />
                            <div className="text-2xl font-bold text-purple-600">{revenueStats.totalCustomers}</div>
                            <div className="text-sm text-gray-600">Khách hàng</div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                            <Building className="w-8 h-8 mx-auto text-orange-500 mb-2" />
                            <div className="text-2xl font-bold text-orange-600">{hotelStatistics?.approved || 0}</div>
                            <div className="text-sm text-gray-600">Khách sạn</div>
                        </div>
                    </div>

                    {/* Status Summary */}
                    <div className="border-t pt-4">
                        <h4 className="font-medium text-gray-900 mb-3">Trạng thái cần xử lý</h4>
                        <div className="space-y-2">
                            {(reportsSummary?.payout_proposals?.length > 0) && (
                                <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                                    <span className="text-sm text-gray-700">Đề xuất thanh toán</span>
                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                        {reportsSummary.payout_proposals.length}
                                    </span>
                                </div>
                            )}
                            {(hotelStatistics?.pending > 0) && (
                                <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                                    <span className="text-sm text-gray-700">Khách sạn chờ duyệt</span>
                                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                                        {hotelStatistics.pending}
                                    </span>
                                </div>
                            )}
                            {(contractStats?.pending > 0) && (
                                <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                                    <span className="text-sm text-gray-700">Hợp đồng chờ duyệt</span>
                                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                                        {contractStats.pending}
                                    </span>
                                </div>
                            )}
                            {(blogStats?.pending > 0) && (
                                <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                                    <span className="text-sm text-gray-700">Bài viết chờ duyệt</span>
                                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                                        {blogStats.pending}
                                    </span>
                                </div>
                            )}
                            {(!reportsSummary?.payout_proposals?.length && !hotelStatistics?.pending && !contractStats?.pending && !blogStats?.pending) && (
                                <div className="text-center py-4 text-gray-500">
                                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                                    <p>Tất cả đã được xử lý</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Activities */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Hoạt động gần đây
                        </h3>
                        <button className="text-sm text-blue-600 hover:text-blue-800">
                            Xem tất cả
                        </button>
                    </div>
                    
                    <div className="space-y-1">
                        {recentActivities.length > 0 ? (
                            recentActivities.map((activity, index) => (
                                <ActivityItem
                                    key={index}
                                    icon={activity.icon}
                                    title={activity.title}
                                    description={activity.description}
                                    time={activity.time}
                                    status={activity.status}
                                />
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <Activity className="w-8 h-8 mx-auto mb-2" />
                                <p>Không có hoạt động gần đây</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Error Display */}
            {hasError && (
                <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    <div className="flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        <span>Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại sau.</span>
                    </div>
                </div>
            )}
        </div>
    );
};

// 🔧 FIXED: Main Component với Provider Wrapper
const AdminDashboardPage = () => {
    return (
        <AdminReportsProvider>
            <HotelProvider>
                <ContractProvider>
                    <BlogProvider>
                        <PromotionsProvider>
                            <AdminDashboardContent />
                        </PromotionsProvider>
                    </BlogProvider>
                </ContractProvider>
            </HotelProvider>
        </AdminReportsProvider>
    );
};

export default AdminDashboardPage;