// src/components/layout/AdminLayout.jsx
import { UserCog } from "lucide-react";
import { Link, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';

import {
    LayoutDashboard, FileText, Briefcase, Users, Ticket, MessageSquare,
    MapPin, BarChart2, Bell, FileSignature, BadgePercent, CreditCard, Calendar, User,Database,Landmark
} from 'lucide-react';

const AdminLayout = () => {
    const { user, handleLogout } = useAuth();
    const location = useLocation();

    // Hàm tiện ích để kiểm tra link nào đang active
    const isActive = (path) => location.pathname.startsWith(path);

    // Danh sách các link điều hướng trong sidebar - SẮP XẾP LẠI HỢP LÝ
    const navLinks = [
        // QUẢN LÝ CHÍNH
        { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/admin/dashboard' },
        { name: 'Quản lý người dùng', icon: <UserCog size={20} />, path: '/admin/users' },
        { name: 'Quản lý đối tác', icon: <Briefcase size={20} />, path: '/admin/partners' },
        { name: 'Quản lý hợp đồng', icon: <FileSignature size={20} />, path: '/admin/contracts'},
        
        // KHÁCH HÀNG
        { name: 'Quản lý khách hàng', icon: <Users size={20} />, path: '/admin/customers' },
        { name: 'Quản lý Tăng Giá Theo Mùa', icon: <Calendar size={20} />, path: '/admin/seasons' },
        { 
            name: 'Chương trình KM', 
            icon: <BadgePercent size={20} />, 
            path: '/admin/promotions',
            subItems: [
                { name: 'Danh sách KM', path: '/admin/promotions' },
                { name: 'Tạo KM mới', path: '/admin/promotions/create' },
                { name: 'Phân tích KM', path: '/admin/promotions/analytics' }
            ]
        },
        
        // NỘI DUNG
        { 
            name: 'Bài viết du lịch', 
            icon: <FileText size={20} />, 
            path: '/admin/blog-management',
            // subItems: [
            //     { name: 'Tất cả bài viết', path: '/admin/blog-management' },
            // ]
        },
        { name: 'Quản lý bình luận', icon: <MessageSquare size={20} />, path: '/admin/comments' },
        { name: 'Gợi ý địa danh', icon: <MapPin size={20} />, path: '/admin/suggestions' },
        { name: 'Quản lý dữ liệu AI', icon: <Database size={20} />, path: '/admin/data-sync' },
        { name: 'Danh lam thắng cảnh', icon: <Landmark size={20} />, path: '/admin/tourist-locations' },
        { name: 'Quản lý tiện nghi', icon: <LayoutDashboard size={20} />, path: '/admin/amenities' },
        
        // TIN NHẮN
        { name: 'Tin nhắn', icon: <MessageSquare size={20} />, path: '/admin/messages' },
        
        // BÁO CÁO
        { name: 'Báo cáo thống kê', icon: <BarChart2 size={20} />, path: '/admin/reports' },
        { name: 'Quản lý tài khoản NH', icon: <CreditCard size={20} />, path: '/admin/bank-accounts' },
        { name: 'Hồ sơ cá nhân', icon: <User size={20} />, path: '/admin/profile' },
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
                        className={`flex items-center text-sm font-medium px-4 py-2.5 rounded-lg transition-all duration-200 ${
                            isMainActive 
                                ? 'bg-orange-100 text-orange-600 shadow-sm' 
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
                                            ? 'bg-orange-50 text-orange-600 border-l-2 border-orange-600'
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
                        ? 'bg-orange-100 text-orange-600 shadow-sm' 
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
                    <div className="text-2xl font-bold text-orange-600 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                            <span className="text-white font-bold text-lg">B</span>
                        </div>
                        <div>
                            <div className="leading-tight">Bookflow</div>
                            <div className="text-sm font-medium text-gray-500">Manager</div>
                        </div>
                    </div>
                </div>
                
                {/* Navigation - có thể scroll */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-1 min-h-0 scrollbar-thin">
                    {/* QUẢN LÝ CHÍNH - 4 items (0-3) */}
                    <p className="text-xs font-bold text-gray-500 uppercase px-4 mb-2 tracking-wider">Quản lý chính</p>
                    {navLinks.slice(0, 4).map(renderMenuItem)}
                    
                    {/* KHÁCH HÀNG - 3 items (4-6) */}
                    <div className="my-4 border-t border-gray-200"></div>
                    <p className="text-xs font-bold text-gray-500 uppercase px-4 mb-2 tracking-wider">Khách hàng</p>
                    {navLinks.slice(4, 7).map(renderMenuItem)}
                    
                    {/* NỘI DUNG - 5 items (7-11) */}
                    <div className="my-4 border-t border-gray-200"></div>
                    <p className="text-xs font-bold text-gray-500 uppercase px-4 mb-2 tracking-wider">Nội dung</p>
                    {navLinks.slice(7, 12).map(renderMenuItem)}
                    
                    {/* TIN NHẮN - 1 item (12) */}
                    <div className="my-4 border-t border-gray-200"></div>
                    <p className="text-xs font-bold text-gray-500 uppercase px-4 mb-2 tracking-wider">Tin nhắn</p>
                    {navLinks.slice(12, 13).map(renderMenuItem)}
                    
                    {/* BÁO CÁO - 3 items (13-15) */}
                    <div className="my-4 border-t border-gray-200"></div>
                    <p className="text-xs font-bold text-gray-500 uppercase px-4 mb-2 tracking-wider">Báo cáo</p>
                    {navLinks.slice(13).map(renderMenuItem)}
                </nav>

                {/* Footer cố định */}
                <div className="p-4 border-t border-gray-200 shrink-0 bg-gray-50">
                    {/* User info nhỏ */}
                    <div className="flex items-center gap-3 mb-3 px-2">
                        <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center shadow-sm">
                            <User size={20} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-800 truncate">
                                {user?.fullName || 'Admin'}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                                {user?.email || 'admin@bookflow.com'}
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
                    <h1 className="text-xl font-bold text-gray-800">Dashboard Quản trị viên</h1>
                    <div className="flex items-center gap-4">
                        <button className="relative text-gray-600 hover:text-gray-800 transition-colors">
                            <Bell size={22} />
                        </button>
                    </div>
                </header>
                <main className="flex-1 bg-gray-50 overflow-y-auto overflow-x-hidden relative">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;