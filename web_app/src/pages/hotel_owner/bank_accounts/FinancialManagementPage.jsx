import React, { useState } from 'react';
import { 
  BanknotesIcon, 
  ChartBarIcon,
  CreditCardIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import BankAccountsPage from './BankAccountsPage';
import BankAccountsWithReports from './BankAccountsWithReports';

const FinancialManagementPage = () => {
  const [activeTab, setActiveTab] = useState('accounts');

  const tabs = [
    {
      id: 'accounts',
      label: 'Tài khoản Ngân hàng',
      icon: CreditCardIcon,
      description: 'Quản lý tài khoản nhận thanh toán'
    },
    {
      id: 'integration',
      label: 'Tích hợp Thanh toán',
      icon: BanknotesIcon,
      description: 'Xem kết nối với báo cáo doanh thu'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mr-3">
              <BanknotesIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quản lý Tài chính</h1>
              <p className="text-gray-600">Tài khoản ngân hàng và tích hợp thanh toán</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-2xl p-1 shadow-lg border border-gray-100 inline-flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  <div className="text-left">
                    <div className="text-sm font-medium">{tab.label}</div>
                    <div className={`text-xs ${activeTab === tab.id ? 'text-blue-100' : 'text-gray-500'}`}>
                      {tab.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div>
          {activeTab === 'accounts' && <BankAccountsPage />}
          {activeTab === 'integration' && (
            <BankAccountsWithReports>
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="text-center py-8">
                  <ChartBarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    Tích hợp với Báo cáo
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Xem thông tin thanh toán được kết nối với báo cáo doanh thu
                  </p>
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => setActiveTab('accounts')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Quản lý Tài khoản
                    </button>
                    <a
                      href="/hotel-owner/reports"
                      className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Xem Báo cáo
                    </a>
                  </div>
                </div>
              </div>
            </BankAccountsWithReports>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancialManagementPage;