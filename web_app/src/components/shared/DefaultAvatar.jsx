import React from 'react';
import { User } from 'lucide-react';

/**
 * Default Avatar Component
 * Hiển thị ảnh mặc định với gradient màu theo role
 */
const DefaultAvatar = ({ roleId, size = 'md', className = '' }) => {
  // Xác định màu theo role (1=admin, 2=hotel_owner)
  const isAdmin = roleId === 1;
  const gradient = isAdmin 
    ? 'from-orange-500 to-red-600' 
    : 'from-blue-500 to-indigo-600';

  const sizes = {
    sm: 'w-12 h-12',
    md: 'w-32 h-32',
    lg: 'w-48 h-48'
  };

  const iconSizes = {
    sm: 6,
    md: 16,
    lg: 24
  };

  return (
    <div className={`${sizes[size]} bg-gradient-to-br ${gradient} rounded-full flex items-center justify-center ${className}`}>
      <User className={`w-${iconSizes[size]} h-${iconSizes[size]} text-white`} />
    </div>
  );
};

export default DefaultAvatar;
