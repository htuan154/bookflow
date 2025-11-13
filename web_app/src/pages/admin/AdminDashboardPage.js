// src/pages/admin/AdminDashboardPage.js - Fixed Version with Charts
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

// Import chart components
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

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

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                <p className="font-medium text-gray-900 mb-2">{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} className="text-sm" style={{ color: entry.color }}>
                        {entry.name}: <span className="font-semibold">{entry.value}</span>
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

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
    const [dateRange, setDateRange] = useState('month'); // Changed from 'today' to 'month' for better data visibility
    
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
                
                // Fetch contracts first
                if (refreshContracts) {
                    console.log('🔄 Fetching contracts...');
                    refreshPromises.push(refreshContracts().catch(err => {
                        console.error('❌ Error fetching contracts:', err);
                        return null;
                    }));
                }
                
                // Fetch blog stats
                if (refreshBlogStats) {
                    console.log('🔄 Fetching blog stats...');
                    refreshPromises.push(refreshBlogStats().catch(err => {
                        console.error('❌ Error fetching blog stats:', err);
                        return null;
                    }));
                }
                
                // Fetch hotels - but skip pending-rejected to avoid 404
                if (refreshAllHotels) {
                    console.log('🔄 Fetching hotels...');
                    refreshPromises.push(refreshAllHotels().catch(err => {
                        console.error('❌ Error fetching hotels:', err);
                        return null;
                    }));
                }
                
                // Fetch reports data with date range
                if (fetchReportsSummary) {
                    const { date_from, date_to } = getDateRange();
                    console.log('🔄 Fetching reports summary...');
                    console.log('📅 Date Range:', { date_from, date_to });
                    console.log('🏨 Hotel Filter: ALL');
                    
                    refreshPromises.push(
                        fetchReportsSummary({ date_from, date_to, hotel_filter: 'ALL' })
                            .then(result => {
                                console.log('✅ Reports fetch completed');
                                console.log('📊 Summary Result:', result);
                                return result;
                            })
                            .catch(err => {
                                console.error('❌ Error fetching reports:', err);
                                console.error('Error details:', {
                                    message: err.message,
                                    response: err.response?.data,
                                    status: err.response?.status
                                });
                                return null;
                            })
                    );
                }

                if (refreshPromises.length > 0) {
                    await Promise.allSettled(refreshPromises);
                }
                
                console.log('✅ Dashboard data fetch completed');
                
            } catch (error) {
                console.error('❌ Error fetching dashboard data:', error);
            } finally {
                setActivitiesLoading(false);
            }
        };

        fetchDashboardData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateRange]);

    // Calculate revenue statistics when reports data changes
    useEffect(() => {
        console.log('💰 Calculating revenue stats from reportsSummary:', reportsSummary);
        
        if (reportsSummary?.daily_summary?.length > 0) {
            console.log('📊 Processing', reportsSummary.daily_summary.length, 'daily summary records');
            console.log('📊 First record sample:', reportsSummary.daily_summary[0]);
            
            const stats = reportsSummary.daily_summary.reduce((acc, row) => {
                // Use adminFeeSum (Phí quản lý) as the main revenue metric for admin dashboard
                const adminFee = parseFloat(row.adminFeeSum || 0);
                
                // Also calculate other metrics for reference
                const grossRevenue = parseFloat(row.grossSum || 0);
                const pgFee = parseFloat(row.pgFeeSum || 0);
                const hotelNet = parseFloat(row.hotelNetSum || 0);
                
                const bookings = parseInt(
                    row.bookingsCount ||      // Reports page uses this
                    row.booking_count ||      // snake_case variant
                    row.bookingCount ||       // camelCase variant
                    0
                );
                
                console.log('Row:', { 
                    date: row.bizDateVn || row.date, 
                    hotel: row.hotelName || row.hotel_name,
                    adminFee,
                    grossRevenue,
                    pgFee,
                    hotelNet,
                    bookings,
                    rawRow: row  // Log full row for debugging
                });
                
                acc.totalRevenue += adminFee;  // Use admin fee as main revenue
                acc.totalBookings += bookings;
                acc.grossRevenue += grossRevenue;
                acc.pgFee += pgFee;
                acc.hotelNet += hotelNet;
                
                return acc;
            }, { totalRevenue: 0, totalBookings: 0, grossRevenue: 0, pgFee: 0, hotelNet: 0 });

            // Calculate average booking value
            stats.averageBookingValue = stats.totalBookings > 0 
                ? stats.totalRevenue / stats.totalBookings 
                : 0;

            // Estimate unique customers (rough estimate)
            stats.totalCustomers = Math.ceil(stats.totalBookings * 0.8); // Assume 80% unique

            console.log('✅ Final Revenue Stats:', stats);
            setRevenueStats(stats);
        } else {
            console.log('⚠️ No daily_summary data to process');
            console.log('Full reportsSummary:', reportsSummary);
            
            // Reset stats to zero
            setRevenueStats({
                totalRevenue: 0,
                totalBookings: 0,
                totalCustomers: 0,
                averageBookingValue: 0
            });
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
        window.location.href = '/admin/reports';
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
                    title="Phí quản lý"
                    value={new Intl.NumberFormat('vi-VN', { 
                        style: 'currency', 
                        currency: 'VND',
                        maximumFractionDigits: 0 
                    }).format(revenueStats.totalRevenue)}
                    subtitle={`${revenueStats.totalBookings} đặt phòng`}
                    color="bg-purple-500"
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

            {/* Time Range Selector */}
            <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-700">Khoảng thời gian thống kê</h3>
                        <p className="text-xs text-gray-500 mt-1">
                            {(() => {
                                const { date_from, date_to } = getDateRange();
                                return `Từ ${date_from} đến ${date_to}`;
                            })()}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {reportsLoading && (
                            <div className="flex items-center text-blue-600 text-sm">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                                Đang tải...
                            </div>
                        )}
                        <select 
                            value={dateRange} 
                            onChange={(e) => setDateRange(e.target.value)}
                            className="text-sm border border-gray-300 rounded px-4 py-2 bg-white font-medium hover:border-blue-500 transition-colors"
                        >
                            <option value="today">Hôm nay</option>
                            <option value="week">7 ngày qua</option>
                            <option value="month">30 ngày qua</option>
                            <option value="year">1 năm qua</option>
                        </select>
                    </div>
                </div>
                
                {/* Data Summary Info */}
                {reportsSummary?.daily_summary && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">
                                📊 Đã tải: <span className="font-semibold">{reportsSummary.daily_summary.length}</span> bản ghi dữ liệu
                            </span>
                            {reportsSummary.daily_summary.length === 0 && (
                                <span className="text-amber-600 font-medium">
                                    ⚠️ Không có dữ liệu trong khoảng thời gian này
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Admin Fee Revenue Chart Section */}
            {reportsSummary?.daily_summary?.length > 0 ? (
                <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                Biểu đồ phí quản lý theo ngày
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Thống kê {reportsSummary.daily_summary.length} bản ghi dữ liệu
                            </p>
                        </div>
                    </div>
                    
                    {/* Line Chart for Admin Fee Revenue */}
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart
                            data={reportsSummary.daily_summary.map(item => ({
                                date: item.bizDateVn || item.date,
                                adminFee: parseFloat(item.adminFeeSum || 0) / 1000000, // Admin fee in millions
                                grossRevenue: parseFloat(item.grossSum || 0) / 1000000, // Gross revenue in millions
                                bookings: parseInt(
                                    item.bookingsCount ||   // From Reports API
                                    item.booking_count ||   // Fallback
                                    item.bookingCount ||
                                    0
                                ),
                                hotel: item.hotelName || item.hotel_name || 'N/A'
                            }))}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                                dataKey="date" 
                                tick={{ fontSize: 12 }}
                                angle={-45}
                                textAnchor="end"
                                height={80}
                            />
                            <YAxis 
                                tick={{ fontSize: 12 }}
                                label={{ value: 'Triệu VNĐ', angle: -90, position: 'insideLeft' }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Line 
                                type="monotone" 
                                dataKey="adminFee" 
                                stroke="#8b5cf6" 
                                strokeWidth={2}
                                name="Phí quản lý (triệu)" 
                                dot={{ fill: '#10b981' }}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="bookings" 
                                stroke="#3b82f6" 
                                strokeWidth={2}
                                name="Số booking" 
                                dot={{ fill: '#3b82f6' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="mb-8 bg-white rounded-lg shadow-sm border border-yellow-200 bg-yellow-50 p-6">
                    <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-100 mb-4">
                            <BarChart3 className="w-10 h-10 text-yellow-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            📊 Chưa có dữ liệu doanh thu
                        </h3>
                        <p className="text-sm text-gray-700 mb-4 max-w-md mx-auto">
                            Không tìm thấy dữ liệu booking hoặc doanh thu trong khoảng thời gian <strong>{dateRange === 'today' ? 'hôm nay' : dateRange === 'week' ? '7 ngày qua' : dateRange === 'month' ? '30 ngày qua' : '1 năm qua'}</strong>
                        </p>
                        <div className="flex flex-col gap-2 items-center">
                            <p className="text-xs text-gray-600">
                                💡 Gợi ý:
                            </p>
                            <ul className="text-xs text-gray-600 text-left space-y-1">
                                <li>• Thử chọn khoảng thời gian khác (vd: 30 ngày hoặc 1 năm)</li>
                                <li>• Kiểm tra xem có booking nào trong hệ thống chưa</li>
                                <li>• Đảm bảo các booking đã được thanh toán</li>
                            </ul>
                        </div>
                        <div className="mt-6 flex gap-3 justify-center">
                            <button
                                onClick={() => setDateRange('year')}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                                Xem 1 năm qua
                            </button>
                            <button
                                onClick={() => window.location.href = '/admin/contracts'}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                            >
                                Quản lý hợp đồng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* System Overview */}
                <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Tổng quan hệ thống
                        </h3>
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

            {/* Additional Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* Hotel Status Distribution Chart */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Phân bổ trạng thái khách sạn
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={[
                                    { name: 'Đã duyệt', value: hotelStatistics?.approved || 0, color: '#10b981' },
                                    { name: 'Chờ duyệt', value: hotelStatistics?.pending || 0, color: '#f59e0b' },
                                    { name: 'Từ chối', value: hotelStatistics?.rejected || 0, color: '#ef4444' },
                                ].filter(item => item.value > 0)}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {[
                                    { name: 'Đã duyệt', value: hotelStatistics?.approved || 0, color: '#10b981' },
                                    { name: 'Chờ duyệt', value: hotelStatistics?.pending || 0, color: '#f59e0b' },
                                    { name: 'Từ chối', value: hotelStatistics?.rejected || 0, color: '#ef4444' },
                                ].filter(item => item.value > 0).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Contract Status Distribution Chart */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Phân bổ trạng thái hợp đồng
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart
                            data={[
                                { status: 'Đã duyệt', count: contractStats?.approved || 0, color: '#10b981' },
                                { status: 'Chờ xử lý', count: contractStats?.pending || 0, color: '#f59e0b' },
                                { status: 'Từ chối', count: contractStats?.rejected || 0, color: '#ef4444' },
                                { status: 'Hết hạn', count: contractStats?.expired || 0, color: '#6b7280' },
                            ]}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="status" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="count" name="Số lượng">
                                {[
                                    { status: 'Đã duyệt', count: contractStats?.approved || 0, color: '#10b981' },
                                    { status: 'Chờ xử lý', count: contractStats?.pending || 0, color: '#f59e0b' },
                                    { status: 'Từ chối', count: contractStats?.rejected || 0, color: '#ef4444' },
                                    { status: 'Hết hạn', count: contractStats?.expired || 0, color: '#6b7280' },
                                ].map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Blog & Promotion Statistics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* Blog Statistics */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        📝 Thống kê bài viết
                    </h3>
                    {blogStats?.total > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart
                                data={[
                                    { status: 'Xuất bản', count: blogStats?.published || 0 },
                                    { status: 'Chờ duyệt', count: blogStats?.pending || 0 },
                                    { status: 'Nháp', count: blogStats?.draft || 0 },
                                    { status: 'Lưu trữ', count: blogStats?.archived || 0 },
                                ]}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis type="category" dataKey="status" />
                                <Tooltip />
                                <Bar dataKey="count" fill="#8b5cf6" name="Số lượng" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="text-center py-8">
                            <FileText className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                            <p className="text-sm text-gray-500">Chưa có bài viết nào</p>
                        </div>
                    )}
                </div>

                {/* Top Hotels by Revenue */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        🏆 Top khách sạn theo phí quản lý
                    </h3>
                    {reportsSummary?.daily_summary?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart
                                data={Object.values(
                                    reportsSummary.daily_summary.reduce((acc, item) => {
                                        const hotelName = item.hotelName || 'Unknown';
                                        if (!acc[hotelName]) {
                                            acc[hotelName] = { hotel: hotelName, adminFee: 0 };
                                        }
                                        // Use adminFeeSum (admin fee from API)
                                        acc[hotelName].adminFee += parseFloat(item.adminFeeSum || 0);
                                        return acc;
                                    }, {})
                                )
                                    .sort((a, b) => b.adminFee - a.adminFee)
                                    .slice(0, 5)
                                    .map(item => ({
                                        hotel: item.hotel.length > 20 ? item.hotel.substring(0, 20) + '...' : item.hotel,
                                        adminFee: (item.adminFee / 1000000).toFixed(2)
                                    }))
                                }
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" label={{ value: 'Triệu VNĐ', position: 'insideBottom', offset: -5 }} />
                                <YAxis type="category" dataKey="hotel" />
                                <Tooltip formatter={(value) => [value + ' triệu', 'Phí quản lý']} />
                                <Bar dataKey="adminFee" fill="#8b5cf6" name="Phí quản lý" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="text-center py-8">
                            <Building className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                            <p className="text-sm text-gray-500">Chưa có dữ liệu doanh thu từ khách sạn</p>
                        </div>
                    )}
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