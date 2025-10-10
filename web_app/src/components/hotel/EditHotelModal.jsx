import React, { useState, useEffect } from 'react';

const EditHotelModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  // Hàm tách phường ra khỏi địa chỉ nếu có dạng "Phường..., địa chỉ chi tiết"
  function parseAddress(address) {
    if (!address) return { ward: '', address: '' };
    const parts = address.split(',');
    if (parts.length > 1) {
      return {
        ward: parts[0].trim(),
        address: parts.slice(1).join(',').trim(),
      };
    }
    return { ward: '', address: address.trim() };
  }

  // Tách địa chỉ ban đầu
  const parsed = parseAddress(initialData?.address);
  
  const [form, setForm] = useState({
    name: initialData?.name || '',
    description: initialData?.description || 'Mô tả khách sạn sẽ được cập nhật sau',
    address: parsed.address,
    ward: initialData?.ward || parsed.ward,
    city: initialData?.city || '',
    phoneNumber: initialData?.phoneNumber || '',
    email: initialData?.email || '',
    checkInTime: initialData?.checkInTime || '14:00',
    checkOutTime: initialData?.checkOutTime || '12:00',
    starRating: initialData?.starRating || 1,
    status: initialData?.status || 'active',
  });

  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingWards, setLoadingWards] = useState(false);
  const [provinceFilter, setProvinceFilter] = useState("");
  const [wardFilter, setWardFilter] = useState("");
  // Hàm bỏ dấu tiếng Việt
  function removeVietnameseDiacritics(str) {
    str = str.normalize("NFD").replace(/\u0300-\u036f/g, "");
    const vietnamese =
      "àáạảãâầấậẩẫăằắặẳẵ" +
      "èéẹẻẽêềếệểễ" +
      "ìíịỉĩ" +
      "òóọỏõôồốộổỗơờớợởỡ" +
      "ùúụủũưừứựửữ" +
      "ỳýỵỷỹ" +
      "đ" +
      "ÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴ" +
      "ÈÉẸẺẼÊỀẾỆỂỄ" +
      "ÌÍỊỈĨ" +
      "ÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠ" +
      "ÙÚỤỦŨƯỪỨỰỬỮ" +
      "ỲÝỴỶỸ" +
      "Đ";
    const without =
      "aaaaaaaaaaaaaaaaa" +
      "eeeeeeeeeee" +
      "iiiii" +
      "ooooooooooooooooo" +
      "uuuuuuuuuuu" +
      "yyyyy" +
      "d" +
      "AAAAAAAAAAAAAAAAA" +
      "EEEEEEEEEEE" +
      "IIIII" +
      "OOOOOOOOOOOOOOOOO" +
      "UUUUUUUUUUU" +
      "YYYYY" +
      "D";
    let result = str;
    for (let i = 0; i < vietnamese.length; i++) {
      result = result.replaceAll(vietnamese[i], without[i]);
    }
    return result;
  }

  useEffect(() => {
    // Lấy danh sách tỉnh/thành phố từ API
    fetch('https://vietnamlabs.com/api/vietnamprovince')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProvinces(data.data);
        }
      })
      .finally(() => setLoadingProvinces(false));
  }, []);

  useEffect(() => {
    // Khi chọn thành phố, cập nhật danh sách phường
    if (form.city) {
      setLoadingWards(true);
      const selected = provinces.find(p => p.province === form.city);
      const wardList = selected ? selected.wards.map(w => w.name) : [];
      setWards(wardList);
      setLoadingWards(false);
      // Chỉ reset ward nếu ward hiện tại không có trong danh sách phường mới
      setForm(prev => ({
        ...prev,
        ward: wardList.includes(prev.ward) ? prev.ward : ''
      }));
    } else {
      setWards([]);
      setForm(prev => ({ ...prev, ward: '' }));
    }
  }, [form.city, provinces]);

  useEffect(() => {
    // Khi có initialData và provinces đã load, tự động fill form
    if (initialData && provinces.length > 0) {
      const parsed = parseAddress(initialData.address);
      const wardValue = initialData.ward || parsed.ward;
      
      // Cập nhật form với dữ liệu ban đầu
      setForm({
        name: initialData.name || '',
        description: initialData.description || 'Mô tả khách sạn sẽ được cập nhật sau',
        address: parsed.address,
        ward: wardValue,
        city: initialData.city || '',
        phoneNumber: initialData.phoneNumber || '',
        email: initialData.email || '',
        checkInTime: initialData.checkInTime || '14:00',
        checkOutTime: initialData.checkOutTime || '12:00',
        starRating: initialData.starRating || 1,
        status: initialData.status || 'active',
      });

      // Nếu có city, load danh sách phường
      if (initialData.city) {
        const selected = provinces.find(p => p.province === initialData.city);
        if (selected) {
          const wardList = selected.wards.map(w => w.name);
          setWards(wardList);
          // Chỉ set ward nếu nó có trong danh sách
          if (wardList.includes(wardValue)) {
            setForm(prev => ({ ...prev, ward: wardValue }));
          }
        }
      }
    }
    // eslint-disable-next-line
  }, [initialData, provinces]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // address gửi về là "phường, địa chỉ chi tiết"
    const submitData = {
      ...form,
      address: form.ward ? `${form.ward}, ${form.address}` : form.address,
      city: form.city,
    };
    onSubmit(submitData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          ×
        </button>
        <h2 className="text-xl font-bold mb-4">Chỉnh sửa thông tin khách sạn</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium">Tên khách sạn</label>
          <input name="name" value={form.name} onChange={handleChange} className="w-full border rounded px-3 py-2" placeholder="Tên khách sạn" required minLength={3} maxLength={100} />

          <label className="block text-sm font-medium">Mô tả khách sạn</label>
          <textarea name="description" value={form.description} onChange={handleChange} className="w-full border rounded px-3 py-2" placeholder="Mô tả khách sạn (tối thiểu 10 ký tự)" rows={3} required minLength={10} maxLength={1000} />

          <label className="block text-sm font-medium">Thành phố</label>
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 border rounded px-3 py-2"
              placeholder="Lọc thành phố (bỏ dấu)"
              value={provinceFilter}
              onChange={e => setProvinceFilter(e.target.value)}
            />
            <select
              name="city"
              value={form.city}
              onChange={handleChange}
              className="flex-1 border rounded px-3 py-2"
              required
              disabled={loadingProvinces}
            >
              <option value="">Chọn thành phố</option>
              {provinces
                .filter(p => {
                  if (!provinceFilter) return true;
                  const kw = removeVietnameseDiacritics(provinceFilter).toLowerCase();
                  return removeVietnameseDiacritics(p.province).toLowerCase().includes(kw);
                })
                .map((p) => (
                  <option key={p.id} value={p.province}>{p.province}</option>
                ))}
            </select>
          </div>

          <label className="block text-sm font-medium">Phường</label>
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 border rounded px-3 py-2"
              placeholder="Lọc phường (bỏ dấu)"
              value={wardFilter}
              onChange={e => setWardFilter(e.target.value)}
              disabled={!form.city || loadingWards}
            />
            <select
              name="ward"
              value={form.ward}
              onChange={handleChange}
              className="flex-1 border rounded px-3 py-2"
              required
              disabled={!form.city || loadingWards}
            >
              <option value="">Chọn phường</option>
              {wards
                .filter(w => {
                  if (!wardFilter) return true;
                  const kw = removeVietnameseDiacritics(wardFilter).toLowerCase();
                  return removeVietnameseDiacritics(w).toLowerCase().includes(kw);
                })
                .map((w, idx) => (
                  <option key={idx} value={w}>{w}</option>
                ))}
            </select>
          </div>

          <label className="block text-sm font-medium">Địa chỉ</label>
          <input name="address" value={form.address} onChange={handleChange} className="w-full border rounded px-3 py-2" placeholder="Địa chỉ chi tiết (tối thiểu 10 ký tự)" required minLength={10} maxLength={200} />

          <label className="block text-sm font-medium">Số điện thoại</label>
          <input name="phoneNumber" value={form.phoneNumber} onChange={handleChange} className="w-full border rounded px-3 py-2" placeholder="Số điện thoại (10-15 số)" required minLength={10} maxLength={15} />

          <label className="block text-sm font-medium">Email</label>
          <input name="email" value={form.email} onChange={handleChange} className="w-full border rounded px-3 py-2" placeholder="Email" type="email" required />

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
          {/* Trường trạng thái */}
          <div>
            <label className="block text-sm mb-1">Trạng thái</label>
            {form.status === 'active' ? (
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
              >
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Ngừng hoạt động</option>
              </select>
            ) : (
              <input
                type="text"
                value={form.status}
                readOnly
                className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-500"
              />
            )}
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-semibold">Lưu thông tin</button>
        </form>
      </div>
    </div>
  );
};

export default EditHotelModal;
