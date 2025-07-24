// src/components/admin/dashboard/StatCard.js
import React from 'react';

/**
 * Component hiển thị một thẻ thống kê.
 * @param {object} props - Props của component.
 * @param {React.ReactNode} props.icon - Icon hiển thị trên thẻ (từ lucide-react).
 * @param {string} props.title - Tiêu đề của thẻ thống kê (ví dụ: "Tổng số khách sạn").
 * @param {string | number} props.value - Giá trị của thống kê.
 * @param {string} props.color - Màu nền cho icon (ví dụ: "bg-blue-500").
 */
const StatCard = ({ icon, title, value, color = 'bg-gray-500' }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-md flex items-center transition-transform hover:scale-105">
      <div className={`p-4 rounded-full text-white ${color}`}>
        {icon}
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
};

export default StatCard;
