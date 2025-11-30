// src/pages/admin/ChatBotAi/AdminDataSyncPage.jsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Utensils, Plus, Loader2, CheckCircle2, AlertCircle, Search, X } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import { addPlace, addDish, autocompleteProvince } from '../../../api/dataSync.service';

const cls = (...a) => a.filter(Boolean).join(' ');

// Component Toast (nếu chưa có)
const ToastComponent = ({ toast, onClose }) => {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        onClose();
      }, toast.duration || 3000);
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />,
    info: <AlertCircle className="w-5 h-5" />,
  };

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <div className={cls(
        'flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg min-w-[300px]',
        colors[toast.type] || colors.info
      )}>
        {icons[toast.type]}
        <span className="flex-1 font-medium">{toast.message}</span>
        <button onClick={onClose} className="hover:opacity-70">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Province Autocomplete Component
const ProvinceAutocomplete = ({ value, onChange, onSelect, placeholder }) => {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = async (e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    onChange(newQuery);

    if (newQuery.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    try {
      const response = await autocompleteProvince(newQuery);
      const results = response?.data || response?.suggestions || [];
      setSuggestions(results);
      setShowSuggestions(true);
    } catch (err) {
      console.error('Autocomplete error:', err);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (suggestion) => {
    const provinceName = suggestion.name || suggestion;
    setQuery(provinceName);
    onChange(provinceName);
    onSelect(provinceName);
    setShowSuggestions(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.length >= 2 && setShowSuggestions(true)}
          placeholder={placeholder}
          className="w-full px-4 py-3 pl-11 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500 animate-spin" />
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, idx) => {
            const name = suggestion.name || suggestion;
            return (
              <button
                key={idx}
                onClick={() => handleSelect(suggestion)}
                className="w-full px-4 py-3 text-left hover:bg-orange-50 transition-colors border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium text-gray-800">{name}</div>
                {suggestion.alias && (
                  <div className="text-sm text-gray-500 mt-0.5">{suggestion.alias}</div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Form Component
const DataForm = ({ type, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    province: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const { showSuccess, showError } = useToast();

  const isPlace = type === 'place';
  const Icon = isPlace ? MapPin : Utensils;
  const title = isPlace ? 'Thêm Địa Điểm Du Lịch' : 'Thêm Món Ăn Đặc Sản';
  const namePlaceholder = isPlace ? 'VD: Đại Nội Huế, Chùa Thiên Mụ...' : 'VD: Bún bò Huế, Bánh bèo...';
  const descPlaceholder = isPlace
    ? 'Mô tả địa điểm (tùy chọn)'
    : 'Mô tả món ăn (tùy chọn)';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.province.trim()) {
      showError('Vui lòng nhập đầy đủ tên và tỉnh/thành phố');
      return;
    }

    setSubmitting(true);
    setResult(null);

    try {
      const submitFn = isPlace ? addPlace : addDish;
      const response = await submitFn(formData);

      setResult({
        success: true,
        data: response.data,
      });

      showSuccess(`${isPlace ? 'Địa điểm' : 'Món ăn'} đã được thêm thành công!`);
      
      // Reset form
      setFormData({ name: '', province: '', description: '' });
      
      if (onSuccess) onSuccess(response);
    } catch (error) {
      const errorMsg = error?.response?.data?.message || error.message || 'Có lỗi xảy ra';
      setResult({
        success: false,
        error: errorMsg,
      });
      showError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({ name: '', province: '', description: '' });
    setResult(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            AI sẽ tự động sinh keywords và lưu vào database
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name Input */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Tên {isPlace ? 'Địa Điểm' : 'Món Ăn'} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={namePlaceholder}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            disabled={submitting}
          />
        </div>

        {/* Province Autocomplete */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Tỉnh/Thành Phố <span className="text-red-500">*</span>
          </label>
          <ProvinceAutocomplete
            value={formData.province}
            onChange={(value) => setFormData({ ...formData, province: value })}
            onSelect={(value) => setFormData({ ...formData, province: value })}
            placeholder="VD: Huế, Đà Nẵng, Hà Nội..."
          />
        </div>

        {/* Description Textarea */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Mô Tả
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder={descPlaceholder}
            rows={4}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none"
            disabled={submitting}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting || !formData.name.trim() || !formData.province.trim()}
            className={cls(
              'flex-1 h-12 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all shadow-sm',
              submitting || !formData.name.trim() || !formData.province.trim()
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 hover:shadow-md active:scale-95'
            )}
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Thêm {isPlace ? 'Địa Điểm' : 'Món Ăn'}
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleReset}
            disabled={submitting}
            className="px-6 h-12 rounded-lg font-semibold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Làm Mới
          </button>
        </div>
      </form>

      {/* Result Display */}
      {result && (
        <div className={cls(
          'mt-6 p-5 rounded-xl border-2 animate-fade-in',
          result.success
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        )}>
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className={cls(
                'font-semibold text-lg mb-2',
                result.success ? 'text-green-800' : 'text-red-800'
              )}>
                {result.success ? '✅ Thành công!' : '❌ Lỗi'}
              </div>
              
              {result.success && result.data && (
                <div className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <span className="font-medium text-green-700">Tên:</span>
                    <span className="text-green-900">{result.data.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-medium text-green-700">Tỉnh:</span>
                    <span className="text-green-900">{result.data.province}</span>
                  </div>
                  {result.data.keywords && (
                    <div className="flex gap-2">
                      <span className="font-medium text-green-700">Keywords AI:</span>
                      <span className="text-green-900 italic">{result.data.keywords}</span>
                    </div>
                  )}
                </div>
              )}

              {!result.success && (
                <div className="text-red-700">{result.error}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <div className="font-semibold mb-1">💡 Lưu ý:</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>AI sẽ tự động sinh keywords chuyên biệt (mất ~3-5 giây)</li>
              <li>Dữ liệu được lưu song song: MongoDB + Supabase Vector</li>
              <li>Chatbot sẽ tự động tìm được dữ liệu mới</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Page Component
export default function AdminDataSyncPage() {
  const [activeTab, setActiveTab] = useState('place');
  const { toast, hideToast, showSuccess } = useToast();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🤖 AI Data Sync Dashboard
          </h1>
          <p className="text-gray-600">
            Quản lý dữ liệu địa điểm và món ăn cho Chatbot du lịch
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setActiveTab('place')}
            className={cls(
              'flex-1 h-14 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-sm',
              activeTab === 'place'
                ? 'bg-white text-orange-600 shadow-md border-2 border-orange-500'
                : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-gray-300'
            )}
          >
            <MapPin className="w-5 h-5" />
            Địa Điểm Du Lịch
          </button>

          <button
            onClick={() => setActiveTab('dish')}
            className={cls(
              'flex-1 h-14 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-sm',
              activeTab === 'dish'
                ? 'bg-white text-orange-600 shadow-md border-2 border-orange-500'
                : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-gray-300'
            )}
          >
            <Utensils className="w-5 h-5" />
            Món Ăn Đặc Sản
          </button>
        </div>

        {/* Form Content */}
        <div className="animate-fade-in">
          {activeTab === 'place' && (
            <DataForm type="place" onSuccess={() => showSuccess('Địa điểm đã được thêm!')} />
          )}
          {activeTab === 'dish' && (
            <DataForm type="dish" onSuccess={() => showSuccess('Món ăn đã được thêm!')} />
          )}
        </div>

        {/* Stats/Info Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <div className="text-sm font-semibold text-gray-600 mb-1">⚡ Tốc độ xử lý</div>
            <div className="text-2xl font-bold text-gray-800">~3-5s</div>
            <div className="text-xs text-gray-500 mt-1">Mỗi request</div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <div className="text-sm font-semibold text-gray-600 mb-1">🗄️ Lưu trữ</div>
            <div className="text-2xl font-bold text-gray-800">2x</div>
            <div className="text-xs text-gray-500 mt-1">MongoDB + Supabase</div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <div className="text-sm font-semibold text-gray-600 mb-1">🤖 AI Model</div>
            <div className="text-2xl font-bold text-gray-800">Ollama</div>
            <div className="text-xs text-gray-500 mt-1">qwen2.5:3b-instruct</div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <ToastComponent toast={toast} onClose={hideToast} />

      {/* CSS Animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
