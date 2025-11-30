import React, { useState, useEffect } from 'react';
import { Filter, Plus, Search, Loader } from 'lucide-react';
import BlogCard from './BlogCard';
import Pagination from './Pagination';

const PostList = ({ 
  posts, 
  loading, 
  searchTerm, 
  setSearchTerm, 
  sortBy, 
  setSortBy, 
  statusFilter, 
  setStatusFilter, 
  onView, 
  onEdit, 
  onDelete, 
  onShowComments,
  onSubmit,
  onCreate,
  user,
  paginationProps,
  statusCounts
}) => {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  const handleSearch = () => {
    setSearchTerm(localSearchTerm);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
      {/* Toolbar */}
      <div className="p-5 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Tìm kiếm bài viết..."
              value={localSearchTerm}
              onChange={(e) => setLocalSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-all"
          >
            Tìm
          </button>
        </div>

        {/* Filters & Actions */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg p-1 shadow-sm">
            <Filter className="h-4 w-4 text-gray-500 ml-2" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border-none text-sm text-gray-700 focus:ring-0 bg-transparent py-1.5 pl-2 pr-8 cursor-pointer"
            >
              <option value="all">Tất cả trạng thái {statusCounts ? `(${statusCounts.all})` : ''}</option>
              <option value="published">Đã xuất bản {statusCounts ? `(${statusCounts.published})` : ''}</option>
              <option value="pending">Chờ duyệt {statusCounts ? `(${statusCounts.pending})` : ''}</option>
              <option value="draft">Bản nháp {statusCounts ? `(${statusCounts.draft})` : ''}</option>
              <option value="rejected">Bị từ chối {statusCounts ? `(${statusCounts.rejected})` : ''}</option>
              <option value="archived">Lưu trữ {statusCounts ? `(${statusCounts.archived})` : ''}</option>
            </select>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 shadow-sm cursor-pointer"
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
          </select>

          <button
            onClick={onCreate}
            className="flex items-center px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-all hover:shadow-md"
          >
            <Plus className="h-5 w-5 mr-1.5" />
            Viết bài mới
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader className="h-10 w-10 animate-spin text-blue-600 mb-3" />
            <p className="text-gray-500 font-medium">Đang tải danh sách bài viết...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="bg-white p-4 rounded-full shadow-sm mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Không tìm thấy bài viết nào</h3>
            <p className="text-gray-500 max-w-sm">
              Thử thay đổi bộ lọc tìm kiếm hoặc tạo bài viết mới để bắt đầu.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((blog) => (
                <BlogCard
                  key={blog.blogId || blog.id}
                  blog={blog}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onShowComments={onShowComments}
                  onSubmit={onSubmit}
                  user={user}
                />
              ))}
            </div>

            {/* Pagination */}
            <Pagination {...paginationProps} />
          </>
        )}
      </div>
    </div>
  );
};

export default PostList;
