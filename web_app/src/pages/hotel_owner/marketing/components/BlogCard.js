import React from 'react';
import { Calendar, Edit, Eye, MessageCircle, Trash2 } from 'lucide-react';
import { getStatusColor, getStatusIcon, getStatusText, sanitizeTitle } from './utils';
import { USER_ROLES } from '../../../../config/roles';

const BlogCard = ({ blog, onView, onEdit, onDelete, onShowComments, user }) => {
  const isAuthor = (blog.userId && user?.userId && blog.userId === user.userId) ||
                   (blog.authorId && user?.userId && blog.authorId === user.userId) || 
                   (blog.author_id && user?.userId && blog.author_id === user.userId) || 
                   (blog.userId && user?.id && blog.userId === user.id) ||
                   (blog.authorId && user?.id && blog.authorId === user.id);
  
  const canEdit = user?.roleId === USER_ROLES.HOTEL_OWNER || 
                  (user?.roleId === USER_ROLES.HOTEL_STAFF && isAuthor);
  
  const canDelete = user?.roleId === USER_ROLES.HOTEL_OWNER || 
                    (user?.roleId === USER_ROLES.HOTEL_STAFF && isAuthor);

  return (

    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100 overflow-hidden flex flex-col h-full group">
      {/* Image */}
      <div className="relative h-48 overflow-hidden cursor-pointer">
        <img
          src={blog.featuredImageUrl || blog.featured_image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'}
          alt={blog.title}
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';
          }}
        />
        <div className="absolute top-3 right-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium shadow-sm ${getStatusColor(blog.status)} bg-opacity-90 backdrop-blur-sm`}>
            {getStatusIcon(blog.status)}
            <span className="ml-1">{getStatusText(blog.status)}</span>
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex-1">
          <div className="flex items-center text-xs text-gray-500 mb-2 space-x-2">
            <span className="flex items-center bg-gray-50 px-2 py-1 rounded-md">
              <Calendar className="h-3 w-3 mr-1" />
              {(() => {
                const dateStr = blog.createdAt || blog.created_at;
                if (!dateStr) return 'N/A';
                const date = new Date(dateStr);
                return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('vi-VN');
              })()}
            </span>
            <span className="flex items-center bg-gray-50 px-2 py-1 rounded-md">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></span>
              {blog.username || blog.author || 'Unknown'}
            </span>
          </div>
          
          <h3 
            className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 cursor-pointer transition-colors"
            title={blog.title}
            onClick={() => onView(blog)}
          >
            {sanitizeTitle(blog.title, 80)}
          </h3>
          
          <p className="text-sm text-gray-600 line-clamp-3 mb-4">
            {blog.excerpt || blog.content?.substring(0, 150) || 'Không có mô tả...'}
          </p>
        </div>

        {/* Footer Stats & Actions */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-3 text-gray-500 text-xs font-medium">
            <span className="flex items-center" title="Lượt xem">
              <Eye className="h-4 w-4 mr-1" />
              {blog.viewCount || blog.view_count || 0}
            </span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onShowComments(blog);
              }}
              className="flex items-center hover:text-blue-600 transition-colors"
              title="Bình luận"
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              {blog.commentCount || blog.comment_count || 0}
            </button>
          </div>

          <div className="flex items-center space-x-1">
            {canEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(blog);
                }}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Chỉnh sửa"
              >
                <Edit className="h-4 w-4" />
              </button>
            )}
            {canDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(blog);
                }}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Từ chối bài viết"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogCard;
