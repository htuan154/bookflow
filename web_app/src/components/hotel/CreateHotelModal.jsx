import React, { useState } from 'react';

const CreateHotelModal = ({ isOpen, onClose, onSubmit }) => {
  const [form, setForm] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    phoneNumber: '',
    email: '',
    checkInTime: '14:00',
    checkOutTime: '12:00',
    starRating: 1,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          ×
        </button>
        <h2 className="text-xl font-bold mb-4">Đăng ký khách sạn mới</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="name" value={form.name} onChange={handleChange} className="w-full border rounded px-3 py-2" placeholder="Tên khách sạn" required />
          <textarea name="description" value={form.description} onChange={handleChange} className="w-full border rounded px-3 py-2" placeholder="Mô tả" rows={2} />
          <input name="address" value={form.address} onChange={handleChange} className="w-full border rounded px-3 py-2" placeholder="Địa chỉ" required />
          <input name="city" value={form.city} onChange={handleChange} className="w-full border rounded px-3 py-2" placeholder="Thành phố" required />
          <input name="phoneNumber" value={form.phoneNumber} onChange={handleChange} className="w-full border rounded px-3 py-2" placeholder="Số điện thoại" required />
          <input name="email" value={form.email} onChange={handleChange} className="w-full border rounded px-3 py-2" placeholder="Email" type="email" />
          {/* <input name="website" value={form.website} onChange={handleChange} className="w-full border rounded px-3 py-2" placeholder="Website" /> */}
          <div>
            <label className="block text-sm mb-1">Hạng sao</label>
            <select name="starRating" value={form.starRating} onChange={handleChange} className="w-full border rounded px-3 py-2">
              {[1,2,3,4,5].map(star => (
                <option key={star} value={star}>{star} sao</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm mb-1">Nhận phòng</label>
              <input name="checkInTime" value={form.checkInTime} onChange={handleChange} className="w-full border rounded px-3 py-2" type="time" />
            </div>
            <div className="flex-1">
              <label className="block text-sm mb-1">Trả phòng</label>
              <input name="checkOutTime" value={form.checkOutTime} onChange={handleChange} className="w-full border rounded px-3 py-2" type="time" />
            </div>
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-semibold">Tạo khách sạn</button>
        </form>
      </div>
    </div>
  );
};

export default CreateHotelModal;
