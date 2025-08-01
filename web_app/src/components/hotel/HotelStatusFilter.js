// src/components/hotel/HotelStatusFilter.js
import React from 'react';

const HotelStatusFilter = ({ activeTab, onTabChange, counts }) => {
    const tabs = [
        {
            key: 'approved',
            label: 'Đã Duyệt',
            count: counts?.approved || 0,
            color: 'text-green-600 bg-green-50 border-green-200',
            activeColor: 'text-green-700 bg-green-100 border-green-300'
        },
        {
            key: 'pending',
            label: 'Chờ Duyệt & Từ Chối',
            count: counts?.pending || 0,
            color: 'text-orange-600 bg-orange-50 border-orange-200',
            activeColor: 'text-orange-700 bg-orange-100 border-orange-300'
        }
    ];

    return (
        <div className="bg-white border-b border-gray-200">
            <div className="px-6 py-4">
                <div className="flex space-x-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => onTabChange(tab.key)}
                            className={`
                                flex items-center px-4 py-2 text-sm font-medium rounded-lg border transition-colors
                                ${activeTab === tab.key 
                                    ? tab.activeColor + ' shadow-sm'
                                    : 'text-gray-500 bg-white border-gray-200 hover:text-gray-700 hover:bg-gray-50'
                                }
                            `}
                        >
                            <span>{tab.label}</span>
                            <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                                activeTab === tab.key 
                                    ? 'bg-white bg-opacity-50' 
                                    : 'bg-gray-100'
                            }`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HotelStatusFilter;