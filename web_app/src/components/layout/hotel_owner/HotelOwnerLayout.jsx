// src/components/layout/HotelOwnerLayout.jsx
import { 
    Building2, Home, Bed, BedDouble, DollarSign, BadgePercent, 
    Users2, Calendar, MessageSquare, Star, FileText, BarChart3,
    Bell, Settings, User, LogOut, Camera, Wrench
} from "lucide-react";
import { Link, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';
import { AmenityProvider } from '../../../context/AmenityContext';
import { HotelAmenityProvider } from '../../../context/HotelAmenityContext';
const HotelOwnerLayout = () => {
    const { user, handleLogout } = useAuth();
    const location = useLocation();

    // Hàm tiện ích để kiểm tra link nào đang active
    const isActive = (path) => location.pathname.startsWith(path);

    // Danh sách các link điều hướng trong sidebar
    const navLinks = [
        { name: 'Dashboard', icon: <BarChart3 size={20} />, path: '/hotel-owner/dashboard' },
        
        // Quản lý khách sạn
        { 
            name: 'Quản lý khách sạn', 
            icon: <Building2 size={20} />, 
            path: '/hotel-owner/hotel',
            subItems: [
                { name: 'Thông tin khách sạn', path: '/hotel-owner/hotel/info' },
                { name: 'Hình ảnh khách sạn', path: '/hotel-owner/hotel/images' },
                { name: 'Tiện nghi', path: '/hotel-owner/hotel/amenities' },
                { name: 'Cài đặt chung', path: '/hotel-owner/hotel/settings' }
            ]
        },

        // Quản lý phòng
        { 
            name: 'Quản lý phòng', 
            icon: <Bed size={20} />, 
            path: '/hotel-owner/rooms',
            subItems: [
                { name: 'Loại phòng', path: '/hotel-owner/rooms/types' },
                { name: 'Danh sách phòng', path: '/hotel-owner/rooms/list' },
                { name: 'Trạng thái phòng', path: '/hotel-owner/rooms/status' },
                { name: 'Hình ảnh phòng', path: '/hotel-owner/rooms/images' }
            ]
        },

        // Quản lý giá và khuyến mãi
        { 
            name: 'Giá & Khuyến mãi', 
            icon: <DollarSign size={20} />, 
            path: '/hotel-owner/pricing',
            subItems: [
                { name: 'Giá', path: '/hotel-owner/pricing/rates' },
                { name: 'Khuyến Mãi', path: '/hotel-owner/pricing/promotions' }
            ]
        },

        // Quản lý đặt phòng
        { 
            name: 'Đặt phòng', 
            icon: <Calendar size={20} />, 
            path: '/hotel-owner/bookings',
            subItems: [
                { name: 'Danh sách booking', path: '/hotel-owner/bookings/list' },
                { name: 'Check-in/Check-out', path: '/hotel-owner/bookings/checkin' },
                { name: 'Lịch sử booking', path: '/hotel-owner/bookings/history' },
                { name: 'Phân phòng', path: '/hotel-owner/bookings/assignments' }
            ]
        },

        // Quản lý nhân viên
        { 
            name: 'Nhân viên', 
            icon: <Users2 size={20} />, 
            path: '/hotel-owner/staff',
            subItems: [
                { name: 'Danh sách nhân viên', path: '/hotel-owner/staff/list' },
                { name: 'Thêm nhân viên', path: '/hotel-owner/staff/add' },
                { name: 'Phân ca làm việc', path: '/hotel-owner/staff/schedules' }
            ]
        },

        // Đánh giá và phản hồi
        { 
            name: 'Đánh giá', 
            icon: <Star size={20} />, 
            path: '/hotel-owner/reviews',
            subItems: [
                { name: 'Tất cả đánh giá', path: '/hotel-owner/reviews/all' },
                { name: 'Phản hồi đánh giá', path: '/hotel-owner/reviews/responses' },
                { name: 'Thống kê đánh giá', path: '/hotel-owner/reviews/analytics' }
            ]
        },

        // Hỗ trợ khách hàng
        { 
            name: 'Hỗ trợ khách hàng', 
            icon: <MessageSquare size={20} />, 
            path: '/hotel-owner/support'
        },
        { 
            name: 'Tin nhắn', 
            icon: <MessageSquare size={20} />, 
            path: '/hotel-owner/messages'
        },
        // Marketing
        { 
            name: 'Marketing', 
            icon: <FileText size={20} />, 
            path: '/hotel-owner/marketing',
            subItems: [
                { name: 'Viết blog', path: '/hotel-owner/marketing/blogs' },
                { name: 'Nội dung marketing', path: '/hotel-owner/marketing/content' }
            ]
        },

        // Báo cáo
        { 
            name: 'Báo cáo & Thống kê', 
            icon: <BarChart3 size={20} />, 
            path: '/hotel-owner/reports',
            subItems: [
                { name: 'Doanh thu', path: '/hotel-owner/reports/revenue' },
                { name: 'Tỷ lệ lấp đầy', path: '/hotel-owner/reports/occupancy' },
                { name: 'Hiệu quả khuyến mãi', path: '/hotel-owner/reports/promotions' },
                { name: 'Báo cáo tổng hợp', path: '/hotel-owner/reports/summary' }
            ]
        },

        // Hợp đồng
        { 
            name: 'Hợp đồng', 
            icon: <FileText size={20} />, 
            path: '/hotel-owner/contracts',
            /*
            subItems: [
                { name: 'Xem hợp đồng', path: '/hotel-owner/contracts/view' },
                { name: 'Điều khoản', path: '/hotel-owner/contracts/terms' }
            ]
                */
        }
            
    ];

    // Hàm render menu item với sub-items
    const renderMenuItem = (link) => {
        const hasSubItems = link.subItems && link.subItems.length > 0;
        const isMainActive = isActive(link.path);

        if (hasSubItems) {
            return (
                <div key={link.name} className="space-y-1">
                    <Link 
                        to={link.path} 
                        className={`flex items-center text-sm font-medium px-4 py-2.5 rounded-lg transition-colors ${
                            isMainActive ? 'bg-blue-100 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        {link.icon}
                        <span className="ml-3">{link.name}</span>
                        {link.badge && (
                            <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                {link.badge}
                            </span>
                        )}
                    </Link>
                    {isMainActive && (
                        <div className="ml-6 space-y-1">
                            {link.subItems.map(subItem => (
                                <Link
                                    key={subItem.name}
                                    to={subItem.path}
                                    className={`block text-sm px-4 py-2 rounded-lg transition-colors ${
                                        location.pathname === subItem.path
                                            ? 'bg-blue-50 text-blue-600 border-l-2 border-blue-600'
                                            : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    {subItem.name}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <Link 
                key={link.name} 
                to={link.path} 
                className={`flex items-center text-sm font-medium px-4 py-2.5 rounded-lg transition-colors ${
                    isMainActive ? 'bg-blue-100 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
                }`}
            >
                {link.icon}
                <span className="ml-3">{link.name}</span>
                {link.badge && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {link.badge}
                    </span>
                )}
            </Link>
        );
    };

    return (
        <div className="flex bg-gray-50 min-h-screen font-sans">
            {/* Sidebar */}
            <aside className="w-72 bg-white border-r border-gray-200 p-4 flex flex-col">
                <div className="text-2xl font-bold text-blue-600 mb-4 px-2">
                    <Building2 className="inline-block mr-2" size={28} />
                    Hotel Manager
                </div>
                
                <div className="flex border border-gray-200 rounded-lg p-1 mb-6">
                    <button className="flex-1 text-sm font-semibold bg-blue-500 text-white rounded-md py-2">
                        Chủ khách sạn
                    </button>
                </div>
                
                <nav className="flex-1 space-y-1 overflow-y-auto">
                    <p className="text-xs font-semibold text-gray-400 uppercase px-4 mb-2">Tổng quan</p>
                    {navLinks.slice(0, 1).map(renderMenuItem)}
                    
                    <p className="text-xs font-semibold text-gray-400 uppercase px-4 mt-4 mb-2">Quản lý khách sạn</p>
                    {navLinks.slice(1, 3).map(renderMenuItem)}
                    
                    <p className="text-xs font-semibold text-gray-400 uppercase px-4 mt-4 mb-2">Kinh doanh</p>
                    {navLinks.slice(3, 5).map(renderMenuItem)}
                    
                    <p className="text-xs font-semibold text-gray-400 uppercase px-4 mt-4 mb-2">Nhân sự & Khách hàng</p>
                    {navLinks.slice(5, 9).map(renderMenuItem)}
                    
                    <p className="text-xs font-semibold text-gray-400 uppercase px-4 mt-4 mb-2">Báo cáo & Hợp đồng</p>
                    {navLinks.slice(9).map(renderMenuItem)}
                </nav>

                {/* User Info & Logout */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex items-center px-4 py-2 mb-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <User size={16} className="text-white" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{user?.name || 'Hotel Owner'}</p>
                            <p className="text-xs text-gray-500">{user?.email}</p>
                        </div>
                    </div>
                    
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <LogOut size={16} />
                        <span className="ml-3">Đăng xuất</span>
                    </button>
                </div>
            </aside>
            
            {/* Phần nội dung chính */}
            <div className="flex-1 flex flex-col">
                <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-800">Quản lý khách sạn</h1>
                    <div className="flex items-center gap-4">
                        <button className="relative text-gray-600 hover:text-gray-800">
                            <Bell size={22} />
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                                3
                            </span>
                        </button>
                        
                        <button className="text-gray-600 hover:text-gray-800">
                            <Settings size={22} />
                        </button>
                        
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                <User size={16} className="text-white" />
                            </div>
                            <span className="text-sm font-medium text-gray-700">{user?.name}</span>
                        </div>
                    </div>
                </header>
                
                <main className="flex-1 bg-gray-50 p-6">
                   <AmenityProvider>
                        <HotelAmenityProvider>
                            <Outlet />
                        </HotelAmenityProvider>
                    </AmenityProvider>
                </main>
            </div>
        </div>
    );
};

export default HotelOwnerLayout;