// src/components/promotions/PromotionValidation.jsx
import React, { useState } from 'react';
import { usePromotionValidation } from '../../hooks/usePromotions';

const PromotionValidation = ({ onValidation }) => {
  const [code, setCode] = useState('');
  const [bookingInfo, setBookingInfo] = useState({
    totalAmount: 0,
    hotelId: null,
    checkIn: '',
    checkOut: ''
  });

  const {
    validateCode,
    validationResult,
    isLoading,
    isCodeValid,
    validationMessage,
    discountAmount,
    resetValidation
  } = usePromotionValidation();

  const handleValidate = async () => {
    if (!code.trim()) return;
    
    try {
      const result = await validateCode(code, bookingInfo);
      if (onValidation) {
        onValidation(result);
      }
    } catch (error) {
      console.error('Validation error:', error);
    }
  };

  const handleReset = () => {
    setCode('');
    resetValidation();
  };

  return (
    <div className="bg-white p-6 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">Kiểm tra mã khuyến mãi</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mã khuyến mãi
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Nhập mã khuyến mãi"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleValidate}
              disabled={!code.trim() || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Đang kiểm tra...' : 'Kiểm tra'}
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Đặt lại
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tổng tiền
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={bookingInfo.totalAmount}
              onChange={(e) => setBookingInfo(prev => ({
                ...prev,
                totalAmount: parseFloat(e.target.value) || 0
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Khách sạn ID
            </label>
            <input
              type="number"
              value={bookingInfo.hotelId || ''}
              onChange={(e) => setBookingInfo(prev => ({
                ...prev,
                hotelId: parseInt(e.target.value) || null
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {validationResult && (
          <div className={`p-4 rounded-md ${
            isCodeValid 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className={`text-sm font-medium ${
              isCodeValid ? 'text-green-800' : 'text-red-800'
            }`}>
              {validationMessage}
            </div>
            {isCodeValid && discountAmount && (
              <div className="mt-2 text-sm text-green-700">
                Số tiền được giảm: {discountAmount}₫
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PromotionValidation;