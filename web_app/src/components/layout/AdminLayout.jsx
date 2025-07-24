// src/components/layout/AdminLayout.jsx
import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

import {
    LayoutDashboard, FileText, Briefcase, Users, Ticket, MessageSquare,
    MapPin, BarChart2, Bell, PlusCircle, FileSignature, BadgePercent
} from 'lucide-react';

const AdminLayout = () => {
    const { user, handleLogout } = useAuth();
    const location = useLocation();

    // Hàm tiện ích để kiểm tra link nào đang active
    const isActive = (path) => location.pathname.startsWith(path);

    // Danh sách các link điều hướng trong sidebar
    const navLinks = [
        { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/admin/dashboard' },
        { name: 'Bài viết du lịch', icon: <FileText size={20} />, path: '/admin/articles' },
        { name: 'Quản lý đối tác', icon: <Briefcase size={20} />, path: '/admin/partners' },
        { name: 'Xét duyệt hợp đồng', icon: <FileSignature size={20} />, path: '/admin/contracts', badge: 2 },
        { name: 'Quản lý khách hàng', icon: <Users size={20} />, path: '/admin/customers' },
        { name: 'Thanh toán', icon: <Ticket size={20} />, path: '/admin/payments' },
        { name: 'Chương trình KM', icon: <BadgePercent size={20} />, path: '/admin/promotions' },
        { name: 'Quản lý bình luận', icon: <MessageSquare size={20} />, path: '/admin/comments' },
        { name: 'Gợi ý địa danh', icon: <MapPin size={20} />, path: '/admin/suggestions' },
        { name: 'Báo cáo thống kê', icon: <BarChart2 size={20} />, path: '/admin/reports' },
    ];

    return (
        <div className="flex bg-gray-50 min-h-screen font-sans">
            {/* Sidebar */}
            <aside className="w-72 bg-white border-r border-gray-200 p-4 flex flex-col">
                <div className="text-2xl font-bold text-orange-500 mb-4 px-2">Tourism Manager</div>
                <div className="flex border border-gray-200 rounded-lg p-1 mb-6">
                    <button className="flex-1 text-sm font-semibold bg-orange-500 text-white rounded-md py-2">Quản trị viên</button>
                    <button className="flex-1 text-sm font-semibold text-gray-600 py-2">Chủ khách sạn</button>
                </div>
                
                <nav className="flex-1 space-y-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase px-4 mb-2">Quản lý chính</p>
                    {navLinks.slice(0, 4).map(link => (
                        <Link key={link.name} to={link.path} className={`flex items-center text-sm font-medium px-4 py-2.5 rounded-lg transition-colors ${isActive(link.path) ? 'bg-orange-100 text-orange-600' : 'text-gray-700 hover:bg-gray-100'}`}>
                            {link.icon}
                            <span className="ml-3">{link.name}</span>
                            {link.badge && <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{link.badge}</span>}
                        </Link>
                    ))}
                    <p className="text-xs font-semibold text-gray-400 uppercase px-4 mt-4 mb-2">Khách hàng</p>
                    {navLinks.slice(4, 7).map(link => (
                        <Link key={link.name} to={link.path} className={`flex items-center text-sm font-medium px-4 py-2.5 rounded-lg transition-colors ${isActive(link.path) ? 'bg-orange-100 text-orange-600' : 'text-gray-700 hover:bg-gray-100'}`}>
                            {link.icon}
                            <span className="ml-3">{link.name}</span>
                        </Link>
                    ))}
                    <p className="text-xs font-semibold text-gray-400 uppercase px-4 mt-4 mb-2">Nội dung</p>
                    {navLinks.slice(7, 10).map(link => (
                        <Link key={link.name} to={link.path} className={`flex items-center text-sm font-medium px-4 py-2.5 rounded-lg transition-colors ${isActive(link.path) ? 'bg-orange-100 text-orange-600' : 'text-gray-700 hover:bg-gray-100'}`}>
                            {link.icon}
                            <span className="ml-3">{link.name}</span>
                        </Link>
                    ))}
                </nav>
            </aside>
            
            {/* Phần nội dung chính */}
            <div className="flex-1 flex flex-col">
                <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-800">Dashboard Quản trị viên</h1>
                    <div className="flex items-center gap-4">
                        <button className="relative text-gray-600 hover:text-gray-800">
                            <Bell size={22} />
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">3</span>
                        </button>
                        <button className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600">
                            <PlusCircle size={18} />
                            Thêm mới
                        </button>
                        <button onClick={handleLogout} className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
                            <img src={`https://i.pravatar.cc/40?u=${user?.email}`} alt="User Avatar" />
                        </button>
                    </div>
                </header>
                <main className="flex-1 bg-gray-50 p-6">

                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
