// src/pages/admin/AmenityManagement/AmenityManagementPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, RefreshCw, Loader2 } from 'lucide-react';
import useAmenity from '../../../hooks/useAmenity';
import { ActionButtonsGroup } from '../../../components/common/ActionButton';
import AmenityCreateModal from './AmenityCreateModal';
import AmenityEditModal from './AmenityEditModal';
import AmenityViewModal from './AmenityViewModal';

const AmenityManagementPage = () => {
  const { amenities, loading, error, getAmenities, deleteAmenity, clearLocalError } = useAmenity();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filteredAmenities, setFilteredAmenities] = useState([]);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedAmenity, setSelectedAmenity] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, amenityId: null, name: '' });

  // Load amenities on mount
  useEffect(() => {
    loadAmenities();
  }, []);

  const loadAmenities = async () => {
    try {
      await getAmenities({ page: 1, limit: 1000 }); // Load all
    } catch (err) {
      console.error('Error loading amenities:', err);
    }
  };

  // Filter amenities based on search
  useEffect(() => {
    if (!amenities || amenities.length === 0) {
      setFilteredAmenities([]);
      return;
    }

    const filtered = amenities.filter(amenity => {
      const searchLower = searchTerm.toLowerCase().trim();
      return (
        amenity.name?.toLowerCase().includes(searchLower) ||
        amenity.description?.toLowerCase().includes(searchLower)
      );
    });

    setFilteredAmenities(filtered);
    setCurrentPage(1); // Reset to first page when search changes
  }, [searchTerm, amenities]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAmenities.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAmenities.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // CRUD Handlers
  const handleView = (amenity) => {
    setSelectedAmenity(amenity);
    setShowViewModal(true);
  };

  const handleEdit = (amenity) => {
    setSelectedAmenity(amenity);
    setShowEditModal(true);
  };

  const handleDeleteClick = (amenity) => {
    setDeleteConfirm({
      show: true,
      amenityId: amenity.amenityId,
      name: amenity.name
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteAmenity(deleteConfirm.amenityId);
      setDeleteConfirm({ show: false, amenityId: null, name: '' });
      await loadAmenities(); // Reload list
    } catch (err) {
      console.error('Error deleting amenity:', err);
      alert('Lỗi khi xóa tiện nghi: ' + err.message);
    }
  };

  const handleCreateSuccess = async () => {
    setShowCreateModal(false);
    await loadAmenities();
  };

  const handleEditSuccess = async () => {
    setShowEditModal(false);
    setSelectedAmenity(null);
    await loadAmenities();
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisibleButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisibleButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxVisibleButtons - 1);

    if (endPage - startPage < maxVisibleButtons - 1) {
      startPage = Math.max(1, endPage - maxVisibleButtons + 1);
    }

    // First page
    if (startPage > 1) {
      buttons.push(
        <button
          key="first"
          onClick={() => handlePageChange(1)}
          className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100"
        >
          1
        </button>
      );
      if (startPage > 2) {
        buttons.push(<span key="dots1" className="px-2">...</span>);
      }
    }

    // Page buttons
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 border rounded ${
            currentPage === i
              ? 'bg-orange-500 text-white border-orange-500'
              : 'border-gray-300 hover:bg-gray-100'
          }`}
        >
          {i}
        </button>
      );
    }

    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(<span key="dots2" className="px-2">...</span>);
      }
      buttons.push(
        <button
          key="last"
          onClick={() => handlePageChange(totalPages)}
          className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100"
        >
          {totalPages}
        </button>
      );
    }

    return buttons;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <span className="text-4xl">🏨</span>
              Quản lý tiện nghi
            </h1>
            <p className="text-gray-600 mt-1">
              Quản lý danh sách tiện nghi khách sạn ({filteredAmenities.length} tiện nghi)
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors shadow-md"
          >
            <Plus size={20} />
            Thêm tiện nghi
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm tiện nghi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <button
            onClick={loadAmenities}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <span className="text-red-700">{error}</span>
          <button
            onClick={clearLocalError}
            className="text-red-700 hover:text-red-900"
          >
            ✕
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-orange-500" size={40} />
            <span className="ml-3 text-gray-600">Đang tải dữ liệu...</span>
          </div>
        ) : currentItems.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-500 text-lg">
              {searchTerm ? 'Không tìm thấy tiện nghi nào' : 'Chưa có tiện nghi nào'}
            </p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Icon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tên tiện nghi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mô tả
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentItems.map((amenity) => (
                  <tr key={amenity.amenityId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {amenity.iconUrl ? (
                        <img
                          src={amenity.iconUrl}
                          alt={amenity.name}
                          className="w-10 h-10 object-contain"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/40?text=Icon';
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                          ?
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{amenity.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 line-clamp-2">{amenity.description || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <ActionButtonsGroup
                        onView={() => handleView(amenity)}
                        onEdit={() => handleEdit(amenity)}
                        onDelete={() => handleDeleteClick(amenity)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Hiển thị:</span>
                  <select
                    value={itemsPerPage}
                    onChange={handleItemsPerPageChange}
                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value={5}>5 mục</option>
                    <option value={10}>10 mục</option>
                    <option value={25}>25 mục</option>
                    <option value={50}>50 mục</option>
                    <option value={100}>100 mục</option>
                  </select>
                  <span className="text-sm text-gray-600 ml-4">
                    Trang {currentPage} / {totalPages} ({filteredAmenities.length} tiện nghi)
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ««
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ‹
                  </button>
                  
                  {renderPaginationButtons()}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ›
                  </button>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    »»
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Xác nhận xóa</h3>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa tiện nghi <strong>"{deleteConfirm.name}"</strong>?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm({ show: false, amenityId: null, name: '' })}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <AmenityCreateModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {showEditModal && selectedAmenity && (
        <AmenityEditModal
          amenity={selectedAmenity}
          onClose={() => {
            setShowEditModal(false);
            setSelectedAmenity(null);
          }}
          onSuccess={handleEditSuccess}
        />
      )}

      {showViewModal && selectedAmenity && (
        <AmenityViewModal
          amenity={selectedAmenity}
          onClose={() => {
            setShowViewModal(false);
            setSelectedAmenity(null);
          }}
          onEdit={() => {
            setShowViewModal(false);
            setShowEditModal(true);
          }}
        />
      )}
    </div>
  );
};

export default AmenityManagementPage;
