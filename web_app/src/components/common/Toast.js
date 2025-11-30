import React, { useEffect } from 'react';

const Toast = ({ message, type = 'info', onClose, duration = 3000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 text-green-800';
      case 'error':
        return 'bg-gradient-to-r from-red-50 to-rose-50 border-red-300 text-red-800';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300 text-yellow-800';
      case 'info':
      default:
        return 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 text-blue-800';
    }
  };

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .toast-slide-in {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
      <div className="fixed top-4 right-4 z-[9999] toast-slide-in">
        <div className={`px-6 py-4 rounded-xl shadow-2xl border-2 flex items-center space-x-3 min-w-[300px] max-w-[500px] ${getTypeStyles()}`}>
          <div className="text-base font-semibold flex-1">{message}</div>
          <button 
            onClick={onClose}
            className="ml-2 text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0 text-xl font-bold"
          >
            ✕
          </button>
        </div>
      </div>
    </>
  );
};

export default Toast;
