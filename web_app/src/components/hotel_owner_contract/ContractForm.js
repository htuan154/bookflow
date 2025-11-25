// src/pages/hotel_owner/contract_management/ContractForm.js
import React, { useState, useEffect } from 'react';
import useAuth from '../../hooks/useAuth';
import useHotel from '../../hooks/useHotel';
import { useToast } from '../../hooks/useToast';
import Toast from '../common/Toast';

// Helper to get default start_date: today + 7 days
const getDefaultStartDate = () => {
  const today = new Date();
  today.setDate(today.getDate() + 7);
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// Helper to get minimum allowed start date (today + 7)
const getMinStartDate = () => {
  const today = new Date();
  today.setDate(today.getDate() + 7);
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// Helper to get minimum allowed end date (start_date + 30 days)
const getMinEndDate = (startDate) => {
  if (!startDate) return '';
  const start = new Date(startDate);
  start.setDate(start.getDate() + 30);
  const yyyy = start.getFullYear();
  const mm = String(start.getMonth() + 1).padStart(2, '0');
  const dd = String(start.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const initialState = {
  title: '',
  description: '',
  contract_type: 'Business',
  contract_value: '',
  currency: 'Phần trăm',
  start_date: getDefaultStartDate(), // Mặc định là hôm nay + 7
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
  const { user } = useAuth();
  const ownerId = user?.user_id || user?.id || user?.userId;
  const { activeApprovedHotels, fetchActiveApprovedHotels } = useHotel();
  const { toast, showWarning, hideToast } = useToast();

  // FIXED useEffect - xử lý dữ liệu contract đúng cách
  useEffect(() => {
    // Fetch owner's active/approved hotels for the dropdown
    if (ownerId) {
      try {
        fetchActiveApprovedHotels(ownerId);
      } catch (e) {
        // ignore
      }
    }
    if (contract && typeof contract === 'object') {
      // Helper function để chuẩn hóa ngày
      const normalizeDate = (dateValue) => {
        if (!dateValue) return '';
        if (typeof dateValue === 'string') {
          // Nếu có 'T' thì lấy phần trước 'T', còn lại giữ nguyên chuỗi trả về từ server
          return dateValue.includes('T') ? dateValue.split('T')[0] : dateValue;
        }
        return '';
      };
      // Lấy ngày bắt đầu từ contract
      let contractStartDate = normalizeDate(contract.start_date) || getDefaultStartDate();
      // Nếu đang edit và ngày bắt đầu < hôm nay+7 thì tự động set về hôm nay+7
      const minStartDate = getMinStartDate();
      if (contractStartDate && contractStartDate < minStartDate) {
        contractStartDate = minStartDate;
      }
      // Lấy ngày kết thúc từ contract
      let contractEndDate = normalizeDate(contract.end_date);
      // Nếu ngày kết thúc < ngày bắt đầu + 30 thì set về start_date + 30
      if (contractEndDate && contractStartDate) {
        const minEndDate = getMinEndDate(contractStartDate);
        if (contractEndDate < minEndDate) {
          contractEndDate = minEndDate;
        }
      }
      const formData = {
        title: contract.title || '',
        description: contract.description || '',
        contract_type: contract.contract_type || 'Business',
        contract_value: String(contract.contract_value || ''),
        currency: contract.currency || 'Phần trăm',
        start_date: contractStartDate,
        end_date: contractEndDate,
        payment_terms: contract.payment_terms || '',
        terms_and_conditions: contract.terms_and_conditions || '',
        notes: contract.notes || '',
        signed_date: normalizeDate(contract.signed_date),
        contract_file_url: contract.contract_file_url || '',
        hotel_id: contract.hotel_id || '',
      };
      setForm(formData);
    } else {
      // Reset form với start_date mặc định là hôm nay + 7
      setForm({ ...initialState, start_date: getDefaultStartDate() });
    }
  }, [contract, ownerId, fetchActiveApprovedHotels]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Cho phép nhập tự do cho contract_value
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === 'start_date' && value) {
      // Chỉ cho chọn từ ngày hôm nay + 7 trở đi
      const minDate = new Date(getMinStartDate());
      const selectedDate = new Date(value);
      minDate.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);
      if (selectedDate < minDate) {
        showWarning(`Ngày bắt đầu phải từ ${getMinStartDate()} trở đi!`);
        return;
      }
    }
    if (name === 'end_date' && value) {
      // Kiểm tra ngày kết thúc phải sau ngày bắt đầu ít nhất 30 ngày
      if (form.start_date) {
        const minEndDate = new Date(getMinEndDate(form.start_date));
        const selectedEndDate = new Date(value);
        minEndDate.setHours(0, 0, 0, 0);
        selectedEndDate.setHours(0, 0, 0, 0);
        if (selectedEndDate < minEndDate) {
          showWarning(`Ngày kết thúc phải sau ngày bắt đầu ít nhất 30 ngày (từ ${getMinEndDate(form.start_date)} trở đi)!`);
          return;
        }
      }
      // Kiểm tra ngày kết thúc không được trước ngày hiện tại
      const today = new Date();
      const selectedEndDate = new Date(value);
      today.setHours(0, 0, 0, 0);
      selectedEndDate.setHours(0, 0, 0, 0);
      if (selectedEndDate < today) {
        showWarning('Ngày kết thúc không thể trước ngày hiện tại!');
        return;
      }
    }
  };

  // Khi blur input hoa hồng thì kiểm tra và điều chỉnh về 5-20 nếu ngoài khoảng
  const handleCommissionBlur = (e) => {
    let val = e.target.value;
    if (val === '') return;
    let num = parseFloat(val);
    if (isNaN(num)) num = 5;
    if (num > 20) num = 20;
    if (num < 5) num = 5;
    if (num !== parseFloat(form.contract_value)) {
      setForm(prev => ({ ...prev, contract_value: num }));
    }
  };

  // Hàm lấy min cho ngày bắt đầu (hôm nay + 7)
  const getStartDateMin = () => {
    return getMinStartDate();
  };

  // Hàm lấy min cho ngày kết thúc
  const getEndDateMin = () => {
    if (form.start_date) {
      // Nếu có ngày bắt đầu, min là start_date + 30 ngày
      return getMinEndDate(form.start_date);
    }
    // Nếu chưa có ngày bắt` đầu, min là ngày hiện tại + 7
    return getMinStartDate();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Kiểm tra tiêu đề hợp đồng phải dài ít nhất 5 ký tự
    if (!form.title || form.title.trim().length < 5) {
      setError('Tiêu đề hợp đồng phải dài ít nhất 5 ký tự!');
      setLoading(false);
      return;
    }
    // Kiểm tra tỷ lệ hoa hồng phải từ 5-20
    let commissionValue = parseFloat(form.contract_value);
    if (isNaN(commissionValue)) commissionValue = 5;
    if (commissionValue < 5) commissionValue = 5;
    if (commissionValue > 20) commissionValue = 20;
    if (commissionValue !== parseFloat(form.contract_value)) {
      setForm(prev => ({ ...prev, contract_value: commissionValue }));
      setError('Tỷ lệ hoa hồng chỉ cho phép từ 5 đến 20%. Đã tự động điều chỉnh!');
      setLoading(false);
      return;
    }
    
    // Kiểm tra ngày bắt đầu phải từ hôm nay + 7 ngày trở đi
    const minStartDate = new Date(getMinStartDate());
    const selectedStartDate = new Date(form.start_date);
    minStartDate.setHours(0, 0, 0, 0);
    selectedStartDate.setHours(0, 0, 0, 0);
    
    if (selectedStartDate < minStartDate) {
      setError(`Ngày bắt đầu phải từ ${getMinStartDate()} (hôm nay + 7 ngày) trở đi. Vui lòng chọn lại!`);
      setLoading(false);
      return;
    }
    
    try {
      // Ensure hotel_id is a trimmed string (backend expects a UUID string)
      const cleaned = {
        ...form,
        hotel_id: form.hotel_id ? String(form.hotel_id).trim() : '',
        // ensure numeric commission if backend expects number
        contract_value: form.contract_value === '' || form.contract_value === null
          ? null
          : Number(form.contract_value),
      };
      await onSave(cleaned);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto max-h-[85vh] overflow-y-auto relative">
      {/* Nút tắt (X) ở góc trên phải */}
      <button
        type="button"
        aria-label="Đóng"
        onClick={onCancel}
        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 focus:outline-none z-10"
        style={{ lineHeight: 0 }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 6L14 14M14 6L6 14" stroke="#374151" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
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

        <div className="mb-4">
          <label className="block font-semibold mb-1 text-gray-700">Hoa hồng (%) *</label>
          <div className="relative">
            <input
              type="number"
              name="contract_value"
              value={form.contract_value}
              onChange={handleChange}
              onBlur={handleCommissionBlur}
              className="w-full border border-gray-300 rounded px-3 py-2 pr-10 focus:outline-none focus:border-blue-500"
              placeholder="10"
              min="5"
              max="20"
              step="0.1"
              required
            />
            <span className="absolute right-3 top-2 text-gray-500 font-semibold">%</span>
          </div>
          <small className="text-gray-500 text-xs mt-1 block">
            Nhập tỷ lệ hoa hồng từ 5 đến 20%
          </small>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold mb-1 text-gray-700">Ngày bắt đầu *</label>
            <input
              type="date"
              name="start_date"
              value={form.start_date}
              onChange={handleChange}
              min={getStartDateMin()}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              required
            />
            <small className="text-gray-500 text-xs mt-1 block">
              {`Ngày bắt đầu mặc định là ${getDefaultStartDate()} (hôm nay + 7 ngày). Có thể chọn từ ngày ${getMinStartDate()} trở đi.`}
            </small>
          </div>
          <div>
            <label className="block font-semibold mb-1 text-gray-700">Ngày kết thúc *</label>
            <input
              type="date"
              name="end_date"
              value={form.end_date}
              onChange={handleChange}
              min={getEndDateMin()}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              required
            />
            <small className="text-gray-500 text-xs mt-1 block">
              {form.start_date 
                ? `Ngày kết thúc phải sau ngày bắt đầu ít nhất 30 ngày (từ ${getMinEndDate(form.start_date)} trở đi).`
                : 'Vui lòng chọn ngày bắt đầu trước.'
              }
            </small>
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
            disabled={!!contract?.contract_id}
          >
            <option value="">-- Chọn khách sạn --</option>
            {(activeApprovedHotels && activeApprovedHotels.length > 0 ? activeApprovedHotels : hotels).map((hotel, idx) => {
              const key = hotel?.hotel_id || hotel?.hotelId || hotel?.id || `hotel-${idx}`;
              const value = hotel?.hotel_id || hotel?.hotelId || hotel?.id || '';
              return (
                <option key={key} value={value}>
                  {`${hotel.name || hotel.title || ''}${hotel.city ? ' - ' + hotel.city : ''}${hotel.status ? ' (' + hotel.status + ')' : ''}`}
                </option>
              );
            })}
          </select>
        </div>

        {/* Đã xoá trường Ngày ký hợp đồng */}

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
      
      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          duration={toast.duration}
        />
      )}
    </div>
  );
};

export default ContractForm;

