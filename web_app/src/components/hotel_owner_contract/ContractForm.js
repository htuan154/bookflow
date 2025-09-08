// src/pages/hotel_owner/contract_management/ContractForm.js
import React, { useState, useEffect } from 'react';

const initialState = {
  title: '',
  description: '',
  contract_type: 'Business',
  contract_value: '',
  currency: 'VND',
  start_date: '',
  end_date: '',
  payment_terms: '',
  terms_and_conditions: '',
  notes: '',
  signed_date: '',
  contract_file_url: '',
  hotel_id: '',
};

const ContractForm = ({ onSave, onCancel, contract = null, hotels = [] }) => {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // FIXED useEffect - xử lý dữ liệu contract đúng cách
  useEffect(() => {
    console.log('=== CONTRACTFORM useEffect ===');
    console.log('Contract prop:', contract);
    
    if (contract && typeof contract === 'object') {
      console.log('Setting form with contract data');
      
      // Helper function để chuẩn hóa ngày
      const normalizeDate = (dateValue) => {
        if (!dateValue) return '';
        
        // Nếu đã là định dạng YYYY-MM-DD
        if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
          return dateValue;
        }
        
        // Nếu có timestamp hoặc ISO string
        if (typeof dateValue === 'string' && dateValue.includes('T')) {
          return dateValue.split('T')[0];
        }
        
        // Thử parse Date
        try {
          const date = new Date(dateValue);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
          }
        } catch (e) {
          console.warn('Invalid date:', dateValue);
        }
        
        return '';
      };

      const formData = {
        title: contract.title || '',
        description: contract.description || '',
        contract_type: contract.contract_type || 'Business',
        contract_value: String(contract.contract_value || ''),
        currency: contract.currency || 'VND',
        start_date: normalizeDate(contract.start_date),
        end_date: normalizeDate(contract.end_date),
        payment_terms: contract.payment_terms || '',
        terms_and_conditions: contract.terms_and_conditions || '',
        notes: contract.notes || '',
        signed_date: normalizeDate(contract.signed_date),
        contract_file_url: contract.contract_file_url || '',
        hotel_id: contract.hotel_id || '',
      };
      
      console.log('Normalized form data:', formData);
      setForm(formData);
    } else {
      console.log('No contract or invalid contract, resetting form');
      setForm(initialState);
    }
  }, [contract]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await onSave(form);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto max-h-[85vh] overflow-y-auto">
      <h3 className="text-xl font-bold mb-4 text-blue-700">
        {contract?.contract_id ? 'Chỉnh sửa hợp đồng' : 'Tạo hợp đồng mới'}
      </h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block font-semibold mb-1 text-gray-700">Tiêu đề hợp đồng *</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            placeholder="Nhập tiêu đề hợp đồng"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block font-semibold mb-1 text-gray-700">Loại hợp đồng *</label>
          <select
            name="contract_type"
            value={form.contract_type}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            required
          >
            <option value="Business">Business</option>
            {/* Nếu muốn cho nhiều loại, cần backend hỗ trợ */}
            {/* <option value="service">Hợp đồng dịch vụ</option>
            <option value="partnership">Hợp đồng hợp tác</option>
            <option value="booking">Hợp đồng đặt phòng</option>
            <option value="maintenance">Hợp đồng bảo trì</option> */}
          </select>
        </div>

        <div className="mb-4">
          <label className="block font-semibold mb-1 text-gray-700">Mô tả</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            rows={3}
            placeholder="Mô tả chi tiết hợp đồng"
          />
        </div>

        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold mb-1 text-gray-700">Giá trị hợp đồng *</label>
            <input
              type="number"
              name="contract_value"
              value={form.contract_value}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              placeholder="0"
              min="0"
              step="1000"
              required
            />
          </div>
          <div>
            <label className="block font-semibold mb-1 text-gray-700">Loại tiền</label>
            <select
              name="currency"
              value={form.currency}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="VND">VND</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold mb-1 text-gray-700">Ngày bắt đầu *</label>
            <input
              type="date"
              name="start_date"
              value={form.start_date}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block font-semibold mb-1 text-gray-700">Ngày kết thúc *</label>
            <input
              type="date"
              name="end_date"
              value={form.end_date}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              required
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block font-semibold mb-1 text-gray-700">Chọn khách sạn *</label>
          <select
            name="hotel_id"
            value={form.hotel_id}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            required
          >
            <option value="">-- Chọn khách sạn --</option>
            {hotels.map(hotel => (
              <option key={hotel.hotel_id} value={hotel.hotel_id}>
                {hotel.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block font-semibold mb-1 text-gray-700">Ngày ký hợp đồng</label>
          <input
            type="date"
            name="signed_date"
            value={form.signed_date}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="block font-semibold mb-1 text-gray-700">Điều khoản thanh toán</label>
          <textarea
            name="payment_terms"
            value={form.payment_terms}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            rows={2}
            placeholder="Ví dụ: Thanh toán 50% trước, 50% sau khi hoàn thành"
          />
        </div>

        <div className="mb-4">
          <label className="block font-semibold mb-1 text-gray-700">Điều khoản & điều kiện</label>
          <textarea
            name="terms_and_conditions"
            value={form.terms_and_conditions}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            rows={3}
            placeholder="Các điều khoản và điều kiện của hợp đồng"
          />
        </div>

        <div className="mb-4">
          <label className="block font-semibold mb-1 text-gray-700">Link file hợp đồng</label>
          <input
            type="url"
            name="contract_file_url"
            value={form.contract_file_url}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            placeholder="https://example.com/contract.pdf"
          />
        </div>

        <div className="mb-6">
          <label className="block font-semibold mb-1 text-gray-700">Ghi chú</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            rows={2}
            placeholder="Ghi chú thêm"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            className="px-6 py-2 rounded bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold disabled:opacity-50"
            onClick={onCancel}
            disabled={loading}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-6 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Đang lưu...' : (contract?.contract_id ? 'Cập nhật' : 'Lưu nháp')}
          </button>
        </div>
      </form>
    </div>
  );
};


export default ContractForm;

