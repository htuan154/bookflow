import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Shield, Eye, EyeOff, Lock, Camera, Upload } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import axiosClient from '../../config/axiosClient';
import { USER_ROLES } from '../../config/roles';
import { API_BASE_URL } from '../../config/constants';

const ProfilePage = () => {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Xác định màu sắc theo role
  const isAdmin = user?.roleId === USER_ROLES.ADMIN;
  const colorScheme = isAdmin ? {
    primary: 'orange',
    gradient: 'from-orange-500 to-red-600',
    bgGradient: 'from-orange-50 to-red-50',
    border: 'border-orange-200',
    text: 'text-orange-600',
    bg: 'bg-orange-50',
    hover: 'hover:bg-orange-100',
    button: 'from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700',
    icon: 'bg-orange-100 text-orange-600'
  } : {
    primary: 'blue',
    gradient: 'from-blue-500 to-indigo-600',
    bgGradient: 'from-blue-50 to-indigo-50',
    border: 'border-blue-200',
    text: 'text-blue-600',
    bg: 'bg-blue-50',
    hover: 'hover:bg-blue-100',
    button: 'from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700',
    icon: 'bg-blue-100 text-blue-600'
  };

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        address: user.address || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      // Load profile image if exists with full URL
      if (user.profilePictureUrl) {
        // If URL starts with /, prepend API_BASE_URL
        const imageUrl = user.profilePictureUrl.startsWith('http') 
          ? user.profilePictureUrl 
          : `${API_BASE_URL}${user.profilePictureUrl}`;
        console.log('Loading profile image:', imageUrl);
        setImagePreview(imageUrl);
      }
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('❌ Vui lòng chọn file ảnh hợp lệ');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('❌ Kích thước ảnh không được vượt quá 5MB');
        return;
      }

      setProfileImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Auto upload
      uploadProfileImage(file);
    }
  };

  const uploadProfileImage = async (file) => {
    setUploadingImage(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('profileImage', file);

      const response = await axiosClient.post(`/users/${user.userId}/profile-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setSuccess('✅ Cập nhật ảnh đại diện thành công!');
        
        // Update image preview with the new URL from server
        const newImageUrl = response.data.data.profilePictureUrl;
        const fullImageUrl = newImageUrl.startsWith('http') 
          ? newImageUrl 
          : `${API_BASE_URL}${newImageUrl}`;
        
        console.log('Upload successful! New image URL:', fullImageUrl);
        setImagePreview(fullImageUrl);
        
        // Optionally reload after 2 seconds to update all user data in context
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tải ảnh lên');
      // Reset image on error
      setProfileImage(null);
      if (user.profilePictureUrl) {
        const imageUrl = user.profilePictureUrl.startsWith('http') 
          ? user.profilePictureUrl 
          : `${API_BASE_URL}${user.profilePictureUrl}`;
        setImagePreview(imageUrl);
      } else {
        setImagePreview(null);
      }
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updateData = {
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        address: formData.address
      };

      const response = await axiosClient.patch(`/users/${user.userId}`, updateData);
      
      if (response.data.success) {
        setSuccess('✅ Cập nhật thông tin cá nhân thành công!');
        // Reload user data
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Validate passwords
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setError('Vui lòng điền đầy đủ thông tin mật khẩu');
      setLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Mật khẩu mới và xác nhận mật khẩu không khớp');
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      setLoading(false);
      return;
    }

    try {
      const response = await axiosClient.post('/auth/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });

      if (response.data.success) {
        setSuccess('✅ Đổi mật khẩu thành công!');
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
        setShowPasswordFields(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  const getRoleName = (roleId) => {
    switch(roleId) {
      case USER_ROLES.ADMIN: return 'Admin';
      case USER_ROLES.HOTEL_OWNER: return 'Chủ khách sạn';
      case USER_ROLES.USER: return 'Khách hàng';
      default: return 'Người dùng';
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${colorScheme.bgGradient} py-8 px-4`}>
      <div className="max-w-4xl mx-auto">
        {/* Header with Profile Picture */}
        <div className="mb-8 text-center">
          {/* Profile Picture Upload */}
          <div className="relative inline-block mb-4">
            <div className={`w-32 h-32 mx-auto rounded-full overflow-hidden shadow-xl border-4 ${colorScheme.border} bg-white`}>
              {imagePreview ? (
                <img 
                  src={`${imagePreview}?t=${Date.now()}`}
                  alt="Profile" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('Failed to load image:', imagePreview);
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${colorScheme.gradient} flex items-center justify-center`}>
                  <User className="w-16 h-16 text-white" />
                </div>
              )}
            </div>
            
            {/* Upload Button Overlay */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className={`absolute bottom-0 right-0 w-10 h-10 bg-gradient-to-br ${colorScheme.button} rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed`}
              title="Thay đổi ảnh đại diện"
            >
              {uploadingImage ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="w-5 h-5 text-white" />
              )}
            </button>
            
            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {user?.fullName || 'Hồ sơ cá nhân'}
          </h1>
          <p className="text-gray-600">
            Quản lý thông tin tài khoản của bạn
          </p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
            {success}
          </div>
        )}
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Card Header */}
          <div className={`bg-gradient-to-r ${colorScheme.gradient} px-6 py-5`}>
            <h2 className="text-xl font-bold text-white flex items-center">
              <Shield className="w-6 h-6 mr-2" />
              Thông tin tài khoản
            </h2>
          </div>

          {/* Card Body */}
          <div className="p-6">
            {/* Read-only Info */}
            <div className={`mb-6 p-4 ${colorScheme.bg} rounded-xl border ${colorScheme.border}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <div className={`w-10 h-10 ${colorScheme.icon} rounded-lg flex items-center justify-center mr-3`}>
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Tên đăng nhập</p>
                    <p className="font-semibold text-gray-900">{user?.username}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className={`w-10 h-10 ${colorScheme.icon} rounded-lg flex items-center justify-center mr-3`}>
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Vai trò</p>
                    <p className={`font-semibold ${colorScheme.text}`}>
                      {getRoleName(user?.roleId)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className={`w-10 h-10 ${colorScheme.icon} rounded-lg flex items-center justify-center mr-3`}>
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Ngày tạo tài khoản</p>
                    <p className="font-semibold text-gray-900">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className={`w-10 h-10 ${colorScheme.icon} rounded-lg flex items-center justify-center mr-3`}>
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Trạng thái</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user?.isActive ? '✓ Đang hoạt động' : '✗ Không hoạt động'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Editable Form */}
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Nhập họ và tên"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Nhập email"
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Nhập số điện thoại"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Địa chỉ
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Nhập địa chỉ"
                  />
                </div>
              </div>

              {/* Update Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-6 py-3 bg-gradient-to-r ${colorScheme.button} text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center`}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Đang cập nhật...
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5 mr-2" />
                      Cập nhật thông tin
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Change Password Section */}
        <div className="mt-6 bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Password Header */}
          <div className={`bg-gradient-to-r ${colorScheme.gradient} px-6 py-5 flex items-center justify-between cursor-pointer`}
               onClick={() => setShowPasswordFields(!showPasswordFields)}>
            <h2 className="text-xl font-bold text-white flex items-center">
              <Lock className="w-6 h-6 mr-2" />
              Đổi mật khẩu
            </h2>
            <span className="text-white text-2xl">
              {showPasswordFields ? '−' : '+'}
            </span>
          </div>

          {/* Password Form */}
          {showPasswordFields && (
            <div className="p-6">
              <form onSubmit={handleChangePassword} className="space-y-6">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Lock className="w-4 h-4 inline mr-2" />
                    Mật khẩu hiện tại
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors pr-12"
                      placeholder="Nhập mật khẩu hiện tại"
                      required={showPasswordFields}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Lock className="w-4 h-4 inline mr-2" />
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors pr-12"
                      placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                      required={showPasswordFields}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Lock className="w-4 h-4 inline mr-2" />
                    Xác nhận mật khẩu mới
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors pr-12"
                      placeholder="Nhập lại mật khẩu mới"
                      required={showPasswordFields}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Password Requirements */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <p className="text-sm text-yellow-800 mb-2 font-semibold">
                    ⚠️ Yêu cầu mật khẩu:
                  </p>
                  <ul className="text-xs text-yellow-700 space-y-1 list-disc list-inside">
                    <li>Tối thiểu 6 ký tự</li>
                    <li>Mật khẩu mới phải khác mật khẩu hiện tại</li>
                    <li>Mật khẩu mới và xác nhận phải khớp nhau</li>
                  </ul>
                </div>

                {/* Change Password Button */}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordFields(false);
                      setFormData(prev => ({
                        ...prev,
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      }));
                    }}
                    className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`px-6 py-3 bg-gradient-to-r ${colorScheme.button} text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center`}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5 mr-2" />
                        Đổi mật khẩu
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>© 2025 Bookflow Manager. Được thiết kế với ❤️ cho trải nghiệm tốt nhất.</p>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
