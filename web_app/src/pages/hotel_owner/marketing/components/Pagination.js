import React from 'react';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  postsPerPage, 
  totalPosts, 
  onPageChange, 
  onLimitChange 
}) => {
  return (
    <div className="flex justify-between items-center mt-8 bg-white p-4 rounded-lg shadow border">
      {/* Thông tin hiển thị bên trái */}
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-600">
          {(() => {
            const startItem = totalPosts > 0 ? ((currentPage - 1) * postsPerPage) + 1 : 0;
            const endItem = Math.min(currentPage * postsPerPage, totalPosts);
            return `Hiển thị ${startItem}-${endItem} trong tổng số ${totalPosts} bài viết`;
          })()}
        </span>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Hiển thị:</span>
          <select 
            value={postsPerPage}
            onChange={(e) => {
              onLimitChange(Number(e.target.value));
            }}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value={9}>9 mục</option>
            <option value={18}>18 mục</option>
            <option value={27}>27 mục</option>
          </select>
        </div>
      </div>
      
      {/* Navigation bên phải */}
      <div className="flex items-center space-x-2">
        {/* Nút về đầu */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="px-2 py-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-sm"
          title="Trang đầu"
        >
          &laquo;&laquo;
        </button>
        {/* Nút về trước */}
        <button
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-sm"
          title="Trang trước"
        >
          Trước
        </button>
        
        {/* Số trang hiện tại */}
        <button
          className="px-3 py-1 bg-blue-600 text-white border border-blue-600 rounded text-sm font-medium"
          disabled
        >
          {currentPage}
        </button>
        
        {/* Nút về sau */}
        <button
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages || 1))}
          disabled={currentPage === (totalPages || 1)}
          className="px-3 py-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-sm"
          title="Trang sau"
        >
          Tiếp
        </button>
        {/* Nút về cuối */}
        <button
          onClick={() => onPageChange(totalPages || 1)}
          disabled={currentPage === (totalPages || 1)}
          className="px-2 py-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-sm"
          title="Trang cuối"
        >
          &raquo;&raquo;
        </button>
        
        {/* Input nhảy trang */}
        <div className="flex items-center space-x-1 ml-2">
          <span className="text-sm text-gray-600">Đến trang:</span>
          <input
            type="number"
            min={1}
            max={totalPages || 1}
            defaultValue={currentPage}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                const val = Number(e.target.value);
                const maxPage = totalPages || 1;
                if (val >= 1 && val <= maxPage) {
                  onPageChange(val);
                }
              }
            }}
            className="w-12 px-1 py-1 border border-gray-300 rounded text-center text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
};

export default Pagination;
