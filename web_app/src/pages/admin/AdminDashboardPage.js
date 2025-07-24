// src/pages/admin/AdminDashboardPage.js
import React, { useState, useEffect } from 'react';
import useAuth from '../../hooks/useAuth';
import { adminService } from '../../api/admin.service';
import StatCard from '../../components/dashboard/StatCard';
import { Building, Clock, CheckCircle, XCircle } from 'lucide-react';

const AdminDashboardPage = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const response = await adminService.getHotelStatistics();
                setStats(response.data.data);
            } catch (err) {
                setError('Không thể tải dữ liệu thống kê. Vui lòng thử lại.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return <div className="p-8"><h2>Đang tải dữ liệu...</h2></div>;
    }

    if (error) {
        return <div className="p-8 text-red-500"><h2>Lỗi: {error}</h2></div>;
    }

    return (
        <div className="p-8 bg-gray-50 min-h-full">
            {/* Header Chào mừng */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Chào mừng trở lại, {user?.fullName || 'Admin'}!</h1>
                <p className="text-gray-600 mt-1">Đây là tổng quan hệ thống của bạn hôm nay.</p>
            </div>

            {/* Lưới các thẻ thống kê */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        icon={<Building size={24} />}
                        title="Tổng số khách sạn"
                        value={stats.totalHotels}
                        color="bg-blue-500"
                    />
                    <StatCard 
                        icon={<CheckCircle size={24} />}
                        title="Đã được duyệt"
                        value={stats.approvedHotels}
                        color="bg-green-500"
                    />
                    <StatCard 
                        icon={<Clock size={24} />}
                        title="Đang chờ duyệt"
                        value={stats.pendingHotels}
                        color="bg-yellow-500"
                    />
                    <StatCard 
                        icon={<XCircle size={24} />}
                        title="Đã từ chối"
                        value={stats.rejectedHotels}
                        color="bg-red-500"
                    />
                </div>
            )}

            {/* Các phần khác của Dashboard có thể được thêm vào đây */}
            {/* Ví dụ: Biểu đồ, danh sách khách sạn mới nhất... */}
        </div>
    );
};

export default AdminDashboardPage;
