import React, { useState, useEffect } from 'react';
import { FiTrendingUp, FiEye, FiHeart, FiMessageCircle, FiShare2 } from 'react-icons/fi';

const MarketingDashboard = ({ stats = {} }) => {
  const [timeRange, setTimeRange] = useState('7days');

  const defaultStats = {
    totalPosts: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    totalShares: 0,
    engagementRate: 0,
    topPerformingPost: null,
    recentActivity: []
  };

  const currentStats = { ...defaultStats, ...stats };

  const statCards = [
    {
      title: 'Tổng bài viết',
      value: currentStats.totalPosts,
      icon: FiTrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Lượt xem',
      value: currentStats.totalViews.toLocaleString(),
      icon: FiEye,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Lượt thích',
      value: currentStats.totalLikes.toLocaleString(),
      icon: FiHeart,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      title: 'Bình luận',
      value: currentStats.totalComments.toLocaleString(),
      icon: FiMessageCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tổng quan Marketing</h2>
          <p className="text-gray-600 mt-1">Theo dõi hiệu quả các bài viết của bạn</p>
        </div>
        
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        >
          <option value="7days">7 ngày qua</option>
          <option value="30days">30 ngày qua</option>
          <option value="3months">3 tháng qua</option>
          <option value="year">Năm nay</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`text-xl ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Engagement Rate */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tỷ lệ tương tác</h3>
          <div className="flex items-center">
            <div className="text-3xl font-bold text-orange-600">
              {currentStats.engagementRate.toFixed(1)}%
            </div>
            <div className="ml-4">
              <div className="w-32 h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-2 bg-orange-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(currentStats.engagementRate, 100)}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-1">Tương tác / Lượt xem</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Chia sẻ</h3>
          <div className="flex items-center">
            <div className="text-3xl font-bold text-blue-600">
              {currentStats.totalShares.toLocaleString()}
            </div>
            <div className="ml-4">
              <FiShare2 className="text-blue-600 text-2xl" />
              <p className="text-sm text-gray-500 mt-1">Tổng lượt chia sẻ</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performing Post */}
      {currentStats.topPerformingPost && (
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bài viết hiệu quả nhất</h3>
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center mb-2">
              <span className="text-orange-600 font-medium">🏆 {currentStats.topPerformingPost.hotelName}</span>
              <span className="ml-2 text-sm text-gray-500">
                {new Date(currentStats.topPerformingPost.createdAt).toLocaleDateString('vi-VN')}
              </span>
            </div>
            <p className="text-gray-800 mb-3 line-clamp-2">
              {currentStats.topPerformingPost.content}
            </p>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center">
                <FiEye className="mr-1" />
                {currentStats.topPerformingPost.views} lượt xem
              </span>
              <span className="flex items-center">
                <FiHeart className="mr-1" />
                {currentStats.topPerformingPost.likes} thích
              </span>
              <span className="flex items-center">
                <FiMessageCircle className="mr-1" />
                {currentStats.topPerformingPost.comments} bình luận
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {currentStats.recentActivity.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hoạt động gần đây</h3>
          <div className="space-y-3">
            {currentStats.recentActivity.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-800">{activity.message}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketingDashboard;