// src/components/layout/AdminLayout.jsx
import { UserCog } from "lucide-react";
import { Link, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';

import {
    LayoutDashboard, FileText, Briefcase, Users, Ticket, MessageSquare,
    MapPin, BarChart2, Bell, FileSignature, BadgePercent, CreditCard, Calendar,
} from 'lucide-react';

const AdminLayout = () => {
    const { user, handleLogout } = useAuth();
    const location = useLocation();

    // Hàm tiện ích để kiểm tra link nào đang active
    const isActive = (path) => location.pathname.startsWith(path);

    // Danh sách các link điều hướng trong sidebar
    const navLinks = [
        { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/admin/dashboard' },
        { name: 'Quản lý người dùng', icon: <UserCog size={20} />, path: '/admin/users' },
        { 
            name: 'Bài viết du lịch', 
            icon: <FileText size={20} />, 
            path: '/admin/blog-management',
            subItems: [
                { name: 'Tất cả bài viết', path: '/admin/blog-management' },
                
            ]
        },
        { name: 'Quản lý đối tác', icon: <Briefcase size={20} />, path: '/admin/partners' },
        { name: 'Quản lý hợp đồng', icon: <FileSignature size={20} />, path: '/admin/contracts'},
        { name: 'Quản lý khách hàng', icon: <Users size={20} />, path: '/admin/customers' },
        { name: 'Quản lý Tăng Giá Theo Mùa', icon: <Calendar size={20} />, path: '/admin/seasons' },
        { name: 'Thanh toán', icon: <Ticket size={20} />, path: '/admin/payments' },
        { name: 'Tin nhắn', icon: <MessageSquare size={20} />, path: '/admin/messages' },
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
        { name: 'Quản lý bình luận', icon: <MessageSquare size={20} />, path: '/admin/comments' },
        { name: 'Gợi ý địa danh', icon: <MapPin size={20} />, path: '/admin/suggestions' },
        { name: 'Báo cáo thống kê', icon: <BarChart2 size={20} />, path: '/admin/reports' },
        { name: 'Quản lý tài khoản NH', icon: <CreditCard size={20} />, path: '/admin/bank-accounts' },
        
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
                            isMainActive ? 'bg-orange-100 text-orange-600' : 'text-gray-700 hover:bg-gray-100'
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
                className={`flex items-center text-sm font-medium px-4 py-2.5 rounded-lg transition-colors ${
                    isMainActive ? 'bg-orange-100 text-orange-600' : 'text-gray-700 hover:bg-gray-100'
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
        <div className="flex bg-gray-50 h-screen font-sans overflow-hidden">
            {/* Sidebar */}
            <aside className="w-72 bg-white border-r border-gray-200 flex flex-col">
                {/* Header cố định */}
                <div className="p-4 border-b border-gray-200 shrink-0">
                    <div className="text-2xl font-bold text-orange-500 mb-4">Bookflow Manager</div>
                    <div className="flex border border-gray-200 rounded-lg p-1">
                        <button className="flex-1 text-sm font-semibold bg-orange-500 text-white rounded-md py-2">
                            Quản trị viên
                        </button>
                    </div>
                </div>
                
                {/* Navigation - có thể scroll */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-1 min-h-0">
                    <p className="text-xs font-semibold text-gray-400 uppercase px-4 mb-2">Quản lý chính</p>
                    {navLinks.slice(0, 4).map(renderMenuItem)}
                    
                    <p className="text-xs font-semibold text-gray-400 uppercase px-4 mt-4 mb-2">Khách hàng</p>
                    {navLinks.slice(4, 8).map(renderMenuItem)}
                    
                    <p className="text-xs font-semibold text-gray-400 uppercase px-4 mt-4 mb-2">Tin nhắn</p>
                    {navLinks.slice(8, 9).map(renderMenuItem)}
                    
                    <p className="text-xs font-semibold text-gray-400 uppercase px-4 mt-4 mb-2">Nội dung</p>
                    {navLinks.slice(9, 12).map(renderMenuItem)}
                    
                    <p className="text-xs font-semibold text-gray-400 uppercase px-4 mt-4 mb-2">Báo cáo</p>
                    {navLinks.slice(12).map(renderMenuItem)}
                </nav>

                {/* Footer cố định - nút đăng xuất */}
                <div className="p-4 border-t border-gray-200 shrink-0">
                    <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition duration-300"
                    >
                        Đăng xuất
                    </button>
                </div>
            </aside>
            
            {/* Phần nội dung chính */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center shrink-0">
                    <h1 className="text-xl font-bold text-gray-800">Dashboard Quản trị viên</h1>
                    <div className="flex items-center gap-4">
                        <button className="relative text-gray-600 hover:text-gray-800">
                            <Bell size={22} />
                        </button>
                    </div>
                </header>
                <main className="flex-1 bg-gray-50 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;