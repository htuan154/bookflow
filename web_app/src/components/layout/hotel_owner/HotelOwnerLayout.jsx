// src/components/layout/HotelOwnerLayout.jsx
import { 
    Building2, Home, Bed, BedDouble, DollarSign, BadgePercent, 
    Users2, Calendar, MessageSquare, Star, FileText, BarChart3,
    Bell, Settings, User, LogOut, Camera, Wrench, CreditCard
} from "lucide-react";
import { Link, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';
import { AmenityProvider } from '../../../context/AmenityContext';
import { HotelAmenityProvider } from '../../../context/HotelAmenityContext';
import { USER_ROLES } from '../../../config/roles';

const HotelOwnerLayout = () => {
    const { user, handleLogout } = useAuth();
    const location = useLocation();
    
    // Check if user is hotel_staff
    const isHotelStaff = user?.roleId === USER_ROLES.HOTEL_STAFF;

    // Hàm tiện ích để kiểm tra link nào đang active
    const isActive = (path) => location.pathname.startsWith(path);

    // Danh sách các link điều hướng trong sidebar
    const allNavLinks = [
        { name: 'Dashboard', icon: <BarChart3 size={20} />, path: '/hotel-owner/dashboard', ownerOnly: true },
        
        // Quản lý khách sạn
        { 
            name: 'Quản lý khách sạn', 
            icon: <Building2 size={20} />, 
            path: '/hotel-owner/hotel/info',
            ownerOnly: true
            // subItems: [
            //     { name: 'Thông tin khách sạn', path: '/hotel-owner/hotel/info' }
            // ]
        },

        // Quản lý phòng
        { 
            name: 'Quản lý phòng', 
            icon: <Bed size={20} />, 
            path: '/hotel-owner/rooms/management',
            ownerOnly: true
            // subItems: [
            //     { name: 'Sắp Xếp Phòng', path: '/hotel-owner/rooms/management' }
            // ]
        },

        // Quản lý giá và khuyến mãi
        { 
            name: 'Giá & Khuyến mãi', 
            icon: <DollarSign size={20} />, 
            path: '/hotel-owner/pricing',
            ownerOnly: true,
            subItems: [
                { name: 'Giá theo Mùa', path: '/hotel-owner/pricing/seasonal' },
                { name: 'Khuyến Mãi', path: '/hotel-owner/pricing/promotions' }
            ]
        },

        // Tài chính & Ngân hàng (Updated - single page)
        { 
            name: 'Tài khoản ngân hàng', 
            icon: <CreditCard size={20} />, 
            path: '/hotel-owner/bank-accounts',
            ownerOnly: true
        },

        // Quản lý đặt phòng
        { 
            name: 'Đặt phòng', 
            icon: <Calendar size={20} />, 
            path: '/hotel-owner/bookings',
            // subItems: [
            //     { name: 'Danh sách booking', path: '/hotel-owner/bookings/list' },
            //     { name: 'Check-in/Check-out', path: '/hotel-owner/bookings/checkin' },
            //     { name: 'Lịch sử booking', path: '/hotel-owner/bookings/history' },
            //     { name: 'Phân phòng', path: '/hotel-owner/bookings/assignments' }
            // ]
        },

        // Quản lý nhân viên
        { 
            name: 'Nhân viên', 
            icon: <Users2 size={20} />, 
            path: '/hotel-owner/staff',
            ownerOnly: true
          
        },

        // Đánh giá và phản hồi
        { 
            name: 'Đánh giá', 
            icon: <Star size={20} />, 
            path: '/hotel-owner/reviews'
            // subItems: [
            //     { name: 'Tất cả đánh giá', path: '/hotel-owner/reviews/all' },
            //     { name: 'Phản hồi đánh giá', path: '/hotel-owner/reviews/responses' },
            //     { name: 'Thống kê đánh giá', path: '/hotel-owner/reviews/analytics' }
            // ]
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
            path: '/hotel-owner/marketing'
        },

        // Báo cáo
        { 
            name: 'Báo cáo & Thống kê', 
            icon: <BarChart3 size={20} />, 
            path: '/hotel-owner/reports'
        },

        // Hợp đồng
        { 
            name: 'Hợp đồng', 
            icon: <FileText size={20} />, 
            path: '/hotel-owner/contracts',
            ownerOnly: true
            /*
            subItems: [
                { name: 'Xem hợp đồng', path: '/hotel-owner/contracts/view' },
                { name: 'Điều khoản', path: '/hotel-owner/contracts/terms' }
            ]
                */
        },

        // Hồ sơ cá nhân
        { 
            name: 'Hồ sơ cá nhân', 
            icon: <User size={20} />, 
            path: '/hotel-owner/profile'
        }
            
    ];
    
    // Filter nav links based on user role - hotel_staff cannot see ownerOnly items
    const navLinks = isHotelStaff 
        ? allNavLinks.filter(link => !link.ownerOnly)
        : allNavLinks;

    // Hàm render menu item với sub-items
    const renderMenuItem = (link) => {
        const hasSubItems = link.subItems && link.subItems.length > 0;
        const isMainActive = isActive(link.path);

        if (hasSubItems) {
            return (
                <div key={link.name} className="space-y-1">
                    <Link 
                        to={link.path} 
                        className={`flex items-center text-sm font-medium px-4 py-2.5 rounded-lg transition-all duration-200 ${
                            isMainActive 
                                ? 'bg-blue-100 text-blue-600 shadow-sm' 
                                : 'text-gray-700 hover:bg-gray-100 hover:shadow-sm'
                        }`}
                    >
                        {link.icon}
                        <span className="ml-3">{link.name}</span>
                        {link.badge && (
                            <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-sm">
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
                className={`flex items-center text-sm font-medium px-4 py-2.5 rounded-lg transition-all duration-200 ${
                    isMainActive 
                        ? 'bg-blue-100 text-blue-600 shadow-sm' 
                        : 'text-gray-700 hover:bg-gray-100 hover:shadow-sm'
                }`}
            >
                {link.icon}
                <span className="ml-3">{link.name}</span>
                {link.badge && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-sm">
                        {link.badge}
                    </span>
                )}
            </Link>
        );
    };

    return (
        <div className="flex bg-gray-50 h-screen font-sans overflow-hidden">
            {/* Sidebar */}
            <aside className="w-72 bg-white border-r border-gray-200 flex flex-col shadow-sm">
                {/* Header cố định */}
                <div className="p-5 border-b border-gray-200 shrink-0">
                    {/* Logo */}
                    <div className="text-2xl font-bold text-blue-600 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                            <Building2 size={22} className="text-white" />
                        </div>
                        <div>
                            <div className="leading-tight">Bookflow</div>
                            <div className="text-sm font-medium text-gray-500">Manager</div>
                        </div>
                    </div>
                </div>
                
                {/* Navigation - có thể scroll */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-1 min-h-0 scrollbar-thin">
                    {isHotelStaff ? (
                        <>
                            {/* Staff menu - grouped correctly */}
                            <p className="text-xs font-bold text-gray-500 uppercase px-4 mb-2 tracking-wider">Kinh doanh</p>
                            {navLinks.filter(link => link.path === '/hotel-owner/bookings').map(renderMenuItem)}
                            
                            <div className="my-4 border-t border-gray-200"></div>
                            <p className="text-xs font-bold text-gray-500 uppercase px-4 mb-2 tracking-wider">Nhân sự & Khách hàng</p>
                            {navLinks.filter(link => 
                                ['/hotel-owner/reviews', '/hotel-owner/support', '/hotel-owner/messages'].includes(link.path)
                            ).map(renderMenuItem)}
                            
                            <div className="my-4 border-t border-gray-200"></div>
                            <p className="text-xs font-bold text-gray-500 uppercase px-4 mb-2 tracking-wider">Báo cáo & Hợp đồng</p>
                            {navLinks.filter(link => 
                                ['/hotel-owner/marketing', '/hotel-owner/reports', '/hotel-owner/profile'].includes(link.path)
                            ).map(renderMenuItem)}
                        </>
                    ) : (
                        <>
                            {/* Owner menu - original structure */}
                            <p className="text-xs font-bold text-gray-500 uppercase px-4 mb-2 tracking-wider">Tổng quan</p>
                            {navLinks.slice(0, 1).map(renderMenuItem)}
                            
                            <div className="my-4 border-t border-gray-200"></div>
                            <p className="text-xs font-bold text-gray-500 uppercase px-4 mb-2 tracking-wider">Quản lý khách sạn</p>
                            {navLinks.slice(1, 3).map(renderMenuItem)}
                            
                            <div className="my-4 border-t border-gray-200"></div>
                            <p className="text-xs font-bold text-gray-500 uppercase px-4 mb-2 tracking-wider">Kinh doanh</p>
                            {navLinks.slice(3, 6).map(renderMenuItem)}
                            
                            <div className="my-4 border-t border-gray-200"></div>
                            <p className="text-xs font-bold text-gray-500 uppercase px-4 mb-2 tracking-wider">Nhân sự & Khách hàng</p>
                            {navLinks.slice(6, 10).map(renderMenuItem)}
                            
                            <div className="my-4 border-t border-gray-200"></div>
                            <p className="text-xs font-bold text-gray-500 uppercase px-4 mb-2 tracking-wider">Báo cáo & Hợp đồng</p>
                            {navLinks.slice(10).map(renderMenuItem)}
                        </>
                    )}
                </nav>

                {/* Footer cố định */}
                <div className="p-4 border-t border-gray-200 shrink-0 bg-gray-50">
                    {/* User info nhỏ */}
                    <div className="flex items-center gap-3 mb-3 px-2">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-sm">
                            <User size={20} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-800 truncate">
                                {user?.fullName || user?.name || 'Hotel Owner'}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                                {user?.email || 'hotel@bookflow.com'}
                            </div>
                        </div>
                    </div>
                    
                    {/* Logout button */}
                    <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-300 font-medium shadow-sm hover:shadow-md active:scale-95"
                    >
                        Đăng xuất
                    </button>
                </div>
            </aside>
            
            {/* Phần nội dung chính */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center shrink-0 shadow-sm z-10">
                    <h1 className="text-xl font-bold text-gray-800">Quản lý khách sạn</h1>
                    <div className="flex items-center gap-4">
                        <button className="relative text-gray-600 hover:text-gray-800 transition-colors">
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
                <main className="flex-1 bg-gray-50 overflow-y-auto overflow-x-hidden relative">
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